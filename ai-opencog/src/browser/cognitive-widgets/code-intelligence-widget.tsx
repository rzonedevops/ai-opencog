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

import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { BaseWidget, codicon, Message } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common/nls';
import { Disposable, DisposableCollection } from '@theia/core/lib/common/disposable';
import { RealTimeCodeAnalyzer, AnalysisResult } from '../real-time-analyzer';
import { OpenCogService } from '../../common/opencog-service';
import * as React from '@theia/core/shared/react';

export interface CodeIntelligenceData {
    qualityScore: number;
    complexity: number;
    maintainability: number;
    performance: number;
    issues: Array<{
        type: string;
        severity: 'error' | 'warning' | 'info';
        message: string;
        line?: number;
    }>;
    recommendations: string[];
    patterns: Array<{
        name: string;
        confidence: number;
        description: string;
    }>;
}

@injectable()
export class CodeIntelligenceWidget extends BaseWidget {
    static readonly ID = 'cognitive.code-intelligence';
    static readonly LABEL = nls.localize('theia/ai/cognitive/codeIntelligence', 'Code Intelligence');

    @inject(RealTimeCodeAnalyzer)
    protected readonly realTimeAnalyzer: RealTimeCodeAnalyzer;

    @inject(OpenCogService)
    protected readonly openCogService: OpenCogService;

    protected readonly toDispose = new DisposableCollection();
    protected data: CodeIntelligenceData | undefined;

    @postConstruct()
    protected init(): void {
        this.id = CodeIntelligenceWidget.ID;
        this.title.label = CodeIntelligenceWidget.LABEL;
        this.title.caption = CodeIntelligenceWidget.LABEL;
        this.title.iconClass = codicon('graph');
        this.title.closable = true;

        this.toDispose.push(this.realTimeAnalyzer.onAnalysisCompleted((result: AnalysisResult) => {
            this.updateData(result);
        }));

        this.update();
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.node.focus();
    }

    protected updateData(analysisResult: AnalysisResult): void {
        this.data = {
            qualityScore: Math.round(analysisResult.qualityMetrics.score * 100),
            complexity: Math.round(analysisResult.qualityMetrics.complexity * 100),
            maintainability: Math.round(analysisResult.qualityMetrics.maintainability * 100),
            performance: Math.round(analysisResult.qualityMetrics.performance * 100),
            issues: analysisResult.issues.map(issue => ({
                type: issue.type,
                severity: issue.severity as 'error' | 'warning' | 'info',
                message: issue.message,
                line: issue.line
            })),
            recommendations: analysisResult.recommendations.slice(0, 5), // Limit to 5 recommendations
            patterns: analysisResult.patterns.map(pattern => ({
                name: pattern.name || 'Unknown Pattern',
                confidence: pattern.confidence || 0.5,
                description: pattern.description || 'Pattern detected'
            })).slice(0, 3) // Limit to 3 patterns
        };
        this.update();
    }

    protected render(): React.ReactNode {
        if (!this.data) {
            return (
                <div className='cognitive-intelligence-widget loading'>
                    <div className='analysis-section'>
                        <div className='loading-message'>
                            <i className={codicon('loading')} />
                            <span>Analyzing code with cognitive intelligence...</span>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className='cognitive-intelligence-widget'>
                <div className='metrics-section'>
                    <h3 className='section-title'>
                        <i className={codicon('dashboard')} />
                        Quality Metrics
                    </h3>
                    <div className='metrics-grid'>
                        <div className='metric-item'>
                            <span className='metric-label'>Quality</span>
                            <div className='metric-bar'>
                                <div 
                                    className={`metric-fill ${this.getQualityClass(this.data.qualityScore)}`}
                                    style={{ width: `${this.data.qualityScore}%` }}
                                />
                                <span className='metric-value'>{this.data.qualityScore}%</span>
                            </div>
                        </div>
                        <div className='metric-item'>
                            <span className='metric-label'>Complexity</span>
                            <div className='metric-bar'>
                                <div 
                                    className={`metric-fill ${this.getComplexityClass(this.data.complexity)}`}
                                    style={{ width: `${this.data.complexity}%` }}
                                />
                                <span className='metric-value'>{this.data.complexity}%</span>
                            </div>
                        </div>
                        <div className='metric-item'>
                            <span className='metric-label'>Maintainability</span>
                            <div className='metric-bar'>
                                <div 
                                    className={`metric-fill ${this.getQualityClass(this.data.maintainability)}`}
                                    style={{ width: `${this.data.maintainability}%` }}
                                />
                                <span className='metric-value'>{this.data.maintainability}%</span>
                            </div>
                        </div>
                        <div className='metric-item'>
                            <span className='metric-label'>Performance</span>
                            <div className='metric-bar'>
                                <div 
                                    className={`metric-fill ${this.getQualityClass(this.data.performance)}`}
                                    style={{ width: `${this.data.performance}%` }}
                                />
                                <span className='metric-value'>{this.data.performance}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {this.data.issues.length > 0 && (
                    <div className='issues-section'>
                        <h3 className='section-title'>
                            <i className={codicon('warning')} />
                            Issues ({this.data.issues.length})
                        </h3>
                        <div className='issues-list'>
                            {this.data.issues.map((issue, index) => (
                                <div key={index} className={`issue-item ${issue.severity}`}>
                                    <i className={codicon(this.getIssueIcon(issue.severity))} />
                                    <div className='issue-content'>
                                        <span className='issue-message'>{issue.message}</span>
                                        {issue.line && <span className='issue-line'>Line {issue.line}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {this.data.recommendations.length > 0 && (
                    <div className='recommendations-section'>
                        <h3 className='section-title'>
                            <i className={codicon('lightbulb')} />
                            AI Recommendations
                        </h3>
                        <div className='recommendations-list'>
                            {this.data.recommendations.map((recommendation, index) => (
                                <div key={index} className='recommendation-item'>
                                    <i className={codicon('arrow-right')} />
                                    <span>{recommendation}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {this.data.patterns.length > 0 && (
                    <div className='patterns-section'>
                        <h3 className='section-title'>
                            <i className={codicon('graph')} />
                            Detected Patterns
                        </h3>
                        <div className='patterns-list'>
                            {this.data.patterns.map((pattern, index) => (
                                <div key={index} className='pattern-item'>
                                    <div className='pattern-header'>
                                        <span className='pattern-name'>{pattern.name}</span>
                                        <span className='pattern-confidence'>{Math.round(pattern.confidence * 100)}%</span>
                                    </div>
                                    <p className='pattern-description'>{pattern.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    protected getQualityClass(score: number): string {
        if (score >= 80) return 'good';
        if (score >= 60) return 'medium';
        return 'poor';
    }

    protected getComplexityClass(complexity: number): string {
        if (complexity <= 30) return 'good';
        if (complexity <= 60) return 'medium';
        return 'poor';
    }

    protected getIssueIcon(severity: string): string {
        switch (severity) {
            case 'error': return 'error';
            case 'warning': return 'warning';
            case 'info': return 'info';
            default: return 'circle-outline';
        }
    }

    dispose(): void {
        super.dispose();
        this.toDispose.dispose();
    }
}