/**
 * API Analyzer - Core utilities for analyzing and categorizing API endpoints
 * Pure utility functions that can be unit tested
 */

class APIAnalyzer {
  constructor() {
    this.patterns = {
      idPatterns: [
        /\/\d+(\/|$)/g, // Numeric IDs: /123/
        /\/[a-f0-9]{8,}(\/|$)/gi, // UUIDs: /a1b2c3d4-e5f6-7890-abcd-ef1234567890/
        /\/[a-z0-9]{24}(\/|$)/gi, // MongoDB ObjectIds: /507f1f77bcf86cd799439011/
      ],
      resourcePatterns: [
        /\/users?\//i, // Users
        /\/posts?\//i, // Posts
        /\/articles?\//i, // Articles
        /\/products?\//i, // Products
        /\/orders?\//i, // Orders
        /\/comments?\//i, // Comments
        /\/files?\//i, // Files
        /\/images?\//i, // Images
        /\/videos?\//i, // Videos
        /\/categories?\//i, // Categories
        /\/tags?\//i, // Tags
        /\/search/i, // Search
        /\/auth/i, // Authentication
        /\/login/i, // Login
        /\/logout/i, // Logout
        /\/register/i, // Register
        /\/profile/i, // Profile
        /\/settings/i, // Settings
        /\/admin/i, // Admin
        /\/api\//i, // API prefix
        /\/rest\//i, // REST prefix
        /\/v\d+\//i, // Version numbers: /v1/, /v2/
        /\/graphql/i, // GraphQL
      ],
    };
  }

  /**
   * Analyze a collection of endpoints and group them by patterns
   */
  analyzeEndpoints(endpoints) {
    if (!Array.isArray(endpoints) || endpoints.length === 0) {
      return {
        groups: [],
        patterns: {},
        statistics: {},
      };
    }

    const groups = this.groupEndpointsByPattern(endpoints);
    const patterns = this.extractCommonPatterns(endpoints);
    const statistics = this.generateStatistics(endpoints);

    return { groups, patterns, statistics };
  }

  /**
   * Group endpoints by common patterns and base URLs
   */
  groupEndpointsByPattern(endpoints) {
    const groups = new Map();

    endpoints.forEach((endpoint) => {
      const key = this.getEndpointGroupKey(endpoint);

      if (!groups.has(key)) {
        groups.set(key, {
          baseUrl: this.getBaseUrl(endpoint.url),
          hostname: new URL(endpoint.url).hostname,
          endpoints: [],
          patterns: new Set(),
          methods: new Set(),
          statusCodes: new Set(),
        });
      }

      const group = groups.get(key);
      group.endpoints.push(endpoint);
      group.methods.add(endpoint.method);
      group.statusCodes.add(endpoint.status);

      // Add pattern information
      const pattern = this.extractEndpointPattern(endpoint);
      group.patterns.add(pattern);
    });

    // Convert to array and sort by endpoint count
    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        patterns: Array.from(group.patterns),
        methods: Array.from(group.methods),
        statusCodes: Array.from(group.statusCodes),
        endpointCount: group.endpoints.length,
      }))
      .sort((a, b) => b.endpointCount - a.endpointCount);
  }

  /**
   * Get a grouping key for an endpoint
   */
  getEndpointGroupKey(endpoint) {
    const url = new URL(endpoint.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);

    // Group by first few path segments
    if (pathSegments.length >= 2) {
      return `${url.hostname}${pathSegments.slice(0, 2).join("/")}`;
    } else if (pathSegments.length === 1) {
      return `${url.hostname}${pathSegments[0]}`;
    }

    return url.hostname;
  }

  /**
   * Extract the base URL from a full URL
   */
  getBaseUrl(url) {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}`;
    } catch {
      return url;
    }
  }

  /**
   * Extract pattern from endpoint path
   */
  extractEndpointPattern(endpoint) {
    const url = new URL(endpoint.url);
    let path = url.pathname;

    // Replace IDs with placeholders
    this.patterns.idPatterns.forEach((pattern) => {
      path = path.replace(pattern, "/{id}");
    });

    return path;
  }

  /**
   * Extract common patterns across all endpoints
   */
  extractCommonPatterns(endpoints) {
    const patterns = {
      commonPaths: new Map(),
      commonQueryParams: new Map(),
      commonHeaders: new Map(),
      resourceTypes: new Map(),
    };

    endpoints.forEach((endpoint) => {
      // Analyze path patterns
      const path = this.extractEndpointPattern(endpoint);
      patterns.commonPaths.set(path, (patterns.commonPaths.get(path) || 0) + 1);

      // Analyze query parameters
      if (endpoint.searchParams) {
        Object.keys(endpoint.searchParams).forEach((param) => {
          patterns.commonQueryParams.set(
            param,
            (patterns.commonQueryParams.get(param) || 0) + 1
          );
        });
      }

      // Analyze headers
      if (endpoint.headers) {
        Object.keys(endpoint.headers).forEach((header) => {
          patterns.commonHeaders.set(
            header,
            (patterns.commonHeaders.get(header) || 0) + 1
          );
        });
      }

      // Analyze resource types
      const resourceType = this.detectResourceType(endpoint);
      if (resourceType) {
        patterns.resourceTypes.set(
          resourceType,
          (patterns.resourceTypes.get(resourceType) || 0) + 1
        );
      }
    });

    // Convert to sorted arrays
    return {
      commonPaths: this.sortMapByValue(patterns.commonPaths),
      commonQueryParams: this.sortMapByValue(patterns.commonQueryParams),
      commonHeaders: this.sortMapByValue(patterns.commonHeaders),
      resourceTypes: this.sortMapByValue(patterns.resourceTypes),
    };
  }

  /**
   * Detect the resource type from an endpoint
   */
  detectResourceType(endpoint) {
    const url = endpoint.url.toLowerCase();

    for (const [
      resource,
      pattern,
    ] of this.patterns.resourcePatterns.entries()) {
      if (pattern.test(url)) {
        return resource;
      }
    }

    return "unknown";
  }

  /**
   * Generate statistics about the endpoints
   */
  generateStatistics(endpoints) {
    const stats = {
      totalEndpoints: endpoints.length,
      uniqueHosts: new Set(),
      methods: new Map(),
      statusCodes: new Map(),
      contentTypes: new Map(),
      averageResponseSize: 0,
      timeRange: {
        earliest: null,
        latest: null,
      },
    };

    let totalResponseSize = 0;

    endpoints.forEach((endpoint) => {
      // Count unique hosts
      try {
        const hostname = new URL(endpoint.url).hostname;
        stats.uniqueHosts.add(hostname);
      } catch {}

      // Count methods
      stats.methods.set(
        endpoint.method,
        (stats.methods.get(endpoint.method) || 0) + 1
      );

      // Count status codes
      stats.statusCodes.set(
        endpoint.status,
        (stats.statusCodes.get(endpoint.status) || 0) + 1
      );

      // Count content types
      if (endpoint.contentType && endpoint.contentType !== "unknown") {
        stats.contentTypes.set(
          endpoint.contentType,
          (stats.contentTypes.get(endpoint.contentType) || 0) + 1
        );
      }

      // Accumulate response sizes
      if (endpoint.responseSize) {
        totalResponseSize += endpoint.responseSize;
      }

      // Track time range
      if (endpoint.timestamp) {
        const timestamp = new Date(endpoint.timestamp);
        if (!stats.timeRange.earliest || timestamp < stats.timeRange.earliest) {
          stats.timeRange.earliest = timestamp;
        }
        if (!stats.timeRange.latest || timestamp > stats.timeRange.latest) {
          stats.timeRange.latest = timestamp;
        }
      }
    });

    // Calculate averages and convert sets to arrays
    stats.uniqueHosts = Array.from(stats.uniqueHosts);
    stats.methods = this.sortMapByValue(stats.methods);
    stats.statusCodes = this.sortMapByValue(stats.statusCodes);
    stats.contentTypes = this.sortMapByValue(stats.contentTypes);
    stats.averageResponseSize =
      stats.totalEndpoints > 0 ? totalResponseSize / stats.totalEndpoints : 0;

    return stats;
  }

  /**
   * Sort a Map by values in descending order
   */
  sortMapByValue(map) {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => ({ key, value }));
  }

  /**
   * Infer parameter types from sample values
   */
  inferParameterTypes(samples) {
    if (!Array.isArray(samples) || samples.length === 0) {
      return { type: "string" };
    }

    const types = new Set();
    const uniqueValues = new Set();

    samples.forEach((sample) => {
      uniqueValues.add(sample);

      if (sample === "true" || sample === "false") {
        types.add("boolean");
      } else if (!isNaN(sample) && sample !== "") {
        types.add("number");
      } else {
        types.add("string");
      }
    });

    // If all samples are the same type, return that type
    if (types.size === 1) {
      const type = Array.from(types)[0];
      return {
        type: type,
        example: Array.from(uniqueValues)[0],
      };
    }

    // Multiple types detected
    return {
      type: "string",
      anyOf: Array.from(types).map((type) => ({ type })),
      examples: Array.from(uniqueValues).slice(0, 3), // Limit examples
    };
  }

  /**
   * Generate operation ID from method and path
   */
  generateOperationId(method, path) {
    const segments = path.split("/").filter(Boolean);
    const resource = segments[segments.length - 1] || "item";

    const methodPrefix =
      {
        GET: "get",
        POST: "create",
        PUT: "update",
        DELETE: "delete",
        PATCH: "patch",
        HEAD: "head",
        OPTIONS: "options",
      }[method.toUpperCase()] || method.toLowerCase();

    return `${methodPrefix}${this.capitalize(resource)}`;
  }

  /**
   * Capitalize first letter of string
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Normalize path by replacing IDs with parameters
   */
  normalizePath(path) {
    let normalized = path;

    this.patterns.idPatterns.forEach((pattern) => {
      normalized = normalized.replace(pattern, "/{id}");
    });

    return normalized;
  }

  /**
   * Extract tags from path for OpenAPI grouping
   */
  extractTags(path) {
    const segments = path.split("/").filter(Boolean);
    const tags = [];

    if (segments.length > 0) {
      tags.push(segments[0]);
    }

    // Add additional tags for nested resources
    if (segments.length > 2) {
      tags.push(segments[1]);
    }

    return tags;
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = APIAnalyzer;
} else if (typeof window !== "undefined") {
  window.APIAnalyzer = APIAnalyzer;
}
