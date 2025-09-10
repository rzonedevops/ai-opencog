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
import { Atom, PatternInput, PatternResult, ReasoningQuery, ReasoningResult } from '../../common';

/**
 * Advanced pattern matching reasoning engine
 * Implements sophisticated pattern recognition and matching algorithms
 */
@injectable()
export class PatternMatchingEngine {

    /**
     * Perform pattern matching based reasoning
     */
    async reason(query: ReasoningQuery): Promise<ReasoningResult> {
        const patterns = await this.recognizePatterns({ 
            data: query.atoms, 
            context: query.context,
            scope: 'local'
        });

        return {
            conclusion: this.convertPatternsToAtoms(patterns),
            confidence: this.calculatePatternConfidence(patterns),
            explanation: `Pattern matching identified ${patterns.length} significant patterns`,
            metadata: {
                reasoningType: 'pattern-matching',
                patternsFound: patterns.length,
                patternTypes: this.extractPatternTypes(patterns)
            }
        };
    }

    /**
     * Advanced pattern recognition with multiple algorithms
     */
    async recognizePatterns(input: PatternInput): Promise<PatternResult[]> {
        const patterns: PatternResult[] = [];

        // Apply different pattern recognition algorithms
        patterns.push(...await this.recognizeStructuralPatterns(input));
        patterns.push(...await this.recognizeSequentialPatterns(input));
        patterns.push(...await this.recognizeHierarchicalPatterns(input));
        patterns.push(...await this.recognizeSemanticPatterns(input));
        patterns.push(...await this.recognizeBehavioralPatterns(input));

        // Filter and rank patterns by significance
        return this.filterAndRankPatterns(patterns);
    }

    /**
     * Recognize structural patterns in data
     */
    private async recognizeStructuralPatterns(input: PatternInput): Promise<PatternResult[]> {
        const patterns: PatternResult[] = [];
        const atoms = input.data as Atom[] || [];

        // Group atoms by structure
        const structureGroups = this.groupAtomsByStructure(atoms);

        for (const [structure, atomGroup] of structureGroups.entries()) {
            if (atomGroup.length >= 2) { // Pattern needs at least 2 instances
                patterns.push({
                    pattern: {
                        type: 'structural',
                        structure,
                        template: this.extractStructuralTemplate(atomGroup[0]),
                        frequency: atomGroup.length
                    },
                    confidence: this.calculateStructuralConfidence(atomGroup),
                    instances: atomGroup,
                    metadata: {
                        patternType: 'structural',
                        instanceCount: atomGroup.length,
                        complexityScore: this.calculateComplexity(atomGroup[0])
                    }
                });
            }
        }

        return patterns;
    }

    /**
     * Recognize sequential patterns
     */
    private async recognizeSequentialPatterns(input: PatternInput): Promise<PatternResult[]> {
        const patterns: PatternResult[] = [];
        const atoms = input.data as Atom[] || [];

        // Look for temporal or sequential relationships
        const sequences = this.findSequentialPatterns(atoms);

        for (const sequence of sequences) {
            if (sequence.length >= 3) { // Meaningful sequence
                patterns.push({
                    pattern: {
                        type: 'sequential',
                        sequence: sequence.map(atom => atom.type),
                        transitions: this.extractTransitions(sequence)
                    },
                    confidence: this.calculateSequentialConfidence(sequence),
                    instances: sequence,
                    metadata: {
                        patternType: 'sequential',
                        sequenceLength: sequence.length,
                        transitionStrength: this.calculateTransitionStrength(sequence)
                    }
                });
            }
        }

        return patterns;
    }

    /**
     * Recognize hierarchical patterns
     */
    private async recognizeHierarchicalPatterns(input: PatternInput): Promise<PatternResult[]> {
        const patterns: PatternResult[] = [];
        const atoms = input.data as Atom[] || [];

        // Build hierarchy trees and find common structures
        const hierarchies = this.buildHierarchies(atoms);

        for (const hierarchy of hierarchies) {
            const commonSubstructures = this.findCommonHierarchicalPatterns(hierarchy);
            
            for (const substructure of commonSubstructures) {
                patterns.push({
                    pattern: {
                        type: 'hierarchical',
                        depth: this.calculateHierarchyDepth(substructure),
                        structure: substructure,
                        branchingFactor: this.calculateBranchingFactor(substructure)
                    },
                    confidence: this.calculateHierarchicalConfidence(substructure),
                    instances: this.extractHierarchyInstances(substructure),
                    metadata: {
                        patternType: 'hierarchical',
                        depth: this.calculateHierarchyDepth(substructure),
                        complexity: this.calculateHierarchicalComplexity(substructure)
                    }
                });
            }
        }

        return patterns;
    }

    /**
     * Recognize semantic patterns
     */
    private async recognizeSemanticPatterns(input: PatternInput): Promise<PatternResult[]> {
        const patterns: PatternResult[] = [];
        const atoms = input.data as Atom[] || [];

        // Group atoms by semantic similarity
        const semanticClusters = this.clusterAtomsBySemantic(atoms);

        for (const cluster of semanticClusters) {
            if (cluster.length >= 2) {
                const semanticPattern = this.extractSemanticPattern(cluster);
                
                patterns.push({
                    pattern: {
                        type: 'semantic',
                        concept: semanticPattern.concept,
                        relations: semanticPattern.relations,
                        semanticField: semanticPattern.field
                    },
                    confidence: this.calculateSemanticConfidence(cluster),
                    instances: cluster,
                    metadata: {
                        patternType: 'semantic',
                        clusterSize: cluster.length,
                        semanticCoherence: this.calculateSemanticCoherence(cluster)
                    }
                });
            }
        }

        return patterns;
    }

    /**
     * Recognize behavioral patterns
     */
    private async recognizeBehavioralPatterns(input: PatternInput): Promise<PatternResult[]> {
        const patterns: PatternResult[] = [];
        const atoms = input.data as Atom[] || [];

        // Look for behavioral patterns in atom interactions
        const behaviors = this.identifyBehavioralPatterns(atoms);

        for (const behavior of behaviors) {
            patterns.push({
                pattern: {
                    type: 'behavioral',
                    behavior: behavior.type,
                    triggers: behavior.triggers,
                    effects: behavior.effects,
                    frequency: behavior.frequency
                },
                confidence: this.calculateBehavioralConfidence(behavior),
                instances: behavior.instances,
                metadata: {
                    patternType: 'behavioral',
                    behaviorType: behavior.type,
                    frequency: behavior.frequency,
                    effectStrength: behavior.effectStrength
                }
            });
        }

        return patterns;
    }

    /**
     * Group atoms by their structural properties
     */
    private groupAtomsByStructure(atoms: Atom[]): Map<string, Atom[]> {
        const groups = new Map<string, Atom[]>();

        for (const atom of atoms) {
            const signature = this.generateStructuralSignature(atom);
            
            if (!groups.has(signature)) {
                groups.set(signature, []);
            }
            groups.get(signature)!.push(atom);
        }

        return groups;
    }

    /**
     * Generate structural signature for an atom
     */
    private generateStructuralSignature(atom: Atom): string {
        let signature = atom.type;
        
        if (atom.outgoing) {
            signature += `(${atom.outgoing.length})`;
            signature += '[' + atom.outgoing.map(child => child.type).join(',') + ']';
        }
        
        return signature;
    }

    /**
     * Extract structural template from atom
     */
    private extractStructuralTemplate(atom: Atom): any {
        return {
            type: atom.type,
            arity: atom.outgoing?.length || 0,
            childTypes: atom.outgoing?.map(child => child.type) || [],
            hasName: !!atom.name,
            hasTruthValue: !!atom.truthValue
        };
    }

    /**
     * Find sequential patterns in atoms
     */
    private findSequentialPatterns(atoms: Atom[]): Atom[][] {
        const sequences: Atom[][] = [];
        const visited = new Set<string>();

        for (let i = 0; i < atoms.length - 2; i++) {
            const sequence = [atoms[i]];
            let current = atoms[i];

            // Look for continuation of sequence
            for (let j = i + 1; j < atoms.length; j++) {
                if (this.isSequentiallyRelated(current, atoms[j])) {
                    sequence.push(atoms[j]);
                    current = atoms[j];
                }
            }

            if (sequence.length >= 3) {
                const key = sequence.map(a => a.id || a.name).join('-');
                if (!visited.has(key)) {
                    sequences.push(sequence);
                    visited.add(key);
                }
            }
        }

        return sequences;
    }

    /**
     * Check if two atoms are sequentially related
     */
    private isSequentiallyRelated(atom1: Atom, atom2: Atom): boolean {
        // Simple heuristic - atoms are related if they share common elements
        if (atom1.outgoing && atom2.outgoing) {
            return atom1.outgoing.some(child1 => 
                atom2.outgoing!.some(child2 => 
                    child1.name === child2.name || child1.type === child2.type
                )
            );
        }
        
        return atom1.type === atom2.type;
    }

    /**
     * Extract transitions from sequence
     */
    private extractTransitions(sequence: Atom[]): any[] {
        const transitions = [];
        
        for (let i = 0; i < sequence.length - 1; i++) {
            transitions.push({
                from: sequence[i].type,
                to: sequence[i + 1].type,
                relationship: this.identifyRelationship(sequence[i], sequence[i + 1])
            });
        }
        
        return transitions;
    }

    /**
     * Identify relationship between two atoms
     */
    private identifyRelationship(atom1: Atom, atom2: Atom): string {
        if (atom1.outgoing?.some(child => child.id === atom2.id)) {
            return 'contains';
        }
        if (atom2.outgoing?.some(child => child.id === atom1.id)) {
            return 'contained-by';
        }
        if (atom1.type === atom2.type) {
            return 'same-type';
        }
        return 'related';
    }

    /**
     * Build hierarchies from atoms
     */
    private buildHierarchies(atoms: Atom[]): any[] {
        const hierarchies = [];
        const processed = new Set<string>();

        for (const atom of atoms) {
            if (!processed.has(atom.id || atom.name || '')) {
                const hierarchy = this.buildHierarchyTree(atom, atoms, processed);
                if (hierarchy.children.length > 0) {
                    hierarchies.push(hierarchy);
                }
            }
        }

        return hierarchies;
    }

    /**
     * Build hierarchy tree starting from an atom
     */
    private buildHierarchyTree(root: Atom, allAtoms: Atom[], processed: Set<string>): any {
        const tree = {
            atom: root,
            children: [] as any[]
        };

        processed.add(root.id || root.name || '');

        if (root.outgoing) {
            for (const child of root.outgoing) {
                const childId = child.id || child.name || '';
                if (!processed.has(childId)) {
                    tree.children.push(this.buildHierarchyTree(child, allAtoms, processed));
                }
            }
        }

        return tree;
    }

    /**
     * Find common hierarchical patterns
     */
    private findCommonHierarchicalPatterns(hierarchy: any): any[] {
        const patterns = [];
        const subtrees = this.extractSubtrees(hierarchy);
        const subtreeGroups = this.groupSimilarSubtrees(subtrees);

        for (const group of subtreeGroups) {
            if (group.length >= 2) {
                patterns.push(this.extractCommonPattern(group));
            }
        }

        return patterns;
    }

    /**
     * Extract subtrees from hierarchy
     */
    private extractSubtrees(hierarchy: any): any[] {
        const subtrees = [hierarchy];
        
        for (const child of hierarchy.children) {
            subtrees.push(...this.extractSubtrees(child));
        }
        
        return subtrees;
    }

    /**
     * Group similar subtrees
     */
    private groupSimilarSubtrees(subtrees: any[]): any[][] {
        const groups: any[][] = [];
        const used = new Set<number>();

        for (let i = 0; i < subtrees.length; i++) {
            if (used.has(i)) continue;
            
            const group = [subtrees[i]];
            used.add(i);
            
            for (let j = i + 1; j < subtrees.length; j++) {
                if (!used.has(j) && this.areSubtreesSimilar(subtrees[i], subtrees[j])) {
                    group.push(subtrees[j]);
                    used.add(j);
                }
            }
            
            groups.push(group);
        }

        return groups;
    }

    /**
     * Check if two subtrees are similar
     */
    private areSubtreesSimilar(tree1: any, tree2: any): boolean {
        if (tree1.atom.type !== tree2.atom.type) return false;
        if (tree1.children.length !== tree2.children.length) return false;
        
        // Check if children have similar structure
        for (let i = 0; i < tree1.children.length; i++) {
            if (!this.areSubtreesSimilar(tree1.children[i], tree2.children[i])) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Extract common pattern from subtree group
     */
    private extractCommonPattern(group: any[]): any {
        const template = group[0];
        return {
            structure: this.extractStructureTemplate(template),
            instances: group,
            frequency: group.length
        };
    }

    /**
     * Extract structure template
     */
    private extractStructureTemplate(subtree: any): any {
        return {
            rootType: subtree.atom.type,
            depth: this.calculateSubtreeDepth(subtree),
            childCount: subtree.children.length,
            childTypes: subtree.children.map((child: any) => child.atom.type)
        };
    }

    /**
     * Calculate subtree depth
     */
    private calculateSubtreeDepth(subtree: any): number {
        if (subtree.children.length === 0) return 1;
        
        return 1 + Math.max(...subtree.children.map((child: any) => 
            this.calculateSubtreeDepth(child)
        ));
    }

    /**
     * Cluster atoms by semantic similarity
     */
    private clusterAtomsBySemantic(atoms: Atom[]): Atom[][] {
        const clusters: Atom[][] = [];
        const used = new Set<string>();

        for (const atom of atoms) {
            const atomId = atom.id || atom.name || '';
            if (used.has(atomId)) continue;

            const cluster = [atom];
            used.add(atomId);

            for (const other of atoms) {
                const otherId = other.id || other.name || '';
                if (!used.has(otherId) && this.areSemanticallyRelated(atom, other)) {
                    cluster.push(other);
                    used.add(otherId);
                }
            }

            if (cluster.length >= 2) {
                clusters.push(cluster);
            }
        }

        return clusters;
    }

    /**
     * Check if two atoms are semantically related
     */
    private areSemanticallyRelated(atom1: Atom, atom2: Atom): boolean {
        // Simple semantic similarity based on names and types
        if (atom1.name && atom2.name) {
            const similarity = this.calculateNameSimilarity(atom1.name, atom2.name);
            if (similarity > 0.6) return true;
        }
        
        if (atom1.type === atom2.type) return true;
        
        return this.shareCommonElements(atom1, atom2);
    }

    /**
     * Calculate name similarity
     */
    private calculateNameSimilarity(name1: string, name2: string): number {
        const words1 = name1.toLowerCase().split(/[_\-\s]+/);
        const words2 = name2.toLowerCase().split(/[_\-\s]+/);
        
        const commonWords = words1.filter(word => words2.includes(word));
        return commonWords.length / Math.max(words1.length, words2.length);
    }

    /**
     * Check if atoms share common elements
     */
    private shareCommonElements(atom1: Atom, atom2: Atom): boolean {
        if (atom1.outgoing && atom2.outgoing) {
            return atom1.outgoing.some(child1 => 
                atom2.outgoing!.some(child2 => 
                    child1.name === child2.name || child1.type === child2.type
                )
            );
        }
        return false;
    }

    /**
     * Extract semantic pattern from cluster
     */
    private extractSemanticPattern(cluster: Atom[]): any {
        const types = cluster.map(atom => atom.type);
        const commonType = this.findMostCommonElement(types);
        
        const names = cluster.filter(atom => atom.name).map(atom => atom.name!);
        const commonConcept = this.extractCommonConcept(names);
        
        return {
            concept: commonConcept,
            relations: this.extractCommonRelations(cluster),
            field: commonType
        };
    }

    /**
     * Find most common element in array
     */
    private findMostCommonElement(arr: string[]): string {
        const counts = new Map<string, number>();
        
        for (const item of arr) {
            counts.set(item, (counts.get(item) || 0) + 1);
        }
        
        let maxCount = 0;
        let mostCommon = arr[0];
        
        for (const [item, count] of counts.entries()) {
            if (count > maxCount) {
                maxCount = count;
                mostCommon = item;
            }
        }
        
        return mostCommon;
    }

    /**
     * Extract common concept from names
     */
    private extractCommonConcept(names: string[]): string {
        if (names.length === 0) return 'unknown';
        
        // Find common words across names
        const wordSets = names.map(name => 
            new Set(name.toLowerCase().split(/[_\-\s]+/))
        );
        
        if (wordSets.length === 0) return 'unknown';
        
        const commonWords = [...wordSets[0]].filter(word => 
            wordSets.every(wordSet => wordSet.has(word))
        );
        
        return commonWords.length > 0 ? commonWords.join('_') : 'general_concept';
    }

    /**
     * Extract common relations from cluster
     */
    private extractCommonRelations(cluster: Atom[]): string[] {
        const relations = new Set<string>();
        
        for (const atom of cluster) {
            if (atom.outgoing) {
                for (const child of atom.outgoing) {
                    relations.add(child.type);
                }
            }
        }
        
        return [...relations];
    }

    /**
     * Identify behavioral patterns
     */
    private identifyBehavioralPatterns(atoms: Atom[]): any[] {
        const behaviors = [];
        
        // Look for cause-effect patterns
        const causalPatterns = this.findCausalPatterns(atoms);
        behaviors.push(...causalPatterns);
        
        // Look for feedback loops
        const feedbackLoops = this.findFeedbackLoops(atoms);
        behaviors.push(...feedbackLoops);
        
        // Look for conditional behaviors
        const conditionalBehaviors = this.findConditionalBehaviors(atoms);
        behaviors.push(...conditionalBehaviors);
        
        return behaviors;
    }

    /**
     * Find causal patterns
     */
    private findCausalPatterns(atoms: Atom[]): any[] {
        const patterns = [];
        
        for (const atom of atoms) {
            if (atom.type === 'ImplicationLink' && atom.outgoing?.length === 2) {
                patterns.push({
                    type: 'causal',
                    triggers: [atom.outgoing[0]],
                    effects: [atom.outgoing[1]],
                    frequency: 1,
                    instances: [atom],
                    effectStrength: atom.truthValue?.strength || 0.5
                });
            }
        }
        
        return patterns;
    }

    /**
     * Find feedback loops
     */
    private findFeedbackLoops(atoms: Atom[]): any[] {
        // Simplified feedback loop detection
        return [];
    }

    /**
     * Find conditional behaviors
     */
    private findConditionalBehaviors(atoms: Atom[]): any[] {
        // Simplified conditional behavior detection
        return [];
    }

    /**
     * Filter and rank patterns by significance
     */
    private filterAndRankPatterns(patterns: PatternResult[]): PatternResult[] {
        // Filter patterns with low confidence
        const filtered = patterns.filter(pattern => pattern.confidence > 0.3);
        
        // Sort by confidence and instance count
        return filtered.sort((a, b) => {
            const scoreA = a.confidence * Math.log(a.instances.length + 1);
            const scoreB = b.confidence * Math.log(b.instances.length + 1);
            return scoreB - scoreA;
        });
    }

    /**
     * Convert patterns to atoms for reasoning result
     */
    private convertPatternsToAtoms(patterns: PatternResult[]): Atom[] {
        return patterns.map(pattern => ({
            type: 'PatternNode',
            name: `pattern_${pattern.metadata?.patternType}_${Date.now()}`,
            truthValue: { strength: pattern.confidence, confidence: 0.8 },
            metadata: pattern.metadata
        }));
    }

    /**
     * Calculate overall confidence for patterns
     */
    private calculatePatternConfidence(patterns: PatternResult[]): number {
        if (patterns.length === 0) return 0;
        
        const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
        return Math.min(0.9, avgConfidence);
    }

    /**
     * Extract pattern types for metadata
     */
    private extractPatternTypes(patterns: PatternResult[]): string[] {
        return [...new Set(patterns.map(p => p.metadata?.patternType || 'unknown'))];
    }

    /**
     * Calculate various confidence metrics
     */
    private calculateStructuralConfidence(atoms: Atom[]): number {
        return Math.min(0.9, 0.5 + (atoms.length * 0.1));
    }

    private calculateSequentialConfidence(sequence: Atom[]): number {
        return Math.min(0.8, 0.4 + (sequence.length * 0.08));
    }

    private calculateHierarchicalConfidence(structure: any): number {
        return Math.min(0.85, 0.5 + (structure.frequency * 0.05));
    }

    private calculateSemanticConfidence(cluster: Atom[]): number {
        return Math.min(0.9, 0.6 + (cluster.length * 0.05));
    }

    private calculateBehavioralConfidence(behavior: any): number {
        return Math.min(0.8, behavior.effectStrength * 0.8);
    }

    private calculateComplexity(atom: Atom): number {
        let complexity = 1;
        if (atom.outgoing) {
            complexity += atom.outgoing.length;
            complexity += atom.outgoing.reduce((sum, child) => 
                sum + this.calculateComplexity(child), 0
            );
        }
        return complexity;
    }

    private calculateTransitionStrength(sequence: Atom[]): number {
        return sequence.length > 1 ? 0.8 : 0.5;
    }

    private calculateHierarchyDepth(structure: any): number {
        return structure.depth || 1;
    }

    private calculateBranchingFactor(structure: any): number {
        return structure.childCount || 0;
    }

    private calculateHierarchicalComplexity(structure: any): 'simple' | 'moderate' | 'complex' {
        const complexityScore = structure.depth * structure.childCount;
        if (complexityScore < 5) return 'simple';
        if (complexityScore < 15) return 'moderate';
        return 'complex';
    }

    private calculateSemanticCoherence(cluster: Atom[]): number {
        return Math.min(1.0, cluster.length * 0.1 + 0.5);
    }

    private extractHierarchyInstances(structure: any): Atom[] {
        return structure.instances || [];
    }
}