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
import { AgentService } from '@theia/ai-core/lib/common/agent-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { OpenCogService, KnowledgeManagementService } from '../common';
import { Atom, ReasoningQuery, PatternInput, PatternResult } from '../common/opencog-types';
import { KnowledgeGraph, KnowledgeDiscoveryQuery } from '../common/knowledge-management-types';

/**
 * OpenCog-powered code analysis agent that extends Theia's AI agent system
 * Enhanced with knowledge management capabilities
 */
@injectable()
export class CodeAnalysisAgent extends Agent {

    private codeKnowledgeGraph: KnowledgeGraph | undefined;

    constructor(
        @inject(OpenCogService) private readonly openCogService: OpenCogService,
        @inject(KnowledgeManagementService) private readonly knowledgeService: KnowledgeManagementService,
        @inject(WorkspaceService) private readonly workspaceService: WorkspaceService
    ) {
        super('opencog-code-analysis', 'OpenCog Code Analysis Agent', 'Cognitive code analysis using OpenCog reasoning and knowledge management');
        this.initializeCodeKnowledge();
    }

    private async initializeCodeKnowledge(): Promise<void> {
        try {
            // Create or get existing code knowledge graph
            const existingGraphs = await this.knowledgeService.getKnowledgeGraphs('software-engineering');
            this.codeKnowledgeGraph = existingGraphs.find(g => g.name === 'Code Analysis Knowledge') ||
                await this.knowledgeService.createKnowledgeGraph(
                    'Code Analysis Knowledge',
                    'software-engineering',
                    'Knowledge graph for code analysis and software engineering concepts'
                );

            // Initialize with basic software engineering concepts if empty
            if (this.codeKnowledgeGraph.atoms.length === 0) {
                await this.seedCodeKnowledge();
            }
        } catch (error) {
            console.error('Failed to initialize code knowledge:', error);
        }
    }

    private async seedCodeKnowledge(): Promise<void> {
        if (!this.codeKnowledgeGraph) return;

        const baseAtoms: Atom[] = [
            { type: 'ConceptNode', name: 'function', truthValue: { strength: 1.0, confidence: 1.0 } },
            { type: 'ConceptNode', name: 'class', truthValue: { strength: 1.0, confidence: 1.0 } },
            { type: 'ConceptNode', name: 'variable', truthValue: { strength: 1.0, confidence: 1.0 } },
            { type: 'ConceptNode', name: 'method', truthValue: { strength: 1.0, confidence: 1.0 } },
            { type: 'ConceptNode', name: 'interface', truthValue: { strength: 1.0, confidence: 1.0 } },
            { type: 'ConceptNode', name: 'module', truthValue: { strength: 1.0, confidence: 1.0 } },
            { type: 'ConceptNode', name: 'import', truthValue: { strength: 1.0, confidence: 1.0 } },
            { type: 'ConceptNode', name: 'export', truthValue: { strength: 1.0, confidence: 1.0 } }
        ];

        for (const atom of baseAtoms) {
            await this.knowledgeService.addAtomToGraph(this.codeKnowledgeGraph.id, atom);
        }

        // Add relationships
        const updatedGraph = await this.knowledgeService.getKnowledgeGraph(this.codeKnowledgeGraph.id);
        if (updatedGraph) {
            const atomMap = new Map(updatedGraph.atoms.map(a => [a.name!, a.id!]));
            
            // class contains method
            await this.knowledgeService.addRelationship(this.codeKnowledgeGraph.id, {
                id: '',
                type: 'contains',
                source: atomMap.get('class')!,
                target: atomMap.get('method')!,
                strength: 0.9,
                confidence: 0.9
            });

            // method contains variable
            await this.knowledgeService.addRelationship(this.codeKnowledgeGraph.id, {
                id: '',
                type: 'contains',
                source: atomMap.get('method')!,
                target: atomMap.get('variable')!,
                strength: 0.8,
                confidence: 0.8
            });
        }
    }

    async analyzeCode(fileUri: string): Promise<any> {
        try {
            // Read the file content
            const fileContent = await this.readFile(fileUri);
            
            // Use enhanced pattern recognition to analyze the code
            const patternInput: PatternInput = {
                data: fileContent,
                context: {
                    fileUri,
                    language: this.detectLanguage(fileUri),
                    timestamp: Date.now()
                },
                scope: 'project',
                options: {
                    maxResults: 20,
                    minConfidence: 0.3,
                    patternTypes: ['code', 'design-pattern', 'async-pattern', 'reactive-pattern']
                }
            };
            
            // Recognize patterns in the code
            const patterns = await this.openCogService.recognizePatterns(patternInput);
            
            // Extract code atoms based on discovered patterns
            const codeAtoms = await this.extractCodeAtomsFromPatterns(patterns, fileContent, fileUri);
            
            // Add atoms to both AtomSpace and Knowledge Graph
            for (const atom of codeAtoms) {
                await this.openCogService.addAtom(atom);
                if (this.codeKnowledgeGraph) {
                    await this.knowledgeService.addAtomToGraph(this.codeKnowledgeGraph.id, atom);
                }
            }
            
            // Perform reasoning on the code with pattern context
            const reasoningQuery: ReasoningQuery = {
                type: 'code-analysis',
                atoms: codeAtoms,
                context: {
                    fileUri,
                    language: this.detectLanguage(fileUri),
                    patterns: patterns,
                    timestamp: Date.now()
                }
            };
            
            const result = await this.openCogService.reason(reasoningQuery);
            
            // Discover related knowledge
            const discoveredKnowledge = await this.discoverRelatedKnowledge(codeAtoms);
            
            // Generate knowledge-enhanced recommendations
            const recommendations = await this.generateEnhancedRecommendations(result, discoveredKnowledge);
            
            return {
                fileUri,
                analysis: result,
                patterns: patterns,
                recommendations: this.generatePatternBasedRecommendations(patterns, result),
                qualityMetrics: this.calculateCodeQualityMetrics(patterns),
                relatedKnowledge: discoveredKnowledge,
                knowledgeMetrics: await this.getCodeKnowledgeMetrics(),
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error('Error in code analysis:', error);
            throw error;
        }
    }

    private async discoverRelatedKnowledge(codeAtoms: Atom[]): Promise<any[]> {
        if (!this.codeKnowledgeGraph || codeAtoms.length === 0) {
            return [];
        }

        const discoveries = [];
        
        for (const atom of codeAtoms.slice(0, 3)) { // Limit to first 3 for performance
            if (atom.name) {
                const discoveryQuery: KnowledgeDiscoveryQuery = {
                    type: 'semantic',
                    seedConcepts: [atom.name],
                    scope: 'domain-specific',
                    maxResults: 5,
                    parameters: { domain: 'software-engineering' }
                };

                const relatedConcepts = await this.knowledgeService.discoverKnowledge(discoveryQuery);
                if (relatedConcepts.length > 0) {
                    discoveries.push({
                        sourceAtom: atom,
                        relatedConcepts: relatedConcepts.map(rc => ({
                            concept: rc.concept.name,
                            relevance: rc.relevanceScore,
                            explanation: rc.explanation
                        }))
                    });
                }
            }
        }

        return discoveries;
    }

    private async generateEnhancedRecommendations(result: any, discoveredKnowledge: any[]): Promise<string[]> {
        const recommendations: string[] = [];
        
        // Basic recommendations
        if (result.confidence < 0.5) {
            recommendations.push('Code structure could be improved for better cognitive analysis');
        }
        
        if (result.metadata?.analysisType === 'structural') {
            recommendations.push('Consider adding more semantic information to improve analysis quality');
        }

        // Knowledge-based recommendations
        if (discoveredKnowledge.length > 0) {
            recommendations.push(`Found ${discoveredKnowledge.length} related knowledge patterns that could enhance your code`);
            
            for (const discovery of discoveredKnowledge.slice(0, 2)) { // Limit to top 2
                if (discovery.relatedConcepts.length > 0) {
                    const bestConcept = discovery.relatedConcepts[0];
                    recommendations.push(`Consider applying "${bestConcept.concept}" pattern (relevance: ${(bestConcept.relevance * 100).toFixed(0)}%)`);
                }
            }
        }

        // Graph-specific recommendations
        if (this.codeKnowledgeGraph) {
            const improvements = await this.knowledgeService.recommendImprovements(this.codeKnowledgeGraph.id);
            recommendations.push(...improvements.slice(0, 2)); // Add top 2 improvements
        }

        return recommendations;
    }

    private async getCodeKnowledgeMetrics(): Promise<any> {
        if (!this.codeKnowledgeGraph) {
            return {};
        }

        const stats = await this.knowledgeService.getGraphUsageStats(this.codeKnowledgeGraph.id);
        const validation = await this.knowledgeService.validateKnowledgeGraph(this.codeKnowledgeGraph.id);
        
        return {
            atomCount: stats.atomCount,
            relationshipCount: stats.relationshipCount,
            quality: stats.quality,
            validationScore: validation.confidence,
            lastUpdated: stats.lastModified
        };
    }

    async searchCodeKnowledge(query: string): Promise<Atom[]> {
        return this.knowledgeService.searchAtoms(query, {
            domains: ['software-engineering'],
            maxResults: 10
        });
    }

    async getCategorizedCodeConcepts(): Promise<Map<string, Atom[]>> {
        // Create categories for code concepts
        const categories = await this.knowledgeService.getCategories();
        let programmingCategory = categories.find(c => c.name === 'Programming Concepts');
        
        if (!programmingCategory) {
            const categoryId = await this.knowledgeService.createCategory({
                id: '',
                name: 'Programming Concepts',
                description: 'Core programming and software engineering concepts',
                subcategories: [],
                associatedGraphs: this.codeKnowledgeGraph ? [this.codeKnowledgeGraph.id] : [],
                rules: [{
                    id: 'prog-rule-1',
                    type: 'pattern',
                    condition: 'function|class|method|variable',
                    action: 'include',
                    weight: 1.0
                }]
            });
            
            const updatedCategories = await this.knowledgeService.getCategories();
            programmingCategory = updatedCategories.find(c => c.id === categoryId);
        }

        const result = new Map<string, Atom[]>();
        
        if (programmingCategory) {
            const atoms = await this.knowledgeService.getAtomsByCategory(programmingCategory.id);
            result.set(programmingCategory.name, atoms);
        }

        return result;
    }

    private async readFile(fileUri: string): Promise<string> {
        // Simplified file reading - in practice would use Theia's file system services
        return `// Example code content for ${fileUri}
function calculateSum(a, b) {
    return a + b;
}

class Calculator {
    add(x, y) {
        return x + y;
    }
    
    multiply(x, y) {
        return x * y;
    }
}

const result = calculateSum(5, 3);`;
    }

    private async extractCodeAtoms(content: string, fileUri: string): Promise<Atom[]> {
        // Enhanced code atom extraction with more patterns
        const atoms: Atom[] = [];
        
        // Create a file atom
        atoms.push({
            type: 'FileNode',
            name: fileUri,
            truthValue: { strength: 1.0, confidence: 1.0 },
            outgoing: []
        });
        
        // Extract functions
        const functionMatches = content.match(/function\s+(\w+)/g) || [];
        for (const match of functionMatches) {
            const functionName = match.replace('function ', '');
            atoms.push({
                type: 'FunctionNode',
                name: functionName,
                truthValue: { strength: 0.9, confidence: 0.8 },
                outgoing: []
            });
        }
        
        // Extract classes
        const classMatches = content.match(/class\s+(\w+)/g) || [];
        for (const match of classMatches) {
            const className = match.replace('class ', '');
            atoms.push({
                type: 'ClassNode',
                name: className,
                truthValue: { strength: 0.95, confidence: 0.9 },
                outgoing: []
            });
        }
        
        // Extract variables (simplified)
        const varMatches = content.match(/const\s+(\w+)|let\s+(\w+)|var\s+(\w+)/g) || [];
        for (const match of varMatches) {
            const varName = match.replace(/const\s+|let\s+|var\s+/, '');
            atoms.push({
                type: 'VariableNode',
                name: varName,
                truthValue: { strength: 0.7, confidence: 0.6 },
                outgoing: []
            });
        }
        
        return atoms;
    }

    private generatePatternBasedRecommendations(patterns: PatternResult[], result: any): string[] {
        const recommendations: string[] = [];
        
        // Analyze pattern distribution
        const patternTypes = new Map<string, number>();
        patterns.forEach(pattern => {
            const type = pattern.pattern.type || 'unknown';
            patternTypes.set(type, (patternTypes.get(type) || 0) + 1);
        });
        
        // Design pattern recommendations
        const designPatterns = patterns.filter(p => p.pattern.type === 'design-pattern');
        if (designPatterns.length === 0) {
            recommendations.push('Consider implementing design patterns to improve code structure and maintainability');
        } else if (designPatterns.length > 10) {
            recommendations.push('High number of design patterns detected - ensure they are not over-engineered');
        }
        
        // Async pattern recommendations
        const asyncPatterns = patterns.filter(p => p.pattern.type === 'async-pattern');
        const promiseChains = asyncPatterns.filter(p => p.pattern.name === 'promise-chain');
        const asyncAwait = asyncPatterns.filter(p => p.pattern.name === 'async-await');
        
        if (promiseChains.length > asyncAwait.length) {
            recommendations.push('Consider migrating from Promise chains to async/await for better readability');
        }
        
        // Code complexity recommendations
        const complexPatterns = patterns.filter(p => p.metadata?.complexity === 'complex');
        if (complexPatterns.length > patterns.length * 0.3) {
            recommendations.push('High code complexity detected - consider refactoring for better maintainability');
        }
        
        // Function vs arrow function balance
        const functionDeclarations = patterns.filter(p => p.pattern.name === 'function-declaration');
        const arrowFunctions = patterns.filter(p => p.pattern.name === 'arrow-function');
        
        if (functionDeclarations.length === 0 && arrowFunctions.length > 0) {
            recommendations.push('Consider using function declarations for better hoisting and debugging');
        }
        
        return recommendations;
    }

    private calculateCodeQualityMetrics(patterns: PatternResult[]): any {
        const totalPatterns = patterns.length;
        if (totalPatterns === 0) {
            return {
                score: 0,
                patternDiversity: 0,
                averageConfidence: 0,
                designPatternUsage: 0
            };
        }
        
        const averageConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / totalPatterns;
        
        const uniquePatternTypes = new Set(patterns.map(p => p.pattern.type || p.pattern.name));
        const patternDiversity = uniquePatternTypes.size / totalPatterns;
        
        const designPatterns = patterns.filter(p => p.pattern.type === 'design-pattern');
        const designPatternUsage = designPatterns.length / totalPatterns;
        
        // Calculate overall score
        const score = (averageConfidence * 0.4) + (patternDiversity * 0.3) + (designPatternUsage * 0.3);
        
        return {
            score: Math.round(score * 100) / 100,
            patternDiversity: Math.round(patternDiversity * 100) / 100,
            averageConfidence: Math.round(averageConfidence * 100) / 100,
            designPatternUsage: Math.round(designPatternUsage * 100) / 100,
            totalPatterns,
            uniquePatternTypes: uniquePatternTypes.size
        };
    }

    private async extractCodeAtomsFromPatterns(patterns: PatternResult[], content: string, fileUri: string): Promise<Atom[]> {
        const atoms: Atom[] = [];
        
        // Create a file atom
        atoms.push({
            type: 'FileNode',
            name: fileUri,
            truthValue: { strength: 1.0, confidence: 1.0 },
            outgoing: [],
            metadata: { fileSize: content.length, language: this.detectLanguage(fileUri) }
        });
        
        // Process each discovered pattern to create cognitive atoms
        for (const patternResult of patterns) {
            const pattern = patternResult.pattern;
            const confidence = patternResult.confidence;
            
            // Create atoms based on pattern types
            switch (pattern.type) {
                case 'code':
                    atoms.push(...await this.createCodePatternAtoms(pattern, confidence, fileUri));
                    break;
                case 'design-pattern':
                    atoms.push(...await this.createDesignPatternAtoms(pattern, confidence, fileUri));
                    break;
                case 'async-pattern':
                    atoms.push(...await this.createAsyncPatternAtoms(pattern, confidence, fileUri));
                    break;
                case 'reactive-pattern':
                    atoms.push(...await this.createReactivePatternAtoms(pattern, confidence, fileUri));
                    break;
                default:
                    // Generic pattern atom
                    atoms.push({
                        type: 'PatternNode',
                        name: `${pattern.name}_${fileUri}`,
                        truthValue: { strength: confidence, confidence: confidence },
                        outgoing: [],
                        metadata: { 
                            patternType: pattern.type,
                            patternName: pattern.name,
                            sourceFile: fileUri 
                        }
                    });
            }
        }
        
        // Fallback to basic extraction if no patterns found
        if (patterns.length === 0) {
            atoms.push(...await this.extractCodeAtoms(content, fileUri));
        }
        
        return atoms;
    }
    
    private async createCodePatternAtoms(pattern: any, confidence: number, fileUri: string): Promise<Atom[]> {
        const atoms: Atom[] = [];
        
        // Function patterns
        if (pattern.name === 'function-declaration' || pattern.name === 'arrow-function') {
            atoms.push({
                type: 'FunctionNode',
                name: pattern.metadata?.functionName || `function_${Date.now()}`,
                truthValue: { strength: 0.9, confidence },
                outgoing: [],
                metadata: {
                    functionType: pattern.name,
                    parameters: pattern.metadata?.parameters || [],
                    returnType: pattern.metadata?.returnType,
                    sourceFile: fileUri,
                    complexity: pattern.metadata?.complexity
                }
            });
        }
        
        // Class patterns
        if (pattern.name === 'class-declaration') {
            atoms.push({
                type: 'ClassNode',
                name: pattern.metadata?.className || `class_${Date.now()}`,
                truthValue: { strength: 0.95, confidence },
                outgoing: [],
                metadata: {
                    extends: pattern.metadata?.extends,
                    implements: pattern.metadata?.implements,
                    methods: pattern.metadata?.methods || [],
                    properties: pattern.metadata?.properties || [],
                    sourceFile: fileUri
                }
            });
        }
        
        // Variable/constant patterns
        if (pattern.name === 'variable-declaration') {
            atoms.push({
                type: 'VariableNode',
                name: pattern.metadata?.variableName || `variable_${Date.now()}`,
                truthValue: { strength: 0.7, confidence },
                outgoing: [],
                metadata: {
                    declarationType: pattern.metadata?.declarationType,
                    dataType: pattern.metadata?.dataType,
                    isConstant: pattern.metadata?.isConstant,
                    sourceFile: fileUri
                }
            });
        }
        
        return atoms;
    }
    
    private async createDesignPatternAtoms(pattern: any, confidence: number, fileUri: string): Promise<Atom[]> {
        const atoms: Atom[] = [];
        
        atoms.push({
            type: 'DesignPatternNode',
            name: `${pattern.name}_${fileUri}`,
            truthValue: { strength: 0.8, confidence },
            outgoing: [],
            metadata: {
                patternName: pattern.name,
                category: pattern.metadata?.category || 'unknown',
                participants: pattern.metadata?.participants || [],
                intent: pattern.metadata?.intent,
                sourceFile: fileUri,
                location: pattern.metadata?.location
            }
        });
        
        // Create relationship atoms for pattern participants
        if (pattern.metadata?.participants) {
            for (const participant of pattern.metadata.participants) {
                atoms.push({
                    type: 'ParticipantNode',
                    name: `${participant}_${fileUri}`,
                    truthValue: { strength: 0.7, confidence },
                    outgoing: [],
                    metadata: {
                        role: participant,
                        designPattern: pattern.name,
                        sourceFile: fileUri
                    }
                });
            }
        }
        
        return atoms;
    }
    
    private async createAsyncPatternAtoms(pattern: any, confidence: number, fileUri: string): Promise<Atom[]> {
        const atoms: Atom[] = [];
        
        atoms.push({
            type: 'AsyncPatternNode',
            name: `${pattern.name}_${fileUri}`,
            truthValue: { strength: 0.85, confidence },
            outgoing: [],
            metadata: {
                asyncType: pattern.name,
                errorHandling: pattern.metadata?.errorHandling || false,
                chainLength: pattern.metadata?.chainLength || 1,
                complexity: pattern.metadata?.complexity || 'simple',
                sourceFile: fileUri
            }
        });
        
        // Create specific atoms for promise chains vs async/await
        if (pattern.name === 'promise-chain') {
            atoms.push({
                type: 'PromiseChainNode',
                name: `promise_chain_${Date.now()}`,
                truthValue: { strength: 0.8, confidence },
                outgoing: [],
                metadata: {
                    chainLength: pattern.metadata?.chainLength || 1,
                    hasCatch: pattern.metadata?.hasCatch || false,
                    hasFinally: pattern.metadata?.hasFinally || false,
                    sourceFile: fileUri
                }
            });
        } else if (pattern.name === 'async-await') {
            atoms.push({
                type: 'AsyncAwaitNode',
                name: `async_await_${Date.now()}`,
                truthValue: { strength: 0.9, confidence },
                outgoing: [],
                metadata: {
                    hasErrorHandling: pattern.metadata?.hasErrorHandling || false,
                    awaitCount: pattern.metadata?.awaitCount || 1,
                    sourceFile: fileUri
                }
            });
        }
        
        return atoms;
    }
    
    private async createReactivePatternAtoms(pattern: any, confidence: number, fileUri: string): Promise<Atom[]> {
        const atoms: Atom[] = [];
        
        atoms.push({
            type: 'ReactivePatternNode',
            name: `${pattern.name}_${fileUri}`,
            truthValue: { strength: 0.8, confidence },
            outgoing: [],
            metadata: {
                reactiveType: pattern.name,
                streamOperators: pattern.metadata?.streamOperators || [],
                backpressureHandling: pattern.metadata?.backpressureHandling || false,
                sourceFile: fileUri
            }
        });
        
        // Create observer pattern atoms if detected
        if (pattern.name === 'observer-pattern') {
            atoms.push({
                type: 'ObserverNode',
                name: `observer_${Date.now()}`,
                truthValue: { strength: 0.85, confidence },
                outgoing: [],
                metadata: {
                    subjectCount: pattern.metadata?.subjectCount || 1,
                    observerCount: pattern.metadata?.observerCount || 1,
                    notificationTypes: pattern.metadata?.notificationTypes || [],
                    sourceFile: fileUri
                }
            });
        }
        
        return atoms;
    }

    private detectLanguage(fileUri: string): string {
        const extension = fileUri.split('.').pop()?.toLowerCase();
        const languageMap: Record<string, string> = {
            'ts': 'typescript',
            'js': 'javascript',
            'py': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c'
        };
        return languageMap[extension || ''] || 'unknown';
    }
}