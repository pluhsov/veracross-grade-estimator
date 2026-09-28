// Veracross Grade Estimator

const DEFAULTS = { showPanel: false };
const MESSAGE_TYPE = "vge-report";
const ALLOWED_HOSTS = ["veracross.com", "myveracross.com"];

const isTop = window === window.top;

//parsing

// vcross markup for a scored assignment:
//   <span class="assignment-grade status-3" title="Complete">
//     <span class="raw-score">8</span><span class="max-score">10</span>
//   </span>
// Pending/excused rows have no raw-score/max-score and are skipped.
function parseScores(root) {
  const gradeEls = Array.from(root.querySelectorAll(".assignment-grade"));
  const fractions = [];
  const percents = [];

  gradeEls.forEach((el) => {
    const rawEl = el.querySelector(".raw-score");
    const maxEl = el.querySelector(".max-score");
    if (rawEl && maxEl) {
      const earned = parseFloat(rawEl.textContent);
      const possible = parseFloat(maxEl.textContent);
      if (!isNaN(earned) && !isNaN(possible) && possible > 0) {
        fractions.push({ earned, possible });
        return;
      }
    }
    const pct = (el.textContent || "").trim().match(/^(\d+(?:\.\d+)?)\s*%$/);
    if (pct) percents.push(parseFloat(pct[1]));
  });

  return { fractions, percents, sawGradeElements: gradeEls.length > 0 };
}

function estimate(root) {
  const { fractions, percents, sawGradeElements } = parseScores(root);

  if (fractions.length) {
    const earned = fractions.reduce((s, f) => s + f.earned, 0);
    const possible = fractions.reduce((s, f) => s + f.possible, 0);
    return {
      percent: (earned / possible) * 100,
      earned,
      possible,
      count: fractions.length,
      method: "points",
    };
  }
  if (percents.length) {
    return {
      percent: percents.reduce((s, p) => s + p, 0) / percents.length,
      earned: null,
      possible: null,
      count: percents.length,
      method: "percent-average",
    };
  }
  return {
    percent: null,
    earned: null,
    possible: null,
    count: 0,
    method: sawGradeElements ? "no-scores" : "no-assignments",
  };
}

// cross frame aggregation (top frame only)

let latestChildReport = null;

function isTrustedOrigin(origin) {
  try {
    const host = new URL(origin).hostname;
    return ALLOWED_HOSTS.some((h) => host === h || host.endsWith("." + h));
  } catch (e) {
    return false;
  }
}

function currentBest() {
  const local = estimate(document.body);
  if (local.percent != null) return local;
  if (latestChildReport && latestChildReport.percent != null) return latestChildReport;
  return local;
}

if (isTop) {
  window.addEventListener("message", (event) => {
    if (!event.data || event.data.type !== MESSAGE_TYPE) return;
    if (!isTrustedOrigin(event.origin)) return;
    latestChildReport = event.data.result;
    updatePanel();
  });

  // The popup asks the top frame for the current estimate.
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === "vge-get") {
      sendResponse({ result: currentBest() });
    }
  });
}

// optional on-page panel (top frame only)

let panelEnabled = false;

function formatPercent(p) {
  return `${p.toFixed(1)}%`;
}

function ensurePanel() {
  let panel = document.querySelector(".vge-panel");
  if (panel) return panel;
  panel = document.createElement("div");
  panel.className = "vge-panel";
  panel.innerHTML = `
    <span class="vge-panel-label">Estimated grade</span>
    <span class="vge-panel-value">—</span>
  `;
  document.body.appendChild(panel);
  return panel;
}

function updatePanel() {
  if (!isTop || !panelEnabled) return;
  const panel = ensurePanel();
  const r = currentBest();
  // bug fix to only write when the text actually changes, b/c writing triggers our own
  // MutationObserver, and this would basically make it loop every 250ms.
  const valueEl = panel.querySelector(".vge-panel-value");
  const text = r.percent == null ? "—" : formatPercent(r.percent);
  if (valueEl.textContent !== text) valueEl.textContent = text;
  panel.title =
    r.percent == null
      ? "No scored assignments on this page"
      : r.earned != null
        ? `${r.earned} of ${r.possible} points across ${r.count} scored assignments`
        : `Average of ${r.count} percentage scores`;
}

function setPanelEnabled(on) {
  panelEnabled = !!on;
  if (!isTop) return;
  if (panelEnabled) updatePanel();
  else document.querySelector(".vge-panel")?.remove();
}

// recalculation loop

let timer = null;
function scheduleRecalc() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (isTop) {
      updatePanel();
    } else {
      try {
        window.top.postMessage({ type: MESSAGE_TYPE, result: estimate(document.body) }, "*");
      } catch (e) {
        // ignore: nothing useful to do if the top frame is unreachable
      }
    }
  }, 250);
}

// for troubleshooting: select this extension's context in the DevTools
// console dropdown, then run __vgeDebug().
window.__vgeDebug = () => {
  const info = {
    frame: location.href,
    isTop,
    gradeElements: document.querySelectorAll(".assignment-grade").length,
    local: estimate(document.body),
    latestChildReport: isTop ? latestChildReport : undefined,
  };
  console.log("[Veracross Grade Estimator]", info);
  return info;
};

(function init() {
  chrome.storage.local.get(DEFAULTS, (s) => setPanelEnabled(s.showPanel));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && "showPanel" in changes) {
      setPanelEnabled(changes.showPanel.newValue);
    }
  });

  scheduleRecalc();
  new MutationObserver(scheduleRecalc).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
