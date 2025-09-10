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
import { Disposable, DisposableCollection } from '@theia/core/lib/common/disposable';
import { TaskService } from '@theia/task/lib/browser/task-service';
import { ProblemManager } from '@theia/markers/lib/browser/problem/problem-manager';
import { MarkerManager } from '@theia/markers/lib/browser/marker-manager';
import { OpenCogService } from '../common/opencog-service';
import { Atom } from '../common/opencog-types';
import { EnvironmentMetrics, TestResults, PerformanceMetrics, Sensor } from '../common/sensor-motor-types';

/**
 * Monitors development environment including build processes, performance metrics, and resource utilization
 */
@injectable()
export class EnvironmentSensor implements Sensor, Disposable {

    protected disposables = new DisposableCollection();
    protected active = false;
    protected metricsHistory: EnvironmentMetrics[] = [];
    private readonly maxHistorySize = 500;
    private metricsInterval?: NodeJS.Timeout;

    constructor(
        @inject(TaskService) private readonly taskService: TaskService,
        @inject(ProblemManager) private readonly problemManager: ProblemManager,
        @inject(MarkerManager) private readonly markerManager: MarkerManager,
        @inject(OpenCogService) private readonly opencog: OpenCogService
    ) {}

    async start(): Promise<void> {
        if (this.active) {
            return;
        }

        this.active = true;
        this.setupBuildMonitoring();
        this.setupProblemMonitoring();
        this.startPeriodicMetricsCollection();
    }

    async stop(): Promise<void> {
        this.active = false;
        this.disposables.dispose();
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
        }
    }

    isActive(): boolean {
        return this.active;
    }

    dispose(): void {
        this.stop();
    }

    private setupBuildMonitoring(): void {
        // Monitor build task execution
        this.disposables.push(
            this.taskService.onDidStartTask(task => {
                const startTime = Date.now();
                (task as any).startTime = startTime;
                
                this.recordBuildMetrics({
                    buildTime: 0, // Will be updated on completion
                    timestamp: startTime,
                    taskLabel: task.config.label,
                    taskType: task.config.type,
                    status: 'started'
                });
            })
        );

        this.disposables.push(
            this.taskService.onDidEndTask(result => {
                const endTime = Date.now();
                const startTime = (result.task as any).startTime || endTime;
                const buildTime = endTime - startTime;

                this.recordBuildMetrics({
                    buildTime,
                    timestamp: endTime,
                    taskLabel: result.task.config.label,
                    taskType: result.task.config.type,
                    status: result.exitCode === 0 ? 'success' : 'failed',
                    exitCode: result.exitCode
                });
            })
        );
    }

    private setupProblemMonitoring(): void {
        // Monitor problem markers (errors, warnings)
        this.disposables.push(
            this.markerManager.onDidChangeMarkers(() => {
                const markers = this.markerManager.findMarkers();
                const errorCount = markers.filter(m => m.data.severity === 1).length; // Error
                const warningCount = markers.filter(m => m.data.severity === 2).length; // Warning
                
                this.recordProblemMetrics({
                    errorCount,
                    warningCount,
                    timestamp: Date.now()
                });
            })
        );
    }

    private startPeriodicMetricsCollection(): void {
        // Collect metrics every 30 seconds
        this.metricsInterval = setInterval(() => {
            this.collectSystemMetrics();
        }, 30000);

        // Collect initial metrics
        this.collectSystemMetrics();
    }

    private async collectSystemMetrics(): Promise<void> {
        try {
            const metrics: EnvironmentMetrics = {
                memoryUsage: this.getMemoryUsage(),
                performance: await this.getPerformanceMetrics(),
                timestamp: Date.now()
            };

            // Add current problem counts
            const markers = this.markerManager.findMarkers();
            metrics.errorCount = markers.filter(m => m.data.severity === 1).length;
            metrics.warningCount = markers.filter(m => m.data.severity === 2).length;

            this.recordMetrics(metrics);
        } catch (error) {
            console.error('Error collecting system metrics:', error);
        }
    }

    private getMemoryUsage(): number {
        // Browser-specific memory usage estimation
        if ('memory' in performance && 'usedJSHeapSize' in (performance as any).memory) {
            return (performance as any).memory.usedJSHeapSize / (1024 * 1024); // MB
        }
        return 0;
    }

    private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
        const perfEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        const navTiming = perfEntries[0];

        return {
            responseTime: navTiming ? navTiming.responseEnd - navTiming.responseStart : 0,
            throughput: navTiming ? navTiming.loadEventEnd - navTiming.fetchStart : 0,
            errorRate: 0, // Would need more sophisticated tracking
            resourceUtilization: {
                memory: this.getMemoryUsage()
            }
        };
    }

    private recordBuildMetrics(buildData: any): void {
        const metrics: EnvironmentMetrics = {
            buildTime: buildData.buildTime,
            timestamp: buildData.timestamp,
            metadata: {
                taskLabel: buildData.taskLabel,
                taskType: buildData.taskType,
                status: buildData.status,
                exitCode: buildData.exitCode
            }
        };

        this.recordMetrics(metrics);
    }

    private recordProblemMetrics(problemData: any): void {
        const metrics: EnvironmentMetrics = {
            errorCount: problemData.errorCount,
            warningCount: problemData.warningCount,
            timestamp: problemData.timestamp
        };

        this.recordMetrics(metrics);
    }

    private recordMetrics(metrics: EnvironmentMetrics): void {
        this.metricsHistory.push(metrics);
        
        // Maintain history size limit
        if (this.metricsHistory.length > this.maxHistorySize) {
            this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
        }

        // Extract and add atoms to OpenCog
        this.extractEnvironmentAtoms(metrics).then(atoms => {
            this.addAtomsToOpenCog(atoms);
        }).catch(console.error);
    }

    private async extractEnvironmentAtoms(metrics: EnvironmentMetrics): Promise<Atom[]> {
        const atoms: Atom[] = [];

        // Create environment metrics atom
        const metricsAtom: Atom = {
            type: 'EnvironmentMetricsAtom',
            name: `env-metrics-${metrics.timestamp || Date.now()}`,
            metadata: {
                buildTime: metrics.buildTime,
                memoryUsage: metrics.memoryUsage,
                cpuUsage: metrics.cpuUsage,
                diskUsage: metrics.diskUsage,
                errorCount: metrics.errorCount,
                warningCount: metrics.warningCount,
                testResults: metrics.testResults,
                performance: metrics.performance,
                timestamp: metrics.timestamp || Date.now(),
                ...metrics.metadata
            },
            truthValue: {
                strength: 0.9,
                confidence: 0.8
            }
        };
        atoms.push(metricsAtom);

        // Create specific metric atoms for important values
        if (metrics.buildTime !== undefined) {
            const buildTimeAtom: Atom = {
                type: 'BuildTimeAtom',
                name: `build-time-${metrics.timestamp}`,
                metadata: {
                    duration: metrics.buildTime,
                    timestamp: metrics.timestamp
                },
                truthValue: {
                    strength: this.calculateBuildPerformanceStrength(metrics.buildTime),
                    confidence: 0.8
                }
            };
            atoms.push(buildTimeAtom);

            // Create relationship
            const hasBuildTimeAtom: Atom = {
                type: 'EvaluationLink',
                outgoing: [
                    { type: 'PredicateNode', name: 'has-build-time' },
                    { type: 'ListLink', outgoing: [metricsAtom, buildTimeAtom] }
                ],
                truthValue: { strength: 1.0, confidence: 0.9 }
            };
            atoms.push(hasBuildTimeAtom);
        }

        // Create error/warning atoms
        if (metrics.errorCount !== undefined && metrics.errorCount > 0) {
            const errorAtom: Atom = {
                type: 'ErrorCountAtom',
                name: `errors-${metrics.timestamp}`,
                metadata: {
                    count: metrics.errorCount,
                    timestamp: metrics.timestamp
                },
                truthValue: {
                    strength: Math.min(metrics.errorCount / 10, 1.0),
                    confidence: 0.9
                }
            };
            atoms.push(errorAtom);
        }

        if (metrics.warningCount !== undefined && metrics.warningCount > 0) {
            const warningAtom: Atom = {
                type: 'WarningCountAtom',
                name: `warnings-${metrics.timestamp}`,
                metadata: {
                    count: metrics.warningCount,
                    timestamp: metrics.timestamp
                },
                truthValue: {
                    strength: Math.min(metrics.warningCount / 20, 1.0),
                    confidence: 0.9
                }
            };
            atoms.push(warningAtom);
        }

        // Create performance assessment atoms
        if (metrics.performance) {
            const perfAtom: Atom = {
                type: 'PerformanceAtom',
                name: `perf-${metrics.timestamp}`,
                metadata: {
                    responseTime: metrics.performance.responseTime,
                    throughput: metrics.performance.throughput,
                    errorRate: metrics.performance.errorRate,
                    resourceUtilization: metrics.performance.resourceUtilization,
                    timestamp: metrics.timestamp
                },
                truthValue: {
                    strength: this.calculatePerformanceStrength(metrics.performance),
                    confidence: 0.8
                }
            };
            atoms.push(perfAtom);
        }

        return atoms;
    }

    private calculateBuildPerformanceStrength(buildTime: number): number {
        // Good build times get higher strength
        // Assuming builds under 10s are excellent, under 60s are good
        if (buildTime < 10000) return 0.9;
        if (buildTime < 60000) return 0.7;
        if (buildTime < 300000) return 0.5;
        return 0.3;
    }

    private calculatePerformanceStrength(performance: PerformanceMetrics): number {
        // Calculate overall performance strength based on metrics
        let strength = 0.5; // baseline
        
        // Response time factor (lower is better)
        if (performance.responseTime < 100) strength += 0.2;
        else if (performance.responseTime < 500) strength += 0.1;
        else if (performance.responseTime > 2000) strength -= 0.2;

        // Error rate factor (lower is better)
        if (performance.errorRate === 0) strength += 0.2;
        else if (performance.errorRate < 0.1) strength += 0.1;
        else if (performance.errorRate > 0.5) strength -= 0.3;

        return Math.max(0.1, Math.min(0.9, strength));
    }

    private async addAtomsToOpenCog(atoms: Atom[]): Promise<void> {
        try {
            for (const atom of atoms) {
                await this.opencog.addAtom(atom);
            }
        } catch (error) {
            console.error('Error adding environment atoms to OpenCog:', error);
        }
    }

    /**
     * Get recent metrics history
     */
    getMetricsHistory(limit?: number): EnvironmentMetrics[] {
        return limit ? this.metricsHistory.slice(-limit) : [...this.metricsHistory];
    }

    /**
     * Get environment statistics
     */
    getEnvironmentStats(): Record<string, any> {
        if (this.metricsHistory.length === 0) {
            return { noData: true };
        }

        const recentMetrics = this.metricsHistory.slice(-10);
        const buildTimes = recentMetrics.filter(m => m.buildTime !== undefined).map(m => m.buildTime!);
        const memoryUsages = recentMetrics.filter(m => m.memoryUsage !== undefined).map(m => m.memoryUsage!);
        
        return {
            totalMetricsCount: this.metricsHistory.length,
            averageBuildTime: buildTimes.length > 0 
                ? buildTimes.reduce((sum, time) => sum + time, 0) / buildTimes.length 
                : 0,
            averageMemoryUsage: memoryUsages.length > 0
                ? memoryUsages.reduce((sum, usage) => sum + usage, 0) / memoryUsages.length
                : 0,
            currentErrorCount: this.metricsHistory[this.metricsHistory.length - 1]?.errorCount || 0,
            currentWarningCount: this.metricsHistory[this.metricsHistory.length - 1]?.warningCount || 0,
            timespan: this.metricsHistory.length > 0 
                ? (this.metricsHistory[this.metricsHistory.length - 1].timestamp || 0) - (this.metricsHistory[0].timestamp || 0)
                : 0
        };
    }
}