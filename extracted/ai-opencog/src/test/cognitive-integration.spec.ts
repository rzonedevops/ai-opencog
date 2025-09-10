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

import { Container } from '@theia/core/shared/inversify';
import { expect } from 'chai';
import { PatternRecognitionAgent } from '../browser/pattern-recognition-agent';
import { LearningAgent } from '../browser/enhanced-learning-agent';
import { SemanticCompletionProvider } from '../browser/semantic-completion';
import { IntelligentRefactoringProvider } from '../browser/intelligent-refactoring';
import { RealTimeCodeAnalyzer } from '../browser/real-time-analyzer';
import { OpenCogService } from '../common/opencog-service';

describe('Phase 2 Cognitive Services Integration', () => {
    let container: Container;
    let mockOpenCogService: any;
    let patternAgent: PatternRecognitionAgent;
    let learningAgent: LearningAgent;
    let semanticProvider: SemanticCompletionProvider;
    let refactoringProvider: IntelligentRefactoringProvider;
    let realTimeAnalyzer: RealTimeCodeAnalyzer;

    beforeEach(() => {
        container = new Container();
        
        // Mock OpenCog service
        mockOpenCogService = {
            recognizePatterns: async () => [
                {
                    pattern: { type: 'design-pattern', name: 'singleton' },
                    confidence: 0.8,
                    instances: [],
                    metadata: { complexity: 'medium' }
                }
            ],
            reason: async (query: any) => ({
                conclusions: [
                    {
                        type: 'suggestion',
                        value: 'implementSingleton',
                        confidence: 0.7,
                        explanation: 'Singleton pattern would be beneficial here'
                    }
                ]
            }),
            learn: async () => {},
            learnUserBehavior: async () => {},
            getUserBehaviorPatterns: async () => [],
            getAdaptationStrategy: async () => undefined,
            createLearningModel: async () => ({ id: 'test-model' }),
            getLearningStats: async () => ({
                totalLearningRecords: 10,
                modelAccuracy: { 'developer-behavior': 0.8 },
                userAdaptations: 5,
                behaviorPatterns: 3
            }),
            learnFromFeedback: async () => {}
        };

        // Mock workspace service
        const mockWorkspace = {
            workspace: {
                resource: { toString: () => 'test-workspace' }
            }
        };

        container.bind(OpenCogService).toConstantValue(mockOpenCogService);
        container.bind('WorkspaceService').toConstantValue(mockWorkspace);
        
        // Bind all services
        container.bind(PatternRecognitionAgent).toSelf();
        container.bind(LearningAgent).toSelf();
        container.bind(SemanticCompletionProvider).toSelf();
        container.bind(IntelligentRefactoringProvider).toSelf();
        container.bind(RealTimeCodeAnalyzer).toSelf();

        // Get instances
        patternAgent = container.get(PatternRecognitionAgent);
        learningAgent = container.get(LearningAgent);
        semanticProvider = container.get(SemanticCompletionProvider);
        refactoringProvider = container.get(IntelligentRefactoringProvider);
        realTimeAnalyzer = container.get(RealTimeCodeAnalyzer);
    });

    it('should integrate pattern recognition with learning', async () => {
        const code = `
            class DatabaseConnection {
                constructor() {
                    if (DatabaseConnection.instance) {
                        return DatabaseConnection.instance;
                    }
                    DatabaseConnection.instance = this;
                }
            }
        `;

        // Detect patterns
        const patterns = await patternAgent.detectCodePatterns(code, 'test.js');
        expect(patterns).to.have.length.greaterThan(0);

        // Learn from patterns
        await learningAgent.learnCodeQualityPatterns('test-user', {
            patterns,
            improvementDetected: true,
            patternUsed: 'singleton'
        });

        // Get personalized recommendations
        const recommendations = await learningAgent.getPersonalizedRecommendations('test-user');
        expect(recommendations).to.be.an('array');
    });

    it('should provide semantic completion based on learned patterns', async () => {
        // First, learn some patterns
        await learningAgent.learnDeveloperBehavior('test-user', 'use-function', {
            functionName: 'calculateSum',
            context: 'mathematical'
        });

        // Mock text model
        const mockModel = {
            getLineContent: () => 'const result = calc',
            getLinesContent: () => ['const result = calc'],
            getLineCount: () => 1,
            getValue: () => 'const result = calc',
            uri: { toString: () => 'test.js' }
        };

        const mockPosition = { lineNumber: 1, column: 18 };
        const mockContext = {};

        const completions = await semanticProvider.provideCompletionItems(
            mockModel as any, 
            mockPosition as any, 
            mockContext as any
        );

        expect(completions.suggestions).to.be.an('array');
        expect(completions.suggestions.length).to.be.greaterThan(0);
    });

    it('should integrate refactoring with real-time analysis', async () => {
        // Mock text model with poor quality code
        const mockModel = {
            getValue: () => `
                function veryLongFunctionWithTooManyParametersAndComplexLogicThatShouldBeRefactored(a, b, c, d, e, f, g, h, i, j) {
                    if (a > b) {
                        if (c > d) {
                            if (e > f) {
                                if (g > h) {
                                    if (i > j) {
                                        return a + b + c + d + e + f + g + h + i + j;
                                    }
                                }
                            }
                        }
                    }
                    return 0;
                }
            `,
            getLinesContent: () => [
                'function veryLongFunctionWithTooManyParametersAndComplexLogicThatShouldBeRefactored(a, b, c, d, e, f, g, h, i, j) {',
                '    if (a > b) {',
                '        if (c > d) {',
                '            if (e > f) {',
                '                if (g > h) {',
                '                    if (i > j) {',
                '                        return a + b + c + d + e + f + g + h + i + j;',
                '                    }',
                '                }',
                '            }',
                '        }',
                '    }',
                '    return 0;',
                '}'
            ],
            uri: { toString: () => 'test.js' }
        };

        // Perform real-time analysis
        const analysis = await realTimeAnalyzer.analyzeImmediately(mockModel as any);
        
        expect(analysis.qualityMetrics.score).to.be.lessThan(0.8); // Should detect poor quality
        expect(analysis.issues.length).to.be.greaterThan(0);
        expect(analysis.recommendations.length).to.be.greaterThan(0);

        // Get refactoring opportunities
        const suggestions = await refactoringProvider.detectRefactoringOpportunities(mockModel as any);
        expect(suggestions.length).to.be.greaterThan(0);

        // Should suggest extract method for complex code
        const extractMethodSuggestion = suggestions.find(s => s.title.includes('Extract Method'));
        expect(extractMethodSuggestion).to.not.be.undefined;
    });

    it('should learn from workflow optimization', async () => {
        const workflowData = {
            commands: {
                'editor.action.quickFix': 15,
                'editor.action.formatDocument': 8,
                'workbench.action.files.save': 25
            },
            fileAccess: [
                { fileName: 'index.js', timestamp: Date.now() },
                { fileName: 'utils.js', timestamp: Date.now() + 1000 },
                { fileName: 'index.js', timestamp: Date.now() + 2000 },
                { fileName: 'utils.js', timestamp: Date.now() + 3000 },
                { fileName: 'index.js', timestamp: Date.now() + 4000 },
                { fileName: 'utils.js', timestamp: Date.now() + 5000 }
            ]
        };

        const optimizations = await learningAgent.learnWorkflowOptimization('test-user', workflowData);
        
        expect(optimizations).to.be.an('array');
        expect(optimizations.length).to.be.greaterThan(0);

        // Should detect frequent command usage
        const shortcutOptimization = optimizations.find(opt => opt.category === 'shortcuts');
        expect(shortcutOptimization).to.not.be.undefined;

        // Should detect file navigation patterns
        const navigationOptimization = optimizations.find(opt => opt.category === 'navigation');
        expect(navigationOptimization).to.not.be.undefined;
    });

    it('should provide comprehensive learning insights', async () => {
        // Simulate some learning activity
        await learningAgent.learnDeveloperBehavior('test-user', 'code-edit', { fileName: 'test.js' });
        await learningAgent.learnCodeQualityPatterns('test-user', { improvementDetected: true });
        await learningAgent.provideLearningFeedback('test-user', 'refactoring', true);

        const insights = await learningAgent.getLearningInsights('test-user');

        expect(insights).to.have.property('personalProfile');
        expect(insights).to.have.property('codeQuality');
        expect(insights).to.have.property('workflowEfficiency');
        expect(insights).to.have.property('globalInsights');

        expect(insights.globalInsights.totalLearningRecords).to.equal(10);
        expect(insights.globalInsights.modelAccuracy).to.have.property('developer-behavior');
    });

    it('should generate pattern-based recommendations', async () => {
        const patterns = await patternAgent.detectCodePatterns(`
            function processUser(user) {
                if (user.type === 'admin') {
                    // admin logic
                } else if (user.type === 'moderator') {
                    // moderator logic
                } else if (user.type === 'user') {
                    // user logic
                }
            }
        `, 'test.js');

        const recommendations = await patternAgent.generatePatternRecommendations(patterns);
        expect(recommendations).to.be.an('array');
    });

    afterEach(() => {
        if (realTimeAnalyzer) {
            realTimeAnalyzer.dispose();
        }
    });
});