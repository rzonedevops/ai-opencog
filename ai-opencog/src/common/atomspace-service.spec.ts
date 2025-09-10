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
import { AtomSpaceService } from '../node/atomspace-service';
import { Atom, PatternInput } from '../common/opencog-types';

describe('AtomSpaceService', () => {
    let atomSpaceService: AtomSpaceService;

    beforeEach(() => {
        const container = new Container();
        container.bind(AtomSpaceService).toSelf().inSingletonScope();
        atomSpaceService = container.get(AtomSpaceService);
    });

    it('should add and retrieve atoms', async () => {
        const atom: Atom = {
            type: 'ConceptNode',
            name: 'test-concept',
            truthValue: { strength: 0.8, confidence: 0.9 }
        };

        const atomId = await atomSpaceService.addAtom(atom);
        expect(atomId).to.be.a('string');
        expect(atomId).to.match(/^atom_\d+$/);

        const atoms = await atomSpaceService.queryAtoms({ type: 'ConceptNode' });
        expect(atoms).to.have.length(1);
        expect(atoms[0].name).to.equal('test-concept');
        expect(atoms[0].type).to.equal('ConceptNode');
    });

    it('should perform advanced reasoning with PLN engine', async () => {
        // Add some test atoms for reasoning
        await atomSpaceService.addAtom({
            type: 'ImplicationLink',
            name: 'test-rule',
            truthValue: { strength: 0.9, confidence: 0.8 },
            outgoing: [
                {
                    type: 'ConceptNode',
                    name: 'complex-code',
                    truthValue: { strength: 0.8, confidence: 0.9 }
                },
                {
                    type: 'ConceptNode',
                    name: 'needs-review'
                }
            ]
        });

        const result = await atomSpaceService.reason({
            type: 'deductive',
            context: { domain: 'software-engineering' }
        });

        expect(result).to.have.property('confidence');
        expect(result).to.have.property('explanation');
        expect(result.confidence).to.be.a('number');
        expect(result.explanation).to.be.a('string');
        expect(result.metadata).to.have.property('reasoningType');
    });

    it('should manage AtomSpace size', async () => {
        const initialSize = await atomSpaceService.getAtomSpaceSize();
        expect(initialSize).to.equal(0);

        await atomSpaceService.addAtom({
            type: 'TestNode',
            name: 'test1'
        });

        const sizeAfterAdd = await atomSpaceService.getAtomSpaceSize();
        expect(sizeAfterAdd).to.equal(1);

        await atomSpaceService.clearAtomSpace();
        const sizeAfterClear = await atomSpaceService.getAtomSpaceSize();
        expect(sizeAfterClear).to.equal(0);
    });

    it('should export and import AtomSpace', async () => {
        // Add some test atoms
        await atomSpaceService.addAtom({
            type: 'ConceptNode',
            name: 'concept1',
            truthValue: { strength: 0.7, confidence: 0.8 }
        });

        await atomSpaceService.addAtom({
            type: 'ConceptNode',
            name: 'concept2',
            truthValue: { strength: 0.9, confidence: 0.6 }
        });

        // Export AtomSpace
        const exportedData = await atomSpaceService.exportAtomSpace();
        expect(exportedData).to.be.a('string');

        const parsedData = JSON.parse(exportedData);
        expect(parsedData).to.be.an('array');
        expect(parsedData).to.have.length(2);

        // Clear and import
        await atomSpaceService.clearAtomSpace();
        expect(await atomSpaceService.getAtomSpaceSize()).to.equal(0);

        await atomSpaceService.importAtomSpace(exportedData);
        expect(await atomSpaceService.getAtomSpaceSize()).to.equal(2);

        // Verify imported atoms
        const atoms = await atomSpaceService.queryAtoms({ type: 'ConceptNode' });
        expect(atoms).to.have.length(2);
        
        const names = atoms.map(a => a.name);
        expect(names).to.include('concept1');
        expect(names).to.include('concept2');
    });

    describe('Pattern Recognition', () => {
        it('should recognize code patterns in JavaScript code', async () => {
            const codeInput: PatternInput = {
                data: `
                    function calculateSum(a, b) {
                        return a + b;
                    }
                    
                    const multiply = (x, y) => x * y;
                    
                    class Calculator {
                        add(a, b) {
                            return a + b;
                        }
                    }
                    
                    async function fetchData() {
                        const response = await fetch('/api/data');
                        return response.json();
                    }
                `,
                context: { language: 'javascript' },
                scope: 'local'
            };

            const patterns = await atomSpaceService.recognizePatterns(codeInput);
            
            expect(patterns).to.be.an('array');
            expect(patterns.length).to.be.greaterThan(0);
            
            // Check for function declaration pattern
            const functionPattern = patterns.find(p => p.pattern.name === 'function-declaration');
            expect(functionPattern).to.exist;
            expect(functionPattern!.confidence).to.be.greaterThan(0);
            expect(functionPattern!.instances.length).to.be.greaterThan(0);
        });

        it('should recognize structural patterns in numeric sequences', async () => {
            const sequenceInput: PatternInput = {
                data: [1, 3, 5, 7, 9, 11], // arithmetic sequence
                scope: 'local'
            };

            const patterns = await atomSpaceService.recognizePatterns(sequenceInput);
            
            expect(patterns).to.be.an('array');
            expect(patterns.length).to.be.greaterThan(0);
            
            const sequencePattern = patterns.find(p => p.pattern.type === 'arithmetic-sequence');
            expect(sequencePattern).to.exist;
        });

        it('should handle empty or invalid input gracefully', async () => {
            const emptyInput: PatternInput = {
                data: '',
                scope: 'local'
            };

            const patterns = await atomSpaceService.recognizePatterns(emptyInput);
            expect(patterns).to.be.an('array');
        });
    });

    it('should perform advanced pattern recognition', async () => {
        // Add test atoms for pattern recognition
        await atomSpaceService.addAtom({
            type: 'FunctionNode',
            name: 'getUserData'
        });
        
        await atomSpaceService.addAtom({
            type: 'FunctionNode',
            name: 'setUserData'
        });

        const patterns = await atomSpaceService.recognizePatterns({
            data: await atomSpaceService.queryAtoms({ type: 'FunctionNode' }),
            context: { domain: 'user-management' },
            scope: 'local'
        });

        expect(patterns).to.be.an('array');
        expect(patterns.length).to.be.greaterThan(0);
        
        for (const pattern of patterns) {
            expect(pattern).to.have.property('pattern');
            expect(pattern).to.have.property('confidence');
            expect(pattern).to.have.property('instances');
            expect(pattern.confidence).to.be.a('number');
        }
    });

    it('should perform comprehensive code analysis', async () => {
        // Add code atoms for analysis
        await atomSpaceService.addAtom({
            type: 'FunctionNode',
            name: 'complexFunction',
            metadata: { complexity: 15 }
        });

        const result = await atomSpaceService.reason({
            type: 'code-analysis',
            atoms: await atomSpaceService.queryAtoms({}),
            context: { 
                language: 'typescript',
                fileUri: 'test.ts'
            }
        });

        expect(result).to.have.property('confidence');
        expect(result).to.have.property('explanation');
        expect(result.metadata).to.have.property('reasoningType', 'code-analysis');
        expect(result.metadata).to.have.property('qualityMetrics');
        expect(result.metadata).to.have.property('suggestions');
        expect(result.metadata.suggestions).to.be.an('array');
    });

    it('should perform enhanced learning with feedback', async () => {
        const learningData = {
            type: 'supervised' as const,
            input: { codeSnippet: 'function test() {}' },
            expectedOutput: { suggestion: 'Add type annotations' },
            feedback: {
                rating: 4,
                helpful: true,
                comment: 'Good suggestion',
                actionTaken: 'applied'
            },
            context: { language: 'typescript' },
            timestamp: Date.now()
        };

        // Should not throw
        await atomSpaceService.learn(learningData);

        // Verify learning atom was created
        const learningAtoms = await atomSpaceService.queryAtoms({ type: 'LearningRecord' });
        expect(learningAtoms.length).to.be.greaterThan(0);
        
        const recentLearning = learningAtoms[learningAtoms.length - 1];
        expect(recentLearning.metadata).to.have.property('learningType', 'supervised');
        expect(recentLearning.metadata).to.have.property('feedback');
    });
});