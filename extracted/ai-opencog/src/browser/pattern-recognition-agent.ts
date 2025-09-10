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
import { OpenCogService } from '../common/opencog-service';
import { PatternInput, PatternResult, Atom } from '../common/opencog-types';

/**
 * Pattern Recognition Agent for code pattern detection,
 * behavioral pattern analysis, and project evolution tracking
 */
@injectable()
export class PatternRecognitionAgent extends Agent {

    constructor(
        @inject(OpenCogService) private readonly opencog: OpenCogService
    ) {
        super('pattern-recognition', 'Pattern Recognition Agent', 'Detects code patterns, behaviors, and project evolution');
    }

    /**
     * Detect code patterns in source code
     */
    async detectCodePatterns(code: string, fileUri: string): Promise<PatternResult[]> {
        const patternInput: PatternInput = {
            data: code,
            context: {
                fileUri,
                language: this.detectLanguage(fileUri),
                timestamp: Date.now()
            },
            scope: 'file',
            options: {
                maxResults: 10,
                minConfidence: 0.5,
                patternTypes: ['design-pattern', 'anti-pattern', 'code-smell']
            }
        };

        return await this.opencog.recognizePatterns(patternInput);
    }

    /**
     * Analyze behavioral patterns in development workflow
     */
    async analyzeBehavioralPatterns(actions: Array<{action: string, timestamp: number, context: any}>): Promise<PatternResult[]> {
        const behaviorData = JSON.stringify(actions);
        
        const patternInput: PatternInput = {
            data: behaviorData,
            context: {
                type: 'behavioral',
                timespan: this.calculateTimespan(actions),
                actionCount: actions.length
            },
            scope: 'session',
            options: {
                maxResults: 5,
                minConfidence: 0.3,
                patternTypes: ['workflow-pattern', 'usage-pattern']
            }
        };

        return await this.opencog.recognizePatterns(patternInput);
    }

    /**
     * Track project evolution patterns over time
     */
    async trackProjectEvolution(commitHistory: Array<{hash: string, message: string, timestamp: number, files: string[]}>): Promise<PatternResult[]> {
        const evolutionData = this.prepareEvolutionData(commitHistory);
        
        const patternInput: PatternInput = {
            data: JSON.stringify(evolutionData),
            context: {
                type: 'evolution',
                timespan: this.calculateCommitTimespan(commitHistory),
                commitCount: commitHistory.length
            },
            scope: 'project',
            options: {
                maxResults: 8,
                minConfidence: 0.4,
                patternTypes: ['growth-pattern', 'refactoring-pattern', 'maintenance-pattern']
            }
        };

        return await this.opencog.recognizePatterns(patternInput);
    }

    /**
     * Generate pattern-based recommendations
     */
    async generatePatternRecommendations(patterns: PatternResult[]): Promise<string[]> {
        const recommendations: string[] = [];

        for (const pattern of patterns) {
            switch (pattern.pattern.type) {
                case 'design-pattern':
                    if (pattern.confidence > 0.7) {
                        recommendations.push(`Strong ${pattern.pattern.name} pattern detected. Consider documenting this pattern for team awareness.`);
                    }
                    break;
                case 'anti-pattern':
                    recommendations.push(`Anti-pattern "${pattern.pattern.name}" detected. Consider refactoring to improve code quality.`);
                    break;
                case 'code-smell':
                    recommendations.push(`Code smell "${pattern.pattern.name}" found. Review for potential improvements.`);
                    break;
                case 'workflow-pattern':
                    recommendations.push(`Workflow pattern "${pattern.pattern.name}" identified. This could be automated or optimized.`);
                    break;
                case 'growth-pattern':
                    recommendations.push(`Project growth pattern shows "${pattern.pattern.name}". Plan accordingly for scaling.`);
                    break;
            }
        }

        return recommendations;
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

    private calculateTimespan(actions: Array<{timestamp: number}>): number {
        if (actions.length < 2) return 0;
        const sorted = actions.sort((a, b) => a.timestamp - b.timestamp);
        return sorted[sorted.length - 1].timestamp - sorted[0].timestamp;
    }

    private calculateCommitTimespan(commits: Array<{timestamp: number}>): number {
        if (commits.length < 2) return 0;
        const sorted = commits.sort((a, b) => a.timestamp - b.timestamp);
        return sorted[sorted.length - 1].timestamp - sorted[0].timestamp;
    }

    private prepareEvolutionData(commitHistory: Array<{hash: string, message: string, timestamp: number, files: string[]}>) {
        return {
            totalCommits: commitHistory.length,
            averageFilesPerCommit: commitHistory.reduce((sum, c) => sum + c.files.length, 0) / commitHistory.length,
            messagePatterns: this.extractMessagePatterns(commitHistory.map(c => c.message)),
            fileChangeFrequency: this.calculateFileChangeFrequency(commitHistory)
        };
    }

    private extractMessagePatterns(messages: string[]): {[pattern: string]: number} {
        const patterns: {[pattern: string]: number} = {};
        const commonPrefixes = ['feat:', 'fix:', 'docs:', 'style:', 'refactor:', 'test:', 'chore:'];
        
        for (const message of messages) {
            for (const prefix of commonPrefixes) {
                if (message.toLowerCase().indexOf(prefix) === 0) {
                    patterns[prefix] = (patterns[prefix] || 0) + 1;
                    break;
                }
            }
        }
        
        return patterns;
    }

    private calculateFileChangeFrequency(commitHistory: Array<{files: string[]}>): {[file: string]: number} {
        const frequency: {[file: string]: number} = {};
        
        for (const commit of commitHistory) {
            for (const file of commit.files) {
                frequency[file] = (frequency[file] || 0) + 1;
            }
        }
        
        return frequency;
    }
}