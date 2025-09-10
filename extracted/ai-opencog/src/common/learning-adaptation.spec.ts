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

import { expect } from 'chai';
import { AtomSpaceService } from '../node/atomspace-service';
import { LearningData, UserFeedback, LearningContext } from '../common/opencog-types';

describe('Learning and Adaptation Systems', () => {
    let atomSpaceService: AtomSpaceService;

    beforeEach(() => {
        atomSpaceService = new AtomSpaceService();
    });

    describe('Enhanced Learning', () => {
        it('should learn from supervised learning data', async () => {
            const learningData: LearningData = {
                type: 'supervised',
                input: { code: 'console.log("hello");' },
                expectedOutput: { suggestion: 'Add semicolon' },
                context: {
                    userId: 'user123',
                    currentTask: 'code_completion'
                },
                timestamp: Date.now()
            };

            await atomSpaceService.learn(learningData);
            const stats = await atomSpaceService.getLearningStats();
            
            expect(stats.totalLearningRecords).to.equal(1);
        });

        it('should learn from user feedback', async () => {
            const feedback: UserFeedback = {
                rating: 5,
                helpful: true,
                comment: 'Great suggestion!',
                outcome: 'accepted',
                timeSpent: 30
            };

            const context: LearningContext = {
                userId: 'user123',
                currentTask: 'debugging',
                userExperience: 'intermediate'
            };

            await atomSpaceService.learnFromFeedback(feedback, context);
            const stats = await atomSpaceService.getLearningStats();
            
            expect(stats.totalLearningRecords).to.equal(1);
        });

        it('should handle different learning types', async () => {
            const learningTypes: LearningData['type'][] = [
                'supervised', 'unsupervised', 'reinforcement', 
                'personalization', 'behavioral', 'adaptive'
            ];

            for (const type of learningTypes) {
                const data: LearningData = {
                    type,
                    input: { test: `data for ${type}` },
                    context: { userId: 'user123' },
                    timestamp: Date.now()
                };

                await atomSpaceService.learn(data);
            }

            const stats = await atomSpaceService.getLearningStats();
            expect(stats.totalLearningRecords).to.equal(learningTypes.length);
        });
    });

    describe('User Adaptation', () => {
        it('should create adaptation strategies for users', async () => {
            const userId = 'user123';
            const domain = 'code_completion';
            const data = { preferences: { maxSuggestions: 5 } };

            const strategy = await atomSpaceService.adaptToUser(userId, domain, data);
            
            expect(strategy.userId).to.equal(userId);
            expect(strategy.domain).to.equal(domain);
            expect(strategy.effectiveness).to.be.a('number');
        });

        it('should retrieve adaptation strategies', async () => {
            const userId = 'user123';
            const domain = 'debugging';
            const data = { verboseLogging: true };

            await atomSpaceService.adaptToUser(userId, domain, data);
            const retrievedStrategy = await atomSpaceService.getAdaptationStrategy(userId, domain);
            
            expect(retrievedStrategy).to.not.be.undefined;
            expect(retrievedStrategy!.userId).to.equal(userId);
            expect(retrievedStrategy!.domain).to.equal(domain);
        });
    });

    describe('Behavioral Learning', () => {
        it('should learn user behavior patterns', async () => {
            const userId = 'user123';
            const action = 'open_file';
            const context = { fileType: 'typescript', time: 'morning' };

            await atomSpaceService.learnUserBehavior(userId, action, context);
            const patterns = await atomSpaceService.getUserBehaviorPatterns(userId);
            
            expect(patterns).to.have.length(1);
            expect(patterns[0].pattern).to.equal(action);
            expect(patterns[0].frequency).to.equal(1);
        });

        it('should increment frequency for repeated behaviors', async () => {
            const userId = 'user123';
            const action = 'save_file';
            const context = { fileType: 'javascript' };

            // Learn the same behavior multiple times
            await atomSpaceService.learnUserBehavior(userId, action, context);
            await atomSpaceService.learnUserBehavior(userId, action, context);
            await atomSpaceService.learnUserBehavior(userId, action, context);

            const patterns = await atomSpaceService.getUserBehaviorPatterns(userId);
            
            expect(patterns).to.have.length(1);
            expect(patterns[0].frequency).to.equal(3);
        });

        it('should predict user actions based on patterns', async () => {
            const userId = 'user123';
            const action = 'run_tests';
            const context = { projectType: 'javascript', timeOfDay: 'afternoon' };

            // Learn some behavior
            await atomSpaceService.learnUserBehavior(userId, action, context);
            
            // Predict similar context
            const predictions = await atomSpaceService.predictUserAction(userId, {
                projectType: 'javascript',
                timeOfDay: 'afternoon'
            });
            
            expect(predictions).to.have.length.greaterThan(0);
            expect(predictions[0].action).to.equal(action);
            expect(predictions[0].confidence).to.be.greaterThan(0);
        });
    });

    describe('Learning Models', () => {
        it('should create learning models', async () => {
            const modelType = 'user_preferences';
            const parameters = { algorithm: 'neural_network', layers: 3 };

            const model = await atomSpaceService.createLearningModel(modelType, parameters);
            
            expect(model.type).to.equal(modelType);
            expect(model.parameters).to.deep.equal(parameters);
            expect(model.version).to.equal(1);
        });

        it('should update learning models with training data', async () => {
            const model = await atomSpaceService.createLearningModel('test_model');
            const trainingData: LearningData[] = [
                {
                    type: 'supervised',
                    input: { test: 1 },
                    expectedOutput: { result: 'A' },
                    timestamp: Date.now()
                },
                {
                    type: 'supervised',
                    input: { test: 2 },
                    expectedOutput: { result: 'B' },
                    timestamp: Date.now()
                }
            ];

            const updatedModel = await atomSpaceService.updateLearningModel(model.id, trainingData);
            
            expect(updatedModel.version).to.equal(2);
            expect(updatedModel.trainingData).to.have.length(2);
            expect(updatedModel.accuracy).to.be.a('number');
        });

        it('should list all learning models', async () => {
            await atomSpaceService.createLearningModel('model1');
            await atomSpaceService.createLearningModel('model2');
            await atomSpaceService.createLearningModel('model3');

            const models = await atomSpaceService.listLearningModels();
            
            expect(models).to.have.length(3);
        });
    });

    describe('Personalization', () => {
        it('should store user personalization preferences', async () => {
            const userId = 'user123';
            const preferences = {
                theme: 'dark',
                fontSize: 14,
                preferredLanguage: 'typescript',
                showLineNumbers: true
            };

            await atomSpaceService.personalize(userId, preferences);
            const retrieved = await atomSpaceService.getPersonalization(userId);
            
            expect(retrieved.theme).to.equal('dark');
            expect(retrieved.fontSize).to.equal(14);
            expect(retrieved.preferredLanguage).to.equal('typescript');
            expect(retrieved.showLineNumbers).to.equal(true);
        });

        it('should merge new preferences with existing ones', async () => {
            const userId = 'user123';
            
            // Set initial preferences
            await atomSpaceService.personalize(userId, { theme: 'light', fontSize: 12 });
            
            // Update some preferences
            await atomSpaceService.personalize(userId, { fontSize: 16, autoSave: true });
            
            const retrieved = await atomSpaceService.getPersonalization(userId);
            
            expect(retrieved.theme).to.equal('light'); // Should be preserved
            expect(retrieved.fontSize).to.equal(16); // Should be updated
            expect(retrieved.autoSave).to.equal(true); // Should be added
        });
    });

    describe('Learning Analytics', () => {
        it('should provide comprehensive learning statistics', async () => {
            // Create some learning data
            await atomSpaceService.learn({
                type: 'supervised',
                input: { test: 1 },
                timestamp: Date.now()
            });

            // Create a model
            const model = await atomSpaceService.createLearningModel('test');
            await atomSpaceService.updateLearningModel(model.id, [{
                type: 'supervised',
                input: { test: 1 },
                feedback: { rating: 5, helpful: true },
                timestamp: Date.now()
            }]);

            // Create adaptation strategy
            await atomSpaceService.adaptToUser('user1', 'test_domain', {});

            // Create behavior pattern
            await atomSpaceService.learnUserBehavior('user1', 'test_action', {});

            const stats = await atomSpaceService.getLearningStats();
            
            expect(stats.totalLearningRecords).to.equal(3); // learn + updateModel creates learning + learnUserBehavior
            expect(stats.modelAccuracy).to.be.an('object');
            expect(stats.userAdaptations).to.equal(1);
            expect(stats.behaviorPatterns).to.equal(1);
        });
    });
});