const STORAGE_KEY = "blockedBases";

const listEl = document.getElementById("base-list");
const formEl = document.getElementById("add-form");
const inputEl = document.getElementById("new-base");
const statsEl = document.getElementById("stats");

function normalizePattern(raw) {
  let p = raw.trim().toLowerCase();
  if (!p) return null;
  p = p.replace(/^[a-z]+:\/\//, "");
  p = p.split("/")[0];
  return p || null;
}

async function getBases() {
  const data = await chrome.storage.sync.get(STORAGE_KEY);
  return Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
}

async function setBases(bases) {
  await chrome.storage.sync.set({ [STORAGE_KEY]: bases });
}

function render(bases) {
  listEl.innerHTML = "";
  if (bases.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No sites configured yet.";
    empty.style.color = "#9ca3af";
    listEl.appendChild(empty);
    return;
  }
  for (const base of bases) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = base;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", async () => {
      const current = await getBases();
      await setBases(current.filter((b) => b !== base));
      render(await getBases());
    });
    li.appendChild(span);
    li.appendChild(removeBtn);
    listEl.appendChild(li);
  }
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const pattern = normalizePattern(inputEl.value);
  if (!pattern) return;
  const current = await getBases();
  if (!current.includes(pattern)) {
    current.push(pattern);
    await setBases(current);
  }
  inputEl.value = "";
  render(await getBases());
});

async function renderStats() {
  chrome.runtime.sendMessage({ type: "GET_STATS" }, (resp) => {
    if (resp) {
      statsEl.textContent = `${resp.deletedCount} history entr${resp.deletedCount === 1 ? "y" : "ies"} scrubbed this session.`;
    }
  });
}

(async () => {
  render(await getBases());
  renderStats();
})();
