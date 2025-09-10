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
import { PLNReasoningEngine } from '../node/reasoning-engines/pln-reasoning-engine';
import { PatternMatchingEngine } from '../node/reasoning-engines/pattern-matching-engine';
import { CodeAnalysisReasoningEngine } from '../node/reasoning-engines/code-analysis-reasoning-engine';
import { Atom, ReasoningQuery } from '../common/opencog-types';

describe('Advanced Reasoning Engines', () => {
    let plnEngine: PLNReasoningEngine;
    let patternEngine: PatternMatchingEngine;
    let codeAnalysisEngine: CodeAnalysisReasoningEngine;

    beforeEach(() => {
        const container = new Container();
        container.bind(PLNReasoningEngine).toSelf().inSingletonScope();
        container.bind(PatternMatchingEngine).toSelf().inSingletonScope();
        container.bind(CodeAnalysisReasoningEngine).toSelf().inSingletonScope();
        
        plnEngine = container.get(PLNReasoningEngine);
        patternEngine = container.get(PatternMatchingEngine);
        codeAnalysisEngine = container.get(CodeAnalysisReasoningEngine);
    });

    describe('PLNReasoningEngine', () => {
        it('should perform deductive reasoning with implication links', async () => {
            const atoms: Atom[] = [
                {
                    type: 'ImplicationLink',
                    name: 'if-then-rule',
                    truthValue: { strength: 0.9, confidence: 0.8 },
                    outgoing: [
                        {
                            type: 'ConceptNode',
                            name: 'antecedent',
                            truthValue: { strength: 0.8, confidence: 0.9 }
                        },
                        {
                            type: 'ConceptNode',
                            name: 'consequent'
                        }
                    ]
                }
            ];

            const query: ReasoningQuery = {
                type: 'deductive',
                atoms,
                context: { domain: 'logic' }
            };

            const result = await plnEngine.reason(query);

            expect(result).to.have.property('confidence');
            expect(result).to.have.property('explanation');
            expect(result.confidence).to.be.greaterThan(0);
            expect(result.explanation).to.include('PLN deductive reasoning');
            expect(result.metadata).to.have.property('reasoningType', 'pln-deductive');
        });

        it('should perform inductive reasoning from observations', async () => {
            const atoms: Atom[] = [
                {
                    type: 'EvaluationLink',
                    name: 'observation1',
                    truthValue: { strength: 0.9, confidence: 0.8 },
                    outgoing: [
                        { type: 'PredicateNode', name: 'isColor' },
                        { type: 'ConceptNode', name: 'red' }
                    ]
                },
                {
                    type: 'EvaluationLink',
                    name: 'observation2',
                    truthValue: { strength: 0.8, confidence: 0.9 },
                    outgoing: [
                        { type: 'PredicateNode', name: 'isColor' },
                        { type: 'ConceptNode', name: 'blue' }
                    ]
                },
                {
                    type: 'EvaluationLink',
                    name: 'observation3',
                    truthValue: { strength: 0.7, confidence: 0.8 },
                    outgoing: [
                        { type: 'PredicateNode', name: 'isColor' },
                        { type: 'ConceptNode', name: 'green' }
                    ]
                }
            ];

            const query: ReasoningQuery = {
                type: 'inductive',
                atoms,
                context: { domain: 'pattern-recognition' }
            };

            const result = await plnEngine.reason(query);

            expect(result.confidence).to.be.greaterThan(0);
            expect(result.explanation).to.include('inductive reasoning');
            expect(result.metadata).to.have.property('reasoningType', 'pln-inductive');
            expect(result.metadata).to.have.property('observationCount', 3);
        });

        it('should perform abductive reasoning for explanation', async () => {
            const atoms: Atom[] = [
                {
                    type: 'EvaluationLink',
                    name: 'wet-grass',
                    truthValue: { strength: 0.9, confidence: 0.9 },
                    outgoing: [
                        { type: 'PredicateNode', name: 'isWet' },
                        { type: 'ConceptNode', name: 'grass' }
                    ]
                }
            ];

            const query: ReasoningQuery = {
                type: 'abductive',
                atoms,
                context: { domain: 'explanation' }
            };

            const result = await plnEngine.reason(query);

            expect(result.confidence).to.be.greaterThan(0);
            expect(result.explanation).to.include('abductive reasoning');
            expect(result.metadata).to.have.property('reasoningType', 'pln-abductive');
            expect(result.conclusion).to.be.an('array');
        });
    });

    describe('PatternMatchingEngine', () => {
        it('should recognize structural patterns', async () => {
            const atoms: Atom[] = [
                {
                    type: 'FunctionNode',
                    name: 'func1',
                    outgoing: [
                        { type: 'ParameterNode', name: 'param1' },
                        { type: 'ParameterNode', name: 'param2' }
                    ]
                },
                {
                    type: 'FunctionNode',
                    name: 'func2',
                    outgoing: [
                        { type: 'ParameterNode', name: 'param3' },
                        { type: 'ParameterNode', name: 'param4' }
                    ]
                }
            ];

            const patterns = await patternEngine.recognizePatterns({
                data: atoms,
                context: { domain: 'code-structure' },
                scope: 'local'
            });

            expect(patterns).to.be.an('array');
            expect(patterns.length).to.be.greaterThan(0);
            
            const structuralPatterns = patterns.filter(p => 
                p.metadata?.patternType === 'structural'
            );
            expect(structuralPatterns.length).to.be.greaterThan(0);
        });

        it('should perform pattern-based reasoning', async () => {
            const atoms: Atom[] = [
                { type: 'ConceptNode', name: 'item1' },
                { type: 'ConceptNode', name: 'item2' },
                { type: 'ConceptNode', name: 'item3' }
            ];

            const query: ReasoningQuery = {
                type: 'code-analysis',
                atoms,
                context: { domain: 'pattern-analysis' }
            };

            const result = await patternEngine.reason(query);

            expect(result.confidence).to.be.greaterThan(0);
            expect(result.explanation).to.include('pattern matching');
            expect(result.metadata).to.have.property('reasoningType', 'pattern-matching');
        });

        it('should recognize semantic patterns', async () => {
            const atoms: Atom[] = [
                { type: 'ConceptNode', name: 'user_login' },
                { type: 'ConceptNode', name: 'user_logout' },
                { type: 'ConceptNode', name: 'user_register' },
                { type: 'ConceptNode', name: 'admin_login' },
                { type: 'ConceptNode', name: 'admin_access' }
            ];

            const patterns = await patternEngine.recognizePatterns({
                data: atoms,
                context: { domain: 'semantic-analysis' },
                scope: 'global'
            });

            const semanticPatterns = patterns.filter(p => 
                p.metadata?.patternType === 'semantic'
            );
            expect(semanticPatterns.length).to.be.greaterThan(0);
        });
    });

    describe('CodeAnalysisReasoningEngine', () => {
        it('should analyze code structure and quality', async () => {
            const atoms: Atom[] = [
                {
                    type: 'FunctionNode',
                    name: 'complexFunction',
                    outgoing: Array.from({ length: 15 }, (_, i) => ({
                        type: 'StatementNode',
                        name: `statement${i}`
                    }))
                },
                {
                    type: 'ClassNode',
                    name: 'UserService',
                    outgoing: [
                        { type: 'FunctionNode', name: 'login' },
                        { type: 'FunctionNode', name: 'logout' }
                    ]
                }
            ];

            const query: ReasoningQuery = {
                type: 'code-analysis',
                atoms,
                context: { 
                    language: 'typescript',
                    fileUri: 'test.ts'
                }
            };

            const result = await codeAnalysisEngine.reason(query);

            expect(result.confidence).to.be.greaterThan(0);
            expect(result.explanation).to.include('code analysis');
            expect(result.metadata).to.have.property('reasoningType', 'code-analysis');
            expect(result.metadata).to.have.property('qualityMetrics');
            expect(result.metadata).to.have.property('suggestions');
        });

        it('should detect design patterns', async () => {
            const atoms: Atom[] = [
                { type: 'ClassNode', name: 'UserFactory' },
                { type: 'FunctionNode', name: 'createUser' },
                { type: 'ClassNode', name: 'AdminFactory' },
                { type: 'FunctionNode', name: 'createAdmin' }
            ];

            const query: ReasoningQuery = {
                type: 'code-analysis',
                atoms,
                context: { 
                    language: 'java',
                    analysisType: 'pattern-detection'
                }
            };

            const result = await codeAnalysisEngine.reason(query);

            expect(result.metadata).to.have.property('patterns');
            expect(result.metadata.patterns).to.be.an('array');
        });

        it('should provide improvement suggestions', async () => {
            const atoms: Atom[] = [
                {
                    type: 'FunctionNode',
                    name: 'a', // Bad naming
                    outgoing: Array.from({ length: 25 }, (_, i) => ({
                        type: 'StatementNode',
                        name: `stmt${i}`
                    }))
                }
            ];

            const query: ReasoningQuery = {
                type: 'code-analysis',
                atoms,
                context: { language: 'python' }
            };

            const result = await codeAnalysisEngine.reason(query);

            expect(result.metadata).to.have.property('suggestions');
            expect(result.metadata.suggestions).to.be.an('array');
            expect(result.metadata.suggestions.length).to.be.greaterThan(0);
        });
    });

    describe('Integration Tests', () => {
        it('should handle complex reasoning queries with multiple engines', async () => {
            const atoms: Atom[] = [
                {
                    type: 'ImplicationLink',
                    name: 'coding-rule',
                    truthValue: { strength: 0.9, confidence: 0.8 },
                    outgoing: [
                        { type: 'ConceptNode', name: 'complex-function' },
                        { type: 'ConceptNode', name: 'needs-refactoring' }
                    ]
                },
                {
                    type: 'FunctionNode',
                    name: 'veryComplexFunction',
                    outgoing: Array.from({ length: 20 }, (_, i) => ({
                        type: 'StatementNode',
                        name: `statement${i}`
                    }))
                }
            ];

            // Test PLN reasoning
            const plnQuery: ReasoningQuery = {
                type: 'deductive',
                atoms,
                context: { domain: 'software-engineering' }
            };

            const plnResult = await plnEngine.reason(plnQuery);
            expect(plnResult.confidence).to.be.greaterThan(0);

            // Test pattern recognition
            const patterns = await patternEngine.recognizePatterns({
                data: atoms,
                context: { domain: 'code-analysis' },
                scope: 'local'
            });
            expect(patterns.length).to.be.greaterThan(0);

            // Test code analysis
            const codeQuery: ReasoningQuery = {
                type: 'code-analysis',
                atoms,
                context: { language: 'typescript' }
            };

            const codeResult = await codeAnalysisEngine.reason(codeQuery);
            expect(codeResult.confidence).to.be.greaterThan(0);
            expect(codeResult.metadata.suggestions.length).to.be.greaterThan(0);
        });

        it('should handle error cases gracefully', async () => {
            const invalidQuery: ReasoningQuery = {
                type: 'invalid-type' as any,
                atoms: [],
                context: {}
            };

            // PLN engine should handle unknown types
            const plnResult = await plnEngine.reason(invalidQuery);
            expect(plnResult).to.have.property('confidence');
            expect(plnResult).to.have.property('explanation');

            // Pattern engine should handle empty data
            const patterns = await patternEngine.recognizePatterns({
                data: [],
                context: {},
                scope: 'local'
            });
            expect(patterns).to.be.an('array');

            // Code analysis should handle empty atoms
            const codeResult = await codeAnalysisEngine.reason({
                type: 'code-analysis',
                atoms: [],
                context: {}
            });
            expect(codeResult).to.have.property('confidence');
        });
    });
});