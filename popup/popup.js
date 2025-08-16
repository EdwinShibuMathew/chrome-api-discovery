class APIDiscoveryPopup {
    constructor() {
        this.isDiscovering = false;
        this.endpoints = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadState();
        this.updateUI();
    }

    bindEvents() {
        document.getElementById('startBtn').addEventListener('click', () => this.startDiscovery());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopDiscovery());
        document.getElementById('exportYaml').addEventListener('click', () => this.exportYAML());
        document.getElementById('exportJson').addEventListener('click', () => this.exportJSON());
        document.getElementById('clearData').addEventListener('click', () => this.clearData());
    }

    async startDiscovery() {
        try {
            await chrome.runtime.sendMessage({ type: 'START_DISCOVERY' });
            this.isDiscovering = true;
            this.updateUI();
            this.updateStatus('Discovering...');
        } catch (error) {
            console.error('Failed to start discovery:', error);
            this.updateStatus('Error starting discovery');
        }
    }

    async stopDiscovery() {
        try {
            await chrome.runtime.sendMessage({ type: 'STOP_DISCOVERY' });
            this.isDiscovering = false;
            this.updateUI();
            this.updateStatus('Stopped');
        } catch (error) {
            console.error('Failed to stop discovery:', error);
            this.updateStatus('Error stopping discovery');
        }
    }

    async exportYAML() {
        try {
            this.updateStatus('Generating YAML...');
            const spec = await chrome.runtime.sendMessage({ type: 'BUILD_OPENAPI' });
            
            if (spec && spec.yaml) {
                const blob = new Blob([spec.yaml], { type: 'text/yaml' });
                const url = URL.createObjectURL(blob);
                const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                const hostname = this.getCurrentHostname();
                
                chrome.downloads.download({ 
                    url, 
                    filename: `openapi-${hostname}-${timestamp}.yaml`, 
                    saveAs: true 
                });
                
                this.updateStatus('YAML exported successfully');
                setTimeout(() => this.updateStatus('Ready'), 2000);
            } else {
                this.updateStatus('No data to export');
            }
        } catch (error) {
            console.error('Failed to export YAML:', error);
            this.updateStatus('Export failed');
        }
    }

    async exportJSON() {
        try {
            this.updateStatus('Generating JSON...');
            const spec = await chrome.runtime.sendMessage({ type: 'BUILD_OPENAPI' });
            
            if (spec && spec.json) {
                const blob = new Blob([spec.json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                const hostname = this.getCurrentHostname();
                
                chrome.downloads.download({ 
                    url, 
                    filename: `openapi-${hostname}-${timestamp}.json`, 
                    saveAs: true 
                });
                
                this.updateStatus('JSON exported successfully');
                setTimeout(() => this.updateStatus('Ready'), 2000);
            } else {
                this.updateStatus('No data to export');
            }
        } catch (error) {
            console.error('Failed to export JSON:', error);
            this.updateStatus('Export failed');
        }
    }

    async clearData() {
        try {
            await chrome.runtime.sendMessage({ type: 'CLEAR_DATA' });
            this.endpoints = [];
            this.updateEndpointCount(0);
            this.updateEndpointsList();
            this.updateStatus('Data cleared');
            setTimeout(() => this.updateStatus('Ready'), 2000);
        } catch (error) {
            console.error('Failed to clear data:', error);
            this.updateStatus('Failed to clear data');
        }
    }

    async loadState() {
        try {
            const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
            if (response) {
                this.isDiscovering = response.isDiscovering || false;
                this.endpoints = response.endpoints || [];
                this.updateEndpointCount(this.endpoints.length);
                this.updateEndpointsList();
            }
        } catch (error) {
            console.error('Failed to load state:', error);
        }
    }

    updateUI() {
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const exportYaml = document.getElementById('exportYaml');
        const exportJson = document.getElementById('exportJson');

        if (this.isDiscovering) {
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-block';
            exportYaml.disabled = true;
            exportJson.disabled = true;
        } else {
            startBtn.style.display = 'inline-block';
            stopBtn.style.display = 'none';
            exportYaml.disabled = this.endpoints.length === 0;
            exportJson.disabled = this.endpoints.length === 0;
        }
    }

    updateStatus(status) {
        document.getElementById('status').textContent = status;
    }

    updateEndpointCount(count) {
        document.getElementById('endpointCount').textContent = count;
    }

    updateEndpointsList() {
        const container = document.getElementById('endpointsContainer');
        const endpointsList = document.getElementById('endpointsList');
        
        if (this.endpoints.length === 0) {
            endpointsList.style.display = 'none';
            return;
        }

        endpointsList.style.display = 'block';
        container.innerHTML = '';

        this.endpoints.forEach(endpoint => {
            const endpointElement = this.createEndpointElement(endpoint);
            container.appendChild(endpointElement);
        });
    }

    createEndpointElement(endpoint) {
        const div = document.createElement('div');
        div.className = 'endpoint-item';
        
        const methodClass = `method-${endpoint.method.toLowerCase()}`;
        const methodSpan = document.createElement('span');
        methodSpan.className = `endpoint-method ${methodClass}`;
        methodSpan.textContent = endpoint.method;
        
        const urlDiv = document.createElement('div');
        urlDiv.className = 'endpoint-url';
        urlDiv.textContent = endpoint.url;
        
        const statusDiv = document.createElement('div');
        statusDiv.className = 'endpoint-status';
        statusDiv.textContent = `Status: ${endpoint.status} • ${endpoint.contentType || 'Unknown type'}`;
        
        div.appendChild(methodSpan);
        div.appendChild(urlDiv);
        div.appendChild(statusDiv);
        
        return div;
    }

    getCurrentHostname() {
        // Try to get current tab's hostname, fallback to generic
        try {
            return chrome.tabs ? 'current-site' : 'discovered-api';
        } catch {
            return 'discovered-api';
        }
    }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'API_EVENT') {
        // Update endpoints list when new API is discovered
        window.apiDiscoveryPopup.endpoints.push(message);
        window.apiDiscoveryPopup.updateEndpointCount(window.apiDiscoveryPopup.endpoints.length);
        window.apiDiscoveryPopup.updateEndpointsList();
        window.apiDiscoveryPopup.updateUI();
    }
});

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.apiDiscoveryPopup = new APIDiscoveryPopup();
});
