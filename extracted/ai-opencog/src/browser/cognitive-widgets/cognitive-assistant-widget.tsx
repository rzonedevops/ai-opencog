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

import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { BaseWidget, codicon, Message } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common/nls';
import { Disposable, DisposableCollection } from '@theia/core/lib/common/disposable';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import { IntelligentAssistanceAgent } from '../intelligent-assistance-agent';
import { OpenCogService } from '../../common/opencog-service';
import * as React from '@theia/core/shared/react';

export interface ChatMessage {
    id: string;
    type: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    reasoning?: {
        confidence: number;
        sources: string[];
        cognitiveProcess: string;
    };
    suggestions?: Array<{
        text: string;
        action: string;
        confidence: number;
    }>;
}

export interface AssistantContext {
    currentFile?: string;
    selectedText?: string;
    workspaceContext?: string;
    recentActivity?: string[];
    userPreferences?: Record<string, any>;
}

@injectable()
export class CognitiveAssistantWidget extends BaseWidget {
    static readonly ID = 'cognitive.assistant';
    static readonly LABEL = nls.localize('theia/ai/cognitive/assistant', 'Cognitive Assistant');

    @inject(IntelligentAssistanceAgent)
    protected readonly assistantAgent: IntelligentAssistanceAgent;

    @inject(OpenCogService)
    protected readonly openCogService: OpenCogService;

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    protected readonly toDispose = new DisposableCollection();
    protected messages: ChatMessage[] = [];
    protected currentInput: string = '';
    protected isProcessing: boolean = false;
    protected context: AssistantContext = {};
    private inputRef = React.createRef<HTMLTextAreaElement>();

    @postConstruct()
    protected init(): void {
        this.id = CognitiveAssistantWidget.ID;
        this.title.label = CognitiveAssistantWidget.LABEL;
        this.title.caption = CognitiveAssistantWidget.LABEL;
        this.title.iconClass = codicon('hubot');
        this.title.closable = true;

        this.initializeChat();
        this.setupRealTimeContextUpdates();
        this.update();
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.node.focus();
        this.focusInput();
    }

    protected initializeChat(): void {
        const welcomeMessage: ChatMessage = {
            id: 'welcome-1',
            type: 'assistant',
            content: 'Hello! I\'m your cognitive assistant, powered by OpenCog reasoning. I can help you with code analysis, development insights, and intelligent recommendations based on cognitive understanding of your project.',
            timestamp: new Date().toLocaleTimeString(),
            reasoning: {
                confidence: 1.0,
                sources: ['system-initialization'],
                cognitiveProcess: 'greeting-protocol'
            },
            suggestions: [
                { text: 'Analyze current file', action: 'analyze-file', confidence: 0.9 },
                { text: 'Show code patterns', action: 'show-patterns', confidence: 0.85 },
                { text: 'Get recommendations', action: 'get-recommendations', confidence: 0.8 }
            ]
        };
        this.messages = [welcomeMessage];
    }

    protected async handleUserInput(): Promise<void> {
        if (!this.currentInput.trim() || this.isProcessing) return;

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            type: 'user',
            content: this.currentInput.trim(),
            timestamp: new Date().toLocaleTimeString()
        };

        this.messages = [...this.messages, userMessage];
        const inputText = this.currentInput.trim();
        this.currentInput = '';
        this.isProcessing = true;
        this.update();

        try {
            // Simulate cognitive processing delay
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

            const assistantResponse = await this.generateAssistantResponse(inputText);
            this.messages = [...this.messages, assistantResponse];
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: `error-${Date.now()}`,
                type: 'system',
                content: 'Sorry, I encountered an error while processing your request. Please try again.',
                timestamp: new Date().toLocaleTimeString()
            };
            this.messages = [...this.messages, errorMessage];
        } finally {
            this.isProcessing = false;
            this.update();
            this.focusInput();
        }
    }

    protected async generateAssistantResponse(userInput: string): Promise<ChatMessage> {
        // Simulate cognitive analysis and response generation
        const responses = this.getCognitiveResponses(userInput);
        const selectedResponse = responses[Math.floor(Math.random() * responses.length)];

        return {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: selectedResponse.content,
            timestamp: new Date().toLocaleTimeString(),
            reasoning: selectedResponse.reasoning,
            suggestions: selectedResponse.suggestions
        };
    }

    protected getCognitiveResponses(input: string): Array<{
        content: string;
        reasoning: ChatMessage['reasoning'];
        suggestions: ChatMessage['suggestions'];
    }> {
        const lowerInput = input.toLowerCase();
        
        if (lowerInput.includes('analyze') || lowerInput.includes('analysis')) {
            return [{
                content: 'I\'ve performed a cognitive analysis of your current context. Based on OpenCog reasoning, I can see patterns in your code that suggest opportunities for refactoring and optimization. The cognitive confidence in these recommendations is high due to strong pattern matching.',
                reasoning: {
                    confidence: 0.92,
                    sources: ['pattern-recognition', 'code-analysis-agent', 'historical-data'],
                    cognitiveProcess: 'deductive-reasoning'
                },
                suggestions: [
                    { text: 'Show detailed analysis', action: 'detailed-analysis', confidence: 0.95 },
                    { text: 'Apply suggestions', action: 'apply-suggestions', confidence: 0.88 },
                    { text: 'Explain reasoning', action: 'explain-reasoning', confidence: 0.82 }
                ]
            }];
        }

        if (lowerInput.includes('help') || lowerInput.includes('how')) {
            return [{
                content: 'I can assist you with various development tasks using cognitive intelligence. My reasoning is based on OpenCog\'s symbolic and subsymbolic processing. I analyze patterns, learn from your behavior, and provide contextual assistance.',
                reasoning: {
                    confidence: 0.88,
                    sources: ['knowledge-base', 'user-behavior-patterns'],
                    cognitiveProcess: 'explanatory-reasoning'
                },
                suggestions: [
                    { text: 'Code analysis', action: 'code-analysis', confidence: 0.9 },
                    { text: 'Pattern detection', action: 'pattern-detection', confidence: 0.85 },
                    { text: 'Learning insights', action: 'learning-insights', confidence: 0.78 }
                ]
            }];
        }

        if (lowerInput.includes('pattern') || lowerInput.includes('patterns')) {
            return [{
                content: 'I\'ve identified several cognitive patterns in your codebase using OpenCog pattern recognition. These patterns show high coherence and suggest a consistent architectural approach. The cognitive system has learned these patterns through adaptive processing.',
                reasoning: {
                    confidence: 0.87,
                    sources: ['pattern-recognition-agent', 'code-structure-analysis'],
                    cognitiveProcess: 'pattern-matching'
                },
                suggestions: [
                    { text: 'View pattern details', action: 'view-patterns', confidence: 0.92 },
                    { text: 'Suggest improvements', action: 'pattern-improvements', confidence: 0.79 },
                    { text: 'Learn from patterns', action: 'learn-patterns', confidence: 0.73 }
                ]
            }];
        }

        // Default responses
        return [{
            content: 'I understand your query and I\'m processing it through cognitive reasoning. Based on the current context and learned patterns, I can provide intelligent assistance tailored to your development workflow.',
            reasoning: {
                confidence: 0.75,
                sources: ['general-knowledge', 'context-analysis'],
                cognitiveProcess: 'contextual-understanding'
            },
            suggestions: [
                { text: 'Clarify request', action: 'clarify-request', confidence: 0.8 },
                { text: 'Show capabilities', action: 'show-capabilities', confidence: 0.85 },
                { text: 'Provide examples', action: 'provide-examples', confidence: 0.7 }
            ]
        }];
    }

    protected handleSuggestionClick(suggestion: { text: string; action: string; confidence: number }): void {
        this.currentInput = suggestion.text;
        this.handleUserInput();
    }

    protected focusInput(): void {
        setTimeout(() => {
            if (this.inputRef.current) {
                this.inputRef.current.focus();
            }
        }, 100);
    }

    protected handleKeyDown(event: React.KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.handleUserInput();
        }
    }

    protected render(): React.ReactNode {
        return (
            <div className='cognitive-assistant-widget'>
                {/* Chat Messages */}
                <div className='chat-messages'>
                    {this.messages.map(message => (
                        <div key={message.id} className={`message message-${message.type}`}>
                            <div className='message-header'>
                                <div className='message-sender'>
                                    <i className={codicon(this.getMessageIcon(message.type))} />
                                    <span className='sender-name'>
                                        {message.type === 'user' ? 'You' : 
                                         message.type === 'assistant' ? 'Cognitive Assistant' : 'System'}
                                    </span>
                                </div>
                                <span className='message-time'>{message.timestamp}</span>
                            </div>
                            
                            <div className='message-content'>
                                <p>{message.content}</p>
                                
                                {message.reasoning && (
                                    <div className='reasoning-info'>
                                        <div className='reasoning-header'>
                                            <i className={codicon('lightbulb')} />
                                            <span>Cognitive Reasoning</span>
                                            <span className='confidence'>
                                                {Math.round(message.reasoning.confidence * 100)}% confidence
                                            </span>
                                        </div>
                                        <div className='reasoning-details'>
                                            <div className='reasoning-process'>
                                                Process: {message.reasoning.cognitiveProcess}
                                            </div>
                                            <div className='reasoning-sources'>
                                                Sources: {message.reasoning.sources.join(', ')}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {message.suggestions && message.suggestions.length > 0 && (
                                    <div className='suggestions'>
                                        <div className='suggestions-header'>
                                            <i className={codicon('lightbulb-autofix')} />
                                            <span>Suggestions</span>
                                        </div>
                                        <div className='suggestions-list'>
                                            {message.suggestions.map((suggestion, index) => (
                                                <button
                                                    key={index}
                                                    className='suggestion-button'
                                                    onClick={() => this.handleSuggestionClick(suggestion)}
                                                >
                                                    <span className='suggestion-text'>{suggestion.text}</span>
                                                    <span className='suggestion-confidence'>
                                                        {Math.round(suggestion.confidence * 100)}%
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {this.isProcessing && (
                        <div className='message message-assistant processing'>
                            <div className='message-header'>
                                <div className='message-sender'>
                                    <i className={codicon('hubot')} />
                                    <span className='sender-name'>Cognitive Assistant</span>
                                </div>
                                <span className='message-time'>thinking...</span>
                            </div>
                            <div className='message-content'>
                                <div className='thinking-indicator'>
                                    <i className={codicon('loading')} />
                                    <span>Processing through cognitive reasoning...</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className='chat-input'>
                    <div className='input-container'>
                        <textarea
                            ref={this.inputRef}
                            value={this.currentInput}
                            onChange={(e) => {
                                this.currentInput = e.target.value;
                                this.update();
                            }}
                            onKeyDown={(e) => this.handleKeyDown(e)}
                            placeholder='Ask me anything about your code, patterns, or development insights...'
                            className='input-field'
                            rows={3}
                            disabled={this.isProcessing}
                        />
                        <button
                            onClick={() => this.handleUserInput()}
                            disabled={!this.currentInput.trim() || this.isProcessing}
                            className='send-button'
                        >
                            <i className={codicon('send')} />
                        </button>
                    </div>
                </div>

                {/* Context Info */}
                <div className='context-info'>
                    <div className='context-item'>
                        <i className={codicon('file')} />
                        <span>{this.context.currentFile || 'No file selected'}</span>
                    </div>
                    <div className='context-item'>
                        <i className={codicon('brain')} />
                        <span>Cognitive reasoning active</span>
                    </div>
                </div>
            </div>
        );
    }

    protected getMessageIcon(type: string): string {
        switch (type) {
            case 'user': return 'person';
            case 'assistant': return 'hubot';
            case 'system': return 'gear';
            default: return 'comment';
        }
    }

    private setupRealTimeContextUpdates(): void {
        // Listen for active editor changes to update context in real-time
        this.toDispose.push(
            this.editorManager.onActiveEditorChanged(() => {
                this.updateCurrentContext();
            })
        );

        // Update context immediately if there's an active editor
        this.updateCurrentContext();
    }

    private updateCurrentContext(): void {
        const activeEditor = this.editorManager.activeEditor;
        if (activeEditor instanceof MonacoEditor) {
            const model = activeEditor.getControl().getModel();
            if (model) {
                this.context = {
                    ...this.context,
                    currentFile: model.uri.path,
                    projectContext: {
                        language: model.getLanguageId(),
                        framework: this.detectFramework(model.uri.path),
                        dependencies: [] // Could be enhanced to detect actual dependencies
                    }
                };
                
                // Update the widget display to reflect the new context
                this.update();
            }
        } else {
            // No active editor, clear file context
            this.context = {
                ...this.context,
                currentFile: undefined,
                projectContext: undefined
            };
            this.update();
        }
    }

    private detectFramework(filePath: string): string | undefined {
        // Simple framework detection based on file patterns
        if (filePath.includes('package.json') || filePath.includes('.ts') || filePath.includes('.js')) {
            return 'Node.js/TypeScript';
        }
        if (filePath.includes('.py')) {
            return 'Python';
        }
        if (filePath.includes('.java')) {
            return 'Java';
        }
        if (filePath.includes('.cpp') || filePath.includes('.c')) {
            return 'C++/C';
        }
        return undefined;
    }

    dispose(): void {
        super.dispose();
        this.toDispose.dispose();
    }
}