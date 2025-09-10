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

import { inject, injectable } from '@theia/core/shared/inversify';
import { ToolInvocationContribution, ToolRequest } from '@theia/ai-core';
import { OpenCogService } from '../common/opencog-service';
import { AtomSpaceService } from '../node/atomspace-service';
import { KnowledgeManagementService } from '../common/knowledge-management-service';

/**
 * Tool contribution that registers OpenCog-specific tools with Theia's AI framework.
 * Demonstrates the tool registry integration pattern identified in the analysis.
 */
@injectable()
export class OpenCogToolContribution implements ToolInvocationContribution {
    @inject(OpenCogService)
    protected readonly openCogService: OpenCogService;

    @inject(AtomSpaceService)
    protected readonly atomSpaceService: AtomSpaceService;

    @inject(KnowledgeManagementService)
    protected readonly knowledgeService: KnowledgeManagementService;

    getTools(): ToolRequest[] {
        return [
            this.createAtomSpaceQueryTool(),
            this.createCognitiveReasoningTool(),
            this.createPatternRecognitionTool(),
            this.createBehaviorLearningTool(),
            this.createAdaptationStrategyTool(),
            this.createKnowledgeExtractionTool(),
            this.createCognitiveAnalysisTool(),
            this.createLearningModelTool()
        ];
    }

    private createAtomSpaceQueryTool(): ToolRequest {
        return {
            id: 'atomspace-query',
            name: 'Query AtomSpace',
            description: 'Query the OpenCog AtomSpace for knowledge, patterns, and relationships',
            parameters: {
                type: 'object',
                properties: {
                    pattern: {
                        type: 'object',
                        description: 'AtomSpace query pattern (type, name, or complex pattern)',
                        properties: {
                            type: {
                                type: 'string',
                                description: 'Atom type to query (e.g., ConceptNode, PredicateNode)'
                            },
                            name: {
                                type: 'string',
                                description: 'Atom name to match'
                            },
                            truthValue: {
                                type: 'object',
                                description: 'Truth value constraints'
                            }
                        }
                    },
                    context: {
                        type: 'object',
                        description: 'Query context and constraints',
                        properties: {
                            domain: {
                                type: 'string',
                                description: 'Knowledge domain to focus on'
                            },
                            maxResults: {
                                type: 'number',
                                description: 'Maximum number of results to return',
                                default: 10
                            }
                        }
                    }
                },
                required: ['pattern']
            },
            handler: async (parameters: any) => {
                try {
                    const atoms = await this.atomSpaceService.queryAtoms(parameters.pattern);
                    
                    // Apply context filtering if provided
                    let filteredAtoms = atoms;
                    if (parameters.context?.domain) {
                        filteredAtoms = atoms.filter(atom => 
                            atom.metadata?.domain === parameters.context.domain
                        );
                    }
                    
                    // Limit results if specified
                    if (parameters.context?.maxResults) {
                        filteredAtoms = filteredAtoms.slice(0, parameters.context.maxResults);
                    }

                    return {
                        atoms: filteredAtoms,
                        count: filteredAtoms.length,
                        query: parameters.pattern,
                        context: parameters.context
                    };
                } catch (error) {
                    return {
                        error: `AtomSpace query failed: ${error.message}`,
                        atoms: [],
                        count: 0
                    };
                }
            }
        };
    }

    private createCognitiveReasoningTool(): ToolRequest {
        return {
            id: 'cognitive-reasoning',
            name: 'Cognitive Reasoning',
            description: 'Apply cognitive reasoning using OpenCog\'s PLN (Probabilistic Logic Networks)',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'object',
                        description: 'Reasoning query with premises and goals',
                        properties: {
                            premises: {
                                type: 'array',
                                description: 'Initial premises for reasoning'
                            },
                            goal: {
                                type: 'string',
                                description: 'Reasoning goal or question'
                            }
                        }
                    },
                    reasoningType: {
                        type: 'string',
                        enum: ['deductive', 'inductive', 'abductive', 'analogical'],
                        description: 'Type of reasoning to apply',
                        default: 'deductive'
                    },
                    context: {
                        type: 'object',
                        description: 'Reasoning context and constraints',
                        properties: {
                            domain: {
                                type: 'string',
                                description: 'Domain-specific reasoning context'
                            },
                            maxSteps: {
                                type: 'number',
                                description: 'Maximum reasoning steps',
                                default: 10
                            },
                            confidenceThreshold: {
                                type: 'number',
                                description: 'Minimum confidence threshold',
                                default: 0.5
                            }
                        }
                    }
                },
                required: ['query']
            },
            handler: async (parameters: any) => {
                try {
                    const result = await this.openCogService.reason({
                        type: parameters.reasoningType || 'deductive',
                        ...parameters.query,
                        context: parameters.context
                    });

                    return {
                        result: result.result,
                        confidence: result.confidence,
                        explanation: result.explanation,
                        reasoningType: parameters.reasoningType,
                        steps: result.metadata?.steps || [],
                        context: parameters.context
                    };
                } catch (error) {
                    return {
                        error: `Cognitive reasoning failed: ${error.message}`,
                        result: null,
                        confidence: 0
                    };
                }
            }
        };
    }

    private createPatternRecognitionTool(): ToolRequest {
        return {
            id: 'pattern-recognition',
            name: 'Pattern Recognition',
            description: 'Recognize patterns in code, data, or text using OpenCog\'s pattern matching',
            parameters: {
                type: 'object',
                properties: {
                    input: {
                        type: 'object',
                        description: 'Input data for pattern recognition',
                        properties: {
                            data: {
                                type: 'string',
                                description: 'Text, code, or data to analyze'
                            },
                            type: {
                                type: 'string',
                                enum: ['code', 'text', 'data', 'sequence'],
                                description: 'Type of input data'
                            }
                        },
                        required: ['data']
                    },
                    scope: {
                        type: 'string',
                        enum: ['local', 'global', 'comprehensive'],
                        description: 'Scope of pattern recognition',
                        default: 'local'
                    },
                    context: {
                        type: 'object',
                        description: 'Pattern recognition context',
                        properties: {
                            language: {
                                type: 'string',
                                description: 'Programming language (for code analysis)'
                            },
                            domain: {
                                type: 'string',
                                description: 'Domain-specific patterns to look for'
                            }
                        }
                    }
                },
                required: ['input']
            },
            handler: async (parameters: any) => {
                try {
                    const patterns = await this.openCogService.recognizePatterns({
                        data: parameters.input.data,
                        context: parameters.context,
                        scope: parameters.scope
                    });

                    return {
                        patterns: patterns.map(p => ({
                            pattern: p.pattern,
                            confidence: p.confidence,
                            instances: p.instances,
                            description: this.generatePatternDescription(p.pattern)
                        })),
                        input: parameters.input,
                        scope: parameters.scope,
                        context: parameters.context
                    };
                } catch (error) {
                    return {
                        error: `Pattern recognition failed: ${error.message}`,
                        patterns: []
                    };
                }
            }
        };
    }

    private createBehaviorLearningTool(): ToolRequest {
        return {
            id: 'behavior-learning',
            name: 'Behavior Learning',
            description: 'Learn from user behavior and interactions for personalization',
            parameters: {
                type: 'object',
                properties: {
                    userId: {
                        type: 'string',
                        description: 'User identifier',
                        default: 'current'
                    },
                    action: {
                        type: 'string',
                        enum: ['learn', 'adapt', 'predict', 'analyze'],
                        description: 'Learning action to perform'
                    },
                    data: {
                        type: 'object',
                        description: 'Behavior data to learn from',
                        properties: {
                            interaction: {
                                type: 'object',
                                description: 'User interaction data'
                            },
                            feedback: {
                                type: 'object',
                                description: 'User feedback data'
                            },
                            context: {
                                type: 'object',
                                description: 'Interaction context'
                            }
                        }
                    }
                },
                required: ['action']
            },
            handler: async (parameters: any) => {
                try {
                    const userId = parameters.userId || 'current';
                    
                    switch (parameters.action) {
                        case 'learn':
                            if (parameters.data?.interaction) {
                                await this.openCogService.learnUserBehavior(
                                    userId,
                                    parameters.data.interaction.action,
                                    parameters.data.context
                                );
                            }
                            return { learned: true, userId };

                        case 'adapt':
                            const strategy = await this.openCogService.adaptToUser(
                                userId,
                                parameters.data?.context?.domain || 'general',
                                parameters.data
                            );
                            return { strategy, userId };

                        case 'predict':
                            const predictions = await this.openCogService.predictUserAction(
                                userId,
                                parameters.data?.context
                            );
                            return { predictions, userId };

                        case 'analyze':
                            const patterns = await this.openCogService.getUserBehaviorPatterns(userId);
                            return { patterns, userId };

                        default:
                            return { error: 'Unknown learning action' };
                    }
                } catch (error) {
                    return {
                        error: `Behavior learning failed: ${error.message}`,
                        userId: parameters.userId
                    };
                }
            }
        };
    }

    private createAdaptationStrategyTool(): ToolRequest {
        return {
            id: 'adaptation-strategy',
            name: 'Adaptation Strategy',
            description: 'Generate adaptive strategies based on user patterns and context',
            parameters: {
                type: 'object',
                properties: {
                    userId: {
                        type: 'string',
                        description: 'User identifier',
                        default: 'current'
                    },
                    context: {
                        type: 'string',
                        description: 'Adaptation context (e.g., "coding", "learning", "analysis")'
                    },
                    preferences: {
                        type: 'object',
                        description: 'User preferences and patterns'
                    },
                    mode: {
                        type: 'string',
                        enum: ['response', 'interface', 'content', 'workflow'],
                        description: 'Type of adaptation',
                        default: 'response'
                    }
                },
                required: ['context']
            },
            handler: async (parameters: any) => {
                try {
                    const userId = parameters.userId || 'current';
                    const strategy = await this.openCogService.getAdaptationStrategy(userId, parameters.context);
                    
                    return {
                        strategy: strategy || {
                            adaptationType: parameters.mode,
                            recommendations: [],
                            confidence: 0.5
                        },
                        userId,
                        context: parameters.context,
                        mode: parameters.mode
                    };
                } catch (error) {
                    return {
                        error: `Adaptation strategy generation failed: ${error.message}`,
                        strategy: null
                    };
                }
            }
        };
    }

    private createKnowledgeExtractionTool(): ToolRequest {
        return {
            id: 'knowledge-extraction',
            name: 'Knowledge Extraction',
            description: 'Extract and organize knowledge using OpenCog\'s knowledge management',
            parameters: {
                type: 'object',
                properties: {
                    source: {
                        type: 'object',
                        description: 'Knowledge source (text, code, data)',
                        properties: {
                            content: {
                                type: 'string',
                                description: 'Source content to extract knowledge from'
                            },
                            type: {
                                type: 'string',
                                enum: ['text', 'code', 'documentation', 'data'],
                                description: 'Type of source content'
                            },
                            language: {
                                type: 'string',
                                description: 'Programming language (for code sources)'
                            }
                        },
                        required: ['content', 'type']
                    },
                    domain: {
                        type: 'string',
                        description: 'Knowledge domain for organization'
                    },
                    extractionType: {
                        type: 'string',
                        enum: ['concepts', 'relationships', 'patterns', 'comprehensive'],
                        description: 'Type of knowledge to extract',
                        default: 'comprehensive'
                    }
                },
                required: ['source']
            },
            handler: async (parameters: any) => {
                try {
                    const result = await this.knowledgeService.extractKnowledge(
                        parameters.source.content,
                        {
                            sourceType: parameters.source.type,
                            domain: parameters.domain,
                            extractionType: parameters.extractionType,
                            language: parameters.source.language
                        }
                    );

                    return {
                        knowledge: result.concepts,
                        relationships: result.relationships,
                        patterns: result.patterns,
                        confidence: result.confidence,
                        source: parameters.source,
                        domain: parameters.domain
                    };
                } catch (error) {
                    return {
                        error: `Knowledge extraction failed: ${error.message}`,
                        knowledge: [],
                        relationships: []
                    };
                }
            }
        };
    }

    private createCognitiveAnalysisTool(): ToolRequest {
        return {
            id: 'cognitive-analysis',
            name: 'Cognitive Analysis',
            description: 'Perform comprehensive cognitive analysis combining multiple OpenCog capabilities',
            parameters: {
                type: 'object',
                properties: {
                    input: {
                        type: 'string',
                        description: 'Content to analyze'
                    },
                    analysisType: {
                        type: 'string',
                        enum: ['code-quality', 'problem-solving', 'learning-assessment', 'pattern-analysis'],
                        description: 'Type of cognitive analysis',
                        default: 'pattern-analysis'
                    },
                    context: {
                        type: 'object',
                        description: 'Analysis context and parameters'
                    }
                },
                required: ['input']
            },
            handler: async (parameters: any) => {
                try {
                    // Perform comprehensive analysis using multiple OpenCog capabilities
                    const [patterns, reasoning, knowledge] = await Promise.all([
                        this.openCogService.recognizePatterns({
                            data: parameters.input,
                            scope: 'comprehensive'
                        }),
                        this.openCogService.reason({
                            type: 'deductive',
                            context: parameters.context
                        }),
                        this.knowledgeService.extractKnowledge(parameters.input, {
                            sourceType: 'text',
                            extractionType: 'comprehensive'
                        })
                    ]);

                    return {
                        analysis: {
                            patterns: patterns,
                            reasoning: reasoning,
                            knowledge: knowledge,
                            type: parameters.analysisType,
                            confidence: this.calculateOverallConfidence([
                                ...patterns.map(p => p.confidence),
                                reasoning.confidence,
                                knowledge.confidence
                            ])
                        },
                        input: parameters.input,
                        context: parameters.context
                    };
                } catch (error) {
                    return {
                        error: `Cognitive analysis failed: ${error.message}`,
                        analysis: null
                    };
                }
            }
        };
    }

    private createLearningModelTool(): ToolRequest {
        return {
            id: 'learning-model',
            name: 'Learning Model',
            description: 'Manage and interact with OpenCog learning models',
            parameters: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        enum: ['create', 'update', 'query', 'list', 'stats'],
                        description: 'Learning model action'
                    },
                    modelType: {
                        type: 'string',
                        description: 'Type of learning model (for create action)'
                    },
                    modelId: {
                        type: 'string',
                        description: 'Model identifier (for update/query actions)'
                    },
                    parameters: {
                        type: 'object',
                        description: 'Model parameters or training data'
                    }
                },
                required: ['action']
            },
            handler: async (parameters: any) => {
                try {
                    switch (parameters.action) {
                        case 'create':
                            const model = await this.openCogService.createLearningModel(
                                parameters.modelType,
                                parameters.parameters
                            );
                            return { model, created: true };

                        case 'update':
                            if (!parameters.modelId) {
                                return { error: 'Model ID required for update' };
                            }
                            const updatedModel = await this.openCogService.updateLearningModel(
                                parameters.modelId,
                                parameters.parameters
                            );
                            return { model: updatedModel, updated: true };

                        case 'query':
                            if (!parameters.modelId) {
                                return { error: 'Model ID required for query' };
                            }
                            const queriedModel = await this.openCogService.getLearningModel(parameters.modelId);
                            return { model: queriedModel };

                        case 'list':
                            const models = await this.openCogService.listLearningModels();
                            return { models };

                        case 'stats':
                            const stats = await this.openCogService.getLearningStats();
                            return { stats };

                        default:
                            return { error: 'Unknown learning model action' };
                    }
                } catch (error) {
                    return {
                        error: `Learning model operation failed: ${error.message}`,
                        action: parameters.action
                    };
                }
            }
        };
    }

    private generatePatternDescription(pattern: any): string {
        if (pattern.name) {
            return `Pattern: ${pattern.name} (${pattern.type || 'unknown'})`;
        }
        return `Pattern of type: ${pattern.type || 'unknown'}`;
    }

    private calculateOverallConfidence(confidences: number[]): number {
        if (confidences.length === 0) return 0;
        return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    }
}