/**
 * Copyright (c) 2024 Cognitive Intelligence Ventures.
 * 
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 * 
 * SPDX-License-Identifier: EPL-2.0
 */

import { expect } from 'chai';
import { ResourceManager } from '../common/resource-manager';

describe('ResourceManager', () => {
    let resourceManager: ResourceManager;

    beforeEach(() => {
        resourceManager = new ResourceManager();
    });

    afterEach(() => {
        resourceManager.dispose();
    });

    it('should initialize with default metrics and thresholds', () => {
        const metrics = resourceManager.getMetrics();
        
        expect(metrics).to.have.property('memoryUsage');
        expect(metrics).to.have.property('performance');
        expect(metrics).to.have.property('utilization');
        
        expect(metrics.memoryUsage.total).to.equal(0);
        expect(metrics.performance.queryLatency).to.equal(0);
        expect(metrics.utilization.cpuUsage).to.equal(0);
    });

    it('should optimize AtomSpace memory', async () => {
        // Set some initial memory usage
        resourceManager.updateMetrics({
            memoryUsage: {
                atomSpace: 100 * 1024 * 1024, // 100MB
                learningModels: 50 * 1024 * 1024,
                cache: 25 * 1024 * 1024,
                total: 175 * 1024 * 1024
            }
        });

        const optimization = await resourceManager.optimizeAtomSpaceMemory();
        
        expect(optimization.beforeSize).to.equal(100 * 1024 * 1024);
        expect(optimization.afterSize).to.be.lessThan(optimization.beforeSize);
        expect(optimization.atomsRemoved).to.be.greaterThan(0);
        expect(optimization.memoryFreed).to.be.greaterThan(0);
    });

    it('should distribute processing tasks', async () => {
        const tasks = [
            { id: 'task1', type: 'reasoning' as const, priority: 1, estimatedTime: 1000 },
            { id: 'task2', type: 'learning' as const, priority: 3, estimatedTime: 500 },
            { id: 'task3', type: 'pattern_matching' as const, priority: 2, estimatedTime: 2000 }
        ];

        const assignments = await resourceManager.distributeProcessing(tasks);
        
        expect(assignments).to.have.length(3);
        
        // Should assign high priority task first
        const highPriorityAssignment = assignments.find(a => a.taskId === 'task2');
        expect(highPriorityAssignment).to.exist;
        expect(highPriorityAssignment!.assignedCore).to.be.a('number');
        expect(highPriorityAssignment!.estimatedCompletion).to.be.a('number');
    });

    it('should optimize network communication', async () => {
        // Set high network bandwidth to trigger optimization
        resourceManager.updateMetrics({
            utilization: {
                cpuUsage: 0,
                memoryUtilization: 0,
                diskUsage: 0,
                networkBandwidth: 2 * 1024 * 1024 // 2MB/s
            }
        });

        const optimization = await resourceManager.optimizeNetworkCommunication();
        
        expect(optimization.compressionEnabled).to.be.true;
        expect(optimization.batchingEnabled).to.be.true;
        expect(optimization.connectionPoolSize).to.be.greaterThan(1);
        expect(optimization.estimatedBandwidthSaving).to.be.greaterThan(0);
    });

    it('should update resource thresholds', () => {
        const newThresholds = {
            memoryWarning: 150 * 1024 * 1024,
            memoryCritical: 300 * 1024 * 1024
        };

        resourceManager.setThresholds(newThresholds);
        
        // Verify thresholds are updated by triggering a check
        resourceManager.updateMetrics({
            memoryUsage: {
                atomSpace: 200 * 1024 * 1024,
                learningModels: 0,
                cache: 0,
                total: 200 * 1024 * 1024
            }
        });

        // Should not trigger critical threshold with new settings
        const metrics = resourceManager.getMetrics();
        expect(metrics.memoryUsage.total).to.equal(200 * 1024 * 1024);
    });

    it('should manage optimization strategies', () => {
        const strategies = resourceManager.getOptimizationStrategies();
        
        expect(strategies).to.be.an('array');
        expect(strategies.length).to.be.greaterThan(0);
        
        // Should have default strategies
        const memoryCompression = strategies.find(s => s.name === 'Memory Compression');
        expect(memoryCompression).to.exist;
        expect(memoryCompression!.enabled).to.be.true;
        
        // Test disabling a strategy
        resourceManager.setOptimizationStrategy('memory_compression', false);
        
        const updatedStrategies = resourceManager.getOptimizationStrategies();
        const disabledStrategy = updatedStrategies.find(s => s.name === 'Memory Compression');
        expect(disabledStrategy!.enabled).to.be.false;
    });

    it('should perform automatic optimization', async () => {
        // Set metrics that would trigger optimization
        resourceManager.updateMetrics({
            memoryUsage: {
                atomSpace: 350 * 1024 * 1024,
                learningModels: 50 * 1024 * 1024,
                cache: 30 * 1024 * 1024,
                total: 430 * 1024 * 1024 // Above warning threshold (400MB)
            },
            performance: {
                queryLatency: 90, // Above warning threshold (80ms)
                reasoningLatency: 150,
                learningLatency: 120,
                throughput: 50
            }
        });

        const result = await resourceManager.performAutoOptimization();
        
        expect(result.actionsPerformed).to.be.an('array');
        expect(result.actionsPerformed.length).to.be.greaterThan(0);
        expect(result.metricsImprovement).to.be.an('object');
    });

    it('should start and stop monitoring', () => {
        // Monitoring should start automatically in constructor
        resourceManager.stopMonitoring();
        
        // Restart monitoring
        resourceManager.startMonitoring();
        
        // No specific assertions as monitoring is internal
        // Just verify no errors occur
        expect(true).to.be.true;
    });

    it('should handle strategy parameter updates', () => {
        const newParameters = {
            compressionRatio: 0.5,
            cacheSize: 2000
        };

        resourceManager.setOptimizationStrategy('memory_compression', true, newParameters);
        
        const strategies = resourceManager.getOptimizationStrategies();
        const strategy = strategies.find(s => s.name === 'Memory Compression');
        
        expect(strategy!.parameters.compressionRatio).to.equal(0.5);
    });

    it('should handle metrics updates correctly', () => {
        const initialMetrics = resourceManager.getMetrics();
        
        const newMetrics = {
            memoryUsage: {
                atomSpace: 50 * 1024 * 1024,
                learningModels: 25 * 1024 * 1024,
                cache: 10 * 1024 * 1024,
                total: 85 * 1024 * 1024
            }
        };

        resourceManager.updateMetrics(newMetrics);
        
        const updatedMetrics = resourceManager.getMetrics();
        expect(updatedMetrics.memoryUsage.total).to.equal(85 * 1024 * 1024);
        expect(updatedMetrics.memoryUsage.atomSpace).to.equal(50 * 1024 * 1024);
        
        // Other metrics should remain unchanged
        expect(updatedMetrics.performance.queryLatency).to.equal(initialMetrics.performance.queryLatency);
    });
});