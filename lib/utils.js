/**
 * Utils - Common utility functions for the API Discovery extension
 * Pure utility functions that can be unit tested
 */

class Utils {
    /**
     * Sanitize sensitive data from headers and other content
     */
    static sanitizeSensitiveData(data, sensitiveKeys = []) {
        if (typeof data !== 'object' || data === null) {
            return data;
        }

        const defaultSensitiveKeys = [
            'authorization', 'cookie', 'set-cookie', 'x-api-key', 'x-csrf-token',
            'x-auth-token', 'x-access-token', 'x-refresh-token', 'x-session-id',
            'password', 'secret', 'token', 'key', 'credential'
        ];

        const allSensitiveKeys = [...defaultSensitiveKeys, ...sensitiveKeys];

        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeSensitiveData(item, allSensitiveKeys));
        }

        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            const lowerKey = key.toLowerCase();
            
            if (allSensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeSensitiveData(value, allSensitiveKeys);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    /**
     * Sanitize headers specifically
     */
    static sanitizeHeaders(headers) {
        if (!Array.isArray(headers)) {
            return {};
        }

        const sanitized = {};
        headers.forEach(header => {
            const lowerName = header.name.toLowerCase();
            
            if (this.isSensitiveHeader(lowerName)) {
                sanitized[header.name] = '[REDACTED]';
            } else {
                sanitized[header.name] = header.value;
            }
        });

        return sanitized;
    }

    /**
     * Check if a header name is sensitive
     */
    static isSensitiveHeader(headerName) {
        const sensitivePatterns = [
            'authorization', 'cookie', 'set-cookie', 'x-api-key', 'x-csrf-token',
            'x-auth-token', 'x-access-token', 'x-refresh-token', 'x-session-id',
            'password', 'secret', 'token', 'key', 'credential'
        ];

        return sensitivePatterns.some(pattern => headerName.includes(pattern));
    }

    /**
     * Parse URL search parameters
     */
    static parseSearchParams(search) {
        if (!search) return {};
        
        try {
            const params = {};
            const searchParams = new URLSearchParams(search);
            
            for (const [key, value] of searchParams.entries()) {
                params[key] = value;
            }
            
            return params;
        } catch (error) {
            console.warn('Failed to parse search params:', error);
            return {};
        }
    }

    /**
     * Extract hostname from URL
     */
    static extractHostname(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return null;
        }
    }

    /**
     * Extract pathname from URL
     */
    static extractPathname(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.pathname;
        } catch {
            return null;
        }
    }

    /**
     * Get base URL from full URL
     */
    static getBaseURL(url) {
        try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.hostname}`;
        } catch {
            return url;
        }
    }

    /**
     * Check if URL is likely an API endpoint
     */
    static isAPIEndpoint(url) {
        if (!url || typeof url !== 'string') return false;
        
        const lowerUrl = url.toLowerCase();
        const apiPatterns = [
            '/api/', '/rest/', '/graphql', '/v1/', '/v2/', '/v3/',
            '.json', 'application/json', 'text/json'
        ];

        return apiPatterns.some(pattern => lowerUrl.includes(pattern));
    }

    /**
     * Generate a unique ID
     */
    static generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Format bytes to human readable format
     */
    static formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Format timestamp to human readable format
     */
    static formatTimestamp(timestamp) {
        if (!timestamp) return 'Unknown';
        
        try {
            const date = new Date(timestamp);
            return date.toLocaleString();
        } catch {
            return 'Invalid date';
        }
    }

    /**
     * Debounce function calls
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function calls
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Deep clone an object
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
    }

    /**
     * Merge objects deeply
     */
    static deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }

    /**
     * Validate URL format
     */
    static isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Extract domain from URL
     */
    static extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return null;
        }
    }

    /**
     * Check if two URLs are from the same domain
     */
    static sameDomain(url1, url2) {
        const domain1 = this.extractDomain(url1);
        const domain2 = this.extractDomain(url2);
        
        return domain1 && domain2 && domain1 === domain2;
    }

    /**
     * Generate a filename-safe string
     */
    static sanitizeFilename(filename) {
        return filename
            .replace(/[^a-z0-9]/gi, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .toLowerCase();
    }

    /**
     * Generate timestamp string for filenames
     */
    static generateTimestamp() {
        const now = new Date();
        return now.toISOString()
            .slice(0, 19)
            .replace(/:/g, '-')
            .replace('T', '-');
    }

    /**
     * Generate filename with timestamp
     */
    static generateFilename(prefix, extension, hostname = 'api') {
        const timestamp = this.generateTimestamp();
        const sanitizedHostname = this.sanitizeFilename(hostname);
        return `${prefix}-${sanitizedHostname}-${timestamp}.${extension}`;
    }

    /**
     * Log message with timestamp
     */
    static log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        switch (level) {
            case 'error':
                console.error(logMessage);
                break;
            case 'warn':
                console.warn(logMessage);
                break;
            case 'debug':
                console.debug(logMessage);
                break;
            default:
                console.log(logMessage);
        }
    }

    /**
     * Retry function with exponential backoff
     */
    static async retry(fn, maxAttempts = 3, baseDelay = 1000) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (attempt === maxAttempts) {
                    throw error;
                }
                
                const delay = baseDelay * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    /**
     * Check if running in Chrome extension context
     */
    static isChromeExtension() {
        return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
    }

    /**
     * Check if running in content script context
     */
    static isContentScript() {
        return typeof window !== 'undefined' && !this.isChromeExtension();
    }

    /**
     * Check if running in background script context
     */
    static isBackgroundScript() {
        return this.isChromeExtension() && typeof window === 'undefined';
    }

    /**
     * Get extension version
     */
    static getExtensionVersion() {
        if (this.isChromeExtension()) {
            return chrome.runtime.getManifest().version;
        }
        return 'unknown';
    }

    /**
     * Send message to background script
     */
    static async sendMessage(message) {
        if (!this.isChromeExtension()) {
            throw new Error('Not running in Chrome extension context');
        }
        
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, response => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
    }

    /**
     * Get current tab information
     */
    static async getCurrentTab() {
        if (!this.isChromeExtension()) {
            return null;
        }
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            return tab;
        } catch (error) {
            this.log('Failed to get current tab:', 'error');
            return null;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} else if (typeof window !== 'undefined') {
    window.Utils = Utils;
}
