/*
 * Copyright (C) 2024 Theia contributors.
 *
 * Licensed under the Eclipse Public License 2.0 (EPL-2.0);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.eclipse.org/legal/epl-2.0
 */

import { injectable, inject } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common';
import { ProductionConfigurationService } from './production-configuration';

export interface ProductionMetrics {
    timestamp: Date;
    system: {
        cpuUsage: number;
        memoryUsage: number;
        memoryTotal: number;
        diskUsage: number;
        diskTotal: number;
        uptime: number;
    };
    application: {
        responseTime: number;
        throughput: number;
        errorRate: number;
        activeConnections: number;
        cognitiveOperations: number;
    };
    cognitive: {
        reasoningOperations: number;
        learningEvents: number;
        knowledgeBaseSize: number;
        averageInferenceTime: number;
        cacheHitRate: number;
    };
}

export interface LogEntry {
    timestamp: Date;
    level: 'error' | 'warn' | 'info' | 'debug';
    category: string;
    message: string;
    data?: any;
    context?: {
        userId?: string;
        sessionId?: string;
        operation?: string;
    };
}

export interface UsageAnalytics {
    period: {
        start: Date;
        end: Date;
    };
    users: {
        total: number;
        active: number;
        new: number;
    };
    features: {
        [feature: string]: {
            usageCount: number;
            uniqueUsers: number;
            averageSessionTime: number;
        };
    };
    cognitive: {
        totalOperations: number;
        operationsByType: { [type: string]: number };
        averageResponseTime: number;
        successRate: number;
    };
}

export interface Alert {
    id: string;
    type: 'performance' | 'error' | 'usage' | 'system';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
    acknowledged: boolean;
    resolved: boolean;
    data?: any;
}

/**
 * Enhanced production monitoring and logging service
 */
@injectable()
export class ProductionMonitoringService {

    private readonly onMetricsUpdatedEmitter = new Emitter<ProductionMetrics>();
    private readonly onAlertEmitter = new Emitter<Alert>();
    private readonly onUsageUpdateEmitter = new Emitter<UsageAnalytics>();

    private metricsHistory: ProductionMetrics[] = [];
    private logEntries: LogEntry[] = [];
    private alerts: Alert[] = [];
    private usageData = new Map<string, any>();
    private monitoringActive = false;
    private metricsInterval: NodeJS.Timeout | undefined;

    readonly onMetricsUpdated: Event<ProductionMetrics> = this.onMetricsUpdatedEmitter.event;
    readonly onAlert: Event<Alert> = this.onAlertEmitter.event;
    readonly onUsageUpdate: Event<UsageAnalytics> = this.onUsageUpdateEmitter.event;

    constructor(
        @inject(ProductionConfigurationService) protected readonly configService: ProductionConfigurationService
    ) {}

    /**
     * Start production monitoring
     */
    async startMonitoring(): Promise<void> {
        if (this.monitoringActive) {
            return;
        }

        const config = await this.configService.getConfiguration();
        if (!config.monitoring.enabled) {
            this.log('warn', 'monitoring', 'Monitoring is disabled in configuration');
            return;
        }

        this.monitoringActive = true;
        this.metricsInterval = setInterval(
            () => this.collectMetrics(),
            config.monitoring.metricsInterval
        );

        this.log('info', 'monitoring', 'Production monitoring started');
    }

    /**
     * Stop production monitoring
     */
    async stopMonitoring(): Promise<void> {
        if (!this.monitoringActive) {
            return;
        }

        this.monitoringActive = false;
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
            this.metricsInterval = undefined;
        }

        this.log('info', 'monitoring', 'Production monitoring stopped');
    }

    /**
     * Collect current metrics
     */
    async collectMetrics(): Promise<ProductionMetrics> {
        const metrics: ProductionMetrics = {
            timestamp: new Date(),
            system: await this.collectSystemMetrics(),
            application: await this.collectApplicationMetrics(),
            cognitive: await this.collectCognitiveMetrics()
        };

        // Store metrics
        this.metricsHistory.push(metrics);
        
        // Keep only last 1000 entries
        if (this.metricsHistory.length > 1000) {
            this.metricsHistory = this.metricsHistory.slice(-1000);
        }

        // Check for alerts
        await this.checkAlerts(metrics);

        // Emit metrics update
        this.onMetricsUpdatedEmitter.fire(metrics);

        return metrics;
    }

    /**
     * Log an entry
     */
    log(level: 'error' | 'warn' | 'info' | 'debug', category: string, message: string, data?: any, context?: any): void {
        const entry: LogEntry = {
            timestamp: new Date(),
            level,
            category,
            message,
            data,
            context
        };

        this.logEntries.push(entry);

        // Keep only last 10000 entries
        if (this.logEntries.length > 10000) {
            this.logEntries = this.logEntries.slice(-10000);
        }

        // Console output based on log level
        const logMessage = `[${entry.timestamp.toISOString()}] ${level.toUpperCase()} [${category}] ${message}`;
        switch (level) {
            case 'error':
                console.error(logMessage, data);
                break;
            case 'warn':
                console.warn(logMessage, data);
                break;
            case 'info':
                console.info(logMessage, data);
                break;
            case 'debug':
                console.debug(logMessage, data);
                break;
        }

        // Create alert for errors
        if (level === 'error') {
            this.createAlert('error', 'critical', `Error in ${category}: ${message}`, data);
        }
    }

    /**
     * Track usage analytics
     */
    trackUsage(userId: string, feature: string, sessionTime: number, operation?: string): void {
        const key = `${userId}:${feature}`;
        const existing = this.usageData.get(key) || {
            userId,
            feature,
            usageCount: 0,
            totalSessionTime: 0,
            operations: []
        };

        existing.usageCount++;
        existing.totalSessionTime += sessionTime;
        if (operation) {
            existing.operations.push(operation);
        }

        this.usageData.set(key, existing);

        this.log('debug', 'usage', `User ${userId} used ${feature} for ${sessionTime}ms`, { operation });
    }

    /**
     * Generate usage analytics report
     */
    async generateUsageAnalytics(startDate: Date, endDate: Date): Promise<UsageAnalytics> {
        const filteredLogs = this.logEntries.filter(entry => 
            entry.timestamp >= startDate && 
            entry.timestamp <= endDate &&
            entry.category === 'usage'
        );

        const uniqueUsers = new Set<string>();
        const featureUsage = new Map<string, { usageCount: number; users: Set<string>; totalTime: number }>();
        const cognitiveOps = new Map<string, number>();
        let totalCognitiveOps = 0;
        let totalResponseTime = 0;
        let responseTimeCount = 0;

        // Process usage data
        for (const [, data] of this.usageData) {
            uniqueUsers.add(data.userId);
            
            const feature = featureUsage.get(data.feature) || { 
                usageCount: 0, 
                users: new Set(), 
                totalTime: 0 
            };
            feature.usageCount += data.usageCount;
            feature.users.add(data.userId);
            feature.totalTime += data.totalSessionTime;
            featureUsage.set(data.feature, feature);

            // Count cognitive operations
            for (const op of data.operations) {
                if (op.startsWith('cognitive:')) {
                    const opType = op.replace('cognitive:', '');
                    cognitiveOps.set(opType, (cognitiveOps.get(opType) || 0) + 1);
                    totalCognitiveOps++;
                }
            }
        }

        // Calculate response times from metrics
        for (const metrics of this.metricsHistory) {
            if (metrics.timestamp >= startDate && metrics.timestamp <= endDate) {
                totalResponseTime += metrics.application.responseTime;
                responseTimeCount++;
            }
        }

        const features: { [feature: string]: any } = {};
        for (const [feature, data] of featureUsage) {
            features[feature] = {
                usageCount: data.usageCount,
                uniqueUsers: data.users.size,
                averageSessionTime: data.totalTime / data.usageCount
            };
        }

        const analytics: UsageAnalytics = {
            period: { start: startDate, end: endDate },
            users: {
                total: uniqueUsers.size,
                active: uniqueUsers.size, // Simplified - in reality would need more sophisticated tracking
                new: Math.floor(uniqueUsers.size * 0.2) // Simplified estimation
            },
            features,
            cognitive: {
                totalOperations: totalCognitiveOps,
                operationsByType: Object.fromEntries(cognitiveOps),
                averageResponseTime: responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0,
                successRate: 0.95 // Simplified - would calculate from actual error rates
            }
        };

        this.onUsageUpdateEmitter.fire(analytics);
        return analytics;
    }

    /**
     * Get recent metrics
     */
    getRecentMetrics(count: number = 10): ProductionMetrics[] {
        return this.metricsHistory.slice(-count);
    }

    /**
     * Get log entries
     */
    getLogEntries(level?: string, category?: string, limit: number = 100): LogEntry[] {
        let filtered = this.logEntries;
        
        if (level) {
            filtered = filtered.filter(entry => entry.level === level);
        }
        if (category) {
            filtered = filtered.filter(entry => entry.category === category);
        }
        
        return filtered.slice(-limit);
    }

    /**
     * Get active alerts
     */
    getActiveAlerts(): Alert[] {
        return this.alerts.filter(alert => !alert.resolved);
    }

    /**
     * Acknowledge an alert
     */
    acknowledgeAlert(alertId: string): void {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            this.log('info', 'monitoring', `Alert ${alertId} acknowledged`);
        }
    }

    /**
     * Resolve an alert
     */
    resolveAlert(alertId: string): void {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.resolved = true;
            alert.acknowledged = true;
            this.log('info', 'monitoring', `Alert ${alertId} resolved`);
        }
    }

    private async collectSystemMetrics(): Promise<ProductionMetrics['system']> {
        // Simulate system metrics collection
        // In a real implementation, this would use actual system monitoring
        return {
            cpuUsage: Math.random() * 80 + 10, // 10-90%
            memoryUsage: Math.random() * 2048 + 512, // 512-2560 MB
            memoryTotal: 4096,
            diskUsage: Math.random() * 50 + 20, // 20-70 GB
            diskTotal: 100,
            uptime: Date.now() - (Math.random() * 86400000) // Random uptime up to 24 hours
        };
    }

    private async collectApplicationMetrics(): Promise<ProductionMetrics['application']> {
        // Simulate application metrics collection
        return {
            responseTime: Math.random() * 200 + 50, // 50-250ms
            throughput: Math.random() * 1000 + 100, // 100-1100 requests/min
            errorRate: Math.random() * 5, // 0-5%
            activeConnections: Math.floor(Math.random() * 100 + 10), // 10-110 connections
            cognitiveOperations: Math.floor(Math.random() * 50 + 5) // 5-55 ops/min
        };
    }

    private async collectCognitiveMetrics(): Promise<ProductionMetrics['cognitive']> {
        // Simulate cognitive metrics collection
        return {
            reasoningOperations: Math.floor(Math.random() * 20 + 5), // 5-25 ops/min
            learningEvents: Math.floor(Math.random() * 10 + 1), // 1-11 events/min
            knowledgeBaseSize: Math.floor(Math.random() * 10000 + 5000), // 5000-15000 facts
            averageInferenceTime: Math.random() * 100 + 10, // 10-110ms
            cacheHitRate: Math.random() * 30 + 70 // 70-100%
        };
    }

    private async checkAlerts(metrics: ProductionMetrics): Promise<void> {
        const config = await this.configService.getConfiguration();
        if (!config.monitoring.alerting) {
            return;
        }

        // Check CPU usage
        if (metrics.system.cpuUsage > config.performance.cpuThreshold) {
            this.createAlert(
                'performance',
                metrics.system.cpuUsage > 90 ? 'critical' : 'high',
                `High CPU usage: ${metrics.system.cpuUsage.toFixed(1)}%`,
                { cpuUsage: metrics.system.cpuUsage, threshold: config.performance.cpuThreshold }
            );
        }

        // Check memory usage
        const memoryPercent = (metrics.system.memoryUsage / metrics.system.memoryTotal) * 100;
        if (memoryPercent > 80) {
            this.createAlert(
                'performance',
                memoryPercent > 95 ? 'critical' : 'high',
                `High memory usage: ${memoryPercent.toFixed(1)}%`,
                { memoryUsage: metrics.system.memoryUsage, memoryTotal: metrics.system.memoryTotal }
            );
        }

        // Check response time
        if (metrics.application.responseTime > config.performance.responseTimeThreshold) {
            this.createAlert(
                'performance',
                'medium',
                `High response time: ${metrics.application.responseTime.toFixed(0)}ms`,
                { responseTime: metrics.application.responseTime, threshold: config.performance.responseTimeThreshold }
            );
        }

        // Check error rate
        if (metrics.application.errorRate > 5) {
            this.createAlert(
                'error',
                metrics.application.errorRate > 10 ? 'critical' : 'high',
                `High error rate: ${metrics.application.errorRate.toFixed(1)}%`,
                { errorRate: metrics.application.errorRate }
            );
        }
    }

    private createAlert(type: Alert['type'], severity: Alert['severity'], message: string, data?: any): void {
        // Check if similar alert already exists
        const existingAlert = this.alerts.find(alert => 
            !alert.resolved && 
            alert.type === type && 
            alert.message === message
        );

        if (existingAlert) {
            return; // Don't create duplicate alerts
        }

        const alert: Alert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            severity,
            message,
            timestamp: new Date(),
            acknowledged: false,
            resolved: false,
            data
        };

        this.alerts.push(alert);
        this.onAlertEmitter.fire(alert);

        this.log('warn', 'monitoring', `Alert created: ${message}`, data);
    }
}