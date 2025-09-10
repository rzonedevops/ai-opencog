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
import {
    AbductiveReasoningService,
    HypothesisGenerationInput,
    GeneratedHypothesis
} from '../common/reasoning-services';
import { PLNReasoningEngine } from './reasoning-engines';
import { ReasoningQuery, Atom } from '../common/opencog-types';

/**
 * Implementation of AbductiveReasoningService using OpenCog PLN reasoning
 */
@injectable()
export class AbductiveReasoningServiceImpl implements AbductiveReasoningService {
    
    constructor(
        @inject(PLNReasoningEngine) private readonly reasoningEngine: PLNReasoningEngine
    ) {}

    async generateBugHypotheses(symptoms: any[]): Promise<GeneratedHypothesis[]> {
        try {
            // Convert symptoms to atoms for abductive reasoning
            const symptomAtoms = symptoms.map(symptom => this.convertSymptomToAtom(symptom));
            
            const query: ReasoningQuery = {
                type: 'abductive',
                atoms: symptomAtoms,
                parameters: {
                    domain: 'debugging',
                    maxHypotheses: 10,
                    includeCommonBugs: true
                }
            };
            
            const result = await this.reasoningEngine.reason(query);
            
            // Convert reasoning results to bug hypotheses
            return this.extractBugHypotheses(result.conclusion || [], symptoms);
        } catch (error) {
            return [{
                hypothesis: `Failed to generate bug hypotheses: ${error.message}`,
                plausibility: 0,
                evidence: [],
                testableConditions: []
            }];
        }
    }

    async suggestCreativeSolutions(problem: string, constraints?: any[]): Promise<{ solutions: string[]; creativity: number }> {
        try {
            // Create problem atom and constraint atoms
            const problemAtom = this.createProblemAtom(problem);
            const constraintAtoms = (constraints || []).map(c => this.createConstraintAtom(c));
            
            const query: ReasoningQuery = {
                type: 'abductive',
                atoms: [problemAtom, ...constraintAtoms],
                parameters: {
                    creativityMode: true,
                    diversitySeeking: true,
                    analogicalReasoning: true
                }
            };
            
            const result = await this.reasoningEngine.reason(query);
            
            // Extract creative solutions from hypotheses
            const solutions = this.extractCreativeSolutions(result.conclusion || [], problem);
            const creativity = this.calculateCreativityScore(solutions, problem);
            
            return { solutions, creativity };
        } catch (error) {
            return {
                solutions: [`Consider breaking down the problem: ${problem}`],
                creativity: 0.1
            };
        }
    }

    async proposeArchitectureOptimizations(architecture: any): Promise<{ optimizations: any[]; impact: number }> {
        try {
            // Convert architecture to atoms
            const archAtoms = this.convertArchitectureToAtoms(architecture);
            
            const query: ReasoningQuery = {
                type: 'abductive',
                atoms: archAtoms,
                parameters: {
                    domain: 'architecture',
                    optimizationFocus: ['performance', 'maintainability', 'scalability'],
                    considerPatterns: true
                }
            };
            
            const result = await this.reasoningEngine.reason(query);
            
            // Extract optimization proposals
            const optimizations = this.extractArchitectureOptimizations(result.conclusion || [], architecture);
            const impact = this.calculateOptimizationImpact(optimizations);
            
            return { optimizations, impact };
        } catch (error) {
            return {
                optimizations: [],
                impact: 0
            };
        }
    }

    /**
     * Convert symptom to atom for reasoning
     */
    private convertSymptomToAtom(symptom: any): Atom {
        const symptomDescription = typeof symptom === 'string' ? symptom : JSON.stringify(symptom);
        
        return {
            type: 'EvaluationLink',
            name: `symptom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            truthValue: { strength: 0.9, confidence: 0.8 },
            outgoing: [
                { type: 'PredicateNode', name: 'exhibits_symptom' },
                { type: 'ConceptNode', name: symptomDescription }
            ],
            metadata: { symptom }
        };
    }

    /**
     * Extract bug hypotheses from reasoning conclusions
     */
    private extractBugHypotheses(conclusions: Atom[], symptoms: any[]): GeneratedHypothesis[] {
        const hypotheses: GeneratedHypothesis[] = [];
        
        for (const conclusion of conclusions) {
            const hypothesis = this.conclusionToBugHypothesis(conclusion, symptoms);
            if (hypothesis) {
                hypotheses.push(hypothesis);
            }
        }
        
        // Add common bug pattern hypotheses if few were generated
        if (hypotheses.length < 3) {
            hypotheses.push(...this.generateCommonBugHypotheses(symptoms));
        }
        
        // Sort by plausibility
        return hypotheses.sort((a, b) => b.plausibility - a.plausibility);
    }

    /**
     * Convert reasoning conclusion to bug hypothesis
     */
    private conclusionToBugHypothesis(conclusion: Atom, symptoms: any[]): GeneratedHypothesis | null {
        const plausibility = conclusion.truthValue?.strength || 0.5;
        
        // Generate hypothesis based on conclusion type and content
        let hypothesis: string;
        let evidence: string[] = [];
        let testableConditions: string[] = [];
        
        switch (conclusion.type) {
            case 'ImplicationLink':
                hypothesis = this.extractImplicationHypothesis(conclusion);
                evidence = this.extractImplicationEvidence(conclusion, symptoms);
                testableConditions = this.generateTestConditionsForImplication(conclusion);
                break;
            
            case 'EvaluationLink':
                hypothesis = this.extractEvaluationHypothesis(conclusion);
                evidence = symptoms.map(s => typeof s === 'string' ? s : JSON.stringify(s));
                testableConditions = this.generateTestConditionsForEvaluation(conclusion);
                break;
            
            default:
                hypothesis = `Potential issue related to ${conclusion.name || conclusion.type}`;
                evidence = [`Pattern detected in ${conclusion.type} structure`];
                testableConditions = [`Check ${conclusion.name} configuration`];
        }
        
        return {
            hypothesis,
            plausibility,
            evidence,
            testableConditions
        };
    }

    /**
     * Extract hypothesis from ImplicationLink
     */
    private extractImplicationHypothesis(conclusion: Atom): string {
        const antecedent = conclusion.outgoing?.[0]?.name || 'condition';
        const consequent = conclusion.outgoing?.[1]?.name || 'result';
        
        return `Bug likely caused by ${antecedent}, leading to ${consequent}`;
    }

    /**
     * Extract evidence from ImplicationLink
     */
    private extractImplicationEvidence(conclusion: Atom, symptoms: any[]): string[] {
        const evidence: string[] = [];
        const antecedent = conclusion.outgoing?.[0]?.name || '';
        
        // Look for related symptoms
        for (const symptom of symptoms) {
            const symptomStr = typeof symptom === 'string' ? symptom : JSON.stringify(symptom);
            if (symptomStr.toLowerCase().includes(antecedent.toLowerCase())) {
                evidence.push(`Symptom matches pattern: ${symptomStr}`);
            }
        }
        
        if (evidence.length === 0) {
            evidence.push(`Logical pattern suggests ${antecedent} as root cause`);
        }
        
        return evidence;
    }

    /**
     * Generate test conditions for ImplicationLink
     */
    private generateTestConditionsForImplication(conclusion: Atom): string[] {
        const antecedent = conclusion.outgoing?.[0]?.name || 'condition';
        
        return [
            `Verify ${antecedent} behavior`,
            `Test edge cases related to ${antecedent}`,
            `Check logs for ${antecedent} related errors`,
            `Validate input/output for ${antecedent}`
        ];
    }

    /**
     * Extract hypothesis from EvaluationLink
     */
    private extractEvaluationHypothesis(conclusion: Atom): string {
        const predicate = conclusion.outgoing?.[0]?.name || 'predicate';
        const subject = conclusion.outgoing?.[1]?.name || 'subject';
        
        return `Issue likely in ${predicate} affecting ${subject}`;
    }

    /**
     * Generate test conditions for EvaluationLink
     */
    private generateTestConditionsForEvaluation(conclusion: Atom): string[] {
        const predicate = conclusion.outgoing?.[0]?.name || 'predicate';
        
        return [
            `Test ${predicate} functionality`,
            `Check ${predicate} configuration`,
            `Validate ${predicate} dependencies`,
            `Review ${predicate} recent changes`
        ];
    }

    /**
     * Generate common bug pattern hypotheses
     */
    private generateCommonBugHypotheses(symptoms: any[]): GeneratedHypothesis[] {
        return [
            {
                hypothesis: 'Null pointer or undefined variable access',
                plausibility: 0.7,
                evidence: ['Common cause of runtime errors'],
                testableConditions: ['Check for null/undefined values', 'Add null checks', 'Review variable initialization']
            },
            {
                hypothesis: 'Race condition or timing issue',
                plausibility: 0.6,
                evidence: ['Intermittent behavior suggests timing issues'],
                testableConditions: ['Add synchronization', 'Test with delays', 'Check async/await usage']
            },
            {
                hypothesis: 'Memory leak or resource exhaustion',
                plausibility: 0.5,
                evidence: ['Performance degradation over time'],
                testableConditions: ['Monitor memory usage', 'Check for resource cleanup', 'Profile application']
            }
        ];
    }

    /**
     * Create problem atom
     */
    private createProblemAtom(problem: string): Atom {
        return {
            type: 'EvaluationLink',
            name: 'problem_definition',
            truthValue: { strength: 1.0, confidence: 0.9 },
            outgoing: [
                { type: 'PredicateNode', name: 'problem' },
                { type: 'ConceptNode', name: problem }
            ],
            metadata: { problemDescription: problem }
        };
    }

    /**
     * Create constraint atom
     */
    private createConstraintAtom(constraint: any): Atom {
        const constraintStr = typeof constraint === 'string' ? constraint : JSON.stringify(constraint);
        
        return {
            type: 'EvaluationLink',
            name: 'constraint',
            truthValue: { strength: 0.8, confidence: 0.8 },
            outgoing: [
                { type: 'PredicateNode', name: 'constraint' },
                { type: 'ConceptNode', name: constraintStr }
            ],
            metadata: { constraint }
        };
    }

    /**
     * Extract creative solutions from conclusions
     */
    private extractCreativeSolutions(conclusions: Atom[], problem: string): string[] {
        const solutions: string[] = [];
        
        for (const conclusion of conclusions) {
            const solution = this.conclusionToSolution(conclusion, problem);
            if (solution) {
                solutions.push(solution);
            }
        }
        
        // Add fallback creative solutions if none generated
        if (solutions.length === 0) {
            solutions.push(...this.generateFallbackSolutions(problem));
        }
        
        return solutions;
    }

    /**
     * Convert conclusion to solution
     */
    private conclusionToSolution(conclusion: Atom, problem: string): string | null {
        switch (conclusion.type) {
            case 'ImplicationLink':
                const action = conclusion.outgoing?.[1]?.name || 'action';
                return `Consider ${action} to address the problem`;
                
            case 'EvaluationLink':
                const predicate = conclusion.outgoing?.[0]?.name || 'approach';
                return `Try ${predicate} approach for this problem`;
                
            case 'ConceptNode':
                return `Explore ${conclusion.name} as a potential solution`;
                
            default:
                return null;
        }
    }

    /**
     * Generate fallback creative solutions
     */
    private generateFallbackSolutions(problem: string): string[] {
        return [
            'Break down the problem into smaller, manageable components',
            'Consider alternative approaches or paradigms',
            'Look for analogous problems in different domains',
            'Combine existing solutions in novel ways',
            'Question fundamental assumptions about the problem'
        ];
    }

    /**
     * Calculate creativity score for solutions
     */
    private calculateCreativityScore(solutions: string[], problem: string): number {
        if (solutions.length === 0) return 0;
        
        // Factors: uniqueness, diversity, unconventional thinking
        const uniqueWords = new Set(solutions.join(' ').toLowerCase().split(' ')).size;
        const diversity = solutions.length > 1 ? solutions.length / 10 : 0.1;
        const unconventional = solutions.filter(s => 
            s.includes('alternative') || s.includes('novel') || s.includes('creative')
        ).length / solutions.length;
        
        return Math.min(1.0, (uniqueWords / 50) * 0.4 + diversity * 0.3 + unconventional * 0.3);
    }

    /**
     * Convert architecture to atoms
     */
    private convertArchitectureToAtoms(architecture: any): Atom[] {
        const atoms: Atom[] = [];
        
        if (typeof architecture === 'object' && architecture !== null) {
            // Extract components
            if (architecture.components) {
                for (const component of architecture.components) {
                    atoms.push(this.createComponentAtom(component));
                }
            }
            
            // Extract connections
            if (architecture.connections) {
                for (const connection of architecture.connections) {
                    atoms.push(this.createConnectionAtom(connection));
                }
            }
            
            // Extract patterns
            if (architecture.patterns) {
                for (const pattern of architecture.patterns) {
                    atoms.push(this.createPatternAtom(pattern));
                }
            }
        } else {
            // Fallback: create generic architecture atom
            atoms.push({
                type: 'ConceptNode',
                name: 'architecture',
                truthValue: { strength: 0.7, confidence: 0.7 },
                metadata: { architecture }
            });
        }
        
        return atoms;
    }

    /**
     * Create component atom
     */
    private createComponentAtom(component: any): Atom {
        const componentName = component.name || component.type || 'component';
        
        return {
            type: 'EvaluationLink',
            name: `component_${componentName}`,
            truthValue: { strength: 0.8, confidence: 0.8 },
            outgoing: [
                { type: 'PredicateNode', name: 'is_component' },
                { type: 'ConceptNode', name: componentName }
            ],
            metadata: { component }
        };
    }

    /**
     * Create connection atom
     */
    private createConnectionAtom(connection: any): Atom {
        return {
            type: 'ImplicationLink',
            name: 'component_connection',
            truthValue: { strength: 0.7, confidence: 0.7 },
            outgoing: [
                { type: 'ConceptNode', name: connection.from || 'source' },
                { type: 'ConceptNode', name: connection.to || 'target' }
            ],
            metadata: { connection }
        };
    }

    /**
     * Create pattern atom
     */
    private createPatternAtom(pattern: any): Atom {
        const patternName = pattern.name || pattern.type || 'pattern';
        
        return {
            type: 'EvaluationLink',
            name: `pattern_${patternName}`,
            truthValue: { strength: 0.9, confidence: 0.8 },
            outgoing: [
                { type: 'PredicateNode', name: 'uses_pattern' },
                { type: 'ConceptNode', name: patternName }
            ],
            metadata: { pattern }
        };
    }

    /**
     * Extract architecture optimizations
     */
    private extractArchitectureOptimizations(conclusions: Atom[], architecture: any): any[] {
        const optimizations: any[] = [];
        
        for (const conclusion of conclusions) {
            const optimization = this.conclusionToOptimization(conclusion);
            if (optimization) {
                optimizations.push(optimization);
            }
        }
        
        // Add common architectural optimizations if none found
        if (optimizations.length === 0) {
            optimizations.push(...this.generateCommonOptimizations());
        }
        
        return optimizations;
    }

    /**
     * Convert conclusion to optimization
     */
    private conclusionToOptimization(conclusion: Atom): any | null {
        const confidence = conclusion.truthValue?.confidence || 0.5;
        
        switch (conclusion.type) {
            case 'ImplicationLink':
                return {
                    type: 'structural',
                    description: `Optimize relationship between ${conclusion.outgoing?.[0]?.name} and ${conclusion.outgoing?.[1]?.name}`,
                    confidence,
                    implementation: 'Review component coupling and dependencies'
                };
                
            case 'EvaluationLink':
                const predicate = conclusion.outgoing?.[0]?.name;
                return {
                    type: 'component',
                    description: `Optimize ${predicate} implementation`,
                    confidence,
                    implementation: `Review and refactor ${predicate} for better performance`
                };
                
            default:
                return null;
        }
    }

    /**
     * Generate common architectural optimizations
     */
    private generateCommonOptimizations(): any[] {
        return [
            {
                type: 'performance',
                description: 'Implement caching strategy',
                confidence: 0.8,
                implementation: 'Add caching layer for frequently accessed data'
            },
            {
                type: 'maintainability',
                description: 'Improve component separation',
                confidence: 0.7,
                implementation: 'Refactor tightly coupled components into separate modules'
            },
            {
                type: 'scalability',
                description: 'Consider microservices architecture',
                confidence: 0.6,
                implementation: 'Break monolithic components into smaller services'
            }
        ];
    }

    /**
     * Calculate optimization impact
     */
    private calculateOptimizationImpact(optimizations: any[]): number {
        if (optimizations.length === 0) return 0;
        
        const avgConfidence = optimizations.reduce((sum, opt) => 
            sum + (opt.confidence || 0.5), 0
        ) / optimizations.length;
        
        const diversity = new Set(optimizations.map(opt => opt.type)).size / 5; // Normalize by max types
        
        return Math.min(1.0, avgConfidence * 0.7 + diversity * 0.3);
    }
}