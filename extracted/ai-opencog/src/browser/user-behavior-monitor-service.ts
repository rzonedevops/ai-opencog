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
import { Emitter, Event, Disposable, DisposableCollection } from '@theia/core';
import { EditorManager } from '@theia/editor/lib/browser';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import { UserBehaviorLearningAgent } from './user-behavior-learning-agent';
import { LearningAgent } from './enhanced-learning-agent';

export interface UserInteractionEvent {
    type: 'editor' | 'command' | 'file' | 'keyboard' | 'workspace';
    action: string;
    timestamp: number;
    context: Record<string, any>;
    userId: string;
    sessionId: string;
    duration?: number;
    success?: boolean;
}

export const UserBehaviorMonitorService = Symbol('UserBehaviorMonitorService');

/**
 * Service that monitors user interactions across the IDE and feeds data to learning agents
 * Part of Phase 3: AI Agent Enhancement for comprehensive user behavior learning
 */
@injectable()
export class UserBehaviorMonitorService implements Disposable {
    
    private readonly onBehaviorDetectedEmitter = new Emitter<UserInteractionEvent>();
    readonly onBehaviorDetected: Event<UserInteractionEvent> = this.onBehaviorDetectedEmitter.event;
    
    private readonly disposables = new DisposableCollection();
    private sessionId: string;
    private userId = 'default-user'; // In real implementation, get from auth service
    private commandStartTimes = new Map<string, number>();
    private lastEditorActivity = Date.now();
    
    constructor(
        @inject(EditorManager) private readonly editorManager: EditorManager,
        @inject(WorkspaceService) private readonly workspaceService: WorkspaceService,
        @inject(FileService) private readonly fileService: FileService,
        @inject(CommandRegistry) private readonly commandRegistry: CommandRegistry,
        @inject(KeybindingRegistry) private readonly keybindingRegistry: KeybindingRegistry,
        @inject(UserBehaviorLearningAgent) private readonly behaviorAgent: UserBehaviorLearningAgent,
        @inject(LearningAgent) private readonly learningAgent: LearningAgent
    ) {
        this.sessionId = this.generateSessionId();
    }

    @postConstruct()
    protected init(): void {
        this.setupEditorMonitoring();
        this.setupCommandMonitoring();
        this.setupFileSystemMonitoring();
        this.setupWorkspaceMonitoring();
        this.setupBehaviorLearningIntegration();
    }

    dispose(): void {
        this.disposables.dispose();
        this.onBehaviorDetectedEmitter.dispose();
    }

    /**
     * Set the current user ID (would typically come from authentication service)
     */
    setUserId(userId: string): void {
        this.userId = userId;
    }

    /**
     * Start a new monitoring session
     */
    startNewSession(): void {
        this.sessionId = this.generateSessionId();
        this.emitBehaviorEvent('session-start', 'session', {});
    }

    /**
     * Get current session statistics
     */
    getSessionStats(): {
        sessionId: string;
        userId: string;
        startTime: number;
        totalInteractions: number;
    } {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            startTime: parseInt(this.sessionId.split('-')[1]),
            totalInteractions: this.commandStartTimes.size
        };
    }

    private setupEditorMonitoring(): void {
        // Monitor editor changes
        this.disposables.push(
            this.editorManager.onCurrentEditorChanged(editor => {
                if (editor) {
                    this.emitBehaviorEvent('editor-switch', 'editor', {
                        fileName: editor.uri.path.base,
                        fileType: editor.uri.path.ext,
                        language: editor.document.languageId
                    });
                }
            })
        );

        // Monitor active editor
        this.disposables.push(
            this.editorManager.onActiveEditorChanged(editor => {
                if (editor) {
                    this.emitBehaviorEvent('editor-focus', 'editor', {
                        fileName: editor.uri.path.base,
                        previousActivity: Date.now() - this.lastEditorActivity
                    });
                    this.lastEditorActivity = Date.now();
                }
            })
        );

        // Monitor text changes (throttled)
        let textChangeTimeout: NodeJS.Timeout;
        this.disposables.push(
            this.editorManager.onCurrentEditorChanged(editor => {
                if (editor && editor.document) {
                    const document = editor.document;
                    this.disposables.push(
                        document.onDidChangeContent(e => {
                            clearTimeout(textChangeTimeout);
                            textChangeTimeout = setTimeout(() => {
                                this.emitBehaviorEvent('text-edit', 'editor', {
                                    fileName: editor.uri.path.base,
                                    changeCount: e.contentChanges.length,
                                    linesChanged: this.countLinesChanged(e.contentChanges)
                                });
                            }, 1000); // Throttle to avoid too many events
                        })
                    );
                }
            })
        );
    }

    private setupCommandMonitoring(): void {
        // Intercept command execution
        const originalExecute = this.commandRegistry.executeCommand.bind(this.commandRegistry);
        this.commandRegistry.executeCommand = async (command: string, ...args: any[]) => {
            const startTime = Date.now();
            this.commandStartTimes.set(command, startTime);
            
            try {
                const result = await originalExecute(command, ...args);
                const duration = Date.now() - startTime;
                
                this.emitBehaviorEvent('command-execute', 'command', {
                    command,
                    args: args.length,
                    success: true
                }, duration, true);
                
                return result;
            } catch (error) {
                const duration = Date.now() - startTime;
                
                this.emitBehaviorEvent('command-execute', 'command', {
                    command,
                    args: args.length,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    success: false
                }, duration, false);
                
                throw error;
            } finally {
                this.commandStartTimes.delete(command);
            }
        };
    }

    private setupFileSystemMonitoring(): void {
        // Monitor file operations (if available through FileService events)
        // This would need to be implemented based on the actual FileService API
        
        // For now, we'll monitor workspace file changes
        if (this.workspaceService.workspace) {
            this.disposables.push(
                this.fileService.onDidFilesChange(event => {
                    for (const change of event.changes) {
                        this.emitBehaviorEvent('file-change', 'file', {
                            uri: change.resource.toString(),
                            type: change.type,
                            fileName: change.resource.path.base,
                            fileType: change.resource.path.ext
                        });
                    }
                })
            );
        }
    }

    private setupWorkspaceMonitoring(): void {
        // Monitor workspace changes
        this.disposables.push(
            this.workspaceService.onWorkspaceChanged(workspace => {
                if (workspace) {
                    this.emitBehaviorEvent('workspace-change', 'workspace', {
                        workspacePath: workspace.resource.path.toString(),
                        isMultiRoot: workspace.isDirectory
                    });
                }
            })
        );

        // Monitor workspace location changes
        this.disposables.push(
            this.workspaceService.onWorkspaceLocationChanged(locations => {
                this.emitBehaviorEvent('workspace-location-change', 'workspace', {
                    locationCount: locations.length,
                    locations: locations.map(l => l.toString())
                });
            })
        );
    }

    private setupBehaviorLearningIntegration(): void {
        // Forward all behavior events to learning agents
        this.disposables.push(
            this.onBehaviorDetected(event => {
                // Send to user behavior learning agent
                this.behaviorAgent.trackUserBehavior(
                    event.userId,
                    event.action,
                    event.context,
                    event.duration,
                    event.success
                ).catch(error => {
                    console.error('Error tracking user behavior:', error);
                });

                // Send developer behavior to learning agent
                this.learningAgent.learnDeveloperBehavior(
                    event.userId,
                    event.action,
                    {
                        ...event.context,
                        sessionId: event.sessionId,
                        timestamp: event.timestamp
                    }
                ).catch(error => {
                    console.error('Error learning developer behavior:', error);
                });

                // Special handling for code quality events
                if (event.type === 'editor' && event.action === 'text-edit') {
                    this.handleCodeQualityEvent(event);
                }

                // Special handling for workflow events
                if (this.isWorkflowRelevantEvent(event)) {
                    this.handleWorkflowEvent(event);
                }
            })
        );
    }

    private emitBehaviorEvent(
        action: string,
        type: UserInteractionEvent['type'],
        context: Record<string, any>,
        duration?: number,
        success?: boolean
    ): void {
        const event: UserInteractionEvent = {
            type,
            action,
            timestamp: Date.now(),
            context,
            userId: this.userId,
            sessionId: this.sessionId,
            duration,
            success
        };

        this.onBehaviorDetectedEmitter.fire(event);
    }

    private countLinesChanged(changes: readonly any[]): number {
        // Simplified line count calculation
        return changes.reduce((total, change) => {
            if (change.text) {
                return total + (change.text.split('\n').length - 1);
            }
            return total;
        }, 0);
    }

    private async handleCodeQualityEvent(event: UserInteractionEvent): Promise<void> {
        try {
            // Extract code quality metrics from the edit event
            const qualityData = {
                fileName: event.context.fileName,
                changeCount: event.context.changeCount,
                linesChanged: event.context.linesChanged,
                timestamp: event.timestamp,
                // In a real implementation, you might analyze the actual code changes
                improvementDetected: event.context.linesChanged < 10, // Simple heuristic
                refactoringType: event.context.linesChanged > 20 ? 'large-refactor' : 'small-change',
                patternUsed: 'edit-pattern'
            };

            await this.learningAgent.learnCodeQualityPatterns(event.userId, qualityData);
        } catch (error) {
            console.error('Error handling code quality event:', error);
        }
    }

    private isWorkflowRelevantEvent(event: UserInteractionEvent): boolean {
        // Define which events are relevant for workflow learning
        const workflowActions = [
            'command-execute',
            'file-change',
            'editor-switch',
            'workspace-change'
        ];
        
        return workflowActions.includes(event.action);
    }

    private async handleWorkflowEvent(event: UserInteractionEvent): Promise<void> {
        try {
            // Aggregate workflow data for learning
            const workflowData = {
                action: event.action,
                context: event.context,
                timestamp: event.timestamp,
                sessionId: event.sessionId,
                // Add command frequency tracking
                commands: this.getCommandFrequency(),
                // Add file access patterns
                fileAccess: this.getRecentFileAccess()
            };

            await this.learningAgent.learnWorkflowOptimization(event.userId, workflowData);
        } catch (error) {
            console.error('Error handling workflow event:', error);
        }
    }

    private getCommandFrequency(): Record<string, number> {
        // In a real implementation, this would track command usage over time
        // For now, return a simple mock
        return {
            'file.save': 25,
            'editor.action.formatDocument': 12,
            'workbench.action.quickOpen': 8
        };
    }

    private getRecentFileAccess(): Array<{ fileName: string; timestamp: number }> {
        // In a real implementation, this would track recent file access
        // For now, return a simple mock
        return [
            { fileName: 'main.ts', timestamp: Date.now() - 60000 },
            { fileName: 'utils.ts', timestamp: Date.now() - 120000 },
            { fileName: 'types.ts', timestamp: Date.now() - 180000 }
        ];
    }

    private generateSessionId(): string {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}