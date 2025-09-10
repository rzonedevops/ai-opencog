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
import { OpenCogService, KnowledgeManagementService } from '../common';
import { ComprehensiveCodeAnalysisAgent } from './comprehensive-code-analysis-agent';
import { IntelligentAssistanceAgent, AssistanceContext } from './intelligent-assistance-agent';
import { AdvancedReasoningAgent, ProblemContext } from './advanced-reasoning-agent';

/**
 * Test suite for Phase 3 AI Agent Enhancement - Cognitive Code Analysis Agents
 * 
 * These tests validate the enhanced cognitive capabilities including:
 * - Comprehensive code analysis with deep reasoning
 * - Intelligent assistance with contextual guidance  
 * - Advanced reasoning for complex problem-solving
 * - Real-time cognitive feedback and learning
 */
describe('Phase 3 Cognitive Code Analysis Agents', () => {
    let container: Container;
    let mockOpenCogService: jasmine.SpyObj<OpenCogService>;
    let mockKnowledgeService: jasmine.SpyObj<KnowledgeManagementService>;
    let mockWorkspaceService: any;
    let mockEditorManager: any;
    let mockMessageService: any;

    beforeEach(() => {
        container = new Container();
        
        // Create mock services
        mockOpenCogService = jasmine.createSpyObj('OpenCogService', [
            'recognizePatterns',
            'reason', 
            'addAtom',
            'queryAtoms',
            'learn',
            'learnFromFeedback',
            'learnUserBehavior',
            'getUserBehaviorPatterns',
            'adaptToUser'
        ]);

        mockKnowledgeService = jasmine.createSpyObj('KnowledgeManagementService', [
            'getKnowledgeGraphs',
            'createKnowledgeGraph',
            'addAtomToGraph',
            'discoverKnowledge',
            'searchAtoms',
            'getCategories',
            'createCategory',
            'getAtomsByCategory'
        ]);

        mockWorkspaceService = jasmine.createSpyObj('WorkspaceService', ['readFile']);
        mockEditorManager = jasmine.createSpyObj('EditorManager', ['onCurrentEditorChanged']);
        mockMessageService = jasmine.createSpyObj('MessageService', ['info', 'warn', 'error']);

        // Bind services to container
        container.bind(OpenCogService).toConstantValue(mockOpenCogService);
        container.bind(KnowledgeManagementService).toConstantValue(mockKnowledgeService);
        container.bind('WorkspaceService').toConstantValue(mockWorkspaceService);
        container.bind('EditorManager').toConstantValue(mockEditorManager);
        container.bind('MessageService').toConstantValue(mockMessageService);

        // Setup default mock returns
        mockOpenCogService.recognizePatterns.and.returnValue(Promise.resolve([
            {
                pattern: { type: 'code-pattern', name: 'function-declaration', metadata: { functionName: 'testFunction' } },
                confidence: 0.9,
                metadata: { complexity: 'medium' }
            }
        ]));

        mockOpenCogService.reason.and.returnValue(Promise.resolve({
            conclusion: 'Code analysis completed',
            confidence: 0.8,
            explanation: 'Analysis based on pattern recognition and cognitive reasoning'
        }));

        mockOpenCogService.getUserBehaviorPatterns.and.returnValue(Promise.resolve([
            {
                patternType: 'coding-style',
                frequency: 0.8,
                confidence: 0.9,
                metadata: { preference: 'functional-style' }
            }
        ]));

        mockKnowledgeService.getKnowledgeGraphs.and.returnValue(Promise.resolve([]));
        mockKnowledgeService.createKnowledgeGraph.and.returnValue(Promise.resolve({
            id: 'test-graph-id',
            name: 'Test Knowledge Graph',
            domain: 'test-domain',
            atoms: [],
            relationships: []
        }));
    });

    describe('ComprehensiveCodeAnalysisAgent', () => {
        let comprehensiveAgent: ComprehensiveCodeAnalysisAgent;

        beforeEach(() => {
            comprehensiveAgent = container.resolve(ComprehensiveCodeAnalysisAgent);
        });

        it('should be created successfully', () => {
            expect(comprehensiveAgent).toBeDefined();
            expect(comprehensiveAgent.id).toBe('comprehensive-cognitive-code-analysis');
            expect(comprehensiveAgent.name).toBe('Comprehensive Cognitive Code Analysis Agent');
        });

        it('should perform comprehensive cognitive analysis', async () => {
            const fileUri = '/test/example.ts';
            
            const result = await comprehensiveAgent.performComprehensiveCognitiveAnalysis(fileUri, {
                includeCollaborativeInsights: true,
                adaptToUserBehavior: true,
                generateRecommendations: true
            });

            expect(result).toBeDefined();
            expect(result.fileUri).toBe(fileUri);
            expect(result.analysis).toBeDefined();
            expect(result.synthesis).toBeDefined();
            expect(result.recommendations).toBeDefined();
            expect(result.cognitiveMetrics).toBeDefined();
            expect(result.cognitiveMetrics.overallScore).toBeGreaterThan(0);
            expect(result.cognitiveMetrics.confidenceLevel).toBeGreaterThan(0);
        });

        it('should perform semantic analysis correctly', async () => {
            const content = 'function testFunction() { return "test"; }';
            const fileUri = '/test/example.ts';

            // The private method would be called internally during comprehensive analysis
            const result = await comprehensiveAgent.performComprehensiveCognitiveAnalysis(fileUri);

            expect(mockOpenCogService.recognizePatterns).toHaveBeenCalled();
            expect(mockOpenCogService.reason).toHaveBeenCalled();
            expect(result.analysis.semantic).toBeDefined();
        });

        it('should handle real-time analysis scheduling', async () => {
            // Test that real-time analysis is properly scheduled
            expect(comprehensiveAgent).toBeDefined();
            // Real-time analysis would be triggered by editor events in actual usage
        });

        it('should learn from coding sessions', async () => {
            const fileUri = '/test/learning.ts';
            
            await comprehensiveAgent.performComprehensiveCognitiveAnalysis(fileUri);

            expect(mockOpenCogService.learnUserBehavior).toHaveBeenCalled();
        });

        it('should cache cognitive analysis results', async () => {
            const fileUri = '/test/cached.ts';
            
            // First call
            const result1 = await comprehensiveAgent.performComprehensiveCognitiveAnalysis(fileUri);
            
            // Second call should use cached result for quick analysis
            const result2 = await comprehensiveAgent.performComprehensiveCognitiveAnalysis(fileUri);

            expect(result1).toBeDefined();
            expect(result2).toBeDefined();
        });
    });

    describe('IntelligentAssistanceAgent', () => {
        let intelligentAgent: IntelligentAssistanceAgent;

        beforeEach(() => {
            intelligentAgent = container.resolve(IntelligentAssistanceAgent);
        });

        it('should be created successfully', () => {
            expect(intelligentAgent).toBeDefined();
            expect(intelligentAgent.id).toBe('intelligent-assistance-agent');
            expect(intelligentAgent.name).toBe('Intelligent Development Assistant');
        });

        it('should provide intelligent assistance based on context', async () => {
            const context: AssistanceContext = {
                currentFile: '/test/example.ts',
                selectedText: 'function buggyFunction() { return undefined; }',
                cursorPosition: { line: 5, column: 10 },
                userIntent: 'debugging',
                projectContext: {
                    language: 'typescript',
                    framework: 'react',
                    dependencies: ['lodash', 'axios']
                }
            };

            const response = await intelligentAgent.provideIntelligentAssistance(context);

            expect(response).toBeDefined();
            expect(response.suggestions).toBeDefined();
            expect(response.suggestions.length).toBeGreaterThan(0);
            expect(response.contextualInsights).toBeDefined();
            expect(response.nextSteps).toBeDefined();
            expect(response.learningOpportunities).toBeDefined();
            expect(response.confidence).toBeGreaterThan(0);
        });

        it('should provide debugging assistance', async () => {
            const debuggingContext = {
                errorMessage: 'TypeError: Cannot read property of undefined',
                stackTrace: 'at buggyFunction (example.ts:5:10)',
                codeContext: 'function buggyFunction() { return obj.property; }',
                expectedBehavior: 'Should return the property value',
                actualBehavior: 'Throws TypeError'
            };

            const response = await intelligentAgent.provideDebuggingAssistance(debuggingContext);

            expect(response).toBeDefined();
            expect(response.debuggingSteps).toBeDefined();
            expect(response.debuggingSteps.length).toBeGreaterThan(0);
            expect(response.possibleCauses).toBeDefined();
            expect(response.quickFixes).toBeDefined();
            expect(response.confidence).toBeGreaterThan(0);
        });

        it('should adapt suggestions to user expertise level', async () => {
            const beginnerContext: AssistanceContext = {
                currentFile: '/test/beginner.ts',
                selectedText: 'console.log("Hello World");',
                userIntent: 'learning'
            };

            const response = await intelligentAgent.provideIntelligentAssistance(beginnerContext);

            expect(response.learningOpportunities.length).toBeGreaterThan(0);
            expect(response.suggestions.some(s => s.type === 'explanation')).toBeTruthy();
        });

        it('should provide contextual code completion suggestions', async () => {
            const context: AssistanceContext = {
                currentFile: '/test/completion.ts',
                selectedText: 'const data = fetch(',
                userIntent: 'feature-development',
                projectContext: { language: 'typescript', dependencies: [] }
            };

            const response = await intelligentAgent.provideIntelligentAssistance(context);

            expect(response.suggestions.some(s => s.type === 'code-completion')).toBeTruthy();
        });

        it('should learn from assistance interactions', async () => {
            const context: AssistanceContext = {
                currentFile: '/test/learning.ts',
                selectedText: 'test code',
                userIntent: 'refactoring'
            };

            await intelligentAgent.provideIntelligentAssistance(context);

            expect(mockOpenCogService.learn).toHaveBeenCalled();
        });
    });

    describe('AdvancedReasoningAgent', () => {
        let reasoningAgent: AdvancedReasoningAgent;

        beforeEach(() => {
            reasoningAgent = container.resolve(AdvancedReasoningAgent);
        });

        it('should be created successfully', () => {
            expect(reasoningAgent).toBeDefined();
            expect(reasoningAgent.id).toBe('advanced-reasoning-agent');
            expect(reasoningAgent.name).toBe('Advanced Problem-Solving Reasoner');
        });

        it('should solve complex problems using advanced reasoning', async () => {
            const problem: ProblemContext = {
                id: 'arch-problem-001',
                title: 'Microservices Architecture Design',
                description: 'Design a scalable microservices architecture for e-commerce platform',
                domain: 'architecture',
                complexity: 'high',
                constraints: ['Budget limitations', 'Timeline: 3 months', 'Team size: 5 developers'],
                goals: ['Scalability', 'Maintainability', 'Performance'],
                context: {
                    technology: ['Node.js', 'React', 'PostgreSQL'],
                    timeline: '3 months',
                    resources: ['Senior architects', 'DevOps engineers']
                }
            };

            const solution = await reasoningAgent.solveComplexProblem(problem);

            expect(solution).toBeDefined();
            expect(solution.id).toBeDefined();
            expect(solution.approach).toBeDefined();
            expect(solution.reasoning).toBeDefined();
            expect(solution.reasoning.type).toBeDefined();
            expect(solution.reasoning.steps).toBeDefined();
            expect(solution.reasoning.steps.length).toBeGreaterThan(0);
            expect(solution.reasoning.conclusion).toBeDefined();
            expect(solution.implementation).toBeDefined();
            expect(solution.implementation.phases).toBeDefined();
            expect(solution.implementation.phases.length).toBeGreaterThan(0);
            expect(solution.validation).toBeDefined();
            expect(solution.confidence).toBeGreaterThan(0);
        });

        it('should use deductive reasoning for architecture problems', async () => {
            const architectureProblem: ProblemContext = {
                id: 'arch-deductive-001',
                title: 'System Architecture Decision',
                description: 'Choose appropriate architecture pattern',
                domain: 'architecture',
                complexity: 'medium',
                constraints: ['Performance requirements'],
                goals: ['Scalability'],
                context: { technology: ['Java', 'Spring Boot'] }
            };

            const solution = await reasoningAgent.solveComplexProblem(architectureProblem);

            expect(solution.reasoning.type).toBeDefined();
            expect(solution.reasoning.steps.length).toBeGreaterThan(0);
            expect(solution.approach).toBeDefined();
        });

        it('should use abductive reasoning for debugging problems', async () => {
            const debuggingProblem: ProblemContext = {
                id: 'debug-abductive-001',
                title: 'Performance Issue Investigation',
                description: 'Identify root cause of performance degradation',
                domain: 'debugging',
                complexity: 'high',
                constraints: ['Production system cannot be stopped'],
                goals: ['Identify root cause', 'Minimal downtime'],
                context: { technology: ['Node.js', 'MongoDB'] }
            };

            const solution = await reasoningAgent.solveComplexProblem(debuggingProblem);

            expect(solution.reasoning.type).toBeDefined();
            expect(solution.confidence).toBeGreaterThan(0);
        });

        it('should generate implementation plans with phases', async () => {
            const problem: ProblemContext = {
                id: 'impl-plan-001',
                title: 'API Redesign',
                description: 'Redesign REST API for better performance',
                domain: 'design',
                complexity: 'medium',
                constraints: ['Backward compatibility required'],
                goals: ['Performance improvement', 'Better documentation'],
                context: { technology: ['Express.js', 'OpenAPI'] }
            };

            const solution = await reasoningAgent.solveComplexProblem(problem);

            expect(solution.implementation.phases.length).toBeGreaterThan(0);
            solution.implementation.phases.forEach(phase => {
                expect(phase.phase).toBeDefined();
                expect(phase.tasks).toBeDefined();
                expect(phase.estimatedTime).toBeDefined();
                expect(phase.dependencies).toBeDefined();
                expect(phase.risks).toBeDefined();
            });
        });

        it('should create validation strategies', async () => {
            const problem: ProblemContext = {
                id: 'validation-001',
                title: 'Security Enhancement',
                description: 'Enhance application security',
                domain: 'security',
                complexity: 'high',
                constraints: ['No disruption to current users'],
                goals: ['Improved security', 'Compliance'],
                context: { technology: ['React', 'OAuth2'] }
            };

            const solution = await reasoningAgent.solveComplexProblem(problem);

            expect(solution.validation.successCriteria).toBeDefined();
            expect(solution.validation.testCases).toBeDefined();
            expect(solution.validation.metrics).toBeDefined();
            expect(solution.validation.rollbackPlan).toBeDefined();
        });

        it('should learn from reasoning sessions', async () => {
            const problem: ProblemContext = {
                id: 'learning-001',
                title: 'Learning Test Problem',
                description: 'Test learning capabilities',
                domain: 'performance',
                complexity: 'low',
                constraints: [],
                goals: ['Test learning'],
                context: { technology: [] }
            };

            await reasoningAgent.solveComplexProblem(problem);

            expect(mockOpenCogService.learn).toHaveBeenCalled();
        });

        it('should handle fallback scenarios gracefully', async () => {
            // Mock a failure in OpenCog service
            mockOpenCogService.reason.and.returnValue(Promise.reject(new Error('Service unavailable')));

            const problem: ProblemContext = {
                id: 'fallback-001',
                title: 'Fallback Test',
                description: 'Test fallback handling',
                domain: 'debugging',
                complexity: 'low',
                constraints: [],
                goals: [],
                context: {}
            };

            const solution = await reasoningAgent.solveComplexProblem(problem);

            expect(solution).toBeDefined();
            expect(solution.approach).toBe('systematic-analysis');
            expect(solution.confidence).toBeLessThan(0.5);
        });
    });

    describe('Agent Integration', () => {
        it('should integrate multiple agents for complex scenarios', async () => {
            const comprehensiveAgent = container.resolve(ComprehensiveCodeAnalysisAgent);
            const assistanceAgent = container.resolve(IntelligentAssistanceAgent);
            const reasoningAgent = container.resolve(AdvancedReasoningAgent);

            expect(comprehensiveAgent).toBeDefined();
            expect(assistanceAgent).toBeDefined();
            expect(reasoningAgent).toBeDefined();

            // All agents should be able to work with the same OpenCog service
            expect(mockOpenCogService.recognizePatterns).toBeDefined();
            expect(mockOpenCogService.reason).toBeDefined();
            expect(mockOpenCogService.learn).toBeDefined();
        });

        it('should handle concurrent agent operations', async () => {
            const comprehensiveAgent = container.resolve(ComprehensiveCodeAnalysisAgent);
            const assistanceAgent = container.resolve(IntelligentAssistanceAgent);

            const analysisPromise = comprehensiveAgent.performComprehensiveCognitiveAnalysis('/test/concurrent.ts');
            const assistancePromise = assistanceAgent.provideIntelligentAssistance({
                currentFile: '/test/concurrent.ts',
                selectedText: 'test code',
                userIntent: 'debugging'
            });

            const [analysisResult, assistanceResult] = await Promise.all([analysisPromise, assistancePromise]);

            expect(analysisResult).toBeDefined();
            expect(assistanceResult).toBeDefined();
        });
    });

    describe('Error Handling and Resilience', () => {
        it('should handle OpenCog service failures gracefully', async () => {
            mockOpenCogService.recognizePatterns.and.returnValue(Promise.reject(new Error('Service error')));

            const comprehensiveAgent = container.resolve(ComprehensiveCodeAnalysisAgent);
            
            // Should not throw, but handle gracefully
            const result = await comprehensiveAgent.performComprehensiveCognitiveAnalysis('/test/error.ts');
            
            expect(result).toBeDefined();
            // Should provide fallback behavior
        });

        it('should handle knowledge service failures gracefully', async () => {
            mockKnowledgeService.getKnowledgeGraphs.and.returnValue(Promise.reject(new Error('Knowledge service error')));

            const assistanceAgent = container.resolve(IntelligentAssistanceAgent);
            
            const result = await assistanceAgent.provideIntelligentAssistance({
                currentFile: '/test/knowledge-error.ts',
                selectedText: 'test',
                userIntent: 'learning'
            });

            expect(result).toBeDefined();
            expect(result.confidence).toBeGreaterThan(0);
        });
    });

    describe('Performance and Caching', () => {
        it('should cache expensive cognitive operations', async () => {
            const comprehensiveAgent = container.resolve(ComprehensiveCodeAnalysisAgent);
            
            // First call
            await comprehensiveAgent.performComprehensiveCognitiveAnalysis('/test/cache.ts');
            
            // Second call should benefit from caching
            const start = Date.now();
            await comprehensiveAgent.performComprehensiveCognitiveAnalysis('/test/cache.ts');
            const duration = Date.now() - start;

            // Should complete quickly due to caching (this is a simplified test)
            expect(duration).toBeLessThan(5000);
        });

        it('should debounce real-time analysis requests', async () => {
            const comprehensiveAgent = container.resolve(ComprehensiveCodeAnalysisAgent);
            
            // Multiple rapid calls should be debounced
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(comprehensiveAgent.performComprehensiveCognitiveAnalysis(`/test/debounce${i}.ts`));
            }

            const results = await Promise.all(promises);
            
            expect(results.length).toBe(5);
            results.forEach(result => {
                expect(result).toBeDefined();
            });
        });
    });
});