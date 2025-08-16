# API Discovery: HARless

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![Works Offline](https://img.shields.io/badge/Works-Offline-green.svg)](https://developer.chrome.com/docs/extensions/mv3/service_workers/)
[![Chrome 126+](https://img.shields.io/badge/Chrome-126+-brightgreen.svg)](https://www.google.com/chrome/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Track 08 – Chrome Extension for API Discovery (Manifest V3)**

A browser extension that automatically discovers and generates OpenAPI specifications from any website by analyzing network traffic and API calls.

**Time Estimate:** 4–6 hours  
**Difficulty:** Beginner → Intermediate  
**Perfect for:** Web developers interested in browser APIs, reverse engineering, and making hidden APIs discoverable.

## 🎯 Outcome

- Monitors network requests on any website
- Identifies API patterns from HTTP traffic
- Generates OpenAPI 3.0+ specifications automatically (JSON/YAML)
- Exports results for Jentic and other tools
- Simple popup UI to start/stop discovery and export

## ✅ Acceptance Criteria

- [ ] Loads as MV3 extension on Chrome (126+)
- [ ] Captures and lists API-like requests (XHR/fetch) with method, path, status
- [ ] Infers endpoints + parameters and groups by base URL
- [ ] Generates valid OpenAPI 3.0+ (JSON/YAML)
- [ ] Exports files via download with correct MIME type
- [ ] Redacts secrets/PII before storage/export
- [ ] Clear "Start/Stop Discovery", "Export", "Clear Data" buttons
- [ ] README quickstart works end-to-end

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quickstart](#quickstart)
- [Development](#development)
- [Testing](#testing)
- [Usage Guide](#usage-guide)
- [OpenAPI Generation](#openapi-generation)
- [Export & Integration](#export--integration)
- [Security & Privacy](#security--privacy)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## 🏗️ Repository Structure

```
chrome-api-discovery/
├── manifest.json
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── background/
│   └── background.js
├── content/
│   └── content.js
├── lib/
│   ├── api-analyzer.js
│   ├── openapi-generator.js
│   └── utils.js
└── README.md
```

## 🏛️ Architecture

### Component Communication

````mermaid
graph TB
    subgraph "Extension Components"
        P[Popup UI]
        B[Background Service Worker]
        C[Content Script]
        L[Library Modules]

    # API Discovery: HARless

    A Chrome extension that helps you discover hidden APIs on any website and instantly generate OpenAPI documentation.

    ---

    ## 🚀 What Does It Do?

    - **Monitors** network requests (XHR/fetch) on any site you visit
    - **Identifies** API endpoints, methods, and parameters
    - **Generates** OpenAPI 3.0+ specs (YAML/JSON) automatically
    - **Exports** results for use in tools like Swagger, Postman, or Jentic
    - **Simple UI**: Start/stop discovery, view endpoints, and export with one click

    ---

    ## 🏁 Quick Start

    1. **Clone this repo:**
      ```bash
      git clone https://github.com/yourusername/chrome-api-discovery.git
      cd chrome-api-discovery
      ```

    2. **Load the extension in Chrome:**
      - Go to `chrome://extensions/`
      - Enable **Developer mode** (top right)
      - Click **Load unpacked** and select the `chrome-api-discovery` folder

    3. **Start discovering APIs:**
      - Click the extension icon in your toolbar
      - Click **Start Discovery**
      - Browse any website—watch the endpoint counter increase!
      - Click **Export** to download OpenAPI specs

    ---

    ## 🖼️ How It Works

    - **Popup UI:** Control discovery, view endpoints, and export data
    - **Background Script:** Monitors network requests and stores endpoints
    - **Content Script:** Gathers extra context from the page
    - **Library Modules:** Analyze APIs and generate OpenAPI specs

    ---

    ## 🧪 Testing

    - Try on sites like GitHub, Reddit, news, or e-commerce pages
    - Use the popup to start/stop discovery and export results
    - Validate your OpenAPI file at [Swagger Editor](https://editor.swagger.io/)

    ---

    ## 🔒 Security & Privacy

    - Sensitive data (tokens, cookies, PII) is redacted before storage/export
    - All processing is local—no data leaves your browser
    - Use the **Clear Data** button to erase all captured info

    ---

    ## 🛠️ Troubleshooting

    - **Extension won't load?** Check for errors in `chrome://extensions`
    - **No requests captured?** Make sure discovery is started and reload the page
    - **Export empty?** Ensure the site made at least one API call

    ---

    ## 📄 License

    MIT License

    ---
````
