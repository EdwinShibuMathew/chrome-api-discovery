/**
 * OpenAPI Generator - Utilities for generating OpenAPI 3.0+ specifications
 * Pure utility functions that can be unit tested
 */

class OpenAPIGenerator {
    constructor() {
        this.schemaCache = new Map();
        this.operationIdCache = new Set();
    }

    /**
     * Generate a complete OpenAPI specification from discovered endpoints
     */
    generateOpenAPISpec(endpoints, options = {}) {
        if (!Array.isArray(endpoints) || endpoints.length === 0) {
            return this.generateEmptySpec();
        }

        const analysis = this.analyzeEndpoints(endpoints);
        const baseURL = this.determineBaseURL(endpoints);
        
        return {
            openapi: '3.0.3',
            info: this.generateInfo(options),
            servers: this.generateServers(baseURL, endpoints),
            paths: this.generatePaths(endpoints, analysis),
            components: this.generateComponents(endpoints, analysis),
            tags: this.generateTags(analysis),
            ...this.generateExtensions(endpoints, options)
        };
    }

    /**
     * Generate empty OpenAPI spec when no endpoints are available
     */
    generateEmptySpec() {
        return {
            openapi: '3.0.3',
            info: {
                title: 'Discovered API',
                version: '0.1.0',
                description: 'No API endpoints discovered yet. Start discovery to generate specifications.'
            },
            servers: [{ url: 'https://example.com' }],
            paths: {},
            components: {
                schemas: {}
            },
            tags: []
        };
    }

    /**
     * Generate API info section
     */
    generateInfo(options = {}) {
        return {
            title: options.title || 'Discovered API',
            version: options.version || '0.1.0',
            description: options.description || 'API discovered automatically by Chrome Extension',
            contact: options.contact || {
                name: 'API Discovery Extension',
                url: 'https://github.com/yourusername/chrome-api-discovery'
            },
            license: options.license || {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        };
    }

    /**
     * Generate servers section
     */
    generateServers(baseURL, endpoints) {
        const servers = [{ url: baseURL }];
        
        // Add additional servers if multiple hosts are discovered
        const uniqueHosts = [...new Set(endpoints.map(e => {
            try {
                return new URL(e.url).origin;
            } catch {
                return null;
            }
        }).filter(Boolean))];

        if (uniqueHosts.length > 1) {
            uniqueHosts.forEach(host => {
                if (host !== baseURL) {
                    servers.push({ url: host });
                }
            });
        }

        return servers;
    }

    /**
     * Determine the base URL from discovered endpoints
     */
    determineBaseURL(endpoints) {
        if (endpoints.length === 0) return 'https://example.com';
        
        try {
            const url = new URL(endpoints[0].url);
            return `${url.protocol}//${url.hostname}`;
        } catch {
            return 'https://example.com';
        }
    }

    /**
     * Generate paths section from endpoints
     */
    generatePaths(endpoints, analysis) {
        const paths = {};
        
        endpoints.forEach(endpoint => {
            const path = this.normalizePath(endpoint.pathname);
            const method = endpoint.method.toLowerCase();
            
            if (!paths[path]) {
                paths[path] = {};
            }
            
            paths[path][method] = this.generateOperation(endpoint, analysis);
        });
        
        return paths;
    }

    /**
     * Normalize path by replacing IDs with parameters
     */
    normalizePath(pathname) {
        // Replace numeric IDs with {id} parameter
        let normalized = pathname.replace(/\/(\d+)(?=\/|$)/g, '/{id}');
        
        // Replace UUIDs with {uuid} parameter
        normalized = normalized.replace(/\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})(?=\/|$)/gi, '/{uuid}');
        
        // Replace MongoDB ObjectIds with {objectId} parameter
        normalized = normalized.replace(/\/([a-f0-9]{24})(?=\/|$)/gi, '/{objectId}');
        
        return normalized;
    }

    /**
     * Generate operation object for a specific endpoint
     */
    generateOperation(endpoint, analysis) {
        const operation = {
            operationId: this.generateUniqueOperationId(endpoint.method, endpoint.pathname),
            tags: this.generateOperationTags(endpoint.pathname),
            summary: this.generateOperationSummary(endpoint),
            description: this.generateOperationDescription(endpoint),
            parameters: this.generateParameters(endpoint),
            responses: this.generateResponses(endpoint),
            security: this.generateSecurity(endpoint)
        };

        // Add request body for POST/PUT/PATCH methods
        if (['post', 'put', 'patch'].includes(endpoint.method.toLowerCase())) {
            operation.requestBody = this.generateRequestBody(endpoint);
        }

        return operation;
    }

    /**
     * Generate unique operation ID
     */
    generateUniqueOperationId(method, pathname) {
        const segments = pathname.split('/').filter(Boolean);
        const resource = segments[segments.length - 1] || 'item';
        
        const methodPrefix = {
            'GET': 'get',
            'POST': 'create',
            'PUT': 'update',
            'DELETE': 'delete',
            'PATCH': 'patch',
            'HEAD': 'head',
            'OPTIONS': 'options'
        }[method.toUpperCase()] || method.toLowerCase();

        let operationId = `${methodPrefix}${this.capitalize(resource)}`;
        
        // Ensure uniqueness
        let counter = 1;
        while (this.operationIdCache.has(operationId)) {
            operationId = `${methodPrefix}${this.capitalize(resource)}${counter}`;
            counter++;
        }
        
        this.operationIdCache.add(operationId);
        return operationId;
    }

    /**
     * Generate operation tags
     */
    generateOperationTags(pathname) {
        const segments = pathname.split('/').filter(Boolean);
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

    /**
     * Generate operation summary
     */
    generateOperationSummary(endpoint) {
        const method = endpoint.method.toUpperCase();
        const resource = this.extractResourceName(endpoint.pathname);
        
        switch (method) {
            case 'GET': return `Retrieve ${resource}`;
            case 'POST': return `Create ${resource}`;
            case 'PUT': return `Update ${resource}`;
            case 'DELETE': return `Delete ${resource}`;
            case 'PATCH': return `Partially update ${resource}`;
            default: return `${method} ${resource}`;
        }
    }

    /**
     * Generate operation description
     */
    generateOperationDescription(endpoint) {
        const method = endpoint.method.toUpperCase();
        const resource = this.extractResourceName(endpoint.pathname);
        const path = endpoint.pathname;
        
        return `${method} operation for ${resource} at ${path}. Discovered automatically by API Discovery extension.`;
    }

    /**
     * Extract resource name from path
     */
    extractResourceName(pathname) {
        const segments = pathname.split('/').filter(Boolean);
        return segments[segments.length - 1] || 'resource';
    }

    /**
     * Generate parameters for the operation
     */
    generateParameters(endpoint) {
        const parameters = [];
        
        // Path parameters
        const pathParams = this.extractPathParameters(endpoint.pathname);
        pathParams.forEach(param => {
            parameters.push({
                name: param.name,
                in: 'path',
                required: true,
                schema: { type: param.type },
                description: `Identifier for ${param.resource}`
            });
        });
        
        // Query parameters
        if (endpoint.searchParams) {
            Object.entries(endpoint.searchParams).forEach(([name, value]) => {
                parameters.push({
                    name: name,
                    in: 'query',
                    required: false,
                    schema: this.inferParameterType(value),
                    example: value,
                    description: `Query parameter: ${name}`
                });
            });
        }
        
        return parameters;
    }

    /**
     * Extract path parameters from URL
     */
    extractPathParameters(pathname) {
        const params = [];
        const segments = pathname.split('/');
        
        segments.forEach((segment, index) => {
            if (segment.match(/^\d+$/)) {
                params.push({
                    name: 'id',
                    type: 'integer',
                    resource: this.getResourceFromSegment(segments, index)
                });
            } else if (segment.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i)) {
                params.push({
                    name: 'uuid',
                    type: 'string',
                    format: 'uuid',
                    resource: this.getResourceFromSegment(segments, index)
                });
            } else if (segment.match(/^[a-f0-9]{24}$/i)) {
                params.push({
                    name: 'objectId',
                    type: 'string',
                    resource: this.getResourceFromSegment(segments, index)
                });
            }
        });
        
        return params;
    }

    /**
     * Get resource name from segment context
     */
    getResourceFromSegment(segments, index) {
        if (index > 0) {
            return segments[index - 1];
        }
        return 'resource';
    }

    /**
     * Infer parameter type from sample value
     */
    inferParameterType(value) {
        if (value === 'true' || value === 'false') {
            return { type: 'boolean' };
        }
        
        if (!isNaN(value) && value !== '') {
            return { type: 'number' };
        }
        
        return { type: 'string' };
    }

    /**
     * Generate responses section
     */
    generateResponses(endpoint) {
        const responses = {};
        
        // Add the actual response status
        responses[endpoint.status] = {
            description: this.getStatusDescription(endpoint.status),
            content: this.generateResponseContent(endpoint)
        };
        
        // Add common error responses
        if (endpoint.status >= 400) {
            responses['4xx'] = {
                description: 'Client error',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' }
                    }
                }
            };
        }
        
        if (endpoint.status >= 500) {
            responses['5xx'] = {
                description: 'Server error',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' }
                    }
                }
            };
        }
        
        return responses;
    }

    /**
     * Generate response content
     */
    generateResponseContent(endpoint) {
        const content = {};
        
        if (endpoint.contentType && endpoint.contentType !== 'unknown') {
            content[endpoint.contentType] = {
                schema: this.generateResponseSchema(endpoint)
            };
        } else {
            // Default to JSON if content type is unknown
            content['application/json'] = {
                schema: this.generateResponseSchema(endpoint)
            };
        }
        
        return content;
    }

    /**
     * Generate response schema
     */
    generateResponseSchema(endpoint) {
        const resource = this.extractResourceName(endpoint.pathname);
        const schemaName = this.capitalize(resource);
        
        // Try to use existing schema
        if (this.schemaCache.has(schemaName)) {
            return { $ref: `#/components/schemas/${schemaName}` };
        }
        
        // Generate new schema
        const schema = {
            type: 'object',
            properties: {
                id: { type: 'string', example: '123' },
                name: { type: 'string', example: `Example ${resource}` }
            }
        };
        
        this.schemaCache.set(schemaName, schema);
        return { $ref: `#/components/schemas/${schemaName}` };
    }

    /**
     * Generate request body for POST/PUT/PATCH operations
     */
    generateRequestBody(endpoint) {
        const resource = this.extractResourceName(endpoint.pathname);
        
        return {
            required: true,
            content: {
                'application/json': {
                    schema: {
                        $ref: `#/components/schemas/${this.capitalize(resource)}Input`
                    }
                }
            }
        };
    }

    /**
     * Generate security requirements
     */
    generateSecurity(endpoint) {
        // Check if endpoint has authentication headers
        if (endpoint.headers && Object.keys(endpoint.headers).some(h => 
            h.toLowerCase().includes('authorization') || 
            h.toLowerCase().includes('api-key') ||
            h.toLowerCase().includes('token')
        )) {
            return [{ bearerAuth: [] }];
        }
        
        return [];
    }

    /**
     * Generate components section
     */
    generateComponents(endpoints, analysis) {
        return {
            schemas: this.generateSchemas(endpoints, analysis),
            securitySchemes: this.generateSecuritySchemes(endpoints)
        };
    }

    /**
     * Generate schemas
     */
    generateSchemas(endpoints, analysis) {
        const schemas = {};
        
        // Generate schemas for discovered resources
        analysis.groups.forEach(group => {
            const resourceName = this.extractResourceName(group.patterns[0]);
            const schemaName = this.capitalize(resourceName);
            
            schemas[schemaName] = {
                type: 'object',
                properties: {
                    id: { type: 'string', example: '123' },
                    name: { type: 'string', example: `Example ${resourceName}` }
                }
            };
            
            // Add input schema for POST/PUT operations
            schemas[`${schemaName}Input`] = {
                type: 'object',
                properties: {
                    name: { type: 'string', example: `Example ${resourceName}` }
                },
                required: ['name']
            };
        });
        
        // Add common schemas
        schemas['Error'] = {
            type: 'object',
            properties: {
                error: { type: 'string', example: 'Error message' },
                code: { type: 'string', example: 'ERROR_CODE' },
                details: { type: 'object' }
            }
        };
        
        return schemas;
    }

    /**
     * Generate security schemes
     */
    generateSecuritySchemes(endpoints) {
        const schemes = {};
        
        // Check for common authentication patterns
        const hasAuth = endpoints.some(e => 
            e.headers && Object.keys(e.headers).some(h => 
                h.toLowerCase().includes('authorization')
            )
        );
        
        if (hasAuth) {
            schemes['bearerAuth'] = {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            };
        }
        
        return schemes;
    }

    /**
     * Generate tags section
     */
    generateTags(analysis) {
        return analysis.groups.map(group => ({
            name: this.extractResourceName(group.patterns[0]),
            description: `Operations for ${this.extractResourceName(group.patterns[0])} resources`
        }));
    }

    /**
     * Generate extensions for additional metadata
     */
    generateExtensions(endpoints, options) {
        const extensions = {};
        
        if (options.sourceUrl) {
            extensions['x-jentic-source-url'] = options.sourceUrl;
        }
        
        extensions['x-discovery-metadata'] = {
            totalEndpoints: endpoints.length,
            discoveryDate: new Date().toISOString(),
            extensionVersion: '0.1.0'
        };
        
        return extensions;
    }

    /**
     * Get status description
     */
    getStatusDescription(status) {
        const descriptions = {
            200: 'OK',
            201: 'Created',
            204: 'No Content',
            400: 'Bad Request',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Not Found',
            409: 'Conflict',
            422: 'Unprocessable Entity',
            429: 'Too Many Requests',
            500: 'Internal Server Error',
            502: 'Bad Gateway',
            503: 'Service Unavailable'
        };
        
        return descriptions[status] || 'Response';
    }

    /**
     * Capitalize first letter of string
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Analyze endpoints for patterns and grouping
     */
    analyzeEndpoints(endpoints) {
        // This would typically use the APIAnalyzer class
        // For now, provide a basic analysis
        const groups = new Map();
        
        endpoints.forEach(endpoint => {
            const path = this.normalizePath(endpoint.pathname);
            const key = path.split('/')[1] || 'default';
            
            if (!groups.has(key)) {
                groups.set(key, { patterns: [] });
            }
            
            groups.get(key).patterns.push(path);
        });
        
        return {
            groups: Array.from(groups.entries()).map(([key, value]) => ({
                name: key,
                patterns: value.patterns
            }))
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OpenAPIGenerator;
} else if (typeof window !== 'undefined') {
    window.OpenAPIGenerator = OpenAPIGenerator;
}
