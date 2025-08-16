class APIDiscoveryContent {
    constructor() {
        this.isActive = false;
        this.init();
    }

    init() {
        this.setupMessageListener();
        this.observeUserActions();
        this.injectDiscoveryIndicator();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'CONTENT_SCRIPT_ACTIVATE') {
                this.isActive = true;
                this.showIndicator();
                sendResponse({ success: true });
            } else if (message.type === 'CONTENT_SCRIPT_DEACTIVATE') {
                this.isActive = false;
                this.hideIndicator();
                sendResponse({ success: true });
            }
        });
    }

    observeUserActions() {
        // Observe form submissions
        document.addEventListener('submit', (event) => {
            if (this.isActive) {
                this.sendContextHint('form_submit', {
                    action: event.target.action,
                    method: event.target.method,
                    formData: this.extractFormData(event.target)
                });
            }
        });

        // Observe search inputs
        document.addEventListener('input', (event) => {
            if (this.isActive && this.isSearchInput(event.target)) {
                this.sendContextHint('search_input', {
                    query: event.target.value,
                    inputType: event.target.type,
                    placeholder: event.target.placeholder
                });
            }
        });

        // Observe navigation actions
        document.addEventListener('click', (event) => {
            if (this.isActive && this.isNavigationAction(event.target)) {
                this.sendContextHint('navigation', {
                    action: 'click',
                    target: event.target.tagName,
                    href: event.target.href || null,
                    text: event.target.textContent?.trim()
                });
            }
        });

        // Observe AJAX/fetch requests if possible
        this.interceptFetchRequests();
        this.interceptXHRRequests();
    }

    isSearchInput(input) {
        const searchTypes = ['search', 'text'];
        const searchNames = ['q', 'query', 'search', 's'];
        const searchClasses = ['search', 'query', 'search-input'];
        
        return searchTypes.includes(input.type) ||
               searchNames.includes(input.name) ||
               searchClasses.some(cls => input.className.includes(cls));
    }

    isNavigationAction(element) {
        const navigationTags = ['A', 'BUTTON', 'NAV'];
        const navigationClasses = ['nav', 'navigation', 'menu', 'pagination'];
        
        return navigationTags.includes(element.tagName) ||
               navigationClasses.some(cls => element.className.includes(cls));
    }

    extractFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    interceptFetchRequests() {
        const originalFetch = window.fetch;
        
        window.fetch = async (...args) => {
            if (this.isActive) {
                const [url, options = {}] = args;
                
                this.sendContextHint('fetch_request', {
                    url: url,
                    method: options.method || 'GET',
                    headers: options.headers || {},
                    body: options.body ? 'present' : 'none'
                });
            }
            
            return originalFetch.apply(this, args);
        };
    }

    interceptXHRRequests() {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            if (window.apiDiscoveryContent && window.apiDiscoveryContent.isActive) {
                window.apiDiscoveryContent.sendContextHint('xhr_request', {
                    method: method,
                    url: url,
                    async: args[0] !== false
                });
            }
            
            return originalOpen.apply(this, [method, url, ...args]);
        };
        
        XMLHttpRequest.prototype.send = function(data) {
            if (window.apiDiscoveryContent && window.apiDiscoveryContent.isActive && data) {
                window.apiDiscoveryContent.sendContextHint('xhr_data', {
                    hasData: true,
                    dataType: typeof data
                });
            }
            
            return originalSend.apply(this, [data]);
        };
    }

    sendContextHint(type, data) {
        try {
            chrome.runtime.sendMessage({
                type: 'CONTEXT_HINT',
                hintType: type,
                data: data,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent
            });
        } catch (error) {
            // Ignore errors when extension is not available
        }
    }

    injectDiscoveryIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'api-discovery-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: none;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                🔍 API Discovery Active
            </div>
        `;
        
        document.body.appendChild(indicator);
        this.indicator = indicator.querySelector('#api-discovery-indicator');
    }

    showIndicator() {
        if (this.indicator) {
            this.indicator.style.display = 'block';
        }
    }

    hideIndicator() {
        if (this.indicator) {
            this.indicator.style.display = 'none';
        }
    }

    // Utility method to detect API patterns in the current page
    detectAPIPatterns() {
        const patterns = [];
        
        // Look for common API patterns in the page
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            const content = script.textContent || script.innerHTML;
            
            // Look for API endpoints in JavaScript code
            const apiRegex = /['"`](https?:\/\/[^'"`]+\/api\/[^'"`]+)['"`]/g;
            let match;
            while ((match = apiRegex.exec(content)) !== null) {
                patterns.push({
                    type: 'api_endpoint',
                    value: match[1],
                    source: 'script_content'
                });
            }
            
            // Look for GraphQL queries
            const graphqlRegex = /query\s+(\w+)\s*\{/g;
            while ((match = graphqlRegex.exec(content)) !== null) {
                patterns.push({
                    type: 'graphql_query',
                    value: match[1],
                    source: 'script_content'
                });
            }
        });
        
        // Look for API links in the page
        const links = document.querySelectorAll('a[href*="/api/"], a[href*=".json"]');
        links.forEach(link => {
            patterns.push({
                type: 'api_link',
                value: link.href,
                source: 'page_link'
            });
        });
        
        if (patterns.length > 0) {
            this.sendContextHint('page_patterns', {
                patterns: patterns,
                pageUrl: window.location.href
            });
        }
        
        return patterns;
    }
}

// Initialize content script
window.apiDiscoveryContent = new APIDiscoveryContent();

// Auto-detect patterns when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.apiDiscoveryContent.detectAPIPatterns();
    });
} else {
    window.apiDiscoveryContent.detectAPIPatterns();
}

// Detect patterns on dynamic content changes
const observer = new MutationObserver((mutations) => {
    if (window.apiDiscoveryContent && window.apiDiscoveryContent.isActive) {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if new API-related content was added
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const apiLinks = node.querySelectorAll && node.querySelectorAll('a[href*="/api/"]');
                        if (apiLinks && apiLinks.length > 0) {
                            window.apiDiscoveryContent.detectAPIPatterns();
                        }
                    }
                });
            }
        });
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
