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

import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { Disposable, DisposableCollection } from '@theia/core/lib/common/disposable';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import { PatternRecognitionAgent } from './pattern-recognition-agent';
import { LearningAgent } from './enhanced-learning-agent';
import { SemanticCompletionProvider } from './semantic-completion';
import { IntelligentRefactoringProvider } from './intelligent-refactoring';
import { RealTimeCodeAnalyzer } from './real-time-analyzer';
import { CodeAnalysisAgent } from './code-analysis-agent';
import * as monaco from '@theia/monaco-editor-core';

/**
 * Phase 2 Editor Integration Service
 * Integrates all cognitive capabilities into the code editing experience
 */
@injectable()
export class CognitiveEditorIntegration implements Disposable {

    private readonly disposables = new DisposableCollection();
    private readonly editorAnalyzers = new Map<string, DisposableCollection>();

    constructor(
        @inject(EditorManager) private readonly editorManager: EditorManager,
        @inject(PatternRecognitionAgent) private readonly patternAgent: PatternRecognitionAgent,
        @inject(LearningAgent) private readonly learningAgent: LearningAgent,
        @inject(SemanticCompletionProvider) private readonly semanticCompletion: SemanticCompletionProvider,
        @inject(IntelligentRefactoringProvider) private readonly refactoringProvider: IntelligentRefactoringProvider,
        @inject(RealTimeCodeAnalyzer) private readonly realTimeAnalyzer: RealTimeCodeAnalyzer,
        @inject(CodeAnalysisAgent) private readonly codeAnalysisAgent: CodeAnalysisAgent
    ) {}

    @postConstruct()
    init(): void {
        this.setupEditorIntegration();
        this.registerCompletionProvider();
        this.setupRealTimeAnalysis();
    }

    private setupEditorIntegration(): void {
        // Listen for editor creation
        this.disposables.push(
            this.editorManager.onCreated(editor => {
                if (editor instanceof MonacoEditor) {
                    this.integrateWithEditor(editor);
                }
            })
        );

        // Integrate with existing editors
        this.editorManager.all.forEach(editor => {
            if (editor instanceof MonacoEditor) {
                this.integrateWithEditor(editor);
            }
        });
    }

    private integrateWithEditor(editor: MonacoEditor): void {
        const model = editor.getControl().getModel();
        if (!model) return;

        const uri = model.uri.toString();
        const editorDisposables = new DisposableCollection();
        
        // Start real-time analysis
        this.realTimeAnalyzer.startMonitoring(model);
        
        // Set up editor-specific integrations
        this.setupCodeActionProvider(editor, editorDisposables);
        this.setupHoverProvider(editor, editorDisposables);
        this.setupDiagnosticsProvider(editor, editorDisposables);
        this.setupLearningIntegration(editor, editorDisposables);

        this.editorAnalyzers.set(uri, editorDisposables);

        // Clean up when editor is closed
        editor.onDispose(() => {
            this.realTimeAnalyzer.stopMonitoring(uri);
            const disposables = this.editorAnalyzers.get(uri);
            if (disposables) {
                disposables.dispose();
                this.editorAnalyzers.delete(uri);
            }
        });
    }

    private registerCompletionProvider(): void {
        // Register semantic completion provider with Monaco
        this.disposables.push(
            monaco.languages.registerCompletionItemProvider('javascript', this.semanticCompletion)
        );
        this.disposables.push(
            monaco.languages.registerCompletionItemProvider('typescript', this.semanticCompletion)
        );
    }

    private setupCodeActionProvider(editor: MonacoEditor, disposables: DisposableCollection): void {
        const model = editor.getControl().getModel();
        if (!model) return;

        // Register code action provider for refactoring suggestions
        const provider = monaco.languages.registerCodeActionProvider(['javascript', 'typescript'], {
            provideCodeActions: async (model, range, context) => {
                const refactoringSuggestions = await this.refactoringProvider.detectRefactoringOpportunities(model);
                
                const actions: monaco.languages.CodeAction[] = [];
                
                for (const suggestion of refactoringSuggestions.slice(0, 5)) { // Limit to top 5
                    actions.push({
                        title: suggestion.title,
                        kind: 'refactor',
                        edit: {
                            edits: suggestion.changes.map(change => ({
                                resource: model.uri,
                                edit: {
                                    range: change.range,
                                    text: change.newText
                                }
                            }))
                        },
                        command: {
                            id: 'opencog.applyRefactoring',
                            title: 'Apply Refactoring',
                            arguments: [suggestion.id]
                        }
                    });
                }
                
                return {
                    actions,
                    dispose: () => {}
                };
            }
        });

        disposables.push(provider);
    }

    private setupHoverProvider(editor: MonacoEditor, disposables: DisposableCollection): void {
        const model = editor.getControl().getModel();
        if (!model) return;

        // Register hover provider for cognitive insights
        const provider = monaco.languages.registerHoverProvider(['javascript', 'typescript'], {
            provideHover: async (model, position) => {
                const analysisResult = this.realTimeAnalyzer.getAnalysisResult(model.uri.toString());
                
                if (analysisResult) {
                    const qualityScore = Math.round(analysisResult.qualityMetrics.score * 100);
                    const recommendations = analysisResult.recommendations.slice(0, 3);
                    
                    const contents = [
                        { value: `**Code Quality Score:** ${qualityScore}%` },
                        { value: `**Complexity:** ${Math.round(analysisResult.qualityMetrics.complexity * 100)}%` },
                        { value: `**Maintainability:** ${Math.round(analysisResult.qualityMetrics.maintainability * 100)}%` }
                    ];
                    
                    if (recommendations.length > 0) {
                        contents.push({ value: '**Recommendations:**' });
                        recommendations.forEach(rec => {
                            contents.push({ value: `• ${rec}` });
                        });
                    }
                    
                    return {
                        range: new monaco.Range(position.lineNumber, 1, position.lineNumber, 1),
                        contents
                    };
                }
                
                return null;
            }
        });

        disposables.push(provider);
    }

    private setupDiagnosticsProvider(editor: MonacoEditor, disposables: DisposableCollection): void {
        const model = editor.getControl().getModel();
        if (!model) return;

        // Listen for real-time analysis results
        disposables.push(
            this.realTimeAnalyzer.onIssuesDetected(({ fileUri, issues }) => {
                if (fileUri === model.uri.toString()) {
                    const markers: monaco.editor.IMarkerData[] = issues.map(issue => ({
                        severity: this.severityToMarkerSeverity(issue.severity),
                        startLineNumber: issue.range.startLineNumber,
                        startColumn: issue.range.startColumn,
                        endLineNumber: issue.range.endLineNumber,
                        endColumn: issue.range.endColumn,
                        message: issue.message,
                        source: 'OpenCog Cognitive Analysis'
                    }));

                    monaco.editor.setModelMarkers(model, 'opencog-cognitive', markers);
                }
            })
        );
    }

    private setupLearningIntegration(editor: MonacoEditor, disposables: DisposableCollection): void {
        const model = editor.getControl().getModel();
        if (!model) return;

        const editorControl = editor.getControl();
        
        // Learn from user interactions
        disposables.push(
            editorControl.onDidChangeCursorPosition(() => {
                this.learningAgent.learnDeveloperBehavior('default-user', 'cursor-move', {
                    fileUri: model.uri.toString(),
                    timestamp: Date.now()
                });
            })
        );

        disposables.push(
            model.onDidChangeContent((event) => {
                // Learn from code changes
                this.learningAgent.learnDeveloperBehavior('default-user', 'code-change', {
                    fileUri: model.uri.toString(),
                    changeType: event.changes.length > 0 ? 'edit' : 'unknown',
                    changesCount: event.changes.length,
                    timestamp: Date.now()
                });

                // Analyze patterns in the changes
                if (event.changes.length > 0) {
                    const change = event.changes[0];
                    this.patternAgent.detectCodePatterns(change.text, model.uri.toString())
                        .then(patterns => {
                            if (patterns.length > 0) {
                                // Learn from detected patterns
                                this.learningAgent.learnCodeQualityPatterns('default-user', {
                                    patterns,
                                    fileUri: model.uri.toString(),
                                    improvementDetected: patterns.some(p => p.pattern.type === 'design-pattern')
                                });
                            }
                        })
                        .catch(error => console.warn('Pattern detection failed:', error));
                }
            })
        );
    }

    private setupRealTimeAnalysis(): void {
        // Global setup for real-time analysis
        this.disposables.push(
            this.realTimeAnalyzer.onAnalysisCompleted(result => {
                // Provide feedback to learning system
                this.learningAgent.provideLearningFeedback(
                    'default-user',
                    'code-analysis',
                    result.qualityMetrics.score > 0.7,
                    {
                        explanation: `Analysis completed with quality score: ${result.qualityMetrics.score}`,
                        fileUri: result.fileUri
                    }
                );
            })
        );
    }

    private severityToMarkerSeverity(severity: 'error' | 'warning' | 'info'): monaco.MarkerSeverity {
        switch (severity) {
            case 'error': return monaco.MarkerSeverity.Error;
            case 'warning': return monaco.MarkerSeverity.Warning;
            case 'info': return monaco.MarkerSeverity.Info;
            default: return monaco.MarkerSeverity.Info;
        }
    }

    /**
     * Get cognitive insights for a specific file
     */
    async getCognitiveInsights(fileUri: string): Promise<any> {
        const analysisResult = this.realTimeAnalyzer.getAnalysisResult(fileUri);
        const personalizedRecommendations = await this.learningAgent.getPersonalizedRecommendations('default-user');
        const learningInsights = await this.learningAgent.getLearningInsights('default-user');
        
        return {
            realTimeAnalysis: analysisResult,
            personalizedRecommendations,
            learningInsights,
            timestamp: Date.now()
        };
    }

    /**
     * Apply cognitive refactoring suggestion
     */
    async applyCognitiveRefactoring(suggestionId: string, fileUri: string): Promise<boolean> {
        // Find the editor for the file
        const editor = this.editorManager.all.find(e => 
            e instanceof MonacoEditor && 
            e.getControl().getModel()?.uri.toString() === fileUri
        ) as MonacoEditor;

        if (!editor) {
            return false;
        }

        const model = editor.getControl().getModel()!;
        const suggestions = await this.refactoringProvider.detectRefactoringOpportunities(model);
        const suggestion = suggestions.find(s => s.id === suggestionId);

        if (suggestion) {
            const success = await this.refactoringProvider.executeRefactoring(suggestion, model);
            
            if (success) {
                // Learn from successful refactoring
                await this.learningAgent.learnCodeQualityPatterns('default-user', {
                    refactoringType: suggestion.category,
                    improvementDetected: true,
                    suggestionId,
                    fileUri
                });
            }
            
            return success;
        }

        return false;
    }

    dispose(): void {
        // Stop all real-time analyzers
        for (const [uri, disposables] of this.editorAnalyzers) {
            this.realTimeAnalyzer.stopMonitoring(uri);
            disposables.dispose();
        }
        this.editorAnalyzers.clear();
        
        this.disposables.dispose();
    }
}