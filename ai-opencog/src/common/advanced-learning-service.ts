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
    AdvancedLearningType,
    AdvancedLearningData,
    AdvancedLearningResult,
    AdvancedLearningModel,
    NeuralNetworkConfig,
    MetaLearningConfig,
    TransferLearningConfig,
    EnsembleLearningConfig,
    OnlineLearningConfig,
    ActiveLearningConfig,
    TensorData,
    Tensor3D
} from './opencog-types';

/**
 * Service paths for advanced learning services
 */
export const ADVANCED_LEARNING_SERVICE_PATH = '/services/advanced-learning';
export const NEURAL_NETWORK_SERVICE_PATH = '/services/neural-network';
export const META_LEARNING_SERVICE_PATH = '/services/meta-learning';
export const TRANSFER_LEARNING_SERVICE_PATH = '/services/transfer-learning';
export const ENSEMBLE_LEARNING_SERVICE_PATH = '/services/ensemble-learning';
export const ONLINE_LEARNING_SERVICE_PATH = '/services/online-learning';
export const ACTIVE_LEARNING_SERVICE_PATH = '/services/active-learning';

/**
 * Advanced Learning Service - Core interface for sophisticated learning algorithms
 */
export interface AdvancedLearningService {
    /**
     * Create and configure an advanced learning model
     */
    createAdvancedModel(type: AdvancedLearningType, config: any): Promise<AdvancedLearningModel>;

    /**
     * Train an advanced learning model
     */
    trainAdvancedModel(modelId: string, data: AdvancedLearningData[]): Promise<AdvancedLearningResult>;

    /**
     * Make predictions with an advanced learning model
     */
    predict(modelId: string, input: TensorData | Tensor3D | any): Promise<AdvancedLearningResult>;

    /**
     * Evaluate model performance
     */
    evaluateModel(modelId: string, testData: AdvancedLearningData[]): Promise<AdvancedLearningResult>;

    /**
     * Update model with new data
     */
    updateModel(modelId: string, data: AdvancedLearningData[]): Promise<AdvancedLearningResult>;

    /**
     * Get model information
     */
    getModelInfo(modelId: string): Promise<AdvancedLearningModel | undefined>;

    /**
     * List all models of a specific type
     */
    listModels(type?: AdvancedLearningType): Promise<AdvancedLearningModel[]>;

    /**
     * Delete a model
     */
    deleteModel(modelId: string): Promise<boolean>;

    /**
     * Get learning statistics
     */
    getStats(): Promise<{
        totalModels: number;
        typeDistribution: Record<AdvancedLearningType, number>;
        averagePerformance: Record<AdvancedLearningType, number>;
        memoryUsage: number;
    }>;
}

/**
 * Neural Network Service - Specialized service for neural network operations
 */
export interface NeuralNetworkService {
    /**
     * Create a neural network
     */
    createNetwork(config: NeuralNetworkConfig): Promise<AdvancedLearningModel>;

    /**
     * Train neural network
     */
    train(modelId: string, trainData: AdvancedLearningData[], validationData?: AdvancedLearningData[]): Promise<AdvancedLearningResult>;

    /**
     * Forward pass
     */
    forward(modelId: string, input: TensorData | Tensor3D): Promise<TensorData | Tensor3D>;

    /**
     * Backward pass and update
     */
    backward(modelId: string, loss: number): Promise<void>;

    /**
     * Set learning rate
     */
    setLearningRate(modelId: string, learningRate: number): Promise<void>;

    /**
     * Get network architecture
     */
    getArchitecture(modelId: string): Promise<NeuralNetworkConfig>;

    /**
     * Prune network (remove less important connections)
     */
    pruneNetwork(modelId: string, pruningRatio: number): Promise<AdvancedLearningModel>;
}

/**
 * Meta-Learning Service - Service for learning-to-learn algorithms
 */
export interface MetaLearningService {
    /**
     * Initialize meta-learning
     */
    initialize(config: MetaLearningConfig): Promise<AdvancedLearningModel>;

    /**
     * Meta-train on multiple tasks
     */
    metaTrain(modelId: string, tasks: AdvancedLearningData[][]): Promise<AdvancedLearningResult>;

    /**
     * Fast adaptation to new task
     */
    fastAdapt(modelId: string, supportSet: AdvancedLearningData[], querySet: AdvancedLearningData[]): Promise<AdvancedLearningResult>;

    /**
     * Few-shot learning
     */
    fewShotLearn(modelId: string, examples: AdvancedLearningData[], shots: number): Promise<AdvancedLearningResult>;

    /**
     * Get adaptation performance
     */
    getAdaptationStats(modelId: string): Promise<{
        adaptationSpeed: number;
        generalizeability: number;
        taskSimilarity: Record<string, number>;
    }>;
}

/**
 * Transfer Learning Service - Service for transferring knowledge between tasks
 */
export interface TransferLearningService {
    /**
     * Initialize transfer learning
     */
    initialize(config: TransferLearningConfig): Promise<AdvancedLearningModel>;

    /**
     * Fine-tune pre-trained model
     */
    fineTune(modelId: string, targetData: AdvancedLearningData[]): Promise<AdvancedLearningResult>;

    /**
     * Freeze specific layers
     */
    freezeLayers(modelId: string, layerIndices: number[]): Promise<void>;

    /**
     * Unfreeze layers for fine-tuning
     */
    unfreezeLayers(modelId: string, layerIndices: number[]): Promise<void>;

    /**
     * Domain adaptation
     */
    adaptDomain(modelId: string, sourceData: AdvancedLearningData[], targetData: AdvancedLearningData[]): Promise<AdvancedLearningResult>;

    /**
     * Measure transfer effectiveness
     */
    measureTransferEffectiveness(modelId: string): Promise<{
        transferGain: number;
        domainSimilarity: number;
        convergenceSpeed: number;
    }>;
}

/**
 * Ensemble Learning Service - Service for combining multiple models
 */
export interface EnsembleLearningService {
    /**
     * Create ensemble
     */
    createEnsemble(config: EnsembleLearningConfig): Promise<AdvancedLearningModel>;

    /**
     * Add model to ensemble
     */
    addModel(ensembleId: string, modelId: string, weight?: number): Promise<void>;

    /**
     * Remove model from ensemble
     */
    removeModel(ensembleId: string, modelId: string): Promise<void>;

    /**
     * Ensemble prediction
     */
    ensemblePredict(ensembleId: string, input: any): Promise<AdvancedLearningResult>;

    /**
     * Update ensemble weights
     */
    updateWeights(ensembleId: string, weights: number[]): Promise<void>;

    /**
     * Get ensemble diversity metrics
     */
    getDiversityMetrics(ensembleId: string): Promise<{
        diversity: number;
        disagreement: number;
        correlation: number[][];
    }>;
}

/**
 * Online Learning Service - Service for continuous learning
 */
export interface OnlineLearningService {
    /**
     * Initialize online learning
     */
    initialize(config: OnlineLearningConfig): Promise<AdvancedLearningModel>;

    /**
     * Process single data point
     */
    processDataPoint(modelId: string, data: AdvancedLearningData): Promise<AdvancedLearningResult>;

    /**
     * Process data stream
     */
    processStream(modelId: string, dataStream: AdvancedLearningData[]): Promise<AdvancedLearningResult>;

    /**
     * Adjust learning rate dynamically
     */
    adjustLearningRate(modelId: string, performance: number): Promise<void>;

    /**
     * Handle concept drift
     */
    handleConceptDrift(modelId: string, driftSignal: number): Promise<void>;

    /**
     * Get online learning metrics
     */
    getOnlineMetrics(modelId: string): Promise<{
        totalSamples: number;
        currentAccuracy: number;
        learningCurve: number[];
        driftDetections: number;
    }>;
}

/**
 * Active Learning Service - Service for intelligent data selection
 */
export interface ActiveLearningService {
    /**
     * Initialize active learning
     */
    initialize(config: ActiveLearningConfig): Promise<AdvancedLearningModel>;

    /**
     * Query for most informative samples
     */
    queryInformativeSamples(modelId: string, unlabeledPool: any[], batchSize: number): Promise<{
        selectedIndices: number[];
        uncertaintyScores: number[];
        expectedImprovement: number[];
    }>;

    /**
     * Update with newly labeled data
     */
    updateWithLabels(modelId: string, labeledData: AdvancedLearningData[]): Promise<AdvancedLearningResult>;

    /**
     * Estimate labeling cost
     */
    estimateLabelingCost(modelId: string, samples: any[]): Promise<{
        totalCost: number;
        perSampleCost: number[];
        costBenefit: number;
    }>;

    /**
     * Get active learning statistics
     */
    getActiveLearningStats(modelId: string): Promise<{
        totalQueries: number;
        labelingEfficiency: number;
        performanceGain: number;
        uncertaintyReduction: number;
    }>;
}