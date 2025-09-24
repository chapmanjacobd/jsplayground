// ==UserScript==
// @name         Hide Seen Links
// @namespace    https://github.com/chapmanjacobd/jsplayground/
// @version      0.4.43
// @description  Remember and hide unique URLs
// @author       Jacob Chapman
// @match        *://*/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/chapmanjacobd/jsplayground/refs/heads/main/dist/hide_seen_links.js
// @updateURL    https://raw.githubusercontent.com/chapmanjacobd/jsplayground/refs/heads/main/dist/hide_seen_links.js
// ==/UserScript==

(() => {
  // src/hide_seen_links.js
  function calcLinkScore(link) {
    const relativePath = link.pathname + link.search;
    const searchParams = new URLSearchParams(link.search);
    const paramKeys = Array.from(searchParams.keys());
    let score = 0;
    if (link.innerText && link.innerText.length > 10) {
      score += 3;
    }
    if (link.title) {
      score += 2;
    }
    if (relativePath.includes("download")) {
      score += 1;
    }
    if (link.protocol in ["javascript:", "magnet:"]) {
      score -= 2;
    }
    if (relativePath.length > 100) {
      score -= 3;
    }
    if (paramKeys.length && hasAnySubstringInParamKeys(paramKeys, ["id"])) {
      score += 2;
    }
    if (paramKeys.length && hasAnySubstringInParamKeys(paramKeys, ["category", "cat"])) {
      score -= 8;
    }
    if (relativePath.includes("comment")) {
      score -= 5;
    }
    if (relativePath.includes("guides")) {
      score -= 5;
    }
    if (relativePath.length < 5) {
      score -= 200;
    }
    return score;
  }
  function sortByPriority(links) {
    if ("sort" in links)
      return links.sort((a, b) => calcLinkScore(b) - calcLinkScore(a));
    else
      return links.values().toArray().sort((a, b) => calcLinkScore(b) - calcLinkScore(a));
  }
  function hasAnySubstringInParamKeys(paramKeys, substrings) {
    for (const key of paramKeys) {
      for (const substring of substrings) {
        if (key.includes(substring)) {
          return true;
        }
      }
    }
    return false;
  }
  (function() {
    "use strict";
    let sliderHtml = `
        <div id="hide_seen_links" style="
            position: fixed;
            bottom: 18px;
            left: 0;
            background: rgba(255, 255, 255, 0.8);
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            ">
            <details><summary>L</summary>
            <input type="range" id="timeThresholdSlider" min="0" max="300" value="0">
                <span id="timeThresholdDisplay" style="width: 200px;"></span>
            </details>
        </div>
    `;
    let container = document.createElement("div");
    container.innerHTML = sliderHtml;
    document.body.appendChild(container);
    document.getElementById("timeThresholdSlider").addEventListener("input", function() {
      let thresholdHours = getTimeThreshold();
      let displayText = "";
      if (thresholdHours === void 0) {
        displayText = "disabled";
      } else {
        let days = Math.floor(thresholdHours / 24);
        let hours = Math.floor(thresholdHours % 24);
        if (days > 0) {
          displayText += days + " day" + (days > 1 ? "s" : "");
        }
        if (hours > 0 || days === 0) {
          displayText += " " + hours + " hour" + (hours > 1 ? "s" : "");
        }
      }
      document.getElementById("timeThresholdDisplay").textContent = displayText;
      hideLinks();
    });
    function getTimeThreshold() {
      let slider = document.getElementById("timeThresholdSlider");
      if (slider.value === slider.max) return;
      let value = parseFloat(slider.value);
      return value;
    }
    function hideLinks() {
      let links = getLinks();
      let thresholdHours = getTimeThreshold();
      links.forEach((row) => {
        let identifier = getRowIdentifier(row);
        if (identifier) {
          row.style.display = "";
          let storedValue = localStorage.getItem(identifier);
          if (storedValue) {
            let timestamp = parseInt(storedValue, 10);
            if (!isNaN(timestamp)) {
              let timeDifference = Date.now() - timestamp + 1e3 * 60 * 5;
              let hoursDifference = timeDifference / (1e3 * 60 * 60);
              if (hoursDifference > thresholdHours) {
                row.style.display = "none";
              }
            }
          }
        }
      });
    }
    function getRowIdentifier(row) {
      let links = row.querySelectorAll("a");
      if (links.length === 0) {
        return null;
      }
      return sortByPriority(links)[0];
    }
    function findDivWithMostLinks() {
      let divs = document.querySelectorAll("div");
      let minLinks = 5;
      let maxLinks = 0;
      let divWithMostLinks = null;
      divs.forEach((div) => {
        let links = div.querySelectorAll("a");
        let directLinks = Array.from(links).filter((row) => row.parentElement === div || row.parentElement.parentElement === div);
        if (directLinks.length > maxLinks && directLinks.length > minLinks) {
          maxLinks = directLinks.length;
          divWithMostLinks = div;
        }
      });
      if (maxLinks == 0) {
        document.getElementById("hide_seen_links").style.display = "none";
      } else {
        document.getElementById("hide_seen_links").style.display = "block";
      }
      return divWithMostLinks;
    }
    function getLinks() {
      let divWithMostLinks = findDivWithMostLinks();
      if (divWithMostLinks) {
        return divWithMostLinks.querySelectorAll("a");
      }
      return [];
    }
    function markLinksAsSeen() {
      let links = getLinks();
      links.forEach((row) => {
        let identifier = getRowIdentifier(row);
        if (identifier) {
          console.log(identifier);
          let storedValue = localStorage.getItem(identifier);
          if (!storedValue || isNaN(parseInt(storedValue, 10))) {
            localStorage.setItem(identifier, Date.now().toString());
          }
        }
      });
    }
    hideLinks();
    markLinksAsSeen();
  })();
})();
