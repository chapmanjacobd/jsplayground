// ==UserScript==
// @name         Hide Seen Links (Generic, Count-Based + Toggle UI)
// @namespace    https://github.com/chapmanjacobd/jsplayground/
// @version      1.0
// @description  Dim links more the more times they've been seen, with on-page toggle
// @author       Jacob
// @match        *://*/*
// @grant        GM_registerMenuCommand
// ==/UserScript==

(() => {
  const DEBUG = true;
  const STORAGE_KEY = "hide_seen_links_enabled_sites";
  const TOGGLE_KEY = "hide_seen_links_toggle";

  const MIN_OPACITY = 0.3;
  const MAX_OPACITY = 0.8;

  // ----------------------------------------
  // Per-site enable/disable
  // ----------------------------------------
  let enabledSites = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  function currentHost() {
    return location.hostname;
  }

  function isEnabledHere() {
    return enabledSites.includes(currentHost());
  }

  function toggleSite() {
    const host = currentHost();
    if (enabledSites.includes(host)) {
      enabledSites = enabledSites.filter(h => h !== host);
      alert(`Disabled Hide Seen Links for ${host}`);
    } else {
      enabledSites.push(host);
      alert(`Enabled Hide Seen Links for ${host}`);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enabledSites));
    location.reload();
  }

  GM_registerMenuCommand(
    (isEnabledHere() ? "Disable" : "Enable") +
      " Hide Seen Links on this site",
    toggleSite
  );

  if (!isEnabledHere()) return;

  // ----------------------------------------
  // Helpers
  // ----------------------------------------
  function safeGetCount(id) {
    const val = parseInt(localStorage.getItem(id) || "0", 10);
    if (val > 1700000000000) {
      localStorage.removeItem(id);
      if (DEBUG) console.log("[cleanup on read]", id, "=> removed timestamp");
      return 0;
    }
    return val;
  }

  // ----------------------------------------
  // Link scoring
  // ----------------------------------------
  function calcLinkScore(link) {
    const url = new URL(link.href, location.href);
    const relativePath = url.pathname + url.search;
    const searchParams = url.searchParams;
    const paramKeys = Array.from(searchParams.keys());

    let score = 0;
    if (link.innerText && link.innerText.trim().length > 10) score += 3;
    if (link.title) score += 2;
    if (relativePath.includes("download")) score += 1;

    if (["javascript:", "magnet:"].includes(url.protocol)) score -= 5;
    if (relativePath.length > 100) score -= 3;

    if (paramKeys.some(k => k.includes("id"))) score += 2;
    if (paramKeys.some(k => k.includes("category") || k.includes("cat")))
      score -= 8;

    if (relativePath.includes("comment")) score -= 5;
    if (relativePath.includes("guides")) score -= 5;

    if (relativePath.length < 5) score -= 200;

    return score;
  }

  function sortByPriority(links) {
    return Array.from(links).sort((a, b) => calcLinkScore(b) - calcLinkScore(a));
  }

  // ----------------------------------------
  // Row / identifier detection
  // ----------------------------------------
  function getRows() {
    const selectors = ["tr", "li", "a", "span"];
    let candidates = [];
    for (const sel of selectors) {
      const els = Array.from(document.querySelectorAll(sel));
      candidates = candidates.concat(
        els.filter(
          el =>
            el.querySelector("a") &&
            !isSidebarOrHeader(el) &&
            !isSidebarOrHeader(el.parentElement)
        )
      );
    }
    return candidates;
  }

  function isSidebarOrHeader(el) {
    if (!el) return false;
    if (
      el.closest("header, footer, nav, aside, .sidebar, .site-header, .site-footer")
    )
      return true;
    const id = (el.id || "").toLowerCase();
    const cls = (el.className || "").toLowerCase();
    return /(header|side|nav|foot|menu|toolbar|comment)/.test(id + " " + cls);
  }

  function getRowIdentifier(row) {
    const links = row.querySelectorAll("a[href]");
    if (!links.length) return null;
    const best = sortByPriority(links)[0];
    return best ? best.href : null;
  }

  // ----------------------------------------
  // Opacity calculation
  // ----------------------------------------
  function applyOpacity(rows) {
    if (!isToggleOn()) {
      rows.forEach(r => (r.style.opacity = ""));
      return;
    }

    let maxCount = 1;
    const rowData = rows.map(row => {
      const id = getRowIdentifier(row);
      if (!id) return { row, id, count: 0 };
      const count = safeGetCount(id);
      if (count > maxCount) maxCount = count;
      return { row, id, count };
    });

    rowData.forEach(({ row, id, count }) => {
      if (!id || count === 0) return;
      const ratio = count / maxCount;
      let opacity = MAX_OPACITY - (MAX_OPACITY - MIN_OPACITY) * ratio;
      opacity = Math.min(MAX_OPACITY, Math.max(MIN_OPACITY, opacity));
      row.style.opacity = opacity.toFixed(2);
      if (DEBUG) console.log("[dim]", id, "count", count, "opacity", opacity);
    });
  }

  // ----------------------------------------
  // Mark links as seen
  // ----------------------------------------
  function markLinks(rows) {
    rows.forEach(row => {
      const id = getRowIdentifier(row);
      if (!id) return;
      const current = safeGetCount(id);
      const next = current + 1;
      localStorage.setItem(id, next.toString());
      if (DEBUG) console.log("[markSeen]", id, "->", next);
    });
  }

  // ----------------------------------------
  // Toggle UI
  // ----------------------------------------
  function isToggleOn() {
    return localStorage.getItem(TOGGLE_KEY) !== "off";
  }

  function setToggle(on) {
    localStorage.setItem(TOGGLE_KEY, on ? "on" : "off");
    applyOpacity(getRows());
  }

  function createToggleUI() {
    const box = document.createElement("div");
    box.style.position = "fixed";
    box.style.bottom = "10px";
    box.style.right = "10px";
    box.style.background = "rgba(255,255,255,0.8)";
    box.style.padding = "5px 10px";
    box.style.border = "1px solid #ccc";
    box.style.borderRadius = "5px";
    box.style.zIndex = "99999";
    box.style.fontSize = "12px";

    const label = document.createElement("label");
    label.style.cursor = "pointer";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = isToggleOn();
    checkbox.style.marginRight = "5px";

    checkbox.addEventListener("change", () => {
      setToggle(checkbox.checked);
    });

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode("Dim seen links"));
    box.appendChild(label);
    document.body.appendChild(box);
  }

  // ----------------------------------------
  // Init
  // ----------------------------------------
  const rows = getRows();
  markLinks(rows);
  applyOpacity(rows);
  createToggleUI();
})();
