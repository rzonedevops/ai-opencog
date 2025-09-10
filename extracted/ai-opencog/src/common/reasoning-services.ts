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

import { ReasoningResult, UserFeedback } from './opencog-types';

/**
 * Service paths for reasoning services
 */
export const DEDUCTIVE_REASONING_SERVICE_PATH = '/services/deductive-reasoning';
export const INDUCTIVE_REASONING_SERVICE_PATH = '/services/inductive-reasoning';  
export const ABDUCTIVE_REASONING_SERVICE_PATH = '/services/abductive-reasoning';

/**
 * Code logic verification result
 */
export interface CodeLogicResult {
    isValid: boolean;
    confidence: number;
    issues?: LogicIssue[];
    suggestions?: string[];
}

/**
 * Logic issue found in code
 */
export interface LogicIssue {
    type: 'logical_error' | 'inconsistency' | 'missing_condition' | 'unreachable_code';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    line?: number;
    column?: number;
}

/**
 * Pattern generalization input
 */
export interface PatternGeneralizationInput {
    examples: any[];
    context?: string;
    domain?: string;
}

/**
 * Pattern generalization result
 */
export interface PatternGeneralizationResult {
    pattern: any;
    confidence: number;
    generalizationStrength: number;
    applicableScenarios: string[];
}

/**
 * Hypothesis generation input
 */
export interface HypothesisGenerationInput {
    observations: any[];
    context?: string;
    domain?: 'debugging' | 'architecture' | 'optimization' | 'general';
}

/**
 * Generated hypothesis
 */
export interface GeneratedHypothesis {
    hypothesis: string;
    plausibility: number;
    evidence: string[];
    testableConditions: string[];
}

/**
 * Deductive Reasoning Service
 * Implements logical deduction and code verification
 */
export interface DeductiveReasoningService {
    /**
     * Verify the logical consistency of code
     */
    verifyCodeLogic(code: string): Promise<CodeLogicResult>;
    
    /**
     * Perform deductive inference on given premises
     */
    deduceConclusions(premises: any[]): Promise<ReasoningResult>;
    
    /**
     * Check for logical contradictions
     */
    checkConsistency(statements: any[]): Promise<{ isConsistent: boolean; conflicts?: any[] }>;
}

/**
 * Inductive Reasoning Service  
 * Implements pattern generalization and learning from examples
 */
export interface InductiveReasoningService {
    /**
     * Generalize patterns from examples
     */
    generalizeFromExamples(input: PatternGeneralizationInput): Promise<PatternGeneralizationResult>;
    
    /**
     * Generate code from patterns
     */
    generateCodeFromPatterns(patterns: any[], context?: string): Promise<{ code: string; confidence: number }>;
    
    /**
     * Identify best practices from code examples
     */
    identifyBestPractices(examples: any[]): Promise<{ practices: string[]; confidence: number }>;
}

/**
 * Abductive Reasoning Service
 * Implements hypothesis generation and creative problem solving
 */
export interface AbductiveReasoningService {
    /**
     * Generate hypotheses for debugging
     */
    generateBugHypotheses(symptoms: any[]): Promise<GeneratedHypothesis[]>;
    
    /**
     * Suggest creative solutions
     */
    suggestCreativeSolutions(problem: string, constraints?: any[]): Promise<{ solutions: string[]; creativity: number }>;
    
    /**
     * Propose architecture optimizations
     */
    proposeArchitectureOptimizations(architecture: any): Promise<{ optimizations: any[]; impact: number }>;
}