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

import { UserFeedback, LearningContext } from './opencog-types';

/**
 * Service paths for learning services
 */
export const SUPERVISED_LEARNING_SERVICE_PATH = '/services/supervised-learning';
export const UNSUPERVISED_LEARNING_SERVICE_PATH = '/services/unsupervised-learning';
export const REINFORCEMENT_LEARNING_SERVICE_PATH = '/services/reinforcement-learning';

/**
 * Learning feedback result
 */
export interface LearningResult {
    success: boolean;
    modelUpdated: boolean;
    accuracy?: number;
    confidence: number;
    insights?: string[];
}

/**
 * Pattern discovery result
 */
export interface PatternDiscoveryResult {
    patterns: DiscoveredPattern[];
    confidence: number;
    insights: string[];
}

/**
 * Discovered pattern
 */
export interface DiscoveredPattern {
    pattern: any;
    frequency: number;
    confidence: number;
    type: 'behavioral' | 'structural' | 'temporal' | 'semantic';
    description: string;
}

/**
 * Workflow optimization result
 */
export interface WorkflowOptimizationResult {
    optimizations: WorkflowOptimization[];
    expectedImprovement: number;
    confidence: number;
}

/**
 * Workflow optimization suggestion
 */
export interface WorkflowOptimization {
    type: 'time_saving' | 'accuracy_improvement' | 'automation' | 'personalization';
    description: string;
    implementation: string;
    impact: number;
}

/**
 * Outcome-based learning input
 */
export interface OutcomeBasedInput {
    action: string;
    outcome: 'success' | 'failure' | 'partial_success';
    context?: LearningContext;
    metrics?: Record<string, number>;
}

/**
 * Success pattern
 */
export interface SuccessPattern {
    pattern: any;
    successRate: number;
    confidence: number;
    applicableContexts: string[];
}

/**
 * Supervised Learning Service
 * Implements learning from labeled data and user feedback
 */
export interface SupervisedLearningService {
    /**
     * Learn from user feedback
     */
    learnFromFeedback(action: string, feedback: UserFeedback): Promise<LearningResult>;
    
    /**
     * Train model with labeled examples
     */
    trainWithExamples(examples: { input: any; output: any }[]): Promise<LearningResult>;
    
    /**
     * Predict outcome based on learned patterns
     */
    predictOutcome(input: any, context?: LearningContext): Promise<{ prediction: any; confidence: number }>;
}

/**
 * Unsupervised Learning Service
 * Implements pattern discovery and unsupervised learning
 */
export interface UnsupervisedLearningService {
    /**
     * Discover patterns in code
     */
    discoverCodePatterns(codeData: any[]): Promise<PatternDiscoveryResult>;
    
    /**
     * Learn workflow optimizations
     */
    learnWorkflowOptimizations(workflowData: any[]): Promise<WorkflowOptimizationResult>;
    
    /**
     * Learn quality metrics patterns
     */
    learnQualityMetrics(qualityData: any[]): Promise<{ metrics: any[]; confidence: number }>;
}

/**
 * Reinforcement Learning Service  
 * Implements outcome-based learning and adaptive optimization
 */
export interface ReinforcementLearningService {
    /**
     * Learn from outcome-based feedback
     */
    learnFromOutcome(input: OutcomeBasedInput): Promise<LearningResult>;
    
    /**
     * Recognize success patterns
     */
    recognizeSuccessPatterns(data: any[]): Promise<SuccessPattern[]>;
    
    /**
     * Optimize adaptive assistance
     */
    optimizeAdaptiveAssistance(userId: string, context: LearningContext): Promise<{ optimizations: any[]; confidence: number }>;
}