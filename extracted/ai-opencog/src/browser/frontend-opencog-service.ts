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
    Atom,
    AtomPattern,
    ReasoningQuery,
    ReasoningResult,
    LearningData,
    PatternInput,
    PatternResult,
    OpenCogService,
    OPENCOG_SERVICE_PATH,
    LearningModel,
    AdaptationStrategy,
    UserBehaviorPattern,
    LearningContext,
    UserFeedback,
    // Multi-modal types
    MultiModalData,
    MultiModalPatternInput,
    MultiModalPatternResult,
    MultiModalLearningData,
    ModalityType,
    TensorData
} from '../common';

/**
 * Frontend OpenCog service that communicates with the backend via RPC
 */
@injectable()
export class FrontendOpenCogService implements OpenCogService {

    private readonly openCogService: OpenCogService;

    constructor(
        @inject(WebSocketConnectionProvider) protected readonly connectionProvider: WebSocketConnectionProvider
    ) {
        this.openCogService = this.connectionProvider.createProxy<OpenCogService>(OPENCOG_SERVICE_PATH);
    }

    async addAtom(atom: Atom): Promise<string> {
        return this.openCogService.addAtom(atom);
    }

    async queryAtoms(pattern: AtomPattern): Promise<Atom[]> {
        return this.openCogService.queryAtoms(pattern);
    }

    async removeAtom(atomId: string): Promise<boolean> {
        return this.openCogService.removeAtom(atomId);
    }

    async updateAtom(atomId: string, updates: Partial<Atom>): Promise<boolean> {
        return this.openCogService.updateAtom(atomId, updates);
    }

    async reason(query: ReasoningQuery): Promise<ReasoningResult> {
        return this.openCogService.reason(query);
    }

    async learn(data: LearningData): Promise<void> {
        return this.openCogService.learn(data);
    }

    async recognizePatterns(input: PatternInput): Promise<PatternResult[]> {
        return this.openCogService.recognizePatterns(input);
    }

    async getAtomSpaceSize(): Promise<number> {
        return this.openCogService.getAtomSpaceSize();
    }

    async clearAtomSpace(): Promise<void> {
        return this.openCogService.clearAtomSpace();
    }

    async exportAtomSpace(): Promise<string> {
        return this.openCogService.exportAtomSpace();
    }

    async importAtomSpace(data: string): Promise<void> {
        return this.openCogService.importAtomSpace(data);
    }

    // Advanced learning and adaptation methods
    async learnFromFeedback(feedback: UserFeedback, context: LearningContext): Promise<void> {
        return this.openCogService.learnFromFeedback(feedback, context);
    }

    async adaptToUser(userId: string, domain: string, data: any): Promise<AdaptationStrategy> {
        return this.openCogService.adaptToUser(userId, domain, data);
    }

    async getAdaptationStrategy(userId: string, domain: string): Promise<AdaptationStrategy | undefined> {
        return this.openCogService.getAdaptationStrategy(userId, domain);
    }

    // Behavioral learning
    async learnUserBehavior(userId: string, action: string, context: any): Promise<void> {
        return this.openCogService.learnUserBehavior(userId, action, context);
    }

    async getUserBehaviorPatterns(userId: string): Promise<UserBehaviorPattern[]> {
        return this.openCogService.getUserBehaviorPatterns(userId);
    }

    async predictUserAction(userId: string, context: any): Promise<{ action: string; confidence: number }[]> {
        return this.openCogService.predictUserAction(userId, context);
    }

    // Learning model management
    async createLearningModel(type: string, parameters?: Record<string, any>): Promise<LearningModel> {
        return this.openCogService.createLearningModel(type, parameters);
    }

    async updateLearningModel(modelId: string, trainingData: LearningData[]): Promise<LearningModel> {
        return this.openCogService.updateLearningModel(modelId, trainingData);
    }

    async getLearningModel(modelId: string): Promise<LearningModel | undefined> {
        return this.openCogService.getLearningModel(modelId);
    }

    async listLearningModels(): Promise<LearningModel[]> {
        return this.openCogService.listLearningModels();
    }

    // Personalization
    async personalize(userId: string, preferences: Record<string, any>): Promise<void> {
        return this.openCogService.personalize(userId, preferences);
    }

    async getPersonalization(userId: string): Promise<Record<string, any>> {
        return this.openCogService.getPersonalization(userId);
    }

    // Learning analytics
    async getLearningStats(): Promise<{
        totalLearningRecords: number;
        modelAccuracy: Record<string, number>;
        userAdaptations: number;
        behaviorPatterns: number;
    }> {
        return this.openCogService.getLearningStats();
    }

    // ===== PHASE 5: MULTI-MODAL COGNITIVE PROCESSING METHODS =====

    /**
     * Process single multi-modal data
     */
    async processMultiModalData(data: MultiModalData): Promise<MultiModalData> {
        return this.openCogService.processMultiModalData(data);
    }

    /**
     * Process batch of multi-modal data
     */
    async processMultiModalBatch(data: MultiModalData[]): Promise<MultiModalData[]> {
        return this.openCogService.processMultiModalBatch(data);
    }

    /**
     * Recognize patterns in multi-modal data
     */
    async recognizeMultiModalPatterns(input: MultiModalPatternInput): Promise<MultiModalPatternResult[]> {
        return this.openCogService.recognizeMultiModalPatterns(input);
    }

    /**
     * Learn from multi-modal data
     */
    async learnFromMultiModalData(data: MultiModalLearningData): Promise<void> {
        return this.openCogService.learnFromMultiModalData(data);
    }

    /**
     * Get multi-modal learning statistics
     */
    async getMultiModalLearningStats(): Promise<{
        totalMultiModalRecords: number;
        modalityDistribution: Record<ModalityType, number>;
        crossModalPatterns: number;
        processingAccuracy: Record<ModalityType, number>;
    }> {
        return this.openCogService.getMultiModalLearningStats();
    }

    /**
     * Process tensor data with 4 degrees of freedom
     */
    async processTensorData(tensor: TensorData): Promise<TensorData> {
        return this.openCogService.processTensorData(tensor);
    }

    /**
     * Perform specific tensor operation
     */
    async performTensorOperation(
        tensor: TensorData, 
        operation: string, 
        parameters?: Record<string, any>
    ): Promise<TensorData> {
        return this.openCogService.performTensorOperation(tensor, operation, parameters);
    }

    /**
     * Fuse multiple tensor data
     */
    async fuseTensorData(
        tensors: TensorData[], 
        strategy: 'concatenation' | 'addition' | 'attention' | 'learned' = 'concatenation'
    ): Promise<TensorData> {
        return this.openCogService.fuseTensorData(tensors, strategy);
    }

    /**
     * Cross-modal reasoning
     */
    async reasonAcrossModalities(query: ReasoningQuery, modalData: MultiModalData[]): Promise<ReasoningResult> {
        return this.openCogService.reasonAcrossModalities(query, modalData);
    }

    /**
     * Analyze multi-modal context
     */
    async analyzeMultiModalContext(data: MultiModalData[]): Promise<{
        context: any;
        dominantModality: ModalityType;
        modalityInteractions: Array<{
            source: ModalityType;
            target: ModalityType;
            interaction: string;
            strength: number;
        }>;
        cognitiveLoad: number;
    }> {
        return this.openCogService.analyzeMultiModalContext(data);
    }

    /**
     * Apply attention mechanisms for multi-modal data
     */
    async applyAttentionMechanism(
        data: MultiModalData[], 
        attentionType: 'spatial' | 'temporal' | 'cross-modal' | 'cognitive'
    ): Promise<{
        attentionWeights: Record<string, number>;
        focusedData: MultiModalData[];
        attentionMap?: number[];
    }> {
        return this.openCogService.applyAttentionMechanism(data, attentionType);
    }

    // Knowledge management service access
    getKnowledgeManagementService(): any {
        return this.openCogService.getKnowledgeManagementService();
    }
}