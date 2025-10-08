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

import { injectable, inject } from '@theia/core/shared/inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { ProductionOptimizationService } from '../common/production-optimization-service';
import {
    ProductionMetrics,
    SystemHealth,
    ProductionStats,
    OptimizationResult,
    AlertConfig,
    AlertEvent,
    CacheMetrics,
    ProductionConfig,
    HealthCheckResult
} from '../common/production-optimization-types';

/**
 * Implementation of the production optimization service
 */
@injectable()
export class ProductionOptimizationServiceImpl implements ProductionOptimizationService {

    private config: ProductionConfig;
    private isMonitoring = false;
    private metricsHistory: ProductionMetrics[] = [];
    private alertConfigs: AlertConfig[] = [];
    private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
    private stats: ProductionStats;
    private startTime = Date.now();

    // Event emitters
    private readonly onPerformanceAlertEmitter = new Emitter<AlertEvent>();
    private readonly onHealthChangedEmitter = new Emitter<SystemHealth>();
    private readonly onOptimizationAppliedEmitter = new Emitter<OptimizationResult>();
    private readonly onMetricsCollectedEmitter = new Emitter<ProductionMetrics>();

    readonly onPerformanceAlert: Event<AlertEvent> = this.onPerformanceAlertEmitter.event;
    readonly onHealthChanged: Event<SystemHealth> = this.onHealthChangedEmitter.event;
    readonly onOptimizationApplied: Event<OptimizationResult> = this.onOptimizationAppliedEmitter.event;
    readonly onMetricsCollected: Event<ProductionMetrics> = this.onMetricsCollectedEmitter.event;

    private monitoringIntervals: NodeJS.Timeout[] = [];

    constructor(
        @inject(ILogger) protected readonly logger: ILogger
    ) {
        this.config = this.getDefaultConfig();
        this.stats = this.initializeStats();
        this.logger.info('Production optimization service initialized');
    }

    async getMetrics(): Promise<ProductionMetrics> {
        const metrics = await this.collectMetrics();
        this.onMetricsCollectedEmitter.fire(metrics);
        return metrics;
    }

    async getHealth(): Promise<SystemHealth> {
        return this.performHealthCheck();
    }

    async getStats(): Promise<ProductionStats> {
        return { ...this.stats };
    }

    async startMonitoring(): Promise<void> {
        if (this.isMonitoring) {
            this.logger.warn('Monitoring is already running');
            return;
        }

        this.isMonitoring = true;
        this.logger.info('Starting production monitoring');

        // Start metrics collection
        const metricsInterval = setInterval(async () => {
            try {
                const metrics = await this.collectMetrics();
                this.metricsHistory.push(metrics);
                
                // Keep only recent metrics based on retention period
                const cutoff = Date.now() - (this.config.monitoring.retentionPeriod * 60 * 60 * 1000);
                this.metricsHistory = this.metricsHistory.filter(m => m.timestamp > cutoff);
                
                this.onMetricsCollectedEmitter.fire(metrics);
                await this.checkAlerts(metrics);
            } catch (error) {
                this.logger.error('Error collecting metrics:', error);
            }
        }, this.config.monitoring.metricsInterval * 1000);

        // Start health checks
        const healthInterval = setInterval(async () => {
            try {
                const health = await this.performHealthCheck();
                this.onHealthChangedEmitter.fire(health);
            } catch (error) {
                this.logger.error('Error performing health check:', error);
            }
        }, this.config.monitoring.healthCheckInterval * 1000);

        // Start cache cleanup
        const cacheCleanupInterval = setInterval(() => {
            this.cleanupExpiredCache();
        }, 60000); // Every minute

        this.monitoringIntervals.push(metricsInterval, healthInterval, cacheCleanupInterval);
    }

    async stopMonitoring(): Promise<void> {
        this.isMonitoring = false;
        this.monitoringIntervals.forEach(interval => clearInterval(interval));
        this.monitoringIntervals = [];
        this.logger.info('Stopped production monitoring');
    }

    async optimizePerformance(type: string): Promise<OptimizationResult> {
        this.logger.info(`Applying optimization: ${type}`);
        
        let result: OptimizationResult;
        
        switch (type) {
            case 'memory':
                result = await this.optimizeMemory();
                break;
            case 'cache':
                result = await this.optimizeCache();
                break;
            case 'connections':
                result = await this.optimizeConnections();
                break;
            case 'queries':
                result = await this.optimizeQueries();
                break;
            default:
                result = await this.performGeneralOptimization();
        }

        this.onOptimizationAppliedEmitter.fire(result);
        return result;
    }

    async configureAlerts(alerts: AlertConfig[]): Promise<void> {
        this.alertConfigs = alerts;
        this.logger.info(`Configured ${alerts.length} alert rules`);
    }

    async getCacheMetrics(): Promise<CacheMetrics> {
        const currentSize = this.calculateCacheSize();
        const entryCount = this.cache.size;
        
        // Calculate hit/miss rates (simplified)
        const hitRate = this.stats.successCount / Math.max(this.stats.totalRequests, 1) * 100;
        const missRate = 100 - hitRate;
        
        return {
            currentSize,
            entryCount,
            hitRate,
            missRate,
            evictions: 0, // Would track actual evictions in production
            memoryPressure: (currentSize / this.config.cache.maxSize) * 100
        };
    }

    async clearCache(pattern?: string): Promise<void> {
        if (pattern) {
            const regex = new RegExp(pattern);
            for (const [key] of this.cache) {
                if (regex.test(key)) {
                    this.cache.delete(key);
                }
            }
            this.logger.info(`Cleared cache entries matching pattern: ${pattern}`);
        } else {
            this.cache.clear();
            this.logger.info('Cleared entire cache');
        }
    }

    async exportMetrics(format: 'json' | 'csv', timeRange?: { start: number; end: number }): Promise<string> {
        let metrics = this.metricsHistory;
        
        if (timeRange) {
            metrics = metrics.filter(m => 
                m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
            );
        }

        if (format === 'json') {
            return JSON.stringify(metrics, null, 2);
        } else {
            return this.convertToCsv(metrics);
        }
    }

    async getConfig(): Promise<ProductionConfig> {
        return { ...this.config };
    }

    async updateConfig(config: Partial<ProductionConfig>): Promise<void> {
        this.config = { ...this.config, ...config };
        this.logger.info('Production configuration updated');
    }

    async healthCheck(): Promise<SystemHealth> {
        return this.performHealthCheck();
    }

    async forceGarbageCollection(): Promise<void> {
        if (global.gc) {
            global.gc();
            this.logger.info('Forced garbage collection');
        } else {
            this.logger.warn('Garbage collection not available');
        }
    }

    async optimizeMemory(): Promise<OptimizationResult> {
        const beforeMemory = process.memoryUsage();
        
        // Force garbage collection
        await this.forceGarbageCollection();
        
        // Clear expired cache entries
        this.cleanupExpiredCache();
        
        const afterMemory = process.memoryUsage();
        const memorySaved = beforeMemory.heapUsed - afterMemory.heapUsed;
        
        return {
            type: 'memory',
            optimization: 'Memory cleanup and garbage collection',
            improvement: (memorySaved / beforeMemory.heapUsed) * 100,
            resourceSavings: {
                heapMemory: memorySaved,
                cacheEntries: this.cache.size
            },
            timestamp: Date.now()
        };
    }

    async getResourceHistory(hours: number): Promise<ProductionMetrics[]> {
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        return this.metricsHistory.filter(m => m.timestamp > cutoff);
    }

    private async collectMetrics(): Promise<ProductionMetrics> {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        return {
            performance: {
                cpuUsage: this.calculateCpuUsagePercent(cpuUsage),
                memoryUsage: memUsage.heapUsed / (1024 * 1024), // MB
                memoryPercent: (memUsage.heapUsed / memUsage.heapTotal) * 100,
                responseTime: this.calculateAverageResponseTime(),
                throughput: this.calculateThroughput(),
                errorRate: this.calculateErrorRate()
            },
            resources: {
                activeConnections: this.getActiveConnectionCount(),
                queueDepth: 0, // Would track actual queue depth
                cacheHitRate: this.calculateCacheHitRate(),
                dbPoolUtilization: 0 // Would track actual DB pool usage
            },
            cognitive: {
                activeReasoningTasks: 0, // Would track from reasoning services
                learningOpsPerMinute: 0, // Would track from learning services
                atomSpaceSize: 0, // Would track from AtomSpace
                kbQueriesPerSecond: 0 // Would track from knowledge management
            },
            timestamp: Date.now()
        };
    }

    private async performHealthCheck(): Promise<SystemHealth> {
        const services: HealthCheckResult[] = [
            await this.checkServiceHealth('opencog-service'),
            await this.checkServiceHealth('knowledge-management'),
            await this.checkServiceHealth('reasoning-engines'),
            await this.checkServiceHealth('learning-services'),
            await this.checkServiceHealth('distributed-reasoning')
        ];

        const overallStatus = services.every(s => s.status === 'healthy') ? 'healthy' :
                             services.some(s => s.status === 'unhealthy') ? 'unhealthy' : 'degraded';

        return {
            status: overallStatus,
            services,
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            lastCheck: Date.now()
        };
    }

    private async checkServiceHealth(serviceName: string): Promise<HealthCheckResult> {
        const startTime = Date.now();
        
        try {
            // Simulate health check - in real implementation, would check actual service
            await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
            
            return {
                service: serviceName,
                status: 'healthy',
                responseTime: Date.now() - startTime,
                timestamp: Date.now()
            };
        } catch (error) {
            return {
                service: serviceName,
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                details: { error: String(error) },
                timestamp: Date.now()
            };
        }
    }

    private async checkAlerts(metrics: ProductionMetrics): Promise<void> {
        for (const alert of this.alertConfigs) {
            if (!alert.enabled) continue;

            const value = this.getMetricValue(metrics, alert.metric);
            const triggered = this.evaluateAlert(value, alert);

            if (triggered) {
                const alertEvent: AlertEvent = {
                    config: alert,
                    value,
                    message: `Alert: ${alert.name} - ${alert.metric} is ${value}, threshold: ${alert.threshold}`,
                    timestamp: Date.now(),
                    severity: alert.severity
                };

                this.onPerformanceAlertEmitter.fire(alertEvent);
            }
        }
    }

    private getMetricValue(metrics: ProductionMetrics, metricPath: string): number {
        // Simple dot notation path traversal
        const parts = metricPath.split('.');
        let value: any = metrics;
        
        for (const part of parts) {
            value = value?.[part];
        }
        
        return typeof value === 'number' ? value : 0;
    }

    private evaluateAlert(value: number, alert: AlertConfig): boolean {
        switch (alert.operator) {
            case 'gt': return value > alert.threshold;
            case 'gte': return value >= alert.threshold;
            case 'lt': return value < alert.threshold;
            case 'lte': return value <= alert.threshold;
            case 'eq': return value === alert.threshold;
            default: return false;
        }
    }

    private async optimizeCache(): Promise<OptimizationResult> {
        const beforeSize = this.cache.size;
        this.cleanupExpiredCache();
        const afterSize = this.cache.size;
        
        return {
            type: 'cache',
            optimization: 'Cache cleanup and optimization',
            improvement: ((beforeSize - afterSize) / beforeSize) * 100,
            resourceSavings: {
                cacheEntries: beforeSize - afterSize,
                memoryMB: this.calculateCacheSize()
            },
            timestamp: Date.now()
        };
    }

    private async optimizeConnections(): Promise<OptimizationResult> {
        // Simulate connection optimization
        return {
            type: 'network',
            optimization: 'Connection pooling optimization',
            improvement: 15,
            resourceSavings: {
                connections: 10,
                memoryMB: 5
            },
            timestamp: Date.now()
        };
    }

    private async optimizeQueries(): Promise<OptimizationResult> {
        // Simulate query optimization
        return {
            type: 'database',
            optimization: 'Query performance optimization',
            improvement: 25,
            resourceSavings: {
                queryTime: 100,
                cpuUsage: 10
            },
            timestamp: Date.now()
        };
    }

    private async performGeneralOptimization(): Promise<OptimizationResult> {
        // Perform multiple optimizations
        const memResult = await this.optimizeMemory();
        const cacheResult = await this.optimizeCache();
        
        return {
            type: 'cpu',
            optimization: 'General system optimization',
            improvement: (memResult.improvement + cacheResult.improvement) / 2,
            resourceSavings: {
                ...memResult.resourceSavings,
                ...cacheResult.resourceSavings
            },
            timestamp: Date.now()
        };
    }

    private cleanupExpiredCache(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
            }
        }
    }

    private calculateCacheSize(): number {
        // Simplified cache size calculation in MB
        return this.cache.size * 0.1; // Assume 0.1MB per entry
    }

    private calculateCpuUsagePercent(cpuUsage: NodeJS.CpuUsage): number {
        // Simplified CPU usage calculation
        return Math.min((cpuUsage.user + cpuUsage.system) / 1000000, 100);
    }

    private calculateAverageResponseTime(): number {
        // Simplified response time calculation
        return 50 + Math.random() * 50; // 50-100ms
    }

    private calculateThroughput(): number {
        // Simplified throughput calculation
        return Math.floor(this.stats.totalRequests / Math.max((Date.now() - this.startTime) / 1000, 1));
    }

    private calculateErrorRate(): number {
        return (this.stats.errorCount / Math.max(this.stats.totalRequests, 1)) * 100;
    }

    private getActiveConnectionCount(): number {
        // Simplified connection count
        return 10 + Math.floor(Math.random() * 20);
    }

    private calculateCacheHitRate(): number {
        return (this.stats.successCount / Math.max(this.stats.totalRequests, 1)) * 100;
    }

    private convertToCsv(metrics: ProductionMetrics[]): string {
        if (metrics.length === 0) return '';

        const headers = [
            'timestamp', 'cpuUsage', 'memoryUsage', 'memoryPercent', 'responseTime',
            'throughput', 'errorRate', 'activeConnections', 'queueDepth', 'cacheHitRate'
        ];

        const rows = metrics.map(m => [
            m.timestamp,
            m.performance.cpuUsage,
            m.performance.memoryUsage,
            m.performance.memoryPercent,
            m.performance.responseTime,
            m.performance.throughput,
            m.performance.errorRate,
            m.resources.activeConnections,
            m.resources.queueDepth,
            m.resources.cacheHitRate
        ]);

        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    private getDefaultConfig(): ProductionConfig {
        return {
            monitoring: {
                metricsInterval: 30,
                healthCheckInterval: 60,
                retentionPeriod: 24,
                detailedLogging: false
            },
            performance: {
                connectionPooling: true,
                maxConcurrentOps: 100,
                requestTimeout: 30,
                compression: true
            },
            cache: {
                maxSize: 500,
                ttl: 60,
                evictionStrategy: 'lru',
                compression: false
            },
            alerts: [],
            limits: {
                maxMemory: 1024,
                maxCpuUsage: 80,
                maxQueueDepth: 1000
            }
        };
    }

    private initializeStats(): ProductionStats {
        return {
            uptime: 0,
            totalRequests: 0,
            avgResponseTime: 0,
            peakMemoryUsage: 0,
            errorCount: 0,
            successCount: 0
        };
    }
}