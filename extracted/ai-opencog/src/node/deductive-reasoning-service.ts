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
    DeductiveReasoningService,
    CodeLogicResult,
    LogicIssue,
    ReasoningResult
} from '../common/reasoning-services';
import { PLNReasoningEngine } from './reasoning-engines';
import { ReasoningQuery, Atom } from '../common/opencog-types';

/**
 * Implementation of DeductiveReasoningService using OpenCog PLN reasoning
 */
@injectable()
export class DeductiveReasoningServiceImpl implements DeductiveReasoningService {
    
    constructor(
        @inject(PLNReasoningEngine) private readonly reasoningEngine: PLNReasoningEngine
    ) {}

    async verifyCodeLogic(code: string): Promise<CodeLogicResult> {
        try {
            // Parse code into logical statements/atoms
            const atoms = this.parseCodeToAtoms(code);
            
            // Create deductive reasoning query
            const query: ReasoningQuery = {
                type: 'deductive',
                atoms,
                parameters: { 
                    verificationMode: true,
                    checkConsistency: true 
                }
            };
            
            // Perform deductive reasoning
            const result = await this.reasoningEngine.reason(query);
            
            // Analyze results for logic issues
            const issues = this.analyzeLogicIssues(code, result);
            const suggestions = this.generateSuggestions(issues, result);
            
            return {
                isValid: issues.length === 0,
                confidence: result.confidence,
                issues: issues.length > 0 ? issues : undefined,
                suggestions: suggestions.length > 0 ? suggestions : undefined
            };
        } catch (error) {
            return {
                isValid: false,
                confidence: 0,
                issues: [{
                    type: 'logical_error',
                    severity: 'high',
                    message: `Failed to verify code logic: ${error.message}`
                }]
            };
        }
    }

    async deduceConclusions(premises: any[]): Promise<ReasoningResult> {
        const atoms = premises.map(premise => this.convertToAtom(premise));
        
        const query: ReasoningQuery = {
            type: 'deductive',
            atoms,
            parameters: { deductionMode: 'strict' }
        };
        
        return await this.reasoningEngine.reason(query);
    }

    async checkConsistency(statements: any[]): Promise<{ isConsistent: boolean; conflicts?: any[] }> {
        const atoms = statements.map(stmt => this.convertToAtom(stmt));
        
        const query: ReasoningQuery = {
            type: 'deductive',
            atoms,
            parameters: { 
                consistencyCheck: true,
                findConflicts: true 
            }
        };
        
        const result = await this.reasoningEngine.reason(query);
        
        // Check for contradictions in conclusions
        const conflicts = this.findContradictions(result.conclusion || []);
        
        return {
            isConsistent: conflicts.length === 0,
            conflicts: conflicts.length > 0 ? conflicts : undefined
        };
    }

    /**
     * Parse code into logical atoms for reasoning
     */
    private parseCodeToAtoms(code: string): Atom[] {
        const atoms: Atom[] = [];
        
        // Simple code parsing - in practice would use AST parsing
        const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        for (const line of lines) {
            if (line.includes('if')) {
                atoms.push(this.createConditionalAtom(line));
            } else if (line.includes('return')) {
                atoms.push(this.createReturnAtom(line));
            } else if (line.includes('=') && !line.includes('==')) {
                atoms.push(this.createAssignmentAtom(line));
            }
        }
        
        return atoms;
    }

    /**
     * Create conditional atom from if statement
     */
    private createConditionalAtom(line: string): Atom {
        const condition = line.match(/if\s*\((.*?)\)/)?.[1] || 'unknown';
        
        return {
            type: 'ImplicationLink',
            name: `conditional_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            truthValue: { strength: 0.9, confidence: 0.8 },
            outgoing: [
                { 
                    type: 'EvaluationLink', 
                    name: 'condition',
                    outgoing: [{ type: 'ConceptNode', name: condition }]
                },
                { 
                    type: 'EvaluationLink', 
                    name: 'consequence',
                    outgoing: [{ type: 'ConceptNode', name: 'body_execution' }]
                }
            ]
        };
    }

    /**
     * Create return atom from return statement
     */
    private createReturnAtom(line: string): Atom {
        const returnValue = line.match(/return\s+(.*?);?$/)?.[1] || 'unknown';
        
        return {
            type: 'EvaluationLink',
            name: `return_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            truthValue: { strength: 1.0, confidence: 0.95 },
            outgoing: [
                { type: 'PredicateNode', name: 'returns' },
                { type: 'ConceptNode', name: returnValue }
            ]
        };
    }

    /**
     * Create assignment atom from assignment statement
     */
    private createAssignmentAtom(line: string): Atom {
        const parts = line.split('=').map(p => p.trim());
        if (parts.length >= 2) {
            return {
                type: 'EvaluationLink',
                name: `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                truthValue: { strength: 1.0, confidence: 0.9 },
                outgoing: [
                    { type: 'PredicateNode', name: 'assigns' },
                    { type: 'ListLink', outgoing: [
                        { type: 'VariableNode', name: parts[0] },
                        { type: 'ConceptNode', name: parts[1] }
                    ]}
                ]
            };
        }
        
        return {
            type: 'ConceptNode',
            name: 'unknown_assignment',
            truthValue: { strength: 0.1, confidence: 0.1 }
        };
    }

    /**
     * Convert generic premise to atom
     */
    private convertToAtom(premise: any): Atom {
        if (typeof premise === 'string') {
            return {
                type: 'ConceptNode',
                name: premise,
                truthValue: { strength: 0.8, confidence: 0.7 }
            };
        }
        
        if (premise.type && premise.name) {
            return premise as Atom;
        }
        
        return {
            type: 'ConceptNode',
            name: JSON.stringify(premise),
            truthValue: { strength: 0.5, confidence: 0.5 }
        };
    }

    /**
     * Analyze reasoning results for logic issues
     */
    private analyzeLogicIssues(code: string, result: ReasoningResult): LogicIssue[] {
        const issues: LogicIssue[] = [];
        
        // Check if confidence is too low (indicating potential issues)
        if (result.confidence < 0.5) {
            issues.push({
                type: 'logical_error',
                severity: 'medium',
                message: 'Low confidence in logical consistency - potential logic issues detected'
            });
        }
        
        // Check for contradictory conclusions
        const conclusions = result.conclusion || [];
        const contradictions = this.findContradictions(conclusions);
        
        for (const contradiction of contradictions) {
            issues.push({
                type: 'inconsistency',
                severity: 'high',
                message: `Logical inconsistency detected: ${contradiction.description}`
            });
        }
        
        // Check for unreachable code patterns
        if (code.includes('return') && code.indexOf('return') < code.lastIndexOf(';')) {
            const returnIndex = code.indexOf('return');
            const lines = code.substring(0, returnIndex).split('\n');
            issues.push({
                type: 'unreachable_code',
                severity: 'medium',
                message: 'Code after return statement may be unreachable',
                line: lines.length
            });
        }
        
        return issues;
    }

    /**
     * Find contradictions in atom set
     */
    private findContradictions(atoms: Atom[]): { atoms: Atom[]; description: string }[] {
        const contradictions: { atoms: Atom[]; description: string }[] = [];
        
        for (let i = 0; i < atoms.length; i++) {
            for (let j = i + 1; j < atoms.length; j++) {
                const atom1 = atoms[i];
                const atom2 = atoms[j];
                
                // Check for direct contradictions
                if (this.areContradictory(atom1, atom2)) {
                    contradictions.push({
                        atoms: [atom1, atom2],
                        description: `Atoms ${atom1.name} and ${atom2.name} are contradictory`
                    });
                }
            }
        }
        
        return contradictions;
    }

    /**
     * Check if two atoms are contradictory
     */
    private areContradictory(atom1: Atom, atom2: Atom): boolean {
        // Simple contradiction check - NotLink vs positive statement
        if (atom1.type === 'NotLink' && atom2.type !== 'NotLink') {
            return atom1.outgoing?.some(child => child.name === atom2.name) || false;
        }
        
        if (atom2.type === 'NotLink' && atom1.type !== 'NotLink') {
            return atom2.outgoing?.some(child => child.name === atom1.name) || false;
        }
        
        // Contradictory truth values
        if (atom1.name === atom2.name && atom1.truthValue && atom2.truthValue) {
            const strength1 = atom1.truthValue.strength;
            const strength2 = atom2.truthValue.strength;
            return Math.abs(strength1 - strength2) > 0.8;
        }
        
        return false;
    }

    /**
     * Generate suggestions based on issues and reasoning results
     */
    private generateSuggestions(issues: LogicIssue[], result: ReasoningResult): string[] {
        const suggestions: string[] = [];
        
        for (const issue of issues) {
            switch (issue.type) {
                case 'logical_error':
                    suggestions.push('Review logical flow and ensure all conditions are properly handled');
                    break;
                case 'inconsistency':
                    suggestions.push('Resolve contradictory statements or conditions');
                    break;
                case 'unreachable_code':
                    suggestions.push('Remove or restructure unreachable code after return statements');
                    break;
                case 'missing_condition':
                    suggestions.push('Add missing conditional checks to improve robustness');
                    break;
            }
        }
        
        // Add general suggestions based on confidence
        if (result.confidence < 0.7) {
            suggestions.push('Consider adding more explicit logical conditions and error handling');
        }
        
        return [...new Set(suggestions)]; // Remove duplicates
    }
}