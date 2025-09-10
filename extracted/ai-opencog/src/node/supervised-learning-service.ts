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
    SupervisedLearningService,
    LearningResult
} from '../common/learning-services';
import { UserFeedback, LearningContext, LearningData } from '../common/opencog-types';

/**
 * Implementation of SupervisedLearningService
 * Learns from labeled data and user feedback
 */
@injectable()
export class SupervisedLearningServiceImpl implements SupervisedLearningService {
    
    private readonly learningHistory: Map<string, LearningData[]> = new Map();
    private readonly userFeedbackHistory: Map<string, UserFeedback[]> = new Map();
    private readonly modelAccuracy: Map<string, number> = new Map();

    async learnFromFeedback(action: string, feedback: UserFeedback): Promise<LearningResult> {
        try {
            // Store feedback for future reference
            if (!this.userFeedbackHistory.has(action)) {
                this.userFeedbackHistory.set(action, []);
            }
            this.userFeedbackHistory.get(action)!.push(feedback);
            
            // Create learning data from feedback
            const learningData: LearningData = {
                type: 'supervised',
                input: action,
                expectedOutput: feedback.outcome,
                feedback,
                timestamp: Date.now(),
                priority: this.calculatePriority(feedback)
            };
            
            // Update learning history
            if (!this.learningHistory.has(action)) {
                this.learningHistory.set(action, []);
            }
            this.learningHistory.get(action)!.push(learningData);
            
            // Update model based on feedback
            const modelUpdated = this.updateModel(action, feedback);
            const accuracy = this.calculateAccuracy(action);
            
            // Generate insights from feedback
            const insights = this.generateInsights(action, feedback);
            
            return {
                success: true,
                modelUpdated,
                accuracy,
                confidence: this.calculateConfidence(feedback),
                insights
            };
        } catch (error) {
            return {
                success: false,
                modelUpdated: false,
                confidence: 0,
                insights: [`Failed to learn from feedback: ${error.message}`]
            };
        }
    }

    async trainWithExamples(examples: { input: any; output: any }[]): Promise<LearningResult> {
        try {
            let successCount = 0;
            const insights: string[] = [];
            
            for (const example of examples) {
                const learningData: LearningData = {
                    type: 'supervised',
                    input: example.input,
                    expectedOutput: example.output,
                    timestamp: Date.now(),
                    priority: 'medium'
                };
                
                const inputKey = this.serializeInput(example.input);
                if (!this.learningHistory.has(inputKey)) {
                    this.learningHistory.set(inputKey, []);
                }
                this.learningHistory.get(inputKey)!.push(learningData);
                
                successCount++;
            }
            
            // Calculate overall accuracy
            const totalExamples = examples.length;
            const accuracy = successCount / totalExamples;
            
            insights.push(`Trained on ${totalExamples} examples with ${(accuracy * 100).toFixed(1)}% success rate`);
            insights.push(`Learning patterns identified in ${this.learningHistory.size} different input categories`);
            
            return {
                success: successCount === totalExamples,
                modelUpdated: successCount > 0,
                accuracy,
                confidence: Math.min(0.95, accuracy * 0.8 + 0.2),
                insights
            };
        } catch (error) {
            return {
                success: false,
                modelUpdated: false,
                accuracy: 0,
                confidence: 0,
                insights: [`Training failed: ${error.message}`]
            };
        }
    }

    async predictOutcome(input: any, context?: LearningContext): Promise<{ prediction: any; confidence: number }> {
        try {
            const inputKey = this.serializeInput(input);
            const history = this.learningHistory.get(inputKey) || [];
            
            if (history.length === 0) {
                // No direct history, try to find similar patterns
                const similarHistory = this.findSimilarHistory(input);
                return this.predictFromSimilarHistory(similarHistory, context);
            }
            
            // Predict based on historical outcomes
            const outcomes = history.map(h => h.expectedOutput).filter(o => o !== undefined);
            
            if (outcomes.length === 0) {
                return {
                    prediction: null,
                    confidence: 0.1
                };
            }
            
            // Find most common outcome
            const outcomeCounts = this.countOutcomes(outcomes);
            const mostCommon = this.getMostCommonOutcome(outcomeCounts);
            
            // Calculate confidence based on consistency and sample size
            const consistency = outcomeCounts.get(mostCommon) / outcomes.length;
            const sampleSizeBonus = Math.min(0.3, outcomes.length / 20);
            const confidence = Math.min(0.95, consistency * 0.7 + sampleSizeBonus);
            
            // Apply context adjustments
            const adjustedConfidence = context ? this.applyContextAdjustments(confidence, context) : confidence;
            
            return {
                prediction: mostCommon,
                confidence: adjustedConfidence
            };
        } catch (error) {
            return {
                prediction: `Error in prediction: ${error.message}`,
                confidence: 0
            };
        }
    }

    /**
     * Calculate priority based on feedback
     */
    private calculatePriority(feedback: UserFeedback): 'low' | 'medium' | 'high' | 'critical' {
        if (feedback.rating <= 2) {
            return 'critical';
        } else if (feedback.rating === 3) {
            return 'high';
        } else if (feedback.rating === 4) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Update model based on feedback
     */
    private updateModel(action: string, feedback: UserFeedback): boolean {
        try {
            // Update accuracy tracking
            const currentAccuracy = this.modelAccuracy.get(action) || 0.5;
            const feedbackValue = feedback.helpful ? 1 : 0;
            
            // Simple learning rate adjustment
            const learningRate = 0.1;
            const newAccuracy = currentAccuracy + learningRate * (feedbackValue - currentAccuracy);
            
            this.modelAccuracy.set(action, newAccuracy);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Calculate accuracy for an action
     */
    private calculateAccuracy(action: string): number {
        const feedbackHistory = this.userFeedbackHistory.get(action) || [];
        
        if (feedbackHistory.length === 0) {
            return 0.5; // Default neutral accuracy
        }
        
        const positiveCount = feedbackHistory.filter(f => f.helpful).length;
        return positiveCount / feedbackHistory.length;
    }

    /**
     * Calculate confidence from feedback
     */
    private calculateConfidence(feedback: UserFeedback): number {
        let confidence = 0.5; // Base confidence
        
        // Adjust based on rating
        confidence += (feedback.rating - 3) * 0.1; // Rating of 3 is neutral
        
        // Adjust based on helpful flag
        if (feedback.helpful) {
            confidence += 0.2;
        } else {
            confidence -= 0.2;
        }
        
        // Adjust based on outcome
        if (feedback.outcome === 'accepted') {
            confidence += 0.3;
        } else if (feedback.outcome === 'rejected') {
            confidence -= 0.3;
        } else if (feedback.outcome === 'modified') {
            confidence += 0.1;
        }
        
        return Math.max(0.1, Math.min(0.95, confidence));
    }

    /**
     * Generate insights from feedback
     */
    private generateInsights(action: string, feedback: UserFeedback): string[] {
        const insights: string[] = [];
        
        if (feedback.helpful) {
            insights.push(`Action "${action}" was found helpful by user`);
        } else {
            insights.push(`Action "${action}" needs improvement based on user feedback`);
        }
        
        if (feedback.comment) {
            insights.push(`User provided specific feedback: "${feedback.comment}"`);
        }
        
        if (feedback.timeSpent && feedback.timeSpent > 10) {
            insights.push('User spent significant time with the suggestion');
        }
        
        const accuracy = this.calculateAccuracy(action);
        if (accuracy > 0.8) {
            insights.push(`High accuracy (${(accuracy * 100).toFixed(1)}%) for this type of action`);
        } else if (accuracy < 0.4) {
            insights.push(`Low accuracy (${(accuracy * 100).toFixed(1)}%) - needs model improvement`);
        }
        
        return insights;
    }

    /**
     * Serialize input for consistent key generation
     */
    private serializeInput(input: any): string {
        if (typeof input === 'string') {
            return input;
        }
        
        try {
            return JSON.stringify(input);
        } catch (error) {
            return input.toString();
        }
    }

    /**
     * Find similar historical data for prediction
     */
    private findSimilarHistory(input: any): LearningData[] {
        const inputStr = this.serializeInput(input).toLowerCase();
        const similarHistory: LearningData[] = [];
        
        for (const [key, history] of this.learningHistory.entries()) {
            // Simple similarity check - in practice would use more sophisticated matching
            const similarity = this.calculateSimilarity(inputStr, key.toLowerCase());
            if (similarity > 0.5) {
                similarHistory.push(...history);
            }
        }
        
        return similarHistory;
    }

    /**
     * Calculate string similarity (simple implementation)
     */
    private calculateSimilarity(str1: string, str2: string): number {
        const words1 = str1.split(/\s+/);
        const words2 = str2.split(/\s+/);
        
        const common = words1.filter(word => words2.includes(word)).length;
        const total = new Set([...words1, ...words2]).size;
        
        return total > 0 ? common / total : 0;
    }

    /**
     * Predict outcome from similar history
     */
    private predictFromSimilarHistory(history: LearningData[], context?: LearningContext): { prediction: any; confidence: number } {
        if (history.length === 0) {
            return {
                prediction: null,
                confidence: 0.1
            };
        }
        
        const outcomes = history.map(h => h.expectedOutput).filter(o => o !== undefined);
        const outcomeCounts = this.countOutcomes(outcomes);
        const mostCommon = this.getMostCommonOutcome(outcomeCounts);
        
        // Lower confidence for similar matches
        const consistency = outcomeCounts.get(mostCommon) / outcomes.length;
        const confidence = Math.min(0.7, consistency * 0.5 + 0.1);
        
        return {
            prediction: mostCommon,
            confidence
        };
    }

    /**
     * Count outcome occurrences
     */
    private countOutcomes(outcomes: any[]): Map<any, number> {
        const counts = new Map<any, number>();
        
        for (const outcome of outcomes) {
            const key = this.serializeInput(outcome);
            counts.set(key, (counts.get(key) || 0) + 1);
        }
        
        return counts;
    }

    /**
     * Get most common outcome
     */
    private getMostCommonOutcome(outcomeCounts: Map<any, number>): any {
        let maxCount = 0;
        let mostCommon = null;
        
        for (const [outcome, count] of outcomeCounts.entries()) {
            if (count > maxCount) {
                maxCount = count;
                mostCommon = outcome;
            }
        }
        
        return mostCommon;
    }

    /**
     * Apply context adjustments to confidence
     */
    private applyContextAdjustments(confidence: number, context: LearningContext): number {
        let adjustedConfidence = confidence;
        
        // Adjust based on user experience
        switch (context.userExperience) {
            case 'beginner':
                adjustedConfidence *= 0.9; // Slightly less confident for beginners
                break;
            case 'expert':
                adjustedConfidence *= 1.1; // More confident for experts
                break;
        }
        
        // Adjust based on project type
        if (context.projectType) {
            const projectHistory = this.getProjectTypeHistory(context.projectType);
            if (projectHistory.length > 10) {
                adjustedConfidence *= 1.05; // Boost confidence with more project-specific data
            }
        }
        
        return Math.max(0.1, Math.min(0.95, adjustedConfidence));
    }

    /**
     * Get history for specific project type
     */
    private getProjectTypeHistory(projectType: string): LearningData[] {
        const history: LearningData[] = [];
        
        for (const [, data] of this.learningHistory.entries()) {
            history.push(...data.filter(d => d.context?.projectType === projectType));
        }
        
        return history;
    }
}