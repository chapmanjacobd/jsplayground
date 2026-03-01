// ==UserScript==
// @name         Table Click Filter
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Click a table cell, hide the row if it matches the input. Opt-in per site.
// @author       You
// @match        *://*/*
// @grant        GM_registerMenuCommand
// ==/UserScript==

(() => {
    'use strict';

    const STORAGE_KEY = "table_click_filter_enabled_sites";
    const currentHost = location.hostname;
    let enabledSites = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    const isEnabledHere = () => enabledSites.includes(currentHost);

    function toggleSite() {
        if (isEnabledHere()) {
            enabledSites = enabledSites.filter(h => h !== currentHost);
        } else {
            enabledSites.push(currentHost);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(enabledSites));
        location.reload();
    }

    function resetFilters() {
        document.querySelectorAll('tr').forEach(row => row.style.display = '');
    }

    GM_registerMenuCommand(
        (isEnabledHere() ? "Disable" : "Enable") + " Table Filter on this site",
        toggleSite
    );

    if (!isEnabledHere()) return;

    GM_registerMenuCommand("Reset Table Filters", resetFilters);

    function filterColumn(args) {
        const { table, columnIndex, filterText } = args;
        if (!table || !table.rows) return;

        for (let i = 1; i < table.rows.length; i++) {
            const row = table.rows[i];
            if (row.cells.length > columnIndex) {
                const cellText = row.cells[columnIndex].innerText;
                
                if (cellText.includes(filterText)) {
                    row.style.display = 'none';
                }
            }
        }
    }

    function handleCellClick(event) {
        const target = event.target;
        if (target.tagName !== 'TD') return;

        const table = target.closest('table');
        if (!table) return;

        const cellText = target.innerText;
        const userInput = prompt("Exclude rows containing:", cellText);

        if (userInput === null) return;

        const filterValue = userInput.trim() === "" ? cellText : userInput.trim();

        filterColumn({
            table: table,
            columnIndex: target.cellIndex,
            filterText: filterValue
        });
    }

    document.addEventListener('click', handleCellClick);
})();
