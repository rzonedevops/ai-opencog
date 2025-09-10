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

import { Event } from '@theia/core/lib/common/event';
import {
    ProductionMetrics,
    SystemHealth,
    ProductionStats,
    OptimizationResult,
    AlertConfig,
    AlertEvent,
    CacheMetrics,
    ProductionConfig
} from './production-optimization-types';

/**
 * Service interface for production optimization and monitoring
 */
export interface ProductionOptimizationService {
    /**
     * Get current system performance metrics
     */
    getMetrics(): Promise<ProductionMetrics>;
    
    /**
     * Get system health status
     */
    getHealth(): Promise<SystemHealth>;
    
    /**
     * Get production statistics
     */
    getStats(): Promise<ProductionStats>;
    
    /**
     * Start monitoring services
     */
    startMonitoring(): Promise<void>;
    
    /**
     * Stop monitoring services
     */
    stopMonitoring(): Promise<void>;
    
    /**
     * Apply performance optimization
     */
    optimizePerformance(type: string): Promise<OptimizationResult>;
    
    /**
     * Configure alerts
     */
    configureAlerts(alerts: AlertConfig[]): Promise<void>;
    
    /**
     * Get cache metrics
     */
    getCacheMetrics(): Promise<CacheMetrics>;
    
    /**
     * Clear cache with optional pattern
     */
    clearCache(pattern?: string): Promise<void>;
    
    /**
     * Export metrics data in specified format
     */
    exportMetrics(format: 'json' | 'csv', timeRange?: { start: number; end: number }): Promise<string>;
    
    /**
     * Get production configuration
     */
    getConfig(): Promise<ProductionConfig>;
    
    /**
     * Update production configuration
     */
    updateConfig(config: Partial<ProductionConfig>): Promise<void>;
    
    /**
     * Perform system health check
     */
    healthCheck(): Promise<SystemHealth>;
    
    /**
     * Force garbage collection
     */
    forceGarbageCollection(): Promise<void>;
    
    /**
     * Optimize memory usage
     */
    optimizeMemory(): Promise<OptimizationResult>;
    
    /**
     * Get resource usage history
     */
    getResourceHistory(hours: number): Promise<ProductionMetrics[]>;
    
    /**
     * Event emitted when performance alert is triggered
     */
    readonly onPerformanceAlert: Event<AlertEvent>;
    
    /**
     * Event emitted when system health changes
     */
    readonly onHealthChanged: Event<SystemHealth>;
    
    /**
     * Event emitted when optimization is applied
     */
    readonly onOptimizationApplied: Event<OptimizationResult>;
    
    /**
     * Event emitted when metrics are collected
     */
    readonly onMetricsCollected: Event<ProductionMetrics>;
}

export const PRODUCTION_OPTIMIZATION_SERVICE_PATH = '/services/production-optimization';

/**
 * Performance monitoring interface for cognitive services
 */
export interface CognitivePerformanceMonitor {
    /**
     * Monitor reasoning engine performance
     */
    monitorReasoningPerformance(): Promise<{
        activeQueries: number;
        avgProcessingTime: number;
        queueDepth: number;
        successRate: number;
    }>;
    
    /**
     * Monitor learning service performance
     */
    monitorLearningPerformance(): Promise<{
        activeLearningTasks: number;
        learningAccuracy: number;
        modelSize: number;
        trainingTime: number;
    }>;
    
    /**
     * Monitor AtomSpace performance
     */
    monitorAtomSpacePerformance(): Promise<{
        atomCount: number;
        linkCount: number;
        queryLatency: number;
        memoryUsage: number;
    }>;
    
    /**
     * Monitor knowledge management performance
     */
    monitorKnowledgeManagementPerformance(): Promise<{
        knowledgeBaseSize: number;
        queryThroughput: number;
        indexingTime: number;
        compressionRatio: number;
    }>;
}

/**
 * Resource optimization interface
 */
export interface ResourceOptimizer {
    /**
     * Optimize memory allocation
     */
    optimizeMemoryAllocation(): Promise<OptimizationResult>;
    
    /**
     * Optimize connection pooling
     */
    optimizeConnectionPooling(): Promise<OptimizationResult>;
    
    /**
     * Optimize cache configuration
     */
    optimizeCacheConfiguration(): Promise<OptimizationResult>;
    
    /**
     * Optimize query performance
     */
    optimizeQueryPerformance(): Promise<OptimizationResult>;
    
    /**
     * Cleanup unused resources
     */
    cleanupUnusedResources(): Promise<OptimizationResult>;
}

/**
 * Alert manager interface
 */
export interface AlertManager {
    /**
     * Configure alert thresholds
     */
    configureThresholds(config: AlertConfig[]): Promise<void>;
    
    /**
     * Check alert conditions
     */
    checkAlertConditions(): Promise<AlertEvent[]>;
    
    /**
     * Send alert notification
     */
    sendAlert(alert: AlertEvent): Promise<void>;
    
    /**
     * Get active alerts
     */
    getActiveAlerts(): Promise<AlertEvent[]>;
    
    /**
     * Acknowledge alert
     */
    acknowledgeAlert(alertId: string): Promise<void>;
}