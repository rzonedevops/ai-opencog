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
import { Agent } from '@theia/ai-core/lib/common/agent';
import { AgentService } from '@theia/ai-core/lib/common/agent-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { OpenCogService, LearningData, UserFeedback, LearningContext } from '../common';

/**
 * Specialized agent for learning and adaptation within the IDE
 */
@injectable()
export class LearningAdaptationAgent implements Agent {
    readonly id = 'opencog-learning-adaptation';
    readonly name = 'Learning & Adaptation Agent';
    readonly description = 'OpenCog-powered agent that learns from user behavior and adapts the IDE experience';

    constructor(
        @inject(OpenCogService) private readonly openCogService: OpenCogService,
        @inject(WorkspaceService) private readonly workspaceService: WorkspaceService
    ) {}

    /**
     * Learn from user feedback on suggestions or actions
     */
    async learnFromFeedback(
        userId: string,
        suggestion: any,
        feedback: UserFeedback,
        context?: any
    ): Promise<void> {
        const learningContext: LearningContext = {
            userId,
            workspaceId: this.workspaceService.workspace?.resource.toString(),
            currentTask: context?.task || 'general',
            userExperience: context?.userExperience || 'intermediate',
            preferences: context?.preferences || {},
            environmentInfo: {
                timestamp: Date.now(),
                ideVersion: 'theia-1.64.0',
                ...context?.environment
            }
        };

        await this.openCogService.learnFromFeedback(feedback, learningContext);

        // Also record the specific suggestion for pattern learning
        const learningData: LearningData = {
            type: 'supervised',
            input: suggestion,
            expectedOutput: feedback.outcome === 'accepted' ? suggestion : null,
            feedback,
            context: learningContext,
            timestamp: Date.now(),
            priority: this.determineLearningPriority(feedback)
        };

        await this.openCogService.learn(learningData);
    }

    /**
     * Learn from user behavior patterns
     */
    async learnUserBehavior(
        userId: string,
        action: string,
        context: any
    ): Promise<void> {
        const enhancedContext = {
            ...context,
            workspace: this.workspaceService.workspace?.resource.toString(),
            timestamp: Date.now()
        };

        await this.openCogService.learnUserBehavior(userId, action, enhancedContext);
    }

    /**
     * Adapt IDE behavior based on user patterns
     */
    async adaptToUser(userId: string, domain: string, currentData: any): Promise<any> {
        const strategy = await this.openCogService.adaptToUser(userId, domain, currentData);
        
        // Apply adaptation strategy to IDE
        return this.applyAdaptationStrategy(strategy, domain, currentData);
    }

    /**
     * Predict user's next likely action
     */
    async predictUserAction(userId: string, context: any): Promise<{ action: string; confidence: number }[]> {
        const enhancedContext = {
            ...context,
            workspace: this.workspaceService.workspace?.resource.toString(),
            timestamp: Date.now()
        };

        return this.openCogService.predictUserAction(userId, enhancedContext);
    }

    /**
     * Get personalized recommendations for the user
     */
    async getPersonalizedRecommendations(userId: string, context: any): Promise<any[]> {
        const predictions = await this.predictUserAction(userId, context);
        const personalization = await this.openCogService.getPersonalization(userId);
        const behaviorPatterns = await this.openCogService.getUserBehaviorPatterns(userId);

        return this.generateRecommendations(predictions, personalization, behaviorPatterns, context);
    }

    /**
     * Learn from code editing patterns
     */
    async learnCodeEditingPatterns(
        userId: string,
        editAction: {
            type: 'insert' | 'delete' | 'replace';
            content: string;
            location: { line: number; column: number };
            fileType: string;
        },
        context: any
    ): Promise<void> {
        const learningData: LearningData = {
            type: 'behavioral',
            input: editAction,
            context: {
                userId,
                currentTask: 'code_editing',
                ...context
            },
            timestamp: Date.now()
        };

        await this.openCogService.learn(learningData);
    }

    /**
     * Learn from debugging sessions
     */
    async learnDebuggingPatterns(
        userId: string,
        debugSession: {
            issueType: string;
            resolution: string;
            timeSpent: number;
            successful: boolean;
        },
        context: any
    ): Promise<void> {
        const feedback: UserFeedback = {
            rating: debugSession.successful ? 5 : 2,
            helpful: debugSession.successful,
            comment: `Debug session: ${debugSession.issueType}`,
            outcome: debugSession.successful ? 'accepted' : 'rejected',
            timeSpent: debugSession.timeSpent
        };

        const learningContext: LearningContext = {
            userId,
            currentTask: 'debugging',
            ...context
        };

        await this.openCogService.learnFromFeedback(feedback, learningContext);
    }

    /**
     * Continuous learning from IDE usage
     */
    async startContinuousLearning(userId: string): Promise<void> {
        // This would set up event listeners for various IDE actions
        // For now, we'll just create a learning session
        const learningData: LearningData = {
            type: 'adaptive',
            input: { sessionStart: true },
            context: {
                userId,
                currentTask: 'continuous_learning'
            },
            timestamp: Date.now()
        };

        await this.openCogService.learn(learningData);
    }

    private determineLearningPriority(feedback: UserFeedback): 'low' | 'medium' | 'high' | 'critical' {
        if (feedback.rating <= 2) return 'high';
        if (feedback.helpful === false) return 'high';
        if (feedback.outcome === 'rejected') return 'medium';
        return 'low';
    }

    private async applyAdaptationStrategy(strategy: any, domain: string, currentData: any): Promise<any> {
        // Apply the adaptation strategy to modify IDE behavior
        const adaptations: any = {};

        switch (domain) {
            case 'code_completion':
                adaptations.suggestionCount = strategy.strategy.suggestionCount || 5;
                adaptations.prioritizeRecent = strategy.strategy.prioritizeRecent || false;
                break;
            case 'debugging':
                adaptations.verboseLogging = strategy.strategy.verboseLogging || false;
                adaptations.autoBreakpoints = strategy.strategy.autoBreakpoints || false;
                break;
            case 'navigation':
                adaptations.showRecentFiles = strategy.strategy.showRecentFiles || true;
                adaptations.groupByProject = strategy.strategy.groupByProject || false;
                break;
            default:
                adaptations.general = strategy.strategy;
        }

        return adaptations;
    }

    private generateRecommendations(
        predictions: { action: string; confidence: number }[],
        personalization: Record<string, any>,
        behaviorPatterns: any[],
        context: any
    ): any[] {
        const recommendations: any[] = [];

        // Generate recommendations based on predictions
        for (const prediction of predictions.slice(0, 3)) {
            if (prediction.confidence > 0.6) {
                recommendations.push({
                    type: 'predicted_action',
                    action: prediction.action,
                    confidence: prediction.confidence,
                    reason: 'Based on your recent behavior patterns'
                });
            }
        }

        // Generate recommendations based on personalization
        if (personalization.preferredLanguage) {
            recommendations.push({
                type: 'language_suggestion',
                suggestion: `Create new ${personalization.preferredLanguage} file`,
                confidence: 0.8,
                reason: 'Based on your language preferences'
            });
        }

        // Generate recommendations based on behavior patterns
        const frequentPatterns = behaviorPatterns
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 2);

        for (const pattern of frequentPatterns) {
            recommendations.push({
                type: 'workflow_suggestion',
                suggestion: `Continue with ${pattern.pattern}`,
                confidence: pattern.confidence,
                reason: 'Based on your frequent workflow patterns'
            });
        }

        return recommendations;
    }
}