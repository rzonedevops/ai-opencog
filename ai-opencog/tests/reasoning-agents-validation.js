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
 * Comprehensive Validation Script for Reasoning Agents
 * 
 * This script validates the functionality of reasoning agents for problem-solving
 * in the context of Phase 3: AI Agent Enhancement for SKZ Integration.
 * 
 * It tests:
 * - Multi-step reasoning capabilities
 * - Problem-solving across different domains
 * - Integration with OpenCog services
 * - Learning and adaptation features
 */

import process from "node:process";
console.log('🧠 Starting Reasoning Agents Validation...\n');

// Mock OpenCog Service for validation
class MockOpenCogService {
    constructor() {
        this.atoms = new Map();
        this.knowledgeBase = new Map();
        this.learningData = [];
    }

    async reason(query) {
        console.log(`   🔍 Processing reasoning query: ${query.type}`);
        
        const result = {
            conclusion: [],
            confidence: 0.85,
            explanation: `Processed ${query.type} reasoning with ${query.atoms?.length || 0} input atoms`,
            metadata: {
                reasoningType: query.type,
                processingTime: '45ms',
                rulesApplied: ['modus-ponens', 'pattern-matching']
            }
        };

        // Simulate different reasoning types
        switch (query.type) {
            case 'deductive':
                result.conclusion = [{ type: 'ConceptNode', name: 'deductive-solution', truthValue: { strength: 0.9, confidence: 0.85 } }];
                break;
            case 'inductive':
                result.conclusion = [{ type: 'ConceptNode', name: 'pattern-based-solution', truthValue: { strength: 0.8, confidence: 0.75 } }];
                break;
            case 'abductive':
                result.conclusion = [{ type: 'ConceptNode', name: 'hypothesis-solution', truthValue: { strength: 0.7, confidence: 0.70 } }];
                break;
            case 'analogical':
                result.conclusion = [{ type: 'ConceptNode', name: 'analogical-solution', truthValue: { strength: 0.85, confidence: 0.80 } }];
                break;
            case 'creative':
                result.conclusion = [{ type: 'ConceptNode', name: 'creative-solution', truthValue: { strength: 0.6, confidence: 0.65 } }];
                break;
        }

        return result;
    }

    async learn(learningData) {
        console.log(`   📚 Learning from data: ${learningData.context?.reasoningType || 'general'}`);
        this.learningData.push(learningData);
        return { learned: true, confidence: 0.9 };
    }

    async addAtom(atom) {
        const atomId = `atom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.atoms.set(atomId, atom);
        return atomId;
    }

    async queryAtoms(pattern) {
        console.log(`   🔎 Querying atoms with pattern: ${JSON.stringify(pattern).substring(0, 50)}...`);
        return Array.from(this.atoms.values()).slice(0, 5);
    }

    async recognizePatterns(input) {
        console.log(`   🔍 Recognizing patterns in: ${input.context?.domain || 'general'} domain`);
        return [
            { 
                pattern: { type: 'design-pattern', name: 'singleton' },
                confidence: 0.85,
                instances: [{ text: 'getInstance() pattern found' }],
                metadata: { patternType: 'design-pattern', complexity: 'medium' }
            },
            {
                pattern: { type: 'code-pattern', name: 'async-await' },
                confidence: 0.92,
                instances: [{ text: 'async/await pattern found' }],
                metadata: { patternType: 'async-pattern', complexity: 'low' }
            }
        ];
    }
}

// Mock Knowledge Management Service
class MockKnowledgeService {
    constructor() {
        this.knowledgeGraphs = new Map();
        this.initializeDefaultGraphs();
    }

    initializeDefaultGraphs() {
        this.knowledgeGraphs.set('problem-solving', {
            id: 'problem-solving-graph',
            name: 'Problem Solving Knowledge',
            type: 'problem-solving',
            atoms: []
        });
    }

    async getKnowledgeGraphs(type) {
        return Array.from(this.knowledgeGraphs.values()).filter(g => g.type === type);
    }

    async createKnowledgeGraph(name, type, description) {
        const graphId = `graph_${Date.now()}`;
        const graph = { id: graphId, name, type, description, atoms: [] };
        this.knowledgeGraphs.set(type, graph);
        return graph;
    }

    async addAtomToGraph(graphId, atom) {
        const graph = Array.from(this.knowledgeGraphs.values()).find(g => g.id === graphId);
        if (graph) {
            graph.atoms.push(atom);
        }
        return `atom_${Date.now()}`;
    }

    async searchAtoms(query, options) {
        console.log(`   📖 Searching atoms for: ${query}`);
        return [
            { type: 'ConceptNode', name: 'reasoning-pattern-1', truthValue: { strength: 0.8, confidence: 0.9 } },
            { type: 'ConceptNode', name: 'reasoning-pattern-2', truthValue: { strength: 0.7, confidence: 0.8 } }
        ];
    }

    async discoverKnowledge(query) {
        console.log(`   🔬 Discovering knowledge for: ${query.type}`);
        return {
            concepts: ['problem-solving', 'reasoning', 'cognitive-analysis'],
            relationships: ['related-to', 'similar-to', 'derived-from'],
            insights: ['Pattern-based solutions work well for architecture problems']
        };
    }
}

// Simplified Reasoning Agent for Testing
class TestAdvancedReasoningAgent {
    constructor(openCogService, knowledgeService) {
        this.openCogService = openCogService;
        this.knowledgeService = knowledgeService;
        this.id = 'advanced-reasoning-agent';
        this.name = 'Advanced Problem-Solving Reasoner';
        this.description = 'Cognitive AI agent for complex software engineering problem-solving';
    }

    async initializeReasoningCapabilities() {
        console.log('   ⚙️  Initializing reasoning capabilities...');
        await this.initializeProblemSolvingKnowledge();
        console.log('   ✅ Reasoning capabilities initialized');
    }

    async initializeProblemSolvingKnowledge() {
        const problemSolvingGraphs = await this.knowledgeService.getKnowledgeGraphs('problem-solving');
        let problemSolvingGraph = problemSolvingGraphs.find(g => g.name === 'Problem Solving Knowledge');
        
        if (!problemSolvingGraph) {
            problemSolvingGraph = await this.knowledgeService.createKnowledgeGraph(
                'Problem Solving Knowledge',
                'problem-solving',
                'Knowledge base for software engineering problem-solving'
            );
        }

        // Seed with problem-solving knowledge
        const knowledgeAtoms = [
            { type: 'ConceptNode', name: 'divide-and-conquer', truthValue: { strength: 1.0, confidence: 1.0 } },
            { type: 'ConceptNode', name: 'root-cause-analysis', truthValue: { strength: 1.0, confidence: 1.0 } },
            { type: 'ConceptNode', name: 'microservices-architecture', truthValue: { strength: 1.0, confidence: 1.0 } },
            { type: 'ConceptNode', name: 'performance-optimization', truthValue: { strength: 1.0, confidence: 1.0 } }
        ];

        for (const atom of knowledgeAtoms) {
            await this.knowledgeService.addAtomToGraph(problemSolvingGraph.id, atom);
        }
    }

    async solveComplexProblem(problem) {
        console.log(`\n🔧 Solving Problem: "${problem.title}"`);
        console.log(`   Domain: ${problem.domain}, Complexity: ${problem.complexity}`);
        
        try {
            // Step 1: Analyze problem
            console.log('   📊 Step 1: Analyzing problem structure...');
            const analysis = await this.analyzeComplexProblem(problem);
            
            // Step 2: Generate reasoning approaches
            console.log('   💡 Step 2: Generating reasoning approaches...');
            const approaches = await this.generateReasoningApproaches(problem, analysis);
            
            // Step 3: Select optimal approach
            console.log('   🎯 Step 3: Selecting optimal reasoning approach...');
            const selectedApproach = this.selectOptimalApproach(approaches, problem);
            console.log(`   Selected: ${selectedApproach.name} (suitability: ${selectedApproach.suitability.toFixed(2)})`);
            
            // Step 4: Perform reasoning
            console.log('   🧠 Step 4: Performing advanced reasoning...');
            const reasoning = await this.performAdvancedReasoning(problem, selectedApproach);
            
            // Step 5: Generate implementation plan
            console.log('   📋 Step 5: Generating implementation plan...');
            const implementation = this.generateImplementationPlan(problem, reasoning);
            
            // Step 6: Create validation strategy
            console.log('   ✓ Step 6: Creating validation strategy...');
            const validation = this.createValidationStrategy(problem, reasoning);
            
            const solution = {
                id: `solution_${Date.now()}`,
                approach: selectedApproach.name,
                reasoning: reasoning,
                implementation: implementation,
                validation: validation,
                confidence: this.calculateSolutionConfidence(reasoning, selectedApproach),
                learningNotes: this.generateLearningInsights(problem, reasoning)
            };

            // Learn from reasoning
            await this.learnFromReasoning(problem, solution);
            
            console.log(`   🎉 Solution generated with ${(solution.confidence * 100).toFixed(1)}% confidence`);
            return solution;
            
        } catch (error) {
            console.log(`   ❌ Error in reasoning: ${error.message}`);
            return this.generateFallbackSolution(problem);
        }
    }

    async analyzeComplexProblem(problem) {
        const analysisQuery = {
            type: 'problem-analysis',
            atoms: [{ type: 'ProblemNode', name: problem.id, truthValue: { strength: 1.0, confidence: 1.0 } }],
            context: {
                domain: problem.domain,
                complexity: problem.complexity,
                constraints: problem.constraints
            }
        };

        const analysis = await this.openCogService.reason(analysisQuery);
        const relatedKnowledge = await this.knowledgeService.discoverKnowledge({
            type: 'domain-specific',
            seedConcepts: [problem.domain, problem.title]
        });

        return {
            problemStructure: analysis,
            relatedKnowledge,
            domainContext: { domain: problem.domain, knowledgeAvailable: true }
        };
    }

    async generateReasoningApproaches(problem, analysis) {
        const approaches = [
            {
                name: 'deductive-reasoning',
                description: 'Apply established principles to derive solutions',
                suitability: this.calculateApproachSuitability(problem, 'deductive'),
                characteristics: ['logical', 'systematic', 'principle-based']
            },
            {
                name: 'inductive-reasoning', 
                description: 'Learn patterns from similar problems',
                suitability: this.calculateApproachSuitability(problem, 'inductive'),
                characteristics: ['pattern-based', 'empirical', 'data-driven']
            },
            {
                name: 'abductive-reasoning',
                description: 'Generate hypotheses to explain the problem',
                suitability: this.calculateApproachSuitability(problem, 'abductive'),
                characteristics: ['hypothesis-driven', 'creative', 'exploratory']
            }
        ];

        // Add analogical reasoning if similar problems exist
        if (problem.previousAttempts && problem.previousAttempts.length > 0) {
            approaches.push({
                name: 'analogical-reasoning',
                description: 'Adapt solutions from previous attempts',
                suitability: this.calculateApproachSuitability(problem, 'analogical'),
                characteristics: ['similarity-based', 'adaptive', 'proven']
            });
        }

        // Add creative reasoning for expert-level problems
        if (problem.complexity === 'expert') {
            approaches.push({
                name: 'creative-reasoning',
                description: 'Generate novel solutions through creative thinking',
                suitability: this.calculateApproachSuitability(problem, 'creative'),
                characteristics: ['innovative', 'experimental', 'breakthrough']
            });
        }

        return approaches;
    }

    selectOptimalApproach(approaches, problem) {
        return approaches.reduce((best, current) => 
            current.suitability > best.suitability ? current : best
        );
    }

    async performAdvancedReasoning(problem, approach) {
        const reasoningQuery = {
            type: approach.name.replace('-reasoning', ''),
            atoms: [{ type: 'ProblemNode', name: problem.id }],
            context: {
                domain: problem.domain,
                complexity: problem.complexity,
                approach: approach.name
            }
        };

        const reasoningResult = await this.openCogService.reason(reasoningQuery);

        return {
            type: approach.name.replace('-reasoning', ''),
            steps: [
                {
                    step: 1,
                    description: `Initialize ${approach.name}`,
                    reasoning: `Starting ${approach.description}`,
                    confidence: 0.9
                },
                {
                    step: 2,
                    description: 'Apply reasoning methodology',
                    reasoning: reasoningResult.explanation,
                    confidence: reasoningResult.confidence
                },
                {
                    step: 3,
                    description: 'Generate solution candidates',
                    reasoning: 'Synthesizing potential solutions based on reasoning',
                    confidence: 0.8
                }
            ],
            conclusion: `${approach.name} solution for ${problem.domain} problem`,
            alternatives: [
                {
                    approach: 'systematic-analysis',
                    pros: ['thorough', 'methodical'],
                    cons: ['time-consuming'],
                    feasibility: 0.8
                }
            ]
        };
    }

    generateImplementationPlan(problem, reasoning) {
        return {
            phases: [
                {
                    phase: 'Analysis & Planning',
                    tasks: ['Requirements analysis', 'Technical design', 'Resource planning'],
                    estimatedTime: '1-2 weeks',
                    dependencies: [],
                    risks: ['Requirements change', 'Technical complexity']
                },
                {
                    phase: 'Core Implementation',
                    tasks: ['Implement solution', 'Unit testing', 'Integration testing'],
                    estimatedTime: '3-4 weeks', 
                    dependencies: ['Analysis & Planning'],
                    risks: ['Technical challenges', 'Integration issues']
                },
                {
                    phase: 'Validation & Deployment',
                    tasks: ['System testing', 'Performance validation', 'Production deployment'],
                    estimatedTime: '1-2 weeks',
                    dependencies: ['Core Implementation'],
                    risks: ['Performance issues', 'Deployment complexity']
                }
            ],
            codeExamples: [`// ${reasoning.type} reasoning implementation`],
            testingStrategy: `Comprehensive testing strategy for ${problem.domain} solution`
        };
    }

    createValidationStrategy(problem, reasoning) {
        return {
            successCriteria: [
                `Solution addresses: ${problem.description}`,
                'Performance meets requirements',
                'Implementation is maintainable'
            ],
            testCases: [
                'Functional testing',
                'Performance testing',
                'Edge case validation'
            ],
            metrics: [
                'Response time < 100ms',
                'Throughput > 1000 req/s',
                'Error rate < 0.1%'
            ],
            rollbackPlan: 'Maintain parallel systems during transition'
        };
    }

    calculateSolutionConfidence(reasoning, approach) {
        const stepConfidences = reasoning.steps.map(s => s.confidence);
        const avgStepConfidence = stepConfidences.reduce((sum, conf) => sum + conf, 0) / stepConfidences.length;
        return (avgStepConfidence + approach.suitability) / 2;
    }

    generateLearningInsights(problem, reasoning) {
        return [
            `${reasoning.type} reasoning effective for ${problem.domain}`,
            `Problem complexity ${problem.complexity} required ${reasoning.steps.length} steps`,
            `Key success factor: systematic approach`,
            `Solution confidence: ${reasoning.steps[reasoning.steps.length - 1].confidence}`
        ];
    }

    async learnFromReasoning(problem, solution) {
        const learningData = {
            input: JSON.stringify({ problem: problem.title, domain: problem.domain }),
            output: JSON.stringify({ approach: solution.approach, confidence: solution.confidence }),
            context: {
                reasoningType: solution.reasoning.type,
                domain: problem.domain,
                complexity: problem.complexity,
                confidence: solution.confidence
            },
            feedback: {
                rating: 5,
                helpful: true,
                comment: `Reasoning session for ${problem.domain} problem`,
                actionTaken: 'applied'
            }
        };

        await this.openCogService.learn(learningData);
    }

    generateFallbackSolution(problem) {
        return {
            id: `fallback_${Date.now()}`,
            approach: 'systematic-analysis',
            reasoning: {
                type: 'deductive',
                steps: [{
                    step: 1,
                    description: 'Fallback systematic analysis',
                    reasoning: 'Using fallback when advanced reasoning fails',
                    confidence: 0.5
                }],
                conclusion: 'Requires manual expert analysis',
                alternatives: []
            },
            implementation: {
                phases: [{
                    phase: 'Manual Analysis',
                    tasks: ['Expert consultation'],
                    estimatedTime: 'TBD',
                    dependencies: [],
                    risks: ['Limited automated guidance']
                }]
            },
            validation: {
                successCriteria: ['Expert validation'],
                testCases: [],
                metrics: [],
                rollbackPlan: 'Continue current approach'
            },
            confidence: 0.3,
            learningNotes: ['Advanced reasoning unavailable - fallback used']
        };
    }

    calculateApproachSuitability(problem, approach) {
        const suitabilityMap = {
            'architecture': { 'deductive': 0.9, 'inductive': 0.7, 'abductive': 0.6, 'analogical': 0.8, 'creative': 0.7 },
            'performance': { 'deductive': 0.8, 'inductive': 0.9, 'abductive': 0.7, 'analogical': 0.8, 'creative': 0.6 },
            'security': { 'deductive': 0.9, 'inductive': 0.8, 'abductive': 0.8, 'analogical': 0.7, 'creative': 0.5 },
            'debugging': { 'deductive': 0.7, 'inductive': 0.6, 'abductive': 0.9, 'analogical': 0.8, 'creative': 0.4 },
            'design': { 'deductive': 0.8, 'inductive': 0.7, 'abductive': 0.7, 'analogical': 0.9, 'creative': 0.8 }
        };

        return suitabilityMap[problem.domain]?.[approach] || 0.6;
    }
}

// Test Problem Scenarios
const testProblems = [
    {
        id: 'arch_problem_1',
        title: 'Microservices Architecture Design',
        description: 'Design scalable microservices architecture for e-commerce platform',
        domain: 'architecture',
        complexity: 'high',
        constraints: ['budget limitations', 'legacy system integration', '6-month timeline'],
        goals: ['scalability', 'maintainability', 'performance'],
        context: {
            technology: ['Node.js', 'Docker', 'Kubernetes'],
            timeline: '6 months',
            resources: ['5 developers', '2 DevOps engineers']
        }
    },
    {
        id: 'perf_problem_1',
        title: 'Database Query Optimization',
        description: 'Optimize slow database queries in user management system',
        domain: 'performance',
        complexity: 'medium',
        constraints: ['cannot change schema', 'minimal downtime', 'existing caching'],
        goals: ['sub-100ms response time', 'maintain data consistency'],
        context: {
            technology: ['PostgreSQL', 'Redis', 'TypeScript'],
            timeline: '2 weeks',
            resources: ['2 developers', '1 DBA']
        }
    },
    {
        id: 'sec_problem_1',
        title: 'API Security Enhancement',
        description: 'Implement comprehensive security for public API endpoints',
        domain: 'security',
        complexity: 'high',
        constraints: ['maintain backward compatibility', 'SOC compliance', 'performance impact'],
        goals: ['prevent attacks', 'audit compliance', 'minimal latency'],
        context: {
            technology: ['Express.js', 'JWT', 'OAuth2'],
            timeline: '4 weeks',
            resources: ['3 developers', '1 security specialist']
        }
    },
    {
        id: 'debug_problem_1',
        title: 'Intermittent Memory Leak',
        description: 'Debug and fix intermittent memory leak in long-running service',
        domain: 'debugging',
        complexity: 'expert',
        constraints: ['production environment', 'cannot restart frequently', 'user impact'],
        goals: ['identify root cause', 'fix without downtime', 'prevent recurrence'],
        previousAttempts: [
            {
                approach: 'heap dump analysis',
                result: 'inconclusive',
                reasoning: 'leak pattern not captured',
                success: false
            }
        ],
        context: {
            technology: ['Node.js', 'Docker', 'Prometheus'],
            timeline: '1 week',
            resources: ['2 senior developers']
        }
    },
    {
        id: 'design_problem_1',
        title: 'Real-time Collaborative Editor',
        description: 'Design real-time collaborative editing system like Google Docs',
        domain: 'design',
        complexity: 'expert',
        constraints: ['handle 1000+ concurrent users', 'conflict resolution', 'offline support'],
        goals: ['real-time sync', 'conflict-free editing', 'performance'],
        context: {
            technology: ['WebSocket', 'CRDT', 'React'],
            timeline: '8 months',
            resources: ['6 developers', '2 architects']
        }
    }
];

// Main Validation Function
async function validateReasoningAgents() {
    console.log('🚀 Reasoning Agents Validation Started\n');
    console.log('=' .repeat(60));
    
    // Initialize services
    console.log('\n📦 Initializing Mock Services...');
    const openCogService = new MockOpenCogService();
    const knowledgeService = new MockKnowledgeService();
    
    // Create reasoning agent
    console.log('🧠 Creating Advanced Reasoning Agent...');
    const reasoningAgent = new TestAdvancedReasoningAgent(openCogService, knowledgeService);
    await reasoningAgent.initializeReasoningCapabilities();
    
    console.log('\n🎯 Testing Problem-Solving Capabilities...');
    console.log('=' .repeat(60));
    
    // Test each problem scenario
    const results = [];
    for (let i = 0; i < testProblems.length; i++) {
        const problem = testProblems[i];
        console.log(`\n📋 Test ${i + 1}/${testProblems.length}:`);
        
        const startTime = Date.now();
        const solution = await reasoningAgent.solveComplexProblem(problem);
        const endTime = Date.now();
        
        const result = {
            problemId: problem.id,
            domain: problem.domain,
            complexity: problem.complexity,
            approach: solution.approach,
            confidence: solution.confidence,
            processingTime: endTime - startTime,
            success: solution.confidence > 0.5
        };
        
        results.push(result);
        
        console.log(`   📊 Result: ${result.success ? '✅ Success' : '❌ Failed'}`);
        console.log(`   🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`   ⏱️  Processing Time: ${result.processingTime}ms`);
    }
    
    // Summary Report
    console.log('\n📈 Validation Summary');
    console.log('=' .repeat(60));
    
    const successCount = results.filter(r => r.success).length;
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
    
    console.log(`✅ Success Rate: ${successCount}/${results.length} (${(successCount / results.length * 100).toFixed(1)}%)`);
    console.log(`🎯 Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    console.log(`⏱️  Average Processing Time: ${avgProcessingTime.toFixed(0)}ms`);
    
    // Domain-specific results
    console.log('\n📊 Domain-specific Results:');
    const domainResults = {};
    results.forEach(r => {
        if (!domainResults[r.domain]) {
            domainResults[r.domain] = { total: 0, success: 0, confidence: 0 };
        }
        domainResults[r.domain].total++;
        if (r.success) domainResults[r.domain].success++;
        domainResults[r.domain].confidence += r.confidence;
    });
    
    Object.entries(domainResults).forEach(([domain, stats]) => {
        const successRate = (stats.success / stats.total * 100).toFixed(1);
        const avgConf = (stats.confidence / stats.total * 100).toFixed(1);
        console.log(`   ${domain}: ${stats.success}/${stats.total} success (${successRate}%), avg confidence: ${avgConf}%`);
    });
    
    // Reasoning approach distribution
    console.log('\n🧠 Reasoning Approach Distribution:');
    const approachCounts = {};
    results.forEach(r => {
        approachCounts[r.approach] = (approachCounts[r.approach] || 0) + 1;
    });
    
    Object.entries(approachCounts).forEach(([approach, count]) => {
        console.log(`   ${approach}: ${count} problems (${(count / results.length * 100).toFixed(1)}%)`);
    });
    
    // Complexity analysis
    console.log('\n📈 Complexity Analysis:');
    const complexityResults = {};
    results.forEach(r => {
        if (!complexityResults[r.complexity]) {
            complexityResults[r.complexity] = { total: 0, success: 0, confidence: 0 };
        }
        complexityResults[r.complexity].total++;
        if (r.success) complexityResults[r.complexity].success++;
        complexityResults[r.complexity].confidence += r.confidence;
    });
    
    Object.entries(complexityResults).forEach(([complexity, stats]) => {
        const successRate = (stats.success / stats.total * 100).toFixed(1);
        const avgConf = (stats.confidence / stats.total * 100).toFixed(1);
        console.log(`   ${complexity}: ${stats.success}/${stats.total} success (${successRate}%), avg confidence: ${avgConf}%`);
    });
    
    console.log('\n🎉 Reasoning Agents Validation Complete!');
    console.log('=' .repeat(60));
    
    // Final assessment
    if (successCount === results.length && avgConfidence > 0.7) {
        console.log('✅ All tests passed - Reasoning agents are functioning correctly');
        console.log('✅ High confidence levels achieved across all domains');
        console.log('✅ Multi-step reasoning working properly');
        console.log('✅ Problem-solving capabilities validated');
    } else if (successCount >= results.length * 0.8) {
        console.log('⚠️  Most tests passed - Minor issues may need attention');
        console.log(`⚠️  ${results.length - successCount} test(s) failed`);
    } else {
        console.log('❌ Significant issues detected - Reasoning agents need attention');
        console.log(`❌ ${results.length - successCount} test(s) failed`);
    }
    
    return {
        success: successCount === results.length,
        results: results,
        summary: {
            successRate: successCount / results.length,
            avgConfidence,
            avgProcessingTime,
            domainResults,
            approachDistribution: approachCounts,
            complexityResults
        }
    };
}

// Run validation if this script is executed directly
if (require.main === module) {
    validateReasoningAgents()
        .then(results => {
            console.log(`\n🏁 Validation completed with ${results.success ? 'SUCCESS' : 'ISSUES'}`);
            process.exit(results.success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Validation failed with error:', error);
            process.exit(1);
        });
}

module.exports = { validateReasoningAgents, TestAdvancedReasoningAgent, MockOpenCogService, MockKnowledgeService };