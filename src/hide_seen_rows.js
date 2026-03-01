// ==UserScript==
// @name         Table Click Filter
// @namespace    http://tampermonkey.net/
// @version      0.7
// @description  Exclude rows via click. Persists filters per hostname & handles dynamic content.
// @author       You
// @match        *://*/*
// @grant        GM_registerMenuCommand
// ==/UserScript==

(() => {
    'use strict';

    const SITE_KEY = "table_click_filter_enabled_sites";
    const FILTER_KEY = "table_click_filters";
    const host = location.hostname;

    let enabledSites = JSON.parse(localStorage.getItem(SITE_KEY) || "[]");
    let siteFilters = JSON.parse(localStorage.getItem(FILTER_KEY) || "{}");
    let currentFilters = siteFilters[host] || [];

    const isEnabledHere = () => enabledSites.includes(host);

    function saveState() {
        localStorage.setItem(SITE_KEY, JSON.stringify(enabledSites));
        siteFilters[host] = currentFilters;
        localStorage.setItem(FILTER_KEY, JSON.stringify(siteFilters));
    }

    function resetFilters() {
        currentFilters = [];
        saveState();
        document.querySelectorAll('tr').forEach(row => row.style.display = '');
    }

    function toggleSite() {
        if (isEnabledHere()) {
            enabledSites = enabledSites.filter(h => h !== host);
        } else {
            enabledSites.push(host);
        }
        saveState();
        location.reload();
    }

    function applyFiltersToRow(row) {
        if (row.tagName !== 'TR' || row.querySelector('th')) return;
        
        const rowText = row.innerText.toLowerCase();
        const shouldHide = currentFilters.some(f => rowText.includes(f.toLowerCase()));
        
        row.style.display = shouldHide ? 'none' : '';
    }

    function scanAll() {
        document.querySelectorAll('tr').forEach(applyFiltersToRow);
    }

    GM_registerMenuCommand((isEnabledHere() ? "Disable" : "Enable") + " Table Filter", toggleSite);

    if (!isEnabledHere()) return;

    GM_registerMenuCommand("Reset Table Filters", resetFilters);

    const observer = new MutationObserver(mutations => {
        requestAnimationFrame(() => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType !== Node.ELEMENT_NODE) return;
                    if (node.tagName === 'TR') {
                        applyFiltersToRow(node);
                    } else {
                        node.querySelectorAll('tr').forEach(applyFiltersToRow);
                    }
                });
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    scanAll();

    document.addEventListener('click', (event) => {
        const target = event.target;
        if (target.tagName !== 'TD') return;

        const cellText = target.innerText.trim();
        if (!cellText) return;

        const userInput = prompt("Exclude rows containing:", cellText);
        if (userInput === null) return;

        const filterValue = userInput === "" ? cellText : userInput;
        
        if (!currentFilters.includes(filterValue)) {
            currentFilters.push(filterValue);
            saveState();
            scanAll();
        }
    });
})();
