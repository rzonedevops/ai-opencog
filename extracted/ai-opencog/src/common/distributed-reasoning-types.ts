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

import { ReasoningQuery, ReasoningResult, TruthValue } from './opencog-types';

/**
 * Represents a reasoning node in the distributed system
 */
export interface ReasoningNode {
    id: string;
    endpoint: string;
    capabilities: ReasoningCapability[];
    status: NodeStatus;
    lastHeartbeat: number;
    performance: NodePerformance;
    workload: number; // 0.0 to 1.0
    metadata?: Record<string, any>;
}

/**
 * Reasoning capabilities that a node can provide
 */
export type ReasoningCapability = 
    | 'deductive'
    | 'inductive' 
    | 'abductive'
    | 'pattern-matching'
    | 'code-analysis'
    | 'multi-modal'
    | 'tensor-processing'
    | 'cross-modal-fusion';

/**
 * Status of a reasoning node
 */
export type NodeStatus = 
    | 'online'
    | 'offline'
    | 'busy'
    | 'error'
    | 'maintenance';

/**
 * Performance metrics for a reasoning node
 */
export interface NodePerformance {
    averageResponseTime: number; // milliseconds
    tasksCompleted: number;
    tasksErrored: number;
    uptime: number; // milliseconds
    cpuUsage?: number; // 0.0 to 1.0
    memoryUsage?: number; // 0.0 to 1.0
    reliability: number; // 0.0 to 1.0
}

/**
 * Distributed reasoning task
 */
export interface DistributedReasoningTask {
    id: string;
    query: ReasoningQuery;
    priority: TaskPriority;
    requiredCapabilities: ReasoningCapability[];
    constraints?: TaskConstraints;
    createdAt: number;
    assignedNodes?: string[];
    status: TaskStatus;
    results?: DistributedReasoningResult;
    metadata?: Record<string, any>;
}

/**
 * Priority levels for reasoning tasks
 */
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Status of a distributed reasoning task
 */
export type TaskStatus = 
    | 'pending'
    | 'assigned'
    | 'running'
    | 'completed'
    | 'failed'
    | 'timeout'
    | 'cancelled';

/**
 * Constraints for task execution
 */
export interface TaskConstraints {
    maxExecutionTime?: number; // milliseconds
    minConfidence?: number; // 0.0 to 1.0
    preferredNodes?: string[];
    excludedNodes?: string[];
    requireAllNodes?: boolean;
    maxNodes?: number;
}

/**
 * Result from distributed reasoning
 */
export interface DistributedReasoningResult {
    taskId: string;
    nodeResults: NodeReasoningResult[];
    aggregatedResult: ReasoningResult;
    consensusLevel: number; // 0.0 to 1.0
    executionTime: number; // milliseconds
    nodesUsed: number;
    metadata?: DistributedResultMetadata;
}

/**
 * Result from a single reasoning node
 */
export interface NodeReasoningResult {
    nodeId: string;
    result: ReasoningResult;
    executionTime: number;
    reliability: number;
    error?: string;
}

/**
 * Metadata for distributed reasoning results
 */
export interface DistributedResultMetadata {
    aggregationStrategy: AggregationStrategy;
    consensusAlgorithm: ConsensusAlgorithm;
    nodeParticipation: Record<string, number>; // nodeId -> participation score
    qualityMetrics: QualityMetrics;
    distributionEfficiency: number;
}

/**
 * Strategies for aggregating results from multiple nodes
 */
export type AggregationStrategy = 
    | 'majority-vote'
    | 'weighted-average'
    | 'confidence-weighted'
    | 'performance-weighted'
    | 'consensus-based'
    | 'best-result';

/**
 * Algorithms for reaching consensus among nodes
 */
export type ConsensusAlgorithm = 
    | 'simple-majority'
    | 'weighted-consensus'
    | 'byzantine-fault-tolerant'
    | 'proof-of-reasoning'
    | 'confidence-threshold';

/**
 * Quality metrics for distributed reasoning
 */
export interface QualityMetrics {
    accuracy: number; // 0.0 to 1.0
    precision: number; // 0.0 to 1.0
    recall: number; // 0.0 to 1.0
    f1Score: number; // 0.0 to 1.0
    consistency: number; // 0.0 to 1.0
    reliability: number; // 0.0 to 1.0
}

/**
 * Configuration for the distributed reasoning system
 */
export interface DistributedReasoningConfig {
    maxNodes: number;
    defaultTimeout: number; // milliseconds
    heartbeatInterval: number; // milliseconds
    nodeTimeoutThreshold: number; // milliseconds
    defaultAggregationStrategy: AggregationStrategy;
    defaultConsensusAlgorithm: ConsensusAlgorithm;
    minConsensusLevel: number; // 0.0 to 1.0
    loadBalancingStrategy: LoadBalancingStrategy;
    faultToleranceLevel: FaultToleranceLevel;
    enablePerformanceMonitoring: boolean;
}

/**
 * Load balancing strategies
 */
export type LoadBalancingStrategy = 
    | 'round-robin'
    | 'least-loaded'
    | 'performance-based'
    | 'capability-optimized'
    | 'random'
    | 'proximity-aware';

/**
 * Fault tolerance levels
 */
export type FaultToleranceLevel = 
    | 'none'
    | 'basic'
    | 'high'
    | 'byzantine';

/**
 * Node registration information
 */
export interface NodeRegistration {
    endpoint: string;
    capabilities: ReasoningCapability[];
    metadata?: Record<string, any>;
    authToken?: string;
}

/**
 * Heartbeat message from reasoning node
 */
export interface NodeHeartbeat {
    nodeId: string;
    status: NodeStatus;
    workload: number;
    performance: NodePerformance;
    timestamp: number;
}

/**
 * Task assignment message
 */
export interface TaskAssignment {
    taskId: string;
    nodeId: string;
    query: ReasoningQuery;
    constraints?: TaskConstraints;
    deadline: number;
}

/**
 * Task completion message
 */
export interface TaskCompletion {
    taskId: string;
    nodeId: string;
    result: ReasoningResult;
    executionTime: number;
    error?: string;
}

/**
 * Statistics for the distributed reasoning system
 */
export interface DistributedReasoningStats {
    totalNodes: number;
    activeNodes: number;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageResponseTime: number;
    systemThroughput: number; // tasks per second
    nodeUtilization: Record<string, number>;
    capabilityDistribution: Record<ReasoningCapability, number>;
    systemReliability: number;
}

/**
 * Events emitted by the distributed reasoning system
 */
export interface DistributedReasoningEvents {
    'node-registered': { node: ReasoningNode };
    'node-deregistered': { nodeId: string };
    'node-heartbeat': { heartbeat: NodeHeartbeat };
    'node-status-changed': { nodeId: string; oldStatus: NodeStatus; newStatus: NodeStatus };
    'task-created': { task: DistributedReasoningTask };
    'task-assigned': { taskId: string; nodeIds: string[] };
    'task-completed': { result: DistributedReasoningResult };
    'task-failed': { taskId: string; error: string };
    'consensus-reached': { taskId: string; consensusLevel: number };
    'system-overloaded': { utilizationLevel: number };
}