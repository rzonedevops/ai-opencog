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

import { Container } from '@theia/core/shared/inversify';
import { expect } from 'chai';
import { PatternRecognitionAgent } from '../browser/pattern-recognition-agent';
import { LearningAgent } from '../browser/enhanced-learning-agent';
import { SemanticCompletionProvider } from '../browser/semantic-completion';
import { IntelligentRefactoringProvider } from '../browser/intelligent-refactoring';
import { OpenCogService } from '../common/opencog-service';

describe('Phase 2 Cognitive Services', () => {
    let container: Container;
    let mockOpenCogService: any;

    beforeEach(() => {
        container = new Container();
        
        // Mock OpenCog service
        mockOpenCogService = {
            recognizePatterns: async () => [],
            reason: async () => ({ conclusions: [] }),
            learn: async () => {},
            learnUserBehavior: async () => {},
            getUserBehaviorPatterns: async () => [],
            getAdaptationStrategy: async () => undefined,
            createLearningModel: async () => ({ id: 'test-model' }),
            getLearningStats: async () => ({
                totalLearningRecords: 0,
                modelAccuracy: {},
                userAdaptations: 0,
                behaviorPatterns: 0
            }),
            learnFromFeedback: async () => {}
        };

        container.bind(OpenCogService).toConstantValue(mockOpenCogService);
    });

    describe('PatternRecognitionAgent', () => {
        it('should create pattern recognition agent', () => {
            container.bind(PatternRecognitionAgent).toSelf();
            const agent = container.get(PatternRecognitionAgent);
            
            expect(agent).to.be.instanceOf(PatternRecognitionAgent);
            expect(agent.id).to.equal('pattern-recognition');
            expect(agent.name).to.equal('Pattern Recognition Agent');
        });

        it('should detect code patterns', async () => {
            container.bind(PatternRecognitionAgent).toSelf();
            const agent = container.get(PatternRecognitionAgent);
            
            const code = `
                function calculateSum(a, b) {
                    return a + b;
                }
                
                class Calculator {
                    add(x, y) {
                        return x + y;
                    }
                }
            `;
            
            const patterns = await agent.detectCodePatterns(code, 'test.js');
            expect(patterns).to.be.an('array');
        });
    });

    describe('LearningAgent', () => {
        it('should create learning agent', () => {
            // Mock workspace service
            const mockWorkspace = {
                workspace: {
                    resource: { toString: () => 'test-workspace' }
                }
            };
            container.bind('WorkspaceService').toConstantValue(mockWorkspace);
            container.bind(LearningAgent).toSelf();
            
            const agent = container.get(LearningAgent);
            
            expect(agent).to.be.instanceOf(LearningAgent);
            expect(agent.id).to.equal('opencog-learning');
            expect(agent.name).to.equal('Learning Agent');
        });

        it('should learn from developer behavior', async () => {
            const mockWorkspace = {
                workspace: {
                    resource: { toString: () => 'test-workspace' }
                }
            };
            container.bind('WorkspaceService').toConstantValue(mockWorkspace);
            container.bind(LearningAgent).toSelf();
            
            const agent = container.get(LearningAgent);
            
            await agent.learnDeveloperBehavior('test-user', 'code-edit', {
                fileName: 'test.js',
                changeType: 'function-addition'
            });
            
            // Should not throw and complete successfully
            expect(true).to.be.true;
        });
    });

    describe('SemanticCompletionProvider', () => {
        it('should create semantic completion provider', () => {
            container.bind(SemanticCompletionProvider).toSelf();
            const provider = container.get(SemanticCompletionProvider);
            
            expect(provider).to.be.instanceOf(SemanticCompletionProvider);
        });

        it('should provide completion items', async () => {
            container.bind(SemanticCompletionProvider).toSelf();
            const provider = container.get(SemanticCompletionProvider);
            
            // Mock text model
            const mockModel = {
                getLineContent: () => 'const result = ',
                getLinesContent: () => ['const result = '],
                getLineCount: () => 1,
                getValue: () => 'const result = ',
                uri: { toString: () => 'test.js' }
            };
            
            const mockPosition = { lineNumber: 1, column: 15 };
            const mockContext = {};
            
            const completions = await provider.provideCompletionItems(mockModel as any, mockPosition as any, mockContext as any);
            
            expect(completions).to.have.property('suggestions');
            expect(completions.suggestions).to.be.an('array');
        });
    });

    describe('IntelligentRefactoringProvider', () => {
        it('should create intelligent refactoring provider', () => {
            container.bind(PatternRecognitionAgent).toSelf();
            container.bind(IntelligentRefactoringProvider).toSelf();
            
            const provider = container.get(IntelligentRefactoringProvider);
            expect(provider).to.be.instanceOf(IntelligentRefactoringProvider);
        });

        it('should analyze code quality', async () => {
            container.bind(PatternRecognitionAgent).toSelf();
            container.bind(IntelligentRefactoringProvider).toSelf();
            
            const provider = container.get(IntelligentRefactoringProvider);
            
            // Mock text model
            const mockModel = {
                getValue: () => 'function test() { return true; }',
                getLinesContent: () => ['function test() { return true; }'],
                uri: { toString: () => 'test.js' }
            };
            
            const issues = await provider.analyzeCodeQuality(mockModel as any);
            expect(issues).to.be.an('array');
        });
    });
});