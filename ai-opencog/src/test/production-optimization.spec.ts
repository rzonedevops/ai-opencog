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

import { expect } from 'chai';
import { Container } from '@theia/core/shared/inversify';
import { ILogger, LogLevel } from '@theia/core/lib/common/logger';
import { ProductionOptimizationServiceImpl } from '../../node/production-optimization-service-impl';
import { 
    ProductionOptimizationService, 
    ProductionMetrics, 
    SystemHealth, 
    AlertConfig,
    OptimizationResult 
} from '../production-optimization-types';

describe('Production Optimization Service Tests', () => {
    let container: Container;
    let productionService: ProductionOptimizationService;
    let mockLogger: ILogger;

    beforeEach(() => {
        container = new Container();
        
        // Mock logger
        mockLogger = {
            log: () => {},
            trace: () => {},
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: () => {},
            fatal: () => {},
            setLogLevel: () => {},
            getLogLevel: () => LogLevel.INFO,
            isEnabled: () => true,
            isTrace: () => false,
            isDebug: () => false,
            isInfo: () => true,
            isWarn: () => true,
            isError: () => true,
            isFatal: () => true,
            child: () => mockLogger
        } as ILogger;

        container.bind(ILogger).toConstantValue(mockLogger);
        container.bind(ProductionOptimizationService).to(ProductionOptimizationServiceImpl).inSingletonScope();
        
        productionService = container.get(ProductionOptimizationService);
    });

    describe('Metrics Collection', () => {
        it('should collect system performance metrics', async () => {
            const metrics = await productionService.getMetrics();
            
            expect(metrics).to.not.be.undefined;
            expect(metrics.performance).to.not.be.undefined;
            expect(metrics.resources).to.not.be.undefined;
            expect(metrics.cognitive).to.not.be.undefined;
            expect(metrics.timestamp).to.be.a('number');
            
            // Validate performance metrics
            expect(metrics.performance.cpuUsage).to.be.a('number');
            expect(metrics.performance.memoryUsage).to.be.a('number');
            expect(metrics.performance.responseTime).to.be.a('number');
            expect(metrics.performance.throughput).to.be.a('number');
            expect(metrics.performance.errorRate).to.be.a('number');
            
            // Validate resource metrics
            expect(metrics.resources.activeConnections).to.be.a('number');
            expect(metrics.resources.queueDepth).to.be.a('number');
            expect(metrics.resources.cacheHitRate).to.be.a('number');
        });

        it('should emit metrics collected event', (done) => {
            productionService.onMetricsCollected((metrics) => {
                expect(metrics).to.not.be.undefined;
                expect(metrics.timestamp).to.be.a('number');
                done();
            });

            productionService.getMetrics();
        });
    });

    describe('Health Monitoring', () => {
        it('should perform health checks', async () => {
            const health = await productionService.getHealth();
            
            expect(health).to.not.be.undefined;
            expect(health.status).to.be.oneOf(['healthy', 'degraded', 'unhealthy']);
            expect(health.services).to.be.an('array');
            expect(health.uptime).to.be.a('number');
            expect(health.lastCheck).to.be.a('number');

            // Validate service health checks
            health.services.forEach(service => {
                expect(service.service).to.be.a('string');
                expect(service.status).to.be.oneOf(['healthy', 'degraded', 'unhealthy']);
                expect(service.responseTime).to.be.a('number');
                expect(service.timestamp).to.be.a('number');
            });
        });

        it('should emit health changed event', (done) => {
            productionService.onHealthChanged((health) => {
                expect(health).to.not.be.undefined;
                expect(health.status).to.be.a('string');
                done();
            });

            productionService.getHealth();
        });
    });

    describe('Performance Optimization', () => {
        it('should optimize memory performance', async () => {
            const result = await productionService.optimizePerformance('memory');
            
            expect(result).to.not.be.undefined;
            expect(result.type).to.equal('memory');
            expect(result.optimization).to.be.a('string');
            expect(result.improvement).to.be.a('number');
            expect(result.resourceSavings).to.be.an('object');
            expect(result.timestamp).to.be.a('number');
        });

        it('should optimize cache performance', async () => {
            const result = await productionService.optimizePerformance('cache');
            
            expect(result).to.not.be.undefined;
            expect(result.type).to.equal('cache');
            expect(result.optimization).to.be.a('string');
            expect(result.improvement).to.be.a('number');
        });

        it('should emit optimization applied event', (done) => {
            productionService.onOptimizationApplied((result) => {
                expect(result).to.not.be.undefined;
                expect(result.type).to.be.a('string');
                expect(result.improvement).to.be.a('number');
                done();
            });

            productionService.optimizePerformance('memory');
        });
    });

    describe('Alert Management', () => {
        it('should configure alert thresholds', async () => {
            const alerts: AlertConfig[] = [
                {
                    name: 'High CPU Usage',
                    metric: 'performance.cpuUsage',
                    threshold: 80,
                    operator: 'gt',
                    severity: 'warning',
                    cooldown: 5,
                    enabled: true
                },
                {
                    name: 'High Memory Usage',
                    metric: 'performance.memoryPercent',
                    threshold: 90,
                    operator: 'gt',
                    severity: 'critical',
                    cooldown: 10,
                    enabled: true
                }
            ];

            await productionService.configureAlerts(alerts);
            
            // Configuration should succeed without errors
            expect(true).to.be.true;
        });

        it('should handle alert events', (done) => {
            const alerts: AlertConfig[] = [
                {
                    name: 'Test Alert',
                    metric: 'performance.cpuUsage',
                    threshold: 0, // Low threshold to trigger alert
                    operator: 'gt',
                    severity: 'info',
                    cooldown: 1,
                    enabled: true
                }
            ];

            productionService.onPerformanceAlert((alert) => {
                expect(alert).to.not.be.undefined;
                expect(alert.config.name).to.equal('Test Alert');
                expect(alert.message).to.be.a('string');
                expect(alert.severity).to.equal('info');
                done();
            });

            productionService.configureAlerts(alerts);
        });
    });

    describe('Cache Management', () => {
        it('should get cache metrics', async () => {
            const metrics = await productionService.getCacheMetrics();
            
            expect(metrics).to.not.be.undefined;
            expect(metrics.currentSize).to.be.a('number');
            expect(metrics.entryCount).to.be.a('number');
            expect(metrics.hitRate).to.be.a('number');
            expect(metrics.missRate).to.be.a('number');
            expect(metrics.evictions).to.be.a('number');
            expect(metrics.memoryPressure).to.be.a('number');
        });

        it('should clear cache', async () => {
            await productionService.clearCache();
            
            // Should not throw any errors
            expect(true).to.be.true;
        });

        it('should clear cache with pattern', async () => {
            await productionService.clearCache('test.*');
            
            // Should not throw any errors
            expect(true).to.be.true;
        });
    });

    describe('Monitoring Lifecycle', () => {
        it('should start monitoring', async () => {
            await productionService.startMonitoring();
            
            // Should not throw any errors
            expect(true).to.be.true;
        });

        it('should stop monitoring', async () => {
            await productionService.startMonitoring();
            await productionService.stopMonitoring();
            
            // Should not throw any errors
            expect(true).to.be.true;
        });

        it('should handle duplicate start monitoring calls', async () => {
            await productionService.startMonitoring();
            await productionService.startMonitoring(); // Should handle gracefully
            
            // Should not throw any errors
            expect(true).to.be.true;
        });
    });

    describe('Data Export', () => {
        it('should export metrics in JSON format', async () => {
            const jsonData = await productionService.exportMetrics('json');
            
            expect(jsonData).to.be.a('string');
            expect(() => JSON.parse(jsonData)).to.not.throw();
        });

        it('should export metrics in CSV format', async () => {
            const csvData = await productionService.exportMetrics('csv');
            
            expect(csvData).to.be.a('string');
            expect(csvData).to.include(','); // Should contain CSV separators
        });

        it('should export metrics with time range', async () => {
            const timeRange = {
                start: Date.now() - 3600000, // 1 hour ago
                end: Date.now()
            };
            
            const data = await productionService.exportMetrics('json', timeRange);
            expect(data).to.be.a('string');
        });
    });

    describe('Configuration Management', () => {
        it('should get production configuration', async () => {
            const config = await productionService.getConfig();
            
            expect(config).to.not.be.undefined;
            expect(config.monitoring).to.not.be.undefined;
            expect(config.performance).to.not.be.undefined;
            expect(config.cache).to.not.be.undefined;
            expect(config.alerts).to.be.an('array');
            expect(config.limits).to.not.be.undefined;
        });

        it('should update production configuration', async () => {
            const updates = {
                monitoring: {
                    metricsInterval: 60,
                    healthCheckInterval: 120,
                    retentionPeriod: 48,
                    detailedLogging: true
                }
            };

            await productionService.updateConfig(updates);
            
            const config = await productionService.getConfig();
            expect(config.monitoring.metricsInterval).to.equal(60);
            expect(config.monitoring.detailedLogging).to.be.true;
        });
    });

    describe('Resource History', () => {
        it('should get resource history', async () => {
            const history = await productionService.getResourceHistory(1);
            
            expect(history).to.be.an('array');
            // Note: In a real scenario, this would contain historical data
        });

        it('should get resource history for different time periods', async () => {
            const shortHistory = await productionService.getResourceHistory(1);
            const longHistory = await productionService.getResourceHistory(24);
            
            expect(shortHistory).to.be.an('array');
            expect(longHistory).to.be.an('array');
        });
    });

    describe('Advanced Operations', () => {
        it('should force garbage collection', async () => {
            await productionService.forceGarbageCollection();
            
            // Should not throw any errors
            expect(true).to.be.true;
        });

        it('should optimize memory directly', async () => {
            const result = await productionService.optimizeMemory();
            
            expect(result).to.not.be.undefined;
            expect(result.type).to.equal('memory');
            expect(result.improvement).to.be.a('number');
        });

        it('should perform health check directly', async () => {
            const health = await productionService.healthCheck();
            
            expect(health).to.not.be.undefined;
            expect(health.status).to.be.oneOf(['healthy', 'degraded', 'unhealthy']);
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid optimization types gracefully', async () => {
            const result = await productionService.optimizePerformance('invalid-type');
            
            expect(result).to.not.be.undefined;
            expect(result.type).to.be.a('string');
        });

        it('should handle empty alert configurations', async () => {
            await productionService.configureAlerts([]);
            
            // Should not throw any errors
            expect(true).to.be.true;
        });

        it('should handle invalid time ranges for export', async () => {
            const invalidRange = {
                start: Date.now(),
                end: Date.now() - 3600000 // Invalid: start > end
            };
            
            const data = await productionService.exportMetrics('json', invalidRange);
            expect(data).to.be.a('string');
        });
    });
});