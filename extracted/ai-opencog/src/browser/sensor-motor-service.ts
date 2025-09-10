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

import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { Disposable, DisposableCollection } from '@theia/core/lib/common/disposable';
import { OpenCogService } from '../common/opencog-service';
import { ReasoningQuery, Atom } from '../common/opencog-types';
import { CodeChangeSensor } from './code-change-sensor';
import { ActivitySensor } from './activity-sensor';
import { EnvironmentSensor } from './environment-sensor';
import { CodeModificationActuator } from './code-modification-actuator';
import { ToolControlActuator } from './tool-control-actuator';
import { EnvironmentManagementActuator } from './environment-management-actuator';
import { Sensor, Actuator, ActuatorResult } from '../common/sensor-motor-types';

/**
 * Coordinates the sensor-motor system, managing sensors that feed data to OpenCog
 * and actuators that respond to cognitive reasoning results
 */
@injectable()
export class SensorMotorService implements Disposable {

    protected disposables = new DisposableCollection();
    protected active = false;
    protected sensors: Sensor[] = [];
    protected actuators: Map<string, Actuator> = new Map();

    constructor(
        @inject(OpenCogService) private readonly opencog: OpenCogService,
        @inject(CodeChangeSensor) private readonly codeChangeSensor: CodeChangeSensor,
        @inject(ActivitySensor) private readonly activitySensor: ActivitySensor,
        @inject(EnvironmentSensor) private readonly environmentSensor: EnvironmentSensor,
        @inject(CodeModificationActuator) private readonly codeModificationActuator: CodeModificationActuator,
        @inject(ToolControlActuator) private readonly toolControlActuator: ToolControlActuator,
        @inject(EnvironmentManagementActuator) private readonly environmentManagementActuator: EnvironmentManagementActuator
    ) {}

    @postConstruct()
    protected init(): void {
        this.sensors = [
            this.codeChangeSensor,
            this.activitySensor,
            this.environmentSensor
        ];

        this.actuators.set('code-modification', this.codeModificationActuator);
        this.actuators.set('tool-control', this.toolControlActuator);
        this.actuators.set('environment-management', this.environmentManagementActuator);
        
        this.disposables.push(this.codeChangeSensor);
    }

    /**
     * Start the sensor-motor system
     */
    async start(): Promise<void> {
        if (this.active) {
            return;
        }

        this.active = true;
        
        // Start all sensors
        for (const sensor of this.sensors) {
            try {
                await sensor.start();
                console.log(`Started sensor: ${sensor.constructor.name}`);
            } catch (error) {
                console.error(`Failed to start sensor ${sensor.constructor.name}:`, error);
            }
        }

        // Start cognitive-motor loop
        this.startCognitiveMotorLoop();
    }

    /**
     * Stop the sensor-motor system
     */
    async stop(): Promise<void> {
        this.active = false;
        
        // Stop all sensors
        for (const sensor of this.sensors) {
            try {
                await sensor.stop();
                console.log(`Stopped sensor: ${sensor.constructor.name}`);
            } catch (error) {
                console.error(`Failed to stop sensor ${sensor.constructor.name}:`, error);
            }
        }

        this.disposables.dispose();
    }

    /**
     * Check if the system is active
     */
    isActive(): boolean {
        return this.active;
    }

    dispose(): void {
        this.stop();
    }

    /**
     * Execute an actuator action
     */
    async executeActuator(actuatorType: string, parameters: any): Promise<ActuatorResult> {
        const actuator = this.actuators.get(actuatorType);
        if (!actuator) {
            return {
                success: false,
                message: `Unknown actuator type: ${actuatorType}`
            };
        }

        const available = await actuator.isAvailable();
        if (!available) {
            return {
                success: false,
                message: `Actuator ${actuatorType} is not available`
            };
        }

        return actuator.execute(parameters);
    }

    /**
     * Get sensor statistics
     */
    getSensorStats(): Record<string, any> {
        const stats: Record<string, any> = {};
        
        stats.activeSensors = this.sensors.filter(s => s.isActive()).length;
        stats.totalSensors = this.sensors.length;
        stats.availableActuators = Array.from(this.actuators.keys());
        
        // Get specific sensor stats if available
        if (this.activitySensor.isActive()) {
            stats.activityStats = this.activitySensor.getActivityStats();
        }
        
        if (this.environmentSensor.isActive()) {
            stats.environmentStats = this.environmentSensor.getEnvironmentStats();
        }

        return stats;
    }

    /**
     * Get recent sensor data for analysis
     */
    getRecentSensorData(): any {
        return {
            activities: this.activitySensor.getActivityHistory(50),
            environmentMetrics: this.environmentSensor.getMetricsHistory(20),
            timestamp: Date.now()
        };
    }

    private startCognitiveMotorLoop(): void {
        // Start a periodic cognitive-motor loop that analyzes sensor data and triggers actuators
        const loopInterval = setInterval(async () => {
            if (!this.active) {
                clearInterval(loopInterval);
                return;
            }

            try {
                await this.processCognitiveMotorCycle();
            } catch (error) {
                console.error('Error in cognitive-motor cycle:', error);
            }
        }, 30000); // Run every 30 seconds

        this.disposables.push({ dispose: () => clearInterval(loopInterval) });
    }

    private async processCognitiveMotorCycle(): Promise<void> {
        try {
            // Query OpenCog for patterns that might trigger actuator responses
            const reasoningQueries = await this.generateReasoningQueries();
            
            for (const query of reasoningQueries) {
                const result = await this.opencog.reason(query);
                
                if (result.confidence > 0.7) {
                    await this.processReasoningResult(result);
                }
            }
        } catch (error) {
            console.error('Error processing cognitive-motor cycle:', error);
        }
    }

    private async generateReasoningQueries(): Promise<ReasoningQuery[]> {
        const queries: ReasoningQuery[] = [];
        
        // Query for performance optimization opportunities
        queries.push({
            type: 'problem-analysis',
            context: { domain: 'performance', threshold: 0.7 },
            parameters: { 
                lookForPatterns: ['high-memory-usage', 'slow-build-times', 'frequent-errors'],
                timeWindow: 300000 // 5 minutes
            }
        });

        // Query for code quality issues
        queries.push({
            type: 'code-analysis',
            context: { domain: 'quality', scope: 'recent-changes' },
            parameters: {
                lookForPatterns: ['code-smells', 'potential-bugs', 'refactoring-opportunities']
            }
        });

        // Query for workflow optimization
        queries.push({
            type: 'approach-selection',
            context: { domain: 'workflow', optimization: true },
            parameters: {
                analyzePatterns: ['user-behavior', 'tool-usage', 'productivity-metrics']
            }
        });

        return queries;
    }

    private async processReasoningResult(result: any): Promise<void> {
        const metadata = result.metadata || {};
        
        // Process performance-related reasoning results
        if (metadata.domain === 'performance') {
            await this.handlePerformanceOptimization(result);
        }
        
        // Process code quality reasoning results
        if (metadata.domain === 'quality') {
            await this.handleCodeQualityImprovements(result);
        }
        
        // Process workflow optimization results
        if (metadata.domain === 'workflow') {
            await this.handleWorkflowOptimization(result);
        }
    }

    private async handlePerformanceOptimization(result: any): Promise<void> {
        const sensorData = this.getRecentSensorData();
        
        // Check if performance optimization is needed
        const environmentStats = this.environmentSensor.getEnvironmentStats();
        if (environmentStats.averageMemoryUsage > 512 || environmentStats.averageBuildTime > 30000) {
            
            const optimizationResult = await this.executeActuator('environment-management', {
                action: 'optimize-performance',
                targetMetrics: { memoryUsage: 256, buildTime: 15000 },
                currentMetrics: {
                    memoryUsage: environmentStats.averageMemoryUsage,
                    buildTime: environmentStats.averageBuildTime
                }
            });

            if (optimizationResult.success) {
                console.log('Performance optimization applied:', optimizationResult.message);
            }
        }
    }

    private async handleCodeQualityImprovements(result: any): Promise<void> {
        const conclusion = result.conclusion || [];
        
        for (const atom of conclusion) {
            if (atom.type === 'RefactoringOpportunityAtom' && atom.metadata) {
                const refactoringResult = await this.executeActuator('code-modification', {
                    type: atom.metadata.refactoringType,
                    target: atom.metadata.target,
                    parameters: atom.metadata.parameters,
                    preview: true // Start with preview
                });

                if (refactoringResult.success) {
                    console.log('Code quality improvement suggested:', refactoringResult.message);
                }
            }
        }
    }

    private async handleWorkflowOptimization(result: any): Promise<void> {
        const activityStats = this.activitySensor.getActivityStats();
        
        // Optimize tool configuration based on usage patterns
        if (activityStats.typeDistribution?.edit > activityStats.totalActivities * 0.6) {
            // Heavy editing workload - optimize editor settings
            const toolOptimizationResult = await this.executeActuator('tool-control', {
                action: 'optimize-settings',
                context: { workloadType: 'heavy-editing' },
                performanceData: this.environmentSensor.getEnvironmentStats()
            });

            if (toolOptimizationResult.success) {
                console.log('Tool optimization applied for heavy editing workload:', toolOptimizationResult.message);
            }
        }
    }

    /**
     * Trigger manual actuator based on OpenCog reasoning
     */
    async triggerCognitiveActuation(reasoning: any): Promise<ActuatorResult[]> {
        const results: ActuatorResult[] = [];
        
        if (reasoning.suggestedActions) {
            for (const action of reasoning.suggestedActions) {
                const result = await this.executeActuator(action.actuatorType, action.parameters);
                results.push(result);
            }
        }

        return results;
    }
}