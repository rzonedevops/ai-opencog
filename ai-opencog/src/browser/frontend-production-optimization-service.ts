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
import { WebSocketConnectionProvider } from '@theia/core/lib/browser/messaging';
import { Event, Emitter } from '@theia/core/lib/common/event';
import { 
    ProductionOptimizationService,
    PRODUCTION_OPTIMIZATION_SERVICE_PATH,
    ProductionMetrics,
    SystemHealth,
    ProductionStats,
    OptimizationResult,
    AlertConfig,
    AlertEvent,
    CacheMetrics,
    ProductionConfig
} from '../common';

@injectable()
export class FrontendProductionOptimizationService implements ProductionOptimizationService {

    private service: ProductionOptimizationService;
    
    // Event emitters for frontend
    private readonly onPerformanceAlertEmitter = new Emitter<AlertEvent>();
    private readonly onHealthChangedEmitter = new Emitter<SystemHealth>();
    private readonly onOptimizationAppliedEmitter = new Emitter<OptimizationResult>();
    private readonly onMetricsCollectedEmitter = new Emitter<ProductionMetrics>();

    readonly onPerformanceAlert: Event<AlertEvent> = this.onPerformanceAlertEmitter.event;
    readonly onHealthChanged: Event<SystemHealth> = this.onHealthChangedEmitter.event;
    readonly onOptimizationApplied: Event<OptimizationResult> = this.onOptimizationAppliedEmitter.event;
    readonly onMetricsCollected: Event<ProductionMetrics> = this.onMetricsCollectedEmitter.event;

    constructor(@inject(WebSocketConnectionProvider) connectionProvider: WebSocketConnectionProvider) {
        this.service = connectionProvider.createProxy<ProductionOptimizationService>(PRODUCTION_OPTIMIZATION_SERVICE_PATH);
        
        // Subscribe to backend events and re-emit them for frontend components
        this.service.onPerformanceAlert(alert => this.onPerformanceAlertEmitter.fire(alert));
        this.service.onHealthChanged(health => this.onHealthChangedEmitter.fire(health));
        this.service.onOptimizationApplied(result => this.onOptimizationAppliedEmitter.fire(result));
        this.service.onMetricsCollected(metrics => this.onMetricsCollectedEmitter.fire(metrics));
    }

    async getMetrics(): Promise<ProductionMetrics> {
        return this.service.getMetrics();
    }

    async getHealth(): Promise<SystemHealth> {
        return this.service.getHealth();
    }

    async getStats(): Promise<ProductionStats> {
        return this.service.getStats();
    }

    async startMonitoring(): Promise<void> {
        return this.service.startMonitoring();
    }

    async stopMonitoring(): Promise<void> {
        return this.service.stopMonitoring();
    }

    async optimizePerformance(type: string): Promise<OptimizationResult> {
        return this.service.optimizePerformance(type);
    }

    async configureAlerts(alerts: AlertConfig[]): Promise<void> {
        return this.service.configureAlerts(alerts);
    }

    async getCacheMetrics(): Promise<CacheMetrics> {
        return this.service.getCacheMetrics();
    }

    async clearCache(pattern?: string): Promise<void> {
        return this.service.clearCache(pattern);
    }

    async exportMetrics(format: 'json' | 'csv', timeRange?: { start: number; end: number }): Promise<string> {
        return this.service.exportMetrics(format, timeRange);
    }

    async getConfig(): Promise<ProductionConfig> {
        return this.service.getConfig();
    }

    async updateConfig(config: Partial<ProductionConfig>): Promise<void> {
        return this.service.updateConfig(config);
    }

    async healthCheck(): Promise<SystemHealth> {
        return this.service.healthCheck();
    }

    async forceGarbageCollection(): Promise<void> {
        return this.service.forceGarbageCollection();
    }

    async optimizeMemory(): Promise<OptimizationResult> {
        return this.service.optimizeMemory();
    }

    async getResourceHistory(hours: number): Promise<ProductionMetrics[]> {
        return this.service.getResourceHistory(hours);
    }
}