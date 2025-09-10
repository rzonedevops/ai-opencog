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
    InductiveReasoningService,
    PatternGeneralizationInput,
    PatternGeneralizationResult
} from '../common/reasoning-services';
import { PLNReasoningEngine } from './reasoning-engines';
import { ReasoningQuery, Atom } from '../common/opencog-types';

/**
 * Implementation of InductiveReasoningService using OpenCog PLN reasoning
 */
@injectable()
export class InductiveReasoningServiceImpl implements InductiveReasoningService {
    
    constructor(
        @inject(PLNReasoningEngine) private readonly reasoningEngine: PLNReasoningEngine
    ) {}

    async generalizeFromExamples(input: PatternGeneralizationInput): Promise<PatternGeneralizationResult> {
        try {
            // Convert examples to atoms for inductive reasoning
            const atoms = this.convertExamplesToAtoms(input.examples, input.context);
            
            const query: ReasoningQuery = {
                type: 'inductive',
                atoms,
                context: input.context,
                parameters: {
                    domain: input.domain,
                    generalizationLevel: 'moderate'
                }
            };
            
            const result = await this.reasoningEngine.reason(query);
            
            // Extract the most promising pattern
            const pattern = this.extractBestPattern(result.conclusion || []);
            const applicableScenarios = this.identifyApplicableScenarios(pattern, input);
            
            return {
                pattern,
                confidence: result.confidence,
                generalizationStrength: this.calculateGeneralizationStrength(pattern, input.examples),
                applicableScenarios
            };
        } catch (error) {
            return {
                pattern: null,
                confidence: 0,
                generalizationStrength: 0,
                applicableScenarios: []
            };
        }
    }

    async generateCodeFromPatterns(patterns: any[], context?: string): Promise<{ code: string; confidence: number }> {
        try {
            // Convert patterns to atoms
            const patternAtoms = patterns.map(p => this.convertPatternToAtom(p));
            
            const query: ReasoningQuery = {
                type: 'inductive',
                atoms: patternAtoms,
                context,
                parameters: {
                    codeGeneration: true,
                    targetLanguage: this.detectLanguage(context)
                }
            };
            
            const result = await this.reasoningEngine.reason(query);
            
            // Generate code from reasoning result
            const code = this.synthesizeCodeFromAtoms(result.conclusion || [], context);
            
            return {
                code,
                confidence: result.confidence
            };
        } catch (error) {
            return {
                code: `// Error generating code: ${error.message}`,
                confidence: 0
            };
        }
    }

    async identifyBestPractices(examples: any[]): Promise<{ practices: string[]; confidence: number }> {
        try {
            // Convert examples to evaluation atoms
            const atoms = examples.map(example => this.convertExampleToEvaluationAtom(example));
            
            const query: ReasoningQuery = {
                type: 'inductive',
                atoms,
                parameters: {
                    practiceIdentification: true,
                    qualityThreshold: 0.7
                }
            };
            
            const result = await this.reasoningEngine.reason(query);
            
            // Extract best practices from patterns
            const practices = this.extractBestPractices(result.conclusion || []);
            
            return {
                practices,
                confidence: result.confidence
            };
        } catch (error) {
            return {
                practices: [],
                confidence: 0
            };
        }
    }

    /**
     * Convert examples to atoms for inductive reasoning
     */
    private convertExamplesToAtoms(examples: any[], context?: string): Atom[] {
        const atoms: Atom[] = [];
        
        for (let i = 0; i < examples.length; i++) {
            const example = examples[i];
            
            if (typeof example === 'string') {
                // Code example
                atoms.push(this.createCodeExampleAtom(example, i));
            } else if (example.input && example.output) {
                // Input-output pair
                atoms.push(this.createIOPairAtom(example.input, example.output, i));
            } else {
                // Generic example
                atoms.push(this.createGenericExampleAtom(example, i));
            }
        }
        
        return atoms;
    }

    /**
     * Create atom from code example
     */
    private createCodeExampleAtom(code: string, index: number): Atom {
        return {
            type: 'EvaluationLink',
            name: `code_example_${index}`,
            truthValue: { strength: 0.8, confidence: 0.8 },
            outgoing: [
                { type: 'PredicateNode', name: 'code_example' },
                { type: 'ConceptNode', name: code.substring(0, 100) } // Truncate for atom name
            ],
            metadata: {
                fullCode: code,
                exampleIndex: index
            }
        };
    }

    /**
     * Create atom from input-output pair
     */
    private createIOPairAtom(input: any, output: any, index: number): Atom {
        return {
            type: 'ImplicationLink',
            name: `io_pair_${index}`,
            truthValue: { strength: 0.9, confidence: 0.85 },
            outgoing: [
                { type: 'ConceptNode', name: JSON.stringify(input) },
                { type: 'ConceptNode', name: JSON.stringify(output) }
            ],
            metadata: {
                input,
                output,
                exampleIndex: index
            }
        };
    }

    /**
     * Create atom from generic example
     */
    private createGenericExampleAtom(example: any, index: number): Atom {
        return {
            type: 'ConceptNode',
            name: `example_${index}`,
            truthValue: { strength: 0.7, confidence: 0.7 },
            metadata: {
                example,
                exampleIndex: index
            }
        };
    }

    /**
     * Extract the best pattern from reasoning conclusions
     */
    private extractBestPattern(conclusions: Atom[]): any {
        if (conclusions.length === 0) {
            return null;
        }
        
        // Find pattern with highest confidence
        let bestPattern = conclusions[0];
        let bestScore = this.calculatePatternScore(bestPattern);
        
        for (const conclusion of conclusions) {
            const score = this.calculatePatternScore(conclusion);
            if (score > bestScore) {
                bestPattern = conclusion;
                bestScore = score;
            }
        }
        
        return this.atomToPattern(bestPattern);
    }

    /**
     * Calculate pattern quality score
     */
    private calculatePatternScore(atom: Atom): number {
        const strength = atom.truthValue?.strength || 0;
        const confidence = atom.truthValue?.confidence || 0;
        const complexity = atom.outgoing?.length || 0;
        
        // Balance between strength, confidence, and complexity
        return (strength * 0.4) + (confidence * 0.4) + Math.min(complexity / 5, 0.2);
    }

    /**
     * Convert atom to pattern representation
     */
    private atomToPattern(atom: Atom): any {
        return {
            type: atom.type,
            name: atom.name,
            structure: this.extractStructure(atom),
            confidence: atom.truthValue?.confidence || 0,
            metadata: atom.metadata
        };
    }

    /**
     * Extract structural information from atom
     */
    private extractStructure(atom: Atom): any {
        if (!atom.outgoing || atom.outgoing.length === 0) {
            return null;
        }
        
        return atom.outgoing.map(child => ({
            type: child.type,
            name: child.name,
            hasChildren: (child.outgoing?.length || 0) > 0
        }));
    }

    /**
     * Identify scenarios where pattern is applicable
     */
    private identifyApplicableScenarios(pattern: any, input: PatternGeneralizationInput): string[] {
        const scenarios: string[] = [];
        
        if (!pattern) {
            return scenarios;
        }
        
        // Based on pattern structure and input context
        if (input.domain) {
            scenarios.push(`${input.domain} domain applications`);
        }
        
        if (input.context) {
            if (input.context.includes('class') || input.context.includes('object')) {
                scenarios.push('Object-oriented programming contexts');
            }
            if (input.context.includes('function') || input.context.includes('method')) {
                scenarios.push('Function definition patterns');
            }
            if (input.context.includes('async') || input.context.includes('promise')) {
                scenarios.push('Asynchronous programming patterns');
            }
        }
        
        // Based on pattern complexity
        const complexity = pattern.structure?.length || 0;
        if (complexity > 3) {
            scenarios.push('Complex logic scenarios');
        } else if (complexity <= 2) {
            scenarios.push('Simple, reusable patterns');
        }
        
        return scenarios;
    }

    /**
     * Calculate generalization strength
     */
    private calculateGeneralizationStrength(pattern: any, examples: any[]): number {
        if (!pattern || examples.length === 0) {
            return 0;
        }
        
        // How well does the pattern generalize across examples?
        const applicableExamples = examples.filter(example => 
            this.patternAppliesTo(pattern, example)
        ).length;
        
        const coverage = applicableExamples / examples.length;
        const complexity = Math.min((pattern.structure?.length || 0) / 5, 1);
        
        // Higher coverage and moderate complexity indicate better generalization
        return (coverage * 0.7) + ((1 - complexity) * 0.3);
    }

    /**
     * Check if pattern applies to example
     */
    private patternAppliesTo(pattern: any, example: any): boolean {
        // Simple heuristic - in practice would be more sophisticated
        if (typeof example === 'string' && pattern.name) {
            return example.toLowerCase().includes(pattern.name.toLowerCase().split('_')[0]);
        }
        
        return Math.random() > 0.3; // Placeholder - would implement proper matching
    }

    /**
     * Convert pattern to atom
     */
    private convertPatternToAtom(pattern: any): Atom {
        if (pattern.type && pattern.name) {
            return pattern as Atom;
        }
        
        return {
            type: 'ConceptNode',
            name: pattern.name || JSON.stringify(pattern),
            truthValue: { strength: 0.8, confidence: 0.7 },
            metadata: { pattern }
        };
    }

    /**
     * Detect programming language from context
     */
    private detectLanguage(context?: string): string {
        if (!context) return 'javascript';
        
        const ctx = context.toLowerCase();
        if (ctx.includes('typescript') || ctx.includes('.ts')) return 'typescript';
        if (ctx.includes('python') || ctx.includes('.py')) return 'python';
        if (ctx.includes('java') && !ctx.includes('javascript')) return 'java';
        if (ctx.includes('c++') || ctx.includes('.cpp')) return 'cpp';
        if (ctx.includes('c#') || ctx.includes('.cs')) return 'csharp';
        
        return 'javascript';
    }

    /**
     * Synthesize code from reasoning atoms
     */
    private synthesizeCodeFromAtoms(atoms: Atom[], context?: string): string {
        if (atoms.length === 0) {
            return '// No patterns found to generate code';
        }
        
        const language = this.detectLanguage(context);
        const codeBlocks: string[] = [];
        
        for (const atom of atoms) {
            const code = this.atomToCode(atom, language);
            if (code) {
                codeBlocks.push(code);
            }
        }
        
        return codeBlocks.join('\n\n');
    }

    /**
     * Convert atom to code representation
     */
    private atomToCode(atom: Atom, language: string): string {
        switch (atom.type) {
            case 'ImplicationLink':
                return this.generateConditionalCode(atom, language);
            case 'EvaluationLink':
                return this.generateEvaluationCode(atom, language);
            case 'ConceptNode':
                return this.generateConceptCode(atom, language);
            default:
                return `// Generated from ${atom.type}: ${atom.name}`;
        }
    }

    /**
     * Generate conditional code from ImplicationLink
     */
    private generateConditionalCode(atom: Atom, language: string): string {
        const condition = atom.outgoing?.[0]?.name || 'condition';
        const action = atom.outgoing?.[1]?.name || 'action';
        
        switch (language) {
            case 'typescript':
            case 'javascript':
                return `if (${condition}) {\n    ${action};\n}`;
            case 'python':
                return `if ${condition}:\n    ${action}`;
            default:
                return `if (${condition}) { ${action}; }`;
        }
    }

    /**
     * Generate evaluation code
     */
    private generateEvaluationCode(atom: Atom, language: string): string {
        const predicate = atom.outgoing?.[0]?.name || 'evaluate';
        const value = atom.outgoing?.[1]?.name || 'value';
        
        switch (language) {
            case 'typescript':
            case 'javascript':
                return `const result = ${predicate}(${value});`;
            case 'python':
                return `result = ${predicate}(${value})`;
            default:
                return `${predicate}(${value})`;
        }
    }

    /**
     * Generate concept code
     */
    private generateConceptCode(atom: Atom, language: string): string {
        const name = atom.name || 'concept';
        
        switch (language) {
            case 'typescript':
            case 'javascript':
                return `// Concept: ${name}`;
            case 'python':
                return `# Concept: ${name}`;
            default:
                return `/* Concept: ${name} */`;
        }
    }

    /**
     * Convert example to evaluation atom
     */
    private convertExampleToEvaluationAtom(example: any): Atom {
        return {
            type: 'EvaluationLink',
            name: `practice_example_${Date.now()}`,
            truthValue: { strength: 0.8, confidence: 0.8 },
            outgoing: [
                { type: 'PredicateNode', name: 'good_practice' },
                { type: 'ConceptNode', name: JSON.stringify(example) }
            ],
            metadata: { example }
        };
    }

    /**
     * Extract best practices from atoms
     */
    private extractBestPractices(atoms: Atom[]): string[] {
        const practices: string[] = [];
        
        for (const atom of atoms) {
            const practice = this.atomToBestPractice(atom);
            if (practice) {
                practices.push(practice);
            }
        }
        
        return practices;
    }

    /**
     * Convert atom to best practice description
     */
    private atomToBestPractice(atom: Atom): string | null {
        if (atom.type === 'EvaluationLink' && atom.outgoing) {
            const predicate = atom.outgoing[0]?.name;
            
            switch (predicate) {
                case 'good_practice':
                    return 'Follow established coding patterns and conventions';
                case 'error_handling':
                    return 'Always include proper error handling in your code';
                case 'modularity':
                    return 'Break down complex functions into smaller, reusable modules';
                case 'documentation':
                    return 'Document your code with clear comments and type annotations';
                default:
                    return `Apply ${predicate} patterns consistently`;
            }
        }
        
        return null;
    }
}