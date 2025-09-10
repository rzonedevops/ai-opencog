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

import { injectable, inject } from '@theia/core/shared/inversify';
import { Agent } from '@theia/ai-core/lib/common/agent';
import { OpenCogService, KnowledgeManagementService } from '../common';
import { ProblemContext, ReasoningSolution } from './advanced-reasoning-agent';

/**
 * Specialized Problem-Solving Strategies
 */
export interface ProblemSolvingStrategy {
    name: string;
    description: string;
    applicableDomains: string[];
    complexity: ('low' | 'medium' | 'high' | 'expert')[];
    execute(problem: ProblemContext): Promise<ReasoningSolution>;
}

/**
 * Problem-Solving Context with Enhanced Metadata
 */
export interface EnhancedProblemContext extends ProblemContext {
    stakeholders?: string[];
    businessImpact?: 'low' | 'medium' | 'high' | 'critical';
    technicalDebt?: number; // 0-100 scale
    riskTolerance?: 'low' | 'medium' | 'high';
    iterationPreference?: 'waterfall' | 'agile' | 'lean';
    knowledgeGaps?: string[];
}

/**
 * Solution Quality Metrics
 */
export interface SolutionMetrics {
    technicalQuality: number;
    implementationComplexity: number;
    riskLevel: number;
    timeToValue: number;
    maintainability: number;
    scalability: number;
    overallScore: number;
}

/**
 * Enhanced Reasoning Agent for Specialized Problem-Solving
 * 
 * This agent extends the Advanced Reasoning Agent with specialized strategies for:
 * - Domain-specific problem-solving approaches
 * - Multi-stakeholder problem analysis
 * - Risk-aware solution generation
 * - Iterative solution refinement
 * - Quality-driven solution evaluation
 */
@injectable()
export class SpecializedProblemSolvingAgent extends Agent {

    private problemSolvingStrategies: Map<string, ProblemSolvingStrategy> = new Map();
    private solutionHistory: Map<string, ReasoningSolution[]> = new Map();
    private domainExpertise: Map<string, number> = new Map();

    constructor(
        @inject(OpenCogService) private readonly openCogService: OpenCogService,
        @inject(KnowledgeManagementService) private readonly knowledgeService: KnowledgeManagementService
    ) {
        super(
            'specialized-problem-solving-agent',
            'Specialized Problem-Solving Agent',
            'Domain-specific cognitive agent for specialized software engineering problems'
        );
        this.initializeSpecializedStrategies();
    }

    private async initializeSpecializedStrategies(): Promise<void> {
        try {
            // Initialize domain expertise levels
            this.domainExpertise.set('architecture', 0.9);
            this.domainExpertise.set('performance', 0.85);
            this.domainExpertise.set('security', 0.88);
            this.domainExpertise.set('debugging', 0.92);
            this.domainExpertise.set('design', 0.87);
            this.domainExpertise.set('integration', 0.83);
            this.domainExpertise.set('scalability', 0.86);

            // Register specialized strategies
            await this.registerDebuggingStrategies();
            await this.registerArchitectureStrategies();
            await this.registerPerformanceStrategies();
            await this.registerSecurityStrategies();
            await this.registerIntegrationStrategies();

            console.log('Specialized problem-solving strategies initialized');
        } catch (error) {
            console.error('Failed to initialize specialized strategies:', error);
        }
    }

    private async registerDebuggingStrategies(): Promise<void> {
        // Systematic Debugging Strategy
        this.problemSolvingStrategies.set('systematic-debugging', {
            name: 'Systematic Debugging',
            description: 'Methodical root cause analysis with evidence-based investigation',
            applicableDomains: ['debugging', 'performance'],
            complexity: ['medium', 'high', 'expert'],
            execute: async (problem: ProblemContext) => {
                return this.executeSystematicDebugging(problem);
            }
        });

        // Hypothesis-Driven Debugging
        this.problemSolvingStrategies.set('hypothesis-debugging', {
            name: 'Hypothesis-Driven Debugging',
            description: 'Generate and test hypotheses about potential causes',
            applicableDomains: ['debugging', 'performance', 'security'],
            complexity: ['high', 'expert'],
            execute: async (problem: ProblemContext) => {
                return this.executeHypothesisDebugging(problem);
            }
        });
    }

    private async registerArchitectureStrategies(): Promise<void> {
        // Domain-Driven Design Strategy
        this.problemSolvingStrategies.set('domain-driven-design', {
            name: 'Domain-Driven Design',
            description: 'Architecture design based on domain modeling and bounded contexts',
            applicableDomains: ['architecture', 'design'],
            complexity: ['high', 'expert'],
            execute: async (problem: ProblemContext) => {
                return this.executeDomainDrivenDesign(problem);
            }
        });

        // Evolutionary Architecture Strategy
        this.problemSolvingStrategies.set('evolutionary-architecture', {
            name: 'Evolutionary Architecture',
            description: 'Architecture that supports guided, incremental change',
            applicableDomains: ['architecture', 'scalability'],
            complexity: ['high', 'expert'],
            execute: async (problem: ProblemContext) => {
                return this.executeEvolutionaryArchitecture(problem);
            }
        });
    }

    private async registerPerformanceStrategies(): Promise<void> {
        // Performance Profiling Strategy
        this.problemSolvingStrategies.set('performance-profiling', {
            name: 'Performance Profiling',
            description: 'Data-driven performance optimization based on profiling',
            applicableDomains: ['performance', 'scalability'],
            complexity: ['medium', 'high'],
            execute: async (problem: ProblemContext) => {
                return this.executePerformanceProfiling(problem);
            }
        });

        // Load Testing Strategy
        this.problemSolvingStrategies.set('load-testing-optimization', {
            name: 'Load Testing Optimization',
            description: 'Performance optimization guided by load testing results',
            applicableDomains: ['performance', 'scalability'],
            complexity: ['medium', 'high', 'expert'],
            execute: async (problem: ProblemContext) => {
                return this.executeLoadTestingOptimization(problem);
            }
        });
    }

    private async registerSecurityStrategies(): Promise<void> {
        // Threat Modeling Strategy
        this.problemSolvingStrategies.set('threat-modeling', {
            name: 'Threat Modeling',
            description: 'Security design based on systematic threat analysis',
            applicableDomains: ['security', 'architecture'],
            complexity: ['high', 'expert'],
            execute: async (problem: ProblemContext) => {
                return this.executeThreatModeling(problem);
            }
        });

        // Security-by-Design Strategy
        this.problemSolvingStrategies.set('security-by-design', {
            name: 'Security-by-Design',
            description: 'Integrate security considerations into design from the start',
            applicableDomains: ['security', 'architecture', 'design'],
            complexity: ['medium', 'high', 'expert'],
            execute: async (problem: ProblemContext) => {
                return this.executeSecurityByDesign(problem);
            }
        });
    }

    private async registerIntegrationStrategies(): Promise<void> {
        // API-First Integration Strategy
        this.problemSolvingStrategies.set('api-first-integration', {
            name: 'API-First Integration',
            description: 'Design APIs before implementation for better integration',
            applicableDomains: ['integration', 'architecture'],
            complexity: ['medium', 'high'],
            execute: async (problem: ProblemContext) => {
                return this.executeApiFirstIntegration(problem);
            }
        });

        // Event-Driven Integration Strategy
        this.problemSolvingStrategies.set('event-driven-integration', {
            name: 'Event-Driven Integration',
            description: 'Use event-driven patterns for loose coupling',
            applicableDomains: ['integration', 'architecture', 'scalability'],
            complexity: ['high', 'expert'],
            execute: async (problem: ProblemContext) => {
                return this.executeEventDrivenIntegration(problem);
            }
        });
    }

    /**
     * Solve problems using specialized strategies
     */
    async solveWithSpecializedStrategy(problem: EnhancedProblemContext): Promise<ReasoningSolution> {
        try {
            console.log(`Starting specialized problem-solving for: ${problem.title}`);

            // Step 1: Analyze problem characteristics
            const problemAnalysis = await this.analyzeSpecializedProblem(problem);

            // Step 2: Select appropriate specialized strategy
            const selectedStrategy = this.selectSpecializedStrategy(problem, problemAnalysis);
            
            if (!selectedStrategy) {
                throw new Error(`No specialized strategy found for ${problem.domain} problem`);
            }

            console.log(`Selected strategy: ${selectedStrategy.name}`);

            // Step 3: Execute specialized strategy
            const solution = await selectedStrategy.execute(problem);

            // Step 4: Evaluate solution quality
            const qualityMetrics = this.evaluateSolutionQuality(problem, solution);

            // Step 5: Enhance solution with specialized insights
            const enhancedSolution = await this.enhanceSolutionWithSpecializedInsights(
                problem, 
                solution, 
                selectedStrategy,
                qualityMetrics
            );

            // Step 6: Learn from specialized problem-solving
            await this.learnFromSpecializedSolution(problem, enhancedSolution, selectedStrategy);

            // Store in solution history
            this.storeSolutionInHistory(problem.domain, enhancedSolution);

            return enhancedSolution;

        } catch (error) {
            console.error('Specialized problem-solving failed:', error);
            return this.generateSpecializedFallbackSolution(problem);
        }
    }

    private async analyzeSpecializedProblem(problem: EnhancedProblemContext): Promise<any> {
        // Enhanced problem analysis with specialized metrics
        return {
            domainExpertiseLevel: this.domainExpertise.get(problem.domain) || 0.5,
            problemComplexityScore: this.calculateComplexityScore(problem),
            stakeholderComplexity: problem.stakeholders?.length || 1,
            businessCriticality: this.mapBusinessImpactToScore(problem.businessImpact),
            technicalDebtFactor: problem.technicalDebt || 0,
            riskTolerance: this.mapRiskToleranceToScore(problem.riskTolerance),
            knowledgeGapCount: problem.knowledgeGaps?.length || 0,
            historicalSolutions: this.solutionHistory.get(problem.domain) || []
        };
    }

    private selectSpecializedStrategy(
        problem: EnhancedProblemContext, 
        analysis: any
    ): ProblemSolvingStrategy | null {
        const candidates = Array.from(this.problemSolvingStrategies.values()).filter(strategy => 
            strategy.applicableDomains.includes(problem.domain) &&
            strategy.complexity.includes(problem.complexity)
        );

        if (candidates.length === 0) {
            return null;
        }

        // Score strategies based on problem characteristics
        const scoredStrategies = candidates.map(strategy => ({
            strategy,
            score: this.scoreStrategyForProblem(strategy, problem, analysis)
        }));

        // Return highest scoring strategy
        scoredStrategies.sort((a, b) => b.score - a.score);
        return scoredStrategies[0].strategy;
    }

    private scoreStrategyForProblem(
        strategy: ProblemSolvingStrategy,
        problem: EnhancedProblemContext,
        analysis: any
    ): number {
        let score = 0;

        // Domain expertise bonus
        score += analysis.domainExpertiseLevel * 0.3;

        // Strategy-specific scoring
        if (strategy.name.includes('Systematic') && problem.complexity === 'expert') {
            score += 0.2;
        }
        if (strategy.name.includes('Hypothesis') && analysis.knowledgeGapCount > 2) {
            score += 0.15;
        }
        if (strategy.name.includes('Evolutionary') && analysis.technicalDebtFactor > 50) {
            score += 0.25;
        }
        if (strategy.name.includes('Security') && problem.businessImpact === 'critical') {
            score += 0.2;
        }

        // Historical success bonus
        const historicalSuccess = this.getHistoricalStrategySuccess(strategy.name, problem.domain);
        score += historicalSuccess * 0.1;

        return Math.min(score, 1.0);
    }

    // Strategy Implementation Methods

    private async executeSystematicDebugging(problem: ProblemContext): Promise<ReasoningSolution> {
        const steps = [
            {
                step: 1,
                description: 'Problem reproduction and isolation',
                reasoning: 'Establish consistent reproduction steps and isolate the problem scope',
                confidence: 0.9
            },
            {
                step: 2,
                description: 'Evidence collection and data gathering',
                reasoning: 'Gather logs, metrics, and system state information',
                confidence: 0.85
            },
            {
                step: 3,
                description: 'Hypothesis generation based on evidence',
                reasoning: 'Generate testable hypotheses about root causes',
                confidence: 0.8
            },
            {
                step: 4,
                description: 'Systematic hypothesis testing',
                reasoning: 'Test each hypothesis systematically using controlled experiments',
                confidence: 0.75
            },
            {
                step: 5,
                description: 'Root cause identification and fix implementation',
                reasoning: 'Implement fix based on confirmed root cause',
                confidence: 0.9
            }
        ];

        return {
            id: `systematic_debug_${Date.now()}`,
            approach: 'systematic-debugging',
            reasoning: {
                type: 'deductive',
                steps,
                conclusion: 'Systematic debugging approach with evidence-based investigation',
                alternatives: [
                    {
                        approach: 'binary-search-debugging',
                        pros: ['faster for simple problems', 'reduces search space'],
                        cons: ['may miss complex interactions', 'less thorough'],
                        feasibility: 0.8
                    }
                ]
            },
            implementation: {
                phases: [
                    {
                        phase: 'Setup and Reproduction',
                        tasks: ['Setup debugging environment', 'Reproduce issue consistently'],
                        estimatedTime: '1-2 days',
                        dependencies: [],
                        risks: ['Issue may not be reproducible in debug environment']
                    },
                    {
                        phase: 'Investigation and Analysis',
                        tasks: ['Collect evidence', 'Generate hypotheses', 'Design tests'],
                        estimatedTime: '2-3 days',
                        dependencies: ['Setup and Reproduction'],
                        risks: ['Evidence may be insufficient', 'Hypotheses may be incorrect']
                    },
                    {
                        phase: 'Testing and Validation',
                        tasks: ['Test hypotheses', 'Identify root cause', 'Implement fix'],
                        estimatedTime: '1-2 days',
                        dependencies: ['Investigation and Analysis'],
                        risks: ['Fix may have side effects', 'Root cause may be multi-faceted']
                    }
                ],
                codeExamples: [
                    '// Add comprehensive logging for debugging',
                    'logger.debug("System state", { variable1, variable2, timestamp });',
                    '// Implement systematic test cases',
                    'describe("Bug reproduction tests", () => { /* test cases */ });'
                ],
                testingStrategy: 'Unit tests for each hypothesis, integration tests for fix validation'
            },
            validation: {
                successCriteria: [
                    'Issue is consistently reproducible',
                    'Root cause is identified with evidence',
                    'Fix resolves the issue without side effects',
                    'Tests prevent regression'
                ],
                testCases: [
                    'Original issue reproduction',
                    'Fix validation tests',
                    'Regression prevention tests',
                    'Performance impact tests'
                ],
                metrics: [
                    'Issue reproduction success rate: 100%',
                    'Fix effectiveness: >95%',
                    'Performance impact: <5%',
                    'Test coverage: >90%'
                ],
                rollbackPlan: 'Revert fix if issues arise, maintain original system state'
            },
            confidence: 0.85,
            learningNotes: [
                'Systematic approach reduces debugging time',
                'Evidence-based investigation increases success rate',
                'Comprehensive testing prevents regressions'
            ]
        };
    }

    private async executeHypothesisDebugging(problem: ProblemContext): Promise<ReasoningSolution> {
        // Generate hypotheses using abductive reasoning
        const reasoningQuery = {
            type: 'abductive',
            atoms: [{ type: 'ProblemNode', name: problem.id }],
            context: { domain: problem.domain, approach: 'hypothesis-generation' }
        };

        const reasoningResult = await this.openCogService.reason(reasoningQuery);

        const steps = [
            {
                step: 1,
                description: 'Generate initial hypotheses about potential causes',
                reasoning: 'Use domain knowledge and symptoms to generate likely causes',
                confidence: 0.7
            },
            {
                step: 2,
                description: 'Rank hypotheses by likelihood and impact',
                reasoning: 'Prioritize hypotheses based on probability and business impact',
                confidence: 0.8
            },
            {
                step: 3,
                description: 'Design experiments to test top hypotheses',
                reasoning: 'Create controlled experiments to validate or eliminate hypotheses',
                confidence: 0.85
            },
            {
                step: 4,
                description: 'Execute experiments and collect results',
                reasoning: 'Run experiments systematically and gather evidence',
                confidence: 0.9
            },
            {
                step: 5,
                description: 'Refine hypotheses based on experimental results',
                reasoning: 'Update or generate new hypotheses based on findings',
                confidence: 0.85
            }
        ];

        return {
            id: `hypothesis_debug_${Date.now()}`,
            approach: 'hypothesis-debugging',
            reasoning: {
                type: 'abductive',
                steps,
                conclusion: 'Hypothesis-driven debugging with experimental validation',
                alternatives: [
                    {
                        approach: 'exhaustive-search',
                        pros: ['comprehensive coverage', 'finds all issues'],
                        cons: ['time-consuming', 'resource intensive'],
                        feasibility: 0.6
                    }
                ]
            },
            implementation: {
                phases: [
                    {
                        phase: 'Hypothesis Generation',
                        tasks: ['Analyze symptoms', 'Generate hypotheses', 'Research domain knowledge'],
                        estimatedTime: '1 day',
                        dependencies: [],
                        risks: ['May miss non-obvious causes', 'Biased by prior experience']
                    },
                    {
                        phase: 'Experimental Design',
                        tasks: ['Design experiments', 'Setup test environment', 'Define success criteria'],
                        estimatedTime: '1-2 days',
                        dependencies: ['Hypothesis Generation'],
                        risks: ['Experiments may not be conclusive', 'Test environment differences']
                    },
                    {
                        phase: 'Execution and Analysis',
                        tasks: ['Run experiments', 'Analyze results', 'Refine understanding'],
                        estimatedTime: '2-3 days',
                        dependencies: ['Experimental Design'],
                        risks: ['Inconclusive results', 'Need for additional experiments']
                    }
                ],
                testingStrategy: 'Hypothesis-driven test design with statistical validation'
            },
            validation: {
                successCriteria: [
                    'Hypotheses are testable and well-formed',
                    'Experiments provide clear evidence',
                    'Root cause is identified with high confidence'
                ],
                testCases: [
                    'Hypothesis validation tests',
                    'Experimental reproducibility tests',
                    'Solution effectiveness tests'
                ],
                metrics: [
                    'Hypothesis accuracy: >80%',
                    'Experimental conclusiveness: >90%',
                    'Solution confidence: >85%'
                ],
                rollbackPlan: 'Return to previous stable state if experiments fail'
            },
            confidence: 0.8,
            learningNotes: [
                'Hypothesis-driven approach effective for complex problems',
                'Experimental validation increases solution confidence',
                'Domain knowledge crucial for hypothesis generation'
            ]
        };
    }

    private async executeDomainDrivenDesign(problem: ProblemContext): Promise<ReasoningSolution> {
        // Implementation for Domain-Driven Design strategy
        return this.generateSpecializedSolution(problem, 'domain-driven-design', 'deductive');
    }

    private async executeEvolutionaryArchitecture(problem: ProblemContext): Promise<ReasoningSolution> {
        // Implementation for Evolutionary Architecture strategy
        return this.generateSpecializedSolution(problem, 'evolutionary-architecture', 'inductive');
    }

    private async executePerformanceProfiling(problem: ProblemContext): Promise<ReasoningSolution> {
        // Implementation for Performance Profiling strategy
        return this.generateSpecializedSolution(problem, 'performance-profiling', 'inductive');
    }

    private async executeLoadTestingOptimization(problem: ProblemContext): Promise<ReasoningSolution> {
        // Implementation for Load Testing Optimization strategy
        return this.generateSpecializedSolution(problem, 'load-testing-optimization', 'deductive');
    }

    private async executeThreatModeling(problem: ProblemContext): Promise<ReasoningSolution> {
        // Implementation for Threat Modeling strategy
        return this.generateSpecializedSolution(problem, 'threat-modeling', 'deductive');
    }

    private async executeSecurityByDesign(problem: ProblemContext): Promise<ReasoningSolution> {
        // Implementation for Security-by-Design strategy
        return this.generateSpecializedSolution(problem, 'security-by-design', 'deductive');
    }

    private async executeApiFirstIntegration(problem: ProblemContext): Promise<ReasoningSolution> {
        // Implementation for API-First Integration strategy
        return this.generateSpecializedSolution(problem, 'api-first-integration', 'deductive');
    }

    private async executeEventDrivenIntegration(problem: ProblemContext): Promise<ReasoningSolution> {
        // Implementation for Event-Driven Integration strategy
        return this.generateSpecializedSolution(problem, 'event-driven-integration', 'creative');
    }

    // Helper Methods

    private async generateSpecializedSolution(
        problem: ProblemContext, 
        strategyName: string, 
        reasoningType: string
    ): Promise<ReasoningSolution> {
        // Generic specialized solution generator
        return {
            id: `specialized_${strategyName}_${Date.now()}`,
            approach: strategyName,
            reasoning: {
                type: reasoningType as any,
                steps: [
                    {
                        step: 1,
                        description: `Apply ${strategyName} methodology`,
                        reasoning: `Using specialized ${strategyName} approach for ${problem.domain}`,
                        confidence: 0.85
                    }
                ],
                conclusion: `${strategyName} solution for ${problem.title}`,
                alternatives: []
            },
            implementation: {
                phases: [
                    {
                        phase: 'Strategy Application',
                        tasks: [`Apply ${strategyName} principles`, 'Implement solution'],
                        estimatedTime: '2-4 weeks',
                        dependencies: [],
                        risks: ['Strategy may not fit all aspects of problem']
                    }
                ]
            },
            validation: {
                successCriteria: [`${strategyName} principles applied correctly`],
                testCases: ['Strategy validation tests'],
                metrics: ['Solution effectiveness > 80%'],
                rollbackPlan: 'Revert to previous approach'
            },
            confidence: 0.8,
            learningNotes: [`${strategyName} applied to ${problem.domain} problem`]
        };
    }

    private evaluateSolutionQuality(problem: EnhancedProblemContext, solution: ReasoningSolution): SolutionMetrics {
        // Calculate various quality metrics
        const technicalQuality = this.calculateTechnicalQuality(solution);
        const implementationComplexity = this.calculateImplementationComplexity(solution);
        const riskLevel = this.calculateRiskLevel(problem, solution);
        const timeToValue = this.calculateTimeToValue(solution);
        const maintainability = this.calculateMaintainability(solution);
        const scalability = this.calculateScalability(problem, solution);

        const overallScore = (
            technicalQuality * 0.2 +
            (1 - implementationComplexity) * 0.15 +
            (1 - riskLevel) * 0.2 +
            (1 - timeToValue) * 0.15 +
            maintainability * 0.15 +
            scalability * 0.15
        );

        return {
            technicalQuality,
            implementationComplexity,
            riskLevel,
            timeToValue,
            maintainability,
            scalability,
            overallScore
        };
    }

    private async enhanceSolutionWithSpecializedInsights(
        problem: EnhancedProblemContext,
        solution: ReasoningSolution,
        strategy: ProblemSolvingStrategy,
        metrics: SolutionMetrics
    ): Promise<ReasoningSolution> {
        // Enhance solution with additional specialized insights
        const enhancedSolution = { ...solution };
        
        enhancedSolution.learningNotes = [
            ...solution.learningNotes,
            `Strategy ${strategy.name} achieved ${(metrics.overallScore * 100).toFixed(1)}% quality score`,
            `Technical quality: ${(metrics.technicalQuality * 100).toFixed(1)}%`,
            `Risk level: ${(metrics.riskLevel * 100).toFixed(1)}%`,
            `Maintainability: ${(metrics.maintainability * 100).toFixed(1)}%`
        ];

        // Add quality assessment to validation
        enhancedSolution.validation.metrics.push(
            `Overall quality score: ${(metrics.overallScore * 100).toFixed(1)}%`,
            `Implementation complexity: ${(metrics.implementationComplexity * 100).toFixed(1)}%`,
            `Scalability rating: ${(metrics.scalability * 100).toFixed(1)}%`
        );

        return enhancedSolution;
    }

    private async learnFromSpecializedSolution(
        problem: EnhancedProblemContext,
        solution: ReasoningSolution,
        strategy: ProblemSolvingStrategy
    ): Promise<void> {
        const learningData = {
            input: JSON.stringify({
                problem: problem.title,
                domain: problem.domain,
                complexity: problem.complexity,
                strategy: strategy.name
            }),
            output: JSON.stringify({
                approach: solution.approach,
                confidence: solution.confidence,
                qualityScore: solution.learningNotes.find(note => note.includes('quality score'))
            }),
            context: {
                strategyType: strategy.name,
                domain: problem.domain,
                complexity: problem.complexity,
                specializedApproach: true
            },
            feedback: {
                rating: 5,
                helpful: true,
                comment: `Specialized ${strategy.name} strategy applied`,
                actionTaken: 'applied'
            }
        };

        await this.openCogService.learn(learningData);
    }

    private generateSpecializedFallbackSolution(problem: EnhancedProblemContext): ReasoningSolution {
        return {
            id: `specialized_fallback_${Date.now()}`,
            approach: 'general-problem-solving',
            reasoning: {
                type: 'deductive',
                steps: [{
                    step: 1,
                    description: 'General problem-solving approach',
                    reasoning: 'No specialized strategy available, using general approach',
                    confidence: 0.4
                }],
                conclusion: 'General solution approach when specialized strategies fail',
                alternatives: []
            },
            implementation: {
                phases: [{
                    phase: 'General Implementation',
                    tasks: ['Analyze problem generally', 'Apply standard practices'],
                    estimatedTime: 'TBD',
                    dependencies: [],
                    risks: ['May not address specialized requirements']
                }]
            },
            validation: {
                successCriteria: ['Basic problem resolution'],
                testCases: ['General functionality tests'],
                metrics: ['Basic functionality working'],
                rollbackPlan: 'Seek expert consultation'
            },
            confidence: 0.4,
            learningNotes: ['Specialized strategy not available', 'General approach used as fallback']
        };
    }

    // Utility Methods

    private calculateComplexityScore(problem: EnhancedProblemContext): number {
        const complexityMap = { 'low': 0.25, 'medium': 0.5, 'high': 0.75, 'expert': 1.0 };
        let score = complexityMap[problem.complexity] || 0.5;
        
        // Adjust for additional factors
        if (problem.stakeholders && problem.stakeholders.length > 3) score += 0.1;
        if (problem.technicalDebt && problem.technicalDebt > 70) score += 0.15;
        if (problem.knowledgeGaps && problem.knowledgeGaps.length > 2) score += 0.1;
        
        return Math.min(score, 1.0);
    }

    private mapBusinessImpactToScore(impact?: string): number {
        const impactMap = { 'low': 0.2, 'medium': 0.5, 'high': 0.8, 'critical': 1.0 };
        return impactMap[impact || 'medium'] || 0.5;
    }

    private mapRiskToleranceToScore(tolerance?: string): number {
        const toleranceMap = { 'low': 0.2, 'medium': 0.5, 'high': 0.8 };
        return toleranceMap[tolerance || 'medium'] || 0.5;
    }

    private getHistoricalStrategySuccess(strategyName: string, domain: string): number {
        const historicalSolutions = this.solutionHistory.get(domain) || [];
        const strategyUses = historicalSolutions.filter(s => s.approach === strategyName);
        
        if (strategyUses.length === 0) return 0.5; // Neutral if no history
        
        const avgConfidence = strategyUses.reduce((sum, s) => sum + s.confidence, 0) / strategyUses.length;
        return avgConfidence;
    }

    private calculateTechnicalQuality(solution: ReasoningSolution): number {
        // Based on reasoning steps confidence and implementation plan quality
        const reasoningQuality = solution.reasoning.steps.reduce((sum, step) => sum + step.confidence, 0) / solution.reasoning.steps.length;
        const implementationQuality = solution.implementation.phases.length > 2 ? 0.8 : 0.6;
        return (reasoningQuality + implementationQuality) / 2;
    }

    private calculateImplementationComplexity(solution: ReasoningSolution): number {
        // Based on number of phases and tasks
        const phaseCount = solution.implementation.phases.length;
        const taskCount = solution.implementation.phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
        return Math.min((phaseCount * 0.2) + (taskCount * 0.05), 1.0);
    }

    private calculateRiskLevel(problem: EnhancedProblemContext, solution: ReasoningSolution): number {
        // Based on problem complexity and solution confidence
        const problemRisk = this.calculateComplexityScore(problem);
        const solutionRisk = 1 - solution.confidence;
        return (problemRisk + solutionRisk) / 2;
    }

    private calculateTimeToValue(solution: ReasoningSolution): number {
        // Based on implementation timeline
        const totalPhases = solution.implementation.phases.length;
        return Math.min(totalPhases * 0.25, 1.0);
    }

    private calculateMaintainability(solution: ReasoningSolution): number {
        // Based on solution clarity and documentation
        const hasCodeExamples = solution.implementation.codeExamples && solution.implementation.codeExamples.length > 0;
        const hasTestingStrategy = solution.implementation.testingStrategy !== undefined;
        const baseScore = 0.6;
        return baseScore + (hasCodeExamples ? 0.2 : 0) + (hasTestingStrategy ? 0.2 : 0);
    }

    private calculateScalability(problem: EnhancedProblemContext, solution: ReasoningSolution): number {
        // Based on domain and solution approach
        const scalabilityDomains = ['architecture', 'performance', 'integration'];
        const isScalabilityRelevant = scalabilityDomains.includes(problem.domain);
        return isScalabilityRelevant ? 0.8 : 0.6;
    }

    private storeSolutionInHistory(domain: string, solution: ReasoningSolution): void {
        const history = this.solutionHistory.get(domain) || [];
        history.push(solution);
        this.solutionHistory.set(domain, history.slice(-10)); // Keep last 10 solutions per domain
    }
}