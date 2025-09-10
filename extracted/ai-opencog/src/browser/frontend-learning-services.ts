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
    SupervisedLearningService,
    SUPERVISED_LEARNING_SERVICE_PATH,
    LearningResult,
    UnsupervisedLearningService,
    UNSUPERVISED_LEARNING_SERVICE_PATH,
    PatternDiscoveryResult,
    WorkflowOptimizationResult,
    ReinforcementLearningService,
    REINFORCEMENT_LEARNING_SERVICE_PATH,
    OutcomeBasedInput,
    SuccessPattern
} from '../common/learning-services';
import { UserFeedback, LearningContext } from '../common/opencog-types';

/**
 * Frontend proxy for SupervisedLearningService
 */
@injectable()
export class FrontendSupervisedLearningService implements SupervisedLearningService {
    
    private readonly service: SupervisedLearningService;

    constructor(
        @inject(WebSocketConnectionProvider) connectionProvider: WebSocketConnectionProvider
    ) {
        this.service = connectionProvider.createProxy<SupervisedLearningService>(SUPERVISED_LEARNING_SERVICE_PATH);
    }

    async learnFromFeedback(action: string, feedback: UserFeedback): Promise<LearningResult> {
        return this.service.learnFromFeedback(action, feedback);
    }

    async trainWithExamples(examples: { input: any; output: any }[]): Promise<LearningResult> {
        return this.service.trainWithExamples(examples);
    }

    async predictOutcome(input: any, context?: LearningContext): Promise<{ prediction: any; confidence: number }> {
        return this.service.predictOutcome(input, context);
    }
}

/**
 * Frontend proxy for UnsupervisedLearningService
 */
@injectable()
export class FrontendUnsupervisedLearningService implements UnsupervisedLearningService {
    
    private readonly service: UnsupervisedLearningService;

    constructor(
        @inject(WebSocketConnectionProvider) connectionProvider: WebSocketConnectionProvider
    ) {
        this.service = connectionProvider.createProxy<UnsupervisedLearningService>(UNSUPERVISED_LEARNING_SERVICE_PATH);
    }

    async discoverCodePatterns(codeData: any[]): Promise<PatternDiscoveryResult> {
        return this.service.discoverCodePatterns(codeData);
    }

    async learnWorkflowOptimizations(workflowData: any[]): Promise<WorkflowOptimizationResult> {
        return this.service.learnWorkflowOptimizations(workflowData);
    }

    async learnQualityMetrics(qualityData: any[]): Promise<{ metrics: any[]; confidence: number }> {
        return this.service.learnQualityMetrics(qualityData);
    }
}

/**
 * Frontend proxy for ReinforcementLearningService
 */
@injectable()
export class FrontendReinforcementLearningService implements ReinforcementLearningService {
    
    private readonly service: ReinforcementLearningService;

    constructor(
        @inject(WebSocketConnectionProvider) connectionProvider: WebSocketConnectionProvider
    ) {
        this.service = connectionProvider.createProxy<ReinforcementLearningService>(REINFORCEMENT_LEARNING_SERVICE_PATH);
    }

    async learnFromOutcome(input: OutcomeBasedInput): Promise<LearningResult> {
        return this.service.learnFromOutcome(input);
    }

    async recognizeSuccessPatterns(data: any[]): Promise<SuccessPattern[]> {
        return this.service.recognizeSuccessPatterns(data);
    }

    async optimizeAdaptiveAssistance(userId: string, context: LearningContext): Promise<{ optimizations: any[]; confidence: number }> {
        return this.service.optimizeAdaptiveAssistance(userId, context);
    }
}