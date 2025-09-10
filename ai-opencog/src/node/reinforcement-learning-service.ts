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

import { injectable } from '@theia/core/shared/inversify';
import {
    ReinforcementLearningService,
    LearningResult,
    OutcomeBasedInput,
    SuccessPattern
} from '../common/learning-services';
import { LearningContext } from '../common/opencog-types';

/**
 * Implementation of ReinforcementLearningService
 * Learns from outcomes and rewards to optimize behavior
 */
@injectable()
export class ReinforcementLearningServiceImpl implements ReinforcementLearningService {
    
    private readonly outcomeHistory: Map<string, OutcomeBasedInput[]> = new Map();
    private readonly successPatterns: Map<string, SuccessPattern[]> = new Map();
    private readonly actionValues: Map<string, number> = new Map(); // Q-values
    private readonly learningRate = 0.1;
    private readonly discountFactor = 0.9;
    private readonly explorationRate = 0.1;

    async learnFromOutcome(input: OutcomeBasedInput): Promise<LearningResult> {
        try {
            // Store outcome in history
            const actionKey = this.normalizeAction(input.action);
            if (!this.outcomeHistory.has(actionKey)) {
                this.outcomeHistory.set(actionKey, []);
            }
            this.outcomeHistory.get(actionKey)!.push(input);
            
            // Update Q-values based on outcome
            const reward = this.calculateReward(input);
            this.updateQValue(actionKey, reward);
            
            // Update success patterns
            const patternUpdated = this.updateSuccessPatterns(input);
            
            // Calculate learning metrics
            const accuracy = this.calculateActionAccuracy(actionKey);
            const confidence = this.calculateLearningConfidence(input);
            
            // Generate insights
            const insights = this.generateOutcomeLearningInsights(input, actionKey);
            
            return {
                success: true,
                modelUpdated: patternUpdated,
                accuracy,
                confidence,
                insights
            };
        } catch (error) {
            return {
                success: false,
                modelUpdated: false,
                confidence: 0,
                insights: [`Reinforcement learning failed: ${error.message}`]
            };
        }
    }

    async recognizeSuccessPatterns(data: any[]): Promise<SuccessPattern[]> {
        try {
            const patterns: SuccessPattern[] = [];
            
            // Group data by action/context
            const actionGroups = this.groupDataByAction(data);
            
            for (const [action, actionData] of actionGroups.entries()) {
                // Analyze success patterns for this action
                const actionPatterns = this.extractSuccessPatternsForAction(action, actionData);
                patterns.push(...actionPatterns);
            }
            
            // Store recognized patterns
            for (const pattern of patterns) {
                const actionKey = this.extractActionFromPattern(pattern);
                if (!this.successPatterns.has(actionKey)) {
                    this.successPatterns.set(actionKey, []);
                }
                this.successPatterns.get(actionKey)!.push(pattern);
            }
            
            return patterns.sort((a, b) => b.successRate - a.successRate);
        } catch (error) {
            return [];
        }
    }

    async optimizeAdaptiveAssistance(userId: string, context: LearningContext): Promise<{ optimizations: any[]; confidence: number }> {
        try {
            const optimizations: any[] = [];
            
            // Get user's historical data
            const userHistory = this.getUserHistory(userId);
            const contextualHistory = this.getContextualHistory(context);
            
            // Generate personalization optimizations
            const personalizationOpts = this.generatePersonalizationOptimizations(userHistory, context);
            optimizations.push(...personalizationOpts);
            
            // Generate contextual optimizations
            const contextualOpts = this.generateContextualOptimizations(contextualHistory, context);
            optimizations.push(...contextualOpts);
            
            // Generate adaptive behavior optimizations
            const adaptiveOpts = this.generateAdaptiveBehaviorOptimizations(userId, context);
            optimizations.push(...adaptiveOpts);
            
            // Calculate overall confidence
            const confidence = this.calculateOptimizationConfidence(optimizations, userHistory.length);
            
            return {
                optimizations,
                confidence
            };
        } catch (error) {
            return {
                optimizations: [],
                confidence: 0
            };
        }
    }

    /**
     * Normalize action for consistent key generation
     */
    private normalizeAction(action: string): string {
        return action.toLowerCase().trim().replace(/\s+/g, '_');
    }

    /**
     * Calculate reward based on outcome
     */
    private calculateReward(input: OutcomeBasedInput): number {
        let reward = 0;
        
        // Base reward from outcome
        switch (input.outcome) {
            case 'success':
                reward = 1.0;
                break;
            case 'partial_success':
                reward = 0.5;
                break;
            case 'failure':
                reward = -0.5;
                break;
            default:
                reward = 0;
        }
        
        // Adjust based on metrics if available
        if (input.metrics) {
            if (input.metrics.efficiency) {
                reward += (input.metrics.efficiency - 0.5) * 0.3;
            }
            if (input.metrics.accuracy) {
                reward += (input.metrics.accuracy - 0.5) * 0.3;
            }
            if (input.metrics.userSatisfaction) {
                reward += (input.metrics.userSatisfaction - 0.5) * 0.4;
            }
        }
        
        return Math.max(-1, Math.min(1, reward));
    }

    /**
     * Update Q-value using Q-learning algorithm
     */
    private updateQValue(actionKey: string, reward: number): void {
        const currentQ = this.actionValues.get(actionKey) || 0;
        const maxFutureQ = this.getMaxFutureQValue(actionKey);
        
        // Q-learning update rule: Q(s,a) = Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]
        const newQ = currentQ + this.learningRate * (reward + this.discountFactor * maxFutureQ - currentQ);
        
        this.actionValues.set(actionKey, newQ);
    }

    /**
     * Get maximum future Q-value (simplified - would use state transitions in full implementation)
     */
    private getMaxFutureQValue(actionKey: string): number {
        // Simplified: return average of related Q-values
        const relatedActions = this.getRelatedActions(actionKey);
        if (relatedActions.length === 0) return 0;
        
        const relatedValues = relatedActions.map(action => this.actionValues.get(action) || 0);
        return Math.max(...relatedValues);
    }

    /**
     * Get actions related to the current action
     */
    private getRelatedActions(actionKey: string): string[] {
        const related: string[] = [];
        const actionParts = actionKey.split('_');
        
        for (const [otherAction] of this.actionValues.entries()) {
            if (otherAction !== actionKey) {
                const otherParts = otherAction.split('_');
                const commonParts = actionParts.filter(part => otherParts.includes(part));
                
                if (commonParts.length > 0) {
                    related.push(otherAction);
                }
            }
        }
        
        return related;
    }

    /**
     * Update success patterns based on outcome
     */
    private updateSuccessPatterns(input: OutcomeBasedInput): boolean {
        if (input.outcome !== 'success') return false;
        
        const actionKey = this.normalizeAction(input.action);
        const contextPattern = this.extractContextPattern(input.context);
        
        // Find or create success pattern
        const patterns = this.successPatterns.get(actionKey) || [];
        const existingPattern = patterns.find(p => this.patternsMatch(p.pattern, contextPattern));
        
        if (existingPattern) {
            // Update existing pattern
            existingPattern.successRate = this.updateSuccessRate(existingPattern.successRate, true);
            existingPattern.confidence = Math.min(0.95, existingPattern.confidence + 0.02);
        } else {
            // Create new pattern
            const newPattern: SuccessPattern = {
                pattern: contextPattern,
                successRate: 0.8, // Initial optimistic rate
                confidence: 0.6,
                applicableContexts: this.extractApplicableContexts(input.context)
            };
            patterns.push(newPattern);
            this.successPatterns.set(actionKey, patterns);
        }
        
        return true;
    }

    /**
     * Extract context pattern from learning context
     */
    private extractContextPattern(context?: LearningContext): any {
        if (!context) return { type: 'general' };
        
        return {
            type: 'contextual',
            projectType: context.projectType,
            userExperience: context.userExperience,
            currentTask: context.currentTask,
            environmentInfo: context.environmentInfo
        };
    }

    /**
     * Check if two patterns match
     */
    private patternsMatch(pattern1: any, pattern2: any): boolean {
        return JSON.stringify(pattern1) === JSON.stringify(pattern2);
    }

    /**
     * Update success rate using exponential moving average
     */
    private updateSuccessRate(currentRate: number, success: boolean): number {
        const alpha = 0.2; // Smoothing factor
        const newValue = success ? 1 : 0;
        return currentRate * (1 - alpha) + newValue * alpha;
    }

    /**
     * Extract applicable contexts from learning context
     */
    private extractApplicableContexts(context?: LearningContext): string[] {
        const contexts: string[] = [];
        
        if (!context) return ['general'];
        
        if (context.projectType) contexts.push(`project_${context.projectType}`);
        if (context.userExperience) contexts.push(`experience_${context.userExperience}`);
        if (context.currentTask) contexts.push(`task_${context.currentTask}`);
        
        return contexts.length > 0 ? contexts : ['general'];
    }

    /**
     * Calculate action accuracy based on historical outcomes
     */
    private calculateActionAccuracy(actionKey: string): number {
        const history = this.outcomeHistory.get(actionKey) || [];
        if (history.length === 0) return 0.5;
        
        const successes = history.filter(h => h.outcome === 'success').length;
        const partialSuccesses = history.filter(h => h.outcome === 'partial_success').length;
        
        return (successes + partialSuccesses * 0.5) / history.length;
    }

    /**
     * Calculate learning confidence
     */
    private calculateLearningConfidence(input: OutcomeBasedInput): number {
        let confidence = 0.5;
        
        // Higher confidence for successful outcomes
        if (input.outcome === 'success') confidence += 0.3;
        else if (input.outcome === 'partial_success') confidence += 0.1;
        else confidence -= 0.2;
        
        // Adjust based on metrics
        if (input.metrics) {
            const avgMetric = Object.values(input.metrics).reduce((sum, val) => sum + val, 0) / Object.keys(input.metrics).length;
            confidence += (avgMetric - 0.5) * 0.2;
        }
        
        // Historical data bonus
        const actionKey = this.normalizeAction(input.action);
        const historySize = (this.outcomeHistory.get(actionKey) || []).length;
        const historyBonus = Math.min(0.2, historySize / 20);
        
        return Math.max(0.1, Math.min(0.95, confidence + historyBonus));
    }

    /**
     * Generate insights from outcome learning
     */
    private generateOutcomeLearningInsights(input: OutcomeBasedInput, actionKey: string): string[] {
        const insights: string[] = [];
        
        // Outcome-specific insights
        switch (input.outcome) {
            case 'success':
                insights.push(`Action "${input.action}" completed successfully - reinforcing positive pattern`);
                break;
            case 'partial_success':
                insights.push(`Action "${input.action}" partially successful - identifying improvement opportunities`);
                break;
            case 'failure':
                insights.push(`Action "${input.action}" failed - learning from negative outcome`);
                break;
        }
        
        // Q-value insights
        const qValue = this.actionValues.get(actionKey) || 0;
        if (qValue > 0.5) {
            insights.push(`High value action identified (Q=${qValue.toFixed(2)})`);
        } else if (qValue < -0.2) {
            insights.push(`Low value action detected (Q=${qValue.toFixed(2)}) - consider alternatives`);
        }
        
        // Historical performance insights
        const accuracy = this.calculateActionAccuracy(actionKey);
        if (accuracy > 0.8) {
            insights.push(`Consistently successful action (${(accuracy * 100).toFixed(1)}% success rate)`);
        } else if (accuracy < 0.4) {
            insights.push(`Poor performing action (${(accuracy * 100).toFixed(1)}% success rate) - needs optimization`);
        }
        
        return insights;
    }

    /**
     * Group data by action for pattern analysis
     */
    private groupDataByAction(data: any[]): Map<string, any[]> {
        const groups = new Map<string, any[]>();
        
        for (const item of data) {
            const action = item.action || item.type || 'unknown';
            const actionKey = this.normalizeAction(action);
            
            if (!groups.has(actionKey)) {
                groups.set(actionKey, []);
            }
            groups.get(actionKey)!.push(item);
        }
        
        return groups;
    }

    /**
     * Extract success patterns for a specific action
     */
    private extractSuccessPatternsForAction(action: string, data: any[]): SuccessPattern[] {
        const patterns: SuccessPattern[] = [];
        
        // Analyze success/failure outcomes
        const outcomes = data.map(d => d.outcome || d.result || 'unknown');
        const successes = outcomes.filter(o => o === 'success').length;
        const total = outcomes.length;
        
        if (total === 0) return patterns;
        
        const successRate = successes / total;
        
        // Extract context patterns from successful instances
        const successfulData = data.filter(d => (d.outcome || d.result) === 'success');
        const contextGroups = this.groupByContext(successfulData);
        
        for (const [contextKey, contextData] of contextGroups.entries()) {
            if (contextData.length >= 2) { // Minimum instances for pattern
                const pattern: SuccessPattern = {
                    pattern: this.parseContextKey(contextKey),
                    successRate: contextData.length / data.length,
                    confidence: Math.min(0.9, contextData.length / 5),
                    applicableContexts: [contextKey]
                };
                patterns.push(pattern);
            }
        }
        
        return patterns;
    }

    /**
     * Group data by context for pattern analysis
     */
    private groupByContext(data: any[]): Map<string, any[]> {
        const groups = new Map<string, any[]>();
        
        for (const item of data) {
            const contextKey = this.generateContextKey(item.context);
            if (!groups.has(contextKey)) {
                groups.set(contextKey, []);
            }
            groups.get(contextKey)!.push(item);
        }
        
        return groups;
    }

    /**
     * Generate context key for grouping
     */
    private generateContextKey(context: any): string {
        if (!context) return 'general';
        
        const parts: string[] = [];
        if (context.projectType) parts.push(`proj_${context.projectType}`);
        if (context.userExperience) parts.push(`exp_${context.userExperience}`);
        if (context.currentTask) parts.push(`task_${context.currentTask}`);
        
        return parts.length > 0 ? parts.join('_') : 'general';
    }

    /**
     * Parse context key back to readable format
     */
    private parseContextKey(contextKey: string): any {
        const parts = contextKey.split('_');
        const pattern: any = {};
        
        for (let i = 0; i < parts.length; i += 2) {
            if (i + 1 < parts.length) {
                pattern[parts[i]] = parts[i + 1];
            }
        }
        
        return pattern;
    }

    /**
     * Extract action from success pattern
     */
    private extractActionFromPattern(pattern: SuccessPattern): string {
        // Extract action from pattern or use general key
        return 'general_action';
    }

    /**
     * Get user history for personalization
     */
    private getUserHistory(userId: string): OutcomeBasedInput[] {
        const userHistory: OutcomeBasedInput[] = [];
        
        for (const [, history] of this.outcomeHistory.entries()) {
            userHistory.push(...history.filter(h => h.context?.userId === userId));
        }
        
        return userHistory;
    }

    /**
     * Get contextual history
     */
    private getContextualHistory(context: LearningContext): OutcomeBasedInput[] {
        const contextualHistory: OutcomeBasedInput[] = [];
        
        for (const [, history] of this.outcomeHistory.entries()) {
            contextualHistory.push(...history.filter(h => this.contextMatches(h.context, context)));
        }
        
        return contextualHistory;
    }

    /**
     * Check if contexts match
     */
    private contextMatches(context1?: LearningContext, context2?: LearningContext): boolean {
        if (!context1 || !context2) return false;
        
        return context1.projectType === context2.projectType ||
               context1.userExperience === context2.userExperience ||
               context1.currentTask === context2.currentTask;
    }

    /**
     * Generate personalization optimizations
     */
    private generatePersonalizationOptimizations(userHistory: OutcomeBasedInput[], context: LearningContext): any[] {
        const optimizations: any[] = [];
        
        if (userHistory.length > 5) {
            // Analyze user's successful patterns
            const successes = userHistory.filter(h => h.outcome === 'success');
            const successfulActions = successes.map(s => s.action);
            
            if (successfulActions.length > 0) {
                optimizations.push({
                    type: 'personalization',
                    description: 'Prioritize actions with high user success rate',
                    details: {
                        recommendedActions: [...new Set(successfulActions)].slice(0, 3),
                        successRate: successes.length / userHistory.length
                    },
                    confidence: Math.min(0.9, successes.length / 10)
                });
            }
        }
        
        return optimizations;
    }

    /**
     * Generate contextual optimizations
     */
    private generateContextualOptimizations(contextualHistory: OutcomeBasedInput[], context: LearningContext): any[] {
        const optimizations: any[] = [];
        
        if (contextualHistory.length > 3) {
            const contextSuccessRate = contextualHistory.filter(h => h.outcome === 'success').length / contextualHistory.length;
            
            if (contextSuccessRate > 0.7) {
                optimizations.push({
                    type: 'contextual',
                    description: 'High success rate in similar contexts',
                    details: {
                        contextType: this.generateContextKey(context),
                        successRate: contextSuccessRate,
                        sampleSize: contextualHistory.length
                    },
                    confidence: Math.min(0.8, contextualHistory.length / 15)
                });
            }
        }
        
        return optimizations;
    }

    /**
     * Generate adaptive behavior optimizations
     */
    private generateAdaptiveBehaviorOptimizations(userId: string, context: LearningContext): any[] {
        const optimizations: any[] = [];
        
        // Analyze Q-values for adaptive behavior
        const topActions = Array.from(this.actionValues.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
        
        if (topActions.length > 0 && topActions[0][1] > 0.3) {
            optimizations.push({
                type: 'adaptive',
                description: 'Learned optimal actions through reinforcement',
                details: {
                    topActions: topActions.map(([action, value]) => ({ action, value: value.toFixed(3) })),
                    explorationRate: this.explorationRate
                },
                confidence: 0.7
            });
        }
        
        return optimizations;
    }

    /**
     * Calculate optimization confidence
     */
    private calculateOptimizationConfidence(optimizations: any[], historySize: number): number {
        if (optimizations.length === 0) return 0;
        
        const avgConfidence = optimizations.reduce((sum, opt) => sum + (opt.confidence || 0.5), 0) / optimizations.length;
        const dataBonus = Math.min(0.2, historySize / 50);
        const diversityBonus = Math.min(0.1, new Set(optimizations.map(o => o.type)).size / 3);
        
        return Math.min(0.95, avgConfidence + dataBonus + diversityBonus);
    }
}