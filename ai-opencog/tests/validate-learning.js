#!/usr/bin/env node

/**
 * Simple validation script to test learning and adaptation systems
 * without requiring full Theia build system
 */

// Mock the required dependencies for testing
import process from "node:process";
const mockInversify = {
    injectable: () => (target) => target,
    inject: () => () => {}
};

// Set up global mocks
globalThis.injectable = mockInversify.injectable;
globalThis.inject = mockInversify.inject;

// Mock Theia dependencies
const mockTheia = {
    '@theia/core/shared/inversify': mockInversify,
    '@theia/core/lib/browser/messaging': {
        WebSocketConnectionProvider: class MockWebSocketConnectionProvider {}
    },
    '@theia/ai-core/lib/common/agent-service': {
        AgentService: class MockAgentService {}
    },
    '@theia/ai-core/lib/common/agent': {
        Agent: class MockAgent {}
    },
    '@theia/workspace/lib/browser': {
        WorkspaceService: class MockWorkspaceService {}
    }
};

// Mock require for Theia modules
const originalRequire = require;
require = function(id) {
    if (mockTheia[id]) {
        return mockTheia[id];
    }
    return originalRequire.apply(this, arguments);
};

// Import our implementation
const { AtomSpaceService } = require('../lib/node/atomspace-service');

async function validateLearningAndAdaptation() {
    console.log('🧠 Validating Learning and Adaptation Systems...\n');
    
    const atomSpaceService = new AtomSpaceService();
    let testsPassed = 0;
    let testsTotal = 0;

    function test(name, assertion) {
        testsTotal++;
        try {
            if (assertion()) {
                console.log(`✅ ${name}`);
                testsPassed++;
            } else {
                console.log(`❌ ${name}`);
            }
        } catch (error) {
            console.log(`❌ ${name} - Error: ${error.message}`);
        }
    }

    async function asyncTest(name, assertion) {
        testsTotal++;
        try {
            if (await assertion()) {
                console.log(`✅ ${name}`);
                testsPassed++;
            } else {
                console.log(`❌ ${name}`);
            }
        } catch (error) {
            console.log(`❌ ${name} - Error: ${error.message}`);
        }
    }

    // Test 1: Basic Learning
    await asyncTest('Basic learning functionality', async () => {
        await atomSpaceService.learn({
            type: 'supervised',
            input: { test: 'data' },
            context: { userId: 'user123' },
            timestamp: Date.now()
        });
        const stats = await atomSpaceService.getLearningStats();
        return stats.totalLearningRecords > 0;
    });

    // Test 2: Feedback Learning
    await asyncTest('Feedback learning', async () => {
        await atomSpaceService.learnFromFeedback(
            { rating: 5, helpful: true, outcome: 'accepted' },
            { userId: 'user123', currentTask: 'testing' }
        );
        const stats = await atomSpaceService.getLearningStats();
        return stats.totalLearningRecords > 1;
    });

    // Test 3: User Adaptation
    await asyncTest('User adaptation', async () => {
        const strategy = await atomSpaceService.adaptToUser('user123', 'test_domain', {});
        return strategy && strategy.userId === 'user123' && strategy.domain === 'test_domain';
    });

    // Test 4: Behavior Learning
    await asyncTest('Behavior pattern learning', async () => {
        await atomSpaceService.learnUserBehavior('user123', 'test_action', { context: 'test' });
        const patterns = await atomSpaceService.getUserBehaviorPatterns('user123');
        return patterns.length > 0 && patterns[0].pattern === 'test_action';
    });

    // Test 5: Action Prediction
    await asyncTest('Action prediction', async () => {
        const predictions = await atomSpaceService.predictUserAction('user123', { context: 'test' });
        return Array.isArray(predictions);
    });

    // Test 6: Learning Model Management
    await asyncTest('Learning model creation', async () => {
        const model = await atomSpaceService.createLearningModel('test_model', { param: 'value' });
        return model && model.type === 'test_model';
    });

    // Test 7: Model Training
    await asyncTest('Model training', async () => {
        const model = await atomSpaceService.createLearningModel('training_test');
        const updatedModel = await atomSpaceService.updateLearningModel(model.id, [{
            type: 'supervised',
            input: { test: 1 },
            timestamp: Date.now()
        }]);
        return updatedModel.version > model.version;
    });

    // Test 8: Personalization
    await asyncTest('User personalization', async () => {
        await atomSpaceService.personalize('user123', { theme: 'dark', fontSize: 14 });
        const prefs = await atomSpaceService.getPersonalization('user123');
        return prefs.theme === 'dark' && prefs.fontSize === 14;
    });

    // Test 9: Learning Analytics
    await asyncTest('Learning analytics', async () => {
        const stats = await atomSpaceService.getLearningStats();
        return typeof stats.totalLearningRecords === 'number' &&
               typeof stats.userAdaptations === 'number' &&
               typeof stats.behaviorPatterns === 'number';
    });

    // Test 10: Multiple Learning Types
    await asyncTest('Multiple learning types', async () => {
        const types = ['supervised', 'unsupervised', 'reinforcement', 'behavioral', 'adaptive'];
        for (const type of types) {
            await atomSpaceService.learn({
                type,
                input: { testType: type },
                context: { userId: 'user123' },
                timestamp: Date.now()
            });
        }
        const stats = await atomSpaceService.getLearningStats();
        return stats.totalLearningRecords >= types.length;
    });

    // Summary
    console.log(`\n📊 Test Results: ${testsPassed}/${testsTotal} tests passed`);
    
    if (testsPassed === testsTotal) {
        console.log('🎉 All learning and adaptation systems are working correctly!');
        console.log('\n🧠 Key Features Validated:');
        console.log('   ✅ Enhanced learning algorithms');
        console.log('   ✅ User behavior adaptation'); 
        console.log('   ✅ Personalization system');
        console.log('   ✅ Learning model management');
        console.log('   ✅ Behavioral pattern recognition');
        console.log('   ✅ Feedback processing');
        console.log('   ✅ Learning analytics');
        return true;
    } else {
        console.log('❌ Some tests failed. Check implementation.');
        return false;
    }
}

// Run validation if this script is executed directly
if (require.main === module) {
    validateLearningAndAdaptation()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Validation failed:', error);
            process.exit(1);
        });
}

module.exports = { validateLearningAndAdaptation };