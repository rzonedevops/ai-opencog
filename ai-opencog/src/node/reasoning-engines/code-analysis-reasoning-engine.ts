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

import { injectable } from '@theia/core/shared/inversify';
import { Atom, ReasoningQuery, ReasoningResult } from '../../common';

/**
 * Specialized code analysis reasoning engine
 * Performs cognitive analysis of code structure, patterns, and quality
 */
@injectable()
export class CodeAnalysisReasoningEngine {

    /**
     * Perform code analysis reasoning
     */
    async reason(query: ReasoningQuery): Promise<ReasoningResult> {
        const context = query.context || {};
        const codeAtoms = query.atoms || [];

        const analysisResults = await this.performComprehensiveCodeAnalysis(codeAtoms, context);

        return {
            conclusion: analysisResults.insights,
            confidence: analysisResults.confidence,
            explanation: analysisResults.explanation,
            metadata: {
                reasoningType: 'code-analysis',
                analysisType: analysisResults.analysisType,
                qualityMetrics: analysisResults.qualityMetrics,
                suggestions: analysisResults.suggestions,
                patterns: analysisResults.patterns
            }
        };
    }

    /**
     * Perform comprehensive code analysis
     */
    private async performComprehensiveCodeAnalysis(atoms: Atom[], context: any): Promise<any> {
        const results = {
            insights: [] as Atom[],
            confidence: 0,
            explanation: '',
            analysisType: 'comprehensive',
            qualityMetrics: {},
            suggestions: [] as string[],
            patterns: [] as string[]
        };

        // Perform different types of analysis
        const structuralAnalysis = await this.analyzeCodeStructure(atoms, context);
        const qualityAnalysis = await this.analyzeCodeQuality(atoms, context);
        const patternAnalysis = await this.analyzeDesignPatterns(atoms, context);
        const complexityAnalysis = await this.analyzeComplexity(atoms, context);
        const securityAnalysis = await this.analyzeSecurityAspects(atoms, context);
        const performanceAnalysis = await this.analyzePerformance(atoms, context);

        // Combine analysis results
        results.insights.push(...structuralAnalysis.insights);
        results.insights.push(...qualityAnalysis.insights);
        results.insights.push(...patternAnalysis.insights);
        results.insights.push(...complexityAnalysis.insights);
        results.insights.push(...securityAnalysis.insights);
        results.insights.push(...performanceAnalysis.insights);

        results.qualityMetrics = {
            structure: structuralAnalysis.score,
            quality: qualityAnalysis.score,
            patterns: patternAnalysis.score,
            complexity: complexityAnalysis.score,
            security: securityAnalysis.score,
            performance: performanceAnalysis.score
        };

        results.suggestions = [
            ...structuralAnalysis.suggestions,
            ...qualityAnalysis.suggestions,
            ...patternAnalysis.suggestions,
            ...complexityAnalysis.suggestions,
            ...securityAnalysis.suggestions,
            ...performanceAnalysis.suggestions
        ];

        results.patterns = [
            ...structuralAnalysis.patterns,
            ...patternAnalysis.patterns
        ];

        // Calculate overall confidence
        results.confidence = this.calculateOverallConfidence(results.qualityMetrics);
        results.explanation = this.generateAnalysisExplanation(results);

        return results;
    }

    /**
     * Analyze code structure
     */
    private async analyzeCodeStructure(atoms: Atom[], context: any): Promise<any> {
        const insights: Atom[] = [];
        const suggestions: string[] = [];
        const patterns: string[] = [];

        // Analyze function/class structure
        const functions = atoms.filter(atom => atom.type === 'FunctionNode' || atom.name?.includes('function'));
        const classes = atoms.filter(atom => atom.type === 'ClassNode' || atom.name?.includes('class'));
        const modules = atoms.filter(atom => atom.type === 'ModuleNode' || atom.name?.includes('module'));

        // Check for structural issues
        if (functions.length > 20) {
            insights.push(this.createInsightAtom('large-file', 'High function count detected', 0.8));
            suggestions.push('Consider splitting large files into smaller modules');
        }

        if (classes.length > 10) {
            insights.push(this.createInsightAtom('many-classes', 'Multiple classes in single file', 0.7));
            suggestions.push('Consider organizing classes into separate files');
        }

        // Analyze function complexity
        for (const func of functions) {
            const complexity = this.estimateFunctionComplexity(func);
            if (complexity > 10) {
                insights.push(this.createInsightAtom('complex-function', `High complexity function: ${func.name}`, 0.9));
                suggestions.push(`Refactor function ${func.name} to reduce complexity`);
            }
        }

        // Detect architectural patterns
        if (this.detectMVCPattern(atoms)) {
            patterns.push('MVC');
            insights.push(this.createInsightAtom('mvc-pattern', 'MVC architectural pattern detected', 0.8));
        }

        if (this.detectSingletonPattern(atoms)) {
            patterns.push('Singleton');
            insights.push(this.createInsightAtom('singleton-pattern', 'Singleton design pattern detected', 0.7));
        }

        const score = this.calculateStructuralScore(insights, functions, classes);

        return {
            insights,
            suggestions,
            patterns,
            score
        };
    }

    /**
     * Analyze code quality
     */
    private async analyzeCodeQuality(atoms: Atom[], context: any): Promise<any> {
        const insights: Atom[] = [];
        const suggestions: string[] = [];

        // Check naming conventions
        const namingIssues = this.checkNamingConventions(atoms);
        insights.push(...namingIssues.insights);
        suggestions.push(...namingIssues.suggestions);

        // Check documentation
        const docIssues = this.checkDocumentation(atoms);
        insights.push(...docIssues.insights);
        suggestions.push(...docIssues.suggestions);

        // Check code duplication
        const duplicationIssues = this.checkCodeDuplication(atoms);
        insights.push(...duplicationIssues.insights);
        suggestions.push(...duplicationIssues.suggestions);

        // Check error handling
        const errorHandlingIssues = this.checkErrorHandling(atoms);
        insights.push(...errorHandlingIssues.insights);
        suggestions.push(...errorHandlingIssues.suggestions);

        const score = this.calculateQualityScore(insights);

        return {
            insights,
            suggestions,
            score
        };
    }

    /**
     * Analyze design patterns
     */
    private async analyzeDesignPatterns(atoms: Atom[], context: any): Promise<any> {
        const insights: Atom[] = [];
        const patterns: string[] = [];

        // Detect creational patterns
        if (this.detectFactoryPattern(atoms)) {
            patterns.push('Factory');
            insights.push(this.createInsightAtom('factory-pattern', 'Factory pattern implementation found', 0.8));
        }

        if (this.detectBuilderPattern(atoms)) {
            patterns.push('Builder');
            insights.push(this.createInsightAtom('builder-pattern', 'Builder pattern implementation found', 0.8));
        }

        // Detect structural patterns
        if (this.detectAdapterPattern(atoms)) {
            patterns.push('Adapter');
            insights.push(this.createInsightAtom('adapter-pattern', 'Adapter pattern implementation found', 0.8));
        }

        if (this.detectDecoratorPattern(atoms)) {
            patterns.push('Decorator');
            insights.push(this.createInsightAtom('decorator-pattern', 'Decorator pattern implementation found', 0.8));
        }

        // Detect behavioral patterns
        if (this.detectObserverPattern(atoms)) {
            patterns.push('Observer');
            insights.push(this.createInsightAtom('observer-pattern', 'Observer pattern implementation found', 0.8));
        }

        if (this.detectStrategyPattern(atoms)) {
            patterns.push('Strategy');
            insights.push(this.createInsightAtom('strategy-pattern', 'Strategy pattern implementation found', 0.8));
        }

        const score = this.calculatePatternScore(patterns);

        return {
            insights,
            patterns,
            score,
            suggestions: [`Found ${patterns.length} design patterns: ${patterns.join(', ')}`]
        };
    }

    /**
     * Analyze complexity metrics
     */
    private async analyzeComplexity(atoms: Atom[], context: any): Promise<any> {
        const insights: Atom[] = [];
        const suggestions: string[] = [];

        // Cyclomatic complexity
        const cyclomaticComplexity = this.calculateCyclomaticComplexity(atoms);
        if (cyclomaticComplexity > 15) {
            insights.push(this.createInsightAtom('high-cyclomatic', 'High cyclomatic complexity detected', 0.9));
            suggestions.push('Consider breaking down complex functions');
        }

        // Cognitive complexity
        const cognitiveComplexity = this.calculateCognitiveComplexity(atoms);
        if (cognitiveComplexity > 25) {
            insights.push(this.createInsightAtom('high-cognitive', 'High cognitive complexity detected', 0.9));
            suggestions.push('Simplify code logic and reduce nesting');
        }

        // Coupling analysis
        const coupling = this.analyzeCoupling(atoms);
        if (coupling.high.length > 0) {
            insights.push(this.createInsightAtom('high-coupling', 'High coupling detected between modules', 0.8));
            suggestions.push('Reduce dependencies between modules');
        }

        // Cohesion analysis
        const cohesion = this.analyzeCohesion(atoms);
        if (cohesion.low.length > 0) {
            insights.push(this.createInsightAtom('low-cohesion', 'Low cohesion detected in modules', 0.7));
            suggestions.push('Group related functionality together');
        }

        const score = this.calculateComplexityScore(cyclomaticComplexity, cognitiveComplexity);

        return {
            insights,
            suggestions,
            score
        };
    }

    /**
     * Analyze security aspects
     */
    private async analyzeSecurityAspects(atoms: Atom[], context: any): Promise<any> {
        const insights: Atom[] = [];
        const suggestions: string[] = [];

        // Check for potential security issues
        const securityIssues = this.detectSecurityIssues(atoms);
        insights.push(...securityIssues.insights);
        suggestions.push(...securityIssues.suggestions);

        // Check input validation
        const inputValidation = this.checkInputValidation(atoms);
        insights.push(...inputValidation.insights);
        suggestions.push(...inputValidation.suggestions);

        // Check for hardcoded secrets
        const secrets = this.detectHardcodedSecrets(atoms);
        insights.push(...secrets.insights);
        suggestions.push(...secrets.suggestions);

        const score = this.calculateSecurityScore(insights);

        return {
            insights,
            suggestions,
            score
        };
    }

    /**
     * Analyze performance aspects
     */
    private async analyzePerformance(atoms: Atom[], context: any): Promise<any> {
        const insights: Atom[] = [];
        const suggestions: string[] = [];

        // Check for performance anti-patterns
        const performanceIssues = this.detectPerformanceIssues(atoms);
        insights.push(...performanceIssues.insights);
        suggestions.push(...performanceIssues.suggestions);

        // Check algorithm complexity
        const algorithmComplexity = this.analyzeAlgorithmComplexity(atoms);
        insights.push(...algorithmComplexity.insights);
        suggestions.push(...algorithmComplexity.suggestions);

        // Check memory usage patterns
        const memoryIssues = this.analyzeMemoryUsage(atoms);
        insights.push(...memoryIssues.insights);
        suggestions.push(...memoryIssues.suggestions);

        const score = this.calculatePerformanceScore(insights);

        return {
            insights,
            suggestions,
            score
        };
    }

    /**
     * Create insight atom
     */
    private createInsightAtom(type: string, description: string, confidence: number): Atom {
        return {
            type: 'InsightNode',
            name: `${type}_${Date.now()}`,
            truthValue: { strength: 0.9, confidence },
            metadata: { insightType: type, description }
        };
    }

    /**
     * Estimate function complexity
     */
    private estimateFunctionComplexity(func: Atom): number {
        let complexity = 1; // Base complexity
        
        // Add complexity for each outgoing link (parameter, local var, etc.)
        if (func.outgoing) {
            complexity += func.outgoing.length;
            
            // Check for nested structures
            for (const child of func.outgoing) {
                if (child.type === 'LoopNode' || child.type === 'ConditionalNode') {
                    complexity += 2;
                }
                if (child.outgoing) {
                    complexity += child.outgoing.length * 0.5;
                }
            }
        }
        
        return Math.round(complexity);
    }

    /**
     * Pattern detection methods
     */
    private detectMVCPattern(atoms: Atom[]): boolean {
        const hasModel = atoms.some(atom => atom.name?.toLowerCase().includes('model'));
        const hasView = atoms.some(atom => atom.name?.toLowerCase().includes('view'));
        const hasController = atoms.some(atom => atom.name?.toLowerCase().includes('controller'));
        return hasModel && hasView && hasController;
    }

    private detectSingletonPattern(atoms: Atom[]): boolean {
        return atoms.some(atom => 
            atom.name?.toLowerCase().includes('singleton') ||
            atom.name?.toLowerCase().includes('instance')
        );
    }

    private detectFactoryPattern(atoms: Atom[]): boolean {
        return atoms.some(atom => 
            atom.name?.toLowerCase().includes('factory') ||
            atom.name?.toLowerCase().includes('create')
        );
    }

    private detectBuilderPattern(atoms: Atom[]): boolean {
        return atoms.some(atom => 
            atom.name?.toLowerCase().includes('builder') ||
            atom.name?.toLowerCase().includes('build')
        );
    }

    private detectAdapterPattern(atoms: Atom[]): boolean {
        return atoms.some(atom => 
            atom.name?.toLowerCase().includes('adapter') ||
            atom.name?.toLowerCase().includes('wrapper')
        );
    }

    private detectDecoratorPattern(atoms: Atom[]): boolean {
        return atoms.some(atom => 
            atom.name?.toLowerCase().includes('decorator') ||
            atom.name?.toLowerCase().includes('enhance')
        );
    }

    private detectObserverPattern(atoms: Atom[]): boolean {
        return atoms.some(atom => 
            atom.name?.toLowerCase().includes('observer') ||
            atom.name?.toLowerCase().includes('listener') ||
            atom.name?.toLowerCase().includes('subscribe')
        );
    }

    private detectStrategyPattern(atoms: Atom[]): boolean {
        return atoms.some(atom => 
            atom.name?.toLowerCase().includes('strategy') ||
            atom.name?.toLowerCase().includes('algorithm')
        );
    }

    /**
     * Quality check methods
     */
    private checkNamingConventions(atoms: Atom[]): any {
        const insights: Atom[] = [];
        const suggestions: string[] = [];

        for (const atom of atoms) {
            if (atom.name) {
                if (this.isBadNaming(atom.name)) {
                    insights.push(this.createInsightAtom('bad-naming', `Poor naming: ${atom.name}`, 0.8));
                    suggestions.push(`Improve naming for ${atom.name}`);
                }
            }
        }

        return { insights, suggestions };
    }

    private checkDocumentation(atoms: Atom[]): any {
        const insights: Atom[] = [];
        const suggestions: string[] = [];

        const functions = atoms.filter(atom => atom.type === 'FunctionNode');
        const undocumented = functions.filter(func => !this.hasDocumentation(func));

        if (undocumented.length > functions.length * 0.3) {
            insights.push(this.createInsightAtom('poor-documentation', 'Many functions lack documentation', 0.8));
            suggestions.push('Add documentation to functions');
        }

        return { insights, suggestions };
    }

    private checkCodeDuplication(atoms: Atom[]): any {
        const insights: Atom[] = [];
        const suggestions: string[] = [];

        const duplicates = this.findDuplicateCode(atoms);
        if (duplicates.length > 0) {
            insights.push(this.createInsightAtom('code-duplication', `Found ${duplicates.length} duplicate code blocks`, 0.9));
            suggestions.push('Extract common code into reusable functions');
        }

        return { insights, suggestions };
    }

    private checkErrorHandling(atoms: Atom[]): any {
        const insights: Atom[] = [];
        const suggestions: string[] = [];

        const functions = atoms.filter(atom => atom.type === 'FunctionNode');
        const withoutErrorHandling = functions.filter(func => !this.hasErrorHandling(func));

        if (withoutErrorHandling.length > functions.length * 0.5) {
            insights.push(this.createInsightAtom('poor-error-handling', 'Many functions lack error handling', 0.8));
            suggestions.push('Add proper error handling to functions');
        }

        return { insights, suggestions };
    }

    /**
     * Helper methods for quality checks
     */
    private isBadNaming(name: string): boolean {
        return name.length < 3 || 
               /^[a-z]+$/.test(name) || // all lowercase without separators
               /^[A-Z]+$/.test(name) || // all uppercase
               /\d+$/.test(name); // ends with numbers
    }

    private hasDocumentation(func: Atom): boolean {
        return func.metadata?.hasDocumentation || 
               func.name?.includes('documented') || 
               false;
    }

    private findDuplicateCode(atoms: Atom[]): Atom[] {
        // Simplified duplicate detection
        const signatures = new Map<string, Atom[]>();
        
        for (const atom of atoms) {
            const signature = this.generateCodeSignature(atom);
            if (!signatures.has(signature)) {
                signatures.set(signature, []);
            }
            signatures.get(signature)!.push(atom);
        }
        
        const duplicates: Atom[] = [];
        for (const group of signatures.values()) {
            if (group.length > 1) {
                duplicates.push(...group);
            }
        }
        
        return duplicates;
    }

    private generateCodeSignature(atom: Atom): string {
        let signature = atom.type;
        if (atom.outgoing) {
            signature += atom.outgoing.map(child => child.type).join(',');
        }
        return signature;
    }

    private hasErrorHandling(func: Atom): boolean {
        return func.outgoing?.some(child => 
            child.type === 'TryNode' || 
            child.type === 'CatchNode' ||
            child.name?.includes('error') ||
            child.name?.includes('exception')
        ) || false;
    }

    /**
     * Complexity calculation methods
     */
    private calculateCyclomaticComplexity(atoms: Atom[]): number {
        let complexity = 1; // Base complexity
        
        for (const atom of atoms) {
            if (atom.type === 'ConditionalNode' || atom.type === 'LoopNode') {
                complexity += 1;
            }
            if (atom.type === 'SwitchNode') {
                complexity += atom.outgoing?.length || 1;
            }
        }
        
        return complexity;
    }

    private calculateCognitiveComplexity(atoms: Atom[]): number {
        let complexity = 0;
        let nesting = 0;
        
        for (const atom of atoms) {
            if (atom.type === 'ConditionalNode' || atom.type === 'LoopNode') {
                complexity += (1 + nesting);
                nesting += 1;
            }
        }
        
        return complexity;
    }

    private analyzeCoupling(atoms: Atom[]): any {
        const high: string[] = [];
        const dependencies = new Map<string, number>();
        
        for (const atom of atoms) {
            if (atom.outgoing) {
                const depCount = atom.outgoing.length;
                if (depCount > 5) {
                    high.push(atom.name || atom.type);
                }
            }
        }
        
        return { high, dependencies };
    }

    private analyzeCohesion(atoms: Atom[]): any {
        const low: string[] = [];
        
        // Simplified cohesion analysis
        for (const atom of atoms) {
            if (atom.type === 'ClassNode' && atom.outgoing) {
                const methods = atom.outgoing.filter(child => child.type === 'FunctionNode');
                const sharedData = this.calculateSharedData(methods);
                if (sharedData < 0.3) {
                    low.push(atom.name || atom.type);
                }
            }
        }
        
        return { low };
    }

    private calculateSharedData(methods: Atom[]): number {
        // Simplified shared data calculation
        return methods.length > 0 ? 0.5 : 0;
    }

    /**
     * Security analysis methods
     */
    private detectSecurityIssues(atoms: Atom[]): any {
        const insights: Atom[] = [];
        const suggestions: string[] = [];

        // Check for SQL injection risks
        for (const atom of atoms) {
            if (this.hasSQLInjectionRisk(atom)) {
                insights.push(this.createInsightAtom('sql-injection-risk', 'Potential SQL injection vulnerability', 0.9));
                suggestions.push('Use parameterized queries to prevent SQL injection');
            }
        }

        return { insights, suggestions };
    }

    private checkInputValidation(atoms: Atom[]): any {
        const insights: Atom[] = [];
        const suggestions: string[] = [];

        const inputFunctions = atoms.filter(atom => this.isInputFunction(atom));
        const withoutValidation = inputFunctions.filter(func => !this.hasInputValidation(func));

        if (withoutValidation.length > 0) {
            insights.push(this.createInsightAtom('missing-input-validation', 'Functions missing input validation', 0.8));
            suggestions.push('Add input validation to public functions');
        }

        return { insights, suggestions };
    }

    private detectHardcodedSecrets(atoms: Atom[]): any {
        const insights: Atom[] = [];
        const suggestions: string[] = [];

        for (const atom of atoms) {
            if (this.hasHardcodedSecret(atom)) {
                insights.push(this.createInsightAtom('hardcoded-secret', 'Hardcoded secret detected', 0.9));
                suggestions.push('Move secrets to environment variables or secure storage');
            }
        }

        return { insights, suggestions };
    }

    private hasSQLInjectionRisk(atom: Atom): boolean {
        return atom.name?.includes('query') && atom.name?.includes('string') || false;
    }

    private isInputFunction(atom: Atom): boolean {
        return atom.name?.includes('input') || atom.name?.includes('param') || false;
    }

    private hasInputValidation(atom: Atom): boolean {
        return atom.outgoing?.some(child => 
            child.name?.includes('validate') || 
            child.name?.includes('check')
        ) || false;
    }

    private hasHardcodedSecret(atom: Atom): boolean {
        return atom.name?.includes('password') || 
               atom.name?.includes('secret') || 
               atom.name?.includes('key') || false;
    }

    /**
     * Performance analysis methods
     */
    private detectPerformanceIssues(atoms: Atom[]): any {
        const insights: Atom[] = [];
        const suggestions: string[] = [];

        // Check for nested loops
        const nestedLoops = this.findNestedLoops(atoms);
        if (nestedLoops.length > 0) {
            insights.push(this.createInsightAtom('nested-loops', 'Nested loops detected', 0.8));
            suggestions.push('Consider optimizing nested loop algorithms');
        }

        return { insights, suggestions };
    }

    private analyzeAlgorithmComplexity(atoms: Atom[]): any {
        const insights: Atom[] = [];
        const suggestions: string[] = [];

        for (const atom of atoms) {
            const complexity = this.estimateAlgorithmComplexity(atom);
            if (complexity > 3) { // O(n^3) or worse
                insights.push(this.createInsightAtom('high-algorithm-complexity', `High algorithm complexity: O(n^${complexity})`, 0.9));
                suggestions.push(`Optimize algorithm in ${atom.name} to reduce complexity`);
            }
        }

        return { insights, suggestions };
    }

    private analyzeMemoryUsage(atoms: Atom[]): any {
        const insights: Atom[] = [];
        const suggestions: string[] = [];

        // Check for potential memory leaks
        const memoryLeaks = this.detectMemoryLeaks(atoms);
        if (memoryLeaks.length > 0) {
            insights.push(this.createInsightAtom('memory-leak-risk', 'Potential memory leak detected', 0.8));
            suggestions.push('Review memory management and ensure proper cleanup');
        }

        return { insights, suggestions };
    }

    private findNestedLoops(atoms: Atom[]): Atom[] {
        const nestedLoops: Atom[] = [];
        
        for (const atom of atoms) {
            if (atom.type === 'LoopNode' && this.hasNestedLoop(atom)) {
                nestedLoops.push(atom);
            }
        }
        
        return nestedLoops;
    }

    private hasNestedLoop(atom: Atom): boolean {
        return atom.outgoing?.some(child => child.type === 'LoopNode') || false;
    }

    private estimateAlgorithmComplexity(atom: Atom): number {
        let complexity = 1;
        
        if (atom.type === 'LoopNode') {
            complexity += 1;
            if (atom.outgoing) {
                for (const child of atom.outgoing) {
                    complexity += this.estimateAlgorithmComplexity(child);
                }
            }
        }
        
        return complexity;
    }

    private detectMemoryLeaks(atoms: Atom[]): Atom[] {
        return atoms.filter(atom => 
            atom.name?.includes('event') && 
            !atom.name?.includes('remove') &&
            !atom.name?.includes('cleanup')
        );
    }

    /**
     * Score calculation methods
     */
    private calculateStructuralScore(insights: Atom[], functions: Atom[], classes: Atom[]): number {
        const issues = insights.length;
        const totalElements = functions.length + classes.length;
        const ratio = totalElements > 0 ? issues / totalElements : 0;
        return Math.max(0, 1 - ratio);
    }

    private calculateQualityScore(insights: Atom[]): number {
        return Math.max(0, 1 - (insights.length * 0.1));
    }

    private calculatePatternScore(patterns: string[]): number {
        return Math.min(1, patterns.length * 0.2);
    }

    private calculateComplexityScore(cyclomatic: number, cognitive: number): number {
        const cyclomaticScore = Math.max(0, 1 - (cyclomatic - 10) * 0.05);
        const cognitiveScore = Math.max(0, 1 - (cognitive - 15) * 0.03);
        return (cyclomaticScore + cognitiveScore) / 2;
    }

    private calculateSecurityScore(insights: Atom[]): number {
        const securityIssues = insights.filter(insight => 
            insight.metadata?.insightType?.includes('security') ||
            insight.metadata?.insightType?.includes('injection') ||
            insight.metadata?.insightType?.includes('secret')
        ).length;
        return Math.max(0, 1 - securityIssues * 0.2);
    }

    private calculatePerformanceScore(insights: Atom[]): number {
        const performanceIssues = insights.filter(insight => 
            insight.metadata?.insightType?.includes('performance') ||
            insight.metadata?.insightType?.includes('complexity') ||
            insight.metadata?.insightType?.includes('memory')
        ).length;
        return Math.max(0, 1 - performanceIssues * 0.15);
    }

    private calculateOverallConfidence(metrics: any): number {
        const scores = Object.values(metrics) as number[];
        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        return Math.min(0.95, average * 0.9 + 0.1);
    }

    private generateAnalysisExplanation(results: any): string {
        const totalIssues = results.insights.length;
        const totalSuggestions = results.suggestions.length;
        const metrics = results.qualityMetrics || {};
        const scores = Object.values(metrics) as number[];
        const avgScore = scores.length > 0 ? scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length : 0;
        
        return `Comprehensive code analysis completed. Found ${totalIssues} insights and ${totalSuggestions} improvement suggestions. Overall quality score: ${(avgScore * 100).toFixed(1)}%`;
    }
}