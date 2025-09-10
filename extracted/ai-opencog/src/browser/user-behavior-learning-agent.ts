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
import { Agent, LanguageModelRequirement } from '@theia/ai-core/lib/common/agent';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { EditorManager } from '@theia/editor/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser';
import { VariableResolverService } from '@theia/variable-resolver/lib/browser';
import { OpenCogService } from '../common/opencog-service';
import { LearningData, UserFeedback, LearningContext, UserBehaviorPattern } from '../common/opencog-types';

/**
 * User behavior data structures
 */
export interface UserBehavior {
    userId: string;
    sessionId: string;
    timestamp: number;
    action: string;
    context: Record<string, any>;
    duration?: number;
    success?: boolean;
}

export interface BehaviorAnalytics {
    totalActions: number;
    sessionDuration: number;
    mostFrequentActions: Array<{ action: string; frequency: number }>;
    errorRate: number;
    productivityScore: number;
    learningVelocity: number;
}

/**
 * Enhanced User Behavior Learning Agent for comprehensive behavioral analysis
 * Part of Phase 3: AI Agent Enhancement in the SKZ Integration workflow
 */
@injectable()
export class UserBehaviorLearningAgent implements Agent {
    readonly id = 'user-behavior-learning';
    readonly name = 'User Behavior Learning';
    readonly description = 'Learns from user interactions to improve IDE experience and provide personalized assistance';
    
    readonly variables = [
        'userBehaviorContext',
        'currentSession',
        'behaviorPatterns',
        'learningProgress'
    ];
    
    readonly functions = [
        'analyze-user-behavior',
        'predict-next-action',
        'get-behavior-insights',
        'adapt-interface'
    ];

    readonly prompts = [
        {
            id: 'behavior-analysis-prompt',
            content: `Analyze user behavior patterns based on the following data:
            
Current Session: {{currentSession}}
Behavior Context: {{userBehaviorContext}}
Recent Patterns: {{behaviorPatterns}}

Based on this information, provide insights on:
1. User's current workflow efficiency
2. Potential areas for improvement  
3. Personalized recommendations
4. Predicted next actions

Focus on actionable insights that can improve the development experience.`
        },
        {
            id: 'personalization-prompt',
            content: `Based on user behavior analysis and learning progress: {{learningProgress}}

Suggest personalized IDE configurations and workflows that would benefit this user:
- Interface customizations
- Shortcut recommendations  
- Workflow optimizations
- Learning resources

Provide specific, actionable recommendations tailored to this user's behavior patterns.`
        }
    ];

    private userSessions = new Map<string, UserBehavior[]>();
    private behaviorAnalytics = new Map<string, BehaviorAnalytics>();
    private activeSessionId: string | undefined;
    private sessionStartTime = Date.now();

    constructor(
        @inject(OpenCogService) private readonly openCogService: OpenCogService,
        @inject(WorkspaceService) private readonly workspaceService: WorkspaceService,
        @inject(EditorManager) private readonly editorManager: EditorManager,
        @inject(FileService) private readonly fileService: FileService,
        @inject(VariableResolverService) private readonly variableService: VariableResolverService
    ) {}

    @postConstruct()
    protected init(): void {
        this.startBehaviorTracking();
        this.activeSessionId = this.generateSessionId();
    }

    /**
     * Track user behavior from various IDE interactions
     */
    async trackUserBehavior(
        userId: string,
        action: string,
        context: Record<string, any>,
        duration?: number,
        success?: boolean
    ): Promise<void> {
        const behavior: UserBehavior = {
            userId,
            sessionId: this.activeSessionId || this.generateSessionId(),
            timestamp: Date.now(),
            action,
            context,
            duration,
            success
        };

        // Store locally for analysis
        const userBehaviors = this.userSessions.get(userId) || [];
        userBehaviors.push(behavior);
        this.userSessions.set(userId, userBehaviors);

        // Learn from the behavior using OpenCog
        await this.learnFromBehavior(behavior);

        // Update analytics
        await this.updateBehaviorAnalytics(userId, behavior);

        // Predict next action based on patterns
        await this.predictNextUserAction(userId, context);
    }

    /**
     * Learn user preferences from repeated behaviors
     */
    async learnUserPreferences(userId: string): Promise<Record<string, any>> {
        const userBehaviors = this.userSessions.get(userId) || [];
        const preferences: Record<string, any> = {};

        // Analyze file access patterns
        const fileAccesses = userBehaviors.filter(b => b.action.includes('file'));
        const fileTypes = this.extractFileTypes(fileAccesses);
        preferences.preferredFileTypes = fileTypes;

        // Analyze command usage patterns
        const commandUsages = userBehaviors.filter(b => b.action.includes('command'));
        const frequentCommands = this.getFrequentCommands(commandUsages);
        preferences.frequentCommands = frequentCommands;

        // Analyze timing patterns
        const timingPatterns = this.analyzeTimingPatterns(userBehaviors);
        preferences.workingHours = timingPatterns.activeHours;
        preferences.sessionLength = timingPatterns.averageSessionLength;

        // Analyze error patterns for learning opportunities
        const errorBehaviors = userBehaviors.filter(b => b.success === false);
        preferences.commonErrors = this.analyzeErrorPatterns(errorBehaviors);

        // Store preferences in OpenCog for reasoning
        await this.openCogService.personalize(userId, preferences);

        return preferences;
    }

    /**
     * Get behavior-based recommendations for the user
     */
    async getBehaviorRecommendations(userId: string): Promise<Array<{ type: string; recommendation: string; confidence: number }>> {
        const preferences = await this.learnUserPreferences(userId);
        const analytics = this.behaviorAnalytics.get(userId);
        const behaviorPatterns = await this.openCogService.getUserBehaviorPatterns(userId);

        const recommendations: Array<{ type: string; recommendation: string; confidence: number }> = [];

        // Efficiency recommendations
        if (analytics && analytics.productivityScore < 0.6) {
            recommendations.push({
                type: 'productivity',
                recommendation: 'Consider using keyboard shortcuts for frequently used commands',
                confidence: 0.8
            });
        }

        // Learning recommendations  
        if (analytics && analytics.errorRate > 0.2) {
            recommendations.push({
                type: 'learning',
                recommendation: 'Tutorial recommendations based on common error patterns',
                confidence: 0.7
            });
        }

        // Workflow recommendations
        const workflowOptimizations = await this.identifyWorkflowOptimizations(userId, behaviorPatterns);
        recommendations.push(...workflowOptimizations);

        // Interface customization recommendations
        if (preferences.preferredFileTypes.length > 0) {
            recommendations.push({
                type: 'interface',
                recommendation: `Customize file explorer for ${preferences.preferredFileTypes.join(', ')} development`,
                confidence: 0.6
            });
        }

        return recommendations;
    }

    /**
     * Adapt the IDE interface based on learned behaviors
     */
    async adaptInterfaceForUser(userId: string): Promise<Record<string, any>> {
        const preferences = await this.learnUserPreferences(userId);
        const behaviorPatterns = await this.openCogService.getUserBehaviorPatterns(userId);
        
        const adaptations: Record<string, any> = {};

        // Adapt file explorer based on file access patterns
        if (preferences.preferredFileTypes.length > 0) {
            adaptations.fileExplorer = {
                prioritizeFileTypes: preferences.preferredFileTypes,
                showRecentFiles: true
            };
        }

        // Adapt command palette based on usage
        if (preferences.frequentCommands.length > 0) {
            adaptations.commandPalette = {
                prioritizeCommands: preferences.frequentCommands.slice(0, 10)
            };
        }

        // Adapt editor based on coding patterns
        const codingPatterns = behaviorPatterns.filter(p => p.pattern.includes('coding'));
        if (codingPatterns.length > 0) {
            adaptations.editor = {
                suggestionsBasedOnPatterns: true,
                highlightFrequentlyUsedSymbols: true
            };
        }

        // Store adaptations in OpenCog for future use
        await this.openCogService.adaptToUser(userId, 'interface', adaptations);

        return adaptations;
    }

    /**
     * Get comprehensive behavior analytics for a user
     */
    async getBehaviorAnalytics(userId: string): Promise<BehaviorAnalytics> {
        let analytics = this.behaviorAnalytics.get(userId);
        
        if (!analytics) {
            // Calculate analytics from behavior data
            const userBehaviors = this.userSessions.get(userId) || [];
            analytics = this.calculateAnalytics(userBehaviors);
            this.behaviorAnalytics.set(userId, analytics);
        }

        return analytics;
    }

    /**
     * Provide feedback on AI assistance based on user behavior
     */
    async provideBehavioralFeedback(
        userId: string,
        assistanceType: string,
        wasHelpful: boolean,
        context: Record<string, any>
    ): Promise<void> {
        const feedback: UserFeedback = {
            rating: wasHelpful ? 5 : 2,
            helpful: wasHelpful,
            comment: `Behavioral feedback for ${assistanceType}`,
            outcome: wasHelpful ? 'accepted' : 'rejected',
            timestamp: Date.now()
        };

        const learningContext: LearningContext = {
            userId,
            workspaceId: this.workspaceService.workspace?.resource.toString(),
            currentTask: context.currentTask || 'assistance',
            userExperience: context.userExperience || 'intermediate',
            preferences: await this.learnUserPreferences(userId)
        };

        await this.openCogService.learnFromFeedback(feedback, learningContext);

        // Track the feedback as a behavior
        await this.trackUserBehavior(userId, 'provide-feedback', {
            assistanceType,
            wasHelpful,
            ...context
        }, undefined, wasHelpful);
    }

    private async learnFromBehavior(behavior: UserBehavior): Promise<void> {
        const learningData: LearningData = {
            type: 'behavioral',
            data: {
                action: behavior.action,
                context: behavior.context,
                timing: behavior.timestamp,
                duration: behavior.duration,
                success: behavior.success
            },
            context: {
                userId: behavior.userId,
                sessionId: behavior.sessionId,
                workspaceId: this.workspaceService.workspace?.resource.toString(),
                currentTask: 'user_behavior_learning'
            },
            timestamp: behavior.timestamp
        };

        await this.openCogService.learn(learningData);
    }

    private async updateBehaviorAnalytics(userId: string, behavior: UserBehavior): Promise<void> {
        const existingAnalytics = this.behaviorAnalytics.get(userId) || {
            totalActions: 0,
            sessionDuration: 0,
            mostFrequentActions: [],
            errorRate: 0,
            productivityScore: 0.5,
            learningVelocity: 0
        };

        existingAnalytics.totalActions++;
        
        // Update session duration
        const sessionStart = this.sessionStartTime;
        existingAnalytics.sessionDuration = Date.now() - sessionStart;

        // Update error rate
        if (behavior.success === false) {
            const errorCount = existingAnalytics.totalActions * existingAnalytics.errorRate + 1;
            existingAnalytics.errorRate = errorCount / existingAnalytics.totalActions;
        }

        // Update productivity score based on duration and success
        if (behavior.duration && behavior.success !== false) {
            const efficiency = behavior.duration > 0 ? 1 / behavior.duration * 1000 : 1;
            existingAnalytics.productivityScore = (existingAnalytics.productivityScore + efficiency) / 2;
        }

        this.behaviorAnalytics.set(userId, existingAnalytics);
    }

    private async predictNextUserAction(userId: string, context: Record<string, any>): Promise<void> {
        const predictions = await this.openCogService.predictUserAction(userId, context);
        
        // Store predictions for future reference
        if (predictions.length > 0) {
            await this.trackUserBehavior(userId, 'prediction-generated', {
                predictions,
                currentContext: context
            });
        }
    }

    private startBehaviorTracking(): void {
        // Track editor events
        this.editorManager.onCurrentEditorChanged(editor => {
            if (editor) {
                this.trackUserBehavior('default-user', 'editor-switch', {
                    fileName: editor.uri.path.base,
                    fileType: editor.uri.path.ext
                });
            }
        });

        // Track workspace events
        this.workspaceService.onWorkspaceChanged(workspace => {
            if (workspace) {
                this.trackUserBehavior('default-user', 'workspace-change', {
                    workspacePath: workspace.resource.path.toString()
                });
            }
        });
    }

    private generateSessionId(): string {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private extractFileTypes(fileAccesses: UserBehavior[]): string[] {
        const fileTypes = new Map<string, number>();
        
        fileAccesses.forEach(behavior => {
            const fileName = behavior.context.fileName;
            if (fileName && typeof fileName === 'string') {
                const ext = fileName.split('.').pop() || '';
                fileTypes.set(ext, (fileTypes.get(ext) || 0) + 1);
            }
        });

        return Array.from(fileTypes.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([ext]) => ext);
    }

    private getFrequentCommands(commandUsages: UserBehavior[]): string[] {
        const commands = new Map<string, number>();
        
        commandUsages.forEach(behavior => {
            const command = behavior.context.command;
            if (command) {
                commands.set(command, (commands.get(command) || 0) + 1);
            }
        });

        return Array.from(commands.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([cmd]) => cmd);
    }

    private analyzeTimingPatterns(behaviors: UserBehavior[]): { activeHours: number[]; averageSessionLength: number } {
        const hours = behaviors.map(b => new Date(b.timestamp).getHours());
        const hourCounts = new Map<number, number>();
        
        hours.forEach(hour => {
            hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
        });

        const activeHours = Array.from(hourCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([hour]) => hour);

        // Calculate average session length (simplified)
        const averageSessionLength = behaviors.length > 0 ? 
            (Date.now() - this.sessionStartTime) / behaviors.length : 0;

        return { activeHours, averageSessionLength };
    }

    private analyzeErrorPatterns(errorBehaviors: UserBehavior[]): Array<{ error: string; frequency: number }> {
        const errors = new Map<string, number>();
        
        errorBehaviors.forEach(behavior => {
            const errorType = behavior.context.errorType || behavior.action;
            errors.set(errorType, (errors.get(errorType) || 0) + 1);
        });

        return Array.from(errors.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([error, frequency]) => ({ error, frequency }));
    }

    private async identifyWorkflowOptimizations(
        userId: string, 
        behaviorPatterns: UserBehaviorPattern[]
    ): Promise<Array<{ type: string; recommendation: string; confidence: number }>> {
        const optimizations: Array<{ type: string; recommendation: string; confidence: number }> = [];

        // Analyze patterns for optimization opportunities
        const repeatedPatterns = behaviorPatterns.filter(p => p.frequency > 3);
        
        for (const pattern of repeatedPatterns) {
            if (pattern.pattern.includes('file-open')) {
                optimizations.push({
                    type: 'workflow',
                    recommendation: 'Create workspace templates for frequently opened file combinations',
                    confidence: 0.7
                });
            }
            
            if (pattern.pattern.includes('command-search')) {
                optimizations.push({
                    type: 'workflow',
                    recommendation: 'Set up custom keyboard shortcuts for frequently searched commands',
                    confidence: 0.8
                });
            }
        }

        return optimizations;
    }

    private calculateAnalytics(behaviors: UserBehavior[]): BehaviorAnalytics {
        const totalActions = behaviors.length;
        const sessionDuration = totalActions > 0 ? (Date.now() - this.sessionStartTime) : 0;
        
        // Calculate most frequent actions
        const actionCounts = new Map<string, number>();
        behaviors.forEach(b => {
            actionCounts.set(b.action, (actionCounts.get(b.action) || 0) + 1);
        });
        
        const mostFrequentActions = Array.from(actionCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([action, frequency]) => ({ action, frequency }));

        // Calculate error rate
        const errorCount = behaviors.filter(b => b.success === false).length;
        const errorRate = totalActions > 0 ? errorCount / totalActions : 0;

        // Calculate productivity score (simplified)
        const successfulActions = behaviors.filter(b => b.success !== false).length;
        const productivityScore = totalActions > 0 ? successfulActions / totalActions : 0.5;

        // Calculate learning velocity (rate of improvement over time)
        const learningVelocity = this.calculateLearningVelocity(behaviors);

        return {
            totalActions,
            sessionDuration,
            mostFrequentActions,
            errorRate,
            productivityScore,
            learningVelocity
        };
    }

    private calculateLearningVelocity(behaviors: UserBehavior[]): number {
        if (behaviors.length < 10) return 0;

        // Simple learning velocity calculation based on success rate improvement over time
        const early = behaviors.slice(0, behaviors.length / 2);
        const recent = behaviors.slice(behaviors.length / 2);

        const earlySuccessRate = early.filter(b => b.success !== false).length / early.length;
        const recentSuccessRate = recent.filter(b => b.success !== false).length / recent.length;

        return recentSuccessRate - earlySuccessRate;
    }

    // Agent interface requirements
    languageModelRequirements: LanguageModelRequirement[] = [
        {
            purpose: 'behavior-analysis',
            identifier: 'behavior-model',
        }
    ];
}