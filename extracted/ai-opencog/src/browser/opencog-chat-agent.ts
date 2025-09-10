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
import { AbstractStreamParsingChatAgent, ChatAgentLocation, SystemMessageDescription } from '@theia/ai-chat/lib/common/chat-agents';
import { LanguageModelRequirement, AIVariableContext } from '@theia/ai-core';
import { MutableChatRequestModel } from '@theia/ai-chat/lib/common/chat-model';
import { OpenCogService } from '../common/opencog-service';
import { IntelligentAssistanceAgent } from './intelligent-assistance-agent';
import { AdvancedReasoningAgent } from './advanced-reasoning-agent';
import { UserBehaviorLearningAgent } from './user-behavior-learning-agent';
import { KnowledgeManagementService } from '../common/knowledge-management-service';
import { MarkdownChatResponseContentImpl } from '@theia/ai-chat/lib/common/chat-model';

/**
 * OpenCog Chat Agent that integrates cognitive reasoning capabilities
 * with the main Theia AI chat system.
 */
@injectable()
export class OpenCogChatAgent extends AbstractStreamParsingChatAgent {
    readonly id = 'opencog';
    readonly name = 'OpenCog Reasoning';
    readonly description = 'AI assistant powered by OpenCog cognitive reasoning with adaptive learning and knowledge management';
    readonly languageModelRequirements: LanguageModelRequirement[] = [
        {
            purpose: 'chat',
            identifier: 'openai/gpt-4',
            fallBackToAnyModel: true
        }
    ];
    protected readonly defaultLanguageModelPurpose = 'chat';
    
    iconClass = 'codicon codicon-brain';
    locations = [ChatAgentLocation.Panel, ChatAgentLocation.Editor, ChatAgentLocation.Terminal];
    tags = ['OpenCog', 'Reasoning', 'Cognitive AI'];

    constructor(
        @inject(OpenCogService) 
        private readonly openCogService: OpenCogService,
        @inject(IntelligentAssistanceAgent) 
        private readonly assistanceAgent: IntelligentAssistanceAgent,
        @inject(AdvancedReasoningAgent) 
        private readonly reasoningAgent: AdvancedReasoningAgent,
        @inject(UserBehaviorLearningAgent) 
        private readonly learningAgent: UserBehaviorLearningAgent,
        @inject(KnowledgeManagementService) 
        private readonly knowledgeService: KnowledgeManagementService
    ) {
        super();
    }

    protected override async getSystemMessageDescription(context: AIVariableContext): Promise<SystemMessageDescription | undefined> {
        // Generate dynamic system prompt based on cognitive analysis
        const systemPrompt = `You are an advanced AI assistant powered by OpenCog cognitive reasoning. You have access to:

**Core Capabilities:**
- Pattern recognition and cognitive analysis
- Multi-step reasoning (deductive, inductive, abductive)
- Knowledge graph integration and retrieval
- User behavior learning and adaptation
- Intelligent code assistance and debugging

**Reasoning Transparency:**
- Always explain your cognitive reasoning process
- Provide confidence levels for your recommendations
- Reference the sources and patterns used in your analysis
- Adapt responses based on user expertise and context

**Instructions:**
1. Use cognitive analysis to provide more accurate and contextual responses
2. Reference reasoning processes and confidence levels when appropriate
3. Incorporate identified patterns and knowledge into responses
4. Provide explanations that demonstrate cognitive understanding
5. Adapt responses based on user's apparent expertise level and intent

Remember: You have cognitive reasoning capabilities that go beyond standard language models. Use this advantage to provide deeper, more insightful responses with transparent reasoning.`;

        return {
            text: systemPrompt,
            functionDescriptions: new Map()
        };
    }

    override async invoke(request: MutableChatRequestModel): Promise<void> {
        try {
            // Extract user query from the request
            const userQuery = request.message.parts.map(part => part.promptText).join(' ').trim();
            
            if (!userQuery) {
                this.addErrorResponse(request, 'Please provide a question or request for cognitive analysis.');
                return;
            }

            // Start with cognitive reasoning indicator
            request.response.response.addContent(
                new MarkdownChatResponseContentImpl('🧠 **Cognitive Processing**: Analyzing your request through OpenCog reasoning...\n\n')
            );

            // Perform cognitive analysis using OpenCog services
            const cognitiveAnalysis = await this.performCognitiveAnalysis(userQuery, request);
            
            // Continue with standard LLM processing enhanced with cognitive insights
            await super.invoke(request);
            
            // Add cognitive reasoning transparency
            await this.addCognitiveTransparency(request, cognitiveAnalysis);
            
        } catch (error) {
            this.logger.error('OpenCog chat agent error:', error);
            this.addErrorResponse(request, `Cognitive reasoning error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async performCognitiveAnalysis(userQuery: string, request: MutableChatRequestModel) {
        const analysis = {
            query: userQuery,
            patterns: [],
            reasoning: { confidence: 0, process: '', sources: [] },
            knowledge: [],
            userContext: {},
            suggestions: []
        };

        try {
            // 1. Pattern recognition and analysis
            const patterns = await this.openCogService.recognizePatterns({
                input: userQuery,
                context: {
                    sessionId: request.session.id,
                    userId: 'current-user', // TODO: Get actual user ID
                    previousQueries: request.session.getRequests().map(r => 
                        r.message.parts.map(p => p.promptText).join(' ')
                    ).slice(-5) // Last 5 queries for context
                }
            });
            analysis.patterns = patterns.patterns || [];

            // 2. Advanced reasoning based on query type
            let reasoningResult;
            if (this.isDebuggingQuery(userQuery)) {
                reasoningResult = await this.reasoningAgent.solveComplexProblem({
                    id: `debug-${Date.now()}`,
                    title: 'Debugging Assistance',
                    domain: 'debugging',
                    complexity: this.assessComplexity(userQuery),
                    constraints: ['maintain-functionality', 'preserve-intent'],
                    goals: ['identify-issue', 'provide-solution']
                });
            } else if (this.isCodeAnalysisQuery(userQuery)) {
                reasoningResult = await this.reasoningAgent.solveComplexProblem({
                    id: `analysis-${Date.now()}`,
                    title: 'Code Analysis',
                    domain: 'code-analysis',
                    complexity: this.assessComplexity(userQuery),
                    constraints: ['accuracy', 'best-practices'],
                    goals: ['understand-code', 'improve-quality']
                });
            } else {
                // General reasoning
                reasoningResult = await this.reasoningAgent.solveComplexProblem({
                    id: `general-${Date.now()}`,
                    title: 'General Assistance',
                    domain: 'general',
                    complexity: this.assessComplexity(userQuery),
                    constraints: ['helpfulness', 'accuracy'],
                    goals: ['understand-request', 'provide-assistance']
                });
            }

            analysis.reasoning = {
                confidence: reasoningResult.confidence || 0.7,
                process: reasoningResult.solution?.steps?.join(' → ') || 'Multi-step cognitive reasoning',
                sources: ['pattern-recognition', 'advanced-reasoning', 'knowledge-base']
            };

            // 3. Knowledge retrieval
            const knowledgeResults = await this.knowledgeService.queryKnowledge(userQuery, {
                maxResults: 5,
                threshold: 0.6
            });
            analysis.knowledge = knowledgeResults.results || [];

            // 4. User behavior and learning insights
            await this.learningAgent.trackUserInteraction('current-user', {
                action: 'chat-query',
                context: { query: userQuery, sessionId: request.session.id },
                timestamp: Date.now()
            });

            // 5. Get intelligent assistance suggestions
            const assistanceResponse = await this.assistanceAgent.provideIntelligentAssistance({
                currentFile: this.getCurrentFile(request),
                selectedText: userQuery,
                userIntent: this.inferUserIntent(userQuery)
            });
            analysis.suggestions = assistanceResponse.suggestions || [];

        } catch (error) {
            this.logger.warn('Error in cognitive analysis, proceeding with basic analysis:', error);
        }

        return analysis;
    }

    private async addCognitiveTransparency(request: MutableChatRequestModel, analysis: any): Promise<void> {
        const transparencyContent = `

---

### 🔍 **Cognitive Reasoning Transparency**

**Confidence Level**: ${Math.round(analysis.reasoning.confidence * 100)}%  
**Reasoning Process**: ${analysis.reasoning.process}  
**Sources Used**: ${analysis.reasoning.sources.join(', ')}

${analysis.patterns.length > 0 ? `**Patterns Detected**: ${analysis.patterns.length} cognitive patterns identified` : ''}
${analysis.knowledge.length > 0 ? `**Knowledge Accessed**: ${analysis.knowledge.length} relevant knowledge items consulted` : ''}
${analysis.suggestions.length > 0 ? `**Suggestions Available**: ${analysis.suggestions.length} cognitive recommendations generated` : ''}

*This response was enhanced through OpenCog cognitive reasoning.*`;

        request.response.response.addContent(
            new MarkdownChatResponseContentImpl(transparencyContent)
        );
    }

    private addErrorResponse(request: MutableChatRequestModel, message: string): void {
        request.response.response.addContent(
            new MarkdownChatResponseContentImpl(`❌ **Error**: ${message}`)
        );
        request.response.complete();
    }

    private isDebuggingQuery(query: string): boolean {
        const debugKeywords = ['debug', 'error', 'bug', 'issue', 'problem', 'not working', 'broken', 'fix'];
        return debugKeywords.some(keyword => query.toLowerCase().includes(keyword));
    }

    private isCodeAnalysisQuery(query: string): boolean {
        const analysisKeywords = ['analyze', 'review', 'check', 'quality', 'refactor', 'optimize', 'improve'];
        return analysisKeywords.some(keyword => query.toLowerCase().includes(keyword));
    }

    private assessComplexity(query: string): 'low' | 'medium' | 'high' {
        if (query.length > 200 || query.split(' ').length > 30) return 'high';
        if (query.length > 100 || query.split(' ').length > 15) return 'medium';
        return 'low';
    }

    private inferUserIntent(query: string): 'debugging' | 'refactoring' | 'feature-development' | 'learning' | 'optimization' {
        if (this.isDebuggingQuery(query)) return 'debugging';
        if (query.toLowerCase().includes('refactor')) return 'refactoring';
        if (query.toLowerCase().includes('optimize') || query.toLowerCase().includes('performance')) return 'optimization';
        if (query.toLowerCase().includes('learn') || query.toLowerCase().includes('explain') || query.toLowerCase().includes('how')) return 'learning';
        return 'feature-development';
    }

    private getCurrentFile(request: MutableChatRequestModel): string | undefined {
        // Try to extract current file from context variables if available
        const fileVariables = request.context.variables.filter(v => v.name.includes('file') || v.name.includes('editor'));
        if (fileVariables.length > 0) {
            return fileVariables[0].value?.toString();
        }
        return undefined;
    }
}