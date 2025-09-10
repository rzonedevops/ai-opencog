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
import { ITextModel } from '@theia/monaco-editor-core/esm/vs/editor/common/model';
import { Range } from '@theia/monaco-editor-core/esm/vs/editor/common/core/range';
import { OpenCogService } from '../common/opencog-service';
import { PatternRecognitionAgent } from './pattern-recognition-agent';
import { ReasoningQuery, PatternResult } from '../common/opencog-types';

export interface RefactoringSuggestion {
    id: string;
    title: string;
    description: string;
    range: Range;
    confidence: number;
    category: 'code-quality' | 'performance' | 'maintainability' | 'design-pattern';
    changes: Array<{
        range: Range;
        newText: string;
        description: string;
    }>;
}

export interface CodeQualityIssue {
    id: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    range: Range;
    suggestions: RefactoringSuggestion[];
}

/**
 * Intelligent Refactoring Provider using OpenCog reasoning
 * for code quality analysis, refactoring opportunity detection,
 * and automated refactoring execution
 */
@injectable()
export class IntelligentRefactoringProvider {

    constructor(
        @inject(OpenCogService) private readonly opencog: OpenCogService,
        @inject(PatternRecognitionAgent) private readonly patternAgent: PatternRecognitionAgent
    ) {}

    /**
     * Analyze code quality and detect issues
     */
    async analyzeCodeQuality(model: ITextModel): Promise<CodeQualityIssue[]> {
        const code = model.getValue();
        const issues: CodeQualityIssue[] = [];

        // Use pattern recognition to identify code smells and anti-patterns
        const patterns = await this.patternAgent.detectCodePatterns(code, model.uri.toString());
        
        // Convert patterns to quality issues
        for (const pattern of patterns) {
            if (pattern.pattern.type === 'anti-pattern' || pattern.pattern.type === 'code-smell') {
                const issue = await this.createQualityIssue(pattern, model);
                if (issue) {
                    issues.push(issue);
                }
            }
        }

        // Analyze complexity and suggest improvements
        const complexityIssues = await this.analyzeComplexity(model);
        issues.push(...complexityIssues);

        // Detect duplication and suggest extraction
        const duplicationIssues = await this.detectDuplication(model);
        issues.push(...duplicationIssues);

        return issues;
    }

    /**
     * Detect refactoring opportunities
     */
    async detectRefactoringOpportunities(model: ITextModel): Promise<RefactoringSuggestion[]> {
        const code = model.getValue();
        const suggestions: RefactoringSuggestion[] = [];

        // Use OpenCog reasoning to identify opportunities
        const reasoningQuery: ReasoningQuery = {
            type: 'refactoring-analysis',
            context: {
                code,
                fileUri: model.uri.toString(),
                language: this.detectLanguage(model.uri.toString())
            },
            atoms: []
        };

        const result = await this.opencog.reason(reasoningQuery);

        // Extract method opportunities
        suggestions.push(...await this.detectExtractMethodOpportunities(model));
        
        // Extract variable opportunities
        suggestions.push(...await this.detectExtractVariableOpportunities(model));
        
        // Inline opportunities
        suggestions.push(...await this.detectInlineOpportunities(model));
        
        // Design pattern opportunities
        suggestions.push(...await this.detectDesignPatternOpportunities(model));

        return suggestions;
    }

    /**
     * Execute automated refactoring
     */
    async executeRefactoring(suggestion: RefactoringSuggestion, model: ITextModel): Promise<boolean> {
        try {
            // Apply changes in reverse order to maintain range validity
            const sortedChanges = suggestion.changes.sort((a, b) => b.range.startLineNumber - a.range.startLineNumber);
            
            for (const change of sortedChanges) {
                const edit = {
                    range: change.range,
                    text: change.newText
                };
                model.applyEdits([edit]);
            }

            // Learn from successful refactoring
            await this.opencog.learn({
                type: 'refactoring-success',
                data: {
                    suggestionId: suggestion.id,
                    category: suggestion.category,
                    confidence: suggestion.confidence
                },
                context: {
                    fileUri: model.uri.toString(),
                    timestamp: Date.now()
                }
            });

            return true;
        } catch (error) {
            console.error('Failed to execute refactoring:', error);
            return false;
        }
    }

    private async createQualityIssue(pattern: PatternResult, model: ITextModel): Promise<CodeQualityIssue | null> {
        const range = this.patternToRange(pattern, model);
        if (!range) return null;

        const suggestions = await this.generateRefactoringSuggestionsForPattern(pattern, range);

        return {
            id: `quality-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            severity: this.getSeverityForPattern(pattern),
            message: pattern.explanation || `${pattern.pattern.type}: ${pattern.pattern.name}`,
            range,
            suggestions
        };
    }

    private async analyzeComplexity(model: ITextModel): Promise<CodeQualityIssue[]> {
        const issues: CodeQualityIssue[] = [];
        const lines = model.getLinesContent();

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check for long lines
            if (line.length > 120) {
                issues.push({
                    id: `long-line-${i}`,
                    severity: 'warning',
                    message: 'Line is too long, consider breaking it up',
                    range: new Range(i + 1, 1, i + 1, line.length + 1),
                    suggestions: [{
                        id: `break-line-${i}`,
                        title: 'Break long line',
                        description: 'Break this line into multiple lines for better readability',
                        range: new Range(i + 1, 1, i + 1, line.length + 1),
                        confidence: 0.8,
                        category: 'maintainability',
                        changes: []
                    }]
                });
            }

            // Check for deep nesting
            const indentLevel = this.getIndentLevel(line);
            if (indentLevel > 24) { // 6 levels of 4-space indentation
                issues.push({
                    id: `deep-nesting-${i}`,
                    severity: 'warning',
                    message: 'Deep nesting detected, consider extracting methods',
                    range: new Range(i + 1, 1, i + 1, line.length + 1),
                    suggestions: [{
                        id: `extract-method-${i}`,
                        title: 'Extract Method',
                        description: 'Extract nested code into a separate method',
                        range: new Range(i + 1, 1, i + 1, line.length + 1),
                        confidence: 0.7,
                        category: 'maintainability',
                        changes: []
                    }]
                });
            }
        }

        return issues;
    }

    private async detectDuplication(model: ITextModel): Promise<CodeQualityIssue[]> {
        const issues: CodeQualityIssue[] = [];
        const lines = model.getLinesContent();
        const lineMap = new Map<string, number[]>();

        // Find duplicate lines
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.length > 10) { // Only consider meaningful lines
                if (!lineMap.has(line)) {
                    lineMap.set(line, []);
                }
                lineMap.get(line)!.push(i);
            }
        }

        // Report duplicates
        for (const [line, lineNumbers] of lineMap) {
            if (lineNumbers.length > 1) {
                for (const lineNumber of lineNumbers) {
                    issues.push({
                        id: `duplicate-${lineNumber}`,
                        severity: 'info',
                        message: 'Duplicate code detected',
                        range: new Range(lineNumber + 1, 1, lineNumber + 1, lines[lineNumber].length + 1),
                        suggestions: [{
                            id: `extract-common-${lineNumber}`,
                            title: 'Extract Common Code',
                            description: 'Extract this duplicate code into a reusable function',
                            range: new Range(lineNumber + 1, 1, lineNumber + 1, lines[lineNumber].length + 1),
                            confidence: 0.6,
                            category: 'maintainability',
                            changes: []
                        }]
                    });
                }
            }
        }

        return issues;
    }

    private async detectExtractMethodOpportunities(model: ITextModel): Promise<RefactoringSuggestion[]> {
        const suggestions: RefactoringSuggestion[] = [];
        const lines = model.getLinesContent();
        
        // Simple heuristic: look for blocks that could be extracted
        let blockStart = -1;
        let blockDepth = 0;
        let currentDepth = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const indent = this.getIndentLevel(line);
            
            if (line.includes('{')) {
                if (blockStart === -1) {
                    blockStart = i;
                    blockDepth = indent;
                }
                currentDepth++;
            }
            
            if (line.includes('}')) {
                currentDepth--;
                if (currentDepth === 0 && blockStart !== -1) {
                    const blockLength = i - blockStart + 1;
                    if (blockLength > 10) { // Suggest extraction for blocks > 10 lines
                        suggestions.push({
                            id: `extract-method-${blockStart}`,
                            title: 'Extract Method',
                            description: `Extract ${blockLength} lines into a separate method`,
                            range: new Range(blockStart + 1, 1, i + 1, lines[i].length + 1),
                            confidence: 0.7,
                            category: 'maintainability',
                            changes: []
                        });
                    }
                    blockStart = -1;
                }
            }
        }

        return suggestions;
    }

    private async detectExtractVariableOpportunities(model: ITextModel): Promise<RefactoringSuggestion[]> {
        const suggestions: RefactoringSuggestion[] = [];
        const code = model.getValue();
        
        // Look for complex expressions that appear multiple times
        const expressionPattern = /[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*/g;
        const expressions = code.match(expressionPattern) || [];
        const expressionCounts = new Map<string, number>();
        
        for (const expr of expressions) {
            if (expr.split('.').length > 2) { // Only complex expressions
                expressionCounts.set(expr, (expressionCounts.get(expr) || 0) + 1);
            }
        }
        
        for (const [expr, count] of expressionCounts) {
            if (count > 1) {
                suggestions.push({
                    id: `extract-variable-${expr}`,
                    title: 'Extract Variable',
                    description: `Extract "${expr}" into a variable (used ${count} times)`,
                    range: new Range(1, 1, 1, 1), // Would need to find actual positions
                    confidence: 0.6,
                    category: 'maintainability',
                    changes: []
                });
            }
        }

        return suggestions;
    }

    private async detectInlineOpportunities(model: ITextModel): Promise<RefactoringSuggestion[]> {
        // Implementation for detecting inline opportunities
        return [];
    }

    private async detectDesignPatternOpportunities(model: ITextModel): Promise<RefactoringSuggestion[]> {
        // Implementation for detecting design pattern opportunities
        return [];
    }

    private async generateRefactoringSuggestionsForPattern(pattern: PatternResult, range: Range): Promise<RefactoringSuggestion[]> {
        const suggestions: RefactoringSuggestion[] = [];
        
        if (pattern.pattern.name === 'long-method') {
            suggestions.push({
                id: `refactor-${pattern.pattern.name}-${Date.now()}`,
                title: 'Extract Method',
                description: 'Break this long method into smaller, more focused methods',
                range,
                confidence: pattern.confidence,
                category: 'maintainability',
                changes: []
            });
        }
        
        return suggestions;
    }

    private patternToRange(pattern: PatternResult, model: ITextModel): Range | null {
        // Convert pattern location to Monaco Range
        if (pattern.metadata?.location) {
            const loc = pattern.metadata.location;
            return new Range(loc.startLine || 1, loc.startColumn || 1, loc.endLine || 1, loc.endColumn || 1);
        }
        return new Range(1, 1, 1, 1); // Default range
    }

    private getSeverityForPattern(pattern: PatternResult): 'error' | 'warning' | 'info' {
        if (pattern.pattern.type === 'anti-pattern') return 'warning';
        if (pattern.pattern.type === 'code-smell') return 'info';
        return 'info';
    }

    private getIndentLevel(line: string): number {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
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
}