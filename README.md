# Chrome Extension, Zap the Senior jobs, filter

## Overview

The Xap Chrome extension filters out Senior rolled job listings based on predefined keywords, allowing users to hide job posts with specific titles. This is a cheeky work-around to remove the Senior job spam, for job searchers who are no there yet!. Alternatively, you may add your own keyword filters entirely. The filtering is case-insensitive, so job titles are matched regardless of capitalization. Filters persist in local browser storage.

## Features

- **Keyword-based filtering**: Hide job listings that contain certain words in the title.
- **Case-insensitive matching**: Searches are performed in lowercase to ensure consistent filtering.
- **User-defined keywords**: Add or remove keywords dynamically via the extension popup.
- **Enable/Disable filtering**: Toggle the filter on or off.
- **Statistics tracking**: Displays the number of total, filtered, and visible jobs.
- **Persistent storage**: Saves settings using Chrome's local storage.

## Main Components

- **popup.html**: The extension's popup interface.
- **popup.js**: Handles UI interactions and settings management.
- **content.js**: Injected into job listing pages to filter jobs based on user-defined keywords.
- **manifest.json**: Defines the extension metadata and permissions.
- **styles.css**: Styles for the popup interface.

## Installation Guide

1. **Download the extension files** or clone the repository.
2. Open **Google Chrome** and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top right corner).
4. Click **Load unpacked** and select the folder containing the extension files.
5. The extension will now appear in your extension list.

## Adding to Browser Hotbar

To make the extension easily accessible:

1. Click the **Extensions** button (puzzle icon) in the top right of Chrome.
2. Find your extension in the list.
3. Click the **pin icon** 📌 next to it.
4. The extension's icon will now appear in the toolbar for quick access.

## Usage Instructions

1. Click on the extension icon to open the popup.
2. Use the toggle to enable/disable job filtering.
3. Add new keywords by typing in the input box and pressing **Enter**.
4. Click on a keyword’s `X` to remove it from the filter list.
5. Use the **Apply Filters** button to refresh the filtering process.
6. Click **Refresh Page** if needed to reload the listings.
