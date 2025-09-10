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

import { expect } from 'chai';
import { Container } from '@theia/core/shared/inversify';
import { KnowledgeManagementServiceImpl } from '../node/knowledge-management-service-impl';
import { 
    KnowledgeManagementService,
    KnowledgeGraph,
    KnowledgeCategory,
    KnowledgeDiscoveryQuery,
    KnowledgeRelationship
} from '../common/knowledge-management-types';
import { Atom } from '../common/opencog-types';

describe('KnowledgeManagementService', () => {
    let kmService: KnowledgeManagementService;

    beforeEach(() => {
        const container = new Container();
        container.bind(KnowledgeManagementServiceImpl).toSelf().inSingletonScope();
        kmService = container.get(KnowledgeManagementServiceImpl);
    });

    describe('Knowledge Graph Management', () => {
        it('should create and retrieve knowledge graphs', async () => {
            const graph = await kmService.createKnowledgeGraph(
                'Test Graph',
                'software-engineering',
                'A test knowledge graph for software engineering concepts'
            );

            expect(graph).to.exist;
            expect(graph.name).to.equal('Test Graph');
            expect(graph.domain).to.equal('software-engineering');
            expect(graph.description).to.equal('A test knowledge graph for software engineering concepts');
            expect(graph.atoms).to.be.an('array').that.is.empty;
            expect(graph.relationships).to.be.an('array').that.is.empty;

            const retrievedGraph = await kmService.getKnowledgeGraph(graph.id);
            expect(retrievedGraph).to.deep.equal(graph);
        });

        it('should list knowledge graphs by domain', async () => {
            await kmService.createKnowledgeGraph('Graph 1', 'domain-a');
            await kmService.createKnowledgeGraph('Graph 2', 'domain-b');
            await kmService.createKnowledgeGraph('Graph 3', 'domain-a');

            const allGraphs = await kmService.getKnowledgeGraphs();
            expect(allGraphs).to.have.length(3);

            const domainAGraphs = await kmService.getKnowledgeGraphs('domain-a');
            expect(domainAGraphs).to.have.length(2);

            const domainBGraphs = await kmService.getKnowledgeGraphs('domain-b');
            expect(domainBGraphs).to.have.length(1);
        });

        it('should add and remove atoms from knowledge graphs', async () => {
            const graph = await kmService.createKnowledgeGraph('Test Graph', 'test');
            
            const atom: Atom = {
                type: 'ConceptNode',
                name: 'function',
                truthValue: { strength: 0.9, confidence: 0.8 }
            };

            const success = await kmService.addAtomToGraph(graph.id, atom);
            expect(success).to.be.true;

            const updatedGraph = await kmService.getKnowledgeGraph(graph.id);
            expect(updatedGraph?.atoms).to.have.length(1);
            expect(updatedGraph?.atoms[0].name).to.equal('function');
            expect(updatedGraph?.atoms[0].id).to.exist;

            const atomId = updatedGraph!.atoms[0].id!;
            const removeSuccess = await kmService.removeAtomFromGraph(graph.id, atomId);
            expect(removeSuccess).to.be.true;

            const finalGraph = await kmService.getKnowledgeGraph(graph.id);
            expect(finalGraph?.atoms).to.have.length(0);
        });

        it('should manage relationships between atoms', async () => {
            const graph = await kmService.createKnowledgeGraph('Relationship Test', 'test');
            
            const atom1: Atom = { type: 'ConceptNode', name: 'class' };
            const atom2: Atom = { type: 'ConceptNode', name: 'method' };
            
            await kmService.addAtomToGraph(graph.id, atom1);
            await kmService.addAtomToGraph(graph.id, atom2);
            
            const updatedGraph = await kmService.getKnowledgeGraph(graph.id);
            const atomId1 = updatedGraph!.atoms[0].id!;
            const atomId2 = updatedGraph!.atoms[1].id!;

            const relationship: KnowledgeRelationship = {
                id: '',
                type: 'contains',
                source: atomId1,
                target: atomId2,
                strength: 0.9,
                confidence: 0.8
            };

            const success = await kmService.addRelationship(graph.id, relationship);
            expect(success).to.be.true;

            const graphWithRel = await kmService.getKnowledgeGraph(graph.id);
            expect(graphWithRel?.relationships).to.have.length(1);
            expect(graphWithRel?.relationships[0].type).to.equal('contains');
            expect(graphWithRel?.relationships[0].source).to.equal(atomId1);
            expect(graphWithRel?.relationships[0].target).to.equal(atomId2);
        });
    });

    describe('Knowledge Discovery', () => {
        beforeEach(async () => {
            // Setup test knowledge graph
            const graph = await kmService.createKnowledgeGraph('Discovery Test', 'software');
            
            const atoms = [
                { type: 'ConceptNode', name: 'class' },
                { type: 'ConceptNode', name: 'method' },
                { type: 'ConceptNode', name: 'variable' },
                { type: 'ConceptNode', name: 'function' }
            ];

            for (const atom of atoms) {
                await kmService.addAtomToGraph(graph.id, atom);
            }

            const updatedGraph = await kmService.getKnowledgeGraph(graph.id);
            const atomIds = updatedGraph!.atoms.map(a => a.id!);

            // Add relationships
            const relationships: Omit<KnowledgeRelationship, 'id'>[] = [
                { type: 'contains', source: atomIds[0], target: atomIds[1], strength: 0.9, confidence: 0.8 },
                { type: 'contains', source: atomIds[1], target: atomIds[2], strength: 0.8, confidence: 0.7 },
                { type: 'relates-to', source: atomIds[1], target: atomIds[3], strength: 0.7, confidence: 0.6 }
            ];

            for (const rel of relationships) {
                await kmService.addRelationship(graph.id, rel as KnowledgeRelationship);
            }
        });

        it('should discover related knowledge', async () => {
            const query: KnowledgeDiscoveryQuery = {
                type: 'semantic',
                seedConcepts: ['class'],
                scope: 'global',
                maxResults: 10
            };

            const results = await kmService.discoverKnowledge(query);
            expect(results).to.be.an('array');
            expect(results.length).to.be.greaterThan(0);

            // Should find related concepts like 'method' and 'variable'
            const conceptNames = results.map(r => r.concept.name);
            expect(conceptNames).to.include('method');
        });

        it('should find similar concepts', async () => {
            const graphs = await kmService.getKnowledgeGraphs('software');
            const graph = graphs[0];
            const classAtom = graph.atoms.find(a => a.name === 'class');
            
            const similar = await kmService.findSimilarConcepts(classAtom!.id!, 5);
            expect(similar).to.be.an('array');
            expect(similar.length).to.be.greaterThan(0);
        });

        it('should find concept paths', async () => {
            const graphs = await kmService.getKnowledgeGraphs('software');
            const graph = graphs[0];
            const classAtom = graph.atoms.find(a => a.name === 'class');
            const variableAtom = graph.atoms.find(a => a.name === 'variable');
            
            const path = await kmService.getConceptPath(classAtom!.id!, variableAtom!.id!);
            expect(path).to.be.an('array');
            expect(path.length).to.be.greaterThan(0);
        });

        it('should get related concepts within distance', async () => {
            const graphs = await kmService.getKnowledgeGraphs('software');
            const graph = graphs[0];
            const classAtom = graph.atoms.find(a => a.name === 'class');
            
            const related = await kmService.getRelatedConcepts(classAtom!.id!, 2);
            expect(related).to.be.an('array');
            expect(related.length).to.be.greaterThan(0);
            
            const names = related.map(a => a.name);
            expect(names).to.include('method');
        });
    });

    describe('Knowledge Categorization', () => {
        it('should create and manage categories', async () => {
            const category: KnowledgeCategory = {
                id: '',
                name: 'Object-Oriented Programming',
                description: 'Concepts related to OOP',
                subcategories: [],
                associatedGraphs: [],
                rules: [{
                    id: 'rule1',
                    type: 'pattern',
                    condition: 'class',
                    action: 'include',
                    weight: 1.0
                }]
            };

            const categoryId = await kmService.createCategory(category);
            expect(categoryId).to.be.a('string');

            const categories = await kmService.getCategories();
            expect(categories).to.have.length(1);
            expect(categories[0].name).to.equal('Object-Oriented Programming');
        });

        it('should categorize atoms automatically', async () => {
            // Create category first
            const category: KnowledgeCategory = {
                id: '',
                name: 'Programming Concepts',
                subcategories: [],
                associatedGraphs: [],
                rules: [{
                    id: 'rule1',
                    type: 'pattern',
                    condition: 'class',
                    action: 'include',
                    weight: 1.0
                }]
            };
            await kmService.createCategory(category);

            // Create graph with atoms
            const graph = await kmService.createKnowledgeGraph('Test', 'programming');
            await kmService.addAtomToGraph(graph.id, { type: 'ConceptNode', name: 'class' });
            await kmService.addAtomToGraph(graph.id, { type: 'ConceptNode', name: 'interface' });

            const categorization = await kmService.categorizeAtoms(graph.id);
            expect(categorization).to.be.instanceOf(Map);
            expect(categorization.size).to.be.greaterThan(0);
        });
    });

    describe('Knowledge Validation', () => {
        it('should validate knowledge graphs', async () => {
            const graph = await kmService.createKnowledgeGraph('Validation Test', 'test');
            
            const validation = await kmService.validateKnowledgeGraph(graph.id);
            expect(validation).to.have.property('isValid');
            expect(validation).to.have.property('confidence');
            expect(validation).to.have.property('issues');
            expect(validation).to.have.property('suggestions');
            expect(validation.isValid).to.be.a('boolean');
            expect(validation.confidence).to.be.a('number');
        });

        it('should detect contradictions', async () => {
            const graph = await kmService.createKnowledgeGraph('Contradiction Test', 'test');
            
            // Add atoms
            const atom1: Atom = { type: 'ConceptNode', name: 'A' };
            const atom2: Atom = { type: 'ConceptNode', name: 'B' };
            await kmService.addAtomToGraph(graph.id, atom1);
            await kmService.addAtomToGraph(graph.id, atom2);

            const updatedGraph = await kmService.getKnowledgeGraph(graph.id);
            const atomIds = updatedGraph!.atoms.map(a => a.id!);

            // Add contradictory relationships
            await kmService.addRelationship(graph.id, {
                id: '',
                type: 'implies',
                source: atomIds[0],
                target: atomIds[1],
                strength: 0.9,
                confidence: 0.8
            });

            await kmService.addRelationship(graph.id, {
                id: '',
                type: 'contradicts',
                source: atomIds[0],
                target: atomIds[1],
                strength: 0.9,
                confidence: 0.8
            });

            const contradictions = await kmService.detectContradictions(graph.id);
            expect(contradictions.issues.length).to.be.greaterThan(0);
            expect(contradictions.issues[0].type).to.equal('contradiction');
        });
    });

    describe('Knowledge Persistence and Transfer', () => {
        it('should export and import knowledge graphs', async () => {
            const graph = await kmService.createKnowledgeGraph('Export Test', 'test');
            await kmService.addAtomToGraph(graph.id, { type: 'ConceptNode', name: 'test-concept' });

            const exportOptions = {
                includeMetadata: true,
                includeRelationships: true,
                format: 'json' as const
            };

            const exportedData = await kmService.exportKnowledgeGraph(graph.id, exportOptions);
            expect(exportedData).to.be.a('string');

            const parsedData = JSON.parse(exportedData);
            expect(parsedData).to.have.property('graph');
            expect(parsedData.graph).to.have.property('atoms');
            expect(parsedData.graph.atoms).to.have.length(1);

            const newGraphId = await kmService.importKnowledgeGraph(exportedData, exportOptions);
            expect(newGraphId).to.be.a('string');

            const importedGraph = await kmService.getKnowledgeGraph(newGraphId);
            expect(importedGraph?.atoms).to.have.length(1);
            expect(importedGraph?.atoms[0].name).to.equal('test-concept');
        });
    });

    describe('Knowledge Metrics and Analytics', () => {
        it('should provide knowledge metrics', async () => {
            // Create some test data
            await kmService.createKnowledgeGraph('Metrics Test 1', 'domain1');
            await kmService.createKnowledgeGraph('Metrics Test 2', 'domain2');

            const metrics = await kmService.getKnowledgeMetrics();
            expect(metrics).to.have.property('totalGraphs');
            expect(metrics).to.have.property('totalAtoms');
            expect(metrics).to.have.property('totalRelationships');
            expect(metrics).to.have.property('averageQuality');
            expect(metrics).to.have.property('memoryUsage');
            expect(metrics).to.have.property('queryPerformance');
            expect(metrics).to.have.property('growthRate');

            expect(metrics.totalGraphs).to.equal(2);
            expect(metrics.totalAtoms).to.be.a('number');
            expect(metrics.averageQuality).to.have.property('completeness');
        });

        it('should provide usage statistics for graphs', async () => {
            const graph = await kmService.createKnowledgeGraph('Usage Test', 'test');
            
            const stats = await kmService.getGraphUsageStats(graph.id);
            expect(stats).to.have.property('accessCount');
            expect(stats).to.have.property('lastAccessed');
            expect(stats).to.have.property('modificationCount');
            expect(stats).to.have.property('atomCount');
            expect(stats).to.have.property('relationshipCount');
        });

        it('should recommend improvements', async () => {
            const graph = await kmService.createKnowledgeGraph('Improvement Test', 'test');
            
            const recommendations = await kmService.recommendImprovements(graph.id);
            expect(recommendations).to.be.an('array');
            expect(recommendations.length).to.be.greaterThan(0);
            expect(recommendations[0]).to.be.a('string');
        });
    });

    describe('Search and Query', () => {
        beforeEach(async () => {
            const graph = await kmService.createKnowledgeGraph('Search Test', 'programming');
            const atoms = [
                { type: 'ConceptNode', name: 'JavaScript' },
                { type: 'ConceptNode', name: 'TypeScript' },
                { type: 'ConceptNode', name: 'Python' },
                { type: 'FunctionNode', name: 'console.log' }
            ];

            for (const atom of atoms) {
                await kmService.addAtomToGraph(graph.id, atom);
            }
        });

        it('should search atoms across knowledge graphs', async () => {
            const results = await kmService.searchAtoms('Script');
            expect(results).to.be.an('array');
            expect(results.length).to.be.greaterThan(0);

            const names = results.map(a => a.name);
            expect(names).to.include('JavaScript');
            expect(names).to.include('TypeScript');
        });

        it('should search with domain filters', async () => {
            const results = await kmService.searchAtoms('Script', {
                domains: ['programming'],
                maxResults: 10
            });

            expect(results).to.be.an('array');
            expect(results.length).to.be.greaterThan(0);
        });

        it('should execute knowledge queries', async () => {
            const query = {
                type: 'find-concepts',
                criteria: { domain: 'programming' }
            };

            const result = await kmService.executeKnowledgeQuery(query);
            expect(result).to.have.property('query');
            expect(result).to.have.property('results');
            expect(result).to.have.property('executionTime');
        });
    });
});