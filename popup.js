const STORAGE_KEY = "blockedBases";

const hostEl = document.getElementById("current-host");
const toggleBtn = document.getElementById("toggle-btn");
const statEl = document.getElementById("stat");
const optionsLink = document.getElementById("open-options");

function hostnameMatches(hostname, pattern) {
  if (pattern.startsWith("*.")) {
    const base = pattern.slice(2);
    return hostname === base || hostname.endsWith("." + base);
  }
  return hostname === pattern || hostname.endsWith("." + pattern);
}

async function getBases() {
  const data = await chrome.storage.sync.get(STORAGE_KEY);
  return Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
}

async function setBases(bases) {
  await chrome.storage.sync.set({ [STORAGE_KEY]: bases });
}

let currentHostname = null;

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    hostEl.textContent = "No active tab";
    toggleBtn.disabled = true;
    return;
  }
  let url;
  try {
    url = new URL(tab.url);
  } catch {
    hostEl.textContent = "Unsupported page";
    toggleBtn.disabled = true;
    return;
  }
  if (!url.protocol.startsWith("http")) {
    hostEl.textContent = "Unsupported page";
    toggleBtn.disabled = true;
    return;
  }
  currentHostname = url.hostname.toLowerCase();
  hostEl.textContent = currentHostname;
  await refreshButton();
}

async function refreshButton() {
  const bases = await getBases();
  const blocked = bases.some((p) => hostnameMatches(currentHostname, p));
  toggleBtn.textContent = blocked ? "Stop blocking history here" : "Never save history here";
  toggleBtn.className = blocked ? "remove" : "";
}

toggleBtn.addEventListener("click", async () => {
  const bases = await getBases();
  const blocked = bases.some((p) => hostnameMatches(currentHostname, p));
  if (blocked) {
    await setBases(bases.filter((p) => !hostnameMatches(currentHostname, p)));
  } else {
    await setBases([...bases, currentHostname]);
  }
  await refreshButton();
});

optionsLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

chrome.runtime.sendMessage({ type: "GET_STATS" }, (resp) => {
  if (resp) {
    statEl.textContent = `${resp.deletedCount} entries scrubbed this session`;
  }
});

init();
