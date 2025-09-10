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

import {
    KnowledgeGraph,
    KnowledgeCategory,
    KnowledgeDiscoveryQuery,
    KnowledgeDiscoveryResult,
    KnowledgeValidationResult,
    KnowledgePersistenceConfig,
    KnowledgeTransferOptions,
    KnowledgeMetrics,
    KnowledgeRelationship
} from './knowledge-management-types';
import { Atom } from './opencog-types';

export const KNOWLEDGE_MANAGEMENT_SERVICE_PATH = '/services/knowledge-management';

/**
 * Knowledge Management Service for organizing and managing cognitive knowledge
 */
export interface KnowledgeManagementService {
    
    // Knowledge Graph Management
    /**
     * Create a new knowledge graph
     */
    createKnowledgeGraph(name: string, domain: string, description?: string): Promise<KnowledgeGraph>;
    
    /**
     * Get a knowledge graph by ID
     */
    getKnowledgeGraph(graphId: string): Promise<KnowledgeGraph | undefined>;
    
    /**
     * Get all knowledge graphs, optionally filtered by domain
     */
    getKnowledgeGraphs(domain?: string): Promise<KnowledgeGraph[]>;
    
    /**
     * Update a knowledge graph
     */
    updateKnowledgeGraph(graphId: string, updates: Partial<KnowledgeGraph>): Promise<boolean>;
    
    /**
     * Delete a knowledge graph
     */
    deleteKnowledgeGraph(graphId: string): Promise<boolean>;
    
    /**
     * Add an atom to a knowledge graph
     */
    addAtomToGraph(graphId: string, atom: Atom): Promise<boolean>;
    
    /**
     * Remove an atom from a knowledge graph
     */
    removeAtomFromGraph(graphId: string, atomId: string): Promise<boolean>;
    
    /**
     * Add a relationship between atoms
     */
    addRelationship(graphId: string, relationship: KnowledgeRelationship): Promise<boolean>;
    
    /**
     * Remove a relationship
     */
    removeRelationship(graphId: string, relationshipId: string): Promise<boolean>;
    
    // Knowledge Discovery
    /**
     * Discover related knowledge based on a query
     */
    discoverKnowledge(query: KnowledgeDiscoveryQuery): Promise<KnowledgeDiscoveryResult[]>;
    
    /**
     * Find concepts similar to a given concept
     */
    findSimilarConcepts(atomId: string, maxResults?: number): Promise<KnowledgeDiscoveryResult[]>;
    
    /**
     * Get the shortest path between two concepts
     */
    getConceptPath(sourceAtomId: string, targetAtomId: string): Promise<KnowledgeRelationship[]>;
    
    /**
     * Get all concepts related to a given concept within a specified distance
     */
    getRelatedConcepts(atomId: string, maxDistance: number): Promise<Atom[]>;
    
    // Knowledge Categorization
    /**
     * Create a new knowledge category
     */
    createCategory(category: KnowledgeCategory): Promise<string>;
    
    /**
     * Get all categories
     */
    getCategories(): Promise<KnowledgeCategory[]>;
    
    /**
     * Categorize atoms automatically based on rules
     */
    categorizeAtoms(graphId: string): Promise<Record<string, string[]>>; // atomId -> categoryIds
    
    /**
     * Get atoms by category
     */
    getAtomsByCategory(categoryId: string): Promise<Atom[]>;
    
    // Knowledge Validation
    /**
     * Validate knowledge graph for consistency and quality
     */
    validateKnowledgeGraph(graphId: string): Promise<KnowledgeValidationResult>;
    
    /**
     * Validate a specific atom and its relationships
     */
    validateAtom(atomId: string): Promise<KnowledgeValidationResult>;
    
    /**
     * Check for contradictions in the knowledge base
     */
    detectContradictions(graphId?: string): Promise<KnowledgeValidationResult>;
    
    // Knowledge Persistence
    /**
     * Configure persistence settings
     */
    configurePersistence(config: KnowledgePersistenceConfig): Promise<void>;
    
    /**
     * Save knowledge graph to persistent storage
     */
    saveKnowledgeGraph(graphId: string): Promise<boolean>;
    
    /**
     * Load knowledge graph from persistent storage
     */
    loadKnowledgeGraph(graphId: string): Promise<KnowledgeGraph | undefined>;
    
    /**
     * Export knowledge graph
     */
    exportKnowledgeGraph(graphId: string, options: KnowledgeTransferOptions): Promise<string>;
    
    /**
     * Import knowledge graph from external data
     */
    importKnowledgeGraph(data: string, options: KnowledgeTransferOptions): Promise<string>; // returns new graph ID
    
    // Knowledge Metrics and Analytics
    /**
     * Get knowledge management metrics
     */
    getKnowledgeMetrics(): Promise<KnowledgeMetrics>;
    
    /**
     * Optimize knowledge graphs for better performance
     */
    optimizeKnowledgeGraphs(): Promise<void>;
    
    /**
     * Get usage statistics for a knowledge graph
     */
    getGraphUsageStats(graphId: string): Promise<Record<string, any>>;
    
    /**
     * Recommend knowledge improvements
     */
    recommendImprovements(graphId: string): Promise<string[]>;
    
    // Search and Query
    /**
     * Search for atoms across all knowledge graphs
     */
    searchAtoms(query: string, options?: { 
        domains?: string[];
        categories?: string[];
        maxResults?: number;
    }): Promise<Atom[]>;
    
    /**
     * Execute a complex query across knowledge graphs
     */
    executeKnowledgeQuery(query: any): Promise<any>;
}

export const KnowledgeManagementService = 'KnowledgeManagementService';