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
import { Disposable, DisposableCollection } from '@theia/core/lib/common/disposable';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { NavigatorContribution } from '@theia/navigator/lib/browser/navigator-contribution';
import { TerminalService } from '@theia/terminal/lib/browser/base/terminal-service';
import { TaskService } from '@theia/task/lib/browser/task-service';
import { DebugService } from '@theia/debug/lib/browser/debug-service';
import { OpenCogService } from '../common/opencog-service';
import { Atom } from '../common/opencog-types';
import { UserActivity, Sensor } from '../common/sensor-motor-types';

/**
 * Monitors user activity including editor interactions, tool usage, and workflow patterns
 */
@injectable()
export class ActivitySensor implements Sensor, Disposable {

    protected disposables = new DisposableCollection();
    protected active = false;
    protected activityHistory: UserActivity[] = [];
    private readonly maxHistorySize = 1000;

    constructor(
        @inject(EditorManager) private readonly editorManager: EditorManager,
        @inject(NavigatorContribution) private readonly navigator: NavigatorContribution,
        @inject(TerminalService) private readonly terminalService: TerminalService,
        @inject(TaskService) private readonly taskService: TaskService,
        @inject(DebugService) private readonly debugService: DebugService,
        @inject(OpenCogService) private readonly opencog: OpenCogService
    ) {}

    async start(): Promise<void> {
        if (this.active) {
            return;
        }

        this.active = true;
        this.setupEditorMonitoring();
        this.setupNavigatorMonitoring();
        this.setupTerminalMonitoring();
        this.setupTaskMonitoring();
        this.setupDebugMonitoring();
    }

    async stop(): Promise<void> {
        this.active = false;
        this.disposables.dispose();
    }

    isActive(): boolean {
        return this.active;
    }

    dispose(): void {
        this.stop();
    }

    private setupEditorMonitoring(): void {
        // Monitor editor creation/activation
        this.disposables.push(
            this.editorManager.onCreated(widget => {
                this.recordActivity({
                    type: 'edit',
                    details: { action: 'open', uri: widget.editor.uri.toString() },
                    timestamp: Date.now(),
                    context: { file: widget.editor.uri.toString() }
                });
            })
        );

        this.disposables.push(
            this.editorManager.onCurrentEditorChanged(widget => {
                if (widget) {
                    this.recordActivity({
                        type: 'navigate',
                        details: { action: 'switch-editor', uri: widget.editor.uri.toString() },
                        timestamp: Date.now(),
                        context: { file: widget.editor.uri.toString() }
                    });
                }
            })
        );

        // Monitor text document changes
        this.disposables.push(
            this.editorManager.onCurrentEditorChanged(widget => {
                if (widget?.editor) {
                    const editor = widget.editor;
                    
                    // Monitor cursor position changes
                    const cursorListener = editor.onCursorPositionChanged(position => {
                        this.recordActivity({
                            type: 'navigate',
                            details: { action: 'cursor-move', position },
                            timestamp: Date.now(),
                            context: {
                                file: editor.uri.toString(),
                                line: position.lineNumber,
                                column: position.column
                            }
                        });
                    });
                    
                    // Monitor selection changes
                    const selectionListener = editor.onSelectionChanged(selection => {
                        this.recordActivity({
                            type: 'edit',
                            details: { action: 'selection-change', selection },
                            timestamp: Date.now(),
                            context: {
                                file: editor.uri.toString(),
                                selection: selection.text
                            }
                        });
                    });

                    // Monitor document changes
                    const changeListener = editor.onDocumentContentChanged(event => {
                        this.recordActivity({
                            type: 'edit',
                            details: { 
                                action: 'content-change', 
                                changes: event.contentChanges.length 
                            },
                            timestamp: Date.now(),
                            context: {
                                file: editor.uri.toString(),
                                line: event.contentChanges[0]?.range?.start?.line
                            }
                        });
                    });

                    this.disposables.push(cursorListener, selectionListener, changeListener);
                }
            })
        );
    }

    private setupNavigatorMonitoring(): void {
        // Monitor file navigation
        // Note: This is a simplified implementation as NavigatorContribution 
        // doesn't expose all the events we might want to monitor
        this.disposables.push(
            this.editorManager.onCurrentEditorChanged(widget => {
                if (widget) {
                    this.recordActivity({
                        type: 'navigate',
                        details: { action: 'file-navigate', uri: widget.editor.uri.toString() },
                        timestamp: Date.now(),
                        context: { file: widget.editor.uri.toString() }
                    });
                }
            })
        );
    }

    private setupTerminalMonitoring(): void {
        // Monitor terminal creation and usage
        this.disposables.push(
            this.terminalService.onDidCreateTerminal(terminal => {
                this.recordActivity({
                    type: 'build',
                    details: { action: 'terminal-create', terminalId: terminal.id },
                    timestamp: Date.now(),
                    context: { terminal: terminal.id }
                });
            })
        );

        this.disposables.push(
            this.terminalService.onDidChangeActiveTerminal(terminal => {
                if (terminal) {
                    this.recordActivity({
                        type: 'build',
                        details: { action: 'terminal-activate', terminalId: terminal.id },
                        timestamp: Date.now(),
                        context: { terminal: terminal.id }
                    });
                }
            })
        );
    }

    private setupTaskMonitoring(): void {
        // Monitor task execution
        this.disposables.push(
            this.taskService.onDidStartTask(task => {
                this.recordActivity({
                    type: 'build',
                    details: { 
                        action: 'task-start', 
                        taskLabel: task.config.label,
                        taskType: task.config.type 
                    },
                    timestamp: Date.now(),
                    context: { task: task.config.label }
                });
            })
        );

        this.disposables.push(
            this.taskService.onDidEndTask(result => {
                this.recordActivity({
                    type: 'build',
                    details: { 
                        action: 'task-end',
                        taskLabel: result.task.config.label,
                        exitCode: result.exitCode
                    },
                    timestamp: Date.now(),
                    duration: Date.now() - (result.task as any).startTime,
                    context: { task: result.task.config.label }
                });
            })
        );
    }

    private setupDebugMonitoring(): void {
        // Monitor debug session lifecycle
        this.disposables.push(
            this.debugService.onDidStartDebugSession(session => {
                this.recordActivity({
                    type: 'debug',
                    details: { 
                        action: 'debug-start',
                        sessionId: session.id,
                        sessionType: session.configuration.type 
                    },
                    timestamp: Date.now(),
                    context: { debugSession: session.id }
                });
            })
        );

        this.disposables.push(
            this.debugService.onDidTerminateDebugSession(session => {
                this.recordActivity({
                    type: 'debug',
                    details: { 
                        action: 'debug-end',
                        sessionId: session.id 
                    },
                    timestamp: Date.now(),
                    context: { debugSession: session.id }
                });
            })
        );

        // Monitor breakpoint changes
        this.disposables.push(
            this.debugService.getModel().onDidChangeBreakpoints(event => {
                this.recordActivity({
                    type: 'debug',
                    details: { 
                        action: 'breakpoint-change',
                        added: event.added?.length || 0,
                        removed: event.removed?.length || 0,
                        changed: event.changed?.length || 0
                    },
                    timestamp: Date.now()
                });
            })
        );
    }

    private recordActivity(activity: UserActivity): void {
        this.activityHistory.push(activity);
        
        // Maintain history size limit
        if (this.activityHistory.length > this.maxHistorySize) {
            this.activityHistory = this.activityHistory.slice(-this.maxHistorySize);
        }

        // Extract and add atoms to OpenCog
        this.extractActivityAtoms(activity).then(atoms => {
            this.addAtomsToOpenCog(atoms);
        }).catch(console.error);

        // Detect workflow patterns
        this.detectWorkflowPatterns();
    }

    private async extractActivityAtoms(activity: UserActivity): Promise<Atom[]> {
        const atoms: Atom[] = [];

        // Create basic activity atom
        const activityAtom: Atom = {
            type: 'UserActivityAtom',
            name: `activity-${activity.timestamp}`,
            metadata: {
                activityType: activity.type,
                details: activity.details,
                timestamp: activity.timestamp,
                duration: activity.duration,
                context: activity.context
            },
            truthValue: {
                strength: 0.9,
                confidence: 0.8
            }
        };
        atoms.push(activityAtom);

        // Create activity type atom
        const typeAtom: Atom = {
            type: 'ActivityTypeAtom',
            name: activity.type,
            truthValue: { strength: 1.0, confidence: 0.9 }
        };
        atoms.push(typeAtom);

        // Create relationship between activity and type
        const isActivityAtom: Atom = {
            type: 'EvaluationLink',
            outgoing: [
                { type: 'PredicateNode', name: 'is-activity-type' },
                { type: 'ListLink', outgoing: [activityAtom, typeAtom] }
            ],
            truthValue: { strength: 1.0, confidence: 0.9 }
        };
        atoms.push(isActivityAtom);

        // Add context-specific atoms
        if (activity.context?.file) {
            const fileAtom: Atom = {
                type: 'FileAtom',
                name: activity.context.file,
                truthValue: { strength: 1.0, confidence: 0.9 }
            };
            atoms.push(fileAtom);

            const interactsWithAtom: Atom = {
                type: 'EvaluationLink',
                outgoing: [
                    { type: 'PredicateNode', name: 'interacts-with' },
                    { type: 'ListLink', outgoing: [activityAtom, fileAtom] }
                ],
                truthValue: { strength: 0.9, confidence: 0.8 }
            };
            atoms.push(interactsWithAtom);
        }

        return atoms;
    }

    private detectWorkflowPatterns(): void {
        // Analyze recent activity patterns
        const recentActivities = this.activityHistory.slice(-20); // Last 20 activities
        const patterns = this.findSequentialPatterns(recentActivities);
        
        for (const pattern of patterns) {
            this.createWorkflowPatternAtoms(pattern);
        }
    }

    private findSequentialPatterns(activities: UserActivity[]): Array<{ sequence: string[]; frequency: number; confidence: number }> {
        const patterns: Array<{ sequence: string[]; frequency: number; confidence: number }> = [];
        
        // Look for common sequences of length 3
        for (let i = 0; i <= activities.length - 3; i++) {
            const sequence = activities.slice(i, i + 3).map(a => `${a.type}:${a.details.action}`);
            
            // Count occurrences of this sequence
            let frequency = 0;
            for (let j = 0; j <= activities.length - 3; j++) {
                const checkSequence = activities.slice(j, j + 3).map(a => `${a.type}:${a.details.action}`);
                if (JSON.stringify(sequence) === JSON.stringify(checkSequence)) {
                    frequency++;
                }
            }
            
            if (frequency > 1) {
                patterns.push({
                    sequence,
                    frequency,
                    confidence: Math.min(frequency / 10, 0.9) // Cap confidence at 0.9
                });
            }
        }
        
        return patterns;
    }

    private async createWorkflowPatternAtoms(pattern: { sequence: string[]; frequency: number; confidence: number }): Promise<void> {
        const atoms: Atom[] = [];
        
        const patternAtom: Atom = {
            type: 'WorkflowPatternAtom',
            name: `pattern-${pattern.sequence.join('-')}`,
            metadata: {
                sequence: pattern.sequence,
                frequency: pattern.frequency,
                discoveredAt: Date.now()
            },
            truthValue: {
                strength: pattern.confidence,
                confidence: 0.8
            }
        };
        atoms.push(patternAtom);

        await this.addAtomsToOpenCog(atoms);
    }

    private async addAtomsToOpenCog(atoms: Atom[]): Promise<void> {
        try {
            for (const atom of atoms) {
                await this.opencog.addAtom(atom);
            }
        } catch (error) {
            console.error('Error adding activity atoms to OpenCog:', error);
        }
    }

    /**
     * Get recent activity history
     */
    getActivityHistory(limit?: number): UserActivity[] {
        return limit ? this.activityHistory.slice(-limit) : [...this.activityHistory];
    }

    /**
     * Get activity statistics
     */
    getActivityStats(): Record<string, any> {
        const typeCount: Record<string, number> = {};
        const actionCount: Record<string, number> = {};
        
        for (const activity of this.activityHistory) {
            typeCount[activity.type] = (typeCount[activity.type] || 0) + 1;
            const action = `${activity.type}:${activity.details.action}`;
            actionCount[action] = (actionCount[action] || 0) + 1;
        }
        
        return {
            totalActivities: this.activityHistory.length,
            typeDistribution: typeCount,
            actionDistribution: actionCount,
            timespan: this.activityHistory.length > 0 
                ? this.activityHistory[this.activityHistory.length - 1].timestamp - this.activityHistory[0].timestamp
                : 0
        };
    }
}