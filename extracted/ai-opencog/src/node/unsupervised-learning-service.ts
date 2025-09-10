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
import {
    UnsupervisedLearningService,
    PatternDiscoveryResult,
    DiscoveredPattern,
    WorkflowOptimizationResult,
    WorkflowOptimization
} from '../common/learning-services';
import { PatternMatchingEngine } from './reasoning-engines';

/**
 * Implementation of UnsupervisedLearningService
 * Discovers patterns and learns without labeled data
 */
@injectable()
export class UnsupervisedLearningServiceImpl implements UnsupervisedLearningService {
    
    private readonly discoveredPatterns: Map<string, DiscoveredPattern[]> = new Map();
    private readonly workflowData: any[] = [];
    private readonly qualityMetricsHistory: any[] = [];

    constructor(
        @inject(PatternMatchingEngine) private readonly patternEngine: PatternMatchingEngine
    ) {}

    async discoverCodePatterns(codeData: any[]): Promise<PatternDiscoveryResult> {
        try {
            const patterns: DiscoveredPattern[] = [];
            
            // Group similar code snippets
            const codeGroups = this.groupSimilarCode(codeData);
            
            for (const [groupKey, group] of codeGroups.entries()) {
                // Discover patterns within each group
                const groupPatterns = await this.discoverPatternsInGroup(group, groupKey);
                patterns.push(...groupPatterns);
            }
            
            // Calculate overall confidence
            const confidence = this.calculatePatternConfidence(patterns, codeData.length);
            
            // Generate insights
            const insights = this.generatePatternInsights(patterns, codeData);
            
            // Cache discovered patterns
            this.discoveredPatterns.set('code', patterns);
            
            return {
                patterns,
                confidence,
                insights
            };
        } catch (error) {
            return {
                patterns: [],
                confidence: 0,
                insights: [`Pattern discovery failed: ${error.message}`]
            };
        }
    }

    async learnWorkflowOptimizations(workflowData: any[]): Promise<WorkflowOptimizationResult> {
        try {
            // Store workflow data for learning
            this.workflowData.push(...workflowData);
            
            // Analyze workflow patterns
            const timePatterns = this.analyzeTimePatterns(workflowData);
            const frequencyPatterns = this.analyzeFrequencyPatterns(workflowData);
            const sequencePatterns = this.analyzeSequencePatterns(workflowData);
            
            // Generate optimizations from patterns
            const optimizations: WorkflowOptimization[] = [];
            optimizations.push(...this.generateTimeOptimizations(timePatterns));
            optimizations.push(...this.generateFrequencyOptimizations(frequencyPatterns));
            optimizations.push(...this.generateSequenceOptimizations(sequencePatterns));
            
            // Calculate expected improvement
            const expectedImprovement = this.calculateExpectedImprovement(optimizations, workflowData);
            const confidence = this.calculateOptimizationConfidence(optimizations);
            
            return {
                optimizations,
                expectedImprovement,
                confidence
            };
        } catch (error) {
            return {
                optimizations: [],
                expectedImprovement: 0,
                confidence: 0
            };
        }
    }

    async learnQualityMetrics(qualityData: any[]): Promise<{ metrics: any[]; confidence: number }> {
        try {
            // Store quality data
            this.qualityMetricsHistory.push(...qualityData);
            
            // Discover quality metric patterns
            const metricPatterns = this.discoverQualityMetricPatterns(qualityData);
            
            // Extract meaningful metrics
            const metrics = this.extractQualityMetrics(metricPatterns);
            
            // Calculate confidence based on data consistency
            const confidence = this.calculateMetricConfidence(qualityData, metrics);
            
            return {
                metrics,
                confidence
            };
        } catch (error) {
            return {
                metrics: [],
                confidence: 0
            };
        }
    }

    /**
     * Group similar code snippets
     */
    private groupSimilarCode(codeData: any[]): Map<string, any[]> {
        const groups = new Map<string, any[]>();
        
        for (const code of codeData) {
            const groupKey = this.determineCodeGroup(code);
            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey)!.push(code);
        }
        
        return groups;
    }

    /**
     * Determine which group code belongs to
     */
    private determineCodeGroup(code: any): string {
        const codeStr = typeof code === 'string' ? code : JSON.stringify(code);
        
        // Simple grouping based on code characteristics
        if (codeStr.includes('function') || codeStr.includes('=>')) {
            return 'functions';
        } else if (codeStr.includes('class')) {
            return 'classes';
        } else if (codeStr.includes('if') || codeStr.includes('switch')) {
            return 'conditionals';
        } else if (codeStr.includes('for') || codeStr.includes('while')) {
            return 'loops';
        } else {
            return 'general';
        }
    }

    /**
     * Discover patterns within a code group
     */
    private async discoverPatternsInGroup(group: any[], groupKey: string): Promise<DiscoveredPattern[]> {
        const patterns: DiscoveredPattern[] = [];
        
        // Analyze structural patterns
        const structuralPattern = this.analyzeStructuralPattern(group, groupKey);
        if (structuralPattern) {
            patterns.push(structuralPattern);
        }
        
        // Analyze naming patterns
        const namingPattern = this.analyzeNamingPattern(group, groupKey);
        if (namingPattern) {
            patterns.push(namingPattern);
        }
        
        // Analyze complexity patterns
        const complexityPattern = this.analyzeComplexityPattern(group, groupKey);
        if (complexityPattern) {
            patterns.push(complexityPattern);
        }
        
        return patterns;
    }

    /**
     * Analyze structural patterns in code group
     */
    private analyzeStructuralPattern(group: any[], groupKey: string): DiscoveredPattern | null {
        if (group.length < 3) return null;
        
        // Simple structural analysis
        const commonStructures = this.findCommonStructures(group);
        
        if (commonStructures.length > 0) {
            return {
                pattern: {
                    type: 'structural',
                    group: groupKey,
                    structures: commonStructures
                },
                frequency: commonStructures.length,
                confidence: Math.min(0.9, commonStructures.length / group.length),
                type: 'structural',
                description: `Common structural pattern in ${groupKey}: ${commonStructures.join(', ')}`
            };
        }
        
        return null;
    }

    /**
     * Find common structures in code group
     */
    private findCommonStructures(group: any[]): string[] {
        const structures: string[] = [];
        
        // Extract common keywords/patterns
        const keywordCounts = new Map<string, number>();
        
        for (const item of group) {
            const codeStr = typeof item === 'string' ? item : JSON.stringify(item);
            const keywords = codeStr.match(/\b(function|class|if|for|while|async|await|return|const|let|var)\b/g) || [];
            
            for (const keyword of keywords) {
                keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
            }
        }
        
        // Find keywords present in most items
        const threshold = Math.ceil(group.length * 0.6);
        for (const [keyword, count] of keywordCounts.entries()) {
            if (count >= threshold) {
                structures.push(keyword);
            }
        }
        
        return structures;
    }

    /**
     * Analyze naming patterns in code group
     */
    private analyzeNamingPattern(group: any[], groupKey: string): DiscoveredPattern | null {
        const namingConventions = this.extractNamingConventions(group);
        
        if (namingConventions.camelCase > namingConventions.snake_case) {
            return {
                pattern: {
                    type: 'naming',
                    convention: 'camelCase',
                    prevalence: namingConventions.camelCase / group.length
                },
                frequency: namingConventions.camelCase,
                confidence: namingConventions.camelCase / (namingConventions.camelCase + namingConventions.snake_case),
                type: 'behavioral',
                description: `CamelCase naming convention prevalent in ${groupKey}`
            };
        } else if (namingConventions.snake_case > 0) {
            return {
                pattern: {
                    type: 'naming',
                    convention: 'snake_case',
                    prevalence: namingConventions.snake_case / group.length
                },
                frequency: namingConventions.snake_case,
                confidence: namingConventions.snake_case / (namingConventions.camelCase + namingConventions.snake_case),
                type: 'behavioral',
                description: `Snake_case naming convention used in ${groupKey}`
            };
        }
        
        return null;
    }

    /**
     * Extract naming conventions from code group
     */
    private extractNamingConventions(group: any[]): { camelCase: number; snake_case: number } {
        let camelCase = 0;
        let snake_case = 0;
        
        for (const item of group) {
            const codeStr = typeof item === 'string' ? item : JSON.stringify(item);
            
            // Simple pattern matching for naming conventions
            const camelCaseMatches = codeStr.match(/\b[a-z]+[A-Z][a-zA-Z]*\b/g) || [];
            const snakeCaseMatches = codeStr.match(/\b[a-z]+_[a-z_]*\b/g) || [];
            
            camelCase += camelCaseMatches.length;
            snake_case += snakeCaseMatches.length;
        }
        
        return { camelCase, snake_case };
    }

    /**
     * Analyze complexity patterns
     */
    private analyzeComplexityPattern(group: any[], groupKey: string): DiscoveredPattern | null {
        const complexities = group.map(item => this.calculateCodeComplexity(item));
        const avgComplexity = complexities.reduce((sum, c) => sum + c, 0) / complexities.length;
        
        if (avgComplexity > 5) {
            return {
                pattern: {
                    type: 'complexity',
                    averageComplexity: avgComplexity,
                    complexityDistribution: this.getComplexityDistribution(complexities)
                },
                frequency: group.length,
                confidence: 0.8,
                type: 'structural',
                description: `High complexity pattern detected in ${groupKey} (avg: ${avgComplexity.toFixed(2)})`
            };
        }
        
        return null;
    }

    /**
     * Calculate simple code complexity metric
     */
    private calculateCodeComplexity(code: any): number {
        const codeStr = typeof code === 'string' ? code : JSON.stringify(code);
        
        // Simple complexity based on control structures and nesting
        const controlStructures = (codeStr.match(/\b(if|for|while|switch|try|catch)\b/g) || []).length;
        const nestingLevel = this.calculateNestingLevel(codeStr);
        const functionCount = (codeStr.match(/\bfunction\b|\=\>/g) || []).length;
        
        return controlStructures + nestingLevel + functionCount;
    }

    /**
     * Calculate nesting level in code
     */
    private calculateNestingLevel(code: string): number {
        let maxLevel = 0;
        let currentLevel = 0;
        
        for (const char of code) {
            if (char === '{' || char === '(') {
                currentLevel++;
                maxLevel = Math.max(maxLevel, currentLevel);
            } else if (char === '}' || char === ')') {
                currentLevel = Math.max(0, currentLevel - 1);
            }
        }
        
        return maxLevel;
    }

    /**
     * Get complexity distribution
     */
    private getComplexityDistribution(complexities: number[]): { low: number; medium: number; high: number } {
        const low = complexities.filter(c => c <= 3).length;
        const medium = complexities.filter(c => c > 3 && c <= 7).length;
        const high = complexities.filter(c => c > 7).length;
        
        return { low, medium, high };
    }

    /**
     * Calculate pattern discovery confidence
     */
    private calculatePatternConfidence(patterns: DiscoveredPattern[], totalDataPoints: number): number {
        if (patterns.length === 0 || totalDataPoints === 0) return 0;
        
        const avgPatternConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
        const coverageRatio = patterns.length / Math.max(totalDataPoints / 10, 1); // Normalize by expected pattern count
        
        return Math.min(0.95, avgPatternConfidence * 0.7 + Math.min(coverageRatio, 1) * 0.3);
    }

    /**
     * Generate insights from discovered patterns
     */
    private generatePatternInsights(patterns: DiscoveredPattern[], codeData: any[]): string[] {
        const insights: string[] = [];
        
        insights.push(`Discovered ${patterns.length} patterns from ${codeData.length} code samples`);
        
        const patternTypes = new Set(patterns.map(p => p.type));
        insights.push(`Pattern types found: ${Array.from(patternTypes).join(', ')}`);
        
        const highConfidencePatterns = patterns.filter(p => p.confidence > 0.8).length;
        if (highConfidencePatterns > 0) {
            insights.push(`${highConfidencePatterns} high-confidence patterns identified`);
        }
        
        // Specific insights for different pattern types
        const structuralPatterns = patterns.filter(p => p.type === 'structural');
        if (structuralPatterns.length > 0) {
            insights.push(`Consistent structural patterns suggest good code organization`);
        }
        
        const behavioralPatterns = patterns.filter(p => p.type === 'behavioral');
        if (behavioralPatterns.length > 0) {
            insights.push(`Behavioral patterns indicate consistent coding practices`);
        }
        
        return insights;
    }

    /**
     * Analyze time patterns in workflow data
     */
    private analyzeTimePatterns(workflowData: any[]): any {
        // Simple time pattern analysis
        const timeSpent = workflowData.map(item => item.timeSpent || 0).filter(t => t > 0);
        
        if (timeSpent.length === 0) return null;
        
        const avgTime = timeSpent.reduce((sum, t) => sum + t, 0) / timeSpent.length;
        const maxTime = Math.max(...timeSpent);
        const minTime = Math.min(...timeSpent);
        
        return {
            averageTime: avgTime,
            maxTime,
            minTime,
            variance: this.calculateVariance(timeSpent),
            pattern: avgTime > 60 ? 'time_intensive' : 'quick_tasks'
        };
    }

    /**
     * Calculate variance
     */
    private calculateVariance(values: number[]): number {
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        return squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;
    }

    /**
     * Analyze frequency patterns in workflow data
     */
    private analyzeFrequencyPatterns(workflowData: any[]): any {
        const actionCounts = new Map<string, number>();
        
        for (const item of workflowData) {
            const action = item.action || item.type || 'unknown';
            actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
        }
        
        const sortedActions = Array.from(actionCounts.entries())
            .sort(([,a], [,b]) => b - a);
        
        return {
            mostFrequent: sortedActions.slice(0, 5),
            totalActions: sortedActions.length,
            actionDistribution: Object.fromEntries(actionCounts)
        };
    }

    /**
     * Analyze sequence patterns in workflow data
     */
    private analyzeSequencePatterns(workflowData: any[]): any {
        const sequences: string[][] = [];
        let currentSequence: string[] = [];
        
        for (const item of workflowData) {
            const action = item.action || item.type || 'unknown';
            currentSequence.push(action);
            
            // Break sequences on certain actions or time gaps
            if (action === 'save' || action === 'build' || currentSequence.length > 10) {
                if (currentSequence.length > 1) {
                    sequences.push([...currentSequence]);
                }
                currentSequence = [];
            }
        }
        
        // Find common subsequences
        const commonSequences = this.findCommonSubsequences(sequences);
        
        return {
            totalSequences: sequences.length,
            averageSequenceLength: sequences.length > 0 ? 
                sequences.reduce((sum, seq) => sum + seq.length, 0) / sequences.length : 0,
            commonPatterns: commonSequences
        };
    }

    /**
     * Find common subsequences
     */
    private findCommonSubsequences(sequences: string[][]): any[] {
        const subsequenceCounts = new Map<string, number>();
        
        for (const sequence of sequences) {
            for (let i = 0; i < sequence.length - 1; i++) {
                for (let j = i + 2; j <= Math.min(sequence.length, i + 4); j++) {
                    const subseq = sequence.slice(i, j);
                    const key = subseq.join('->');
                    subsequenceCounts.set(key, (subsequenceCounts.get(key) || 0) + 1);
                }
            }
        }
        
        return Array.from(subsequenceCounts.entries())
            .filter(([, count]) => count > 1)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([pattern, count]) => ({ pattern, frequency: count }));
    }

    /**
     * Generate time-based optimizations
     */
    private generateTimeOptimizations(timePatterns: any): WorkflowOptimization[] {
        const optimizations: WorkflowOptimization[] = [];
        
        if (timePatterns && timePatterns.averageTime > 30) {
            optimizations.push({
                type: 'time_saving',
                description: 'Long average task duration detected - consider automation',
                implementation: 'Identify repetitive tasks and create shortcuts or automation',
                impact: Math.min(0.8, timePatterns.averageTime / 60)
            });
        }
        
        if (timePatterns && timePatterns.variance > 100) {
            optimizations.push({
                type: 'time_saving',
                description: 'High time variance suggests inconsistent workflows',
                implementation: 'Standardize procedures to reduce time variability',
                impact: 0.4
            });
        }
        
        return optimizations;
    }

    /**
     * Generate frequency-based optimizations
     */
    private generateFrequencyOptimizations(frequencyPatterns: any): WorkflowOptimization[] {
        const optimizations: WorkflowOptimization[] = [];
        
        if (frequencyPatterns && frequencyPatterns.mostFrequent.length > 0) {
            const topAction = frequencyPatterns.mostFrequent[0];
            
            optimizations.push({
                type: 'automation',
                description: `Most frequent action: ${topAction[0]} (${topAction[1]} times)`,
                implementation: `Consider creating shortcuts or automation for ${topAction[0]}`,
                impact: Math.min(0.6, topAction[1] / 50)
            });
        }
        
        return optimizations;
    }

    /**
     * Generate sequence-based optimizations
     */
    private generateSequenceOptimizations(sequencePatterns: any): WorkflowOptimization[] {
        const optimizations: WorkflowOptimization[] = [];
        
        if (sequencePatterns && sequencePatterns.commonPatterns.length > 0) {
            for (const pattern of sequencePatterns.commonPatterns.slice(0, 3)) {
                optimizations.push({
                    type: 'automation',
                    description: `Common workflow pattern: ${pattern.pattern}`,
                    implementation: `Create macro or shortcut for sequence: ${pattern.pattern}`,
                    impact: Math.min(0.5, pattern.frequency / 20)
                });
            }
        }
        
        return optimizations;
    }

    /**
     * Calculate expected improvement from optimizations
     */
    private calculateExpectedImprovement(optimizations: WorkflowOptimization[], workflowData: any[]): number {
        if (optimizations.length === 0) return 0;
        
        const totalImpact = optimizations.reduce((sum, opt) => sum + opt.impact, 0);
        const averageImpact = totalImpact / optimizations.length;
        
        // Consider data size and optimization diversity
        const dataSizeBonus = Math.min(0.2, workflowData.length / 100);
        const diversityBonus = Math.min(0.1, new Set(optimizations.map(o => o.type)).size / 4);
        
        return Math.min(0.8, averageImpact + dataSizeBonus + diversityBonus);
    }

    /**
     * Calculate optimization confidence
     */
    private calculateOptimizationConfidence(optimizations: WorkflowOptimization[]): number {
        if (optimizations.length === 0) return 0;
        
        const avgImpact = optimizations.reduce((sum, opt) => sum + opt.impact, 0) / optimizations.length;
        const countBonus = Math.min(0.3, optimizations.length / 10);
        
        return Math.min(0.9, avgImpact * 0.7 + countBonus);
    }

    /**
     * Discover quality metric patterns
     */
    private discoverQualityMetricPatterns(qualityData: any[]): any[] {
        const patterns: any[] = [];
        
        // Analyze common quality attributes
        const attributes = this.extractQualityAttributes(qualityData);
        
        for (const [attribute, values] of attributes.entries()) {
            const pattern = this.analyzeAttributePattern(attribute, values);
            if (pattern) {
                patterns.push(pattern);
            }
        }
        
        return patterns;
    }

    /**
     * Extract quality attributes from data
     */
    private extractQualityAttributes(qualityData: any[]): Map<string, number[]> {
        const attributes = new Map<string, number[]>();
        
        for (const item of qualityData) {
            if (typeof item === 'object' && item !== null) {
                for (const [key, value] of Object.entries(item)) {
                    if (typeof value === 'number') {
                        if (!attributes.has(key)) {
                            attributes.set(key, []);
                        }
                        attributes.get(key)!.push(value);
                    }
                }
            }
        }
        
        return attributes;
    }

    /**
     * Analyze pattern for a quality attribute
     */
    private analyzeAttributePattern(attribute: string, values: number[]): any | null {
        if (values.length < 3) return null;
        
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = this.calculateVariance(values);
        const trend = this.calculateTrend(values);
        
        return {
            attribute,
            mean,
            variance,
            trend,
            min: Math.min(...values),
            max: Math.max(...values),
            stability: variance < (mean * 0.1) ? 'stable' : 'variable'
        };
    }

    /**
     * Calculate trend in values
     */
    private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
        if (values.length < 2) return 'stable';
        
        const first = values.slice(0, Math.ceil(values.length / 3));
        const last = values.slice(-Math.ceil(values.length / 3));
        
        const firstAvg = first.reduce((sum, v) => sum + v, 0) / first.length;
        const lastAvg = last.reduce((sum, v) => sum + v, 0) / last.length;
        
        const change = (lastAvg - firstAvg) / firstAvg;
        
        if (change > 0.1) return 'increasing';
        if (change < -0.1) return 'decreasing';
        return 'stable';
    }

    /**
     * Extract quality metrics from patterns
     */
    private extractQualityMetrics(patterns: any[]): any[] {
        return patterns.map(pattern => ({
            name: pattern.attribute,
            averageValue: pattern.mean,
            stability: pattern.stability,
            trend: pattern.trend,
            variability: pattern.variance,
            range: {
                min: pattern.min,
                max: pattern.max
            }
        }));
    }

    /**
     * Calculate metric confidence
     */
    private calculateMetricConfidence(qualityData: any[], metrics: any[]): number {
        if (metrics.length === 0 || qualityData.length === 0) return 0;
        
        const dataSize = qualityData.length;
        const metricCoverage = metrics.length;
        
        // Higher confidence with more data and metrics
        const dataSizeScore = Math.min(0.8, dataSize / 50);
        const coverageScore = Math.min(0.2, metricCoverage / 10);
        
        return dataSizeScore + coverageScore;
    }
}