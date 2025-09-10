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
import { Agent, LanguageModelRequirement } from '@theia/ai-core/lib/common/agent';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { OpenCogService } from '../common/opencog-service';
import { LearningData, UserFeedback, LearningContext, UserBehaviorPattern, AdaptationStrategy } from '../common/opencog-types';

export interface DeveloperBehaviorLearning {
    userId: string;
    patterns: {
        codingStyle: {
            preferredIndentation: number;
            bracketStyle: 'same-line' | 'new-line';
            namingConvention: 'camelCase' | 'snake_case' | 'kebab-case';
            commentingFrequency: number;
        };
        workflowPreferences: {
            preferredFileOrder: string[];
            commonCommands: string[];
            breakFrequency: number;
            sessionDuration: number;
        };
        errorPatterns: {
            commonMistakes: string[];
            bugTypes: string[];
            debuggingApproach: string;
        };
    };
    confidenceScore: number;
    lastUpdated: number;
}

export interface CodeQualityLearning {
    qualityMetrics: {
        averageComplexity: number;
        maintainabilityTrend: number[];
        performanceImprovements: number;
        refactoringSuccess: number;
    };
    patterns: {
        successfulRefactorings: string[];
        effectivePatterns: string[];
        avoidedAntiPatterns: string[];
    };
    recommendations: {
        personalizedSuggestions: string[];
        adaptiveGuidance: string[];
    };
}

export interface WorkflowOptimization {
    optimizationId: string;
    category: 'shortcuts' | 'automation' | 'templates' | 'navigation';
    description: string;
    potentialTimeSaving: number; // in seconds
    confidence: number;
    implementation: string;
}

/**
 * Learning Agent for developer behavior learning, code quality pattern learning,
 * and workflow optimization learning as specified in Phase 2 requirements
 */
@injectable()
export class LearningAgent implements Agent {
    readonly id = 'opencog-learning';
    readonly name = 'Learning Agent';
    readonly description = 'Learns from developer behavior, code quality, and workflows';
    
    readonly variables = [
        'developerProfile',
        'codeQuality',
        'workflowOptimization',
        'learningProgress'
    ];
    
    readonly functions = [
        'learn-behavior',
        'learn-quality',
        'optimize-workflow',
        'get-recommendations'
    ];

    readonly prompts = [
        {
            id: 'learning-analysis-prompt',
            content: `Analyze learning data and provide insights:
            
Developer Profile: {{developerProfile}}
Code Quality Metrics: {{codeQuality}}
Workflow Data: {{workflowOptimization}}
Learning Progress: {{learningProgress}}

Provide actionable recommendations for improvement based on the learning data.`
        }
    ];

    languageModelRequirements: LanguageModelRequirement[] = [
        {
            purpose: 'learning-analysis',
            identifier: 'learning-model',
        }
    ];

    private developerProfiles = new Map<string, DeveloperBehaviorLearning>();
    private codeQualityData = new Map<string, CodeQualityLearning>();
    private workflowOptimizations = new Map<string, WorkflowOptimization[]>();

    constructor(
        @inject(OpenCogService) private readonly opencog: OpenCogService,
        @inject(WorkspaceService) private readonly workspace: WorkspaceService
    ) {
        this.initializeLearningModels();
    }

    /**
     * Learn from developer behavior patterns
     */
    async learnDeveloperBehavior(userId: string, action: string, context: any): Promise<void> {
        // Record behavior in OpenCog for pattern recognition
        await this.opencog.learnUserBehavior(userId, action, context);

        // Update local developer profile
        const profile = this.getDeveloperProfile(userId);
        await this.updateBehaviorProfile(profile, action, context);

        // Store updated profile
        this.developerProfiles.set(userId, profile);

        // Learn from the behavior data
        const learningData: LearningData = {
            type: 'developer-behavior',
            data: {
                userId,
                action,
                context,
                timestamp: Date.now()
            },
            context: {
                workspaceId: this.workspace.workspace?.resource.toString(),
                sessionId: context.sessionId || 'unknown'
            }
        };

        await this.opencog.learn(learningData);
    }

    /**
     * Learn from code quality patterns and improvements
     */
    async learnCodeQualityPatterns(userId: string, qualityData: any): Promise<void> {
        const existingData = this.codeQualityData.get(userId) || this.createDefaultQualityLearning();
        
        // Update quality metrics
        this.updateQualityMetrics(existingData, qualityData);
        
        // Learn successful patterns
        if (qualityData.improvementDetected) {
            existingData.patterns.successfulRefactorings.push(qualityData.refactoringType);
            existingData.patterns.effectivePatterns.push(qualityData.patternUsed);
        }

        // Update recommendations based on learning
        existingData.recommendations = await this.generatePersonalizedRecommendations(userId, existingData);

        this.codeQualityData.set(userId, existingData);

        // Store in OpenCog for reasoning
        const learningData: LearningData = {
            type: 'code-quality-learning',
            data: existingData,
            context: {
                userId,
                timestamp: Date.now()
            }
        };

        await this.opencog.learn(learningData);
    }

    /**
     * Learn and optimize workflow patterns
     */
    async learnWorkflowOptimization(userId: string, workflowData: any): Promise<WorkflowOptimization[]> {
        // Analyze current workflow for optimization opportunities
        const optimizations = await this.analyzeWorkflowEfficiency(userId, workflowData);
        
        // Store optimizations
        this.workflowOptimizations.set(userId, optimizations);

        // Learn from workflow data
        const learningData: LearningData = {
            type: 'workflow-optimization',
            data: {
                userId,
                workflowData,
                optimizations,
                timestamp: Date.now()
            },
            context: {
                workspaceId: this.workspace.workspace?.resource.toString()
            }
        };

        await this.opencog.learn(learningData);

        return optimizations;
    }

    /**
     * Get personalized recommendations based on learning
     */
    async getPersonalizedRecommendations(userId: string): Promise<string[]> {
        const profile = this.developerProfiles.get(userId);
        const qualityData = this.codeQualityData.get(userId);
        const workflowOpts = this.workflowOptimizations.get(userId) || [];

        const recommendations: string[] = [];

        // Behavior-based recommendations
        if (profile) {
            if (profile.patterns.codingStyle.commentingFrequency < 0.3) {
                recommendations.push('Consider adding more comments to improve code documentation');
            }
            
            if (profile.patterns.workflowPreferences.sessionDuration > 180) { // 3 hours
                recommendations.push('Consider taking regular breaks to maintain productivity');
            }
        }

        // Quality-based recommendations
        if (qualityData) {
            if (qualityData.qualityMetrics.averageComplexity > 0.7) {
                recommendations.push('Focus on reducing code complexity in your next refactoring session');
            }
            
            // Add personalized suggestions
            recommendations.push(...qualityData.recommendations.personalizedSuggestions.slice(0, 3));
        }

        // Workflow optimizations
        const highImpactOptimizations = workflowOpts
            .filter(opt => opt.potentialTimeSaving > 60 && opt.confidence > 0.7)
            .slice(0, 2);
            
        for (const opt of highImpactOptimizations) {
            recommendations.push(`Workflow optimization: ${opt.description} (saves ~${opt.potentialTimeSaving}s)`);
        }

        return recommendations;
    }

    /**
     * Get adaptation strategy for a specific user and domain
     */
    async getAdaptationStrategy(userId: string, domain: string): Promise<AdaptationStrategy | undefined> {
        return await this.opencog.getAdaptationStrategy(userId, domain);
    }

    /**
     * Provide feedback on learning effectiveness
     */
    async provideLearningFeedback(userId: string, feedbackType: string, isPositive: boolean, context?: any): Promise<void> {
        const feedback: UserFeedback = {
            type: feedbackType,
            isPositive,
            confidence: isPositive ? 0.8 : 0.6,
            explanation: context?.explanation,
            timestamp: Date.now()
        };

        const learningContext: LearningContext = {
            userId,
            workspaceId: this.workspace.workspace?.resource.toString(),
            currentTask: context?.task || 'general',
            userExperience: context?.experience || 'intermediate',
            preferences: context?.preferences || {}
        };

        await this.opencog.learnFromFeedback(feedback, learningContext);
    }

    /**
     * Get learning statistics and insights
     */
    async getLearningInsights(userId: string): Promise<any> {
        const profile = this.developerProfiles.get(userId);
        const qualityData = this.codeQualityData.get(userId);
        const behaviorPatterns = await this.opencog.getUserBehaviorPatterns(userId);
        const globalStats = await this.opencog.getLearningStats();

        return {
            personalProfile: {
                confidenceScore: profile?.confidenceScore || 0,
                learningProgress: this.calculateLearningProgress(userId),
                behaviorPatterns: behaviorPatterns.length
            },
            codeQuality: {
                averageComplexity: qualityData?.qualityMetrics.averageComplexity || 0,
                improvementTrend: qualityData?.qualityMetrics.maintainabilityTrend || [],
                successfulRefactorings: qualityData?.patterns.successfulRefactorings.length || 0
            },
            workflowEfficiency: {
                optimizationsAvailable: this.workflowOptimizations.get(userId)?.length || 0,
                potentialTimeSavings: this.calculateTotalTimeSavings(userId)
            },
            globalInsights: {
                totalLearningRecords: globalStats.totalLearningRecords,
                modelAccuracy: globalStats.modelAccuracy,
                userAdaptations: globalStats.userAdaptations
            }
        };
    }

    private async initializeLearningModels(): Promise<void> {
        // Create learning models for different aspects
        await this.opencog.createLearningModel('developer-behavior', {
            algorithm: 'pattern-recognition',
            adaptationRate: 0.1,
            memorySize: 1000
        });

        await this.opencog.createLearningModel('code-quality', {
            algorithm: 'quality-metrics',
            adaptationRate: 0.05,
            memorySize: 500
        });

        await this.opencog.createLearningModel('workflow-optimization', {
            algorithm: 'efficiency-analysis',
            adaptationRate: 0.2,
            memorySize: 300
        });
    }

    private getDeveloperProfile(userId: string): DeveloperBehaviorLearning {
        return this.developerProfiles.get(userId) || this.createDefaultProfile(userId);
    }

    private createDefaultProfile(userId: string): DeveloperBehaviorLearning {
        return {
            userId,
            patterns: {
                codingStyle: {
                    preferredIndentation: 4,
                    bracketStyle: 'same-line',
                    namingConvention: 'camelCase',
                    commentingFrequency: 0.2
                },
                workflowPreferences: {
                    preferredFileOrder: [],
                    commonCommands: [],
                    breakFrequency: 60, // minutes
                    sessionDuration: 120 // minutes
                },
                errorPatterns: {
                    commonMistakes: [],
                    bugTypes: [],
                    debuggingApproach: 'systematic'
                }
            },
            confidenceScore: 0.1,
            lastUpdated: Date.now()
        };
    }

    private createDefaultQualityLearning(): CodeQualityLearning {
        return {
            qualityMetrics: {
                averageComplexity: 0.5,
                maintainabilityTrend: [],
                performanceImprovements: 0,
                refactoringSuccess: 0
            },
            patterns: {
                successfulRefactorings: [],
                effectivePatterns: [],
                avoidedAntiPatterns: []
            },
            recommendations: {
                personalizedSuggestions: [],
                adaptiveGuidance: []
            }
        };
    }

    private async updateBehaviorProfile(profile: DeveloperBehaviorLearning, action: string, context: any): Promise<void> {
        // Update coding style preferences based on actions
        if (action === 'indent' && context.spaces) {
            profile.patterns.codingStyle.preferredIndentation = context.spaces;
        }

        if (action === 'add-comment') {
            profile.patterns.codingStyle.commentingFrequency += 0.01;
        }

        // Update workflow preferences
        if (action === 'open-file' && context.fileName) {
            profile.patterns.workflowPreferences.preferredFileOrder.push(context.fileName);
            // Keep only last 20 files
            if (profile.patterns.workflowPreferences.preferredFileOrder.length > 20) {
                profile.patterns.workflowPreferences.preferredFileOrder.shift();
            }
        }

        // Update confidence based on consistency
        profile.confidenceScore = Math.min(1.0, profile.confidenceScore + 0.01);
        profile.lastUpdated = Date.now();
    }

    private updateQualityMetrics(qualityData: CodeQualityLearning, newData: any): void {
        if (newData.complexity !== undefined) {
            qualityData.qualityMetrics.averageComplexity = 
                (qualityData.qualityMetrics.averageComplexity + newData.complexity) / 2;
        }

        if (newData.maintainability !== undefined) {
            qualityData.qualityMetrics.maintainabilityTrend.push(newData.maintainability);
            // Keep only last 50 measurements
            if (qualityData.qualityMetrics.maintainabilityTrend.length > 50) {
                qualityData.qualityMetrics.maintainabilityTrend.shift();
            }
        }

        if (newData.refactoringSuccess) {
            qualityData.qualityMetrics.refactoringSuccess++;
        }
    }

    private async generatePersonalizedRecommendations(userId: string, qualityData: CodeQualityLearning): Promise<any> {
        const recommendations = {
            personalizedSuggestions: [] as string[],
            adaptiveGuidance: [] as string[]
        };

        // Analyze trends to generate recommendations
        const trend = qualityData.qualityMetrics.maintainabilityTrend;
        if (trend.length > 5) {
            const recent = trend.slice(-5);
            const average = recent.reduce((a, b) => a + b, 0) / recent.length;
            
            if (average < 0.6) {
                recommendations.personalizedSuggestions.push('Focus on improving code maintainability');
                recommendations.adaptiveGuidance.push('Consider using design patterns to improve structure');
            }
        }

        // Use successful patterns for recommendations
        const successfulPatterns = qualityData.patterns.successfulRefactorings;
        if (successfulPatterns.includes('extract-method')) {
            recommendations.adaptiveGuidance.push('You work well with method extraction - consider applying it more often');
        }

        return recommendations;
    }

    private async analyzeWorkflowEfficiency(userId: string, workflowData: any): Promise<WorkflowOptimization[]> {
        const optimizations: WorkflowOptimization[] = [];

        // Analyze command frequency for shortcut suggestions
        if (workflowData.commands) {
            const frequentCommands = Object.entries(workflowData.commands)
                .filter(([cmd, count]: [string, any]) => count > 10)
                .map(([cmd]) => cmd);

            for (const command of frequentCommands) {
                optimizations.push({
                    optimizationId: `shortcut-${command}`,
                    category: 'shortcuts',
                    description: `Create keyboard shortcut for frequently used command: ${command}`,
                    potentialTimeSaving: 30,
                    confidence: 0.8,
                    implementation: `Add keyboard binding for ${command}`
                });
            }
        }

        // Analyze file navigation patterns for optimization
        if (workflowData.fileAccess) {
            const commonPairs = this.findCommonFileTransitions(workflowData.fileAccess);
            for (const pair of commonPairs) {
                optimizations.push({
                    optimizationId: `navigation-${pair.from}-${pair.to}`,
                    category: 'navigation',
                    description: `Quick navigation between ${pair.from} and ${pair.to}`,
                    potentialTimeSaving: 15,
                    confidence: 0.7,
                    implementation: 'Add quick navigation button or shortcut'
                });
            }
        }

        return optimizations;
    }

    private findCommonFileTransitions(fileAccess: any[]): Array<{from: string, to: string, frequency: number}> {
        const transitions = new Map<string, number>();
        
        for (let i = 1; i < fileAccess.length; i++) {
            const from = fileAccess[i - 1].fileName;
            const to = fileAccess[i].fileName;
            const key = `${from}->${to}`;
            transitions.set(key, (transitions.get(key) || 0) + 1);
        }

        return Array.from(transitions.entries())
            .filter(([_, freq]) => freq > 3)
            .map(([transition, frequency]) => {
                const [from, to] = transition.split('->');
                return { from, to, frequency };
            });
    }

    private calculateLearningProgress(userId: string): number {
        const profile = this.developerProfiles.get(userId);
        const qualityData = this.codeQualityData.get(userId);
        
        let progress = 0;
        
        if (profile) {
            progress += profile.confidenceScore * 0.4;
        }
        
        if (qualityData) {
            progress += Math.min(1, qualityData.qualityMetrics.refactoringSuccess / 10) * 0.6;
        }
        
        return Math.min(1, progress);
    }

    private calculateTotalTimeSavings(userId: string): number {
        const optimizations = this.workflowOptimizations.get(userId) || [];
        return optimizations.reduce((total, opt) => total + opt.potentialTimeSaving, 0);
    }
}