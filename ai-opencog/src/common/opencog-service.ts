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

import {
    Atom,
    AtomPattern,
    ReasoningQuery,
    ReasoningResult,
    LearningData,
    PatternInput,
    PatternResult,
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
    TensorData,
    Tensor3D,
    // Advanced learning types
    AdvancedLearningType,
    AdvancedLearningData,
    AdvancedLearningResult,
    AdvancedLearningModel,
    NeuralNetworkConfig,
    MetaLearningConfig,
    TransferLearningConfig,
    EnsembleLearningConfig,
    OnlineLearningConfig,
    ActiveLearningConfig
} from './opencog-types';
import { KnowledgeManagementService } from './knowledge-management-service';

export const OPENCOG_SERVICE_PATH = '/services/opencog';

/**
 * Core OpenCog service interface for Theia integration
 * Enhanced with knowledge management capabilities
 */
export interface OpenCogService {
    /**
     * AtomSpace operations
     */
    addAtom(atom: Atom): Promise<string>;
    queryAtoms(pattern: AtomPattern): Promise<Atom[]>;
    removeAtom(atomId: string): Promise<boolean>;
    updateAtom(atomId: string, updates: Partial<Atom>): Promise<boolean>;

    /**
     * Reasoning operations
     */
    reason(query: ReasoningQuery): Promise<ReasoningResult>;

    /**
     * Learning operations
     */
    learn(data: LearningData): Promise<void>;

    /**
     * Advanced learning and adaptation methods
     */
    learnFromFeedback(feedback: UserFeedback, context: LearningContext): Promise<void>;
    adaptToUser(userId: string, domain: string, data: any): Promise<AdaptationStrategy>;
    getAdaptationStrategy(userId: string, domain: string): Promise<AdaptationStrategy | undefined>;
    
    /**
     * Behavioral learning
     */
    learnUserBehavior(userId: string, action: string, context: any): Promise<void>;
    getUserBehaviorPatterns(userId: string): Promise<UserBehaviorPattern[]>;
    predictUserAction(userId: string, context: any): Promise<{ action: string; confidence: number }[]>;
    
    /**
     * Learning model management
     */
    createLearningModel(type: string, parameters?: Record<string, any>): Promise<LearningModel>;
    updateLearningModel(modelId: string, trainingData: LearningData[]): Promise<LearningModel>;
    getLearningModel(modelId: string): Promise<LearningModel | undefined>;
    listLearningModels(): Promise<LearningModel[]>;
    
    /**
     * Personalization
     */
    personalize(userId: string, preferences: Record<string, any>): Promise<void>;
    getPersonalization(userId: string): Promise<Record<string, any>>;
    
    /**
     * Learning analytics
     */
    getLearningStats(): Promise<{
        totalLearningRecords: number;
        modelAccuracy: Record<string, number>;
        userAdaptations: number;
        behaviorPatterns: number;
    }>;

    /**
     * Pattern recognition
     */
    recognizePatterns(input: PatternInput): Promise<PatternResult[]>;

    /**
     * AtomSpace statistics and management
     */
    getAtomSpaceSize(): Promise<number>;
    clearAtomSpace(): Promise<void>;
    exportAtomSpace(): Promise<string>;
    importAtomSpace(data: string): Promise<void>;

    /**
     * Knowledge Management Service integration
     */
    getKnowledgeManagementService(): KnowledgeManagementService;

    // ===== PHASE 5: MULTI-MODAL COGNITIVE PROCESSING =====

    /**
     * Multi-modal data processing
     */
    processMultiModalData(data: MultiModalData): Promise<MultiModalData>;
    processMultiModalBatch(data: MultiModalData[]): Promise<MultiModalData[]>;

    /**
     * Multi-modal pattern recognition
     */
    recognizeMultiModalPatterns(input: MultiModalPatternInput): Promise<MultiModalPatternResult[]>;

    /**
     * Multi-modal learning
     */
    learnFromMultiModalData(data: MultiModalLearningData): Promise<void>;
    getMultiModalLearningStats(): Promise<{
        totalMultiModalRecords: number;
        modalityDistribution: Record<ModalityType, number>;
        crossModalPatterns: number;
        processingAccuracy: Record<ModalityType, number>;
    }>;

    /**
     * Tensor operations with 4 degrees of freedom
     */
    processTensorData(tensor: TensorData): Promise<TensorData>;
    performTensorOperation(tensor: TensorData, operation: string, parameters?: Record<string, any>): Promise<TensorData>;
    fuseTensorData(tensors: TensorData[], strategy?: 'concatenation' | 'addition' | 'attention' | 'learned'): Promise<TensorData>;

    /**
     * Cross-modal reasoning
     */
    reasonAcrossModalities(query: ReasoningQuery, modalData: MultiModalData[]): Promise<ReasoningResult>;

    /**
     * Multi-modal context understanding
     */
    analyzeMultiModalContext(data: MultiModalData[]): Promise<{
        context: any;
        dominantModality: ModalityType;
        modalityInteractions: Array<{
            source: ModalityType;
            target: ModalityType;
            interaction: string;
            strength: number;
        }>;
        cognitiveLoad: number;
    }>;

    /**
     * Attention mechanisms for multi-modal data
     */
    applyAttentionMechanism(data: MultiModalData[], attentionType: 'spatial' | 'temporal' | 'cross-modal' | 'cognitive'): Promise<{
        attentionWeights: Record<string, number>;
        focusedData: MultiModalData[];
        attentionMap?: number[];
    }>;

    // ===== PHASE 5: ADVANCED LEARNING ALGORITHMS =====

    /**
     * 3 DoF tensor operations
     */
    processTensor3D(tensor: Tensor3D): Promise<Tensor3D>;
    performTensor3DOperation(tensor: Tensor3D, operation: string, parameters?: Record<string, any>): Promise<Tensor3D>;
    fuseTensor3DData(tensors: Tensor3D[], strategy?: 'concatenation' | 'addition' | 'attention' | 'learned'): Promise<Tensor3D>;

    /**
     * Advanced learning algorithms
     */
    trainAdvancedModel(data: AdvancedLearningData): Promise<AdvancedLearningResult>;
    predictWithAdvancedModel(modelId: string, input: TensorData | Tensor3D | any): Promise<AdvancedLearningResult>;
    updateAdvancedModel(modelId: string, data: AdvancedLearningData): Promise<AdvancedLearningResult>;

    /**
     * Neural network operations
     */
    createNeuralNetwork(config: NeuralNetworkConfig): Promise<AdvancedLearningModel>;
    trainNeuralNetwork(modelId: string, data: AdvancedLearningData[]): Promise<AdvancedLearningResult>;
    evaluateNeuralNetwork(modelId: string, testData: AdvancedLearningData[]): Promise<AdvancedLearningResult>;

    /**
     * Meta-learning operations
     */
    initializeMetaLearning(config: MetaLearningConfig): Promise<AdvancedLearningModel>;
    metaLearn(modelId: string, tasks: AdvancedLearningData[][]): Promise<AdvancedLearningResult>;
    adaptToNewTask(modelId: string, taskData: AdvancedLearningData[], shots: number): Promise<AdvancedLearningResult>;

    /**
     * Transfer learning operations
     */
    initializeTransferLearning(config: TransferLearningConfig): Promise<AdvancedLearningModel>;
    performTransferLearning(modelId: string, targetData: AdvancedLearningData[]): Promise<AdvancedLearningResult>;

    /**
     * Ensemble learning operations
     */
    createEnsemble(config: EnsembleLearningConfig): Promise<AdvancedLearningModel>;
    trainEnsemble(modelId: string, data: AdvancedLearningData[]): Promise<AdvancedLearningResult>;
    ensemblePredict(modelId: string, input: any): Promise<AdvancedLearningResult>;

    /**
     * Online learning operations
     */
    initializeOnlineLearning(config: OnlineLearningConfig): Promise<AdvancedLearningModel>;
    onlineUpdate(modelId: string, data: AdvancedLearningData): Promise<AdvancedLearningResult>;
    getOnlineLearningStats(modelId: string): Promise<{
        totalUpdates: number;
        currentAccuracy: number;
        adaptationRate: number;
        forgettingRate: number;
    }>;

    /**
     * Active learning operations
     */
    initializeActiveLearning(config: ActiveLearningConfig): Promise<AdvancedLearningModel>;
    queryForLabels(modelId: string, unlabeledData: any[]): Promise<{
        selectedSamples: any[];
        uncertaintyScores: number[];
        expectedImprovement: number[];
    }>;
    updateWithActiveLabels(modelId: string, labeledData: AdvancedLearningData[]): Promise<AdvancedLearningResult>;

    /**
     * Advanced learning model management
     */
    getAdvancedLearningModel(modelId: string): Promise<AdvancedLearningModel | undefined>;
    listAdvancedLearningModels(type?: AdvancedLearningType): Promise<AdvancedLearningModel[]>;
    deleteAdvancedLearningModel(modelId: string): Promise<boolean>;
    
    /**
     * Advanced learning analytics
     */
    getAdvancedLearningStats(): Promise<{
        totalAdvancedModels: number;
        modelTypeDistribution: Record<AdvancedLearningType, number>;
        averageAccuracy: Record<AdvancedLearningType, number>;
        totalTrainingTime: number;
        memoryUsage: number;
    }>;
}

export const OpenCogService = 'OpenCogService';