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
import { Proxy, ProxyFactory } from '@theia/core/lib/common/messaging/proxy-factory';
import {
    KnowledgeManagementService,
    KNOWLEDGE_MANAGEMENT_SERVICE_PATH,
    KnowledgeGraph,
    KnowledgeCategory,
    KnowledgeDiscoveryQuery,
    KnowledgeDiscoveryResult,
    KnowledgeValidationResult,
    KnowledgePersistenceConfig,
    KnowledgeTransferOptions,
    KnowledgeMetrics,
    KnowledgeRelationship
} from '../common/knowledge-management-types';
import { Atom } from '../common/opencog-types';

/**
 * Frontend proxy for Knowledge Management Service
 */
@injectable()
export class FrontendKnowledgeManagementService implements KnowledgeManagementService {
    
    protected readonly proxy: Proxy<KnowledgeManagementService>;

    constructor(@inject(ProxyFactory) proxyFactory: ProxyFactory) {
        this.proxy = proxyFactory.createProxy<KnowledgeManagementService>(KNOWLEDGE_MANAGEMENT_SERVICE_PATH);
    }

    // Knowledge Graph Management
    async createKnowledgeGraph(name: string, domain: string, description?: string): Promise<KnowledgeGraph> {
        return this.proxy.createKnowledgeGraph(name, domain, description);
    }

    async getKnowledgeGraph(graphId: string): Promise<KnowledgeGraph | undefined> {
        return this.proxy.getKnowledgeGraph(graphId);
    }

    async getKnowledgeGraphs(domain?: string): Promise<KnowledgeGraph[]> {
        return this.proxy.getKnowledgeGraphs(domain);
    }

    async updateKnowledgeGraph(graphId: string, updates: Partial<KnowledgeGraph>): Promise<boolean> {
        return this.proxy.updateKnowledgeGraph(graphId, updates);
    }

    async deleteKnowledgeGraph(graphId: string): Promise<boolean> {
        return this.proxy.deleteKnowledgeGraph(graphId);
    }

    async addAtomToGraph(graphId: string, atom: Atom): Promise<boolean> {
        return this.proxy.addAtomToGraph(graphId, atom);
    }

    async removeAtomFromGraph(graphId: string, atomId: string): Promise<boolean> {
        return this.proxy.removeAtomFromGraph(graphId, atomId);
    }

    async addRelationship(graphId: string, relationship: KnowledgeRelationship): Promise<boolean> {
        return this.proxy.addRelationship(graphId, relationship);
    }

    async removeRelationship(graphId: string, relationshipId: string): Promise<boolean> {
        return this.proxy.removeRelationship(graphId, relationshipId);
    }

    // Knowledge Discovery
    async discoverKnowledge(query: KnowledgeDiscoveryQuery): Promise<KnowledgeDiscoveryResult[]> {
        return this.proxy.discoverKnowledge(query);
    }

    async findSimilarConcepts(atomId: string, maxResults?: number): Promise<KnowledgeDiscoveryResult[]> {
        return this.proxy.findSimilarConcepts(atomId, maxResults);
    }

    async getConceptPath(sourceAtomId: string, targetAtomId: string): Promise<KnowledgeRelationship[]> {
        return this.proxy.getConceptPath(sourceAtomId, targetAtomId);
    }

    async getRelatedConcepts(atomId: string, maxDistance: number): Promise<Atom[]> {
        return this.proxy.getRelatedConcepts(atomId, maxDistance);
    }

    // Knowledge Categorization
    async createCategory(category: KnowledgeCategory): Promise<string> {
        return this.proxy.createCategory(category);
    }

    async getCategories(): Promise<KnowledgeCategory[]> {
        return this.proxy.getCategories();
    }

    async categorizeAtoms(graphId: string): Promise<Map<string, string[]>> {
        return this.proxy.categorizeAtoms(graphId);
    }

    async getAtomsByCategory(categoryId: string): Promise<Atom[]> {
        return this.proxy.getAtomsByCategory(categoryId);
    }

    // Knowledge Validation
    async validateKnowledgeGraph(graphId: string): Promise<KnowledgeValidationResult> {
        return this.proxy.validateKnowledgeGraph(graphId);
    }

    async validateAtom(atomId: string): Promise<KnowledgeValidationResult> {
        return this.proxy.validateAtom(atomId);
    }

    async detectContradictions(graphId?: string): Promise<KnowledgeValidationResult> {
        return this.proxy.detectContradictions(graphId);
    }

    // Knowledge Persistence
    async configurePersistence(config: KnowledgePersistenceConfig): Promise<void> {
        return this.proxy.configurePersistence(config);
    }

    async saveKnowledgeGraph(graphId: string): Promise<boolean> {
        return this.proxy.saveKnowledgeGraph(graphId);
    }

    async loadKnowledgeGraph(graphId: string): Promise<KnowledgeGraph | undefined> {
        return this.proxy.loadKnowledgeGraph(graphId);
    }

    async exportKnowledgeGraph(graphId: string, options: KnowledgeTransferOptions): Promise<string> {
        return this.proxy.exportKnowledgeGraph(graphId, options);
    }

    async importKnowledgeGraph(data: string, options: KnowledgeTransferOptions): Promise<string> {
        return this.proxy.importKnowledgeGraph(data, options);
    }

    // Knowledge Metrics and Analytics
    async getKnowledgeMetrics(): Promise<KnowledgeMetrics> {
        return this.proxy.getKnowledgeMetrics();
    }

    async optimizeKnowledgeGraphs(): Promise<void> {
        return this.proxy.optimizeKnowledgeGraphs();
    }

    async getGraphUsageStats(graphId: string): Promise<Record<string, any>> {
        return this.proxy.getGraphUsageStats(graphId);
    }

    async recommendImprovements(graphId: string): Promise<string[]> {
        return this.proxy.recommendImprovements(graphId);
    }

    // Search and Query
    async searchAtoms(query: string, options?: {
        domains?: string[];
        categories?: string[];
        maxResults?: number;
    }): Promise<Atom[]> {
        return this.proxy.searchAtoms(query, options);
    }

    async executeKnowledgeQuery(query: any): Promise<any> {
        return this.proxy.executeKnowledgeQuery(query);
    }
}