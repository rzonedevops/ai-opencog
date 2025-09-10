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
import * as sinon from 'sinon';
import { Container } from '@theia/core/shared/inversify';
import { UserBehaviorLearningAgent } from '../browser/user-behavior-learning-agent';
import { OpenCogService } from './opencog-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { EditorManager } from '@theia/editor/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser';
import { VariableResolverService } from '@theia/variable-resolver/lib/browser';
import { LearningData, UserBehaviorPattern, UserFeedback } from './opencog-types';

describe('UserBehaviorLearningAgent', () => {
    let container: Container;
    let agent: UserBehaviorLearningAgent;
    let mockOpenCogService: sinon.SinonStubbedInstance<OpenCogService>;
    let mockWorkspaceService: sinon.SinonStubbedInstance<WorkspaceService>;
    let mockEditorManager: sinon.SinonStubbedInstance<EditorManager>;
    let mockFileService: sinon.SinonStubbedInstance<FileService>;
    let mockVariableService: sinon.SinonStubbedInstance<VariableResolverService>;

    beforeEach(() => {
        container = new Container();
        
        // Create mocks
        mockOpenCogService = {
            learn: sinon.stub().resolves(),
            learnFromFeedback: sinon.stub().resolves(),
            learnUserBehavior: sinon.stub().resolves(),
            getUserBehaviorPatterns: sinon.stub().resolves([]),
            predictUserAction: sinon.stub().resolves([]),
            personalize: sinon.stub().resolves(),
            adaptToUser: sinon.stub().resolves({ strategy: {} }),
            getPersonalization: sinon.stub().resolves({})
        } as any;

        mockWorkspaceService = {
            workspace: {
                resource: {
                    toString: sinon.stub().returns('file:///test/workspace')
                }
            }
        } as any;

        mockEditorManager = {
            onCurrentEditorChanged: sinon.stub().returns({ dispose: sinon.stub() })
        } as any;

        mockFileService = {} as any;
        mockVariableService = {} as any;

        // Bind mocks
        container.bind(OpenCogService).toConstantValue(mockOpenCogService);
        container.bind(WorkspaceService).toConstantValue(mockWorkspaceService);
        container.bind(EditorManager).toConstantValue(mockEditorManager);
        container.bind(FileService).toConstantValue(mockFileService);
        container.bind(VariableResolverService).toConstantValue(mockVariableService);
        container.bind(UserBehaviorLearningAgent).toSelf();

        agent = container.get(UserBehaviorLearningAgent);
    });

    describe('agent properties', () => {
        it('should have correct agent identification', () => {
            expect(agent.id).to.equal('user-behavior-learning');
            expect(agent.name).to.equal('User Behavior Learning');
            expect(agent.description).to.contain('Learns from user interactions');
        });

        it('should declare required variables', () => {
            expect(agent.variables).to.include('userBehaviorContext');
            expect(agent.variables).to.include('currentSession');
            expect(agent.variables).to.include('behaviorPatterns');
            expect(agent.variables).to.include('learningProgress');
        });

        it('should declare required functions', () => {
            expect(agent.functions).to.include('analyze-user-behavior');
            expect(agent.functions).to.include('predict-next-action');
            expect(agent.functions).to.include('get-behavior-insights');
            expect(agent.functions).to.include('adapt-interface');
        });

        it('should have behavior analysis prompts', () => {
            expect(agent.prompts).to.have.length.greaterThan(0);
            const behaviorPrompt = agent.prompts.find(p => p.id === 'behavior-analysis-prompt');
            expect(behaviorPrompt).to.exist;
            expect(behaviorPrompt!.content).to.contain('Analyze user behavior patterns');
        });
    });

    describe('trackUserBehavior', () => {
        it('should track user behavior and learn from it', async () => {
            const userId = 'test-user';
            const action = 'file-open';
            const context = { fileName: 'test.ts', fileType: 'typescript' };

            await agent.trackUserBehavior(userId, action, context, 1000, true);

            // Verify OpenCog learning was called
            expect(mockOpenCogService.learn).to.have.been.calledOnce;
            expect(mockOpenCogService.predictUserAction).to.have.been.calledOnce;
            
            const learningCall = mockOpenCogService.learn.getCall(0);
            const learningData = learningCall.args[0] as LearningData;
            expect(learningData.type).to.equal('behavioral');
            expect(learningData.data.action).to.equal(action);
            expect(learningData.context.userId).to.equal(userId);
        });

        it('should handle failed actions correctly', async () => {
            const userId = 'test-user';
            const action = 'command-execute';
            const context = { command: 'invalid-command' };

            await agent.trackUserBehavior(userId, action, context, 500, false);

            const learningCall = mockOpenCogService.learn.getCall(0);
            const learningData = learningCall.args[0] as LearningData;
            expect(learningData.data.success).to.equal(false);
        });
    });

    describe('learnUserPreferences', () => {
        it('should analyze behavior patterns to extract preferences', async () => {
            const userId = 'test-user';
            
            // Simulate some tracked behaviors first
            await agent.trackUserBehavior(userId, 'file-open', { fileName: 'test.ts' });
            await agent.trackUserBehavior(userId, 'file-open', { fileName: 'main.js' });
            await agent.trackUserBehavior(userId, 'command-execute', { command: 'save-all' });

            const preferences = await agent.learnUserPreferences(userId);

            expect(preferences).to.be.an('object');
            expect(preferences.preferredFileTypes).to.be.an('array');
            expect(preferences.frequentCommands).to.be.an('array');
            expect(preferences.workingHours).to.be.an('array');
            
            // Verify personalization was stored in OpenCog
            expect(mockOpenCogService.personalize).to.have.been.calledOnceWith(userId, preferences);
        });

        it('should identify file type preferences from behavior', async () => {
            const userId = 'test-user';
            
            // Track multiple TypeScript file accesses
            for (let i = 0; i < 5; i++) {
                await agent.trackUserBehavior(userId, 'file-open', { fileName: `test${i}.ts` });
            }
            
            // Track fewer JavaScript file accesses  
            for (let i = 0; i < 2; i++) {
                await agent.trackUserBehavior(userId, 'file-open', { fileName: `script${i}.js` });
            }

            const preferences = await agent.learnUserPreferences(userId);
            
            expect(preferences.preferredFileTypes).to.include('ts');
            expect(preferences.preferredFileTypes.indexOf('ts')).to.be.lessThan(
                preferences.preferredFileTypes.indexOf('js')
            );
        });
    });

    describe('getBehaviorRecommendations', () => {
        beforeEach(() => {
            // Mock behavior patterns for recommendations
            mockOpenCogService.getUserBehaviorPatterns.resolves([
                {
                    userId: 'test-user',
                    pattern: 'frequent-file-switching',
                    frequency: 10,
                    confidence: 0.8,
                    timestamp: Date.now()
                }
            ]);
        });

        it('should generate behavior-based recommendations', async () => {
            const userId = 'test-user';
            
            // Track some behaviors to build analytics
            await agent.trackUserBehavior(userId, 'file-open', { fileName: 'test.ts' }, 2000);
            await agent.trackUserBehavior(userId, 'command-execute', { command: 'save' }, 1000, false);

            const recommendations = await agent.getBehaviorRecommendations(userId);

            expect(recommendations).to.be.an('array');
            expect(recommendations.length).to.be.greaterThan(0);
            
            const recommendation = recommendations[0];
            expect(recommendation).to.have.property('type');
            expect(recommendation).to.have.property('recommendation');
            expect(recommendation).to.have.property('confidence');
            expect(recommendation.confidence).to.be.within(0, 1);
        });

        it('should recommend productivity improvements for low productivity scores', async () => {
            const userId = 'test-user';
            
            // Track several slow/unsuccessful actions
            for (let i = 0; i < 5; i++) {
                await agent.trackUserBehavior(userId, 'command-search', { query: 'unknown' }, 5000, false);
            }

            const recommendations = await agent.getBehaviorRecommendations(userId);
            
            const productivityRec = recommendations.find(r => r.type === 'productivity');
            expect(productivityRec).to.exist;
            expect(productivityRec!.recommendation).to.contain('keyboard shortcuts');
        });

        it('should recommend learning resources for high error rates', async () => {
            const userId = 'test-user';
            
            // Track many failed actions
            for (let i = 0; i < 10; i++) {
                await agent.trackUserBehavior(userId, 'code-compile', {}, 3000, false);
            }

            const recommendations = await agent.getBehaviorRecommendations(userId);
            
            const learningRec = recommendations.find(r => r.type === 'learning');
            expect(learningRec).to.exist;
            expect(learningRec!.recommendation).to.contain('Tutorial');
        });
    });

    describe('adaptInterfaceForUser', () => {
        it('should adapt interface based on learned preferences', async () => {
            const userId = 'test-user';
            
            // Track file access patterns
            await agent.trackUserBehavior(userId, 'file-open', { fileName: 'component.tsx' });
            await agent.trackUserBehavior(userId, 'file-open', { fileName: 'styles.css' });
            await agent.trackUserBehavior(userId, 'command-execute', { command: 'format-document' });

            const adaptations = await agent.adaptInterfaceForUser(userId);

            expect(adaptations).to.be.an('object');
            expect(adaptations.fileExplorer).to.exist;
            expect(adaptations.fileExplorer.prioritizeFileTypes).to.include('tsx');
            expect(adaptations.commandPalette).to.exist;
            expect(adaptations.commandPalette.prioritizeCommands).to.include('format-document');
            
            // Verify adaptation was stored in OpenCog
            expect(mockOpenCogService.adaptToUser).to.have.been.calledOnceWith(
                userId, 'interface', adaptations
            );
        });
    });

    describe('getBehaviorAnalytics', () => {
        it('should calculate comprehensive behavior analytics', async () => {
            const userId = 'test-user';
            
            // Track various behaviors
            await agent.trackUserBehavior(userId, 'file-open', {}, 1000, true);
            await agent.trackUserBehavior(userId, 'code-edit', {}, 2000, true);
            await agent.trackUserBehavior(userId, 'command-execute', {}, 500, false);
            await agent.trackUserBehavior(userId, 'file-save', {}, 300, true);

            const analytics = await agent.getBehaviorAnalytics(userId);

            expect(analytics).to.be.an('object');
            expect(analytics.totalActions).to.equal(4);
            expect(analytics.sessionDuration).to.be.greaterThan(0);
            expect(analytics.errorRate).to.equal(0.25); // 1 failed out of 4
            expect(analytics.productivityScore).to.be.within(0, 1);
            expect(analytics.mostFrequentActions).to.be.an('array');
            expect(analytics.learningVelocity).to.be.a('number');
        });

        it('should track most frequent actions correctly', async () => {
            const userId = 'test-user';
            
            // Track repeated actions
            for (let i = 0; i < 5; i++) {
                await agent.trackUserBehavior(userId, 'file-save', {});
            }
            for (let i = 0; i < 3; i++) {
                await agent.trackUserBehavior(userId, 'code-edit', {});
            }

            const analytics = await agent.getBehaviorAnalytics(userId);
            
            expect(analytics.mostFrequentActions[0].action).to.equal('file-save');
            expect(analytics.mostFrequentActions[0].frequency).to.equal(5);
            expect(analytics.mostFrequentActions[1].action).to.equal('code-edit');
            expect(analytics.mostFrequentActions[1].frequency).to.equal(3);
        });
    });

    describe('provideBehavioralFeedback', () => {
        it('should process positive feedback correctly', async () => {
            const userId = 'test-user';
            const assistanceType = 'code-suggestion';
            const context = { currentTask: 'coding' };

            await agent.provideBehavioralFeedback(userId, assistanceType, true, context);

            // Verify feedback was learned
            expect(mockOpenCogService.learnFromFeedback).to.have.been.calledOnce;
            
            const feedbackCall = mockOpenCogService.learnFromFeedback.getCall(0);
            const feedback = feedbackCall.args[0] as UserFeedback;
            expect(feedback.helpful).to.be.true;
            expect(feedback.outcome).to.equal('accepted');
            expect(feedback.rating).to.equal(5);
        });

        it('should process negative feedback correctly', async () => {
            const userId = 'test-user';
            const assistanceType = 'debugging-help';
            const context = { currentTask: 'debugging' };

            await agent.provideBehavioralFeedback(userId, assistanceType, false, context);

            const feedbackCall = mockOpenCogService.learnFromFeedback.getCall(0);
            const feedback = feedbackCall.args[0] as UserFeedback;
            expect(feedback.helpful).to.be.false;
            expect(feedback.outcome).to.equal('rejected');
            expect(feedback.rating).to.equal(2);
        });

        it('should track feedback as user behavior', async () => {
            const userId = 'test-user';
            
            // Spy on trackUserBehavior to verify it's called
            const trackSpy = sinon.spy(agent, 'trackUserBehavior');
            
            await agent.provideBehavioralFeedback(userId, 'completion', true, {});

            expect(trackSpy).to.have.been.calledWith(
                userId,
                'provide-feedback',
                sinon.match.object,
                undefined,
                true
            );
            
            trackSpy.restore();
        });
    });

    describe('language model requirements', () => {
        it('should define language model requirements', () => {
            expect(agent.languageModelRequirements).to.be.an('array');
            expect(agent.languageModelRequirements.length).to.be.greaterThan(0);
            
            const requirement = agent.languageModelRequirements[0];
            expect(requirement).to.have.property('purpose');
            expect(requirement).to.have.property('identifier');
            expect(requirement.purpose).to.equal('behavior-analysis');
        });
    });

    describe('integration with Theia AI framework', () => {
        it('should follow Theia Agent interface contract', () => {
            // Verify Agent interface implementation
            expect(agent.id).to.be.a('string');
            expect(agent.name).to.be.a('string');
            expect(agent.description).to.be.a('string');
            expect(agent.variables).to.be.an('array');
            expect(agent.functions).to.be.an('array');
            expect(agent.prompts).to.be.an('array');
        });

        it('should use workspace service for context', async () => {
            const userId = 'test-user';
            await agent.trackUserBehavior(userId, 'test-action', {});

            // Verify workspace service was used for context
            expect(mockOpenCogService.learn).to.have.been.called;
            const learningCall = mockOpenCogService.learn.getCall(0);
            const learningData = learningCall.args[0] as LearningData;
            expect(learningData.context.workspaceId).to.equal('file:///test/workspace');
        });
    });
});