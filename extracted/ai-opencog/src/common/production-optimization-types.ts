// *****************************************************************************
// Copyright (C) 2024 Eclipse Foundation and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

/**
 * Production optimization types and interfaces for the SKZ Framework
 */

export interface ProductionMetrics {
    /** System performance metrics */
    performance: {
        /** CPU usage percentage */
        cpuUsage: number;
        /** Memory usage in MB */
        memoryUsage: number;
        /** Memory usage percentage */
        memoryPercent: number;
        /** Average response time in ms */
        responseTime: number;
        /** Requests per second */
        throughput: number;
        /** Error rate percentage */
        errorRate: number;
    };
    
    /** Resource utilization metrics */
    resources: {
        /** Active connections count */
        activeConnections: number;
        /** Queue depth for pending tasks */
        queueDepth: number;
        /** Cache hit rate percentage */
        cacheHitRate: number;
        /** Database connection pool utilization */
        dbPoolUtilization: number;
    };
    
    /** Cognitive service specific metrics */
    cognitive: {
        /** Active reasoning tasks */
        activeReasoningTasks: number;
        /** Learning operations per minute */
        learningOpsPerMinute: number;
        /** AtomSpace size */
        atomSpaceSize: number;
        /** Knowledge base queries per second */
        kbQueriesPerSecond: number;
    };
    
    /** Timestamp of metrics collection */
    timestamp: number;
}

export interface HealthCheckResult {
    /** Service name */
    service: string;
    /** Health status */
    status: 'healthy' | 'degraded' | 'unhealthy';
    /** Response time in ms */
    responseTime: number;
    /** Additional details */
    details?: Record<string, any>;
    /** Timestamp of health check */
    timestamp: number;
}

export interface SystemHealth {
    /** Overall system status */
    status: 'healthy' | 'degraded' | 'unhealthy';
    /** Individual service health checks */
    services: HealthCheckResult[];
    /** System uptime in seconds */
    uptime: number;
    /** Last check timestamp */
    lastCheck: number;
}

export interface AlertConfig {
    /** Alert name */
    name: string;
    /** Metric to monitor */
    metric: string;
    /** Threshold value */
    threshold: number;
    /** Comparison operator */
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    /** Alert severity */
    severity: 'critical' | 'warning' | 'info';
    /** Cooldown period in minutes */
    cooldown: number;
    /** Whether alert is enabled */
    enabled: boolean;
}

export interface AlertEvent {
    /** Alert configuration */
    config: AlertConfig;
    /** Current metric value */
    value: number;
    /** Alert message */
    message: string;
    /** Timestamp of alert */
    timestamp: number;
    /** Alert severity */
    severity: 'critical' | 'warning' | 'info';
}

export interface CacheConfig {
    /** Maximum cache size in MB */
    maxSize: number;
    /** Time to live in minutes */
    ttl: number;
    /** Cache eviction strategy */
    evictionStrategy: 'lru' | 'lfu' | 'fifo';
    /** Enable cache compression */
    compression: boolean;
}

export interface CacheMetrics {
    /** Current cache size in MB */
    currentSize: number;
    /** Number of entries in cache */
    entryCount: number;
    /** Cache hit rate percentage */
    hitRate: number;
    /** Cache miss rate percentage */
    missRate: number;
    /** Eviction count */
    evictions: number;
    /** Memory pressure percentage */
    memoryPressure: number;
}

export interface ProductionConfig {
    /** Monitoring configuration */
    monitoring: {
        /** Metrics collection interval in seconds */
        metricsInterval: number;
        /** Health check interval in seconds */
        healthCheckInterval: number;
        /** Retention period for metrics in hours */
        retentionPeriod: number;
        /** Enable detailed logging */
        detailedLogging: boolean;
    };
    
    /** Performance optimization settings */
    performance: {
        /** Enable connection pooling */
        connectionPooling: boolean;
        /** Maximum concurrent operations */
        maxConcurrentOps: number;
        /** Request timeout in seconds */
        requestTimeout: number;
        /** Enable compression */
        compression: boolean;
    };
    
    /** Cache configuration */
    cache: CacheConfig;
    
    /** Alert configurations */
    alerts: AlertConfig[];
    
    /** Resource limits */
    limits: {
        /** Maximum memory usage in MB */
        maxMemory: number;
        /** Maximum CPU usage percentage */
        maxCpuUsage: number;
        /** Maximum queue depth */
        maxQueueDepth: number;
    };
}

export interface OptimizationResult {
    /** Optimization type */
    type: 'cache' | 'memory' | 'cpu' | 'network' | 'database';
    /** Applied optimization */
    optimization: string;
    /** Performance improvement percentage */
    improvement: number;
    /** Resource savings */
    resourceSavings: Record<string, number>;
    /** Timestamp of optimization */
    timestamp: number;
}

export interface ProductionStats {
    /** System uptime in seconds */
    uptime: number;
    /** Total requests handled */
    totalRequests: number;
    /** Average response time in ms */
    avgResponseTime: number;
    /** Peak memory usage in MB */
    peakMemoryUsage: number;
    /** Error count */
    errorCount: number;
    /** Successful operations count */
    successCount: number;
}

/**
 * Production monitoring and optimization service interface
 */
export interface ProductionOptimizationService {
    /** Get current system metrics */
    getMetrics(): Promise<ProductionMetrics>;
    
    /** Get system health status */
    getHealth(): Promise<SystemHealth>;
    
    /** Get production statistics */
    getStats(): Promise<ProductionStats>;
    
    /** Start monitoring services */
    startMonitoring(): Promise<void>;
    
    /** Stop monitoring services */
    stopMonitoring(): Promise<void>;
    
    /** Apply performance optimization */
    optimizePerformance(type: string): Promise<OptimizationResult>;
    
    /** Configure alerts */
    configureAlerts(alerts: AlertConfig[]): Promise<void>;
    
    /** Get cache metrics */
    getCacheMetrics(): Promise<CacheMetrics>;
    
    /** Clear cache */
    clearCache(pattern?: string): Promise<void>;
    
    /** Export metrics data */
    exportMetrics(format: 'json' | 'csv', timeRange?: { start: number; end: number }): Promise<string>;
}

export const PRODUCTION_OPTIMIZATION_SERVICE_PATH = '/services/production-optimization';

export interface ProductionOptimizationEvents {
    /** Emitted when a performance threshold is exceeded */
    onPerformanceAlert: AlertEvent;
    /** Emitted when system health changes */
    onHealthChanged: SystemHealth;
    /** Emitted when optimization is applied */
    onOptimizationApplied: OptimizationResult;
    /** Emitted when metrics are collected */
    onMetricsCollected: ProductionMetrics;
}