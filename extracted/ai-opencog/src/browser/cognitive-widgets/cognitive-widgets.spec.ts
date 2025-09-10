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
import { CodeIntelligenceWidget } from './code-intelligence-widget';
import { LearningProgressWidget } from './learning-progress-widget';
import { KnowledgeExplorerWidget } from './knowledge-explorer-widget';
import { CognitiveAssistantWidget } from './cognitive-assistant-widget';
import { RealTimeCodeAnalyzer } from '../real-time-analyzer';
import { UserBehaviorLearningAgent } from '../user-behavior-learning-agent';
import { LearningAgent } from '../enhanced-learning-agent';
import { IntelligentAssistanceAgent } from '../intelligent-assistance-agent';
import { KnowledgeManagementService } from '../../common/knowledge-management-service';
import { OpenCogService } from '../../common/opencog-service';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';

describe('Phase 4: Cognitive Visualization Widgets', () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        
        // Mock services for testing
        container.bind(OpenCogService).toConstantValue({
            queryAtoms: async () => [],
            addAtom: async () => ({}),
            learn: async () => ({})
        } as any);
        
        container.bind(RealTimeCodeAnalyzer).toConstantValue({
            onAnalysisCompleted: () => ({ dispose: () => {} }),
            getAnalysisResult: () => null
        } as any);
        
        container.bind(UserBehaviorLearningAgent).toConstantValue({} as any);
        container.bind(LearningAgent).toConstantValue({} as any);
        container.bind(IntelligentAssistanceAgent).toConstantValue({} as any);
        container.bind(KnowledgeManagementService).toConstantValue({} as any);
        container.bind(EditorManager).toConstantValue({
            onActiveEditorChanged: () => ({ dispose: () => {} }),
            activeEditor: null
        } as any);
    });

    describe('CodeIntelligenceWidget', () => {
        it('should be instantiable', () => {
            container.bind(CodeIntelligenceWidget).toSelf();
            const widget = container.get(CodeIntelligenceWidget);
            expect(widget).to.be.instanceOf(CodeIntelligenceWidget);
            expect(widget.id).to.equal(CodeIntelligenceWidget.ID);
            expect(widget.title.label).to.equal(CodeIntelligenceWidget.LABEL);
        });

        it('should have correct widget properties', () => {
            container.bind(CodeIntelligenceWidget).toSelf();
            const widget = container.get(CodeIntelligenceWidget);
            expect(widget.id).to.equal('cognitive.code-intelligence');
            expect(widget.title.closable).to.be.true;
        });
    });

    describe('LearningProgressWidget', () => {
        it('should be instantiable', () => {
            container.bind(LearningProgressWidget).toSelf();
            const widget = container.get(LearningProgressWidget);
            expect(widget).to.be.instanceOf(LearningProgressWidget);
            expect(widget.id).to.equal(LearningProgressWidget.ID);
            expect(widget.title.label).to.equal(LearningProgressWidget.LABEL);
        });

        it('should have correct widget properties', () => {
            container.bind(LearningProgressWidget).toSelf();
            const widget = container.get(LearningProgressWidget);
            expect(widget.id).to.equal('cognitive.learning-progress');
            expect(widget.title.closable).to.be.true;
        });
    });

    describe('KnowledgeExplorerWidget', () => {
        it('should be instantiable', () => {
            container.bind(KnowledgeExplorerWidget).toSelf();
            const widget = container.get(KnowledgeExplorerWidget);
            expect(widget).to.be.instanceOf(KnowledgeExplorerWidget);
            expect(widget.id).to.equal(KnowledgeExplorerWidget.ID);
            expect(widget.title.label).to.equal(KnowledgeExplorerWidget.LABEL);
        });

        it('should have correct widget properties', () => {
            container.bind(KnowledgeExplorerWidget).toSelf();
            const widget = container.get(KnowledgeExplorerWidget);
            expect(widget.id).to.equal('cognitive.knowledge-explorer');
            expect(widget.title.closable).to.be.true;
        });
    });

    describe('CognitiveAssistantWidget', () => {
        it('should be instantiable', () => {
            container.bind(CognitiveAssistantWidget).toSelf();
            const widget = container.get(CognitiveAssistantWidget);
            expect(widget).to.be.instanceOf(CognitiveAssistantWidget);
            expect(widget.id).to.equal(CognitiveAssistantWidget.ID);
            expect(widget.title.label).to.equal(CognitiveAssistantWidget.LABEL);
        });

        it('should have correct widget properties', () => {
            container.bind(CognitiveAssistantWidget).toSelf();
            const widget = container.get(CognitiveAssistantWidget);
            expect(widget.id).to.equal('cognitive.assistant');
            expect(widget.title.closable).to.be.true;
        });
    });

    describe('Widget Integration', () => {
        it('should have unique widget IDs', () => {
            const ids = [
                CodeIntelligenceWidget.ID,
                LearningProgressWidget.ID,
                KnowledgeExplorerWidget.ID,
                CognitiveAssistantWidget.ID
            ];
            
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).to.equal(ids.length);
        });

        it('should have proper widget labels', () => {
            const labels = [
                CodeIntelligenceWidget.LABEL,
                LearningProgressWidget.LABEL,
                KnowledgeExplorerWidget.LABEL,
                CognitiveAssistantWidget.LABEL
            ];
            
            labels.forEach(label => {
                expect(label).to.be.a('string');
                expect(label.length).to.be.greaterThan(0);
            });
        });
    });

    describe('Real-time Feedback Integration', () => {
        it('should connect CodeIntelligenceWidget to real-time analyzer events', () => {
            let eventListener: any = null;
            const mockAnalyzer = {
                onAnalysisCompleted: (listener: any) => {
                    eventListener = listener;
                    return { dispose: () => {} };
                },
                getAnalysisResult: () => null
            };
            
            container.bind(RealTimeCodeAnalyzer).toConstantValue(mockAnalyzer as any);
            container.bind(CodeIntelligenceWidget).toSelf();
            
            const widget = container.get(CodeIntelligenceWidget);
            expect(eventListener).to.not.be.null;
            expect(typeof eventListener).to.equal('function');
        });

        it('should connect CognitiveAssistantWidget to editor manager events', () => {
            let editorChangeListener: any = null;
            const mockEditorManager = {
                onActiveEditorChanged: (listener: any) => {
                    editorChangeListener = listener;
                    return { dispose: () => {} };
                },
                activeEditor: null
            };
            
            container.bind(EditorManager).toConstantValue(mockEditorManager as any);
            container.bind(CognitiveAssistantWidget).toSelf();
            
            const widget = container.get(CognitiveAssistantWidget);
            expect(editorChangeListener).to.not.be.null;
            expect(typeof editorChangeListener).to.equal('function');
        });

        it('should properly dispose event listeners on widget disposal', () => {
            let disposeCalled = false;
            const mockAnalyzer = {
                onAnalysisCompleted: () => ({
                    dispose: () => { disposeCalled = true; }
                }),
                getAnalysisResult: () => null
            };
            
            container.bind(RealTimeCodeAnalyzer).toConstantValue(mockAnalyzer as any);
            container.bind(CodeIntelligenceWidget).toSelf();
            
            const widget = container.get(CodeIntelligenceWidget);
            widget.dispose();
            
            expect(disposeCalled).to.be.true;
        });
    });
});