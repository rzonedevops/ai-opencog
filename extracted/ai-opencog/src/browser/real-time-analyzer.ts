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
import { Disposable, DisposableCollection } from '@theia/core/lib/common/disposable';
import { ITextModel } from '@theia/monaco-editor-core/esm/vs/editor/common/model';
import { OpenCogService } from '../common/opencog-service';
import { IntelligentRefactoringProvider, CodeQualityIssue } from './intelligent-refactoring';
import { PatternRecognitionAgent } from './pattern-recognition-agent';
import { Emitter, Event } from '@theia/core/lib/common/event';

export interface AnalysisResult {
    fileUri: string;
    timestamp: number;
    qualityMetrics: {
        score: number;
        complexity: number;
        maintainability: number;
        performance: number;
    };
    issues: CodeQualityIssue[];
    recommendations: string[];
    patterns: any[];
}

export interface PerformanceOptimization {
    id: string;
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    category: 'memory' | 'cpu' | 'io' | 'algorithm';
    suggestion: string;
    confidence: number;
}

/**
 * Real-time Code Analysis service providing continuous code quality monitoring,
 * issue detection and suggestions, and performance optimization recommendations
 */
@injectable()
export class RealTimeCodeAnalyzer implements Disposable {

    private readonly disposables = new DisposableCollection();
    private readonly analysisQueue = new Map<string, NodeJS.Timeout>();
    private readonly analysisResults = new Map<string, AnalysisResult>();
    
    private readonly onAnalysisCompletedEmitter = new Emitter<AnalysisResult>();
    readonly onAnalysisCompleted: Event<AnalysisResult> = this.onAnalysisCompletedEmitter.event;

    private readonly onIssuesDetectedEmitter = new Emitter<{ fileUri: string; issues: CodeQualityIssue[] }>();
    readonly onIssuesDetected: Event<{ fileUri: string; issues: CodeQualityIssue[] }> = this.onIssuesDetectedEmitter.event;

    constructor(
        @inject(OpenCogService) private readonly opencog: OpenCogService,
        @inject(IntelligentRefactoringProvider) private readonly refactoringProvider: IntelligentRefactoringProvider,
        @inject(PatternRecognitionAgent) private readonly patternAgent: PatternRecognitionAgent
    ) {
        this.disposables.push(this.onAnalysisCompletedEmitter);
        this.disposables.push(this.onIssuesDetectedEmitter);
    }

    /**
     * Start continuous monitoring of a text model
     */
    startMonitoring(model: ITextModel): void {
        const uri = model.uri.toString();
        
        // Listen for content changes
        const contentChanged = model.onDidChangeContent((event) => {
            this.scheduleAnalysis(model);
        });
        
        this.disposables.push(contentChanged);
        
        // Perform initial analysis
        this.scheduleAnalysis(model);
    }

    /**
     * Stop monitoring a specific model
     */
    stopMonitoring(uri: string): void {
        const timeout = this.analysisQueue.get(uri);
        if (timeout) {
            clearTimeout(timeout);
            this.analysisQueue.delete(uri);
        }
        this.analysisResults.delete(uri);
    }

    /**
     * Get the latest analysis result for a file
     */
    getAnalysisResult(uri: string): AnalysisResult | undefined {
        return this.analysisResults.get(uri);
    }

    /**
     * Perform immediate analysis of a model
     */
    async analyzeImmediately(model: ITextModel): Promise<AnalysisResult> {
        const uri = model.uri.toString();
        
        // Cancel any pending analysis
        const timeout = this.analysisQueue.get(uri);
        if (timeout) {
            clearTimeout(timeout);
            this.analysisQueue.delete(uri);
        }
        
        const result = await this.performAnalysis(model);
        this.analysisResults.set(uri, result);
        
        this.onAnalysisCompletedEmitter.fire(result);
        this.onIssuesDetectedEmitter.fire({ fileUri: uri, issues: result.issues });
        
        return result;
    }

    /**
     * Generate performance optimization recommendations
     */
    async getPerformanceOptimizations(model: ITextModel): Promise<PerformanceOptimization[]> {
        const code = model.getValue();
        const uri = model.uri.toString();
        
        const optimizations: PerformanceOptimization[] = [];
        
        // Analyze for common performance issues
        optimizations.push(...await this.detectAlgorithmicIssues(code));
        optimizations.push(...await this.detectMemoryIssues(code));
        optimizations.push(...await this.detectIOIssues(code));
        optimizations.push(...await this.detectCPUIntensiveOperations(code));
        
        // Use OpenCog reasoning for additional insights
        const reasoningResult = await this.opencog.reason({
            type: 'performance-analysis',
            context: {
                code,
                fileUri: uri,
                language: this.detectLanguage(uri)
            },
            atoms: []
        });
        
        // Convert reasoning results to optimizations
        if (reasoningResult.conclusions) {
            for (const conclusion of reasoningResult.conclusions) {
                if (conclusion.type === 'performance-optimization') {
                    optimizations.push({
                        id: `opencog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        title: conclusion.title || 'Performance Optimization',
                        description: conclusion.description || conclusion.value,
                        impact: conclusion.impact || 'medium',
                        category: conclusion.category || 'algorithm',
                        suggestion: conclusion.suggestion || conclusion.explanation,
                        confidence: conclusion.confidence || 0.6
                    });
                }
            }
        }
        
        return optimizations.sort((a, b) => b.confidence - a.confidence);
    }

    private scheduleAnalysis(model: ITextModel): void {
        const uri = model.uri.toString();
        
        // Clear existing timeout
        const existingTimeout = this.analysisQueue.get(uri);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }
        
        // Schedule new analysis with debouncing
        const timeout = setTimeout(async () => {
            try {
                const result = await this.performAnalysis(model);
                this.analysisResults.set(uri, result);
                
                this.onAnalysisCompletedEmitter.fire(result);
                this.onIssuesDetectedEmitter.fire({ fileUri: uri, issues: result.issues });
            } catch (error) {
                console.error('Analysis failed:', error);
            } finally {
                this.analysisQueue.delete(uri);
            }
        }, 1000); // 1 second debounce
        
        this.analysisQueue.set(uri, timeout);
    }

    private async performAnalysis(model: ITextModel): Promise<AnalysisResult> {
        const uri = model.uri.toString();
        const code = model.getValue();
        
        // Parallel analysis execution
        const [qualityIssues, patterns, qualityMetrics] = await Promise.all([
            this.refactoringProvider.analyzeCodeQuality(model),
            this.patternAgent.detectCodePatterns(code, uri),
            this.calculateQualityMetrics(model)
        ]);
        
        // Generate recommendations based on analysis
        const recommendations = await this.generateRecommendations(qualityIssues, patterns, qualityMetrics);
        
        return {
            fileUri: uri,
            timestamp: Date.now(),
            qualityMetrics,
            issues: qualityIssues,
            recommendations,
            patterns
        };
    }

    private async calculateQualityMetrics(model: ITextModel): Promise<any> {
        const code = model.getValue();
        const lines = model.getLinesContent();
        
        // Basic metrics calculation
        const totalLines = lines.length;
        const codeLines = lines.filter(line => line.trim().length > 0 && !line.trim().startsWith('//')).length;
        const complexityScore = this.calculateComplexityScore(lines);
        const maintainabilityScore = this.calculateMaintainabilityScore(lines);
        const performanceScore = await this.calculatePerformanceScore(code);
        
        // Overall quality score
        const overallScore = (complexityScore * 0.3 + maintainabilityScore * 0.4 + performanceScore * 0.3);
        
        return {
            score: Math.round(overallScore * 100) / 100,
            complexity: Math.round(complexityScore * 100) / 100,
            maintainability: Math.round(maintainabilityScore * 100) / 100,
            performance: Math.round(performanceScore * 100) / 100,
            linesOfCode: codeLines,
            totalLines
        };
    }

    private calculateComplexityScore(lines: string[]): number {
        let complexity = 0;
        let maxNesting = 0;
        let currentNesting = 0;
        
        for (const line of lines) {
            // Count control structures
            if (line.includes('if') || line.includes('for') || line.includes('while') || line.includes('switch')) {
                complexity += 1;
            }
            
            // Track nesting
            const openBraces = (line.match(/\{/g) || []).length;
            const closeBraces = (line.match(/\}/g) || []).length;
            currentNesting += openBraces - closeBraces;
            maxNesting = Math.max(maxNesting, currentNesting);
        }
        
        // Normalize score (lower complexity = higher score)
        const rawScore = Math.max(0, 1 - (complexity + maxNesting * 0.1) / lines.length);
        return Math.min(1, rawScore);
    }

    private calculateMaintainabilityScore(lines: string[]): number {
        let score = 1.0;
        
        // Penalize long lines
        const longLines = lines.filter(line => line.length > 120).length;
        score -= (longLines / lines.length) * 0.2;
        
        // Penalize deep nesting
        let maxIndent = 0;
        for (const line of lines) {
            const indent = (line.match(/^(\s*)/)?.[1]?.length || 0) / 4;
            maxIndent = Math.max(maxIndent, indent);
        }
        score -= Math.max(0, (maxIndent - 3) * 0.1);
        
        // Reward comments
        const commentLines = lines.filter(line => line.trim().startsWith('//')).length;
        score += Math.min(0.1, (commentLines / lines.length) * 0.5);
        
        return Math.max(0, Math.min(1, score));
    }

    private async calculatePerformanceScore(code: string): Promise<number> {
        let score = 1.0;
        
        // Check for performance anti-patterns
        const inefficientPatterns = [
            /for.*in.*Object\.keys/g, // for-in on Object.keys
            /\+\s*=.*['"`]/g, // String concatenation in loops
            /document\.getElementById.*loop/g, // DOM queries in loops
            /new\s+Date\(\).*loop/g // Date creation in loops
        ];
        
        for (const pattern of inefficientPatterns) {
            const matches = code.match(pattern);
            if (matches) {
                score -= matches.length * 0.1;
            }
        }
        
        return Math.max(0, Math.min(1, score));
    }

    private async generateRecommendations(issues: CodeQualityIssue[], patterns: any[], metrics: any): Promise<string[]> {
        const recommendations: string[] = [];
        
        // Quality-based recommendations
        if (metrics.score < 0.7) {
            recommendations.push('Overall code quality could be improved. Consider refactoring complex sections.');
        }
        
        if (metrics.complexity < 0.6) {
            recommendations.push('High complexity detected. Consider breaking down complex functions into smaller ones.');
        }
        
        if (metrics.maintainability < 0.6) {
            recommendations.push('Maintainability could be improved. Add comments and reduce nesting levels.');
        }
        
        if (metrics.performance < 0.7) {
            recommendations.push('Performance optimizations available. Review algorithmic complexity and inefficient patterns.');
        }
        
        // Issue-based recommendations
        const errorCount = issues.filter(i => i.severity === 'error').length;
        const warningCount = issues.filter(i => i.severity === 'warning').length;
        
        if (errorCount > 0) {
            recommendations.push(`${errorCount} critical issues found that should be addressed immediately.`);
        }
        
        if (warningCount > 5) {
            recommendations.push(`${warningCount} warnings detected. Consider addressing these to improve code quality.`);
        }
        
        // Pattern-based recommendations
        const antiPatterns = patterns.filter(p => p.pattern.type === 'anti-pattern');
        if (antiPatterns.length > 0) {
            recommendations.push(`${antiPatterns.length} anti-patterns detected. Review and refactor these areas.`);
        }
        
        return recommendations;
    }

    private async detectAlgorithmicIssues(code: string): Promise<PerformanceOptimization[]> {
        const optimizations: PerformanceOptimization[] = [];
        
        // Nested loops detection
        const nestedLoopPattern = /for\s*\([^}]*\{[^}]*for\s*\(/g;
        const nestedLoops = code.match(nestedLoopPattern);
        if (nestedLoops) {
            optimizations.push({
                id: 'nested-loops',
                title: 'Nested Loops Detected',
                description: 'Nested loops can cause O(n²) complexity',
                impact: 'high',
                category: 'algorithm',
                suggestion: 'Consider using hash maps or alternative algorithms to reduce complexity',
                confidence: 0.8
            });
        }
        
        return optimizations;
    }

    private async detectMemoryIssues(code: string): Promise<PerformanceOptimization[]> {
        const optimizations: PerformanceOptimization[] = [];
        
        // String concatenation in loops
        const stringConcatPattern = /for[^}]*\{[^}]*\+\s*=/g;
        if (code.match(stringConcatPattern)) {
            optimizations.push({
                id: 'string-concat-loop',
                title: 'String Concatenation in Loop',
                description: 'String concatenation in loops creates unnecessary object allocations',
                impact: 'medium',
                category: 'memory',
                suggestion: 'Use array.join() or template literals for better performance',
                confidence: 0.9
            });
        }
        
        return optimizations;
    }

    private async detectIOIssues(code: string): Promise<PerformanceOptimization[]> {
        const optimizations: PerformanceOptimization[] = [];
        
        // Synchronous file operations
        if (code.includes('readFileSync') || code.includes('writeFileSync')) {
            optimizations.push({
                id: 'sync-io',
                title: 'Synchronous I/O Operations',
                description: 'Synchronous I/O can block the event loop',
                impact: 'high',
                category: 'io',
                suggestion: 'Use asynchronous alternatives like readFile() with promises or async/await',
                confidence: 0.95
            });
        }
        
        return optimizations;
    }

    private async detectCPUIntensiveOperations(code: string): Promise<PerformanceOptimization[]> {
        const optimizations: PerformanceOptimization[] = [];
        
        // Regular expression compilation in loops
        const regexInLoopPattern = /for[^}]*\{[^}]*new\s+RegExp/g;
        if (code.match(regexInLoopPattern)) {
            optimizations.push({
                id: 'regex-in-loop',
                title: 'Regular Expression Compilation in Loop',
                description: 'Compiling regex patterns inside loops is inefficient',
                impact: 'medium',
                category: 'cpu',
                suggestion: 'Move regex compilation outside the loop or use literal regex patterns',
                confidence: 0.85
            });
        }
        
        return optimizations;
    }

    private detectLanguage(uri: string): string {
        const extension = uri.split('.').pop()?.toLowerCase();
        const languageMap: Record<string, string> = {
            'ts': 'typescript',
            'js': 'javascript',
            'py': 'python',
            'java': 'java'
        };
        return languageMap[extension || ''] || 'javascript';
    }

    dispose(): void {
        // Clear all timeouts
        for (const timeout of this.analysisQueue.values()) {
            clearTimeout(timeout);
        }
        this.analysisQueue.clear();
        this.analysisResults.clear();
        
        this.disposables.dispose();
    }
}