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

/**
 * Distributed Reasoning Usage Examples
 * 
 * This file demonstrates various usage patterns for the distributed reasoning
 * capabilities in the SKZ framework.
 */

import {
    DistributedReasoningService,
    ReasoningQuery,
    NodeRegistration,
    ReasoningCapability,
    DistributedReasoningConfig
} from '../src/common';

/**
 * Example 1: Basic Distributed Reasoning
 */
export async function basicDistributedReasoning(
    distributedReasoning: DistributedReasoningService
): Promise<void> {
    console.log('🔍 Example 1: Basic Distributed Reasoning');

    // Submit a deductive reasoning task
    const query: ReasoningQuery = {
        type: 'deductive',
        atoms: [
            {
                type: 'ImplicationLink',
                name: 'if-then-rule',
                truthValue: { strength: 0.9, confidence: 0.85 },
                outgoing: [
                    { type: 'ConceptNode', name: 'Programming' },
                    { type: 'ConceptNode', name: 'ProblemSolving' }
                ]
            },
            {
                type: 'ConceptNode',
                name: 'Programming',
                truthValue: { strength: 0.8, confidence: 0.9 }
            }
        ],
        context: {
            domain: 'software-engineering',
            task: 'logical-inference'
        }
    };

    const result = await distributedReasoning.submitTask(query, {
        priority: 'medium',
        maxNodes: 3,
        minConfidence: 0.7
    });

    console.log(`   ✓ Task completed with confidence: ${result.aggregatedResult.confidence.toFixed(3)}`);
    console.log(`   ✓ Consensus level: ${result.consensusLevel.toFixed(3)}`);
    console.log(`   ✓ Nodes used: ${result.nodesUsed}`);
    console.log(`   ✓ Execution time: ${result.executionTime}ms`);
    console.log(`   ✓ Distribution efficiency: ${result.metadata?.distributionEfficiency?.toFixed(3)}`);
}

/**
 * Example 2: Code Analysis with Distributed Reasoning
 */
export async function distributedCodeAnalysis(
    distributedReasoning: DistributedReasoningService
): Promise<void> {
    console.log('\n🔍 Example 2: Distributed Code Analysis');

    const codeSnippet = `
    function calculateFactorial(n: number): number {
        if (n <= 1) return 1;
        return n * calculateFactorial(n - 1);
    }
    `;

    const query: ReasoningQuery = {
        type: 'code-analysis',
        context: {
            code: codeSnippet,
            language: 'typescript',
            analysisType: 'comprehensive'
        },
        parameters: {
            checkComplexity: true,
            checkPerformance: true,
            checkBestPractices: true
        }
    };

    const result = await distributedReasoning.submitTask(query, {
        priority: 'high',
        requiredCapabilities: ['code-analysis'],
        maxNodes: 2,
        maxExecutionTime: 10000
    });

    console.log(`   ✓ Code analysis completed`);
    console.log(`   ✓ Analysis confidence: ${result.aggregatedResult.confidence.toFixed(3)}`);
    console.log(`   ✓ Quality metrics:`);
    console.log(`     - Accuracy: ${result.metadata?.qualityMetrics?.accuracy?.toFixed(3)}`);
    console.log(`     - Reliability: ${result.metadata?.qualityMetrics?.reliability?.toFixed(3)}`);
    console.log(`   ✓ Analysis result: ${result.aggregatedResult.explanation}`);
}

/**
 * Example 3: Multi-Modal Distributed Reasoning
 */
export async function multiModalDistributedReasoning(
    distributedReasoning: DistributedReasoningService
): Promise<void> {
    console.log('\n🔍 Example 3: Multi-Modal Distributed Reasoning');

    const query: ReasoningQuery = {
        type: 'abductive',
        context: {
            textData: 'User is experiencing performance issues with the application',
            imageData: { 
                description: 'Screenshot showing high CPU usage',
                features: ['high-cpu', 'slow-response']
            },
            audioData: {
                transcript: 'The app feels sluggish when I click buttons',
                sentiment: 'frustrated'
            }
        },
        parameters: {
            fusionStrategy: 'attention-based',
            modalityWeights: { text: 0.4, image: 0.4, audio: 0.2 }
        }
    };

    const result = await distributedReasoning.submitTask(query, {
        priority: 'high',
        requiredCapabilities: ['abductive', 'multi-modal'],
        maxNodes: 4,
        preferredNodes: ['gpu-node-1', 'gpu-node-2']
    });

    console.log(`   ✓ Multi-modal reasoning completed`);
    console.log(`   ✓ Cross-modal correlation: ${result.metadata?.crossModalCorrelation?.toFixed(3) || 'N/A'}`);
    console.log(`   ✓ Hypothesis generated: ${result.aggregatedResult.explanation}`);
    console.log(`   ✓ Confidence in diagnosis: ${result.aggregatedResult.confidence.toFixed(3)}`);
}

/**
 * Example 4: High-Priority Critical Reasoning
 */
export async function criticalReasoningTask(
    distributedReasoning: DistributedReasoningService
): Promise<void> {
    console.log('\n🔍 Example 4: High-Priority Critical Reasoning');

    const query: ReasoningQuery = {
        type: 'deductive',
        context: {
            scenario: 'security-incident',
            urgency: 'critical',
            data: [
                'Unusual network traffic detected',
                'Multiple failed authentication attempts',
                'Privileged account accessed from unusual location'
            ]
        },
        parameters: {
            securityLevel: 'high',
            responseTime: 'immediate'
        }
    };

    const result = await distributedReasoning.submitTask(query, {
        priority: 'critical',
        maxNodes: 5,
        minConfidence: 0.9,
        maxExecutionTime: 5000,
        requireAllNodes: false
    });

    console.log(`   ✓ Critical analysis completed in ${result.executionTime}ms`);
    console.log(`   ✓ Security assessment confidence: ${result.aggregatedResult.confidence.toFixed(3)}`);
    console.log(`   ✓ Threat level: ${result.aggregatedResult.metadata?.threatLevel || 'Unknown'}`);
    console.log(`   ✓ Recommended action: ${result.aggregatedResult.explanation}`);
}

/**
 * Example 5: Node Management and Monitoring
 */
export async function nodeManagementExample(
    distributedReasoning: DistributedReasoningService
): Promise<void> {
    console.log('\n🔍 Example 5: Node Management and Monitoring');

    // Register specialized reasoning nodes
    const nodeRegistrations: NodeRegistration[] = [
        {
            endpoint: 'http://reasoning-node-premium:8080',
            capabilities: ['deductive', 'inductive', 'abductive', 'code-analysis'],
            metadata: {
                tier: 'premium',
                region: 'us-east',
                specialization: 'general-reasoning',
                computeResources: { cpu: 8, memory: '32GB', gpu: false }
            }
        },
        {
            endpoint: 'http://reasoning-node-gpu:8080',
            capabilities: ['multi-modal', 'tensor-processing', 'pattern-matching'],
            metadata: {
                tier: 'gpu-accelerated',
                region: 'us-west',
                specialization: 'ml-reasoning',
                computeResources: { cpu: 16, memory: '64GB', gpu: true, gpuModel: 'V100' }
            }
        },
        {
            endpoint: 'http://reasoning-node-code:8080',
            capabilities: ['code-analysis', 'pattern-matching'],
            metadata: {
                tier: 'specialized',
                region: 'eu-central',
                specialization: 'code-analysis',
                supportedLanguages: ['typescript', 'javascript', 'python', 'java']
            }
        }
    ];

    // Register nodes
    const nodeIds: string[] = [];
    for (const registration of nodeRegistrations) {
        const nodeId = await distributedReasoning.registerNode(registration);
        nodeIds.push(nodeId);
        console.log(`   ✓ Registered ${registration.metadata?.specialization} node: ${nodeId}`);
    }

    // Monitor system statistics
    const stats = await distributedReasoning.getSystemStats();
    console.log('\n   📊 System Statistics:');
    console.log(`   ✓ Total nodes: ${stats.totalNodes}`);
    console.log(`   ✓ Active nodes: ${stats.activeNodes}`);
    console.log(`   ✓ System throughput: ${stats.systemThroughput.toFixed(2)} tasks/sec`);
    console.log(`   ✓ Average response time: ${stats.averageResponseTime.toFixed(2)}ms`);
    console.log(`   ✓ System reliability: ${stats.systemReliability.toFixed(3)}`);

    // Check capability distribution
    console.log('\n   🎯 Capability Distribution:');
    Object.entries(stats.capabilityDistribution).forEach(([capability, count]) => {
        console.log(`   ✓ ${capability}: ${count} nodes`);
    });

    // Find nodes by capability
    const codeAnalysisNodes = await distributedReasoning.getNodesByCapability('code-analysis');
    console.log(`\n   🔍 Code analysis capable nodes: ${codeAnalysisNodes.length}`);
    codeAnalysisNodes.forEach(node => {
        console.log(`   ✓ ${node.id} (${node.metadata?.specialization || 'general'})`);
    });
}

/**
 * Example 6: System Configuration and Health Monitoring
 */
export async function systemConfigurationExample(
    distributedReasoning: DistributedReasoningService
): Promise<void> {
    console.log('\n🔍 Example 6: System Configuration and Health Monitoring');

    // Update system configuration for high-performance scenarios
    const highPerformanceConfig: Partial<DistributedReasoningConfig> = {
        maxNodes: 20,
        defaultTimeout: 30000,
        heartbeatInterval: 3000,
        nodeTimeoutThreshold: 10000,
        defaultAggregationStrategy: 'confidence-weighted',
        loadBalancingStrategy: 'performance-based',
        faultToleranceLevel: 'high',
        minConsensusLevel: 0.8
    };

    await distributedReasoning.updateConfig(highPerformanceConfig);
    console.log('   ✓ Updated system configuration for high-performance operation');

    // Get current configuration
    const currentConfig = await distributedReasoning.getConfig();
    console.log('\n   ⚙️  Current Configuration:');
    console.log(`   ✓ Max nodes: ${currentConfig.maxNodes}`);
    console.log(`   ✓ Load balancing: ${currentConfig.loadBalancingStrategy}`);
    console.log(`   ✓ Aggregation strategy: ${currentConfig.defaultAggregationStrategy}`);
    console.log(`   ✓ Fault tolerance: ${currentConfig.faultToleranceLevel}`);
    console.log(`   ✓ Min consensus level: ${currentConfig.minConsensusLevel}`);

    // Perform health check
    const health = await distributedReasoning.healthCheck();
    console.log('\n   🏥 System Health Check:');
    console.log(`   ✓ System healthy: ${health.healthy ? '✅ Yes' : '❌ No'}`);
    
    if (health.issues && health.issues.length > 0) {
        console.log('   ⚠️  Health issues detected:');
        health.issues.forEach(issue => {
            console.log(`     - ${issue}`);
        });
    } else {
        console.log('   ✅ No health issues detected');
    }
}

/**
 * Example 7: Fault Tolerance and Recovery
 */
export async function faultToleranceExample(
    distributedReasoning: DistributedReasoningService
): Promise<void> {
    console.log('\n🔍 Example 7: Fault Tolerance and Recovery');

    // Submit a task that requires multiple nodes
    const resilientQuery: ReasoningQuery = {
        type: 'inductive',
        context: {
            scenario: 'pattern-discovery',
            dataSet: 'large-codebase',
            requiresResilience: true
        },
        parameters: {
            patternTypes: ['design-patterns', 'anti-patterns', 'code-smells'],
            minConfidence: 0.7
        }
    };

    console.log('   🚀 Submitting resilient reasoning task...');
    
    const result = await distributedReasoning.submitTask(resilientQuery, {
        priority: 'medium',
        maxNodes: 4,
        minConfidence: 0.8,
        maxExecutionTime: 15000,
        requireAllNodes: false // Allow task to complete with fewer nodes if some fail
    });

    console.log(`   ✓ Task completed successfully despite potential node failures`);
    console.log(`   ✓ Actual nodes used: ${result.nodesUsed}`);
    console.log(`   ✓ Result confidence: ${result.aggregatedResult.confidence.toFixed(3)}`);
    console.log(`   ✓ System resilience demonstrated: ${result.metadata?.distributionEfficiency?.toFixed(3)}`);

    // Check if any nodes had issues during execution
    const failedNodes = result.nodeResults.filter(nr => nr.error);
    if (failedNodes.length > 0) {
        console.log(`   ⚠️  ${failedNodes.length} nodes encountered errors but task still completed`);
        failedNodes.forEach(fn => {
            console.log(`     - Node ${fn.nodeId}: ${fn.error}`);
        });
    } else {
        console.log('   ✅ All nodes executed successfully');
    }
}

/**
 * Main example runner
 */
export async function runAllExamples(
    distributedReasoning: DistributedReasoningService
): Promise<void> {
    console.log('🎯 Distributed Reasoning Usage Examples\n');
    console.log('======================================\n');

    try {
        await basicDistributedReasoning(distributedReasoning);
        await distributedCodeAnalysis(distributedReasoning);
        await multiModalDistributedReasoning(distributedReasoning);
        await criticalReasoningTask(distributedReasoning);
        await nodeManagementExample(distributedReasoning);
        await systemConfigurationExample(distributedReasoning);
        await faultToleranceExample(distributedReasoning);

        console.log('\n🎉 All examples completed successfully!');
        console.log('\n📋 Examples Summary:');
        console.log('   1. ✅ Basic distributed reasoning');
        console.log('   2. ✅ Distributed code analysis');
        console.log('   3. ✅ Multi-modal reasoning');
        console.log('   4. ✅ Critical priority tasks');
        console.log('   5. ✅ Node management');
        console.log('   6. ✅ System configuration');
        console.log('   7. ✅ Fault tolerance');

    } catch (error) {
        console.error('\n❌ Example execution failed:', error);
        throw error;
    }
}

/**
 * Performance benchmark example
 */
export async function performanceBenchmark(
    distributedReasoning: DistributedReasoningService,
    taskCount: number = 10
): Promise<void> {
    console.log(`\n🏃‍♂️ Performance Benchmark: ${taskCount} concurrent tasks`);

    const startTime = Date.now();
    const tasks = Array.from({ length: taskCount }, (_, i) => ({
        type: 'deductive' as const,
        context: { benchmarkTask: i, timestamp: Date.now() }
    }));

    const results = await Promise.all(
        tasks.map(query => distributedReasoning.submitTask(query, { priority: 'medium' }))
    );

    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / taskCount;
    const throughput = (taskCount / totalTime) * 1000; // tasks per second

    console.log(`   ✓ Completed ${taskCount} tasks in ${totalTime}ms`);
    console.log(`   ✓ Average time per task: ${avgTime.toFixed(2)}ms`);
    console.log(`   ✓ System throughput: ${throughput.toFixed(2)} tasks/sec`);
    console.log(`   ✓ All tasks completed with avg confidence: ${
        (results.reduce((sum, r) => sum + r.aggregatedResult.confidence, 0) / results.length).toFixed(3)
    }`);
}