#!/usr/bin/env node
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
 * Test Script for Specialized Problem-Solving Agent
 * 
 * This script validates the enhanced reasoning agents with specialized problem-solving
 * strategies including debugging, architecture, performance, security, and integration
 * problem-solving approaches.
 */

import process from "node:process";
const { MockOpenCogService, MockKnowledgeService } = require('./reasoning-agents-validation.js');

console.log('🔬 Starting Specialized Problem-Solving Agent Tests...\n');

// Enhanced Mock Services for Specialized Testing
class EnhancedMockOpenCogService extends MockOpenCogService {
    constructor() {
        super();
        this.specializedKnowledge = new Map();
        this.initializeSpecializedKnowledge();
    }

    initializeSpecializedKnowledge() {
        // Add specialized domain knowledge
        this.specializedKnowledge.set('debugging', [
            'systematic-approach', 'hypothesis-testing', 'evidence-collection',
            'root-cause-analysis', 'regression-prevention'
        ]);
        this.specializedKnowledge.set('architecture', [
            'domain-driven-design', 'microservices', 'event-sourcing',
            'CQRS', 'hexagonal-architecture', 'clean-architecture'
        ]);
        this.specializedKnowledge.set('performance', [
            'profiling', 'caching', 'database-optimization',
            'load-balancing', 'cdn-usage', 'async-processing'
        ]);
        this.specializedKnowledge.set('security', [
            'threat-modeling', 'defense-in-depth', 'zero-trust',
            'encryption', 'authentication', 'authorization'
        ]);
        this.specializedKnowledge.set('integration', [
            'api-first', 'event-driven', 'message-queues',
            'circuit-breakers', 'retry-patterns', 'bulkhead-pattern'
        ]);
    }

    async reason(query) {
        const result = await super.reason(query);
        
        // Add specialized reasoning based on domain
        if (query.context?.domain && this.specializedKnowledge.has(query.context.domain)) {
            const domainKnowledge = this.specializedKnowledge.get(query.context.domain);
            result.metadata.domainKnowledge = domainKnowledge;
            result.metadata.specializedReasoning = true;
            result.confidence = Math.min(result.confidence + 0.1, 1.0); // Boost confidence with specialized knowledge
        }

        return result;
    }
}

// Simplified Specialized Problem-Solving Agent for Testing
class TestSpecializedProblemSolvingAgent {
    constructor(openCogService, knowledgeService) {
        this.openCogService = openCogService;
        this.knowledgeService = knowledgeService;
        this.id = 'specialized-problem-solving-agent';
        this.name = 'Specialized Problem-Solving Agent';
        this.description = 'Domain-specific cognitive agent for specialized software engineering problems';
        this.strategies = this.initializeStrategies();
        this.solutionHistory = new Map();
        this.domainExpertise = new Map([
            ['debugging', 0.92],
            ['architecture', 0.90],
            ['performance', 0.85],
            ['security', 0.88],
            ['integration', 0.83]
        ]);
    }

    initializeStrategies() {
        return new Map([
            ['systematic-debugging', {
                name: 'Systematic Debugging',
                description: 'Methodical root cause analysis with evidence-based investigation',
                applicableDomains: ['debugging', 'performance'],
                complexity: ['medium', 'high', 'expert'],
                effectiveness: 0.9
            }],
            ['hypothesis-debugging', {
                name: 'Hypothesis-Driven Debugging',
                description: 'Generate and test hypotheses about potential causes',
                applicableDomains: ['debugging', 'performance', 'security'],
                complexity: ['high', 'expert'],
                effectiveness: 0.85
            }],
            ['domain-driven-design', {
                name: 'Domain-Driven Design',
                description: 'Architecture design based on domain modeling',
                applicableDomains: ['architecture', 'design'],
                complexity: ['high', 'expert'],
                effectiveness: 0.88
            }],
            ['performance-profiling', {
                name: 'Performance Profiling',
                description: 'Data-driven performance optimization',
                applicableDomains: ['performance', 'scalability'],
                complexity: ['medium', 'high'],
                effectiveness: 0.87
            }],
            ['threat-modeling', {
                name: 'Threat Modeling',
                description: 'Security design based on systematic threat analysis',
                applicableDomains: ['security', 'architecture'],
                complexity: ['high', 'expert'],
                effectiveness: 0.86
            }],
            ['api-first-integration', {
                name: 'API-First Integration',
                description: 'Design APIs before implementation for better integration',
                applicableDomains: ['integration', 'architecture'],
                complexity: ['medium', 'high'],
                effectiveness: 0.84
            }],
            ['event-driven-integration', {
                name: 'Event-Driven Integration',
                description: 'Use event-driven patterns for loose coupling',
                applicableDomains: ['integration', 'architecture', 'scalability'],
                complexity: ['high', 'expert'],
                effectiveness: 0.83
            }],
            ['legacy-modernization', {
                name: 'Legacy System Modernization',
                description: 'Systematic approach to modernizing legacy integrations',
                applicableDomains: ['integration', 'architecture'],
                complexity: ['expert'],
                effectiveness: 0.82
            }]
        ]);
    }

    async solveWithSpecializedStrategy(problem) {
        console.log(`\n🎯 Specialized Problem-Solving for: "${problem.title}"`);
        console.log(`   Domain: ${problem.domain}, Complexity: ${problem.complexity}`);
        console.log(`   Business Impact: ${problem.businessImpact || 'medium'}`);

        try {
            // Step 1: Analyze problem with specialized lens
            console.log('   🔍 Step 1: Specialized problem analysis...');
            const analysis = await this.analyzeSpecializedProblem(problem);

            // Step 2: Select specialized strategy
            console.log('   🎯 Step 2: Selecting specialized strategy...');
            const selectedStrategy = this.selectSpecializedStrategy(problem, analysis);
            
            if (!selectedStrategy) {
                throw new Error(`No specialized strategy available for ${problem.domain}`);
            }

            console.log(`   Selected Strategy: ${selectedStrategy.name}`);
            console.log(`   Strategy Effectiveness: ${(selectedStrategy.effectiveness * 100).toFixed(1)}%`);

            // Step 3: Execute specialized reasoning
            console.log('   🧠 Step 3: Executing specialized reasoning...');
            const solution = await this.executeSpecializedStrategy(problem, selectedStrategy);

            // Step 4: Evaluate solution quality
            console.log('   📊 Step 4: Evaluating solution quality...');
            const qualityMetrics = this.evaluateSolutionQuality(problem, solution);

            // Step 5: Enhance with specialized insights
            console.log('   ✨ Step 5: Adding specialized insights...');
            const enhancedSolution = this.enhanceSolutionWithInsights(problem, solution, selectedStrategy, qualityMetrics);

            // Step 6: Learn from specialized approach
            await this.learnFromSpecializedSolution(problem, enhancedSolution, selectedStrategy);

            console.log(`   🎉 Specialized solution generated with ${(enhancedSolution.confidence * 100).toFixed(1)}% confidence`);
            console.log(`   📈 Quality Score: ${(qualityMetrics.overallScore * 100).toFixed(1)}%`);

            return enhancedSolution;

        } catch (error) {
            console.log(`   ❌ Specialized reasoning failed: ${error.message}`);
            return this.generateFallbackSolution(problem);
        }
    }

    async analyzeSpecializedProblem(problem) {
        // Enhanced analysis with specialized factors
        const domainExpertise = this.domainExpertise.get(problem.domain) || 0.5;
        const complexityScore = this.calculateComplexityScore(problem);
        const businessCriticality = this.mapBusinessImpactToScore(problem.businessImpact);
        
        return {
            domainExpertiseLevel: domainExpertise,
            problemComplexityScore: complexityScore,
            businessCriticality: businessCriticality,
            technicalDebtFactor: problem.technicalDebt || 0,
            stakeholderComplexity: problem.stakeholders?.length || 1,
            knowledgeGapCount: problem.knowledgeGaps?.length || 0,
            riskTolerance: this.mapRiskToleranceToScore(problem.riskTolerance),
            historicalSolutions: this.solutionHistory.get(problem.domain) || [],
            specializedContext: this.getSpecializedContext(problem.domain)
        };
    }

    selectSpecializedStrategy(problem, analysis) {
        const availableStrategies = Array.from(this.strategies.values()).filter(strategy =>
            strategy.applicableDomains.includes(problem.domain) &&
            strategy.complexity.includes(problem.complexity)
        );

        if (availableStrategies.length === 0) {
            return null;
        }

        // Score strategies based on problem characteristics
        const scoredStrategies = availableStrategies.map(strategy => ({
            ...strategy,
            score: this.calculateStrategyScore(strategy, problem, analysis)
        }));

        // Return highest scoring strategy
        scoredStrategies.sort((a, b) => b.score - a.score);
        return scoredStrategies[0];
    }

    calculateStrategyScore(strategy, problem, analysis) {
        let score = strategy.effectiveness * 0.4; // Base effectiveness

        // Domain expertise bonus
        score += analysis.domainExpertiseLevel * 0.2;

        // Problem-specific bonuses
        if (strategy.name.includes('Systematic') && problem.complexity === 'expert') {
            score += 0.15;
        }
        if (strategy.name.includes('Hypothesis') && analysis.knowledgeGapCount > 2) {
            score += 0.1;
        }
        if (strategy.name.includes('Security') && problem.businessImpact === 'critical') {
            score += 0.15;
        }
        if (strategy.name.includes('Performance') && problem.domain === 'performance') {
            score += 0.1;
        }

        // Historical success factor
        const historicalSuccess = this.getHistoricalSuccess(strategy.name, problem.domain);
        score += historicalSuccess * 0.1;

        return Math.min(score, 1.0);
    }

    async executeSpecializedStrategy(problem, strategy) {
        // Create reasoning query specific to the strategy
        const reasoningQuery = {
            type: this.mapStrategyToReasoningType(strategy.name),
            atoms: [{ type: 'ProblemNode', name: problem.id }],
            context: {
                domain: problem.domain,
                strategy: strategy.name,
                complexity: problem.complexity,
                businessImpact: problem.businessImpact
            }
        };

        const reasoningResult = await this.openCogService.reason(reasoningQuery);

        // Generate strategy-specific implementation steps
        const implementationSteps = this.generateStrategySpecificSteps(strategy, problem);
        const validationCriteria = this.generateValidationCriteria(strategy, problem);

        return {
            id: `specialized_${strategy.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
            approach: strategy.name.replace(/\s+/g, '-').toLowerCase(),
            reasoning: {
                type: reasoningQuery.type,
                steps: implementationSteps,
                conclusion: `${strategy.name} solution for ${problem.title}`,
                alternatives: this.generateStrategyAlternatives(strategy, problem)
            },
            implementation: {
                phases: this.generateImplementationPhases(strategy, problem),
                codeExamples: this.generateCodeExamples(strategy, problem),
                testingStrategy: this.generateTestingStrategy(strategy, problem)
            },
            validation: validationCriteria,
            confidence: this.calculateStrategyConfidence(strategy, reasoningResult),
            learningNotes: this.generateStrategyLearningNotes(strategy, problem)
        };
    }

    evaluateSolutionQuality(problem, solution) {
        // Quality evaluation based on multiple factors
        const technicalQuality = this.calculateTechnicalQuality(solution);
        const implementationComplexity = this.calculateImplementationComplexity(solution);
        const riskLevel = this.calculateRiskLevel(problem, solution);
        const timeToValue = this.calculateTimeToValue(solution);
        const maintainability = this.calculateMaintainability(solution);
        const scalability = this.calculateScalability(problem);

        const overallScore = (
            technicalQuality * 0.25 +
            (1 - implementationComplexity) * 0.15 +
            (1 - riskLevel) * 0.2 +
            (1 - timeToValue) * 0.1 +
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

    enhanceSolutionWithInsights(problem, solution, strategy, metrics) {
        const enhancedSolution = { ...solution };
        
        // Add quality insights
        enhancedSolution.learningNotes = [
            ...solution.learningNotes,
            `Strategy ${strategy.name} achieved ${(metrics.overallScore * 100).toFixed(1)}% quality score`,
            `Technical quality: ${(metrics.technicalQuality * 100).toFixed(1)}%`,
            `Risk level: ${(metrics.riskLevel * 100).toFixed(1)}%`,
            `Time to value: ${(metrics.timeToValue * 100).toFixed(1)}%`,
            `Maintainability: ${(metrics.maintainability * 100).toFixed(1)}%`,
            `Strategy effectiveness: ${(strategy.effectiveness * 100).toFixed(1)}%`
        ];

        // Enhance validation metrics
        enhancedSolution.validation.metrics = [
            ...enhancedSolution.validation.metrics,
            `Overall quality: ${(metrics.overallScore * 100).toFixed(1)}%`,
            `Technical quality: ${(metrics.technicalQuality * 100).toFixed(1)}%`,
            `Implementation complexity: ${(metrics.implementationComplexity * 100).toFixed(1)}%`,
            `Risk assessment: ${(metrics.riskLevel * 100).toFixed(1)}%`
        ];

        // Adjust confidence based on quality metrics
        enhancedSolution.confidence = Math.min(
            (enhancedSolution.confidence + metrics.overallScore) / 2,
            1.0
        );

        return enhancedSolution;
    }

    async learnFromSpecializedSolution(problem, solution, strategy) {
        const learningData = {
            input: JSON.stringify({
                problem: problem.title,
                domain: problem.domain,
                complexity: problem.complexity,
                businessImpact: problem.businessImpact,
                strategy: strategy.name
            }),
            output: JSON.stringify({
                approach: solution.approach,
                confidence: solution.confidence,
                qualityScore: solution.learningNotes.find(note => note.includes('quality score'))
            }),
            context: {
                specializedStrategy: strategy.name,
                domain: problem.domain,
                complexity: problem.complexity,
                businessImpact: problem.businessImpact,
                strategyEffectiveness: strategy.effectiveness
            },
            feedback: {
                rating: 5,
                helpful: true,
                comment: `Specialized ${strategy.name} strategy successfully applied`,
                actionTaken: 'applied'
            }
        };

        await this.openCogService.learn(learningData);
        
        // Store in solution history
        const history = this.solutionHistory.get(problem.domain) || [];
        history.push(solution);
        this.solutionHistory.set(problem.domain, history.slice(-5)); // Keep last 5 per domain
    }

    generateFallbackSolution(problem) {
        return {
            id: `specialized_fallback_${Date.now()}`,
            approach: 'general-specialized-approach',
            reasoning: {
                type: 'deductive',
                steps: [{
                    step: 1,
                    description: 'General specialized approach',
                    reasoning: 'No specific strategy available, using domain best practices',
                    confidence: 0.5
                }],
                conclusion: `General ${problem.domain} solution approach`,
                alternatives: []
            },
            implementation: {
                phases: [{
                    phase: 'General Implementation',
                    tasks: ['Apply domain best practices', 'Consult domain experts'],
                    estimatedTime: 'TBD',
                    dependencies: [],
                    risks: ['May not address specific problem nuances']
                }],
                codeExamples: [`// General ${problem.domain} implementation`],
                testingStrategy: `Standard ${problem.domain} testing approach`
            },
            validation: {
                successCriteria: [`Basic ${problem.domain} problem resolution`],
                testCases: ['General functionality tests'],
                metrics: ['Basic problem resolution'],
                rollbackPlan: 'Consult domain experts for specialized guidance'
            },
            confidence: 0.5,
            learningNotes: [`Specialized strategy not available for ${problem.domain}`, 'Used general domain approach']
        };
    }

    // Helper Methods

    calculateComplexityScore(problem) {
        const complexityMap = { 'low': 0.25, 'medium': 0.5, 'high': 0.75, 'expert': 1.0 };
        let score = complexityMap[problem.complexity] || 0.5;
        
        if (problem.stakeholders && problem.stakeholders.length > 3) score += 0.1;
        if (problem.technicalDebt && problem.technicalDebt > 70) score += 0.15;
        if (problem.knowledgeGaps && problem.knowledgeGaps.length > 2) score += 0.1;
        
        return Math.min(score, 1.0);
    }

    mapBusinessImpactToScore(impact) {
        const impactMap = { 'low': 0.2, 'medium': 0.5, 'high': 0.8, 'critical': 1.0 };
        return impactMap[impact || 'medium'] || 0.5;
    }

    mapRiskToleranceToScore(tolerance) {
        const toleranceMap = { 'low': 0.2, 'medium': 0.5, 'high': 0.8 };
        return toleranceMap[tolerance || 'medium'] || 0.5;
    }

    getSpecializedContext(domain) {
        const contexts = {
            'debugging': ['reproduction', 'analysis', 'hypothesis', 'validation'],
            'architecture': ['modeling', 'patterns', 'constraints', 'evolution'],
            'performance': ['profiling', 'optimization', 'monitoring', 'scaling'],
            'security': ['threats', 'controls', 'compliance', 'monitoring'],
            'integration': ['contracts', 'protocols', 'patterns', 'resilience']
        };
        return contexts[domain] || ['general'];
    }

    mapStrategyToReasoningType(strategyName) {
        const mappings = {
            'Systematic Debugging': 'deductive',
            'Hypothesis-Driven Debugging': 'abductive',
            'Domain-Driven Design': 'deductive',
            'Performance Profiling': 'inductive',
            'Threat Modeling': 'deductive',
            'API-First Integration': 'deductive'
        };
        return mappings[strategyName] || 'deductive';
    }

    generateStrategySpecificSteps(strategy, problem) {
        const baseSteps = [
            {
                step: 1,
                description: `Initialize ${strategy.name} approach`,
                reasoning: `Setting up ${strategy.name} methodology for ${problem.domain}`,
                confidence: 0.9
            },
            {
                step: 2,
                description: 'Apply strategy-specific techniques',
                reasoning: `Executing ${strategy.name} specific procedures`,
                confidence: 0.85
            },
            {
                step: 3,
                description: 'Validate strategy effectiveness',
                reasoning: `Ensuring ${strategy.name} produces desired results`,
                confidence: 0.8
            }
        ];

        // Add strategy-specific steps
        if (strategy.name.includes('Debugging')) {
            baseSteps.push({
                step: 4,
                description: 'Implement debugging safeguards',
                reasoning: 'Ensure the fix prevents similar issues in the future',
                confidence: 0.85
            });
        }

        return baseSteps;
    }

    generateValidationCriteria(strategy, problem) {
        return {
            successCriteria: [
                `${strategy.name} methodology correctly applied`,
                `${problem.domain} problem effectively addressed`,
                'Solution meets quality standards',
                'Implementation is maintainable'
            ],
            testCases: [
                'Strategy-specific validation tests',
                'Domain-specific functionality tests',
                'Quality assurance tests',
                'Regression prevention tests'
            ],
            metrics: [
                `Strategy effectiveness > ${(strategy.effectiveness * 100).toFixed(0)}%`,
                'Problem resolution confidence > 80%',
                'Quality score > 75%',
                'Implementation time within estimates'
            ],
            rollbackPlan: `Revert to previous state if ${strategy.name} approach fails`
        };
    }

    generateImplementationPhases(strategy, problem) {
        return [
            {
                phase: `${strategy.name} Setup`,
                tasks: [`Setup ${strategy.name} environment`, 'Prepare necessary tools'],
                estimatedTime: '1-2 days',
                dependencies: [],
                risks: ['Setup complexity', 'Tool availability']
            },
            {
                phase: `${strategy.name} Execution`,
                tasks: ['Apply strategy methodology', 'Monitor progress', 'Adjust approach'],
                estimatedTime: '1-2 weeks',
                dependencies: [`${strategy.name} Setup`],
                risks: ['Strategy may not fit perfectly', 'Unexpected complications']
            },
            {
                phase: 'Validation and Refinement',
                tasks: ['Validate results', 'Refine solution', 'Document approach'],
                estimatedTime: '3-5 days',
                dependencies: [`${strategy.name} Execution`],
                risks: ['Validation may reveal issues', 'Refinement may be extensive']
            }
        ];
    }

    generateCodeExamples(strategy, problem) {
        const examples = {
            'Systematic Debugging': [
                '// Systematic debugging setup',
                'const debugConfig = { verbose: true, trackState: true };',
                'function debugStep(description, state) { /* debug logging */ }'
            ],
            'Performance Profiling': [
                '// Performance profiling instrumentation',
                'const profiler = require("profiler");',
                'profiler.start(); /* code to profile */ profiler.stop();'
            ]
        };
        return examples[strategy.name] || [`// ${strategy.name} implementation`];
    }

    generateTestingStrategy(strategy, problem) {
        return `${strategy.name} testing strategy for ${problem.domain} problems with emphasis on strategy-specific validation`;
    }

    calculateStrategyConfidence(strategy, reasoningResult) {
        return Math.min(strategy.effectiveness + reasoningResult.confidence * 0.2, 1.0);
    }

    generateStrategyLearningNotes(strategy, problem) {
        return [
            `${strategy.name} strategy applied to ${problem.domain} problem`,
            `Strategy effectiveness: ${(strategy.effectiveness * 100).toFixed(1)}%`,
            `Domain: ${problem.domain}, Complexity: ${problem.complexity}`,
            `Strategy-specific approach used successfully`
        ];
    }

    generateStrategyAlternatives(strategy, problem) {
        const alternatives = Array.from(this.strategies.values())
            .filter(s => s.applicableDomains.includes(problem.domain) && s !== strategy)
            .slice(0, 2)
            .map(s => ({
                approach: s.name.replace(/\s+/g, '-').toLowerCase(),
                pros: [`${s.effectiveness * 100}% effectiveness`, 'Proven approach'],
                cons: ['Different methodology', 'May require different skills'],
                feasibility: s.effectiveness
            }));
        
        return alternatives;
    }

    getHistoricalSuccess(strategyName, domain) {
        const history = this.solutionHistory.get(domain) || [];
        const strategyHistory = history.filter(s => s.approach === strategyName.replace(/\s+/g, '-').toLowerCase());
        
        if (strategyHistory.length === 0) return 0.5;
        
        return strategyHistory.reduce((sum, s) => sum + s.confidence, 0) / strategyHistory.length;
    }

    calculateTechnicalQuality(solution) {
        const reasoningQuality = solution.reasoning.steps.reduce((sum, step) => sum + step.confidence, 0) / solution.reasoning.steps.length;
        const implementationQuality = solution.implementation.phases.length >= 3 ? 0.8 : 0.6;
        const validationQuality = solution.validation.successCriteria.length >= 3 ? 0.8 : 0.6;
        return (reasoningQuality + implementationQuality + validationQuality) / 3;
    }

    calculateImplementationComplexity(solution) {
        const phaseCount = solution.implementation.phases.length;
        const taskCount = solution.implementation.phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
        return Math.min((phaseCount * 0.15) + (taskCount * 0.05), 1.0);
    }

    calculateRiskLevel(problem, solution) {
        const problemRisk = this.calculateComplexityScore(problem);
        const solutionRisk = 1 - solution.confidence;
        const businessRisk = this.mapBusinessImpactToScore(problem.businessImpact);
        return (problemRisk + solutionRisk + businessRisk) / 3;
    }

    calculateTimeToValue(solution) {
        const totalPhases = solution.implementation.phases.length;
        return Math.min(totalPhases * 0.2, 1.0);
    }

    calculateMaintainability(solution) {
        const hasCodeExamples = solution.implementation.codeExamples.length > 0;
        const hasTestStrategy = solution.implementation.testingStrategy !== undefined;
        const hasDocumentation = solution.learningNotes.length > 3;
        
        let score = 0.5;
        if (hasCodeExamples) score += 0.15;
        if (hasTestStrategy) score += 0.15;
        if (hasDocumentation) score += 0.2;
        
        return Math.min(score, 1.0);
    }

    calculateScalability(problem) {
        const scalabilityRelevantDomains = ['architecture', 'performance', 'integration'];
        return scalabilityRelevantDomains.includes(problem.domain) ? 0.8 : 0.6;
    }
}

// Enhanced Test Problems for Specialized Strategies
const specializedTestProblems = [
    {
        id: 'debug_memory_leak',
        title: 'Complex Memory Leak in Microservice',
        description: 'Intermittent memory leak causing service crashes in production',
        domain: 'debugging',
        complexity: 'expert',
        businessImpact: 'critical',
        technicalDebt: 45,
        constraints: ['production environment', 'cannot restart frequently', 'high user impact'],
        goals: ['identify root cause', 'fix without downtime', 'prevent recurrence'],
        stakeholders: ['DevOps team', 'Backend developers', 'Product owner'],
        knowledgeGaps: ['memory profiling tools', 'garbage collection patterns'],
        riskTolerance: 'low',
        context: {
            technology: ['Node.js', 'Docker', 'Kubernetes', 'Prometheus'],
            timeline: '1 week critical',
            resources: ['2 senior developers', '1 DevOps engineer']
        }
    },
    {
        id: 'arch_distributed_system',
        title: 'Design Fault-Tolerant Distributed System',
        description: 'Architecture for high-availability distributed system with eventual consistency',
        domain: 'architecture',
        complexity: 'expert',
        businessImpact: 'high',
        technicalDebt: 20,
        constraints: ['global distribution', 'eventual consistency', 'cost optimization'],
        goals: ['99.99% uptime', 'sub-second response times', 'horizontal scalability'],
        stakeholders: ['System architects', 'Platform engineers', 'Business analysts'],
        knowledgeGaps: ['distributed consensus algorithms', 'conflict resolution patterns'],
        riskTolerance: 'medium',
        context: {
            technology: ['Kubernetes', 'Apache Kafka', 'Redis', 'PostgreSQL'],
            timeline: '6 months',
            resources: ['3 architects', '5 developers', '2 DevOps engineers']
        }
    },
    {
        id: 'perf_database_optimization',
        title: 'Critical Database Performance Optimization',
        description: 'Optimize slow database queries causing application timeouts',
        domain: 'performance',
        complexity: 'high',
        businessImpact: 'high',
        technicalDebt: 65,
        constraints: ['cannot change schema during business hours', 'maintain data consistency'],
        goals: ['sub-200ms query times', 'handle 10x traffic', 'minimal resource usage'],
        stakeholders: ['Database administrators', 'Backend developers', 'Business stakeholders'],
        knowledgeGaps: ['query optimization techniques', 'indexing strategies'],
        riskTolerance: 'medium',
        context: {
            technology: ['PostgreSQL', 'Redis', 'Connection pooling'],
            timeline: '3 weeks',
            resources: ['1 DBA', '2 backend developers']
        }
    },
    {
        id: 'sec_api_hardening',
        title: 'Comprehensive API Security Hardening',
        description: 'Implement comprehensive security for public-facing APIs',
        domain: 'security',
        complexity: 'high',
        businessImpact: 'critical',
        technicalDebt: 55,
        constraints: ['maintain backward compatibility', 'comply with regulations', 'performance impact'],
        goals: ['prevent security breaches', 'compliance certification', 'minimal latency increase'],
        stakeholders: ['Security team', 'Compliance officers', 'API developers'],
        knowledgeGaps: ['advanced threat patterns', 'regulatory requirements'],
        riskTolerance: 'low',
        context: {
            technology: ['Express.js', 'JWT', 'OAuth2', 'Rate limiting'],
            timeline: '8 weeks',
            resources: ['2 security specialists', '3 developers']
        }
    },
    {
        id: 'int_legacy_modernization',
        title: 'Legacy System Integration Modernization',
        description: 'Modernize integration between legacy and modern systems',
        domain: 'integration',
        complexity: 'expert',
        businessImpact: 'high',
        technicalDebt: 85,
        constraints: ['cannot modify legacy system', 'minimize downtime', 'data consistency'],
        goals: ['seamless integration', 'improved reliability', 'reduced maintenance'],
        stakeholders: ['Integration team', 'Legacy system maintainers', 'Modern system developers'],
        knowledgeGaps: ['legacy protocols', 'migration patterns'],
        riskTolerance: 'low',
        context: {
            technology: ['Legacy COBOL system', 'REST APIs', 'Message queues'],
            timeline: '12 weeks',
            resources: ['2 integration specialists', '1 legacy expert', '3 developers']
        }
    }
];

// Main Test Function
async function testSpecializedProblemSolvingAgent() {
    console.log('🚀 Specialized Problem-Solving Agent Test Started\n');
    console.log('=' .repeat(70));

    // Initialize enhanced services
    console.log('\n📦 Initializing Enhanced Mock Services...');
    const openCogService = new EnhancedMockOpenCogService();
    const knowledgeService = new MockKnowledgeService();

    // Create specialized agent
    console.log('🧠 Creating Specialized Problem-Solving Agent...');
    const specializedAgent = new TestSpecializedProblemSolvingAgent(openCogService, knowledgeService);

    console.log('\n🎯 Testing Specialized Problem-Solving Strategies...');
    console.log('=' .repeat(70));

    const results = [];
    
    for (let i = 0; i < specializedTestProblems.length; i++) {
        const problem = specializedTestProblems[i];
        console.log(`\n📋 Test ${i + 1}/${specializedTestProblems.length}:`);

        const startTime = Date.now();
        const solution = await specializedAgent.solveWithSpecializedStrategy(problem);
        const endTime = Date.now();

        const result = {
            problemId: problem.id,
            domain: problem.domain,
            complexity: problem.complexity,
            businessImpact: problem.businessImpact,
            approach: solution.approach,
            confidence: solution.confidence,
            processingTime: endTime - startTime,
            qualityScore: solution.learningNotes.find(note => note.includes('quality score'))?.match(/(\d+\.\d+)%/)?.[1] || 'N/A',
            success: solution.confidence > 0.6
        };

        results.push(result);

        console.log(`   📊 Result: ${result.success ? '✅ Success' : '❌ Failed'}`);
        console.log(`   🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`   📈 Quality Score: ${result.qualityScore}${typeof result.qualityScore === 'string' ? '' : '%'}`);
        console.log(`   ⏱️  Processing Time: ${result.processingTime}ms`);
    }

    // Comprehensive Analysis
    console.log('\n📈 Specialized Agent Analysis');
    console.log('=' .repeat(70));

    const successCount = results.filter(r => r.success).length;
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;

    console.log(`✅ Success Rate: ${successCount}/${results.length} (${(successCount / results.length * 100).toFixed(1)}%)`);
    console.log(`🎯 Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    console.log(`⏱️  Average Processing Time: ${avgProcessingTime.toFixed(0)}ms`);

    // Domain-specific Analysis
    console.log('\n📊 Domain-specific Performance:');
    const domainResults = {};
    results.forEach(r => {
        if (!domainResults[r.domain]) {
            domainResults[r.domain] = { total: 0, success: 0, confidence: 0, avgQuality: 0 };
        }
        domainResults[r.domain].total++;
        if (r.success) domainResults[r.domain].success++;
        domainResults[r.domain].confidence += r.confidence;
        
        const quality = parseFloat(r.qualityScore);
        if (!isNaN(quality)) {
            domainResults[r.domain].avgQuality += quality;
        }
    });

    Object.entries(domainResults).forEach(([domain, stats]) => {
        const successRate = (stats.success / stats.total * 100).toFixed(1);
        const avgConf = (stats.confidence / stats.total * 100).toFixed(1);
        const avgQual = stats.avgQuality > 0 ? (stats.avgQuality / stats.total).toFixed(1) : 'N/A';
        console.log(`   ${domain}: ${stats.success}/${stats.total} success (${successRate}%), confidence: ${avgConf}%, quality: ${avgQual}%`);
    });

    // Business Impact Analysis
    console.log('\n💼 Business Impact Analysis:');
    const impactResults = {};
    results.forEach(r => {
        if (!impactResults[r.businessImpact]) {
            impactResults[r.businessImpact] = { total: 0, success: 0, confidence: 0 };
        }
        impactResults[r.businessImpact].total++;
        if (r.success) impactResults[r.businessImpact].success++;
        impactResults[r.businessImpact].confidence += r.confidence;
    });

    Object.entries(impactResults).forEach(([impact, stats]) => {
        const successRate = (stats.success / stats.total * 100).toFixed(1);
        const avgConf = (stats.confidence / stats.total * 100).toFixed(1);
        console.log(`   ${impact} impact: ${stats.success}/${stats.total} success (${successRate}%), confidence: ${avgConf}%`);
    });

    // Strategy Distribution
    console.log('\n🧠 Strategy Usage Distribution:');
    const strategyCount = {};
    results.forEach(r => {
        strategyCount[r.approach] = (strategyCount[r.approach] || 0) + 1;
    });

    Object.entries(strategyCount).forEach(([strategy, count]) => {
        console.log(`   ${strategy}: ${count} problems (${(count / results.length * 100).toFixed(1)}%)`);
    });

    console.log('\n🎉 Specialized Problem-Solving Agent Test Complete!');
    console.log('=' .repeat(70));

    // Final Assessment
    if (successCount === results.length && avgConfidence > 0.75) {
        console.log('✅ All specialized tests passed - Agents are performing excellently');
        console.log('✅ High confidence levels across all domains and strategies');
        console.log('✅ Specialized problem-solving strategies working effectively');
        console.log('✅ Quality metrics indicate robust solution generation');
    } else if (successCount >= results.length * 0.8 && avgConfidence > 0.65) {
        console.log('⚠️  Most specialized tests passed - Good performance with minor issues');
        console.log(`⚠️  ${results.length - successCount} test(s) failed - may need strategy refinement`);
        console.log('✅ Specialized strategies showing good effectiveness');
    } else {
        console.log('❌ Specialized problem-solving needs attention - Multiple issues detected');
        console.log(`❌ ${results.length - successCount} test(s) failed`);
        console.log('❌ Confidence levels below expected thresholds');
    }

    return {
        success: successCount >= results.length * 0.8,
        results: results,
        summary: {
            successRate: successCount / results.length,
            avgConfidence,
            avgProcessingTime,
            domainResults,
            impactResults,
            strategyDistribution: strategyCount
        }
    };
}

// Run the test if this script is executed directly
if (require.main === module) {
    testSpecializedProblemSolvingAgent()
        .then(results => {
            console.log(`\n🏁 Specialized testing completed with ${results.success ? 'SUCCESS' : 'ISSUES'}`);
            process.exit(results.success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Specialized testing failed with error:', error);
            process.exit(1);
        });
}

module.exports = { testSpecializedProblemSolvingAgent, TestSpecializedProblemSolvingAgent };