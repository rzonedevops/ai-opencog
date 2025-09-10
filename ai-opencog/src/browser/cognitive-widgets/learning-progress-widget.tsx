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
import { UserBehaviorLearningAgent } from '../user-behavior-learning-agent';
import { LearningAgent } from '../enhanced-learning-agent';
import { OpenCogService } from '../../common/opencog-service';
import * as React from '@theia/core/shared/react';

export interface LearningProgressData {
    overallProgress: number;
    learningAreas: Array<{
        name: string;
        progress: number;
        confidence: number;
        lastUpdated: string;
        category: 'coding' | 'behavior' | 'patterns' | 'preferences';
    }>;
    recentLearnings: Array<{
        timestamp: string;
        description: string;
        impact: 'high' | 'medium' | 'low';
        category: string;
    }>;
    adaptationStrategies: Array<{
        name: string;
        description: string;
        effectiveness: number;
        active: boolean;
    }>;
    learningStats: {
        totalInteractions: number;
        patternsLearned: number;
        adaptationsMade: number;
        accuracyImprovement: number;
    };
}

@injectable()
export class LearningProgressWidget extends BaseWidget {
    static readonly ID = 'cognitive.learning-progress';
    static readonly LABEL = nls.localize('theia/ai/cognitive/learningProgress', 'Learning Progress');

    @inject(UserBehaviorLearningAgent)
    protected readonly userBehaviorAgent: UserBehaviorLearningAgent;

    @inject(LearningAgent)
    protected readonly learningAgent: LearningAgent;

    @inject(OpenCogService)
    protected readonly openCogService: OpenCogService;

    protected readonly toDispose = new DisposableCollection();
    protected data: LearningProgressData | undefined;
    private updateInterval: NodeJS.Timeout | undefined;

    @postConstruct()
    protected init(): void {
        this.id = LearningProgressWidget.ID;
        this.title.label = LearningProgressWidget.LABEL;
        this.title.caption = LearningProgressWidget.LABEL;
        this.title.iconClass = codicon('graph-line');
        this.title.closable = true;

        this.startPeriodicUpdates();
        this.update();
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.node.focus();
        this.refreshLearningData();
    }

    protected startPeriodicUpdates(): void {
        this.refreshLearningData();
        this.updateInterval = setInterval(() => {
            this.refreshLearningData();
        }, 30000); // Update every 30 seconds
    }

    protected async refreshLearningData(): Promise<void> {
        try {
            // Simulate getting learning progress data from cognitive services
            this.data = {
                overallProgress: 75,
                learningAreas: [
                    {
                        name: 'Code Patterns',
                        progress: 85,
                        confidence: 0.92,
                        lastUpdated: '2 minutes ago',
                        category: 'coding'
                    },
                    {
                        name: 'User Behavior',
                        progress: 70,
                        confidence: 0.78,
                        lastUpdated: '5 minutes ago',
                        category: 'behavior'
                    },
                    {
                        name: 'Preferences',
                        progress: 65,
                        confidence: 0.85,
                        lastUpdated: '1 minute ago',
                        category: 'preferences'
                    },
                    {
                        name: 'Development Patterns',
                        progress: 80,
                        confidence: 0.88,
                        lastUpdated: '3 minutes ago',
                        category: 'patterns'
                    }
                ],
                recentLearnings: [
                    {
                        timestamp: '2 minutes ago',
                        description: 'Learned preference for functional programming style',
                        impact: 'medium',
                        category: 'Coding Style'
                    },
                    {
                        timestamp: '5 minutes ago',
                        description: 'Adapted to frequent refactoring workflow',
                        impact: 'high',
                        category: 'Workflow'
                    },
                    {
                        timestamp: '8 minutes ago',
                        description: 'Recognized pattern in error handling approach',
                        impact: 'medium',
                        category: 'Patterns'
                    }
                ],
                adaptationStrategies: [
                    {
                        name: 'Code Suggestion Personalization',
                        description: 'Tailored suggestions based on coding style',
                        effectiveness: 0.89,
                        active: true
                    },
                    {
                        name: 'Workflow Optimization',
                        description: 'Adaptive assistance based on work patterns',
                        effectiveness: 0.76,
                        active: true
                    },
                    {
                        name: 'Context-Aware Help',
                        description: 'Contextual assistance based on current task',
                        effectiveness: 0.82,
                        active: false
                    }
                ],
                learningStats: {
                    totalInteractions: 1247,
                    patternsLearned: 38,
                    adaptationsMade: 156,
                    accuracyImprovement: 23.5
                }
            };
            this.update();
        } catch (error) {
            console.error('Failed to refresh learning data:', error);
        }
    }

    protected render(): React.ReactNode {
        if (!this.data) {
            return (
                <div className='learning-progress-widget loading'>
                    <div className='loading-section'>
                        <div className='loading-message'>
                            <i className={codicon('loading')} />
                            <span>Loading learning progress...</span>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className='learning-progress-widget'>
                {/* Overall Progress */}
                <div className='progress-overview'>
                    <h3 className='section-title'>
                        <i className={codicon('graph-line')} />
                        Overall Learning Progress
                    </h3>
                    <div className='overall-progress'>
                        <div className='progress-circle'>
                            <svg viewBox="0 0 36 36" className="circular-chart">
                                <path
                                    className="circle-bg"
                                    d="M18 2.0845
                                      a 15.9155 15.9155 0 0 1 0 31.831
                                      a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className="circle"
                                    strokeDasharray={`${this.data.overallProgress}, 100`}
                                    d="M18 2.0845
                                      a 15.9155 15.9155 0 0 1 0 31.831
                                      a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <text x="18" y="20.35" className="percentage">{this.data.overallProgress}%</text>
                            </svg>
                        </div>
                        <div className='progress-stats'>
                            <div className='stat-item'>
                                <span className='stat-value'>{this.data.learningStats.totalInteractions}</span>
                                <span className='stat-label'>Interactions</span>
                            </div>
                            <div className='stat-item'>
                                <span className='stat-value'>{this.data.learningStats.patternsLearned}</span>
                                <span className='stat-label'>Patterns Learned</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Learning Areas */}
                <div className='learning-areas'>
                    <h3 className='section-title'>
                        <i className={codicon('organization')} />
                        Learning Areas
                    </h3>
                    <div className='areas-list'>
                        {this.data.learningAreas.map((area, index) => (
                            <div key={index} className='area-item'>
                                <div className='area-header'>
                                    <span className='area-name'>{area.name}</span>
                                    <span className='area-category'>{area.category}</span>
                                    <span className='area-updated'>{area.lastUpdated}</span>
                                </div>
                                <div className='area-progress'>
                                    <div className='progress-bar'>
                                        <div 
                                            className='progress-fill'
                                            style={{ width: `${area.progress}%` }}
                                        />
                                    </div>
                                    <span className='progress-text'>{area.progress}%</span>
                                </div>
                                <div className='area-confidence'>
                                    <i className={codicon('verified')} />
                                    <span>Confidence: {Math.round(area.confidence * 100)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Learnings */}
                <div className='recent-learnings'>
                    <h3 className='section-title'>
                        <i className={codicon('history')} />
                        Recent Learnings
                    </h3>
                    <div className='learnings-list'>
                        {this.data.recentLearnings.map((learning, index) => (
                            <div key={index} className={`learning-item impact-${learning.impact}`}>
                                <div className='learning-timestamp'>{learning.timestamp}</div>
                                <div className='learning-content'>
                                    <span className='learning-description'>{learning.description}</span>
                                    <div className='learning-meta'>
                                        <span className='learning-category'>{learning.category}</span>
                                        <span className={`learning-impact impact-${learning.impact}`}>
                                            {learning.impact} impact
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Adaptation Strategies */}
                <div className='adaptation-strategies'>
                    <h3 className='section-title'>
                        <i className={codicon('settings-gear')} />
                        Adaptation Strategies
                    </h3>
                    <div className='strategies-list'>
                        {this.data.adaptationStrategies.map((strategy, index) => (
                            <div key={index} className='strategy-item'>
                                <div className='strategy-header'>
                                    <div className='strategy-name-status'>
                                        <span className='strategy-name'>{strategy.name}</span>
                                        <span className={`strategy-status ${strategy.active ? 'active' : 'inactive'}`}>
                                            <i className={codicon(strategy.active ? 'check' : 'circle-outline')} />
                                            {strategy.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <span className='strategy-effectiveness'>
                                        {Math.round(strategy.effectiveness * 100)}% effective
                                    </span>
                                </div>
                                <p className='strategy-description'>{strategy.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    dispose(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        super.dispose();
        this.toDispose.dispose();
    }
}