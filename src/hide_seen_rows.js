// ==UserScript==
// @name         Hide Seen Links (Generic)
// @namespace    https://github.com/chapmanjacobd/jsplayground/
// @version      0.5.0
// @description  Remember and hide unique URLs across sites
// @author       Jacob Chapman
// @match        *://*/*
// @grant        none
// ==/UserScript==

(() => {
  // -------------------------------
  // Link scoring
  // -------------------------------
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
    if (paramKeys.some(k => k.includes("category") || k.includes("cat"))) score -= 8;

    if (relativePath.includes("comment")) score -= 5;
    if (relativePath.includes("guides")) score -= 5;

    if (relativePath.length < 5) score -= 200;

    return score;
  }

  function sortByPriority(links) {
    return Array.from(links).sort((a, b) => calcLinkScore(b) - calcLinkScore(a));
  }

  // -------------------------------
  // Row / identifier detection
  // -------------------------------
  function getRows() {
    const selectors = ["article", "li", "div", "tr"];
    let candidates = [];
    for (const sel of selectors) {
      const els = Array.from(document.querySelectorAll(sel));
      candidates = candidates.concat(els.filter(el => el.querySelector("a")));
    }
    return candidates;
  }

  function getRowIdentifier(row) {
    const links = row.querySelectorAll("a");
    if (!links.length) return null;

    const best = sortByPriority(links)[0];
    return best ? best.href : null; // always string
  }

  // -------------------------------
  // Slider UI
  // -------------------------------
  const sliderHtml = `
    <div id="hide_seen_links" style="
      position: fixed;
      bottom: 18px;
      left: 0;
      background: rgba(255, 255, 255, 0.8);
      padding: 10px;
      border-radius: 5px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      ">
      <details><summary>L</summary>
        <input type="range" id="timeThresholdSlider" min="0" max="300" value="0">
        <span id="timeThresholdDisplay" style="width:200px;"></span>
      </details>
    </div>
  `;
  const container = document.createElement("div");
  container.innerHTML = sliderHtml;
  document.body.appendChild(container);

  document.getElementById("timeThresholdSlider").addEventListener("input", () => {
    updateThresholdDisplay();
    hideLinks();
  });

  function getTimeThreshold() {
    const slider = document.getElementById("timeThresholdSlider");
    if (slider.value === slider.max) return; // disabled
    return parseFloat(slider.value);
  }

  function updateThresholdDisplay() {
    const thresholdHours = getTimeThreshold();
    let displayText = "";
    if (thresholdHours === void 0) {
      displayText = "disabled";
    } else {
      const days = Math.floor(thresholdHours / 24);
      const hours = Math.floor(thresholdHours % 24);
      if (days > 0) displayText += days + " day" + (days > 1 ? "s" : "");
      if (hours > 0 || days === 0)
        displayText += " " + hours + " hour" + (hours > 1 ? "s" : "");
    }
    document.getElementById("timeThresholdDisplay").textContent = displayText;
  }

  // -------------------------------
  // Hiding and marking
  // -------------------------------
  function hideLinks() {
    const rows = getRows();
    const thresholdHours = getTimeThreshold();

    rows.forEach((row) => {
      const identifier = getRowIdentifier(row);
      if (!identifier) return;

      row.style.display = ""; // reset

      const storedValue = localStorage.getItem(identifier);
      if (storedValue) {
        const timestamp = parseInt(storedValue, 10);
        if (!isNaN(timestamp) && thresholdHours !== undefined) {
          const hoursDifference =
            (Date.now() - timestamp + 1000 * 60 * 5) / (1000 * 60 * 60);
          if (hoursDifference > thresholdHours) {
            row.style.display = "none";
          }
        }
      }
    });
  }

  function markLinksAsSeen() {
    const rows = getRows();
    rows.forEach((row) => {
      const identifier = getRowIdentifier(row);
      if (!identifier) return;

      if (!localStorage.getItem(identifier)) {
        localStorage.setItem(identifier, Date.now().toString());
      }
    });
  }

  // -------------------------------
  // Init
  // -------------------------------
  updateThresholdDisplay();
  hideLinks();
  markLinksAsSeen();
})();
