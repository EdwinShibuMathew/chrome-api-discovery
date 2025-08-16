// OpenAPI Generator Class
class OpenAPIGenerator {
  constructor() {
    this.schemaCache = new Map();
    this.operationIdCache = new Set();
  }

  generateOpenAPISpec(endpoints, options = {}) {
    if (!Array.isArray(endpoints) || endpoints.length === 0) {
      return this.generateEmptySpec();
    }

    const analysis = this.analyzeEndpoints(endpoints);
    const baseURL = this.determineBaseURL(endpoints);

    return {
      openapi: "3.0.3",
      info: this.generateInfo(options),
      servers: this.generateServers(baseURL, endpoints),
      paths: this.generatePaths(endpoints, analysis),
      components: this.generateComponents(endpoints, analysis),
      tags: this.generateTags(analysis),
    };
  }

  generateEmptySpec() {
    return {
      openapi: "3.0.3",
      info: {
        title: "Discovered API",
        version: "0.1.0",
        description:
          "No API endpoints discovered yet. Start discovery to generate specifications.",
      },
      servers: [{ url: "https://example.com" }],
      paths: {},
      components: { schemas: {} },
      tags: [],
    };
  }

  generateInfo(options = {}) {
    return {
      title: options.title || "Discovered API",
      version: options.version || "0.1.0",
      description:
        options.description ||
        "API discovered automatically by Chrome Extension",
    };
  }

  generateServers(baseURL, endpoints) {
    return [{ url: baseURL }];
  }

  determineBaseURL(endpoints) {
    if (endpoints.length === 0) return "https://example.com";

    try {
      const url = new URL(endpoints[0].url);
      return `${url.protocol}//${url.hostname}`;
    } catch {
      return "https://example.com";
    }
  }

  generatePaths(endpoints, analysis) {
    const paths = {};

    endpoints.forEach((endpoint) => {
      const path = this.normalizePath(endpoint.pathname);
      const method = endpoint.method.toLowerCase();

      if (!paths[path]) {
        paths[path] = {};
      }

      paths[path][method] = this.generateOperation(endpoint);
    });

    return paths;
  }

  normalizePath(pathname) {
    return pathname.replace(/\/(\d+)(?=\/|$)/g, "/{id}");
  }

  generateOperation(endpoint) {
    return {
      operationId: this.generateUniqueOperationId(
        endpoint.method,
        endpoint.pathname
      ),
      tags: this.generateOperationTags(endpoint.pathname),
      summary: this.generateOperationSummary(endpoint),
      parameters: this.generateParameters(endpoint),
      responses: this.generateResponses(endpoint),
    };
  }

  generateUniqueOperationId(method, pathname) {
    const segments = pathname.split("/").filter(Boolean);
    const resource = segments[segments.length - 1] || "item";

    const methodPrefix =
      {
        GET: "get",
        POST: "create",
        PUT: "update",
        DELETE: "delete",
        PATCH: "patch",
      }[method.toUpperCase()] || method.toLowerCase();

    let operationId = `${methodPrefix}${this.capitalize(resource)}`;

    let counter = 1;
    while (this.operationIdCache.has(operationId)) {
      operationId = `${methodPrefix}${this.capitalize(resource)}${counter}`;
      counter++;
    }

    this.operationIdCache.add(operationId);
    return operationId;
  }

  generateOperationTags(pathname) {
    const segments = pathname.split("/").filter(Boolean);
    return segments.length > 0 ? [segments[0]] : ["default"];
  }

  generateOperationSummary(endpoint) {
    const method = endpoint.method.toUpperCase();
    const resource = this.extractResourceName(endpoint.pathname);
    return `${method} ${resource}`;
  }

  extractResourceName(pathname) {
    const segments = pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] || "resource";
  }

  generateParameters(endpoint) {
    const parameters = [];

    // Path parameters
    const pathParams = this.extractPathParameters(endpoint.pathname);
    pathParams.forEach((param) => {
      parameters.push({
        name: param.name,
        in: "path",
        required: true,
        schema: { type: param.type },
      });
    });

    // Query parameters
    if (endpoint.searchParams) {
      Object.entries(endpoint.searchParams).forEach(([name, value]) => {
        parameters.push({
          name: name,
          in: "query",
          required: false,
          schema: { type: this.inferParameterType(value) },
          example: value,
        });
      });
    }

    return parameters;
  }

  extractPathParameters(pathname) {
    const params = [];
    const segments = pathname.split("/");

    segments.forEach((segment, index) => {
      if (segment.match(/^\d+$/)) {
        params.push({
          name: "id",
          type: "integer",
        });
      }
    });

    return params;
  }

  inferParameterType(value) {
    if (value === "true" || value === "false") return "boolean";
    if (!isNaN(value) && value !== "") return "number";
    return "string";
  }

  generateResponses(endpoint) {
    return {
      [endpoint.status]: {
        description: this.getStatusDescription(endpoint.status),
        content: {
          "application/json": {
            schema: { type: "object" },
          },
        },
      },
    };
  }

  getStatusDescription(status) {
    const descriptions = {
      200: "OK",
      201: "Created",
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      500: "Internal Server Error",
    };
    return descriptions[status] || "Response";
  }

  generateComponents(endpoints, analysis) {
    return {
      schemas: this.generateSchemas(endpoints, analysis),
    };
  }

  generateSchemas(endpoints, analysis) {
    return {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          code: { type: "string" },
        },
      },
    };
  }

  generateTags(analysis) {
    return [{ name: "default", description: "Default operations" }];
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  analyzeEndpoints(endpoints) {
    return { groups: [] };
  }
}

// Main Background Script Class
class APIDiscoveryBackground {
  constructor() {
    this.isDiscovering = false;
    this.endpoints = [];
    this.init();
  }

  init() {
    this.loadState();
    this.setupMessageListeners();
    this.setupWebRequestListeners();
    this.setupTabListeners();
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case "START_DISCOVERY":
          this.startDiscovery();
          sendResponse({ success: true });
          break;
        case "STOP_DISCOVERY":
          this.stopDiscovery();
          sendResponse({ success: true });
          break;
        case "GET_STATE":
          sendResponse({
            isDiscovering: this.isDiscovering,
            endpoints: this.endpoints,
          });
          break;
        case "BUILD_OPENAPI":
          this.buildOpenAPI().then((spec) => sendResponse(spec));
          return true; // Keep message channel open for async response
        case "CLEAR_DATA":
          this.clearData();
          sendResponse({ success: true });
          break;
        case "API_EVENT":
          this.handleAPIEvent(message);
          sendResponse({ success: true });
          break;
        case "INJECT_CONTENT_SCRIPT":
          if (message.tabId) {
            this.injectContentScript(message.tabId);
            sendResponse({ success: true });
          }
          break;
      }
    });
  }

  setupWebRequestListeners() {
    // Monitor completed requests
    chrome.webRequest.onCompleted.addListener(
      (details) => this.handleWebRequest(details),
      { urls: ["<all_urls>"] }
    );

    // Monitor request headers for additional context
    chrome.webRequest.onBeforeSendHeaders.addListener(
      (details) => this.handleRequestHeaders(details),
      { urls: ["<all_urls>"] },
      ["requestHeaders"]
    );
  }

  async injectContentScript(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["content/content.js"],
      });

      // Activate the content script
      await chrome.tabs.sendMessage(tabId, { type: "CONTENT_SCRIPT_ACTIVATE" });
    } catch (error) {
      console.log("Content script already injected or failed:", error);
    }
  }

  setupTabListeners() {
    // Inject content script when tabs are updated
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === "complete" && this.isDiscovering && tab.url) {
        // Only inject on http/https pages
        if (tab.url.startsWith("http")) {
          this.injectContentScript(tabId);
        }
      }
    });
  }

  handleWebRequest(details) {
    if (!this.isDiscovering || !this.isAPIRequest(details)) {
      return;
    }

    const endpoint = this.createEndpointFromRequest(details);
    this.addEndpoint(endpoint);

    // Notify popup of new endpoint
    this.notifyPopup(endpoint);
  }

  handleRequestHeaders(details) {
    if (!this.isDiscovering || !this.isAPIRequest(details)) {
      return;
    }

    // Store headers for later analysis (sanitized)
    const sanitizedHeaders = this.sanitizeHeaders(details.requestHeaders);
    this.updateEndpointHeaders(details.url, sanitizedHeaders);
  }

  isAPIRequest(details) {
    // Focus on XHR/fetch requests and API-like patterns
    if (details.type === "xmlhttprequest") {
      return true;
    }

    // Check for API-like URL patterns
    const url = details.url.toLowerCase();
    const apiPatterns = [
      "/api/",
      "/rest/",
      "/graphql",
      "/v1/",
      "/v2/",
      "/v3/",
      ".json",
      "application/json",
      "text/json",
    ];

    return (
      apiPatterns.some((pattern) => url.includes(pattern)) || details.initiator
    ); // Has an initiator (not a direct navigation)
  }

  createEndpointFromRequest(details) {
    const url = new URL(details.url);

    return {
      url: details.url,
      method: details.method,
      status: details.statusCode,
      contentType: this.getContentType(details),
      timestamp: new Date().toISOString(),
      hostname: url.hostname,
      pathname: url.pathname,
      searchParams: this.parseSearchParams(url.search),
      headers: {},
      responseSize: details.responseSize || 0,
    };
  }

  getContentType(details) {
    // Try to get content type from response headers
    if (details.responseHeaders) {
      const contentTypeHeader = details.responseHeaders.find(
        (h) => h.name.toLowerCase() === "content-type"
      );
      if (contentTypeHeader) {
        return contentTypeHeader.value.split(";")[0]; // Remove charset
      }
    }
    return "unknown";
  }

  parseSearchParams(search) {
    if (!search) return {};

    const params = {};
    const searchParams = new URLSearchParams(search);

    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }

    return params;
  }

  sanitizeHeaders(headers) {
    if (!headers) return {};

    const sensitive = [
      "authorization",
      "cookie",
      "x-api-key",
      "x-csrf-token",
      "x-auth-token",
      "x-access-token",
      "x-refresh-token",
    ];

    return Object.fromEntries(
      headers.map((header) => [
        header.name,
        sensitive.includes(header.name.toLowerCase())
          ? "[REDACTED]"
          : header.value,
      ])
    );
  }

  addEndpoint(endpoint) {
    // Always add new endpoint (keep duplicates)
    this.endpoints.push(endpoint);
    this.saveState();
  }

  updateEndpointHeaders(url, headers) {
    const endpoint = this.endpoints.find((e) => e.url === url);
    if (endpoint) {
      endpoint.headers = { ...endpoint.headers, ...headers };
      this.saveState();
    }
  }

  notifyPopup(endpoint) {
    // Send message to popup if it's open
    chrome.runtime
      .sendMessage({
        type: "API_EVENT",
        ...endpoint,
      })
      .catch(() => {
        // Popup might not be open, ignore error
      });
  }

  startDiscovery() {
    this.isDiscovering = true;
    this.saveState();
    console.log("API Discovery started");
  }

  stopDiscovery() {
    this.isDiscovering = false;
    this.saveState();
    console.log("API Discovery stopped");
  }

  clearData() {
    this.endpoints = [];
    this.saveState();
    console.log("API Discovery data cleared");
  }

  async buildOpenAPI() {
    if (this.endpoints.length === 0) {
      return { yaml: "", json: "" };
    }

    try {
      const openAPIGenerator = new OpenAPIGenerator();
      const openAPISpec = openAPIGenerator.generateOpenAPISpec(this.endpoints);

      // Convert to YAML and JSON
      const yaml = this.convertToYAML(openAPISpec);
      const json = JSON.stringify(openAPISpec, null, 2);

      return { yaml, json };
    } catch (error) {
      console.error("Failed to build OpenAPI spec:", error);
      return { yaml: "", json: "" };
    }
  }

  convertToYAML(obj) {
    // Simple YAML conversion - for production, use a proper YAML library
    return this.objectToYAML(obj, 0);
  }

  objectToYAML(obj, indent) {
    const spaces = "  ".repeat(indent);
    let yaml = "";

    for (const [key, value] of Object.entries(obj)) {
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        yaml += `${spaces}${key}:\n${this.objectToYAML(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach((item) => {
          yaml += `${spaces}- ${item}\n`;
        });
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }

    return yaml;
  }

  async loadState() {
    try {
      const result = await chrome.storage.local.get([
        "isDiscovering",
        "endpoints",
      ]);
      this.isDiscovering = result.isDiscovering || false;
      this.endpoints = result.endpoints || [];
    } catch (error) {
      console.error("Failed to load state:", error);
    }
  }

  async saveState() {
    try {
      await chrome.storage.local.set({
        isDiscovering: this.isDiscovering,
        endpoints: this.endpoints,
      });
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  }
}

// Initialize the background service worker
const apiDiscovery = new APIDiscoveryBackground();
