/**
 * Copyright (c) 2024 Cognitive Intelligence Ventures.
 * 
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 * 
 * SPDX-License-Identifier: EPL-2.0
 */

import { injectable, inject } from '@theia/core/shared/inversify';
import { OpenCogService } from './opencog-service';
import { CognitivePersonalization } from './cognitive-personalization';

export interface FeedbackData {
    id: string;
    userId: string;
    timestamp: number;
    type: 'explicit' | 'implicit';
    source: string; // e.g., 'suggestion', 'reasoning', 'completion', 'interface'
    context: {
        feature: string;
        action: string;
        environment: string;
        sessionId: string;
    };
    rating?: number; // 1-5 scale for explicit feedback
    sentiment?: 'positive' | 'negative' | 'neutral';
    tags?: string[];
    details?: string;
    helpful?: boolean; // Required for UserFeedback compatibility
    metadata?: Record<string, any>;
}

export interface FeedbackAnalysis {
    averageRating: number;
    sentimentDistribution: { positive: number; negative: number; neutral: number };
    commonTags: Array<{ tag: string; count: number; sentiment: string }>;
    trends: Array<{
        period: string;
        metric: string;
        value: number;
        change: number;
    }>;
    insights: Array<{
        type: 'improvement' | 'warning' | 'success' | 'performance' | 'cognitive';
        description: string;
        confidence: number;
        action?: string;
    }>;
}

export interface LearningObjective {
    id: string;
    name: string;
    description: string;
    metrics: string[];
    targetValue: number;
    currentValue: number;
    status: 'active' | 'completed' | 'paused';
    progress: number;
    deadline?: number;
}

export interface ContinuousImprovement {
    objectives: LearningObjective[];
    experiments: Array<{
        id: string;
        name: string;
        hypothesis: string;
        startDate: number;
        endDate?: number;
        status: 'running' | 'completed' | 'cancelled';
        results?: any;
    }>;
    improvements: Array<{
        id: string;
        description: string;
        implementationDate: number;
        impact: number;
        category: string;
    }>;
}

/**
 * Feedback integration system for collecting user feedback and continuous improvement
 */
@injectable()
export class FeedbackIntegration {
    
    private feedbackHistory: Map<string, FeedbackData[]> = new Map();
    private learningObjectives: Map<string, LearningObjective> = new Map();
    private activeExperiments: Map<string, any> = new Map();
    private improvements: any[] = [];
    private nextFeedbackId = 1;

    constructor(
        @inject(OpenCogService) protected readonly opencog: OpenCogService,
        @inject(CognitivePersonalization) protected readonly personalization: CognitivePersonalization
    ) {}

    /**
     * Collect explicit user feedback
     */
    async collectExplicitFeedback(feedback: {
        userId: string;
        source: string;
        context: any;
        rating: number;
        sentiment?: 'positive' | 'negative' | 'neutral';
        tags?: string[];
        details?: string;
        metadata?: Record<string, any>;
    }): Promise<string> {
        const feedbackId = `feedback_${this.nextFeedbackId++}`;
        
        const feedbackData: FeedbackData = {
            id: feedbackId,
            userId: feedback.userId,
            timestamp: Date.now(),
            type: 'explicit',
            source: feedback.source,
            context: feedback.context,
            rating: feedback.rating,
            sentiment: feedback.sentiment || this.inferSentiment(feedback.rating),
            tags: feedback.tags || [],
            details: feedback.details,
            metadata: feedback.metadata
        };

        // Store feedback
        const userFeedback = this.feedbackHistory.get(feedback.userId) || [];
        userFeedback.push(feedbackData);
        this.feedbackHistory.set(feedback.userId, userFeedback);

        // Learn from feedback in OpenCog
        await this.opencog.learn({
            type: 'behavioral',
            input: {
                feedbackId,
                userId: feedback.userId,
                data: feedbackData
            },
            context: {
                userId: feedback.userId
            }
        });

        // Update personalization based on feedback
        await this.personalization.learnFromInteraction(feedback.userId, {
            action: feedback.source,
            context: feedback.context.feature || 'general',
            satisfaction: feedback.rating
        });

        // Trigger analysis and improvement actions
        await this.analyzeFeedbackAndImprove(feedback.userId, feedbackData);

        return feedbackId;
    }

    /**
     * Collect implicit feedback from user interactions
     */
    async collectImplicitFeedback(interaction: {
        userId: string;
        source: string;
        context: any;
        behavior: {
            action: string;
            duration?: number;
            completionRate?: number;
            errorRate?: number;
            repetitionCount?: number;
        };
        metadata?: Record<string, any>;
    }): Promise<string> {
        const feedbackId = `implicit_${this.nextFeedbackId++}`;
        
        // Infer feedback from behavior
        const impliedRating = this.inferRatingFromBehavior(interaction.behavior);
        const impliedSentiment = this.inferSentiment(impliedRating);
        
        const feedbackData: FeedbackData = {
            id: feedbackId,
            userId: interaction.userId,
            timestamp: Date.now(),
            type: 'implicit',
            source: interaction.source,
            context: interaction.context,
            rating: impliedRating,
            sentiment: impliedSentiment,
            tags: this.extractTagsFromBehavior(interaction.behavior),
            metadata: { behavior: interaction.behavior, ...interaction.metadata }
        };

        // Store feedback
        const userFeedback = this.feedbackHistory.get(interaction.userId) || [];
        userFeedback.push(feedbackData);
        this.feedbackHistory.set(interaction.userId, userFeedback);

        // Learn from implicit feedback
        await this.opencog.learn({
            type: 'behavioral',
            input: {
                feedbackId,
                userId: interaction.userId,
                data: feedbackData,
                behavior: interaction.behavior
            },
            context: {
                userId: interaction.userId
            }
        });

        return feedbackId;
    }

    /**
     * Analyze feedback and generate insights
     */
    async analyzeFeedback(userId?: string, timeRange?: { start: number; end: number }): Promise<FeedbackAnalysis> {
        let allFeedback: FeedbackData[] = [];
        
        if (userId) {
            allFeedback = this.feedbackHistory.get(userId) || [];
        } else {
            for (const userFeedback of this.feedbackHistory.values()) {
                allFeedback.push(...userFeedback);
            }
        }

        // Filter by time range if specified
        if (timeRange) {
            allFeedback = allFeedback.filter(f => 
                f.timestamp >= timeRange.start && f.timestamp <= timeRange.end
            );
        }

        if (allFeedback.length === 0) {
            return this.getEmptyAnalysis();
        }

        // Calculate average rating
        const ratingsWithValues = allFeedback.filter(f => f.rating !== undefined);
        const averageRating = ratingsWithValues.length > 0 
            ? ratingsWithValues.reduce((sum, f) => sum + f.rating!, 0) / ratingsWithValues.length
            : 0;

        // Calculate sentiment distribution
        const sentiments = allFeedback.filter(f => f.sentiment);
        const sentimentCounts = {
            positive: sentiments.filter(f => f.sentiment === 'positive').length,
            negative: sentiments.filter(f => f.sentiment === 'negative').length,
            neutral: sentiments.filter(f => f.sentiment === 'neutral').length
        };
        const totalSentiments = sentiments.length;
        const sentimentDistribution = {
            positive: totalSentiments > 0 ? sentimentCounts.positive / totalSentiments : 0,
            negative: totalSentiments > 0 ? sentimentCounts.negative / totalSentiments : 0,
            neutral: totalSentiments > 0 ? sentimentCounts.neutral / totalSentiments : 0
        };

        // Analyze common tags
        const tagCounts = new Map<string, { count: number; sentiments: string[] }>();
        for (const feedback of allFeedback) {
            if (feedback.tags) {
                for (const tag of feedback.tags) {
                    const tagData = tagCounts.get(tag) || { count: 0, sentiments: [] };
                    tagData.count++;
                    if (feedback.sentiment) {
                        tagData.sentiments.push(feedback.sentiment);
                    }
                    tagCounts.set(tag, tagData);
                }
            }
        }

        const commonTags = Array.from(tagCounts.entries())
            .map(([tag, data]) => ({
                tag,
                count: data.count,
                sentiment: this.getCommonSentiment(data.sentiments)
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Calculate trends
        const trends = this.calculateTrends(allFeedback);

        // Generate insights
        const insights = await this.generateInsights(allFeedback, averageRating, sentimentDistribution);

        return {
            averageRating,
            sentimentDistribution,
            commonTags,
            trends,
            insights
        };
    }

    /**
     * Learn from interactions and adapt behavior
     */
    async learnFromInteractions(userId: string): Promise<{
        learningPoints: Array<{ insight: string; confidence: number }>;
        adaptations: Array<{ feature: string; change: string; reason: string }>;
    }> {
        const userFeedback = this.feedbackHistory.get(userId) || [];
        const learningPoints = [];
        const adaptations = [];

        // Analyze patterns in feedback
        const patterns = await this.identifyFeedbackPatterns(userFeedback);
        
        for (const pattern of patterns) {
            learningPoints.push({
                insight: pattern.description,
                confidence: pattern.confidence
            });

            // Generate adaptations based on patterns
            if (pattern.confidence > 0.7) {
                const adaptation = await this.generateAdaptation(pattern);
                if (adaptation) {
                    adaptations.push(adaptation);
                }
            }
        }

        // Store learning in OpenCog
        await this.opencog.learn({
            type: 'behavioral',
            input: {
                userId,
                learningPoints,
                adaptations,
                timestamp: Date.now()
            },
            context: {
                userId
            }
        });

        return { learningPoints, adaptations };
    }

    /**
     * Implement continuous improvement based on feedback
     */
    async implementContinuousImprovement(): Promise<ContinuousImprovement> {
        // Analyze overall feedback to identify improvement opportunities
        const overallAnalysis = await this.analyzeFeedback();
        
        // Update learning objectives based on insights
        for (const insight of overallAnalysis.insights) {
            if (insight.type === 'improvement' && insight.confidence > 0.6) {
                await this.createOrUpdateLearningObjective(insight);
            }
        }

        // Check for completed objectives
        await this.updateObjectiveProgress();

        // Run active experiments
        await this.updateExperiments();

        return {
            objectives: Array.from(this.learningObjectives.values()),
            experiments: Array.from(this.activeExperiments.values()),
            improvements: this.improvements
        };
    }

    /**
     * Get feedback history for a user
     */
    getFeedbackHistory(userId: string, limit?: number): FeedbackData[] {
        const userFeedback = this.feedbackHistory.get(userId) || [];
        return limit ? userFeedback.slice(-limit) : userFeedback;
    }

    /**
     * Get learning objectives
     */
    getLearningObjectives(): LearningObjective[] {
        return Array.from(this.learningObjectives.values());
    }

    private inferSentiment(rating: number): 'positive' | 'negative' | 'neutral' {
        if (rating >= 4) return 'positive';
        if (rating <= 2) return 'negative';
        return 'neutral';
    }

    private inferRatingFromBehavior(behavior: any): number {
        let rating = 3; // Start with neutral

        // Adjust based on completion rate
        if (behavior.completionRate !== undefined) {
            if (behavior.completionRate > 0.8) rating += 1;
            else if (behavior.completionRate < 0.3) rating -= 1;
        }

        // Adjust based on error rate
        if (behavior.errorRate !== undefined) {
            if (behavior.errorRate > 0.5) rating -= 1;
            else if (behavior.errorRate < 0.1) rating += 0.5;
        }

        // Adjust based on duration (too long might indicate confusion)
        if (behavior.duration !== undefined) {
            // Assuming expected duration is around 30 seconds
            const expectedDuration = 30000;
            if (behavior.duration > expectedDuration * 3) rating -= 0.5;
            else if (behavior.duration < expectedDuration * 0.5) rating += 0.5;
        }

        // Adjust based on repetition (too many might indicate difficulty)
        if (behavior.repetitionCount !== undefined && behavior.repetitionCount > 3) {
            rating -= 0.5;
        }

        return Math.max(1, Math.min(5, Math.round(rating)));
    }

    private extractTagsFromBehavior(behavior: any): string[] {
        const tags = [];
        
        if (behavior.completionRate !== undefined) {
            if (behavior.completionRate > 0.8) tags.push('successful');
            else if (behavior.completionRate < 0.3) tags.push('incomplete');
        }

        if (behavior.errorRate !== undefined) {
            if (behavior.errorRate > 0.3) tags.push('error-prone');
            else if (behavior.errorRate === 0) tags.push('error-free');
        }

        if (behavior.repetitionCount !== undefined && behavior.repetitionCount > 2) {
            tags.push('repeated');
        }

        return tags;
    }

    private getEmptyAnalysis(): FeedbackAnalysis {
        return {
            averageRating: 0,
            sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
            commonTags: [],
            trends: [],
            insights: []
        };
    }

    private getCommonSentiment(sentiments: string[]): string {
        const counts = { positive: 0, negative: 0, neutral: 0 };
        for (const sentiment of sentiments) {
            counts[sentiment as keyof typeof counts]++;
        }
        
        return Object.entries(counts).reduce((a, b) => counts[a[0] as keyof typeof counts] > counts[b[0] as keyof typeof counts] ? a : b)[0];
    }

    private calculateTrends(feedback: FeedbackData[]): Array<{ period: string; metric: string; value: number; change: number }> {
        // Simple trend calculation - compare last week to previous week
        const now = Date.now();
        const weekMs = 7 * 24 * 60 * 60 * 1000;
        
        const lastWeek = feedback.filter(f => f.timestamp > now - weekMs);
        const previousWeek = feedback.filter(f => f.timestamp > now - 2 * weekMs && f.timestamp <= now - weekMs);
        
        const trends = [];
        
        // Rating trend
        if (lastWeek.length > 0 && previousWeek.length > 0) {
            const lastWeekRating = lastWeek.filter(f => f.rating).reduce((sum, f) => sum + f.rating!, 0) / lastWeek.filter(f => f.rating).length;
            const prevWeekRating = previousWeek.filter(f => f.rating).reduce((sum, f) => sum + f.rating!, 0) / previousWeek.filter(f => f.rating).length;
            
            trends.push({
                period: 'week',
                metric: 'average_rating',
                value: lastWeekRating,
                change: lastWeekRating - prevWeekRating
            });
        }

        return trends;
    }

    private async generateInsights(feedback: FeedbackData[], averageRating: number, sentimentDistribution: any): Promise<Array<{ type: 'improvement' | 'warning' | 'success'; description: string; confidence: number; action?: string }>> {
        const insights = [];

        // Low rating insight
        if (averageRating < 3) {
            insights.push({
                type: 'warning' as const,
                description: 'Overall user satisfaction is below average',
                confidence: 0.9,
                action: 'investigate_low_ratings'
            });
        }

        // High negative sentiment
        if (sentimentDistribution.negative > 0.3) {
            insights.push({
                type: 'improvement' as const,
                description: 'High negative sentiment detected - consider UX improvements',
                confidence: 0.8,
                action: 'improve_user_experience'
            });
        }

        // High positive sentiment
        if (sentimentDistribution.positive > 0.7) {
            insights.push({
                type: 'success' as const,
                description: 'Users are generally satisfied with the experience',
                confidence: 0.9
            });
        }

        return insights;
    }

    private async identifyFeedbackPatterns(feedback: FeedbackData[]): Promise<Array<{ description: string; confidence: number; pattern: any }>> {
        const patterns = [];

        // Pattern: Consistently low ratings for specific features
        const featureRatings = new Map<string, number[]>();
        for (const f of feedback) {
            if (f.rating && f.context.feature) {
                const ratings = featureRatings.get(f.context.feature) || [];
                ratings.push(f.rating);
                featureRatings.set(f.context.feature, ratings);
            }
        }

        for (const [feature, ratings] of featureRatings.entries()) {
            if (ratings.length >= 3) {
                const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
                if (avgRating < 3) {
                    patterns.push({
                        description: `Feature "${feature}" consistently receives low ratings`,
                        confidence: Math.min(0.9, (3 - avgRating) / 2),
                        pattern: { type: 'low_feature_rating', feature, avgRating, count: ratings.length }
                    });
                }
            }
        }

        return patterns;
    }

    private async generateAdaptation(pattern: any): Promise<{ feature: string; change: string; reason: string } | null> {
        if (pattern.pattern.type === 'low_feature_rating') {
            return {
                feature: pattern.pattern.feature,
                change: 'Improve user interface and interaction flow',
                reason: `Low average rating of ${pattern.pattern.avgRating.toFixed(1)} from ${pattern.pattern.count} users`
            };
        }
        return null;
    }

    private async analyzeFeedbackAndImprove(userId: string, feedback: FeedbackData): Promise<void> {
        // Quick analysis for immediate improvements
        if (feedback.rating && feedback.rating <= 2) {
            // Low rating - immediate attention needed
            await this.opencog.learn({
                type: 'reinforcement',
                input: {
                    userId,
                    feedback,
                    priority: 'high'
                },
                context: {
                    userId
                }
            });
        }
    }

    private async createOrUpdateLearningObjective(insight: any): Promise<void> {
        const objectiveId = `obj_${insight.description.replace(/\s+/g, '_').toLowerCase()}`;
        
        if (!this.learningObjectives.has(objectiveId)) {
            this.learningObjectives.set(objectiveId, {
                id: objectiveId,
                name: insight.description,
                description: insight.action || 'Improve based on user feedback',
                metrics: ['user_satisfaction', 'error_rate'],
                targetValue: 4.0,
                currentValue: 0,
                status: 'active',
                progress: 0
            });
        }
    }

    private async updateObjectiveProgress(): Promise<void> {
        for (const objective of this.learningObjectives.values()) {
            // Simulate progress updates
            objective.progress = Math.min(100, objective.progress + Math.random() * 10);
            if (objective.progress >= 100) {
                objective.status = 'completed';
            }
        }
    }

    private async updateExperiments(): Promise<void> {
        // Update active experiments
        for (const experiment of this.activeExperiments.values()) {
            if (experiment.status === 'running') {
                // Check if experiment should be completed
                const duration = Date.now() - experiment.startDate;
                if (duration > 7 * 24 * 60 * 60 * 1000) { // 7 days
                    experiment.status = 'completed';
                    experiment.endDate = Date.now();
                    experiment.results = { success: Math.random() > 0.5 };
                }
            }
        }
    }
}