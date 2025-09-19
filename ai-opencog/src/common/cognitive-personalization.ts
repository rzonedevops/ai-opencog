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

export interface UserPreferences {
    // UI preferences
    theme?: 'light' | 'dark' | 'auto';
    layout?: 'classic' | 'modern' | 'minimal';
    fontSize?: number;
    
    // Cognitive preferences
    reasoningDepth?: 'shallow' | 'medium' | 'deep';
    learningRate?: 'conservative' | 'moderate' | 'aggressive';
    suggestionFrequency?: 'low' | 'medium' | 'high';
    
    // Interaction preferences
    explanationLevel?: 'brief' | 'detailed' | 'comprehensive';
    notificationStyle?: 'minimal' | 'informative' | 'verbose';
    
    // Personalization settings
    adaptiveInterface?: boolean;
    contextAwareness?: boolean;
    proactiveAssistance?: boolean;
    
    // Learning preferences
    preferredLanguages?: string[];
    codingStyle?: 'functional' | 'object-oriented' | 'procedural';
    errorTolerance?: 'strict' | 'moderate' | 'lenient';
}

export interface UserContext {
    currentProject?: string;
    recentFiles?: string[];
    activeWorkspace?: string;
    sessionDuration?: number;
    interactionHistory?: Array<{
        timestamp: number;
        action: string;
        context: string;
        satisfaction?: number;
    }>;
}

export interface PersonalizationProfile {
    userId: string;
    preferences: UserPreferences;
    context: UserContext;
    adaptations: Array<{
        feature: string;
        adaptation: any;
        confidence: number;
        timestamp: number;
    }>;
    learningHistory: Array<{
        timestamp: number;
        insight: string;
        source: 'explicit' | 'implicit';
        strength: number;
    }>;
}

/**
 * Cognitive personalization service that adapts the IDE experience to individual user preferences and behaviors
 */
@injectable()
export class CognitivePersonalization {
    
    constructor(
        @inject(OpenCogService) protected readonly opencog: OpenCogService
    ) {}

    private profiles = new Map<string, PersonalizationProfile>();

    /**
     * Adapt interface and behavior to user preferences
     */
    async adaptToUser(userId: string, preferences: UserPreferences): Promise<void> {
        const profile = this.getOrCreateProfile(userId);
        
        // Update preferences
        profile.preferences = { ...profile.preferences, ...preferences };
        
        // Store learning data in OpenCog
        await this.opencog.learn({
            type: 'personalization',
            input: preferences,
            context: {
                userId
            },
            timestamp: Date.now()
        });

        // Apply adaptations based on preferences
        await this.applyAdaptations(userId, preferences);
        
        this.profiles.set(userId, profile);
    }

    /**
     * Learn from user interactions implicitly
     */
    async learnFromInteraction(userId: string, interaction: {
        action: string;
        context: string;
        duration?: number;
        success?: boolean;
        satisfaction?: number;
    }): Promise<void> {
        const profile = this.getOrCreateProfile(userId);
        
        // Add to interaction history
        profile.context.interactionHistory = profile.context.interactionHistory || [];
        profile.context.interactionHistory.push({
            timestamp: Date.now(),
            action: interaction.action,
            context: interaction.context,
            satisfaction: interaction.satisfaction
        });

        // Analyze patterns and generate insights
        const insights = await this.analyzeInteractionPatterns(userId);
        
        // Store insights as learning data
        for (const insight of insights) {
            profile.learningHistory.push({
                timestamp: Date.now(),
                insight: insight.description,
                source: 'implicit',
                strength: insight.confidence
            });

            // Learn from the pattern in OpenCog
            await this.opencog.learn({
                type: 'behavioral',
                input: insight,
                context: {
                    userId
                },
                timestamp: Date.now()
            });
        }

        this.profiles.set(userId, profile);
    }

    /**
     * Get personalized recommendations for the user
     */
    async getRecommendations(userId: string, context?: string): Promise<Array<{
        type: string;
        description: string;
        confidence: number;
        action?: any;
    }>> {
        const profile = this.profiles.get(userId);
        if (!profile) {
            return [];
        }

        const recommendations = [];

        // Analyze current context and preferences to generate recommendations
        if (profile.preferences.proactiveAssistance) {
            // Get context-aware suggestions from OpenCog
            const cognitiveRecommendations = await this.opencog.reason({
                type: 'assistance-analysis',
                context: { userId, preferences: profile.preferences, context: context || 'general' },
                parameters: { analysisType: 'personalization_recommendations' }
            });

            if (cognitiveRecommendations && cognitiveRecommendations.metadata?.patterns) {
                for (const pattern of cognitiveRecommendations.metadata.patterns) {
                    recommendations.push({
                        type: 'cognitive',
                        description: pattern.description || 'Personalized suggestion',
                        confidence: pattern.confidence || 0.5,
                        action: pattern.action
                    });
                }
            }
        }

        // Add preference-based recommendations
        if (profile.preferences.adaptiveInterface) {
            recommendations.push(...this.generateUIRecommendations(profile));
        }

        return recommendations.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Update user context (workspace, files, etc.)
     */
    async updateContext(userId: string, context: Partial<UserContext>): Promise<void> {
        const profile = this.getOrCreateProfile(userId);
        profile.context = { ...profile.context, ...context };
        this.profiles.set(userId, profile);
    }

    /**
     * Get user's personalization profile
     */
    getProfile(userId: string): PersonalizationProfile | undefined {
        return this.profiles.get(userId);
    }

    /**
     * Get or create a profile for the user
     */
    private getOrCreateProfile(userId: string): PersonalizationProfile {
        let profile = this.profiles.get(userId);
        if (!profile) {
            profile = {
                userId,
                preferences: {
                    theme: 'auto',
                    reasoningDepth: 'medium',
                    learningRate: 'moderate',
                    suggestionFrequency: 'medium',
                    explanationLevel: 'detailed',
                    adaptiveInterface: true,
                    contextAwareness: true,
                    proactiveAssistance: true
                },
                context: {},
                adaptations: [],
                learningHistory: []
            };
            this.profiles.set(userId, profile);
        }
        return profile;
    }

    /**
     * Apply adaptations based on user preferences
     */
    private async applyAdaptations(userId: string, preferences: UserPreferences): Promise<void> {
        const profile = this.getOrCreateProfile(userId);
        
        // Generate adaptations based on preferences
        const adaptations = [];

        if (preferences.reasoningDepth) {
            adaptations.push({
                feature: 'reasoning_depth',
                adaptation: this.mapReasoningDepth(preferences.reasoningDepth),
                confidence: 1.0,
                timestamp: Date.now()
            });
        }

        if (preferences.suggestionFrequency) {
            adaptations.push({
                feature: 'suggestion_frequency',
                adaptation: this.mapSuggestionFrequency(preferences.suggestionFrequency),
                confidence: 1.0,
                timestamp: Date.now()
            });
        }

        if (preferences.explanationLevel) {
            adaptations.push({
                feature: 'explanation_detail',
                adaptation: this.mapExplanationLevel(preferences.explanationLevel),
                confidence: 1.0,
                timestamp: Date.now()
            });
        }

        // Store adaptations
        profile.adaptations.push(...adaptations);
    }

    /**
     * Analyze interaction patterns to generate insights
     */
    private async analyzeInteractionPatterns(userId: string): Promise<Array<{
        description: string;
        confidence: number;
        pattern: any;
    }>> {
        const profile = this.profiles.get(userId);
        if (!profile?.context.interactionHistory) {
            return [];
        }

        const insights = [];
        const history = profile.context.interactionHistory;

        // Analyze frequency patterns
        const actionFrequency = new Map<string, number>();
        for (const interaction of history) {
            actionFrequency.set(interaction.action, (actionFrequency.get(interaction.action) || 0) + 1);
        }

        // Find frequently used actions
        for (const [action, count] of actionFrequency.entries()) {
            if (count > 5) {
                insights.push({
                    description: `Frequently uses ${action}`,
                    confidence: Math.min(count / 20, 1.0),
                    pattern: { type: 'frequent_action', action, count }
                });
            }
        }

        // Analyze satisfaction patterns
        const satisfactionByAction = new Map<string, number[]>();
        for (const interaction of history) {
            if (interaction.satisfaction !== undefined) {
                if (!satisfactionByAction.has(interaction.action)) {
                    satisfactionByAction.set(interaction.action, []);
                }
                satisfactionByAction.get(interaction.action)!.push(interaction.satisfaction);
            }
        }

        // Find actions with consistently high/low satisfaction
        for (const [action, satisfactions] of satisfactionByAction.entries()) {
            const avgSatisfaction = satisfactions.reduce((a, b) => a + b, 0) / satisfactions.length;
            if (avgSatisfaction < 3) {
                insights.push({
                    description: `Low satisfaction with ${action}`,
                    confidence: (5 - avgSatisfaction) / 2,
                    pattern: { type: 'low_satisfaction', action, satisfaction: avgSatisfaction }
                });
            } else if (avgSatisfaction > 4) {
                insights.push({
                    description: `High satisfaction with ${action}`,
                    confidence: avgSatisfaction / 5,
                    pattern: { type: 'high_satisfaction', action, satisfaction: avgSatisfaction }
                });
            }
        }

        return insights;
    }

    /**
     * Generate UI-related recommendations
     */
    private generateUIRecommendations(profile: PersonalizationProfile): Array<{
        type: string;
        description: string;
        confidence: number;
        action?: any;
    }> {
        const recommendations = [];

        // Recommend theme changes based on usage patterns
        if (profile.context.sessionDuration && profile.context.sessionDuration > 3600000) { // > 1 hour
            recommendations.push({
                type: 'ui',
                description: 'Consider switching to dark theme for longer sessions to reduce eye strain',
                confidence: 0.7,
                action: { type: 'theme_change', theme: 'dark' }
            });
        }

        // Recommend layout optimizations
        const frequentActions = profile.context.interactionHistory?.filter(h => h.action.includes('file') || h.action.includes('editor')) || [];
        if (frequentActions.length > 20) {
            recommendations.push({
                type: 'ui',
                description: 'Consider enabling file tree auto-expand for faster navigation',
                confidence: 0.6,
                action: { type: 'setting_change', setting: 'explorer.autoExpand', value: true }
            });
        }

        return recommendations;
    }

    private mapReasoningDepth(depth: string): number {
        switch (depth) {
            case 'shallow': return 2;
            case 'medium': return 5;
            case 'deep': return 10;
            default: return 5;
        }
    }

    private mapSuggestionFrequency(frequency: string): number {
        switch (frequency) {
            case 'low': return 0.3;
            case 'medium': return 0.6;
            case 'high': return 0.9;
            default: return 0.6;
        }
    }

    private mapExplanationLevel(level: string): number {
        switch (level) {
            case 'brief': return 1;
            case 'detailed': return 2;
            case 'comprehensive': return 3;
            default: return 2;
        }
    }
}