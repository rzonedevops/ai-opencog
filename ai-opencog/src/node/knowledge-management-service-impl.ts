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
import { KnowledgeManagementService } from '../common/knowledge-management-service';
import {
    KnowledgeGraph,
    KnowledgeCategory,
    KnowledgeDiscoveryQuery,
    KnowledgeDiscoveryResult,
    KnowledgeValidationResult,
    KnowledgePersistenceConfig,
    KnowledgeTransferOptions,
    KnowledgeMetrics,
    KnowledgeRelationship,
    KnowledgeQuality,
    KnowledgeUsage,
    KnowledgeValidationIssue
} from '../common/knowledge-management-types';
import { Atom } from '../common/opencog-types';

/**
 * Implementation of Knowledge Management Service
 */
@injectable()
export class KnowledgeManagementServiceImpl implements KnowledgeManagementService {
    
    private knowledgeGraphs: Map<string, KnowledgeGraph> = new Map();
    private categories: Map<string, KnowledgeCategory> = new Map();
    private persistenceConfig: KnowledgePersistenceConfig = {
        format: 'json',
        compression: false,
        encryption: false,
        versioning: true,
        backup: true
    };
    private nextGraphId = 1;
    private nextCategoryId = 1;
    private nextRelationshipId = 1;

    // Knowledge Graph Management
    async createKnowledgeGraph(name: string, domain: string, description?: string): Promise<KnowledgeGraph> {
        const graph: KnowledgeGraph = {
            id: this.generateGraphId(),
            name,
            description: description || '',
            domain,
            atoms: [],
            relationships: [],
            metadata: {
                createdAt: Date.now(),
                updatedAt: Date.now(),
                version: '1.0.0',
                tags: [],
                quality: {
                    completeness: 0,
                    consistency: 1,
                    accuracy: 1,
                    relevance: 1,
                    freshness: 1
                },
                usage: {
                    accessCount: 0,
                    lastAccessed: Date.now(),
                    modificationCount: 0,
                    lastModified: Date.now(),
                    queryCount: 0
                }
            }
        };
        
        this.knowledgeGraphs.set(graph.id, graph);
        return graph;
    }

    async getKnowledgeGraph(graphId: string): Promise<KnowledgeGraph | undefined> {
        const graph = this.knowledgeGraphs.get(graphId);
        if (graph) {
            graph.metadata.usage.accessCount++;
            graph.metadata.usage.lastAccessed = Date.now();
        }
        return graph;
    }

    async getKnowledgeGraphs(domain?: string): Promise<KnowledgeGraph[]> {
        const graphs = Array.from(this.knowledgeGraphs.values());
        return domain ? graphs.filter(g => g.domain === domain) : graphs;
    }

    async updateKnowledgeGraph(graphId: string, updates: Partial<KnowledgeGraph>): Promise<boolean> {
        const graph = this.knowledgeGraphs.get(graphId);
        if (!graph) {
            return false;
        }

        Object.assign(graph, updates);
        graph.metadata.updatedAt = Date.now();
        graph.metadata.usage.modificationCount++;
        graph.metadata.usage.lastModified = Date.now();
        
        this.knowledgeGraphs.set(graphId, graph);
        return true;
    }

    async deleteKnowledgeGraph(graphId: string): Promise<boolean> {
        return this.knowledgeGraphs.delete(graphId);
    }

    async addAtomToGraph(graphId: string, atom: Atom): Promise<boolean> {
        const graph = this.knowledgeGraphs.get(graphId);
        if (!graph) {
            return false;
        }

        // Ensure atom has an ID
        if (!atom.id) {
            atom.id = `atom_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        }

        graph.atoms.push(atom);
        await this.updateQualityMetrics(graph);
        return true;
    }

    async removeAtomFromGraph(graphId: string, atomId: string): Promise<boolean> {
        const graph = this.knowledgeGraphs.get(graphId);
        if (!graph) {
            return false;
        }

        const initialLength = graph.atoms.length;
        graph.atoms = graph.atoms.filter(a => a.id !== atomId);
        
        // Also remove related relationships
        graph.relationships = graph.relationships.filter(r => 
            r.source !== atomId && r.target !== atomId
        );

        if (graph.atoms.length < initialLength) {
            await this.updateQualityMetrics(graph);
            return true;
        }
        return false;
    }

    async addRelationship(graphId: string, relationship: KnowledgeRelationship): Promise<boolean> {
        const graph = this.knowledgeGraphs.get(graphId);
        if (!graph) {
            return false;
        }

        if (!relationship.id) {
            relationship.id = this.generateRelationshipId();
        }

        graph.relationships.push(relationship);
        await this.updateQualityMetrics(graph);
        return true;
    }

    async removeRelationship(graphId: string, relationshipId: string): Promise<boolean> {
        const graph = this.knowledgeGraphs.get(graphId);
        if (!graph) {
            return false;
        }

        const initialLength = graph.relationships.length;
        graph.relationships = graph.relationships.filter(r => r.id !== relationshipId);
        
        if (graph.relationships.length < initialLength) {
            await this.updateQualityMetrics(graph);
            return true;
        }
        return false;
    }

    // Knowledge Discovery
    async discoverKnowledge(query: KnowledgeDiscoveryQuery): Promise<KnowledgeDiscoveryResult[]> {
        const results: KnowledgeDiscoveryResult[] = [];
        const seedAtomIds = new Set(query.seedConcepts);

        for (const graph of this.knowledgeGraphs.values()) {
            if (query.scope === 'domain-specific' && query.parameters?.domain !== graph.domain) {
                continue;
            }

            for (const atom of graph.atoms) {
                if (seedAtomIds.has(atom.id!) || seedAtomIds.has(atom.name!)) {
                    continue; // Skip seed concepts
                }

                const relevanceScore = await this.calculateRelevanceScore(atom, query.seedConcepts, graph);
                if (relevanceScore > 0.3) { // Threshold for relevance
                    const relationshipPath = await this.findRelationshipPath(query.seedConcepts[0], atom.id!, graph);
                    
                    results.push({
                        concept: atom,
                        relevanceScore,
                        relationshipPath,
                        explanation: this.generateDiscoveryExplanation(atom, relationshipPath, relevanceScore),
                        metadata: {
                            graphId: graph.id,
                            domain: graph.domain,
                            discoveryType: query.type
                        }
                    });
                }
            }
        }

        // Sort by relevance score and limit results
        return results
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, query.maxResults);
    }

    async findSimilarConcepts(atomId: string, maxResults = 10): Promise<KnowledgeDiscoveryResult[]> {
        return this.discoverKnowledge({
            type: 'semantic',
            seedConcepts: [atomId],
            scope: 'global',
            maxResults
        });
    }

    async getConceptPath(sourceAtomId: string, targetAtomId: string): Promise<KnowledgeRelationship[]> {
        for (const graph of this.knowledgeGraphs.values()) {
            const path = await this.findRelationshipPath(sourceAtomId, targetAtomId, graph);
            if (path.length > 0) {
                return path;
            }
        }
        return [];
    }

    async getRelatedConcepts(atomId: string, maxDistance: number): Promise<Atom[]> {
        const relatedAtoms: Set<string> = new Set();
        const visited: Set<string> = new Set();
        const queue: Array<{ atomId: string; distance: number }> = [{ atomId, distance: 0 }];

        while (queue.length > 0) {
            const current = queue.shift()!;
            if (visited.has(current.atomId) || current.distance > maxDistance) {
                continue;
            }

            visited.add(current.atomId);
            if (current.distance > 0) {
                relatedAtoms.add(current.atomId);
            }

            // Find connected atoms
            for (const graph of this.knowledgeGraphs.values()) {
                for (const relationship of graph.relationships) {
                    let nextAtomId: string | undefined;
                    if (relationship.source === current.atomId) {
                        nextAtomId = relationship.target;
                    } else if (relationship.target === current.atomId) {
                        nextAtomId = relationship.source;
                    }

                    if (nextAtomId && !visited.has(nextAtomId)) {
                        queue.push({ atomId: nextAtomId, distance: current.distance + 1 });
                    }
                }
            }
        }

        // Convert atom IDs to atoms
        const result: Atom[] = [];
        for (const graph of this.knowledgeGraphs.values()) {
            for (const atom of graph.atoms) {
                if (atom.id && relatedAtoms.has(atom.id)) {
                    result.push(atom);
                }
            }
        }

        return result;
    }

    // Knowledge Categorization
    async createCategory(category: KnowledgeCategory): Promise<string> {
        if (!category.id) {
            category.id = this.generateCategoryId();
        }
        this.categories.set(category.id, category);
        return category.id;
    }

    async getCategories(): Promise<KnowledgeCategory[]> {
        return Array.from(this.categories.values());
    }

    async categorizeAtoms(graphId: string): Promise<Map<string, string[]>> {
        const graph = this.knowledgeGraphs.get(graphId);
        if (!graph) {
            return new Map();
        }

        const atomCategories = new Map<string, string[]>();

        for (const atom of graph.atoms) {
            const categories: string[] = [];
            
            for (const category of this.categories.values()) {
                for (const rule of category.rules) {
                    if (await this.evaluateCategoryRule(atom, rule)) {
                        categories.push(category.id);
                        break;
                    }
                }
            }

            if (atom.id) {
                atomCategories.set(atom.id, categories);
            }
        }

        return atomCategories;
    }

    async getAtomsByCategory(categoryId: string): Promise<Atom[]> {
        const atoms: Atom[] = [];
        
        for (const graph of this.knowledgeGraphs.values()) {
            const categorization = await this.categorizeAtoms(graph.id);
            for (const [atomId, categories] of categorization) {
                if (categories.includes(categoryId)) {
                    const atom = graph.atoms.find(a => a.id === atomId);
                    if (atom) {
                        atoms.push(atom);
                    }
                }
            }
        }

        return atoms;
    }

    // Knowledge Validation
    async validateKnowledgeGraph(graphId: string): Promise<KnowledgeValidationResult> {
        const graph = this.knowledgeGraphs.get(graphId);
        if (!graph) {
            return {
                isValid: false,
                confidence: 0,
                issues: [{
                    type: 'inconsistency',
                    severity: 'critical',
                    description: 'Knowledge graph not found',
                    affectedAtoms: []
                }],
                suggestions: []
            };
        }

        const issues: KnowledgeValidationIssue[] = [];
        
        // Check for orphaned atoms (atoms with no relationships)
        const connectedAtoms = new Set<string>();
        for (const rel of graph.relationships) {
            connectedAtoms.add(rel.source);
            connectedAtoms.add(rel.target);
        }

        for (const atom of graph.atoms) {
            if (atom.id && !connectedAtoms.has(atom.id) && graph.atoms.length > 1) {
                issues.push({
                    type: 'incompleteness',
                    severity: 'low',
                    description: `Atom "${atom.name || atom.id}" has no relationships`,
                    affectedAtoms: [atom.id],
                    suggestedFix: 'Consider adding relationships or removing this atom'
                });
            }
        }

        // Check for contradictory relationships
        const contradictions = await this.findContradictions(graph);
        issues.push(...contradictions);

        const isValid = issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0;
        const confidence = Math.max(0, 1 - (issues.length * 0.1));

        return {
            isValid,
            confidence,
            issues,
            suggestions: this.generateValidationSuggestions(issues)
        };
    }

    async validateAtom(atomId: string): Promise<KnowledgeValidationResult> {
        for (const graph of this.knowledgeGraphs.values()) {
            const atom = graph.atoms.find(a => a.id === atomId);
            if (atom) {
                // Validate specific atom
                const issues: KnowledgeValidationIssue[] = [];
                
                // Check truth values
                if (atom.truthValue && (atom.truthValue.strength < 0 || atom.truthValue.strength > 1)) {
                    issues.push({
                        type: 'inconsistency',
                        severity: 'medium',
                        description: 'Truth value strength out of valid range [0,1]',
                        affectedAtoms: [atomId]
                    });
                }

                return {
                    isValid: issues.length === 0,
                    confidence: issues.length === 0 ? 1 : 0.5,
                    issues,
                    suggestions: this.generateValidationSuggestions(issues)
                };
            }
        }

        return {
            isValid: false,
            confidence: 0,
            issues: [{
                type: 'inconsistency',
                severity: 'critical',
                description: 'Atom not found',
                affectedAtoms: [atomId]
            }],
            suggestions: []
        };
    }

    async detectContradictions(graphId?: string): Promise<KnowledgeValidationResult> {
        const issues: KnowledgeValidationIssue[] = [];
        const graphsToCheck = graphId ? [this.knowledgeGraphs.get(graphId)!] : Array.from(this.knowledgeGraphs.values());

        for (const graph of graphsToCheck) {
            if (!graph) continue;
            const contradictions = await this.findContradictions(graph);
            issues.push(...contradictions);
        }

        return {
            isValid: issues.length === 0,
            confidence: issues.length === 0 ? 1 : Math.max(0, 1 - (issues.length * 0.2)),
            issues,
            suggestions: this.generateValidationSuggestions(issues)
        };
    }

    // Knowledge Persistence
    async configurePersistence(config: KnowledgePersistenceConfig): Promise<void> {
        this.persistenceConfig = { ...config };
    }

    async saveKnowledgeGraph(graphId: string): Promise<boolean> {
        const graph = this.knowledgeGraphs.get(graphId);
        if (!graph) {
            return false;
        }

        // Simulate saving to persistent storage
        // In a real implementation, this would save to a database or file system
        console.log(`Saving knowledge graph ${graphId} with config:`, this.persistenceConfig);
        return true;
    }

    async loadKnowledgeGraph(graphId: string): Promise<KnowledgeGraph | undefined> {
        // Simulate loading from persistent storage
        // In a real implementation, this would load from a database or file system
        console.log(`Loading knowledge graph ${graphId}`);
        return this.knowledgeGraphs.get(graphId);
    }

    async exportKnowledgeGraph(graphId: string, options: KnowledgeTransferOptions): Promise<string> {
        const graph = this.knowledgeGraphs.get(graphId);
        if (!graph) {
            throw new Error(`Knowledge graph ${graphId} not found`);
        }

        const exportData: any = {
            graph: {
                id: graph.id,
                name: graph.name,
                description: graph.description,
                domain: graph.domain,
                atoms: graph.atoms
            }
        };

        if (options.includeMetadata) {
            exportData.graph.metadata = graph.metadata;
        }

        if (options.includeRelationships) {
            exportData.graph.relationships = graph.relationships;
        }

        // Filter by category if specified
        if (options.filterByCategory && options.filterByCategory.length > 0) {
            const categorization = await this.categorizeAtoms(graphId);
            exportData.graph.atoms = exportData.graph.atoms.filter((atom: Atom) => {
                const atomCategories = categorization.get(atom.id!) || [];
                return atomCategories.some(cat => options.filterByCategory!.includes(cat));
            });
        }

        return JSON.stringify(exportData, null, 2);
    }

    async importKnowledgeGraph(data: string, options: KnowledgeTransferOptions): Promise<string> {
        try {
            const importData = JSON.parse(data);
            const graph = importData.graph;
            
            // Create new graph with imported data
            const newGraph = await this.createKnowledgeGraph(
                graph.name || 'Imported Graph',
                graph.domain || 'imported',
                graph.description
            );

            // Import atoms
            for (const atom of graph.atoms || []) {
                await this.addAtomToGraph(newGraph.id, atom);
            }

            // Import relationships if included
            if (options.includeRelationships && graph.relationships) {
                for (const relationship of graph.relationships) {
                    await this.addRelationship(newGraph.id, relationship);
                }
            }

            return newGraph.id;
        } catch (error) {
            throw new Error(`Failed to import knowledge graph: ${error}`);
        }
    }

    // Knowledge Metrics and Analytics
    async getKnowledgeMetrics(): Promise<KnowledgeMetrics> {
        const graphs = Array.from(this.knowledgeGraphs.values());
        const totalAtoms = graphs.reduce((sum, g) => sum + g.atoms.length, 0);
        const totalRelationships = graphs.reduce((sum, g) => sum + g.relationships.length, 0);
        
        // Calculate average quality
        const qualitySum = graphs.reduce((sum, g) => ({
            completeness: sum.completeness + g.metadata.quality.completeness,
            consistency: sum.consistency + g.metadata.quality.consistency,
            accuracy: sum.accuracy + g.metadata.quality.accuracy,
            relevance: sum.relevance + g.metadata.quality.relevance,
            freshness: sum.freshness + g.metadata.quality.freshness
        }), { completeness: 0, consistency: 0, accuracy: 0, relevance: 0, freshness: 0 });

        const avgQuality: KnowledgeQuality = {
            completeness: qualitySum.completeness / graphs.length || 0,
            consistency: qualitySum.consistency / graphs.length || 0,
            accuracy: qualitySum.accuracy / graphs.length || 0,
            relevance: qualitySum.relevance / graphs.length || 0,
            freshness: qualitySum.freshness / graphs.length || 0
        };

        return {
            totalGraphs: graphs.length,
            totalAtoms,
            totalRelationships,
            averageQuality: avgQuality,
            memoryUsage: this.estimateMemoryUsage(),
            queryPerformance: {
                averageResponseTime: 150, // milliseconds
                slowQueries: 0,
                cacheHitRate: 0.85
            },
            growthRate: {
                atomsPerDay: 10,
                relationshipsPerDay: 5,
                queriesPerDay: 100
            }
        };
    }

    async optimizeKnowledgeGraphs(): Promise<void> {
        // Implement optimization logic
        // This could include consolidating duplicate atoms, optimizing relationship structures, etc.
        console.log('Optimizing knowledge graphs...');
        
        for (const graph of this.knowledgeGraphs.values()) {
            await this.updateQualityMetrics(graph);
        }
    }

    async getGraphUsageStats(graphId: string): Promise<Record<string, any>> {
        const graph = this.knowledgeGraphs.get(graphId);
        if (!graph) {
            return {};
        }

        return {
            accessCount: graph.metadata.usage.accessCount,
            lastAccessed: graph.metadata.usage.lastAccessed,
            modificationCount: graph.metadata.usage.modificationCount,
            lastModified: graph.metadata.usage.lastModified,
            queryCount: graph.metadata.usage.queryCount,
            atomCount: graph.atoms.length,
            relationshipCount: graph.relationships.length,
            quality: graph.metadata.quality
        };
    }

    async recommendImprovements(graphId: string): Promise<string[]> {
        const graph = this.knowledgeGraphs.get(graphId);
        if (!graph) {
            return [];
        }

        const recommendations: string[] = [];
        const validation = await this.validateKnowledgeGraph(graphId);

        // Add recommendations based on validation issues
        if (validation.issues.length > 0) {
            recommendations.push('Address validation issues to improve knowledge quality');
        }

        // Check for low-quality metrics
        if (graph.metadata.quality.completeness < 0.5) {
            recommendations.push('Add more comprehensive knowledge to improve completeness');
        }

        if (graph.metadata.quality.freshness < 0.5) {
            recommendations.push('Update outdated knowledge to improve freshness');
        }

        if (graph.atoms.length > 0 && graph.relationships.length / graph.atoms.length < 0.5) {
            recommendations.push('Add more relationships between concepts to improve connectivity');
        }

        return recommendations;
    }

    // Search and Query
    async searchAtoms(query: string, options?: {
        domains?: string[];
        categories?: string[];
        maxResults?: number;
    }): Promise<Atom[]> {
        const results: Atom[] = [];
        const maxResults = options?.maxResults || 50;
        const queryLower = query.toLowerCase();

        for (const graph of this.knowledgeGraphs.values()) {
            // Filter by domain if specified
            if (options?.domains && !options.domains.includes(graph.domain)) {
                continue;
            }

            for (const atom of graph.atoms) {
                // Simple text search in atom name and type
                const matchesName = atom.name?.toLowerCase().includes(queryLower);
                const matchesType = atom.type.toLowerCase().includes(queryLower);
                
                if (matchesName || matchesType) {
                    results.push(atom);
                    if (results.length >= maxResults) {
                        return results;
                    }
                }
            }
        }

        return results;
    }

    async executeKnowledgeQuery(query: any): Promise<any> {
        // This would implement a more sophisticated query language
        // For now, just return a simple result
        return {
            query,
            results: [],
            executionTime: Date.now(),
            message: 'Query execution not yet implemented'
        };
    }

    // Helper methods
    private generateGraphId(): string {
        return `kg_${this.nextGraphId++}`;
    }

    private generateCategoryId(): string {
        return `cat_${this.nextCategoryId++}`;
    }

    private generateRelationshipId(): string {
        return `rel_${this.nextRelationshipId++}`;
    }

    private async updateQualityMetrics(graph: KnowledgeGraph): Promise<void> {
        // Calculate completeness based on relationship density
        const relationshipDensity = graph.atoms.length > 0 ? 
            graph.relationships.length / (graph.atoms.length * (graph.atoms.length - 1) / 2) : 0;
        graph.metadata.quality.completeness = Math.min(1, relationshipDensity * 2);

        // Update freshness based on last modification
        const daysSinceUpdate = (Date.now() - graph.metadata.usage.lastModified) / (1000 * 60 * 60 * 24);
        graph.metadata.quality.freshness = Math.max(0, 1 - (daysSinceUpdate / 30)); // Decay over 30 days

        // Consistency remains high unless validation issues are found
        // (Would be updated by validation methods)
        
        graph.metadata.updatedAt = Date.now();
    }

    private async calculateRelevanceScore(atom: Atom, seedConcepts: string[], graph: KnowledgeGraph): Promise<number> {
        let score = 0;

        // Simple relevance calculation based on relationship proximity
        for (const seedConcept of seedConcepts) {
            const path = await this.findRelationshipPath(seedConcept, atom.id!, graph);
            if (path.length > 0) {
                score += 1 / (path.length + 1); // Closer relationships have higher scores
            }
        }

        // Factor in truth value strength if available
        if (atom.truthValue) {
            score *= atom.truthValue.strength;
        }

        return Math.min(1, score);
    }

    private async findRelationshipPath(sourceAtomId: string, targetAtomId: string, graph: KnowledgeGraph): Promise<KnowledgeRelationship[]> {
        // Simple breadth-first search for relationship path
        const queue: Array<{ atomId: string; path: KnowledgeRelationship[] }> = [{ atomId: sourceAtomId, path: [] }];
        const visited = new Set<string>();

        while (queue.length > 0) {
            const current = queue.shift()!;
            
            if (visited.has(current.atomId)) {
                continue;
            }
            visited.add(current.atomId);

            if (current.atomId === targetAtomId) {
                return current.path;
            }

            // Find connected relationships
            for (const relationship of graph.relationships) {
                let nextAtomId: string | undefined;
                if (relationship.source === current.atomId) {
                    nextAtomId = relationship.target;
                } else if (relationship.target === current.atomId) {
                    nextAtomId = relationship.source;
                }

                if (nextAtomId && !visited.has(nextAtomId)) {
                    queue.push({
                        atomId: nextAtomId,
                        path: [...current.path, relationship]
                    });
                }
            }
        }

        return [];
    }

    private generateDiscoveryExplanation(atom: Atom, path: KnowledgeRelationship[], relevanceScore: number): string {
        if (path.length === 0) {
            return `Concept "${atom.name}" has a relevance score of ${relevanceScore.toFixed(2)}`;
        }
        
        return `Concept "${atom.name}" is connected through ${path.length} relationship(s) with relevance score ${relevanceScore.toFixed(2)}`;
    }

    private async evaluateCategoryRule(atom: Atom, rule: any): Promise<boolean> {
        // Simple rule evaluation based on atom properties
        switch (rule.type) {
            case 'pattern':
                return atom.name?.includes(rule.condition) || atom.type.includes(rule.condition);
            case 'semantic':
                // Would implement semantic matching
                return false;
            case 'context':
                // Would implement context-based matching
                return false;
            case 'manual':
                return false;
            default:
                return false;
        }
    }

    private async findContradictions(graph: KnowledgeGraph): Promise<KnowledgeValidationIssue[]> {
        const issues: KnowledgeValidationIssue[] = [];
        
        // Look for contradictory relationships
        for (let i = 0; i < graph.relationships.length; i++) {
            for (let j = i + 1; j < graph.relationships.length; j++) {
                const rel1 = graph.relationships[i];
                const rel2 = graph.relationships[j];
                
                // Check for direct contradictions (e.g., A implies B and A contradicts B)
                if (rel1.source === rel2.source && rel1.target === rel2.target) {
                    if ((rel1.type === 'implies' && rel2.type === 'contradicts') ||
                        (rel1.type === 'contradicts' && rel2.type === 'implies')) {
                        issues.push({
                            type: 'contradiction',
                            severity: 'high',
                            description: `Contradictory relationships between ${rel1.source} and ${rel1.target}`,
                            affectedAtoms: [rel1.source, rel1.target]
                        });
                    }
                }
            }
        }

        return issues;
    }

    private generateValidationSuggestions(issues: KnowledgeValidationIssue[]): any[] {
        return issues.map(issue => ({
            type: 'update',
            description: `Address ${issue.type}: ${issue.description}`,
            confidence: 0.7,
            impact: issue.severity === 'critical' ? 'high' : issue.severity === 'high' ? 'medium' : 'low',
            atoms: issue.affectedAtoms
        }));
    }

    private estimateMemoryUsage(): number {
        // Simple memory usage estimation
        const graphsSize = JSON.stringify(Array.from(this.knowledgeGraphs.values())).length;
        const categoriesSize = JSON.stringify(Array.from(this.categories.values())).length;
        return graphsSize + categoriesSize;
    }
}