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

import { Atom, TruthValue } from './opencog-types';

/**
 * Knowledge graph representation for organizing related concepts
 */
export interface KnowledgeGraph {
    id: string;
    name: string;
    description?: string;
    domain: string;
    atoms: Atom[];
    relationships: KnowledgeRelationship[];
    metadata: KnowledgeGraphMetadata;
}

/**
 * Relationship between knowledge entities
 */
export interface KnowledgeRelationship {
    id: string;
    type: 'contains' | 'relates-to' | 'implies' | 'contradicts' | 'extends' | 'depends-on';
    source: string; // Atom ID
    target: string; // Atom ID
    strength: number; // 0-1
    confidence: number; // 0-1
    metadata?: Record<string, any>;
}

/**
 * Metadata for knowledge graphs
 */
export interface KnowledgeGraphMetadata {
    createdAt: number;
    updatedAt: number;
    version: string;
    author?: string;
    tags: string[];
    quality: KnowledgeQuality;
    usage: KnowledgeUsage;
}

/**
 * Quality metrics for knowledge
 */
export interface KnowledgeQuality {
    completeness: number; // 0-1
    consistency: number; // 0-1
    accuracy: number; // 0-1
    relevance: number; // 0-1
    freshness: number; // 0-1
}

/**
 * Usage metrics for knowledge
 */
export interface KnowledgeUsage {
    accessCount: number;
    lastAccessed: number;
    modificationCount: number;
    lastModified: number;
    queryCount: number;
}

/**
 * Knowledge category for organizing different types of knowledge
 */
export interface KnowledgeCategory {
    id: string;
    name: string;
    description?: string;
    parentCategory?: string;
    subcategories: string[];
    associatedGraphs: string[];
    rules: KnowledgeCategoryRule[];
}

/**
 * Rules for categorizing knowledge
 */
export interface KnowledgeCategoryRule {
    id: string;
    type: 'pattern' | 'semantic' | 'context' | 'manual';
    condition: any;
    action: 'include' | 'exclude' | 'promote' | 'demote';
    weight: number;
}

/**
 * Query for discovering knowledge
 */
export interface KnowledgeDiscoveryQuery {
    type: 'semantic' | 'structural' | 'temporal' | 'usage-based';
    seedConcepts: string[]; // Atom IDs or names
    scope: 'local' | 'global' | 'domain-specific';
    maxResults: number;
    filters?: KnowledgeDiscoveryFilter[];
    parameters?: Record<string, any>;
}

/**
 * Filters for knowledge discovery
 */
export interface KnowledgeDiscoveryFilter {
    type: 'domain' | 'quality' | 'recency' | 'relevance' | 'category';
    operator: 'equals' | 'greater-than' | 'less-than' | 'contains' | 'matches';
    value: any;
}

/**
 * Result from knowledge discovery
 */
export interface KnowledgeDiscoveryResult {
    concept: Atom;
    relevanceScore: number;
    relationshipPath: KnowledgeRelationship[];
    explanation: string;
    metadata: Record<string, any>;
}

/**
 * Knowledge validation result
 */
export interface KnowledgeValidationResult {
    isValid: boolean;
    confidence: number;
    issues: KnowledgeValidationIssue[];
    suggestions: KnowledgeValidationSuggestion[];
}

/**
 * Knowledge validation issue
 */
export interface KnowledgeValidationIssue {
    type: 'inconsistency' | 'incompleteness' | 'outdated' | 'contradiction' | 'low-quality';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedAtoms: string[];
    suggestedFix?: string;
}

/**
 * Knowledge validation suggestion
 */
export interface KnowledgeValidationSuggestion {
    type: 'merge' | 'split' | 'update' | 'remove' | 'enhance';
    description: string;
    confidence: number;
    impact: 'low' | 'medium' | 'high';
    atoms: string[];
}

/**
 * Knowledge persistence configuration
 */
export interface KnowledgePersistenceConfig {
    format: 'json' | 'rdf' | 'atomese' | 'custom';
    compression: boolean;
    encryption: boolean;
    versioning: boolean;
    backup: boolean;
}

/**
 * Knowledge import/export options
 */
export interface KnowledgeTransferOptions {
    includeMetadata: boolean;
    includeRelationships: boolean;
    filterByCategory?: string[];
    filterByQuality?: KnowledgeQuality;
    format: 'json' | 'rdf' | 'atomese' | 'csv';
}

/**
 * Knowledge metrics for monitoring and optimization
 */
export interface KnowledgeMetrics {
    totalGraphs: number;
    totalAtoms: number;
    totalRelationships: number;
    averageQuality: KnowledgeQuality;
    memoryUsage: number;
    queryPerformance: {
        averageResponseTime: number;
        slowQueries: number;
        cacheHitRate: number;
    };
    growthRate: {
        atomsPerDay: number;
        relationshipsPerDay: number;
        queriesPerDay: number;
    };
}