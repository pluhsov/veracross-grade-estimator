const ALLOWED_HOSTS = ["veracross.com", "myveracross.com"];

const $ = (id) => document.getElementById(id);

function isVeracrossUrl(url) {
  if (!url) return false; // chrome hides url of sites we have no access to
  try {
    const host = new URL(url).hostname;
    return ALLOWED_HOSTS.some((h) => host === h || host.endsWith("." + h));
  } catch (e) {
    return false;
  }
}

function formatNumber(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function showMessage(title, body) {
  $("result").hidden = true;
  $("message").hidden = false;
  $("message-title").textContent = title;
  $("message-body").textContent = body;
}

function showResult(r) {
  $("message").hidden = true;
  $("result").hidden = false;
  $("grade").textContent = `${r.percent.toFixed(1)}%`;

  const n = r.count;
  const noun = n === 1 ? "scored assignment" : "scored assignments";
  $("caption").textContent =
    r.earned != null
      ? `${formatNumber(r.earned)} of ${formatNumber(r.possible)} points from ${n} ${noun}`
      : `Average of ${n} ${noun}`;

  const clamped = Math.max(50, Math.min(100, r.percent));
  $("fill").style.width = `${((clamped - 50) / 50) * 100}%`;
}

function render(r) {
  if (r.percent != null) return showResult(r);
  if (r.method === "no-scores") {
    showMessage("Nothing graded yet", "This class has assignments, but none of them have scores yet.");
  } else {
    showMessage(
      "No assignments on this page",
      "Open a class from Classes & Reports and choose View All Assignments."
    );
  }
}

function ask(tabId) {
  return new Promise((resolve) => {
    // frameId 0 targets the top frame, aggregation of every frames results.
    chrome.tabs.sendMessage(tabId, { type: "vge-get" }, { frameId: 0 }, (response) => {
      if (chrome.runtime.lastError || !response) resolve(null);
      else resolve(response.result);
    });
  });
}

async function load() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !isVeracrossUrl(tab.url)) {
    showMessage("Open Veracross", "Go to a class's assignments page in Veracross, then open this again.");
    return;
  }

  let result = await ask(tab.id);
  if (result === null) {
    showMessage(
      "Reload the page",
      "This tab was open before the extension was installed or updated. Reload it and try again."
    );
    return;
  }

  // class content loads in an embedded frame that may report a moment
  // after the page itself, so added one more chance before giving up.
  if (result.percent == null) {
    await new Promise((r) => setTimeout(r, 700));
    result = (await ask(tab.id)) || result;
  }

  render(result);
}

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get({ showPanel: false }, (s) => {
    $("showPanel").checked = !!s.showPanel;
  });
  $("showPanel").addEventListener("change", (e) => {
    chrome.storage.local.set({ showPanel: e.target.checked });
  });
  $("refresh").addEventListener("click", load);
  load();
});
