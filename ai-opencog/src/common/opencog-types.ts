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

/**
 * Represents an atom in the OpenCog AtomSpace
 */
export interface Atom {
    id?: string;
    type: string;
    name?: string;
    truthValue?: TruthValue;
    attentionValue?: AttentionValue;
    incoming?: Atom[];
    outgoing?: Atom[];
    metadata?: Record<string, any>;
}

/**
 * Truth value for OpenCog atoms
 */
export interface TruthValue {
    strength: number;
    confidence: number;
}

/**
 * Attention value for OpenCog atoms
 */
export interface AttentionValue {
    sti: number; // Short-term importance
    lti: number; // Long-term importance
    vlti: number; // Very long-term importance
}

/**
 * Pattern for querying atoms in the AtomSpace
 */
export interface AtomPattern {
    type?: string;
    name?: string;
    pattern?: Record<string, any>;
    truthValueThreshold?: TruthValue;
    attentionThreshold?: AttentionValue;
    bindVariables?: Record<string, any>;
}

/**
 * Reasoning query structure
 */
export interface ReasoningQuery {
    type: 'deductive' | 'inductive' | 'abductive' | 'code-analysis' | 'code-completion' | 
          'problem-analysis' | 'approach-selection' | 'debugging-assistance' | 'assistance-analysis';
    atoms?: Atom[];
    premises?: Atom[];
    context?: any;
    parameters?: Record<string, any>;
}

/**
 * Result from reasoning operations
 */
export interface ReasoningResult {
    conclusion?: Atom[];
    confidence: number;
    explanation?: string;
    metadata?: Record<string, any>;
}

/**
 * Learning data input
 */
export interface LearningData {
    type: 'supervised' | 'unsupervised' | 'reinforcement' | 'personalization' | 'behavioral' | 'adaptive';
    input: any;
    expectedOutput?: any;
    feedback?: UserFeedback;
    context?: LearningContext;
    timestamp?: number;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    sessionId?: string;
}

/**
 * Learning context for better adaptation
 */
export interface LearningContext {
    userId?: string;
    workspaceId?: string;
    projectType?: string;
    currentTask?: string;
    request?: any;
    response?: any;
    context?: any;
    timestamp?: number;
    userExperience?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    preferences?: Record<string, any>;
    environmentInfo?: Record<string, any>;
    reasoningType?: string;
    interactionType?: string;
}

/**
 * User feedback for learning
 */
export interface UserFeedback {
    rating: number; // 1-5 scale
    helpful: boolean;
    comment?: string;
    actionTaken?: string;
    timeSpent?: number; // Time spent with suggestion in seconds
    outcome?: 'accepted' | 'rejected' | 'modified' | 'ignored';
}

/**
 * Learning model for storing learned patterns
 */
export interface LearningModel {
    id: string;
    type: string;
    version: number;
    accuracy?: number;
    confidence?: number;
    trainingData?: LearningData[];
    parameters?: Record<string, any>;
    createdAt: number;
    updatedAt: number;
}

/**
 * Adaptation strategy for personalization
 */
export interface AdaptationStrategy {
    id: string;
    userId: string;
    domain: string; // e.g., 'code_completion', 'debugging', 'navigation'
    strategy: Record<string, any>;
    effectiveness: number; // 0-1 scale
    lastUpdated: number;
}

/**
 * User behavior pattern
 */
export interface UserBehaviorPattern {
    id: string;
    userId: string;
    pattern: string;
    frequency: number;
    context: Record<string, any>;
    confidence: number;
    discovered: number;
    lastSeen: number;
}

/**
 * Pattern recognition input
 */
export interface PatternInput {
    data: any;
    context?: any;
    scope?: 'local' | 'global' | 'project' | 'file' | 'session' | 'domain-specific' | 'comprehensive';
    options?: PatternRecognitionOptions;
}

/**
 * Options for pattern recognition
 */
export interface PatternRecognitionOptions {
    /** Maximum number of patterns to return */
    maxResults?: number;
    /** Minimum confidence threshold */
    minConfidence?: number;
    /** Specific pattern types to look for */
    patternTypes?: PatternType[];
    /** Whether to include low-confidence patterns */
    includeLowConfidence?: boolean;
}

/**
 * Types of patterns that can be recognized
 */
export type PatternType = 
    | 'code' 
    | 'structural' 
    | 'behavioral' 
    | 'usage'
    | 'syntax-pattern'
    | 'design-pattern'
    | 'async-pattern'
    | 'reactive-pattern'
    | 'sequence'
    | 'repetition'
    | 'hierarchical'
    | 'interaction-rhythm'
    | 'usage-profile'
    | 'sequential'
    | 'semantic'
    // Phase 2 pattern types
    | 'anti-pattern'
    | 'code-smell'
    | 'workflow-pattern'
    | 'usage-pattern'
    | 'growth-pattern'
    | 'refactoring-pattern'
    | 'maintenance-pattern'
    // Phase 3 intelligent assistance patterns
    | 'code-quality'
    | 'potential-issue' 
    | 'improvement-opportunity';

/**
 * Pattern recognition result
 */
export interface PatternResult {
    pattern: any;
    confidence: number;
    instances: any[];
    metadata?: PatternMetadata;
}

/**
 * Metadata for pattern results
 */
export interface PatternMetadata {
    patternType?: PatternType;
    timestamp?: number;
    language?: string;
    complexity?: 'simple' | 'moderate' | 'complex';
    frequency?: number;
    depth?: number;
    timespan?: number;
    efficiency?: number;
    variability?: number;
    consistency?: number;
    [key: string]: any;
}

// ===== PHASE 5: MULTI-MODAL COGNITIVE PROCESSING TYPES =====

/**
 * Multi-modal data types for comprehensive cognitive processing
 * Supports text, image, audio, and tensor data with 4 degrees of freedom
 */

/**
 * Supported modalities for multi-modal processing
 */
export type ModalityType = 'text' | 'image' | 'audio' | 'tensor' | 'mixed';

/**
 * Multi-modal data structure
 */
export interface MultiModalData {
    id?: string;
    type: ModalityType;
    content: TextData | ImageData | AudioData | TensorData | MixedModalData;
    metadata?: MultiModalMetadata;
    timestamp?: number;
}

/**
 * Text data for multi-modal processing
 */
export interface TextData {
    text: string;
    language?: string;
    encoding?: string;
    format?: 'plain' | 'markdown' | 'code' | 'html' | 'json';
    semanticAnnotations?: SemanticAnnotation[];
}

/**
 * Image data for multi-modal processing
 */
export interface ImageData {
    data: ArrayBuffer | string; // Binary data or base64 string
    format: 'png' | 'jpg' | 'jpeg' | 'gif' | 'svg' | 'webp';
    width?: number;
    height?: number;
    channels?: number;
    description?: string;
    features?: ImageFeature[];
}

/**
 * Audio data for multi-modal processing
 */
export interface AudioData {
    data: ArrayBuffer | string; // Binary data or base64 string
    format: 'wav' | 'mp3' | 'ogg' | 'flac' | 'aac';
    duration?: number; // in seconds
    sampleRate?: number;
    channels?: number;
    transcript?: string;
    features?: AudioFeature[];
}

/**
 * Tensor data with 4 degrees of freedom for advanced cognitive processing
 */
export interface TensorData {
    data: number[] | Float32Array | Float64Array;
    shape: [number, number, number, number]; // 4 DoF as specified
    dtype: 'float32' | 'float64' | 'int32' | 'int64';
    description?: string;
    operations?: TensorOperation[];
}

/**
 * Tensor data with 3 degrees of freedom for specialized cognitive processing
 */
export interface Tensor3D {
    data: number[] | Float32Array | Float64Array;
    shape: [number, number, number]; // 3 DoF as specified
    dtype: 'float32' | 'float64' | 'int32' | 'int64';
    description?: string;
    operations?: TensorOperation[];
}

/**
 * Mixed modal data combining multiple modalities
 */
export interface MixedModalData {
    components: MultiModalData[];
    relationships?: ModalityRelationship[];
    fusionStrategy?: 'early' | 'late' | 'intermediate' | 'attention';
}

/**
 * Semantic annotations for text data
 */
export interface SemanticAnnotation {
    type: 'entity' | 'concept' | 'relation' | 'intent' | 'sentiment';
    value: string;
    confidence: number;
    span?: [number, number]; // start and end positions
}

/**
 * Image features extracted for cognitive processing
 */
export interface ImageFeature {
    type: 'edge' | 'corner' | 'blob' | 'texture' | 'color' | 'shape' | 'object';
    value: number[];
    confidence: number;
    location?: [number, number, number, number]; // x, y, width, height
}

/**
 * Audio features extracted for cognitive processing
 */
export interface AudioFeature {
    type: 'mfcc' | 'spectral' | 'temporal' | 'pitch' | 'energy' | 'rhythm';
    value: number[];
    confidence: number;
    timespan?: [number, number]; // start and end time in seconds
}

/**
 * Tensor operations for cognitive processing
 */
export interface TensorOperation {
    type: 'convolution' | 'pooling' | 'normalization' | 'activation' | 'fusion' | 'attention' | 'dense' | 'dropout' | 'batch_norm' | 'layer_norm' | 'conv3d' | 'pool3d' | 'normalize3d';
    parameters: Record<string, any>;
    result?: TensorData | Tensor3D;
}

/**
 * Relationships between different modalities
 */
export interface ModalityRelationship {
    sourceModality: ModalityType;
    targetModality: ModalityType;
    relationshipType: 'synchronization' | 'correlation' | 'causation' | 'complement' | 'conflict';
    strength: number; // 0-1 scale
    confidence: number;
}

/**
 * Metadata for multi-modal data
 */
export interface MultiModalMetadata {
    source?: string;
    quality?: number; // 0-1 scale
    processingHistory?: ProcessingStep[];
    cognitiveAnnotations?: CognitiveAnnotation[];
    context?: MultiModalContext;
}

/**
 * Processing step in the multi-modal pipeline
 */
export interface ProcessingStep {
    operation: string;
    timestamp: number;
    parameters?: Record<string, any>;
    processingTime?: number; // in milliseconds
}

/**
 * Cognitive annotations for multi-modal data
 */
export interface CognitiveAnnotation {
    type: 'attention' | 'memory' | 'reasoning' | 'prediction' | 'emotion' | 'intent';
    value: any;
    confidence: number;
    source?: string;
}

/**
 * Context for multi-modal processing
 */
export interface MultiModalContext {
    task?: string;
    domain?: string;
    userIntent?: string;
    environmentalFactors?: Record<string, any>;
    temporalContext?: {
        duration?: number;
        sequence?: number;
        frequency?: number;
    };
}

/**
 * Multi-modal pattern recognition input
 */
export interface MultiModalPatternInput {
    data: MultiModalData[];
    context?: MultiModalContext;
    scope?: 'local' | 'global' | 'cross-modal' | 'temporal' | 'spatial';
    options?: MultiModalPatternOptions;
}

/**
 * Options for multi-modal pattern recognition
 */
export interface MultiModalPatternOptions extends PatternRecognitionOptions {
    /** Modalities to include in pattern recognition */
    modalities?: ModalityType[];
    /** Whether to perform cross-modal pattern recognition */
    crossModal?: boolean;
    /** Fusion strategy for multi-modal patterns */
    fusionStrategy?: 'early' | 'late' | 'intermediate' | 'attention';
    /** Temporal window for pattern recognition */
    temporalWindow?: number;
}

/**
 * Multi-modal pattern recognition result
 */
export interface MultiModalPatternResult {
    pattern: MultiModalPattern;
    confidence: number;
    modalities: ModalityType[];
    instances: MultiModalData[];
    metadata?: MultiModalPatternMetadata;
}

/**
 * Multi-modal pattern structure
 */
export interface MultiModalPattern {
    id?: string;
    type: PatternType | MultiModalPatternType;
    modalities: ModalityType[];
    structure: any;
    relationships?: ModalityRelationship[];
    temporalAspects?: TemporalPattern;
}

/**
 * Additional pattern types for multi-modal processing
 */
export type MultiModalPatternType = 
    | 'cross-modal-correlation'
    | 'temporal-synchronization'
    | 'multimodal-concept'
    | 'attention-pattern'
    | 'fusion-pattern'
    | 'modality-dominance'
    | 'cognitive-load'
    | 'context-switch';

/**
 * Temporal patterns in multi-modal data
 */
export interface TemporalPattern {
    duration: number;
    frequency?: number;
    phase?: number;
    synchronization?: Record<ModalityType, number>;
}

/**
 * Metadata for multi-modal pattern results
 */
export interface MultiModalPatternMetadata extends PatternMetadata {
    modalityContribution?: Record<ModalityType, number>;
    crossModalCorrelation?: number;
    temporalConsistency?: number;
    cognitiveComplexity?: number;
}

/**
 * Multi-modal learning data for cognitive processing
 */
export interface MultiModalLearningData extends LearningData {
    modalData: MultiModalData[];
    crossModalLabels?: Record<string, any>;
    temporalSequence?: number[];
    cognitiveGoal?: string;
}

// ===== PHASE 5: ADVANCED LEARNING ALGORITHMS =====

/**
 * Advanced learning algorithm types for sophisticated cognitive processing
 */
export type AdvancedLearningType = 
    | 'deep_neural_network'
    | 'convolutional_neural_network'
    | 'recurrent_neural_network'
    | 'transformer'
    | 'meta_learning'
    | 'transfer_learning'
    | 'ensemble_learning'
    | 'ensemble'
    | 'online_learning'
    | 'online'
    | 'active_learning'
    | 'active'
    | 'federated_learning'
    | 'continual_learning'
    | 'few_shot_learning';

/**
 * Neural network architecture configuration
 */
export interface NeuralNetworkConfig {
    type: 'feedforward' | 'cnn' | 'rnn' | 'lstm' | 'gru' | 'transformer';
    layers: NetworkLayer[];
    optimizer: OptimizerConfig;
    lossFunction: string;
    metrics: string[];
    inputShape: number[] | [number, number, number]; // Support for 3D inputs
}

/**
 * Network layer configuration
 */
export interface NetworkLayer {
    type: 'dense' | 'conv2d' | 'conv3d' | 'lstm' | 'gru' | 'attention' | 'dropout' | 'batch_norm' | 'layer_norm';
    units?: number;
    activation?: string;
    dropoutRate?: number;
    filters?: number;
    kernelSize?: number | [number, number] | [number, number, number];
    strides?: number | [number, number] | [number, number, number];
    padding?: 'valid' | 'same';
    parameters?: Record<string, any>;
}

/**
 * Optimizer configuration for training
 */
export interface OptimizerConfig {
    type: 'sgd' | 'adam' | 'rmsprop' | 'adagrad' | 'adadelta' | 'adamax';
    learningRate: number;
    momentum?: number;
    beta1?: number;
    beta2?: number;
    epsilon?: number;
    decay?: number;
    clipNorm?: number;
}

/**
 * Meta-learning configuration for learning-to-learn scenarios
 */
export interface MetaLearningConfig {
    algorithm: 'maml' | 'reptile' | 'prototypical_networks' | 'matching_networks';
    innerLearningRate: number;
    outerLearningRate: number;
    innerSteps: number;
    taskDistribution: string;
    supportSetSize: number;
    querySetSize: number;
}

/**
 * Transfer learning configuration
 */
export interface TransferLearningConfig {
    sourceModel: string;
    targetTask: string;
    frozenLayers: number[];
    fineTuneFromLayer?: number;
    transferStrategy: 'feature_extraction' | 'fine_tuning' | 'domain_adaptation';
    adaptationMethod?: 'adversarial' | 'coral' | 'dann' | 'gradient_reversal';
}

/**
 * Ensemble learning configuration
 */
export interface EnsembleLearningConfig {
    strategy: 'bagging' | 'boosting' | 'stacking' | 'voting';
    baseModels: NeuralNetworkConfig[];
    combiningMethod: 'average' | 'weighted_average' | 'majority_vote' | 'meta_learner';
    weights?: number[];
    diversityMetric?: string;
}

/**
 * Online learning configuration for continuous adaptation
 */
export interface OnlineLearningConfig {
    algorithm: 'sgd' | 'perceptron' | 'passive_aggressive' | 'ftrl' | 'online_gradient_descent';
    bufferSize: number;
    adaptationRate: number;
    forgettingFactor?: number;
    regularization?: 'l1' | 'l2' | 'elastic_net';
}

/**
 * Active learning configuration for intelligent data selection
 */
export interface ActiveLearningConfig {
    strategy: 'uncertainty_sampling' | 'query_by_committee' | 'expected_model_change' | 'variance_reduction';
    acquisitionFunction: 'entropy' | 'margin' | 'least_confident' | 'expected_improvement';
    batchSize: number;
    diversityWeight?: number;
    explorationWeight?: number;
}

/**
 * Advanced learning data supporting multiple algorithms
 */
export interface AdvancedLearningData {
    id?: string;
    type: AdvancedLearningType;
    input: TensorData | Tensor3D | any;
    target?: TensorData | Tensor3D | any;
    context: LearningContext;
    config: NeuralNetworkConfig | MetaLearningConfig | TransferLearningConfig | EnsembleLearningConfig | OnlineLearningConfig | ActiveLearningConfig;
    timestamp: number;
    metadata?: {
        taskId?: string;
        episodeId?: string;
        batchId?: string;
        sequenceLength?: number;
        [key: string]: any;
    };
}

/**
 * Advanced learning result with detailed metrics
 */
export interface AdvancedLearningResult {
    success: boolean;
    modelId: string;
    algorithm: AdvancedLearningType;
    metrics: {
        loss: number;
        accuracy?: number;
        precision?: number;
        recall?: number;
        f1Score?: number;
        convergence?: boolean;
        trainingTime: number;
        [key: string]: any;
    };
    predictions?: any[];
    modelState?: any;
    nextActions?: string[];
    metadata?: Record<string, any>;
}

/**
 * Advanced learning model with sophisticated capabilities
 */
export interface AdvancedLearningModel {
    id: string;
    type: AdvancedLearningType;
    algorithm?: string;
    parameters?: any;
    config: any;
    state: any;
    version: number;
    created: number;
    lastUpdated: number;
    accuracy?: number;
    trainingTime?: number;
    metrics?: any;
    status?: string;
    performance: {
        trainingAccuracy: number;
        validationAccuracy: number;
        testAccuracy?: number;
        convergenceMetrics: Record<string, number>;
    };
    capabilities: string[];
    metadata: {
        datasetSize: number;
        epochs: number;
        parameters: number;
        memoryUsage: number;
        [key: string]: any;
    };
}