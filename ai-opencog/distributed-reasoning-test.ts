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
 * Test and validation script for distributed reasoning capabilities
 */

import { Container } from '@theia/core/shared/inversify';
import { ILogger, ConsoleLogger } from '@theia/core/lib/common/logger';
import { DistributedReasoningServiceImpl } from '../src/node/distributed-reasoning-service-impl';
import { ReasoningNodeWorkerImpl } from '../src/node/reasoning-node-worker';
import { PLNReasoningEngine, PatternMatchingEngine, CodeAnalysisReasoningEngine } from '../src/node/reasoning-engines';
import {
    DistributedReasoningService,
    ReasoningQuery,
    NodeRegistration,
    ReasoningCapability
} from '../src/common';

/**
 * Test suite for distributed reasoning functionality
 */
class DistributedReasoningTestSuite {
    private container: Container;
    private distributedService: DistributedReasoningService;
    private logger: ILogger;

    constructor() {
        this.container = new Container();
        this.setupContainer();
        this.distributedService = this.container.get(DistributedReasoningService);
        this.logger = this.container.get(ILogger);
    }

    private setupContainer(): void {
        // Bind logger
        this.container.bind(ILogger).to(ConsoleLogger).inSingletonScope();

        // Bind reasoning engines
        this.container.bind(PLNReasoningEngine).toSelf().inSingletonScope();
        this.container.bind(PatternMatchingEngine).toSelf().inSingletonScope();
        this.container.bind(CodeAnalysisReasoningEngine).toSelf().inSingletonScope();

        // Bind distributed reasoning service
        this.container.bind(DistributedReasoningService).to(DistributedReasoningServiceImpl).inSingletonScope();

        // Bind reasoning node workers
        this.container.bind(ReasoningNodeWorkerImpl).toSelf();
    }

    /**
     * Run all tests
     */
    async runAllTests(): Promise<void> {
        console.log('🚀 Starting Distributed Reasoning Test Suite\n');

        try {
            await this.testBasicFunctionality();
            await this.testNodeRegistration();
            await this.testTaskDistribution();
            await this.testResultAggregation();
            await this.testFaultTolerance();
            await this.testPerformanceMonitoring();
            await this.testSystemHealth();

            console.log('✅ All tests completed successfully!\n');
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            throw error;
        }
    }

    /**
     * Test basic distributed reasoning functionality
     */
    private async testBasicFunctionality(): Promise<void> {
        console.log('🔍 Testing basic distributed reasoning functionality...');

        // Register a few test nodes
        const node1Id = await this.distributedService.registerNode({
            endpoint: 'http://test-node-1:8080',
            capabilities: ['deductive', 'inductive'],
            metadata: { test: true, tier: 'basic' }
        });

        const node2Id = await this.distributedService.registerNode({
            endpoint: 'http://test-node-2:8080',
            capabilities: ['abductive', 'pattern-matching'],
            metadata: { test: true, tier: 'premium' }
        });

        console.log(`   ✓ Registered test nodes: ${node1Id}, ${node2Id}`);

        // Submit a simple reasoning task
        const query: ReasoningQuery = {
            type: 'deductive',
            atoms: [
                {
                    type: 'ConceptNode',
                    name: 'test-concept',
                    truthValue: { strength: 0.8, confidence: 0.9 }
                }
            ],
            context: { testCase: 'basic-functionality' }
        };

        const result = await this.distributedService.submitTask(query);
        
        console.log(`   ✓ Task completed with confidence: ${result.aggregatedResult.confidence}`);
        console.log(`   ✓ Consensus level: ${result.consensusLevel}`);
        console.log(`   ✓ Nodes used: ${result.nodesUsed}`);

        // Verify result structure
        if (!result.aggregatedResult || !result.nodeResults || result.nodeResults.length === 0) {
            throw new Error('Invalid result structure');
        }

        console.log('   ✅ Basic functionality test passed\n');
    }

    /**
     * Test node registration and management
     */
    private async testNodeRegistration(): Promise<void> {
        console.log('🔍 Testing node registration and management...');

        const initialStats = await this.distributedService.getSystemStats();
        const initialNodeCount = initialStats.activeNodes;

        // Register additional nodes
        const registrations: NodeRegistration[] = [
            {
                endpoint: 'http://test-node-3:8080',
                capabilities: ['code-analysis'],
                metadata: { specialized: true, language: 'typescript' }
            },
            {
                endpoint: 'http://test-node-4:8080',
                capabilities: ['multi-modal', 'tensor-processing'],
                metadata: { specialized: true, type: 'gpu-accelerated' }
            }
        ];

        const nodeIds: string[] = [];
        for (const registration of registrations) {
            const nodeId = await this.distributedService.registerNode(registration);
            nodeIds.push(nodeId);
        }

        console.log(`   ✓ Registered ${nodeIds.length} additional nodes`);

        // Verify nodes are active
        const activeNodes = await this.distributedService.getActiveNodes();
        const expectedNodeCount = initialNodeCount + registrations.length;
        
        if (activeNodes.length !== expectedNodeCount) {
            throw new Error(`Expected ${expectedNodeCount} active nodes, got ${activeNodes.length}`);
        }

        console.log(`   ✓ Verified ${activeNodes.length} active nodes`);

        // Test capability-based node selection
        const codeAnalysisNodes = await this.distributedService.getNodesByCapability('code-analysis');
        if (codeAnalysisNodes.length === 0) {
            throw new Error('No nodes found with code-analysis capability');
        }

        console.log(`   ✓ Found ${codeAnalysisNodes.length} nodes with code-analysis capability`);

        // Test node deregistration
        const deregistered = await this.distributedService.deregisterNode(nodeIds[0]);
        if (!deregistered) {
            throw new Error('Failed to deregister node');
        }

        console.log(`   ✓ Successfully deregistered node ${nodeIds[0]}`);
        console.log('   ✅ Node registration test passed\n');
    }

    /**
     * Test task distribution across multiple nodes
     */
    private async testTaskDistribution(): Promise<void> {
        console.log('🔍 Testing task distribution across multiple nodes...');

        // Submit multiple tasks with different priorities
        const tasks = [
            {
                query: { type: 'deductive' as const, context: { priority: 'high' } },
                constraints: { priority: 'high' as const, maxNodes: 2 }
            },
            {
                query: { type: 'inductive' as const, context: { priority: 'medium' } },
                constraints: { priority: 'medium' as const, maxNodes: 3 }
            },
            {
                query: { type: 'abductive' as const, context: { priority: 'low' } },
                constraints: { priority: 'low' as const, maxNodes: 1 }
            }
        ];

        const results = await Promise.all(
            tasks.map(task => this.distributedService.submitTask(task.query, task.constraints))
        );

        console.log(`   ✓ Completed ${results.length} distributed tasks`);

        // Verify all tasks completed successfully
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (!result.aggregatedResult || result.consensusLevel < 0) {
                throw new Error(`Task ${i} failed or produced invalid result`);
            }
            console.log(`   ✓ Task ${i + 1}: confidence=${result.aggregatedResult.confidence.toFixed(2)}, consensus=${result.consensusLevel.toFixed(2)}`);
        }

        console.log('   ✅ Task distribution test passed\n');
    }

    /**
     * Test result aggregation strategies
     */
    private async testResultAggregation(): Promise<void> {
        console.log('🔍 Testing result aggregation strategies...');

        // Update configuration to test different aggregation strategies
        const strategies = ['majority-vote', 'weighted-average', 'confidence-weighted', 'best-result'] as const;

        for (const strategy of strategies) {
            await this.distributedService.updateConfig({
                defaultAggregationStrategy: strategy
            });

            const query: ReasoningQuery = {
                type: 'deductive',
                context: { aggregationTest: strategy }
            };

            const result = await this.distributedService.submitTask(query, { maxNodes: 3 });
            
            if (!result.metadata?.aggregationStrategy || result.metadata.aggregationStrategy !== strategy) {
                throw new Error(`Expected aggregation strategy ${strategy}, got ${result.metadata?.aggregationStrategy}`);
            }

            console.log(`   ✓ ${strategy}: confidence=${result.aggregatedResult.confidence.toFixed(2)}, consensus=${result.consensusLevel.toFixed(2)}`);
        }

        console.log('   ✅ Result aggregation test passed\n');
    }

    /**
     * Test fault tolerance mechanisms
     */
    private async testFaultTolerance(): Promise<void> {
        console.log('🔍 Testing fault tolerance mechanisms...');

        // Get initial system state
        const initialHealth = await this.distributedService.healthCheck();
        console.log(`   ✓ Initial system health: ${initialHealth.healthy ? 'healthy' : 'unhealthy'}`);

        // Simulate node failure by deregistering nodes
        const activeNodes = await this.distributedService.getActiveNodes();
        if (activeNodes.length > 0) {
            const nodeToFail = activeNodes[0];
            await this.distributedService.deregisterNode(nodeToFail.id);
            console.log(`   ✓ Simulated failure of node ${nodeToFail.id}`);

            // Submit task after node failure
            const query: ReasoningQuery = {
                type: 'deductive',
                context: { faultToleranceTest: true }
            };

            const result = await this.distributedService.submitTask(query);
            if (!result.aggregatedResult) {
                throw new Error('System failed to handle node failure gracefully');
            }

            console.log(`   ✓ System handled node failure gracefully`);
            console.log(`   ✓ Task completed with ${result.nodesUsed} remaining nodes`);
        }

        // Check system health after failure
        const postFailureHealth = await this.distributedService.healthCheck();
        console.log(`   ✓ Post-failure system health: ${postFailureHealth.healthy ? 'healthy' : 'degraded'}`);

        console.log('   ✅ Fault tolerance test passed\n');
    }

    /**
     * Test performance monitoring
     */
    private async testPerformanceMonitoring(): Promise<void> {
        console.log('🔍 Testing performance monitoring...');

        const stats = await this.distributedService.getSystemStats();
        
        console.log(`   ✓ Total nodes: ${stats.totalNodes}`);
        console.log(`   ✓ Active nodes: ${stats.activeNodes}`);
        console.log(`   ✓ Total tasks: ${stats.totalTasks}`);
        console.log(`   ✓ Completed tasks: ${stats.completedTasks}`);
        console.log(`   ✓ Failed tasks: ${stats.failedTasks}`);
        console.log(`   ✓ Average response time: ${stats.averageResponseTime.toFixed(2)}ms`);
        console.log(`   ✓ System throughput: ${stats.systemThroughput.toFixed(2)} tasks/sec`);
        console.log(`   ✓ System reliability: ${stats.systemReliability.toFixed(2)}`);

        // Verify stats structure
        if (typeof stats.totalNodes !== 'number' || 
            typeof stats.activeNodes !== 'number' ||
            typeof stats.systemReliability !== 'number') {
            throw new Error('Invalid statistics structure');
        }

        console.log('   ✅ Performance monitoring test passed\n');
    }

    /**
     * Test system health checks
     */
    private async testSystemHealth(): Promise<void> {
        console.log('🔍 Testing system health checks...');

        const health = await this.distributedService.healthCheck();
        
        console.log(`   ✓ System healthy: ${health.healthy}`);
        if (health.issues && health.issues.length > 0) {
            console.log(`   ⚠️  Health issues detected:`);
            health.issues.forEach(issue => console.log(`      - ${issue}`));
        }

        // Test configuration retrieval
        const config = await this.distributedService.getConfig();
        if (!config || typeof config.maxNodes !== 'number') {
            throw new Error('Invalid configuration structure');
        }

        console.log(`   ✓ Configuration loaded: maxNodes=${config.maxNodes}, strategy=${config.loadBalancingStrategy}`);

        console.log('   ✅ System health test passed\n');
    }
}

/**
 * Run the test suite if this file is executed directly
 */
async function runTests(): Promise<void> {
    const testSuite = new DistributedReasoningTestSuite();
    
    try {
        await testSuite.runAllTests();
        console.log('🎉 Distributed reasoning implementation validated successfully!');
        console.log('\n📊 Summary:');
        console.log('   • Node registration and management ✅');
        console.log('   • Task distribution and execution ✅');
        console.log('   • Result aggregation strategies ✅');
        console.log('   • Fault tolerance mechanisms ✅');
        console.log('   • Performance monitoring ✅');
        console.log('   • System health checks ✅');
        console.log('\n🚀 Distributed reasoning capabilities are ready for production use!');
        
    } catch (error) {
        console.error('\n💥 Test suite failed:', error);
        process.exit(1);
    }
}

// Export for use in other modules
export { DistributedReasoningTestSuite };

// Run tests if executed directly
if (require.main === module) {
    runTests().catch(console.error);
}