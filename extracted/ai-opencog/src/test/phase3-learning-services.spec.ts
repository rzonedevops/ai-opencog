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
import { Container } from '@theia/core/shared/inversify';
import { SupervisedLearningServiceImpl } from '../node/supervised-learning-service';
import { UnsupervisedLearningServiceImpl } from '../node/unsupervised-learning-service';
import { ReinforcementLearningServiceImpl } from '../node/reinforcement-learning-service';
import { PatternMatchingEngine } from '../node/reasoning-engines';
import { UserFeedback } from '../common/opencog-types';

describe('Phase 3 Learning Services', () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        container.bind(PatternMatchingEngine).toSelf().inSingletonScope();
        container.bind(SupervisedLearningServiceImpl).toSelf().inSingletonScope();
        container.bind(UnsupervisedLearningServiceImpl).toSelf().inSingletonScope();
        container.bind(ReinforcementLearningServiceImpl).toSelf().inSingletonScope();
    });

    describe('SupervisedLearningService', () => {
        it('should learn from positive user feedback', async () => {
            const service = container.get(SupervisedLearningServiceImpl);
            
            const action = 'suggest_refactoring';
            const feedback: UserFeedback = {
                rating: 5,
                helpful: true,
                comment: 'Great suggestion!',
                outcome: 'accepted',
                timeSpent: 30
            };
            
            const result = await service.learnFromFeedback(action, feedback);
            
            expect(result).to.have.property('success');
            expect(result.success).to.be.true;
            expect(result).to.have.property('confidence');
            expect(result.confidence).to.be.greaterThan(0.5);
            expect(result).to.have.property('insights');
            expect(result.insights).to.be.an('array');
        });

        it('should learn from negative user feedback', async () => {
            const service = container.get(SupervisedLearningServiceImpl);
            
            const action = 'suggest_variable_name';
            const feedback: UserFeedback = {
                rating: 2,
                helpful: false,
                comment: 'Not relevant',
                outcome: 'rejected',
                timeSpent: 5
            };
            
            const result = await service.learnFromFeedback(action, feedback);
            
            expect(result).to.have.property('success');
            expect(result.success).to.be.true;
            expect(result.confidence).to.be.lessThan(0.5);
        });

        it('should train with labeled examples', async () => {
            const service = container.get(SupervisedLearningServiceImpl);
            
            const examples = [
                { input: 'function add(a, b)', output: 'arithmetic operation' },
                { input: 'class User extends Person', output: 'inheritance pattern' },
                { input: 'const users = []', output: 'collection initialization' }
            ];
            
            const result = await service.trainWithExamples(examples);
            
            expect(result).to.have.property('success');
            expect(result.success).to.be.true;
            expect(result).to.have.property('accuracy');
            expect(result.accuracy).to.be.greaterThan(0);
        });

        it('should predict outcomes', async () => {
            const service = container.get(SupervisedLearningServiceImpl);
            
            // First train with some data
            const examples = [
                { input: 'refactor function', output: 'accepted' },
                { input: 'add comments', output: 'accepted' },
                { input: 'rename variable', output: 'modified' }
            ];
            await service.trainWithExamples(examples);
            
            // Then predict
            const result = await service.predictOutcome('refactor function');
            
            expect(result).to.have.property('prediction');
            expect(result).to.have.property('confidence');
            expect(result.confidence).to.be.greaterThan(0);
        });
    });

    describe('UnsupervisedLearningService', () => {
        it('should discover patterns in code', async () => {
            const service = container.get(UnsupervisedLearningServiceImpl);
            
            const codeData = [
                'function getName() { return this.name; }',
                'function getAge() { return this.age; }',
                'function setName(name) { this.name = name; }',
                'function setAge(age) { this.age = age; }',
                'class User { constructor(name) { this.name = name; } }'
            ];
            
            const result = await service.discoverCodePatterns(codeData);
            
            expect(result).to.have.property('patterns');
            expect(result).to.have.property('confidence');
            expect(result).to.have.property('insights');
            expect(result.patterns).to.be.an('array');
            expect(result.confidence).to.be.greaterThan(0);
        });

        it('should learn workflow optimizations', async () => {
            const service = container.get(UnsupervisedLearningServiceImpl);
            
            const workflowData = [
                { action: 'edit', timeSpent: 30 },
                { action: 'save', timeSpent: 2 },
                { action: 'build', timeSpent: 45 },
                { action: 'test', timeSpent: 60 },
                { action: 'edit', timeSpent: 25 },
                { action: 'save', timeSpent: 1 },
                { action: 'build', timeSpent: 40 }
            ];
            
            const result = await service.learnWorkflowOptimizations(workflowData);
            
            expect(result).to.have.property('optimizations');
            expect(result).to.have.property('expectedImprovement');
            expect(result).to.have.property('confidence');
            expect(result.optimizations).to.be.an('array');
        });

        it('should learn quality metrics', async () => {
            const service = container.get(UnsupervisedLearningServiceImpl);
            
            const qualityData = [
                { complexity: 5, maintainability: 8, testCoverage: 85 },
                { complexity: 3, maintainability: 9, testCoverage: 92 },
                { complexity: 7, maintainability: 6, testCoverage: 70 },
                { complexity: 4, maintainability: 8, testCoverage: 88 }
            ];
            
            const result = await service.learnQualityMetrics(qualityData);
            
            expect(result).to.have.property('metrics');
            expect(result).to.have.property('confidence');
            expect(result.metrics).to.be.an('array');
            expect(result.confidence).to.be.greaterThan(0);
        });
    });

    describe('ReinforcementLearningService', () => {
        it('should learn from successful outcomes', async () => {
            const service = container.get(ReinforcementLearningServiceImpl);
            
            const input = {
                action: 'suggest_optimization',
                outcome: 'success' as const,
                context: {
                    userId: 'user1',
                    projectType: 'web-application'
                },
                metrics: {
                    efficiency: 0.8,
                    accuracy: 0.9
                }
            };
            
            const result = await service.learnFromOutcome(input);
            
            expect(result).to.have.property('success');
            expect(result.success).to.be.true;
            expect(result).to.have.property('confidence');
            expect(result.confidence).to.be.greaterThan(0.5);
        });

        it('should learn from failed outcomes', async () => {
            const service = container.get(ReinforcementLearningServiceImpl);
            
            const input = {
                action: 'suggest_variable_name',
                outcome: 'failure' as const,
                context: {
                    userId: 'user1',
                    projectType: 'mobile-app'
                }
            };
            
            const result = await service.learnFromOutcome(input);
            
            expect(result).to.have.property('success');
            expect(result.success).to.be.true;
            expect(result.confidence).to.be.lessThan(0.5);
        });

        it('should recognize success patterns', async () => {
            const service = container.get(ReinforcementLearningServiceImpl);
            
            const data = [
                { action: 'refactor', outcome: 'success', context: { projectType: 'web' } },
                { action: 'refactor', outcome: 'success', context: { projectType: 'web' } },
                { action: 'optimize', outcome: 'failure', context: { projectType: 'mobile' } },
                { action: 'refactor', outcome: 'success', context: { projectType: 'web' } }
            ];
            
            const result = await service.recognizeSuccessPatterns(data);
            
            expect(result).to.be.an('array');
            if (result.length > 0) {
                const pattern = result[0];
                expect(pattern).to.have.property('pattern');
                expect(pattern).to.have.property('successRate');
                expect(pattern).to.have.property('confidence');
                expect(pattern).to.have.property('applicableContexts');
            }
        });

        it('should optimize adaptive assistance', async () => {
            const service = container.get(ReinforcementLearningServiceImpl);
            
            const userId = 'user1';
            const context = {
                userId: 'user1',
                projectType: 'web-application',
                userExperience: 'intermediate' as const,
                currentTask: 'debugging'
            };
            
            const result = await service.optimizeAdaptiveAssistance(userId, context);
            
            expect(result).to.have.property('optimizations');
            expect(result).to.have.property('confidence');
            expect(result.optimizations).to.be.an('array');
            expect(result.confidence).to.be.greaterThanOrEqual(0);
        });
    });
});