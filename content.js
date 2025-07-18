/**
 * This content script is injected into job search results pages (Seek and LinkedIn).
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

  // Detect which platform we're on
  const isLinkedIn = window.location.hostname.includes('linkedin.com');
  const isSeek = window.location.hostname.includes('seek.com.au');

  // Platform-specific selectors
  const platformConfig = {
    seek: {
      jobCardSelector: '[data-testid="job-card"]',
      jobTitleSelector: '[data-testid="job-card-title"]',
      jobContainerSelector: '[data-automation="searchResults"]',
      jobCardClass: 'gepq851'
    },
    linkedin: {
      jobCardSelector: 'li.ACpqKkPNeMEubTiuuQiNAdMwrHTUjWZqIr',
      jobTitleSelector: 'a.job-card-container__link strong',
      jobContainerSelector: 'ul.FMKsevrkZzvaOSBVwdqFpEyJlPBEYUikvjVsfil',
      jobScrollContainerSelector: '.scaffold-layout__list',
      jobCardClass: 'ACpqKkPNeMEubTiuuQiNAdMwrHTUjWZqIr'
    }
  };

  // Get current platform config
  const getPlatformConfig = () => {
    if (isLinkedIn) return platformConfig.linkedin;
    if (isSeek) return platformConfig.seek;
    return null;
  };

  const config = getPlatformConfig();
  if (!config) {
    console.log('XAP Extension: Unsupported platform');
    return;
  }

  // Track previously filtered jobs to avoid re-filtering
  let previouslyFilteredJobs = new Set();
  let scrollTimeout = null;
  let lastJobCount = 0;

  // Run the filter when the page loads
  setTimeout(initFilter, 2000);

  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    try {
      if (request.action === "applyFilters") {
        applyFilters();
        sendResponse({ success: true });
      } else if (request.action === "getStats") {
        countJobs();
        sendResponse(stats);
      }
    } catch (error) {
      console.log('XAP Extension: Error handling message from popup:', error);
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
              (node.classList.contains(config.jobCardClass) ||
                node.querySelector(config.jobCardSelector))
            ) {
              shouldFilter = true;
              break;
            }
          }
        }
      });

      if (shouldFilter) {
        setTimeout(applyFilters, 100);
      }
    });

    // Find the container of job cards
    const jobContainer = document.querySelector(config.jobContainerSelector);
    if (jobContainer) {
      observer.observe(jobContainer, { childList: true, subtree: true });
    }

    // Add LinkedIn-specific dynamic loading handlers
    if (isLinkedIn) {
      addLinkedInDynamicHandlers();
    }
  }

  // LinkedIn-specific handlers for dynamic loading
  function addLinkedInDynamicHandlers() {
    // Find the correct scroll container for LinkedIn job results
    // Target the parent div and then the 2nd child (the scrollable area)
    const jobScrollContainer = findLinkedInScrollContainer();
    if (jobScrollContainer) {
      console.log('XAP Extension: Found LinkedIn job scroll container');
      
      const handleScroll = () => {
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        
        scrollTimeout = setTimeout(() => {
          setTimeout(applyFilters, 100);
        }, 300); // 300ms debounce
      };

      // Listen for scroll events on the job results scroll container
      jobScrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      console.log('XAP Extension: Scroll listener attached to LinkedIn job container');
    } else {
      console.log('XAP Extension: LinkedIn job scroll container not found');
    }

    // Intersection Observer to detect when new jobs are loaded
    setupIntersectionObserver();

    // Periodic check for new jobs (if not scrolling, still filters after page loads)
    setInterval(() => setTimeout(applyFilters, 100), 1000);

  }

  // Find LinkedIn scroll container by targeting parent and 2nd child
  function findLinkedInScrollContainer() {
    const parentContainer = document.querySelector(config.jobScrollContainerSelector);
    if (!parentContainer) return null;

    // Get all direct children of the parent
    const children = Array.from(parentContainer.children);
    
    // The 2nd child (index 1) should be the scrollable area
    // Skip the header (index 0) and get the scrollable div
    if (children.length >= 2) {
      const scrollableChild = children[1];
      console.log('XAP Extension: Found scrollable child:', scrollableChild);
      return scrollableChild;
    }

    return null;
  }

  // Set up Intersection Observer to detect new jobs
  function setupIntersectionObserver() {
    const jobContainer = document.querySelector(config.jobContainerSelector);
    if (!jobContainer) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // When the container becomes visible, check for new jobs
          setTimeout(checkForNewJobs, 100);
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });

    observer.observe(jobContainer);
  }

  // Check if new jobs have been loaded
  function checkForNewJobs() {
    const currentJobs = document.querySelectorAll(config.jobCardSelector);
    const currentCount = currentJobs.length;

    if (currentCount > lastJobCount) {
      console.log(`XAP Extension: New jobs detected (${lastJobCount} -> ${currentCount}), applying filters...`);
      lastJobCount = currentCount;
      applyFilters();
    } else if (currentCount > 0) {
      // Even if count hasn't changed, check if any jobs are unfiltered based on current mode
      console.log('XAP Extension: Job count unchanged, checking for unfiltered jobs...');
      checkForUnfilteredJobs();
    }
  }

  // Check for unfiltered jobs based on current filter mode
  function checkForUnfilteredJobs() {
    try {
      chrome.storage.local.get({
        enabled: true,
        enableExperienceFilter: false,
        experienceLevels: [],
        keywords: ["Senior", "Lead", "Head", "Chief", "Director", "Manager", "Principal", "Principle", "Architect", "Staff"]
      }, function (settings) {
        const currentJobs = document.querySelectorAll(config.jobCardSelector);
        let unfilteredJobs = [];

        if (settings.enableExperienceFilter && settings.experienceLevels.length > 0) {
          // Experience filter mode - check for jobs that should be visible but aren't
          const patterns = settings.experienceLevels.flatMap(level => experiencePatterns[level] || [level]);
          const lowerPatterns = patterns.map(p => p.toLowerCase());
          
          unfilteredJobs = Array.from(currentJobs).filter(job => {
            const titleElement = job.querySelector(config.jobTitleSelector);
            if (titleElement) {
              const title = titleElement.textContent.toLowerCase();
              const shouldBeVisible = lowerPatterns.some(pattern => title.includes(pattern));
              const isCurrentlyHidden = job.style.display === "none";
              
              if (shouldBeVisible && isCurrentlyHidden) {
                console.log(`XAP Extension: Found job that should be visible: "${titleElement.textContent}"`);
                return true;
              }
            }
            return false;
          });
        } else if (settings.enabled) {
          // Standard exclusion mode - check for jobs that should be hidden but aren't
          const lowerKeywords = settings.keywords.map(k => k.toLowerCase());
          
          unfilteredJobs = Array.from(currentJobs).filter(job => {
            const titleElement = job.querySelector(config.jobTitleSelector);
            if (titleElement) {
              const title = titleElement.textContent.toLowerCase();
              const shouldBeFiltered = lowerKeywords.some(keyword => title.includes(keyword));
              const isCurrentlyVisible = job.style.display !== "none";
              
              if (shouldBeFiltered && isCurrentlyVisible) {
                console.log(`XAP Extension: Found filterable job to XAP: "${titleElement.textContent}"`);
                return true;
              }
            }
            return false;
          });
        }
        
        if (unfilteredJobs.length > 0) {
          console.log(`XAP Extension: Found ${unfilteredJobs.length} unfiltered jobs, applying filters...`);
          applyFilters();
        }
      });
    } catch (error) {
      console.log('XAP Extension: Error checking for unfiltered jobs, extension may have been reloaded');
    }
  }

  function applyFilters() {
    try {
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
            "Principle",
            "Architect",
            "Staff"
          ],
          enableExperienceFilter: false,
          experienceLevels: []
        },
        function (settings) {
          if (settings.enableExperienceFilter && settings.experienceLevels.length > 0) {
            filterJobsByExperience(settings.experienceLevels);
          } else if (settings.enabled) {
            filterJobs(settings.keywords);
          } else {
            showAllJobs();
          }
        }
      );
    } catch (error) {
      console.log('XAP Extension: Error accessing storage, extension may have been reloaded');
    }
  }

  // Robust patterns for experience levels
  const experiencePatterns = {
    graduate: ["graduate", "grad"],
    junior: ["junior", "jr", "j.r."],
    "mid-level": ["mid level", "mid-level", "midlevel", "intermediate", "mid "],
    senior: ["senior", "sr", "s.r."],
    lead: ["lead", "leader", "leadership"],
    principal: ["principal", "principle"],
    manager: ["manager", "mgr", "management"],
    director: ["director", "dir", "directorship"],
    chief: ["chief", "c.o.", "c.o.", "c-suite"],
    architect: ["architect", "architecture"],
    staff: ["staff"]
  };

  function filterJobsByExperience(selectedLevels) {
    const patterns = selectedLevels.flatMap(level => experiencePatterns[level] || [level]);
    const lowerPatterns = patterns.map(p => p.toLowerCase());
    const jobCards = document.querySelectorAll(config.jobCardSelector);
    let filteredTitles = [];

    jobCards.forEach((card) => {
      const titleElement = card.querySelector(config.jobTitleSelector);
      if (titleElement) {
        const title = titleElement.textContent.toLowerCase();
        const matches = lowerPatterns.some(pattern => title.includes(pattern));
        if (matches) {
          card.style.display = "";
        } else {
          card.style.display = "none";
          filteredTitles.push(titleElement.textContent.trim());
        }
      }
    });
    
    try {
      chrome.storage.local.set({ filteredJobTitles: filteredTitles });
    } catch (error) {
      console.log('XAP Extension: Error saving filtered titles, extension may have been reloaded');
    }
    countJobs();
  }

  function filterJobs(keywords) {
    const lowerKeywords = keywords.map((k) => k.toLowerCase());
    const jobCards = document.querySelectorAll(config.jobCardSelector);
    let removedCount = 0;
    let filteredTitles = [];

    jobCards.forEach((card) => {
      const titleElement = card.querySelector(config.jobTitleSelector);

      if (titleElement) {
        const title = titleElement.textContent.toLowerCase();
        const jobId = card.getAttribute('data-occludable-job-id') || title;

        const matchesKeyword = lowerKeywords.some((keyword) =>
          title.includes(keyword)
        );

        if (matchesKeyword) {
          card.style.display = "none";
          removedCount++;
          filteredTitles.push(titleElement.textContent.trim());
          previouslyFilteredJobs.add(jobId);
        } else {
          card.style.display = "";
          previouslyFilteredJobs.add(jobId);
        }
      }
    });

    try {
      chrome.storage.local.set({ filteredJobTitles: filteredTitles });
    } catch (error) {
      console.log('XAP Extension: Error saving filtered titles, extension may have been reloaded');
    }
    countJobs();
  }

  function showAllJobs() {
    const jobCards = document.querySelectorAll(config.jobCardSelector);

    jobCards.forEach((card) => {
      card.style.display = "";
    });

    // Clear the tracking set when showing all jobs
    previouslyFilteredJobs.clear();
    countJobs();
  }

  function countJobs() {
    const jobCards = document.querySelectorAll(config.jobCardSelector);
    const hiddenCards = document.querySelectorAll(
      `${config.jobCardSelector}[style*="display: none"]`
    );

    stats.total = jobCards.length;
    stats.filtered = hiddenCards.length;
    stats.visible = stats.total - stats.filtered;
  }
})();
