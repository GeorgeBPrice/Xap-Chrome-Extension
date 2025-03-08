/**
 * This content script is injected into the Seek job search results page.
 * It runs a filter function when the page loads, which filters out job postings
 * from the job search results page that contain certain keywords in their titles.
 * The filter can be configured by the user in the form of a black list of
 * keywords. The content script also listens for messages from the popup and
 * updates the filter accordingly.
 */

(function () {
  let stats = {
    total: 0,
    filtered: 0,
    visible: 0,
  };

  // Run the filter when the page loads
  setTimeout(initFilter, 2000);

  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    if (request.action === "applyFilters") {
      applyFilters();
      sendResponse({ success: true });
    } else if (request.action === "getStats") {
      countJobs();
      sendResponse(stats);
    }
    return true;
  });

  // Set up a mutation observer to handle dynamic loading of job cards
  function initFilter() {
    applyFilters();

    // Set up observer for when new job cards are loaded
    const observer = new MutationObserver(function (mutations) {
      let shouldFilter = false;

      mutations.forEach(function (mutation) {
        if (mutation.addedNodes.length) {
          for (let node of mutation.addedNodes) {
            if (
              node.nodeType === 1 &&
              (node.classList.contains("gepq851") ||
                node.querySelector('[data-testid="job-card"]'))
            ) {
              shouldFilter = true;
              break;
            }
          }
        }
      });

      if (shouldFilter) {
        applyFilters();
      }
    });

    // Find the container of job cards
    const jobContainer = document.querySelector(
      '[data-automation="searchResults"]'
    );
    if (jobContainer) {
      observer.observe(jobContainer, { childList: true, subtree: true });
    }
  }

  function applyFilters() {
    chrome.storage.local.get(
      {
        enabled: true,
        keywords: [
          "Senior",
          "Lead",
          "Head",
          "Chief",
          "Director",
          "Manager",
          "Principal",
        ],
      },
      function (settings) {
        if (settings.enabled) {
          filterJobs(settings.keywords);
        } else {
          showAllJobs();
        }
      }
    );
  }

  function filterJobs(keywords) {
    const lowerKeywords = keywords.map((k) => k.toLowerCase());
    const jobCards = document.querySelectorAll('[data-testid="job-card"]');
    let removedCount = 0;

    jobCards.forEach((card) => {
      const titleElement = card.querySelector('[data-testid="job-card-title"]');

      if (titleElement) {
        const title = titleElement.textContent.toLowerCase();

        const matchesKeyword = lowerKeywords.some((keyword) =>
          title.includes(keyword)
        );

        if (matchesKeyword) {
          card.style.display = "none";
          removedCount++;
        } else {
          card.style.display = "";
        }
      }
    });

    countJobs();
  }

  function showAllJobs() {
    const jobCards = document.querySelectorAll('[data-testid="job-card"]');

    jobCards.forEach((card) => {
      card.style.display = "";
    });

    countJobs();
  }

  function countJobs() {
    const jobCards = document.querySelectorAll('[data-testid="job-card"]');
    const hiddenCards = document.querySelectorAll(
      '[data-testid="job-card"][style*="display: none"]'
    );

    stats.total = jobCards.length;
    stats.filtered = hiddenCards.length;
    stats.visible = stats.total - stats.filtered;
  }
})();
