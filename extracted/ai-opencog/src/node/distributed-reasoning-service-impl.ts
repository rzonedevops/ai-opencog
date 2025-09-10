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
import { Emitter, Event } from '@theia/core/lib/common/event';
import {
    DistributedReasoningService,
    NodeRegistry,
    TaskQueue,
    ResultAggregator,
    LoadBalancer,
    FaultTolerance,
    DistributedReasoningCoordinator
} from '../common/distributed-reasoning-service';
import {
    DistributedReasoningTask,
    DistributedReasoningResult,
    DistributedReasoningConfig,
    ReasoningNode,
    NodeRegistration,
    NodeHeartbeat,
    DistributedReasoningStats,
    ReasoningCapability,
    TaskStatus,
    NodeStatus,
    TaskPriority,
    AggregationStrategy,
    LoadBalancingStrategy,
    NodeReasoningResult,
    DistributedReasoningEvents
} from '../common/distributed-reasoning-types';
import { ReasoningQuery, ReasoningResult } from '../common/opencog-types';

/**
 * Implementation of the distributed reasoning service
 */
@injectable()
export class DistributedReasoningServiceImpl implements DistributedReasoningService {

    @inject(ILogger) @named('distributed-reasoning')
    protected readonly logger: ILogger;

    private config: DistributedReasoningConfig;
    private nodeRegistry: Map<string, ReasoningNode> = new Map();
    private taskQueue: Map<string, DistributedReasoningTask> = new Map();
    private completedTasks: Map<string, DistributedReasoningResult> = new Map();
    private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map();
    
    // Event emitters
    private readonly onNodeRegisteredEmitter = new Emitter<{ node: ReasoningNode }>();
    private readonly onNodeDeregisteredEmitter = new Emitter<{ nodeId: string }>();
    private readonly onTaskCompletedEmitter = new Emitter<{ result: DistributedReasoningResult }>();
    private readonly onTaskFailedEmitter = new Emitter<{ taskId: string; error: string }>();

    readonly onNodeRegistered: Event<{ node: ReasoningNode }> = this.onNodeRegisteredEmitter.event;
    readonly onNodeDeregistered: Event<{ nodeId: string }> = this.onNodeDeregisteredEmitter.event;
    readonly onTaskCompleted: Event<{ result: DistributedReasoningResult }> = this.onTaskCompletedEmitter.event;
    readonly onTaskFailed: Event<{ taskId: string; error: string }> = this.onTaskFailedEmitter.event;

    constructor() {
        this.config = this.getDefaultConfig();
        this.startHeartbeatMonitoring();
        this.startTaskProcessing();
        
        this.logger.info('Distributed reasoning service initialized');
    }

    /**
     * Submit a reasoning task for distributed processing
     */
    async submitTask(query: ReasoningQuery, constraints?: any): Promise<DistributedReasoningResult> {
        const task: DistributedReasoningTask = {
            id: this.generateTaskId(),
            query,
            priority: constraints?.priority || 'medium',
            requiredCapabilities: this.inferRequiredCapabilities(query),
            constraints,
            createdAt: Date.now(),
            status: 'pending'
        };

        this.taskQueue.set(task.id, task);
        this.logger.info(`Task ${task.id} submitted for distributed reasoning`);

        // Process task asynchronously
        this.processTask(task);

        // Return promise that resolves when task completes
        return new Promise((resolve, reject) => {
            const checkCompletion = () => {
                const updatedTask = this.taskQueue.get(task.id);
                const result = this.completedTasks.get(task.id);
                
                if (result) {
                    resolve(result);
                } else if (updatedTask?.status === 'failed') {
                    reject(new Error(`Task ${task.id} failed`));
                } else if (updatedTask?.status === 'timeout') {
                    reject(new Error(`Task ${task.id} timed out`));
                } else {
                    // Check again after a short delay
                    setTimeout(checkCompletion, 100);
                }
            };
            
            checkCompletion();
        });
    }

    /**
     * Get the status of a distributed reasoning task
     */
    async getTaskStatus(taskId: string): Promise<DistributedReasoningTask | undefined> {
        return this.taskQueue.get(taskId);
    }

    /**
     * Cancel a distributed reasoning task
     */
    async cancelTask(taskId: string): Promise<boolean> {
        const task = this.taskQueue.get(taskId);
        if (task && task.status !== 'completed' && task.status !== 'failed') {
            task.status = 'cancelled';
            this.taskQueue.set(taskId, task);
            this.logger.info(`Task ${taskId} cancelled`);
            return true;
        }
        return false;
    }

    /**
     * Register a new reasoning node
     */
    async registerNode(registration: NodeRegistration): Promise<string> {
        const nodeId = this.generateNodeId();
        const node: ReasoningNode = {
            id: nodeId,
            endpoint: registration.endpoint,
            capabilities: registration.capabilities,
            status: 'online',
            lastHeartbeat: Date.now(),
            performance: {
                averageResponseTime: 0,
                tasksCompleted: 0,
                tasksErrored: 0,
                uptime: 0,
                reliability: 1.0
            },
            workload: 0,
            metadata: registration.metadata
        };

        this.nodeRegistry.set(nodeId, node);
        this.onNodeRegisteredEmitter.fire({ node });
        
        this.logger.info(`Node ${nodeId} registered with capabilities: ${registration.capabilities.join(', ')}`);
        return nodeId;
    }

    /**
     * Deregister a reasoning node
     */
    async deregisterNode(nodeId: string): Promise<boolean> {
        const node = this.nodeRegistry.get(nodeId);
        if (node) {
            this.nodeRegistry.delete(nodeId);
            
            // Clear heartbeat timer
            const timer = this.heartbeatTimers.get(nodeId);
            if (timer) {
                clearTimeout(timer);
                this.heartbeatTimers.delete(nodeId);
            }

            this.onNodeDeregisteredEmitter.fire({ nodeId });
            this.logger.info(`Node ${nodeId} deregistered`);
            
            // Redistribute tasks assigned to this node
            await this.redistributeTasksFromNode(nodeId);
            return true;
        }
        return false;
    }

    /**
     * Send heartbeat from a reasoning node
     */
    async sendHeartbeat(heartbeat: NodeHeartbeat): Promise<void> {
        const node = this.nodeRegistry.get(heartbeat.nodeId);
        if (node) {
            node.status = heartbeat.status;
            node.lastHeartbeat = heartbeat.timestamp;
            node.workload = heartbeat.workload;
            node.performance = heartbeat.performance;
            
            this.nodeRegistry.set(heartbeat.nodeId, node);
            
            // Reset heartbeat timeout
            this.resetHeartbeatTimeout(heartbeat.nodeId);
        }
    }

    /**
     * Get list of active reasoning nodes
     */
    async getActiveNodes(): Promise<ReasoningNode[]> {
        return Array.from(this.nodeRegistry.values()).filter(node => 
            node.status === 'online' || node.status === 'busy'
        );
    }

    /**
     * Get nodes with specific capabilities
     */
    async getNodesByCapability(capability: ReasoningCapability): Promise<ReasoningNode[]> {
        const activeNodes = await this.getActiveNodes();
        return activeNodes.filter(node => node.capabilities.includes(capability));
    }

    /**
     * Get system statistics
     */
    async getSystemStats(): Promise<DistributedReasoningStats> {
        const allNodes = Array.from(this.nodeRegistry.values());
        const activeNodes = allNodes.filter(node => 
            node.status === 'online' || node.status === 'busy'
        );

        const totalTasks = this.taskQueue.size + this.completedTasks.size;
        const completedTasks = Array.from(this.taskQueue.values()).filter(task => 
            task.status === 'completed'
        ).length + this.completedTasks.size;
        const failedTasks = Array.from(this.taskQueue.values()).filter(task => 
            task.status === 'failed'
        ).length;

        const nodeUtilization: Record<string, number> = {};
        const capabilityDistribution: Record<ReasoningCapability, number> = {} as any;

        activeNodes.forEach(node => {
            nodeUtilization[node.id] = node.workload;
            node.capabilities.forEach(cap => {
                capabilityDistribution[cap] = (capabilityDistribution[cap] || 0) + 1;
            });
        });

        const avgResponseTime = activeNodes.length > 0 ? 
            activeNodes.reduce((sum, node) => sum + node.performance.averageResponseTime, 0) / activeNodes.length : 0;

        const systemReliability = activeNodes.length > 0 ? 
            activeNodes.reduce((sum, node) => sum + node.performance.reliability, 0) / activeNodes.length : 1.0;

        return {
            totalNodes: allNodes.length,
            activeNodes: activeNodes.length,
            totalTasks,
            completedTasks,
            failedTasks,
            averageResponseTime: avgResponseTime,
            systemThroughput: this.calculateSystemThroughput(),
            nodeUtilization,
            capabilityDistribution,
            systemReliability
        };
    }

    /**
     * Update system configuration
     */
    async updateConfig(config: Partial<DistributedReasoningConfig>): Promise<void> {
        this.config = { ...this.config, ...config };
        this.logger.info('Distributed reasoning configuration updated');
    }

    /**
     * Get current system configuration
     */
    async getConfig(): Promise<DistributedReasoningConfig> {
        return { ...this.config };
    }

    /**
     * Perform system health check
     */
    async healthCheck(): Promise<{ healthy: boolean; issues?: string[] }> {
        const issues: string[] = [];
        const activeNodes = await this.getActiveNodes();

        if (activeNodes.length === 0) {
            issues.push('No active reasoning nodes available');
        }

        if (activeNodes.length < this.config.maxNodes * 0.5) {
            issues.push('Less than 50% of maximum nodes are active');
        }

        const overloadedNodes = activeNodes.filter(node => node.workload > 0.9);
        if (overloadedNodes.length > activeNodes.length * 0.3) {
            issues.push('More than 30% of nodes are overloaded');
        }

        const unreliableNodes = activeNodes.filter(node => node.performance.reliability < 0.8);
        if (unreliableNodes.length > 0) {
            issues.push(`${unreliableNodes.length} nodes have low reliability`);
        }

        return {
            healthy: issues.length === 0,
            issues: issues.length > 0 ? issues : undefined
        };
    }

    // Private helper methods

    private async processTask(task: DistributedReasoningTask): Promise<void> {
        try {
            task.status = 'assigned';
            this.taskQueue.set(task.id, task);

            // Select appropriate nodes for the task
            const selectedNodes = await this.selectNodesForTask(task);
            if (selectedNodes.length === 0) {
                throw new Error('No suitable nodes available for task');
            }

            task.assignedNodes = selectedNodes.map(node => node.id);
            task.status = 'running';
            this.taskQueue.set(task.id, task);

            // Execute task on selected nodes
            const nodeResults = await this.executeOnNodes(task, selectedNodes);

            // Aggregate results
            const aggregatedResult = await this.aggregateNodeResults(task.id, nodeResults);

            // Mark task as completed
            task.status = 'completed';
            task.results = aggregatedResult;
            this.taskQueue.set(task.id, task);
            this.completedTasks.set(task.id, aggregatedResult);

            this.onTaskCompletedEmitter.fire({ result: aggregatedResult });
            this.logger.info(`Task ${task.id} completed successfully`);

        } catch (error) {
            task.status = 'failed';
            this.taskQueue.set(task.id, task);
            
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.onTaskFailedEmitter.fire({ taskId: task.id, error: errorMessage });
            this.logger.error(`Task ${task.id} failed: ${errorMessage}`);
        }
    }

    private async selectNodesForTask(task: DistributedReasoningTask): Promise<ReasoningNode[]> {
        const availableNodes = await this.getActiveNodes();
        
        // Filter nodes by required capabilities
        const capableNodes = availableNodes.filter(node =>
            task.requiredCapabilities.every(cap => node.capabilities.includes(cap))
        );

        if (capableNodes.length === 0) {
            return [];
        }

        // Apply load balancing strategy
        const maxNodes = Math.min(
            task.constraints?.maxNodes || this.config.maxNodes,
            capableNodes.length,
            3 // Default maximum for distributed consensus
        );

        return this.applyLoadBalancing(capableNodes, maxNodes, this.config.loadBalancingStrategy);
    }

    private async executeOnNodes(
        task: DistributedReasoningTask, 
        nodes: ReasoningNode[]
    ): Promise<NodeReasoningResult[]> {
        const promises = nodes.map(async (node): Promise<NodeReasoningResult> => {
            const startTime = Date.now();
            try {
                // Simulate reasoning execution (in real implementation, would call node endpoint)
                const result = await this.simulateNodeExecution(node, task.query);
                const executionTime = Date.now() - startTime;

                // Update node performance
                this.updateNodePerformance(node.id, executionTime, true);

                return {
                    nodeId: node.id,
                    result,
                    executionTime,
                    reliability: node.performance.reliability
                };
            } catch (error) {
                const executionTime = Date.now() - startTime;
                this.updateNodePerformance(node.id, executionTime, false);

                return {
                    nodeId: node.id,
                    result: { conclusion: [], confidence: 0, explanation: 'Execution failed' },
                    executionTime,
                    reliability: node.performance.reliability,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });

        return Promise.all(promises);
    }

    private async aggregateNodeResults(
        taskId: string, 
        nodeResults: NodeReasoningResult[]
    ): Promise<DistributedReasoningResult> {
        const successfulResults = nodeResults.filter(result => !result.error);
        
        if (successfulResults.length === 0) {
            throw new Error('All nodes failed to execute the task');
        }

        // Apply aggregation strategy
        const aggregatedResult = await this.applyAggregationStrategy(
            successfulResults,
            this.config.defaultAggregationStrategy
        );

        const consensusLevel = this.calculateConsensusLevel(successfulResults);
        const totalExecutionTime = Math.max(...nodeResults.map(r => r.executionTime));

        return {
            taskId,
            nodeResults,
            aggregatedResult,
            consensusLevel,
            executionTime: totalExecutionTime,
            nodesUsed: nodeResults.length,
            metadata: {
                aggregationStrategy: this.config.defaultAggregationStrategy,
                consensusAlgorithm: this.config.defaultConsensusAlgorithm,
                nodeParticipation: nodeResults.reduce((acc, result) => {
                    acc[result.nodeId] = result.error ? 0 : 1;
                    return acc;
                }, {} as Record<string, number>),
                qualityMetrics: {
                    accuracy: consensusLevel,
                    precision: consensusLevel,
                    recall: successfulResults.length / nodeResults.length,
                    f1Score: consensusLevel * 0.9, // Simplified calculation
                    consistency: consensusLevel,
                    reliability: successfulResults.reduce((sum, r) => sum + r.reliability, 0) / successfulResults.length
                },
                distributionEfficiency: successfulResults.length / nodeResults.length
            }
        };
    }

    private async applyAggregationStrategy(
        results: NodeReasoningResult[],
        strategy: AggregationStrategy
    ): Promise<ReasoningResult> {
        switch (strategy) {
            case 'majority-vote':
                return this.majorityVoteAggregation(results);
            case 'weighted-average':
                return this.weightedAverageAggregation(results);
            case 'confidence-weighted':
                return this.confidenceWeightedAggregation(results);
            case 'best-result':
                return this.bestResultAggregation(results);
            default:
                return this.confidenceWeightedAggregation(results);
        }
    }

    private majorityVoteAggregation(results: NodeReasoningResult[]): ReasoningResult {
        // Simplified majority vote based on confidence
        const sortedResults = results.sort((a, b) => b.result.confidence - a.result.confidence);
        const bestResult = sortedResults[0].result;
        
        return {
            ...bestResult,
            explanation: `Majority vote result from ${results.length} nodes`,
            metadata: {
                ...bestResult.metadata,
                aggregationMethod: 'majority-vote',
                participatingNodes: results.length
            }
        };
    }

    private weightedAverageAggregation(results: NodeReasoningResult[]): ReasoningResult {
        const totalWeight = results.reduce((sum, r) => sum + r.reliability, 0);
        const weightedConfidence = results.reduce((sum, r) => 
            sum + (r.result.confidence * r.reliability), 0
        ) / totalWeight;

        // Use the result with highest confidence as base, but adjust confidence
        const bestResult = results.reduce((best, current) => 
            current.result.confidence > best.result.confidence ? current : best
        ).result;

        return {
            ...bestResult,
            confidence: weightedConfidence,
            explanation: `Weighted average result from ${results.length} nodes`,
            metadata: {
                ...bestResult.metadata,
                aggregationMethod: 'weighted-average',
                participatingNodes: results.length
            }
        };
    }

    private confidenceWeightedAggregation(results: NodeReasoningResult[]): ReasoningResult {
        // Weight by both confidence and reliability
        const weights = results.map(r => r.result.confidence * r.reliability);
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        
        const weightedConfidence = results.reduce((sum, r, i) => 
            sum + (r.result.confidence * weights[i]), 0
        ) / totalWeight;

        const bestResult = results.reduce((best, current) => 
            current.result.confidence > best.result.confidence ? current : best
        ).result;

        return {
            ...bestResult,
            confidence: weightedConfidence,
            explanation: `Confidence-weighted result from ${results.length} nodes`,
            metadata: {
                ...bestResult.metadata,
                aggregationMethod: 'confidence-weighted',
                participatingNodes: results.length
            }
        };
    }

    private bestResultAggregation(results: NodeReasoningResult[]): ReasoningResult {
        const bestResult = results.reduce((best, current) => {
            const bestScore = best.result.confidence * best.reliability;
            const currentScore = current.result.confidence * current.reliability;
            return currentScore > bestScore ? current : best;
        }).result;

        return {
            ...bestResult,
            explanation: `Best result selected from ${results.length} nodes`,
            metadata: {
                ...bestResult.metadata,
                aggregationMethod: 'best-result',
                participatingNodes: results.length
            }
        };
    }

    private applyLoadBalancing(
        nodes: ReasoningNode[], 
        maxNodes: number, 
        strategy: LoadBalancingStrategy
    ): ReasoningNode[] {
        switch (strategy) {
            case 'least-loaded':
                return nodes
                    .sort((a, b) => a.workload - b.workload)
                    .slice(0, maxNodes);
            case 'performance-based':
                return nodes
                    .sort((a, b) => b.performance.reliability - a.performance.reliability)
                    .slice(0, maxNodes);
            case 'random':
                return this.shuffleArray([...nodes]).slice(0, maxNodes);
            case 'round-robin':
            default:
                return nodes.slice(0, maxNodes);
        }
    }

    private calculateConsensusLevel(results: NodeReasoningResult[]): number {
        if (results.length <= 1) return 1.0;

        // Simplified consensus calculation based on confidence similarity
        const confidences = results.map(r => r.result.confidence);
        const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
        const variance = confidences.reduce((sum, c) => sum + Math.pow(c - avgConfidence, 2), 0) / confidences.length;
        
        // Lower variance means higher consensus
        return Math.max(0, 1 - variance);
    }

    private async simulateNodeExecution(node: ReasoningNode, query: ReasoningQuery): Promise<ReasoningResult> {
        // Simulate processing delay based on node performance
        const delay = node.performance.averageResponseTime || 100;
        await new Promise(resolve => setTimeout(resolve, delay));

        // Simulate reasoning result
        return {
            conclusion: [],
            confidence: 0.7 + Math.random() * 0.3, // Random confidence between 0.7-1.0
            explanation: `Reasoning result from node ${node.id}`,
            metadata: {
                nodeId: node.id,
                capabilities: node.capabilities,
                processingTime: delay
            }
        };
    }

    private updateNodePerformance(nodeId: string, executionTime: number, success: boolean): void {
        const node = this.nodeRegistry.get(nodeId);
        if (node) {
            const perf = node.performance;
            perf.averageResponseTime = (perf.averageResponseTime + executionTime) / 2;
            
            if (success) {
                perf.tasksCompleted++;
            } else {
                perf.tasksErrored++;
            }
            
            // Update reliability based on success rate
            const totalTasks = perf.tasksCompleted + perf.tasksErrored;
            perf.reliability = totalTasks > 0 ? perf.tasksCompleted / totalTasks : 1.0;
            
            this.nodeRegistry.set(nodeId, node);
        }
    }

    private inferRequiredCapabilities(query: ReasoningQuery): ReasoningCapability[] {
        const capabilities: ReasoningCapability[] = [];
        
        switch (query.type) {
            case 'deductive':
                capabilities.push('deductive');
                break;
            case 'inductive':
                capabilities.push('inductive');
                break;
            case 'abductive':
                capabilities.push('abductive');
                break;
            case 'code-analysis':
                capabilities.push('code-analysis');
                break;
            default:
                capabilities.push('deductive'); // Default capability
        }
        
        return capabilities;
    }

    private async redistributeTasksFromNode(nodeId: string): Promise<void> {
        const affectedTasks = Array.from(this.taskQueue.values()).filter(task =>
            task.assignedNodes?.includes(nodeId) && task.status === 'running'
        );

        for (const task of affectedTasks) {
            this.logger.info(`Redistributing task ${task.id} from failed node ${nodeId}`);
            task.status = 'pending';
            task.assignedNodes = undefined;
            this.taskQueue.set(task.id, task);
            
            // Reprocess the task
            this.processTask(task);
        }
    }

    private startHeartbeatMonitoring(): void {
        setInterval(() => {
            this.checkNodeHeartbeats();
        }, this.config.heartbeatInterval);
    }

    private startTaskProcessing(): void {
        // In a real implementation, this would process queued tasks
        // For now, tasks are processed immediately when submitted
    }

    private checkNodeHeartbeats(): void {
        const now = Date.now();
        const staleNodes: string[] = [];

        this.nodeRegistry.forEach((node, nodeId) => {
            if (now - node.lastHeartbeat > this.config.nodeTimeoutThreshold) {
                staleNodes.push(nodeId);
            }
        });

        staleNodes.forEach(nodeId => {
            this.logger.warn(`Node ${nodeId} heartbeat timeout, marking as offline`);
            const node = this.nodeRegistry.get(nodeId);
            if (node) {
                node.status = 'offline';
                this.nodeRegistry.set(nodeId, node);
            }
        });
    }

    private resetHeartbeatTimeout(nodeId: string): void {
        const existingTimer = this.heartbeatTimers.get(nodeId);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        const timer = setTimeout(() => {
            const node = this.nodeRegistry.get(nodeId);
            if (node) {
                node.status = 'offline';
                this.nodeRegistry.set(nodeId, node);
                this.logger.warn(`Node ${nodeId} heartbeat timeout`);
            }
        }, this.config.nodeTimeoutThreshold);

        this.heartbeatTimers.set(nodeId, timer);
    }

    private calculateSystemThroughput(): number {
        // Simplified throughput calculation
        const recentTasks = Array.from(this.taskQueue.values()).filter(task =>
            task.createdAt > Date.now() - 60000 // Tasks from last minute
        );
        return recentTasks.length / 60; // Tasks per second
    }

    private generateTaskId(): string {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateNodeId(): string {
        return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    private getDefaultConfig(): DistributedReasoningConfig {
        return {
            maxNodes: 10,
            defaultTimeout: 30000, // 30 seconds
            heartbeatInterval: 5000, // 5 seconds
            nodeTimeoutThreshold: 15000, // 15 seconds
            defaultAggregationStrategy: 'confidence-weighted',
            defaultConsensusAlgorithm: 'weighted-consensus',
            minConsensusLevel: 0.7,
            loadBalancingStrategy: 'least-loaded',
            faultToleranceLevel: 'basic',
            enablePerformanceMonitoring: true
        };
    }
}