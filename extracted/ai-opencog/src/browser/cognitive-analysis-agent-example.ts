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
import { Agent, LanguageModelRequirement, PromptVariantSet } from '@theia/ai-core';
import { OpenCogService } from './opencog-service';

/**
 * Example implementation of a cognitive analysis agent that demonstrates
 * the integration patterns identified in the Theia AI Framework Analysis.
 * 
 * This agent showcases:
 * - Integration with OpenCog services
 * - Use of cognitive variables and context
 * - Tool function integration
 * - Sophisticated prompt templates
 * - Learning and adaptation capabilities
 */
@injectable()
export class CognitiveAnalysisAgent implements Agent {
    @inject(OpenCogService)
    protected readonly openCogService: OpenCogService;

    readonly id = 'cognitive-analysis';
    readonly name = 'Cognitive Analysis';
    readonly description = `
        Advanced cognitive analysis agent powered by OpenCog integration.
        
        **Capabilities:**
        - Cognitive reasoning using OpenCog's PLN (Probabilistic Logic Networks)
        - Pattern recognition in code and data structures
        - Learning from user feedback and behavior
        - Context-aware analysis and adaptation
        - Knowledge extraction from AtomSpace
        
        **Privacy Notice:**
        This agent accesses code content, user behavior patterns, and learning data
        to provide personalized cognitive analysis. All data is processed locally
        within the OpenCog AtomSpace system.
    `;

    readonly variables = [
        'selectedText',           // Standard Theia variable for selected content
        'cognitiveContext',       // OpenCog cognitive analysis context
        'userPatterns',           // Learned user behavior patterns
        'atomspaceKnowledge',     // Knowledge from AtomSpace
        'reasoningResult'         // Results from cognitive reasoning
    ];

    readonly functions = [
        'atomspace-query',        // Query OpenCog AtomSpace
        'cognitive-reasoning',    // Apply cognitive reasoning
        'pattern-recognition',    // Recognize patterns in data
        'behavior-learning',      // Learn from user behavior
        'adaptation-strategy'     // Generate adaptation strategies
    ];

    readonly languageModelRequirements: LanguageModelRequirement[] = [
        {
            purpose: 'cognitive-analysis',
            languageModelId: 'gpt-4-turbo'
        },
        {
            purpose: 'reasoning-explanation', 
            languageModelId: 'claude-3-sonnet'
        }
    ];

    readonly tags = [
        'cognitive',
        'analysis', 
        'opencog',
        'reasoning',
        'learning',
        'adaptive'
    ];

    readonly agentSpecificVariables = [
        {
            name: 'cognitiveContext',
            description: 'Current cognitive analysis context from OpenCog AtomSpace',
            usedInPrompt: true
        },
        {
            name: 'userPatterns',
            description: 'Learned user behavior patterns for personalization',
            usedInPrompt: true
        },
        {
            name: 'atomspaceKnowledge',
            description: 'Relevant knowledge extracted from OpenCog AtomSpace',
            usedInPrompt: true
        }
    ];

    readonly prompts: PromptVariantSet[] = [
        {
            id: 'cognitive-analysis-system',
            defaultVariant: {
                id: 'cognitive-analysis-comprehensive',
                template: `You are an advanced cognitive analysis assistant powered by OpenCog.

**User Request:**
{{selectedText}}

**Cognitive Context:**
{{cognitiveContext}}

**User Behavior Patterns:**
{{userPatterns}}

**Domain Knowledge:**
{{atomspaceKnowledge}}

**Analysis Workflow:**
1. **Pattern Recognition:**
   {{#pattern-recognition input=selectedText scope="comprehensive"}}

2. **Cognitive Reasoning:**
   {{#cognitive-reasoning query="analyze-request" reasoningType="deductive"}}

3. **Knowledge Integration:**
   {{#atomspace-query pattern="relevant-knowledge" context="user-domain"}}

4. **Adaptive Response:**
   {{#adaptation-strategy userId="current" context="analysis" preferences=userPatterns}}

**Reasoning Result:**
{{reasoningResult}}

**Instructions:**
- Provide detailed cognitive analysis with reasoning explanations
- Include confidence levels for your conclusions
- Highlight discovered patterns and their significance
- Suggest improvements or insights based on cognitive analysis
- Adapt your communication style based on user patterns
- Use {{#behavior-learning}} to record interaction for future learning

**Response Format:**
1. **Analysis Summary:** Brief overview of findings
2. **Cognitive Insights:** Detailed reasoning and pattern analysis
3. **Confidence Levels:** Quantified confidence in conclusions
4. **Recommendations:** Actionable suggestions
5. **Learning Notes:** What was learned from this interaction`
            },
            variants: [
                {
                    id: 'cognitive-analysis-concise',
                    template: `Cognitive Analysis Assistant (Concise Mode)

Request: {{selectedText}}
Context: {{cognitiveContext}}
Patterns: {{#pattern-recognition input=selectedText scope="local"}}
Reasoning: {{#cognitive-reasoning query="quick-analysis" reasoningType="abductive"}}

Provide concise cognitive analysis with key insights and confidence levels.
Adapt based on: {{userPatterns}}`
                },
                {
                    id: 'cognitive-analysis-educational',
                    template: `Educational Cognitive Analysis Assistant

Learning Request: {{selectedText}}

**Step-by-Step Cognitive Analysis:**

1. **Pattern Discovery:**
   {{#pattern-recognition input=selectedText scope="educational"}}
   *Explanation:* I'm analyzing the structure and patterns in your request.

2. **Knowledge Retrieval:**
   {{#atomspace-query pattern="educational-content" domain="learning"}}
   *Explanation:* I'm accessing relevant knowledge from the cognitive knowledge base.

3. **Reasoning Process:**
   {{#cognitive-reasoning query="educational-analysis" reasoningType="inductive"}}
   *Explanation:* I'm applying logical reasoning to draw insights.

4. **Personalized Learning:**
   Based on your learning patterns: {{userPatterns}}
   {{#adaptation-strategy userId="current" context="educational" mode="learning"}}

**Educational Insights:**
- Explain each step of the analysis
- Provide learning objectives
- Include practice suggestions
- Show confidence reasoning
- Connect to broader concepts`
                }
            ]
        }
    ];

    /**
     * Example method showing how the agent would integrate with OpenCog services
     * This is not part of the Agent interface but demonstrates the integration pattern
     */
    async performCognitiveAnalysis(input: {
        text: string;
        context?: any;
        userPreferences?: any;
    }): Promise<{
        analysis: any;
        patterns: any[];
        reasoning: any;
        confidence: number;
    }> {
        // Perform pattern recognition
        const patterns = await this.openCogService.recognizePatterns({
            data: input.text,
            context: input.context,
            scope: 'comprehensive'
        });

        // Apply cognitive reasoning
        const reasoning = await this.openCogService.reason({
            type: 'deductive',
            context: input.context,
            atoms: patterns.map(p => p.pattern)
        });

        // Query relevant knowledge
        const knowledge = await this.openCogService.queryAtoms({
            type: 'ConceptNode',
            pattern: { domain: input.context?.domain }
        });

        // Generate analysis with confidence
        const analysis = {
            input: input.text,
            patterns: patterns,
            reasoning: reasoning,
            knowledge: knowledge,
            timestamp: Date.now()
        };

        return {
            analysis,
            patterns,
            reasoning,
            confidence: reasoning.confidence || 0.8
        };
    }

    /**
     * Example method for learning from user feedback
     */
    async learnFromInteraction(interaction: {
        request: string;
        response: string;
        feedback: {
            rating: number;
            helpful: boolean;
            comment?: string;
        };
        context: any;
    }): Promise<void> {
        await this.openCogService.learnFromFeedback(
            {
                rating: interaction.feedback.rating,
                helpful: interaction.feedback.helpful,
                comment: interaction.feedback.comment,
                actionTaken: 'applied'
            },
            {
                request: interaction.request,
                response: interaction.response,
                context: interaction.context,
                timestamp: Date.now()
            }
        );
    }

    /**
     * Example method for adaptive behavior
     */
    async adaptToUser(userId: string, domain: string): Promise<any> {
        return this.openCogService.adaptToUser(userId, domain, {
            analysisStyle: 'comprehensive',
            preferredDepth: 'detailed',
            learningMode: 'interactive'
        });
    }
}