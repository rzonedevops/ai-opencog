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
import { WebSocketConnectionProvider } from '@theia/core/lib/browser/messaging';
import {
    DeductiveReasoningService,
    DEDUCTIVE_REASONING_SERVICE_PATH,
    CodeLogicResult,
    ReasoningResult,
    InductiveReasoningService,
    INDUCTIVE_REASONING_SERVICE_PATH,
    PatternGeneralizationInput,
    PatternGeneralizationResult,
    AbductiveReasoningService,
    ABDUCTIVE_REASONING_SERVICE_PATH,
    HypothesisGenerationInput,
    GeneratedHypothesis
} from '../common/reasoning-services';

/**
 * Frontend proxy for DeductiveReasoningService
 */
@injectable()
export class FrontendDeductiveReasoningService implements DeductiveReasoningService {
    
    private readonly service: DeductiveReasoningService;

    constructor(
        @inject(WebSocketConnectionProvider) connectionProvider: WebSocketConnectionProvider
    ) {
        this.service = connectionProvider.createProxy<DeductiveReasoningService>(DEDUCTIVE_REASONING_SERVICE_PATH);
    }

    async verifyCodeLogic(code: string): Promise<CodeLogicResult> {
        return this.service.verifyCodeLogic(code);
    }

    async deduceConclusions(premises: any[]): Promise<ReasoningResult> {
        return this.service.deduceConclusions(premises);
    }

    async checkConsistency(statements: any[]): Promise<{ isConsistent: boolean; conflicts?: any[] }> {
        return this.service.checkConsistency(statements);
    }
}

/**
 * Frontend proxy for InductiveReasoningService
 */
@injectable()
export class FrontendInductiveReasoningService implements InductiveReasoningService {
    
    private readonly service: InductiveReasoningService;

    constructor(
        @inject(WebSocketConnectionProvider) connectionProvider: WebSocketConnectionProvider
    ) {
        this.service = connectionProvider.createProxy<InductiveReasoningService>(INDUCTIVE_REASONING_SERVICE_PATH);
    }

    async generalizeFromExamples(input: PatternGeneralizationInput): Promise<PatternGeneralizationResult> {
        return this.service.generalizeFromExamples(input);
    }

    async generateCodeFromPatterns(patterns: any[], context?: string): Promise<{ code: string; confidence: number }> {
        return this.service.generateCodeFromPatterns(patterns, context);
    }

    async identifyBestPractices(examples: any[]): Promise<{ practices: string[]; confidence: number }> {
        return this.service.identifyBestPractices(examples);
    }
}

/**
 * Frontend proxy for AbductiveReasoningService
 */
@injectable()
export class FrontendAbductiveReasoningService implements AbductiveReasoningService {
    
    private readonly service: AbductiveReasoningService;

    constructor(
        @inject(WebSocketConnectionProvider) connectionProvider: WebSocketConnectionProvider
    ) {
        this.service = connectionProvider.createProxy<AbductiveReasoningService>(ABDUCTIVE_REASONING_SERVICE_PATH);
    }

    async generateBugHypotheses(symptoms: any[]): Promise<GeneratedHypothesis[]> {
        return this.service.generateBugHypotheses(symptoms);
    }

    async suggestCreativeSolutions(problem: string, constraints?: any[]): Promise<{ solutions: string[]; creativity: number }> {
        return this.service.suggestCreativeSolutions(problem, constraints);
    }

    async proposeArchitectureOptimizations(architecture: any): Promise<{ optimizations: any[]; impact: number }> {
        return this.service.proposeArchitectureOptimizations(architecture);
    }
}