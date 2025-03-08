/**
 * Initializes the popup by loading saved settings, setting up event listeners
 * for user interactions, and rendering the current list of filter keywords.
 * This includes applying filters and updating job statistics based on user actions.
 */

document.addEventListener("DOMContentLoaded", function () {
  // Default filter keywords
  const defaultKeywords = [
    "Senior",
    "Lead",
    "Head",
    "Chief",
    "Director",
    "Manager",
    "Principal",
  ];

  // Load saved settings
  chrome.storage.local.get(
    {
      enabled: true,
      keywords: defaultKeywords,
    },
    function (items) {
      document.getElementById("enable-filter").checked = items.enabled;
      renderKeywordTags(items.keywords);
    }
  );

  // Apply filters button
  document
    .getElementById("apply-filters")
    .addEventListener("click", function () {
      saveSettings();
      applyFilters();
    });

  // Refresh page button
  document
    .getElementById("refresh-page")
    .addEventListener("click", function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.reload(tabs[0].id);
      });
    });

  // Toggle filter enable/disable
  document
    .getElementById("enable-filter")
    .addEventListener("change", function () {
      saveSettings();
      applyFilters();
    });

  // Reset filters button
  document
    .getElementById("reset-filters")
    .addEventListener("click", function () {
      chrome.storage.local.set({ keywords: defaultKeywords }, function () {
        renderKeywordTags(defaultKeywords);
        applyFilters();
      });
    });

  // Keyword input
  const keywordInput = document.getElementById("filter-keywords");
  keywordInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && this.value.trim()) {
      addKeyword(this.value.trim());
      this.value = "";
    }
  });

  // Get current stats
  updateStats();

  function addKeyword(keyword) {
    const lowerKeyword = keyword.trim().toLowerCase(); // so users dont have to properly Case their keywords
    chrome.storage.local.get({ keywords: defaultKeywords }, function (items) {
      if (!items.keywords.includes(lowerKeyword)) {
        const newKeywords = [...items.keywords, lowerKeyword];
        chrome.storage.local.set({ keywords: newKeywords }, function () {
          renderKeywordTags(newKeywords);
        });
      }
    });
  }

  function removeKeyword(keyword) {
    chrome.storage.local.get({ keywords: defaultKeywords }, function (items) {
      const newKeywords = items.keywords.filter((k) => k !== keyword);
      chrome.storage.local.set({ keywords: newKeywords }, function () {
        renderKeywordTags(newKeywords);
      });
    });
  }

  function renderKeywordTags(keywords) {
    const container = document.getElementById("keyword-tags");
    container.innerHTML = "";

    keywords.forEach((keyword) => {
      const tag = document.createElement("div");
      tag.className = "tag";
      tag.innerHTML = keyword + '<span class="remove">x</span>';

      tag.querySelector(".remove").addEventListener("click", function () {
        removeKeyword(keyword);
      });

      container.appendChild(tag);
    });
  }

  function saveSettings() {
    const enabled = document.getElementById("enable-filter").checked;

    chrome.storage.local.get({ keywords: defaultKeywords }, function (items) {
      chrome.storage.local.set({
        enabled: enabled,
        keywords: items.keywords,
      });
    });
  }

  function applyFilters() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "applyFilters" },
        function (response) {
          if (response && response.success) {
            updateStats();
          }
        }
      );
    });
  }

  function updateStats() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "getStats" },
        function (response) {
          if (response) {
            document.getElementById(
              "total-count"
            ).textContent = `Total jobs: ${response.total}`;
            document.getElementById(
              "filtered-count"
            ).textContent = `Filtered jobs: ${response.filtered}`;
            document.getElementById(
              "visible-count"
            ).textContent = `Visible jobs: ${response.visible}`;
          }
        }
      );
    });
  }

  function resetFilters() {
    chrome.storage.local.set({ keywords: defaultKeywords }, function () {
      renderKeywordTags(defaultKeywords);
    });
  }
});
