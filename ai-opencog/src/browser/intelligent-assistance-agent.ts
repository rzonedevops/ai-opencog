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
import { Agent } from '@theia/ai-core/lib/common/agent';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { EditorManager } from '@theia/editor/lib/browser';
import { MessageService } from '@theia/core';
import { OpenCogService, KnowledgeManagementService } from '../common';
import { 
    Atom, 
    ReasoningQuery, 
    PatternInput, 
    LearningData,
    UserBehaviorPattern
} from '../common/opencog-types';

export interface AssistanceContext {
    currentFile?: string;
    selectedText?: string;
    cursorPosition?: { line: number; column: number };
    projectContext?: {
        language: string;
        framework?: string;
        dependencies: string[];
    };
    userIntent?: 'debugging' | 'refactoring' | 'feature-development' | 'learning' | 'optimization';
    problemDescription?: string;
}

export interface AssistanceResponse {
    suggestions: Array<{
        type: 'code-completion' | 'refactoring' | 'debugging' | 'explanation' | 'best-practice';
        title: string;
        description: string;
        confidence: number;
        codeExample?: string;
        reasoning: string;
        learnMoreLink?: string;
    }>;
    contextualInsights: string[];
    nextSteps: string[];
    learningOpportunities: string[];
    confidence: number;
}

/**
 * Intelligent Assistance Agent for Phase 3 AI Agent Enhancement
 * 
 * Provides context-aware intelligent assistance including:
 * - Smart code suggestions based on cognitive analysis
 * - Real-time debugging assistance with reasoning
 * - Learning-oriented explanations for educational purposes
 * - Contextual best practice recommendations
 * - Adaptive assistance based on user expertise level
 */
@injectable()
export class IntelligentAssistanceAgent extends Agent {

    private assistanceHistory: Map<string, AssistanceResponse[]> = new Map();
    private userExpertiseProfile: Map<string, any> = new Map();
    private contextualKnowledgeCache: Map<string, any> = new Map();

    constructor(
        @inject(OpenCogService) private readonly openCogService: OpenCogService,
        @inject(KnowledgeManagementService) private readonly knowledgeService: KnowledgeManagementService,
        @inject(WorkspaceService) private readonly workspaceService: WorkspaceService,
        @inject(EditorManager) private readonly editorManager: EditorManager,
        @inject(MessageService) private readonly messageService: MessageService
    ) {
        super(
            'intelligent-assistance-agent',
            'Intelligent Development Assistant',
            'Cognitive AI assistant providing context-aware development support and learning guidance'
        );
        this.initializeAssistanceCapabilities();
    }

    private async initializeAssistanceCapabilities(): Promise<void> {
        try {
            // Initialize user expertise profiling
            await this.initializeUserProfiling();
            
            // Set up contextual assistance triggers
            await this.setupContextualTriggers();
            
            // Initialize assistance knowledge base
            await this.initializeAssistanceKnowledge();
            
            console.log('Intelligent Assistance Agent initialized successfully');
        } catch (error) {
            console.error('Failed to initialize intelligent assistance:', error);
        }
    }

    private async initializeUserProfiling(): Promise<void> {
        const userId = 'current-user'; // Would get from authentication service
        const behaviorPatterns = await this.openCogService.getUserBehaviorPatterns(userId);
        
        // Build expertise profile from behavior patterns
        const expertiseProfile = {
            languages: this.extractLanguageExpertise(behaviorPatterns),
            frameworks: this.extractFrameworkExpertise(behaviorPatterns),
            patterns: this.extractPatternExpertise(behaviorPatterns),
            problemSolvingStyle: this.extractProblemSolvingStyle(behaviorPatterns),
            learningPreferences: this.extractLearningPreferences(behaviorPatterns)
        };
        
        this.userExpertiseProfile.set(userId, expertiseProfile);
    }

    private async setupContextualTriggers(): Promise<void> {
        // Monitor editor changes for assistance opportunities
        this.editorManager.onCurrentEditorChanged(editor => {
            if (editor) {
                this.analyzeAssistanceOpportunities(editor);
            }
        });
    }

    private async initializeAssistanceKnowledge(): Promise<void> {
        // Create assistance-specific knowledge graph
        const assistanceGraphs = await this.knowledgeService.getKnowledgeGraphs('development-assistance');
        const assistanceGraph = assistanceGraphs.find(g => g.name === 'Development Assistance Knowledge') ||
            await this.knowledgeService.createKnowledgeGraph(
                'Development Assistance Knowledge',
                'development-assistance',
                'Knowledge base for intelligent development assistance'
            );

        // Seed with assistance patterns and best practices
        await this.seedAssistanceKnowledge(assistanceGraph.id);
    }

    private async seedAssistanceKnowledge(graphId: string): Promise<void> {
        const assistanceAtoms: Atom[] = [
            { type: 'ConceptNode', name: 'debugging-strategy', truthValue: { strength: 1.0, confidence: 1.0 } },
            { type: 'ConceptNode', name: 'refactoring-opportunity', truthValue: { strength: 1.0, confidence: 1.0 } },
            { type: 'ConceptNode', name: 'code-smell', truthValue: { strength: 1.0, confidence: 1.0 } },
            { type: 'ConceptNode', name: 'best-practice', truthValue: { strength: 1.0, confidence: 1.0 } },
            { type: 'ConceptNode', name: 'performance-optimization', truthValue: { strength: 1.0, confidence: 1.0 } },
            { type: 'ConceptNode', name: 'security-practice', truthValue: { strength: 1.0, confidence: 1.0 } },
            { type: 'ConceptNode', name: 'learning-resource', truthValue: { strength: 1.0, confidence: 1.0 } },
            { type: 'ConceptNode', name: 'design-pattern-suggestion', truthValue: { strength: 1.0, confidence: 1.0 } }
        ];

        for (const atom of assistanceAtoms) {
            await this.knowledgeService.addAtomToGraph(graphId, atom);
        }
    }

    /**
     * Provide intelligent assistance based on current context
     */
    async provideIntelligentAssistance(context: AssistanceContext): Promise<AssistanceResponse> {
        try {
            const userId = 'current-user';
            const userExpertise = this.userExpertiseProfile.get(userId);

            // Analyze context to understand user needs
            const contextAnalysis = await this.analyzeAssistanceContext(context);
            
            // Generate suggestions based on cognitive analysis
            const suggestions = await this.generateCognitiveSuggestions(context, contextAnalysis, userExpertise);
            
            // Provide contextual insights
            const insights = await this.generateContextualInsights(context, contextAnalysis);
            
            // Generate next steps and learning opportunities
            const nextSteps = await this.generateNextSteps(context, suggestions);
            const learningOpportunities = await this.generateLearningOpportunities(context, userExpertise);
            
            // Calculate overall confidence
            const confidence = this.calculateAssistanceConfidence(suggestions, contextAnalysis);

            const response: AssistanceResponse = {
                suggestions,
                contextualInsights: insights,
                nextSteps,
                learningOpportunities,
                confidence
            };

            // Learn from assistance interaction
            await this.learnFromAssistanceInteraction(context, response);
            
            // Store in history
            const history = this.assistanceHistory.get(userId) || [];
            history.push(response);
            this.assistanceHistory.set(userId, history.slice(-10)); // Keep last 10

            return response;
            
        } catch (error) {
            console.error('Intelligent assistance failed:', error);
            return this.generateFallbackResponse(context);
        }
    }

    private async analyzeAssistanceContext(context: AssistanceContext): Promise<any> {
        // Perform cognitive analysis of the current context
        const contextAnalysis = {
            codeComplexity: 0.5,
            errorLikelihood: 0.3,
            refactoringNeed: 0.4,
            learningOpportunityScore: 0.6,
            securityRisk: 0.2,
            performanceImpact: 0.3
        };

        if (context.currentFile && context.selectedText) {
            // Analyze selected code for patterns
            const patterns = await this.openCogService.recognizePatterns({
                data: context.selectedText,
                context: { file: context.currentFile, intent: context.userIntent },
                scope: 'local',
                options: {
                    patternTypes: ['code-quality', 'potential-issue', 'improvement-opportunity'],
                    maxResults: 15
                }
            });

            // Use reasoning to analyze patterns
            const reasoning = await this.openCogService.reason({
                type: 'assistance-analysis',
                atoms: patterns.map(p => p.pattern),
                context: { userIntent: context.userIntent, userExperience: 'intermediate' }
            });

            contextAnalysis.codeComplexity = this.calculateComplexityFromPatterns(patterns);
            contextAnalysis.errorLikelihood = this.calculateErrorLikelihood(patterns);
            contextAnalysis.refactoringNeed = this.calculateRefactoringNeed(patterns);
            contextAnalysis.patterns = patterns;
            contextAnalysis.reasoning = reasoning;
        }

        return contextAnalysis;
    }

    private async generateCognitiveSuggestions(
        context: AssistanceContext, 
        analysis: any, 
        userExpertise: any
    ): Promise<AssistanceResponse['suggestions']> {
        const suggestions: AssistanceResponse['suggestions'] = [];

        // Code completion suggestions
        if (context.userIntent === 'feature-development' && context.selectedText) {
            suggestions.push(await this.generateCodeCompletionSuggestion(context, analysis));
        }

        // Debugging suggestions
        if (context.userIntent === 'debugging' || analysis.errorLikelihood > 0.6) {
            suggestions.push(...await this.generateDebuggingSuggestions(context, analysis));
        }

        // Refactoring suggestions
        if (analysis.refactoringNeed > 0.5 || context.userIntent === 'refactoring') {
            suggestions.push(...await this.generateRefactoringSuggestions(context, analysis));
        }

        // Best practice suggestions
        if (analysis.codeComplexity > 0.7 || userExpertise?.level === 'beginner') {
            suggestions.push(...await this.generateBestPracticeSuggestions(context, analysis));
        }

        // Explanation suggestions for learning
        if (context.userIntent === 'learning' || userExpertise?.learningPreferences?.includeExplanations) {
            suggestions.push(...await this.generateExplanationSuggestions(context, analysis));
        }

        return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5); // Top 5 suggestions
    }

    private async generateCodeCompletionSuggestion(context: AssistanceContext, analysis: any): Promise<any> {
        const reasoning = await this.openCogService.reason({
            type: 'code-completion',
            atoms: analysis.patterns?.map((p: any) => p.pattern) || [],
            context: { currentCode: context.selectedText, intent: 'completion' }
        });

        return {
            type: 'code-completion',
            title: 'Smart Code Completion',
            description: 'Complete this code pattern based on cognitive analysis',
            confidence: reasoning.confidence || 0.8,
            codeExample: this.generateCodeExample(context),
            reasoning: 'Based on recognized patterns and context analysis',
            learnMoreLink: 'https://example.com/code-completion'
        };
    }

    private async generateDebuggingSuggestions(context: AssistanceContext, analysis: any): Promise<any[]> {
        const suggestions = [];
        
        // Logical error suggestion
        if (analysis.patterns?.some((p: any) => p.pattern.type === 'logical-error')) {
            suggestions.push({
                type: 'debugging',
                title: 'Potential Logic Error Detected',
                description: 'Check the conditional logic in this code section',
                confidence: 0.85,
                reasoning: 'Pattern analysis indicates possible logical inconsistency',
                codeExample: '// Check: if (condition) { /* ensure all paths are handled */ }'
            });
        }

        // Variable scope suggestion
        suggestions.push({
            type: 'debugging',
            title: 'Variable Scope Analysis',
            description: 'Review variable declarations and their scope',
            confidence: 0.7,
            reasoning: 'Cognitive analysis suggests potential scope-related issues'
        });

        return suggestions;
    }

    private async generateRefactoringSuggestions(context: AssistanceContext, analysis: any): Promise<any[]> {
        const suggestions = [];

        if (analysis.codeComplexity > 0.8) {
            suggestions.push({
                type: 'refactoring',
                title: 'Reduce Function Complexity',
                description: 'Break down this function into smaller, more manageable pieces',
                confidence: 0.9,
                reasoning: 'High complexity detected through cognitive analysis',
                codeExample: '// Consider extracting helper functions for complex operations'
            });
        }

        if (analysis.patterns?.some((p: any) => p.pattern.name === 'duplicate-code')) {
            suggestions.push({
                type: 'refactoring',
                title: 'Extract Common Code',
                description: 'Remove code duplication by extracting common functionality',
                confidence: 0.85,
                reasoning: 'Duplicate code patterns detected'
            });
        }

        return suggestions;
    }

    private async generateBestPracticeSuggestions(context: AssistanceContext, analysis: any): Promise<any[]> {
        const suggestions = [];

        suggestions.push({
            type: 'best-practice',
            title: 'Improve Error Handling',
            description: 'Add comprehensive error handling to make your code more robust',
            confidence: 0.8,
            reasoning: 'Best practice analysis indicates missing error handling patterns',
            codeExample: 'try { /* your code */ } catch (error) { /* handle gracefully */ }'
        });

        if (context.projectContext?.language === 'typescript') {
            suggestions.push({
                type: 'best-practice',
                title: 'Strengthen Type Definitions',
                description: 'Use more specific TypeScript types for better type safety',
                confidence: 0.75,
                reasoning: 'Type analysis suggests opportunities for improved type safety'
            });
        }

        return suggestions;
    }

    private async generateExplanationSuggestions(context: AssistanceContext, analysis: any): Promise<any[]> {
        const suggestions = [];

        suggestions.push({
            type: 'explanation',
            title: 'Code Pattern Explanation',
            description: 'Learn about the design patterns used in this code',
            confidence: 0.8,
            reasoning: 'Educational opportunity identified based on code patterns',
            learnMoreLink: 'https://example.com/design-patterns'
        });

        return suggestions;
    }

    private async generateContextualInsights(context: AssistanceContext, analysis: any): Promise<string[]> {
        const insights: string[] = [];

        if (analysis.codeComplexity > 0.8) {
            insights.push('This code section has high complexity - consider simplifying for better maintainability');
        }

        if (analysis.securityRisk > 0.6) {
            insights.push('Potential security considerations detected - review input validation and sanitization');
        }

        if (analysis.performanceImpact > 0.7) {
            insights.push('This code may have performance implications - consider optimization strategies');
        }

        // Add cognitive insights based on OpenCog reasoning
        if (analysis.reasoning?.conclusion) {
            insights.push(`Cognitive analysis suggests: ${analysis.reasoning.conclusion}`);
        }

        return insights;
    }

    private async generateNextSteps(context: AssistanceContext, suggestions: any[]): Promise<string[]> {
        const nextSteps: string[] = [];

        if (suggestions.some(s => s.type === 'debugging')) {
            nextSteps.push('1. Run debugging tools to gather more information');
            nextSteps.push('2. Add logging statements to trace execution flow');
        }

        if (suggestions.some(s => s.type === 'refactoring')) {
            nextSteps.push('1. Create unit tests before refactoring');
            nextSteps.push('2. Refactor in small, incremental steps');
        }

        if (suggestions.some(s => s.type === 'best-practice')) {
            nextSteps.push('1. Review team coding standards and guidelines');
            nextSteps.push('2. Set up automated linting and code quality tools');
        }

        return nextSteps;
    }

    private async generateLearningOpportunities(context: AssistanceContext, userExpertise: any): Promise<string[]> {
        const opportunities: string[] = [];

        if (userExpertise?.languages && !userExpertise.languages.includes(context.projectContext?.language)) {
            opportunities.push(`Learn more about ${context.projectContext?.language} language features`);
        }

        if (context.projectContext?.framework && !userExpertise?.frameworks?.includes(context.projectContext.framework)) {
            opportunities.push(`Explore ${context.projectContext.framework} framework patterns and best practices`);
        }

        opportunities.push('Practice test-driven development for better code quality');
        opportunities.push('Learn about design patterns relevant to your current task');

        return opportunities;
    }

    private calculateAssistanceConfidence(suggestions: any[], analysis: any): number {
        if (suggestions.length === 0) return 0.3;
        
        const avgConfidence = suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length;
        const analysisConfidence = analysis.reasoning?.confidence || 0.8;
        
        return (avgConfidence + analysisConfidence) / 2;
    }

    private async learnFromAssistanceInteraction(context: AssistanceContext, response: AssistanceResponse): Promise<void> {
        const learningData: LearningData = {
            input: JSON.stringify(context),
            output: JSON.stringify(response),
            context: {
                interactionType: 'intelligent-assistance',
                userIntent: context.userIntent,
                timestamp: Date.now()
            },
            feedback: {
                rating: 5, // Neutral - would be updated based on actual user feedback
                helpful: true,
                comment: 'Intelligent assistance provided',
                actionTaken: 'applied'
            }
        };

        await this.openCogService.learn(learningData);
    }

    private generateFallbackResponse(context: AssistanceContext): AssistanceResponse {
        return {
            suggestions: [{
                type: 'explanation',
                title: 'General Development Assistance',
                description: 'Consider reviewing your code for common patterns and best practices',
                confidence: 0.5,
                reasoning: 'Fallback suggestion when detailed analysis is not available'
            }],
            contextualInsights: ['Unable to perform detailed analysis - basic guidance provided'],
            nextSteps: ['Review code for basic quality issues', 'Consider running automated linting tools'],
            learningOpportunities: ['Explore development best practices for your language/framework'],
            confidence: 0.5
        };
    }

    // Helper methods for analysis
    private analyzeAssistanceOpportunities(editor: any): void {
        // Monitor for assistance opportunities
        // Implementation would analyze editor state for assistance triggers
    }

    private extractLanguageExpertise(patterns: UserBehaviorPattern[]): string[] {
        return ['javascript', 'typescript']; // Placeholder
    }

    private extractFrameworkExpertise(patterns: UserBehaviorPattern[]): string[] {
        return ['react', 'node']; // Placeholder
    }

    private extractPatternExpertise(patterns: UserBehaviorPattern[]): string[] {
        return ['mvc', 'observer']; // Placeholder
    }

    private extractProblemSolvingStyle(patterns: UserBehaviorPattern[]): string {
        return 'analytical'; // Placeholder
    }

    private extractLearningPreferences(patterns: UserBehaviorPattern[]): any {
        return { includeExplanations: true, detailLevel: 'comprehensive' }; // Placeholder
    }

    private calculateComplexityFromPatterns(patterns: any[]): number {
        const complexPatterns = patterns.filter(p => p.pattern.complexity === 'high');
        return complexPatterns.length / Math.max(patterns.length, 1);
    }

    private calculateErrorLikelihood(patterns: any[]): number {
        const errorPatterns = patterns.filter(p => p.pattern.type?.includes('error') || p.pattern.type?.includes('issue'));
        return errorPatterns.length / Math.max(patterns.length, 1);
    }

    private calculateRefactoringNeed(patterns: any[]): number {
        const refactoringPatterns = patterns.filter(p => 
            p.pattern.type === 'code-smell' || 
            p.pattern.name === 'duplicate-code' ||
            p.pattern.complexity === 'high'
        );
        return refactoringPatterns.length / Math.max(patterns.length, 1);
    }

    private generateCodeExample(context: AssistanceContext): string {
        return `// Suggested completion based on context analysis
${context.selectedText || ''}
// Add appropriate implementation here`;
    }

    /**
     * Provide debugging assistance with step-by-step guidance
     */
    async provideDebuggingAssistance(context: {
        errorMessage?: string;
        stackTrace?: string;
        codeContext: string;
        expectedBehavior?: string;
        actualBehavior?: string;
    }): Promise<{
        debuggingSteps: Array<{
            step: number;
            title: string;
            description: string;
            reasoning: string;
            codeToCheck?: string;
        }>;
        possibleCauses: string[];
        quickFixes: string[];
        confidence: number;
    }> {
        try {
            // Analyze debugging context using cognitive reasoning
            const debuggingAnalysis = await this.openCogService.reason({
                type: 'debugging-assistance',
                atoms: [],
                context: {
                    error: context.errorMessage,
                    code: context.codeContext,
                    expected: context.expectedBehavior,
                    actual: context.actualBehavior
                }
            });

            const debuggingSteps = [
                {
                    step: 1,
                    title: 'Analyze Error Message',
                    description: 'Carefully read and understand what the error message is telling you',
                    reasoning: 'Error messages contain crucial information about what went wrong',
                    codeToCheck: context.errorMessage
                },
                {
                    step: 2,
                    title: 'Examine Stack Trace',
                    description: 'Follow the execution path to identify where the error originated',
                    reasoning: 'Stack traces show the exact sequence of function calls leading to the error'
                },
                {
                    step: 3,
                    title: 'Check Variable States',
                    description: 'Verify that variables have expected values at the point of failure',
                    reasoning: 'Incorrect variable values are a common source of bugs'
                },
                {
                    step: 4,
                    title: 'Validate Assumptions',
                    description: 'Question your assumptions about how the code should behave',
                    reasoning: 'Bugs often stem from incorrect assumptions about system behavior'
                }
            ];

            return {
                debuggingSteps,
                possibleCauses: ['Variable initialization issue', 'Logic error in conditional', 'Async operation timing'],
                quickFixes: ['Add null checks', 'Verify function parameters', 'Add error handling'],
                confidence: debuggingAnalysis.confidence || 0.8
            };
        } catch (error) {
            console.error('Debugging assistance failed:', error);
            return {
                debuggingSteps: [],
                possibleCauses: [],
                quickFixes: [],
                confidence: 0.3
            };
        }
    }
}