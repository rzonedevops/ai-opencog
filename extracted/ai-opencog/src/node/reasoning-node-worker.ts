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

import { injectable, inject, named } from '@theia/core/shared/inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { ReasoningNodeWorker } from '../common/distributed-reasoning-service';
import {
    ReasoningCapability,
    NodeStatus,
    NodePerformance
} from '../common/distributed-reasoning-types';
import { ReasoningQuery, ReasoningResult } from '../common/opencog-types';
import { PLNReasoningEngine, PatternMatchingEngine, CodeAnalysisReasoningEngine } from './reasoning-engines';

/**
 * Implementation of a reasoning node worker that can execute reasoning tasks
 */
@injectable()
export class ReasoningNodeWorkerImpl implements ReasoningNodeWorker {

    @inject(ILogger) @named('reasoning-node')
    protected readonly logger: ILogger;

    @inject(PLNReasoningEngine)
    protected readonly plnEngine: PLNReasoningEngine;

    @inject(PatternMatchingEngine)
    protected readonly patternEngine: PatternMatchingEngine;

    @inject(CodeAnalysisReasoningEngine)
    protected readonly codeAnalysisEngine: CodeAnalysisReasoningEngine;

    private nodeId: string;
    private capabilities: ReasoningCapability[];
    private status: NodeStatus = 'online';
    private currentWorkload = 0;
    private performance: NodePerformance;
    private activeTasks = 0;
    private maxConcurrentTasks = 5;

    constructor() {
        this.nodeId = this.generateNodeId();
        this.capabilities = [
            'deductive',
            'inductive', 
            'abductive',
            'pattern-matching',
            'code-analysis'
        ];
        this.performance = {
            averageResponseTime: 100,
            tasksCompleted: 0,
            tasksErrored: 0,
            uptime: Date.now(),
            reliability: 1.0
        };

        this.logger.info(`Reasoning node worker ${this.nodeId} initialized with capabilities: ${this.capabilities.join(', ')}`);
    }

    /**
     * Execute a reasoning task
     */
    async executeTask(query: ReasoningQuery, constraints?: any): Promise<ReasoningResult> {
        const startTime = Date.now();
        
        try {
            // Check capacity
            if (this.activeTasks >= this.maxConcurrentTasks) {
                throw new Error('Node at maximum capacity');
            }

            this.activeTasks++;
            this.updateWorkload();

            // Route to appropriate reasoning engine
            let result: ReasoningResult;
            
            switch (query.type) {
                case 'deductive':
                case 'inductive':
                case 'abductive':
                    result = await this.plnEngine.reason(query);
                    break;
                case 'code-analysis':
                    result = await this.codeAnalysisEngine.reason(query);
                    break;
                default:
                    // Use pattern matching for unknown types
                    result = await this.patternEngine.recognizePatterns({
                        data: query.atoms || [],
                        context: query.context,
                        scope: 'comprehensive'
                    }).then(patterns => ({
                        conclusion: patterns.map(p => p.pattern as any),
                        confidence: patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length || 0,
                        explanation: `Pattern recognition found ${patterns.length} patterns`,
                        metadata: {
                            patterns: patterns.length,
                            reasoningType: 'pattern-matching'
                        }
                    }));
            }

            // Update performance metrics
            const executionTime = Date.now() - startTime;
            this.updatePerformanceMetrics(executionTime, true);

            // Add node-specific metadata
            result.metadata = {
                ...result.metadata,
                nodeId: this.nodeId,
                executionTime,
                nodeCapabilities: this.capabilities
            };

            this.logger.debug(`Task completed in ${executionTime}ms on node ${this.nodeId}`);
            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            this.updatePerformanceMetrics(executionTime, false);
            
            this.logger.error(`Task failed on node ${this.nodeId}: ${error}`);
            throw error;
        } finally {
            this.activeTasks--;
            this.updateWorkload();
        }
    }

    /**
     * Get node capabilities
     */
    getCapabilities(): ReasoningCapability[] {
        return [...this.capabilities];
    }

    /**
     * Get current node status and performance
     */
    async getStatus(): Promise<{ status: string; workload: number; performance: NodePerformance }> {
        return {
            status: this.status,
            workload: this.currentWorkload,
            performance: {
                ...this.performance,
                uptime: Date.now() - this.performance.uptime
            }
        };
    }

    /**
     * Shutdown the node gracefully
     */
    async shutdown(): Promise<void> {
        this.status = 'maintenance';
        
        // Wait for active tasks to complete
        while (this.activeTasks > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.status = 'offline';
        this.logger.info(`Reasoning node worker ${this.nodeId} shutdown gracefully`);
    }

    /**
     * Get node ID
     */
    getNodeId(): string {
        return this.nodeId;
    }

    /**
     * Update node capabilities (for dynamic reconfiguration)
     */
    updateCapabilities(capabilities: ReasoningCapability[]): void {
        this.capabilities = [...capabilities];
        this.logger.info(`Node ${this.nodeId} capabilities updated to: ${capabilities.join(', ')}`);
    }

    /**
     * Set maximum concurrent tasks
     */
    setMaxConcurrentTasks(max: number): void {
        this.maxConcurrentTasks = Math.max(1, max);
        this.updateWorkload();
        this.logger.info(`Node ${this.nodeId} max concurrent tasks set to ${max}`);
    }

    // Private helper methods

    private updateWorkload(): void {
        this.currentWorkload = this.activeTasks / this.maxConcurrentTasks;
        
        // Update status based on workload
        if (this.currentWorkload >= 1.0) {
            this.status = 'busy';
        } else if (this.currentWorkload > 0) {
            this.status = 'online';
        } else {
            this.status = 'online';
        }
    }

    private updatePerformanceMetrics(executionTime: number, success: boolean): void {
        // Update average response time with exponential moving average
        this.performance.averageResponseTime = 
            0.9 * this.performance.averageResponseTime + 0.1 * executionTime;

        if (success) {
            this.performance.tasksCompleted++;
        } else {
            this.performance.tasksErrored++;
        }

        // Update reliability
        const totalTasks = this.performance.tasksCompleted + this.performance.tasksErrored;
        this.performance.reliability = totalTasks > 0 ? 
            this.performance.tasksCompleted / totalTasks : 1.0;
    }

    private generateNodeId(): string {
        return `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}