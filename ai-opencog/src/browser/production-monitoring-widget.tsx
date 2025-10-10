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
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { MessageService } from '@theia/core/lib/common/message-service';
import React, { useEffect, useState } from 'react';
import { ProductionOptimizationService, ProductionMetrics, SystemHealth, AlertEvent, ProductionOptimizationServiceSymbol } from '../common';

export const PRODUCTION_MONITORING_WIDGET_ID = 'production.monitoring';

@injectable()
export class ProductionMonitoringWidget extends ReactWidget {

    static readonly ID = PRODUCTION_MONITORING_WIDGET_ID;
    static readonly LABEL = 'Production Monitoring';

    constructor(
        @inject(ProductionOptimizationServiceSymbol) protected readonly productionService: ProductionOptimizationService,
        @inject(MessageService) protected readonly messageService: MessageService
    ) {
        super();
        this.id = PRODUCTION_MONITORING_WIDGET_ID;
        this.title.label = 'Production Monitoring';
        this.title.caption = 'Monitor system performance and health';
        this.title.closable = true;
        this.title.iconClass = 'fa fa-tachometer-alt';
        this.addClass('production-monitoring-widget');
    }

    protected onActivateRequest(): void {
        super.onActivateRequest();
        this.update();
    }

    protected render(): React.ReactNode {
        return <ProductionMonitoringComponent 
            productionService={this.productionService} 
            messageService={this.messageService}
        />;
    }
}

interface ProductionMonitoringComponentProps {
    productionService: ProductionOptimizationService;
    messageService: MessageService;
}

const ProductionMonitoringComponent: React.FC<ProductionMonitoringComponentProps> = ({ 
    productionService, 
    messageService 
}) => {
    const [metrics, setMetrics] = useState<ProductionMetrics | null>(null);
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [alerts, setAlerts] = useState<AlertEvent[]>([]);
    const [isMonitoring, setIsMonitoring] = useState(false);

    useEffect(() => {
        const updateMetrics = async () => {
            try {
                const currentMetrics = await productionService.getMetrics();
                setMetrics(currentMetrics);
                
                const currentHealth = await productionService.getHealth();
                setHealth(currentHealth);
            } catch (error) {
                console.error('Error fetching metrics:', error);
                messageService.error('Failed to fetch production metrics');
            }
        };

        const setupEventListeners = () => {
            // Event listeners would be set up here if the interface provides them
            // For now, we'll use polling via getMetrics and getHealth
        };

        updateMetrics();
        setupEventListeners();

        const interval = setInterval(updateMetrics, 30000); // Update every 30 seconds

        return () => {
            clearInterval(interval);
        };
    }, [productionService, messageService]);

    const handleStartMonitoring = async () => {
        try {
            await productionService.startMonitoring();
            setIsMonitoring(true);
            messageService.info('Production monitoring started');
        } catch (error) {
            messageService.error('Failed to start monitoring');
        }
    };

    const handleStopMonitoring = async () => {
        try {
            await productionService.stopMonitoring();
            setIsMonitoring(false);
            messageService.info('Production monitoring stopped');
        } catch (error) {
            messageService.error('Failed to stop monitoring');
        }
    };

    const handleOptimize = async (type: string) => {
        try {
            const result = await productionService.optimizePerformance(type);
            messageService.info(`Optimization applied: ${result.optimization} (${result.improvement.toFixed(1)}% improvement)`);
        } catch (error) {
            messageService.error(`Failed to apply ${type} optimization`);
        }
    };

    const handleClearCache = async () => {
        try {
            await productionService.clearCache();
            messageService.info('Cache cleared successfully');
        } catch (error) {
            messageService.error('Failed to clear cache');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return '#4CAF50';
            case 'degraded': return '#FF9800';
            case 'unhealthy': return '#F44336';
            default: return '#9E9E9E';
        }
    };

    return (
        <div style={{ padding: '20px', height: '100%', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Production Monitoring</h2>
                <div>
                    <button 
                        onClick={handleStartMonitoring} 
                        disabled={isMonitoring}
                        style={{ marginRight: '10px', padding: '8px 16px' }}
                    >
                        Start Monitoring
                    </button>
                    <button 
                        onClick={handleStopMonitoring} 
                        disabled={!isMonitoring}
                        style={{ padding: '8px 16px' }}
                    >
                        Stop Monitoring
                    </button>
                </div>
            </div>

            {/* System Health */}
            {health && (
                <div style={{ 
                    border: '1px solid #ddd', 
                    borderRadius: '4px', 
                    padding: '16px', 
                    marginBottom: '20px' 
                }}>
                    <h3 style={{ margin: '0 0 16px 0' }}>System Health</h3>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                        <div 
                            style={{ 
                                width: '12px', 
                                height: '12px', 
                                borderRadius: '50%', 
                                backgroundColor: getStatusColor(health.status),
                                marginRight: '8px'
                            }}
                        />
                        <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                            {health.status}
                        </span>
                        <span style={{ marginLeft: '16px', color: '#666' }}>
                            Uptime: {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
                        </span>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        {health.services.map(service => (
                            <div key={service.service} style={{ 
                                border: '1px solid #eee', 
                                borderRadius: '4px', 
                                padding: '12px' 
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                    <div 
                                        style={{ 
                                            width: '8px', 
                                            height: '8px', 
                                            borderRadius: '50%', 
                                            backgroundColor: getStatusColor(service.status),
                                            marginRight: '8px'
                                        }}
                                    />
                                    <span style={{ fontWeight: 'bold' }}>{service.service}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    Response: {service.responseTime}ms
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Performance Metrics */}
            {metrics && (
                <div style={{ 
                    border: '1px solid #ddd', 
                    borderRadius: '4px', 
                    padding: '16px', 
                    marginBottom: '20px' 
                }}>
                    <h3 style={{ margin: '0 0 16px 0' }}>Performance Metrics</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
                                {metrics.performance.cpuUsage.toFixed(1)}%
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>CPU Usage</div>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                                {metrics.performance.memoryUsage.toFixed(0)}MB
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Memory Usage</div>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
                                {metrics.performance.responseTime.toFixed(0)}ms
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Response Time</div>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9C27B0' }}>
                                {metrics.performance.throughput}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Requests/sec</div>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F44336' }}>
                                {metrics.performance.errorRate.toFixed(1)}%
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Error Rate</div>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#607D8B' }}>
                                {metrics.resources.cacheHitRate.toFixed(1)}%
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Cache Hit Rate</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Optimization Controls */}
            <div style={{ 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                padding: '16px', 
                marginBottom: '20px' 
            }}>
                <h3 style={{ margin: '0 0 16px 0' }}>Performance Optimization</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                    <button 
                        onClick={() => handleOptimize('memory')} 
                        style={{ padding: '8px 12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                        Optimize Memory
                    </button>
                    
                    <button 
                        onClick={() => handleOptimize('cache')} 
                        style={{ padding: '8px 12px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                        Optimize Cache
                    </button>
                    
                    <button 
                        onClick={() => handleOptimize('connections')} 
                        style={{ padding: '8px 12px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                        Optimize Connections
                    </button>
                    
                    <button 
                        onClick={() => handleOptimize('queries')} 
                        style={{ padding: '8px 12px', backgroundColor: '#9C27B0', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                        Optimize Queries
                    </button>
                    
                    <button 
                        onClick={handleClearCache} 
                        style={{ padding: '8px 12px', backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                        Clear Cache
                    </button>
                </div>
            </div>

            {/* Recent Alerts */}
            {alerts.length > 0 && (
                <div style={{ 
                    border: '1px solid #ddd', 
                    borderRadius: '4px', 
                    padding: '16px' 
                }}>
                    <h3 style={{ margin: '0 0 16px 0' }}>Recent Alerts</h3>
                    
                    <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                        {alerts.slice(-5).reverse().map((alert, index) => (
                            <div 
                                key={index} 
                                style={{ 
                                    padding: '8px 12px', 
                                    marginBottom: '8px', 
                                    borderLeft: `4px solid ${
                                        alert.severity === 'critical' ? '#F44336' : 
                                        alert.severity === 'warning' ? '#FF9800' : '#2196F3'
                                    }`,
                                    backgroundColor: '#fafafa',
                                    borderRadius: '0 4px 4px 0'
                                }}
                            >
                                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                    {alert.config.name}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                    {alert.message}
                                </div>
                                <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                    {new Date(alert.timestamp).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};