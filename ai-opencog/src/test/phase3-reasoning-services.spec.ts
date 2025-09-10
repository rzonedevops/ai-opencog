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
import { DeductiveReasoningServiceImpl } from '../node/deductive-reasoning-service';
import { InductiveReasoningServiceImpl } from '../node/inductive-reasoning-service';
import { AbductiveReasoningServiceImpl } from '../node/abductive-reasoning-service';
import { PLNReasoningEngine } from '../node/reasoning-engines';

describe('Phase 3 Reasoning Services', () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        container.bind(PLNReasoningEngine).toSelf().inSingletonScope();
        container.bind(DeductiveReasoningServiceImpl).toSelf().inSingletonScope();
        container.bind(InductiveReasoningServiceImpl).toSelf().inSingletonScope();
        container.bind(AbductiveReasoningServiceImpl).toSelf().inSingletonScope();
    });

    describe('DeductiveReasoningService', () => {
        it('should verify simple code logic', async () => {
            const service = container.get(DeductiveReasoningServiceImpl);
            
            const code = `
                function add(a, b) {
                    if (a && b) {
                        return a + b;
                    }
                    return 0;
                }
            `;
            
            const result = await service.verifyCodeLogic(code);
            
            expect(result).to.have.property('isValid');
            expect(result).to.have.property('confidence');
            expect(result.confidence).to.be.greaterThan(0);
        });

        it('should detect logical inconsistencies', async () => {
            const service = container.get(DeductiveReasoningServiceImpl);
            
            const statements = [
                { type: 'ConceptNode', name: 'A', truthValue: { strength: 1.0, confidence: 0.9 } },
                { type: 'NotLink', name: 'not_A', outgoing: [{ type: 'ConceptNode', name: 'A' }], truthValue: { strength: 1.0, confidence: 0.9 } }
            ];
            
            const result = await service.checkConsistency(statements);
            
            expect(result).to.have.property('isConsistent');
            expect(result.isConsistent).to.be.false;
            expect(result.conflicts).to.not.be.empty;
        });

        it('should deduce conclusions from premises', async () => {
            const service = container.get(DeductiveReasoningServiceImpl);
            
            const premises = [
                'All humans are mortal',
                'Socrates is human'
            ];
            
            const result = await service.deduceConclusions(premises);
            
            expect(result).to.have.property('confidence');
            expect(result.confidence).to.be.greaterThan(0);
            expect(result).to.have.property('conclusion');
        });
    });

    describe('InductiveReasoningService', () => {
        it('should generalize patterns from examples', async () => {
            const service = container.get(InductiveReasoningServiceImpl);
            
            const input = {
                examples: [
                    'function getName() { return this.name; }',
                    'function getAge() { return this.age; }',
                    'function getEmail() { return this.email; }'
                ],
                context: 'getter methods',
                domain: 'javascript'
            };
            
            const result = await service.generalizeFromExamples(input);
            
            expect(result).to.have.property('pattern');
            expect(result).to.have.property('confidence');
            expect(result).to.have.property('generalizationStrength');
            expect(result.confidence).to.be.greaterThan(0);
        });

        it('should identify best practices from examples', async () => {
            const service = container.get(InductiveReasoningServiceImpl);
            
            const examples = [
                'Always handle errors with try-catch',
                'Use const for immutable variables',
                'Document your functions'
            ];
            
            const result = await service.identifyBestPractices(examples);
            
            expect(result).to.have.property('practices');
            expect(result).to.have.property('confidence');
            expect(result.practices).to.be.an('array');
            expect(result.confidence).to.be.greaterThan(0);
        });

        it('should generate code from patterns', async () => {
            const service = container.get(InductiveReasoningServiceImpl);
            
            const patterns = [
                { type: 'function', pattern: 'getter' },
                { type: 'naming', convention: 'camelCase' }
            ];
            
            const result = await service.generateCodeFromPatterns(patterns, 'javascript class');
            
            expect(result).to.have.property('code');
            expect(result).to.have.property('confidence');
            expect(result.code).to.be.a('string');
            expect(result.confidence).to.be.greaterThan(0);
        });
    });

    describe('AbductiveReasoningService', () => {
        it('should generate bug hypotheses from symptoms', async () => {
            const service = container.get(AbductiveReasoningServiceImpl);
            
            const symptoms = [
                'Application crashes on startup',
                'Error in console: TypeError: Cannot read property',
                'Occurs only on mobile devices'
            ];
            
            const result = await service.generateBugHypotheses(symptoms);
            
            expect(result).to.be.an('array');
            expect(result.length).to.be.greaterThan(0);
            
            const hypothesis = result[0];
            expect(hypothesis).to.have.property('hypothesis');
            expect(hypothesis).to.have.property('plausibility');
            expect(hypothesis).to.have.property('evidence');
            expect(hypothesis).to.have.property('testableConditions');
        });

        it('should suggest creative solutions', async () => {
            const service = container.get(AbductiveReasoningServiceImpl);
            
            const problem = 'How to improve code maintainability';
            const constraints = ['Limited time', 'Small team'];
            
            const result = await service.suggestCreativeSolutions(problem, constraints);
            
            expect(result).to.have.property('solutions');
            expect(result).to.have.property('creativity');
            expect(result.solutions).to.be.an('array');
            expect(result.solutions.length).to.be.greaterThan(0);
            expect(result.creativity).to.be.greaterThan(0);
        });

        it('should propose architecture optimizations', async () => {
            const service = container.get(AbductiveReasoningServiceImpl);
            
            const architecture = {
                components: [
                    { name: 'UserService', type: 'service' },
                    { name: 'DatabaseLayer', type: 'persistence' }
                ],
                connections: [
                    { from: 'UserService', to: 'DatabaseLayer', type: 'dependency' }
                ]
            };
            
            const result = await service.proposeArchitectureOptimizations(architecture);
            
            expect(result).to.have.property('optimizations');
            expect(result).to.have.property('impact');
            expect(result.optimizations).to.be.an('array');
            expect(result.impact).to.be.greaterThan(0);
        });
    });
});