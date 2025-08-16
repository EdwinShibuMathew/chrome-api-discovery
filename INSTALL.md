# Installation Guide

## 🚀 Quick Installation

### 1. Download/Clone the Extension
```bash
git clone https://github.com/yourusername/chrome-api-discovery.git
cd chrome-api-discovery
```

### 2. Load in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right corner)
3. Click **Load unpacked**
4. Select the `chrome-api-discovery` folder
5. The extension should now appear in your extensions list

### 3. Verify Installation
- Look for "API Discovery: HARless" in your extensions list
- Check that the extension icon appears in your Chrome toolbar
- Click the icon to open the popup

## 🧪 Testing the Extension

### 1. Start Discovery
1. Click the extension icon in your toolbar
2. Click **Start Discovery** button
3. The status should change to "Discovering..."

### 2. Test with Demo Page
1. Open `test-demo.html` in your browser
2. Click various test buttons to generate API calls
3. Watch the endpoint counter increase in the extension popup
4. Check that endpoints appear in the discovered endpoints list

### 3. Test with Real Websites
Recommended test sites:
- **GitHub**: Browse repositories (lots of XHR calls)
- **Reddit**: Navigate between posts and comments
- **News sites**: Scroll through article lists
- **E-commerce**: Search for products

### 4. Export OpenAPI Specs
1. After discovering some endpoints, click **Stop Discovery**
2. Click **Export YAML** or **Export JSON**
3. Files will download with timestamp and hostname

## 🔧 Troubleshooting

### Extension Won't Load
- Check `chrome://extensions/` for error messages
- Ensure all required files are present
- Verify `manifest.json` syntax is correct

### No Requests Captured
- Make sure **Start Discovery** is enabled
- Reload the target page after starting discovery
- Check that the target site makes XHR/fetch requests
- Verify permissions are granted

### Export Issues
- Ensure at least one API endpoint was discovered
- Check browser console for error messages
- Verify download permissions are enabled

## 📁 File Structure
```
chrome-api-discovery/
├── manifest.json          # Extension configuration
├── popup/                 # Popup UI
│   ├── popup.html        # Popup HTML
│   ├── popup.css         # Popup styling
│   └── popup.js          # Popup logic
├── background/            # Background service worker
│   └── background.js     # Network monitoring
├── content/              # Content script
│   └── content.js        # Page interaction
├── lib/                  # Utility libraries
│   ├── api-analyzer.js   # API pattern analysis
│   ├── openapi-generator.js # OpenAPI generation
│   └── utils.js          # Common utilities
├── icons/                # Extension icons
│   ├── icon16.svg        # 16x16 icon
│   ├── icon48.svg        # 48x48 icon
│   └── icon128.svg       # 128x128 icon
├── test-demo.html        # Test page
├── README.md             # Project documentation
└── INSTALL.md            # This file
```

## 🎯 What to Expect

### During Discovery
- Endpoint counter increases as APIs are detected
- Real-time list of discovered endpoints
- Method, URL, and status information displayed

### Generated OpenAPI Specs
- Valid OpenAPI 3.0.3 format
- Path parameters automatically detected
- Query parameters with inferred types
- Resource grouping by URL patterns
- Security schemes for authenticated endpoints

### Security Features
- Sensitive headers automatically redacted
- No PII or credentials stored
- Data lives only in browser storage
- Clear data option available

## 🔄 Development Workflow

1. **Make changes** to extension files
2. **Reload extension** in `chrome://extensions/`
3. **Test changes** with demo page or real sites
4. **Debug** using Chrome DevTools console
5. **Iterate** and improve

## 📚 Next Steps

- Customize the API detection patterns
- Enhance OpenAPI schema generation
- Add support for GraphQL endpoints
- Implement batch export features
- Add integration with external tools

## 🆘 Getting Help

- Check the browser console for error messages
- Review the README.md for detailed documentation
- Open an issue on GitHub for bugs or feature requests
- Check Chrome extension documentation for API details

---

**Happy API Discovering! 🚀**
