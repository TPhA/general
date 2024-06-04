// ==UserScript==
// @name         Extract and Filter Links
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Extracts and filters links with specified domains and copies them to clipboard as a string
// @author       You
// @match        http://www.channelmyanmar.to/*
// @match        https://www.channelmyanmar.to/*
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    let linksList = {}; // Object to store all links by category
    let filteredLinks = []; // Array to store filtered links without duplicates

    let container; // Variable to store the container div for easy access
    let isDragging = false;
    let offsetX, offsetY;

    // Function to extract links
    function extractLinks() {
        const yoteshinLinks = document.querySelectorAll('a[href*="yoteshinportal.cc"]');
        const megaupLinks = document.querySelectorAll('a[href*="://megaup.net/"]');

        linksList = {
            'yoteshin': Array.from(yoteshinLinks).map(link => link.href),
            'megaup': Array.from(megaupLinks).map(link => link.href)
        };
    }

    // Function to copy text to clipboard
    function copyToClipboard(text) {
        GM_setClipboard(text);
        console.log("Copied to clipboard:\n", text);
    }

    // Function to update the filtered links list and display in the interface
    function updateFilteredLinks(keyword, selectedCategories, include720p, include1080p) {
        filteredLinks = [];

        selectedCategories.forEach(category => {
            const filteredCategoryLinks = linksList[category]
                .filter(link => {
                    // Flexible matching: allow searching with symbols but without requiring them
                    const simplifiedKeyword = keyword.replace(/[^\w\s]/gi, ''); // Remove special characters
                    const linkWithoutSpecialChars = link.replace(/[^\w\s]/gi, ''); // Remove special characters
                    return linkWithoutSpecialChars.toLowerCase().includes(simplifiedKeyword.toLowerCase());
                })
                .filter(link => {
                    if (include720p && include1080p) {
                        return link.toLowerCase().includes("720p") || link.toLowerCase().includes("720-p") || link.toLowerCase().includes("720.p") || link.toLowerCase().includes("720_p") || link.toLowerCase().includes("720 p") ||
                               link.toLowerCase().includes("1080p") || link.toLowerCase().includes("1080-p") || link.toLowerCase().includes("1080.p") || link.toLowerCase().includes("1080_p") || link.toLowerCase().includes("1080 p");
                    } else if (include720p) {
                        return link.toLowerCase().includes("720p") || link.toLowerCase().includes("720-p") || link.toLowerCase().includes("720.p") || link.toLowerCase().includes("720_p") || link.toLowerCase().includes("720 p");
                    } else if (include1080p) {
                        return link.toLowerCase().includes("1080p") || link.toLowerCase().includes("1080-p") || link.toLowerCase().includes("1080.p") || link.toLowerCase().includes("1080_p") || link.toLowerCase().includes("1080 p");
                    }
                    return true;
                })
                .filter((link, index, self) => self.indexOf(link) === index) // Remove duplicates
                .sort(); // Sort alphabetically
            filteredLinks = [...filteredLinks, ...filteredCategoryLinks];
        });

        // Clear previous results
        const ul = document.getElementById('filteredLinks');
        ul.innerHTML = '';

        // Update with new results
        if (filteredLinks.length > 0) {
            filteredLinks.forEach(link => {
                const li = document.createElement('li');
                li.textContent = link;
                ul.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No links found.';
            ul.appendChild(li);
        }
    }


    // Function to create the interface
    function createInterface() {
        // Create a container div
        container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.left = '20px';
        container.style.width = 'auto'; // Width auto to adjust based on content
        container.style.maxHeight = '400px';
        container.style.overflowY = 'auto'; // Enable scrolling
        container.style.padding = '10px';
        container.style.background = '#fff';
        container.style.border = '1px solid #ccc';
        container.style.zIndex = '1000';
        container.style.cursor = 'move'; // Cursor style for drag

        // Create category checkboxes panel
        const categoryPanel = document.createElement('div');
        categoryPanel.style.marginBottom = '10px';

        // Create YoteshinPortal checkbox
        const yoteshinCheckbox = document.createElement('input');
        yoteshinCheckbox.type = 'checkbox';
        yoteshinCheckbox.id = 'yoteshinCheckbox';
        const yoteshinLabel = document.createElement('label');
        yoteshinLabel.textContent = 'YoteshinPortal';
        yoteshinLabel.htmlFor = 'yoteshinCheckbox';
        yoteshinLabel.style.marginRight = '10px';
        categoryPanel.appendChild(yoteshinCheckbox);
        categoryPanel.appendChild(yoteshinLabel);

        // Create MegaUp checkbox
        const megaupCheckbox = document.createElement('input');
        megaupCheckbox.type = 'checkbox';
        megaupCheckbox.id = 'megaupCheckbox';
        const megaupLabel = document.createElement('label');
        megaupLabel.textContent = 'MegaUp';
        megaupLabel.htmlFor = 'megaupCheckbox';
        megaupLabel.style.marginRight = '10px';
        categoryPanel.appendChild(megaupCheckbox);
        categoryPanel.appendChild(megaupLabel);

        // Create 720p checkbox
        const p720Checkbox = document.createElement('input');
        p720Checkbox.type = 'checkbox';
        p720Checkbox.id = 'p720Checkbox';
        const p720Label = document.createElement('label');
        p720Label.textContent = '720p';
        p720Label.htmlFor = 'p720Checkbox';
        p720Label.style.marginRight = '10px';
        categoryPanel.appendChild(p720Checkbox);
        categoryPanel.appendChild(p720Label);

        // Create 1080p checkbox
        const p1080Checkbox = document.createElement('input');
        p1080Checkbox.type = 'checkbox';
        p1080Checkbox.id = 'p1080Checkbox';
        const p1080Label = document.createElement('label');
        p1080Label.textContent = '1080p';
        p1080Label.htmlFor = 'p1080Checkbox';
        p1080Label.style.marginRight = '10px';
        categoryPanel.appendChild(p1080Checkbox);
        categoryPanel.appendChild(p1080Label);

        // Append category panel to the container
        container.appendChild(categoryPanel);

        // Create a filter panel div
        const filterPanel = document.createElement('div');
        filterPanel.style.marginBottom = '10px';

        // Create a label and input for filtering
        const filterLabel = document.createElement('label');
        filterLabel.textContent = 'Filter by keyword: ';
        const filterInput = document.createElement('input');
        filterInput.type = 'text';
        filterInput.style.marginRight = '10px';

        // Append elements to the filter panel
        filterPanel.appendChild(filterLabel);
        filterPanel.appendChild(filterInput);

        // Create a copy button
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy Filtered Links';
        copyButton.style.marginBottom = '10px';

        // Append elements to the container
        container.appendChild(filterPanel);
        container.appendChild(document.createElement('br'));
        container.appendChild(copyButton);

        // Create a list for filtered links
        const filteredList = document.createElement('ul');
        filteredList.id = 'filteredLinks';
        filteredList.style.maxHeight = '300px'; // Limit height with scrolling
        filteredList.style.overflowY = 'auto'; // Enable scrolling

        // Append filtered list to container
        container.appendChild(filteredList);

        // Create a close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.position = 'absolute';
        closeButton.style.bottom = '10px'; // Adjust bottom position
        closeButton.style.right = '10px'; // Adjust right position
        closeButton.style.marginLeft = '10px';
        closeButton.style.marginTop = '10px'; // Adjust top margin for space

        // Append close button to container
        container.appendChild(closeButton);

        // Append container to body
        document.body.appendChild(container);

        // Event listener for YoteshinPortal checkbox change
        yoteshinCheckbox.addEventListener('change', function() {
            const selectedCategories = getSelectedCategories();
            updateFilteredLinks(filterInput.value.trim(), selectedCategories, p720Checkbox.checked);
        });

        // Event listener for MegaUp checkbox change
        megaupCheckbox.addEventListener('change', function() {
            const selectedCategories = getSelectedCategories();
            updateFilteredLinks(filterInput.value.trim(), selectedCategories, p720Checkbox.checked);
        });

        // Event listener for 720p checkbox change
        p720Checkbox.addEventListener('change', function() {
            const selectedCategories = getSelectedCategories();
            updateFilteredLinks(filterInput.value.trim(), selectedCategories, p720Checkbox.checked);
        });

        // Event listener for 1080p checkbox change
        p1080Checkbox.addEventListener('change', function() {
            const selectedCategories = getSelectedCategories();
            updateFilteredLinks(filterInput.value.trim(), selectedCategories, p720Checkbox.checked, p1080Checkbox.checked);
        });

        // Event listener for filter input keyup
        filterInput.addEventListener('keyup', function() {
            const keyword = filterInput.value.trim();
            const selectedCategories = getSelectedCategories();
            updateFilteredLinks(keyword, selectedCategories, p720Checkbox.checked);
        });

        // Event listener for copy button click
        copyButton.addEventListener('click', function() {
            const linksToCopy = filteredLinks;
            let linksString = linksToCopy.join("\n");

            if (linksString.length > 0) {
                linksString = "tmsy\n" + linksString; // Prepend "tmsy" at the beginning
            } else {
                linksString = "tmsy"; // Only "tmsy" if no links
            }

            copyToClipboard(linksString);
        });

        // Event listener for close button click
        closeButton.addEventListener('click', function() {
            container.style.display = 'none';
        });

        // Event listeners for drag and drop
        container.addEventListener('mousedown', startDrag);
        container.addEventListener('mouseup', endDrag);
        container.addEventListener('mousemove', drag);

        function startDrag(e) {
            isDragging = true;
            offsetX = e.clientX - container.offsetLeft;
            offsetY = e.clientY - container.offsetTop;
        }

        function endDrag() {
            isDragging = false;
        }

        function drag(e) {
            if (!isDragging) return;
            container.style.left = (e.clientX - offsetX) + 'px';
            container.style.top = (e.clientY - offsetY) + 'px';
        }
    }

    // Function to get selected categories
    function getSelectedCategories() {
        const selectedCategories = [];
        if (document.getElementById('yoteshinCheckbox').checked) {
            selectedCategories.push('yoteshin');
        }
        if (document.getElementById('megaupCheckbox').checked) {
            selectedCategories.push('megaup');
        }
        return selectedCategories;
    }

    // Run the function after the page has loaded
    window.addEventListener('load', function() {
        console.log("Page fully loaded");
        extractLinks(); // Extract links from the page
        createInterface(); // Create the interface
    });

    // Run the function on scroll to freeze the filter panel and buttons
    window.addEventListener('scroll', function() {
        if (container) {
            const rect = container.getBoundingClientRect();
            if (rect.top <= 0) {
                container.style.top = '0';
                container.style.position = 'fixed';
            } else {
                container.style.top = '20px';
                container.style.position = 'fixed';
            }
        }
    });

})();
