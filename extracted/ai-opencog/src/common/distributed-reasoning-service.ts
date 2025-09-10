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

import {
    DistributedReasoningTask,
    DistributedReasoningResult,
    DistributedReasoningConfig,
    ReasoningNode,
    NodeRegistration,
    NodeHeartbeat,
    DistributedReasoningStats,
    ReasoningCapability
} from './distributed-reasoning-types';
import { ReasoningQuery } from './opencog-types';

/**
 * Service path for distributed reasoning
 */
export const DISTRIBUTED_REASONING_SERVICE_PATH = '/services/distributed-reasoning';

/**
 * Main interface for distributed reasoning service
 */
export interface DistributedReasoningService {
    /**
     * Submit a reasoning task for distributed processing
     */
    submitTask(query: ReasoningQuery, constraints?: any): Promise<DistributedReasoningResult>;

    /**
     * Get the status of a distributed reasoning task
     */
    getTaskStatus(taskId: string): Promise<DistributedReasoningTask | undefined>;

    /**
     * Cancel a distributed reasoning task
     */
    cancelTask(taskId: string): Promise<boolean>;

    /**
     * Register a new reasoning node
     */
    registerNode(registration: NodeRegistration): Promise<string>;

    /**
     * Deregister a reasoning node
     */
    deregisterNode(nodeId: string): Promise<boolean>;

    /**
     * Send heartbeat from a reasoning node
     */
    sendHeartbeat(heartbeat: NodeHeartbeat): Promise<void>;

    /**
     * Get list of active reasoning nodes
     */
    getActiveNodes(): Promise<ReasoningNode[]>;

    /**
     * Get nodes with specific capabilities
     */
    getNodesByCapability(capability: ReasoningCapability): Promise<ReasoningNode[]>;

    /**
     * Get system statistics
     */
    getSystemStats(): Promise<DistributedReasoningStats>;

    /**
     * Update system configuration
     */
    updateConfig(config: Partial<DistributedReasoningConfig>): Promise<void>;

    /**
     * Get current system configuration
     */
    getConfig(): Promise<DistributedReasoningConfig>;

    /**
     * Perform system health check
     */
    healthCheck(): Promise<{ healthy: boolean; issues?: string[] }>;
}

/**
 * Interface for reasoning node workers
 */
export interface ReasoningNodeWorker {
    /**
     * Execute a reasoning task
     */
    executeTask(query: ReasoningQuery, constraints?: any): Promise<any>;

    /**
     * Get node capabilities
     */
    getCapabilities(): ReasoningCapability[];

    /**
     * Get current node status and performance
     */
    getStatus(): Promise<{ status: string; workload: number; performance: any }>;

    /**
     * Shutdown the node gracefully
     */
    shutdown(): Promise<void>;
}

/**
 * Interface for distributed reasoning coordinator
 */
export interface DistributedReasoningCoordinator {
    /**
     * Coordinate task distribution across nodes
     */
    distributeTasks(tasks: DistributedReasoningTask[]): Promise<void>;

    /**
     * Aggregate results from multiple nodes
     */
    aggregateResults(taskId: string, nodeResults: any[]): Promise<DistributedReasoningResult>;

    /**
     * Handle node failures and task redistribution
     */
    handleNodeFailure(nodeId: string): Promise<void>;

    /**
     * Balance load across nodes
     */
    balanceLoad(): Promise<void>;

    /**
     * Monitor system performance
     */
    monitorPerformance(): Promise<DistributedReasoningStats>;
}

/**
 * Interface for node registry management
 */
export interface NodeRegistry {
    /**
     * Register a new node
     */
    register(registration: NodeRegistration): Promise<string>;

    /**
     * Deregister a node
     */
    deregister(nodeId: string): Promise<boolean>;

    /**
     * Update node status
     */
    updateNode(nodeId: string, updates: Partial<ReasoningNode>): Promise<void>;

    /**
     * Get node by ID
     */
    getNode(nodeId: string): Promise<ReasoningNode | undefined>;

    /**
     * Get all active nodes
     */
    getActiveNodes(): Promise<ReasoningNode[]>;

    /**
     * Find nodes by capability
     */
    findNodesByCapability(capability: ReasoningCapability): Promise<ReasoningNode[]>;

    /**
     * Handle node heartbeats
     */
    processHeartbeat(heartbeat: NodeHeartbeat): Promise<void>;

    /**
     * Clean up inactive nodes
     */
    cleanupInactiveNodes(): Promise<string[]>;
}

/**
 * Interface for task queue management
 */
export interface TaskQueue {
    /**
     * Add task to queue
     */
    enqueue(task: DistributedReasoningTask): Promise<void>;

    /**
     * Get next task for processing
     */
    dequeue(): Promise<DistributedReasoningTask | undefined>;

    /**
     * Get task by ID
     */
    getTask(taskId: string): Promise<DistributedReasoningTask | undefined>;

    /**
     * Update task status
     */
    updateTask(taskId: string, updates: Partial<DistributedReasoningTask>): Promise<void>;

    /**
     * Remove completed or failed tasks
     */
    cleanup(): Promise<number>;

    /**
     * Get queue statistics
     */
    getStats(): Promise<{ pending: number; running: number; completed: number; failed: number }>;
}

/**
 * Interface for result aggregation strategies
 */
export interface ResultAggregator {
    /**
     * Aggregate results using majority vote
     */
    majorityVote(results: any[]): Promise<any>;

    /**
     * Aggregate results using weighted average
     */
    weightedAverage(results: any[], weights: number[]): Promise<any>;

    /**
     * Aggregate results using confidence weighting
     */
    confidenceWeighted(results: any[]): Promise<any>;

    /**
     * Aggregate results using performance weighting
     */
    performanceWeighted(results: any[], performances: number[]): Promise<any>;

    /**
     * Find consensus among results
     */
    findConsensus(results: any[], threshold: number): Promise<{ result: any; consensus: number }>;

    /**
     * Select best result based on confidence
     */
    selectBestResult(results: any[]): Promise<any>;
}

/**
 * Interface for load balancing strategies
 */
export interface LoadBalancer {
    /**
     * Select nodes for task assignment using round-robin
     */
    roundRobin(nodes: ReasoningNode[], count: number): Promise<ReasoningNode[]>;

    /**
     * Select least loaded nodes
     */
    leastLoaded(nodes: ReasoningNode[], count: number): Promise<ReasoningNode[]>;

    /**
     * Select nodes based on performance
     */
    performanceBased(nodes: ReasoningNode[], count: number): Promise<ReasoningNode[]>;

    /**
     * Select nodes optimized for specific capabilities
     */
    capabilityOptimized(
        nodes: ReasoningNode[], 
        capabilities: ReasoningCapability[], 
        count: number
    ): Promise<ReasoningNode[]>;

    /**
     * Select random nodes
     */
    random(nodes: ReasoningNode[], count: number): Promise<ReasoningNode[]>;
}

/**
 * Interface for fault tolerance management
 */
export interface FaultTolerance {
    /**
     * Detect node failures
     */
    detectFailures(): Promise<string[]>;

    /**
     * Handle node failure
     */
    handleFailure(nodeId: string): Promise<void>;

    /**
     * Redistribute tasks from failed nodes
     */
    redistributeTasks(failedNodeId: string): Promise<void>;

    /**
     * Validate results for Byzantine fault tolerance
     */
    validateResults(results: any[]): Promise<{ valid: boolean; suspiciousNodes: string[] }>;

    /**
     * Recover from system failures
     */
    recover(): Promise<void>;
}