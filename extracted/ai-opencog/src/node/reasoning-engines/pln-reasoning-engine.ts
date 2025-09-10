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

import { injectable } from '@theia/core/shared/inversify';
import { Atom, ReasoningQuery, ReasoningResult, TruthValue } from '../../common';

/**
 * Probabilistic Logic Networks (PLN) reasoning engine
 * Implements probabilistic inference using OpenCog's PLN framework
 */
@injectable()
export class PLNReasoningEngine {

    /**
     * Perform PLN-based reasoning on the given query
     */
    async reason(query: ReasoningQuery): Promise<ReasoningResult> {
        switch (query.type) {
            case 'deductive':
                return this.performDeductiveInference(query);
            case 'inductive':
                return this.performInductiveInference(query);
            case 'abductive':
                return this.performAbductiveInference(query);
            default:
                return this.performGeneralInference(query);
        }
    }

    /**
     * Deductive inference using PLN rules
     */
    private async performDeductiveInference(query: ReasoningQuery): Promise<ReasoningResult> {
        const atoms = query.atoms || [];
        const conclusions: Atom[] = [];

        // Apply modus ponens and other deductive rules
        for (const atom of atoms) {
            if (atom.type === 'ImplicationLink' && atom.outgoing?.length === 2) {
                const antecedent = atom.outgoing[0];
                const consequent = atom.outgoing[1];
                
                // Check if antecedent is true with sufficient confidence
                if (this.isAtomTrue(antecedent)) {
                    const inferredConsequent = this.applyModusPonens(antecedent, consequent, atom.truthValue);
                    if (inferredConsequent) {
                        conclusions.push(inferredConsequent);
                    }
                }
            }
        }

        // Calculate overall confidence based on inference strength
        const confidence = this.calculateInferenceConfidence(conclusions);

        return {
            conclusion: conclusions,
            confidence,
            explanation: `PLN deductive reasoning applied using ${conclusions.length} inference rules`,
            metadata: {
                reasoningType: 'pln-deductive',
                rulesApplied: this.extractAppliedRules(conclusions),
                inferenceSteps: conclusions.length
            }
        };
    }

    /**
     * Apply modus ponens rule
     */
    private applyModusPonens(antecedent: Atom, consequent: Atom, implicationTruth?: TruthValue): Atom | null {
        if (!antecedent.truthValue || !implicationTruth) {
            return null;
        }

        // Calculate truth value for consequent using PLN formula
        const strength = antecedent.truthValue.strength * implicationTruth.strength;
        const confidence = Math.min(antecedent.truthValue.confidence, implicationTruth.confidence) * 0.9;

        return {
            ...consequent,
            truthValue: { strength, confidence },
            id: `inferred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
    }

    /**
     * Check if an atom is considered true with sufficient confidence
     */
    private isAtomTrue(atom: Atom, threshold = 0.7): boolean {
        return atom.truthValue ? 
            atom.truthValue.strength > threshold && atom.truthValue.confidence > 0.5 : 
            false;
    }

    /**
     * Inductive inference using PLN
     */
    private async performInductiveInference(query: ReasoningQuery): Promise<ReasoningResult> {
        const atoms = query.atoms || [];
        const patterns: Atom[] = [];

        // Find patterns in the data using PLN inductive reasoning
        const observations = atoms.filter(atom => atom.type === 'EvaluationLink');
        const generalizations = this.findInductivePatterns(observations);

        patterns.push(...generalizations);

        const confidence = this.calculatePatternConfidence(patterns, observations);

        return {
            conclusion: patterns,
            confidence,
            explanation: `PLN inductive reasoning found ${patterns.length} generalizations from ${observations.length} observations`,
            metadata: {
                reasoningType: 'pln-inductive',
                observationCount: observations.length,
                patternCount: patterns.length,
                generalizationStrength: confidence
            }
        };
    }

    /**
     * Find inductive patterns in observations
     */
    private findInductivePatterns(observations: Atom[]): Atom[] {
        const patterns: Atom[] = [];
        
        // Group observations by predicate
        const predicateGroups = this.groupObservationsByPredicate(observations);
        
        for (const [predicate, obs] of predicateGroups.entries()) {
            if (obs.length >= 3) { // Need at least 3 observations for induction
                const pattern = this.extractInductivePattern(predicate, obs);
                if (pattern) {
                    patterns.push(pattern);
                }
            }
        }

        return patterns;
    }

    /**
     * Group observations by their predicate
     */
    private groupObservationsByPredicate(observations: Atom[]): Map<string, Atom[]> {
        const groups = new Map<string, Atom[]>();
        
        for (const obs of observations) {
            if (obs.outgoing && obs.outgoing.length > 0) {
                const predicate = obs.outgoing[0].name || obs.outgoing[0].type;
                if (!groups.has(predicate)) {
                    groups.set(predicate, []);
                }
                groups.get(predicate)!.push(obs);
            }
        }
        
        return groups;
    }

    /**
     * Extract inductive pattern from grouped observations
     */
    private extractInductivePattern(predicate: string, observations: Atom[]): Atom | null {
        // Calculate pattern strength based on consistency
        const totalObservations = observations.length;
        const positiveObservations = observations.filter(obs => 
            obs.truthValue && obs.truthValue.strength > 0.5
        ).length;
        
        const strength = positiveObservations / totalObservations;
        const confidence = Math.min(0.9, totalObservations / 10); // Higher confidence with more observations
        
        return {
            type: 'ImplicationLink',
            name: `pattern_${predicate}`,
            truthValue: { strength, confidence },
            outgoing: [
                { type: 'VariableNode', name: '$X' },
                { type: 'EvaluationLink', name: predicate, outgoing: [{ type: 'VariableNode', name: '$X' }] }
            ]
        };
    }

    /**
     * Abductive inference using PLN
     */
    private async performAbductiveInference(query: ReasoningQuery): Promise<ReasoningResult> {
        const atoms = query.atoms || [];
        const hypotheses: Atom[] = [];

        // Find the best explanations for observed facts
        const observations = atoms.filter(atom => atom.type === 'EvaluationLink');
        const possibleExplanations = this.generateAbductiveHypotheses(observations);

        // Rank hypotheses by plausibility using PLN
        const rankedHypotheses = this.rankHypothesesByPlausibility(possibleExplanations, observations);
        hypotheses.push(...rankedHypotheses.slice(0, 5)); // Take top 5 hypotheses

        const confidence = this.calculateAbductiveConfidence(hypotheses);

        return {
            conclusion: hypotheses,
            confidence,
            explanation: `PLN abductive reasoning generated ${hypotheses.length} plausible explanations`,
            metadata: {
                reasoningType: 'pln-abductive',
                hypothesesGenerated: possibleExplanations.length,
                topHypotheses: hypotheses.length,
                explanatoryPower: confidence
            }
        };
    }

    /**
     * General PLN inference for other reasoning types
     */
    private async performGeneralInference(query: ReasoningQuery): Promise<ReasoningResult> {
        const atoms = query.atoms || [];
        const results: Atom[] = [];

        // Apply general PLN inference rules
        for (const atom of atoms) {
            const inferences = this.applyGeneralPLNRules(atom);
            results.push(...inferences);
        }

        const confidence = this.calculateGeneralConfidence(results);

        return {
            conclusion: results,
            confidence,
            explanation: `General PLN reasoning applied to ${atoms.length} atoms`,
            metadata: {
                reasoningType: 'pln-general',
                inputAtoms: atoms.length,
                outputAtoms: results.length
            }
        };
    }

    /**
     * Generate abductive hypotheses
     */
    private generateAbductiveHypotheses(observations: Atom[]): Atom[] {
        const hypotheses: Atom[] = [];
        
        // Generate hypotheses based on common patterns and known rules
        for (const obs of observations) {
            const possibleCauses = this.generatePossibleCauses(obs);
            hypotheses.push(...possibleCauses);
        }
        
        return hypotheses;
    }

    /**
     * Generate possible causes for an observation
     */
    private generatePossibleCauses(observation: Atom): Atom[] {
        const causes: Atom[] = [];
        
        // Create simple causal hypotheses
        if (observation.outgoing && observation.outgoing.length > 0) {
            const predicate = observation.outgoing[0];
            
            // Generate hypothesis: "If X then observation"
            causes.push({
                type: 'ImplicationLink',
                name: `hypothesis_${predicate.name}_${Date.now()}`,
                truthValue: { strength: 0.5, confidence: 0.3 }, // Initial low confidence
                outgoing: [
                    { type: 'VariableNode', name: '$Cause' },
                    observation
                ]
            });
        }
        
        return causes;
    }

    /**
     * Rank hypotheses by plausibility
     */
    private rankHypothesesByPlausibility(hypotheses: Atom[], observations: Atom[]): Atom[] {
        return hypotheses.sort((a, b) => {
            const scoreA = this.calculateHypothesisScore(a, observations);
            const scoreB = this.calculateHypothesisScore(b, observations);
            return scoreB - scoreA; // Descending order
        });
    }

    /**
     * Calculate hypothesis plausibility score
     */
    private calculateHypothesisScore(hypothesis: Atom, observations: Atom[]): number {
        let score = 0;
        
        // Base score from truth value
        if (hypothesis.truthValue) {
            score += hypothesis.truthValue.strength * hypothesis.truthValue.confidence;
        }
        
        // Bonus for explaining multiple observations
        const explainedObservations = observations.filter(obs => 
            this.hypothesisExplainsObservation(hypothesis, obs)
        ).length;
        score += explainedObservations * 0.1;
        
        return score;
    }

    /**
     * Check if hypothesis explains observation
     */
    private hypothesisExplainsObservation(hypothesis: Atom, observation: Atom): boolean {
        // Simple check - in real implementation would be more sophisticated
        return hypothesis.outgoing?.some(atom => 
            this.atomsAreRelated(atom, observation)
        ) || false;
    }

    /**
     * Check if two atoms are related
     */
    private atomsAreRelated(atom1: Atom, atom2: Atom): boolean {
        return (atom1.name === atom2.name) || 
               (atom1.type === atom2.type) ||
               (atom1.outgoing && atom2.outgoing && 
                atom1.outgoing.some(a1 => atom2.outgoing?.some(a2 => a1.name === a2.name))) || false;
    }

    /**
     * Apply general PLN rules
     */
    private applyGeneralPLNRules(atom: Atom): Atom[] {
        const results: Atom[] = [];
        
        // Apply basic PLN rules based on atom type
        switch (atom.type) {
            case 'AndLink':
                results.push(...this.applyAndLinkRules(atom));
                break;
            case 'OrLink':
                results.push(...this.applyOrLinkRules(atom));
                break;
            case 'NotLink':
                results.push(...this.applyNotLinkRules(atom));
                break;
            case 'SimilarityLink':
                results.push(...this.applySimilarityRules(atom));
                break;
        }
        
        return results;
    }

    /**
     * Apply AndLink-specific PLN rules
     */
    private applyAndLinkRules(atom: Atom): Atom[] {
        const results: Atom[] = [];
        
        if (atom.outgoing && atom.outgoing.length >= 2) {
            // Calculate conjunction truth value
            const strength = atom.outgoing.reduce((acc, child) => 
                acc * (child.truthValue?.strength || 0.5), 1
            );
            const confidence = Math.min(...atom.outgoing.map(child => 
                child.truthValue?.confidence || 0.5
            ));
            
            results.push({
                ...atom,
                truthValue: { strength, confidence },
                name: `and_result_${Date.now()}`
            });
        }
        
        return results;
    }

    /**
     * Apply OrLink-specific PLN rules
     */
    private applyOrLinkRules(atom: Atom): Atom[] {
        const results: Atom[] = [];
        
        if (atom.outgoing && atom.outgoing.length >= 2) {
            // Calculate disjunction truth value
            const strength = 1 - atom.outgoing.reduce((acc, child) => 
                acc * (1 - (child.truthValue?.strength || 0.5)), 1
            );
            const confidence = Math.max(...atom.outgoing.map(child => 
                child.truthValue?.confidence || 0.5
            ));
            
            results.push({
                ...atom,
                truthValue: { strength, confidence },
                name: `or_result_${Date.now()}`
            });
        }
        
        return results;
    }

    /**
     * Apply NotLink-specific PLN rules
     */
    private applyNotLinkRules(atom: Atom): Atom[] {
        const results: Atom[] = [];
        
        if (atom.outgoing && atom.outgoing.length === 1) {
            const child = atom.outgoing[0];
            if (child.truthValue) {
                results.push({
                    ...atom,
                    truthValue: {
                        strength: 1 - child.truthValue.strength,
                        confidence: child.truthValue.confidence
                    },
                    name: `not_result_${Date.now()}`
                });
            }
        }
        
        return results;
    }

    /**
     * Apply SimilarityLink-specific PLN rules
     */
    private applySimilarityRules(atom: Atom): Atom[] {
        const results: Atom[] = [];
        
        if (atom.outgoing && atom.outgoing.length === 2) {
            const [a, b] = atom.outgoing;
            
            // Symmetric property: Similarity(A,B) = Similarity(B,A)
            results.push({
                type: 'SimilarityLink',
                name: `similarity_symmetric_${Date.now()}`,
                truthValue: atom.truthValue,
                outgoing: [b, a]
            });
        }
        
        return results;
    }

    /**
     * Calculate confidence for inference results
     */
    private calculateInferenceConfidence(conclusions: Atom[]): number {
        if (conclusions.length === 0) return 0;
        
        const avgConfidence = conclusions.reduce((sum, atom) => 
            sum + (atom.truthValue?.confidence || 0), 0
        ) / conclusions.length;
        
        return Math.min(0.95, avgConfidence * 0.9); // Slight reduction for inference uncertainty
    }

    /**
     * Calculate confidence for pattern recognition
     */
    private calculatePatternConfidence(patterns: Atom[], observations: Atom[]): number {
        if (patterns.length === 0 || observations.length === 0) return 0;
        
        // Higher confidence with more observations supporting patterns
        const supportRatio = patterns.length / Math.max(observations.length, 1);
        return Math.min(0.9, supportRatio * 0.7 + 0.2);
    }

    /**
     * Calculate confidence for abductive reasoning
     */
    private calculateAbductiveConfidence(hypotheses: Atom[]): number {
        if (hypotheses.length === 0) return 0;
        
        // Abductive reasoning has inherent uncertainty
        const avgStrength = hypotheses.reduce((sum, h) => 
            sum + (h.truthValue?.strength || 0), 0
        ) / hypotheses.length;
        
        return Math.min(0.8, avgStrength * 0.6 + 0.1);
    }

    /**
     * Calculate general confidence
     */
    private calculateGeneralConfidence(results: Atom[]): number {
        if (results.length === 0) return 0;
        
        const avgConfidence = results.reduce((sum, atom) => 
            sum + (atom.truthValue?.confidence || 0.5), 0
        ) / results.length;
        
        return Math.min(0.85, avgConfidence * 0.8);
    }

    /**
     * Extract applied rules for metadata
     */
    private extractAppliedRules(conclusions: Atom[]): string[] {
        return conclusions.map(atom => atom.type).filter((type, index, self) => 
            self.indexOf(type) === index
        );
    }
}