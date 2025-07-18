# Job Filter Chrome Extension

## Overview

The Xap Chrome extension filters out Senior rolled job listings based on predefined keywords, allowing users to hide job posts with specific titles on both **Seek** and **LinkedIn** job search platforms. Alternatively, you may add your own keyword filters entirely. The filtering is case-insensitive, so job titles are matched regardless of capitalization. Filters persist in local browser storage.

## Features

- **Multi-platform support**: Works on both Seek.com.au and LinkedIn Jobs
- **Keyword-based filtering**: Hide job listings that contain certain words in the title
- **Experience level filtering**: Filter jobs by experience level (Entry, Mid-level, Senior, Executive)
- **Inverse filtering mode**: Show only jobs matching selected experience levels
- **Case-insensitive matching**: Searches are performed in lowercase to ensure consistent filtering
- **User-defined keywords**: Add or remove keywords dynamically via the extension popup
- **Enable/Disable filtering**: Toggle the filter on or off
- **Statistics tracking**: Displays the number of total, filtered, and visible jobs
- **Persistent storage**: Saves settings using Chrome's local storage
- **Dynamic content handling**: Automatically filters new job listings as they load (especially important for LinkedIn's pagination)
- **Real-time filtering**: Filters are applied automatically as you scroll and new jobs load

## Supported Platforms

- **Seek.com.au**: Australian job search platform
- **LinkedIn Jobs**: Professional networking job search

## Main Components

- **popup.html**: The extension's popup interface
- **popup.js**: Handles UI interactions and settings management
- **content.js**: Injected into job listing pages to filter jobs based on user-defined keywords and experience levels (supports both Seek and LinkedIn)
- **manifest.json**: Defines the extension metadata and permissions
- **styles.css**: Styles for the popup interface

## Installation Guide

1. **Download the extension files** or clone the repository
2. Open **Google Chrome** and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top right corner)
4. Click **Load unpacked** and select the folder containing the extension files
5. The extension will now appear in your extension list

## Adding to Browser Hotbar

To make the extension easily accessible:

1. Click the **Extensions** button (puzzle icon) in the top right of Chrome
2. Find your extension in the list
3. Click the **pin icon** next to it
4. The extension's icon will now appear in the toolbar for quick access

## Usage Instructions

1. Click on the extension icon to open the popup
2. Use the toggle to enable/disable job filtering
3. **Keyword filtering**: Add new keywords by typing in the input box and pressing **Enter**
4. **Experience level filtering**: Select experience levels from the dropdown and toggle inverse mode
5. Click on a keyword's `X` to remove it from the filter list
6. Use the **Apply Filters** button to refresh the filtering process
7. Click **Refresh Page** if needed to reload the listings

### Filtering Modes

**Keyword Filtering:**
- Hide jobs containing specific keywords in their titles
- Add custom keywords to filter out unwanted job types
- Keywords are case-insensitive for flexible matching

**Experience Level Filtering:**
- Filter jobs by experience level (Entry, Mid-level, Senior, Executive)
- Select multiple experience levels using the multi-select dropdown
- Toggle "Show only selected experience levels" for inverse filtering
- When enabled, only jobs matching selected levels are shown
- When disabled, jobs matching selected levels are hidden

### Platform-Specific Notes

**LinkedIn Jobs:**
- The extension automatically handles LinkedIn's dynamic loading and pagination
- Job listings are filtered as they load, ensuring consistent filtering across all pages
- Works with LinkedIn's search results at `linkedin.com/jobs/*`
- Handles infinite scroll and dynamic content loading

**Seek.com.au:**
- Filters job listings on Seek's search results pages
- Maintains the same filtering behavior as before
