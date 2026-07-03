const STORAGE_KEY = "blockedBases";

let blockedBases = [];
let deletedCount = 0;

function hostnameMatches(hostname, pattern) {
  if (pattern.startsWith("*.")) {
    const base = pattern.slice(2);
    return hostname === base || hostname.endsWith("." + base);
  }
  return hostname === pattern || hostname.endsWith("." + pattern);
}

function isBlocked(urlString) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    return false;
  }
  const hostname = url.hostname.toLowerCase();
  return blockedBases.some((pattern) => hostnameMatches(hostname, pattern));
}

async function loadConfig() {
  const data = await chrome.storage.sync.get(STORAGE_KEY);
  blockedBases = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
}

async function scrub(urlString) {
  try {
    const visits = await chrome.history.getVisits({ url: urlString });
    if (visits.length > 0) {
      await chrome.history.deleteUrl({ url: urlString });
      deletedCount++;
      updateBadge();
    }
  } catch {
  }
}

function scrubSoon(urlString) {
  scrub(urlString);
  setTimeout(() => scrub(urlString), 1500);
}

async function sweepExistingHistory() {
  if (blockedBases.length === 0) return;
  for (const pattern of blockedBases) {
    const bare = pattern.startsWith("*.") ? pattern.slice(2) : pattern;
    const results = await chrome.history.search({
      text: bare,
      startTime: 0,
      maxResults: 1000,
    });
    for (const item of results) {
      if (item.url && isBlocked(item.url)) {
        await chrome.history.deleteUrl({ url: item.url });
        deletedCount++;
      }
    }
  }
  updateBadge();
}

function updateBadge() {
  chrome.action.setBadgeText({ text: deletedCount > 0 ? String(deletedCount) : "" });
  chrome.action.setBadgeBackgroundColor({ color: "#4F46E5" });
}

chrome.history.onVisited.addListener((historyItem) => {
  if (historyItem.url && isBlocked(historyItem.url)) {
    scrubSoon(historyItem.url);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url && isBlocked(changeInfo.url)) {
    scrubSoon(changeInfo.url);
  }
});

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.url && isBlocked(details.url)) {
    scrubSoon(details.url);
  }
});

chrome.webNavigation.onReferenceFragmentUpdated.addListener((details) => {
  if (details.url && isBlocked(details.url)) {
    scrubSoon(details.url);
  }
});

chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.url && isBlocked(details.url)) {
    scrubSoon(details.url);
  }
});

chrome.alarms.create("sweep", { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "sweep") {
    await loadConfig();
    await sweepExistingHistory();
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  await loadConfig();
  await sweepExistingHistory();
});

chrome.runtime.onStartup.addListener(async () => {
  await loadConfig();
  await sweepExistingHistory();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes[STORAGE_KEY]) {
    blockedBases = Array.isArray(changes[STORAGE_KEY].newValue) ? changes[STORAGE_KEY].newValue : [];
    sweepExistingHistory();
  }
});

loadConfig();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "GET_STATS") {
    sendResponse({ deletedCount, blockedBases });
  }
});
