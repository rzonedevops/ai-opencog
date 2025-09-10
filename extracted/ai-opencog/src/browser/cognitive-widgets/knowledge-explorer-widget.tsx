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
import { KnowledgeManagementService } from '../../common/knowledge-management-service';
import { OpenCogService } from '../../common/opencog-service';
import * as React from '@theia/core/shared/react';

export interface KnowledgeNode {
    id: string;
    name: string;
    type: 'concept' | 'relationship' | 'pattern' | 'file' | 'function' | 'class';
    strength: number;
    confidence: number;
    connections: string[];
    properties: Record<string, any>;
    description?: string;
}

export interface KnowledgeGraph {
    nodes: KnowledgeNode[];
    relationships: Array<{
        from: string;
        to: string;
        type: string;
        strength: number;
    }>;
}

export interface QueryResult {
    query: string;
    results: KnowledgeNode[];
    relevanceScore: number;
    timestamp: string;
}

@injectable()
export class KnowledgeExplorerWidget extends BaseWidget {
    static readonly ID = 'cognitive.knowledge-explorer';
    static readonly LABEL = nls.localize('theia/ai/cognitive/knowledgeExplorer', 'Knowledge Explorer');

    @inject(KnowledgeManagementService)
    protected readonly knowledgeService: KnowledgeManagementService;

    @inject(OpenCogService)
    protected readonly openCogService: OpenCogService;

    protected readonly toDispose = new DisposableCollection();
    protected knowledgeGraph: KnowledgeGraph | undefined;
    protected selectedNode: KnowledgeNode | undefined;
    protected searchQuery: string = '';
    protected queryResults: QueryResult[] = [];
    protected viewMode: 'graph' | 'list' | 'search' = 'graph';

    @postConstruct()
    protected init(): void {
        this.id = KnowledgeExplorerWidget.ID;
        this.title.label = KnowledgeExplorerWidget.LABEL;
        this.title.caption = KnowledgeExplorerWidget.LABEL;
        this.title.iconClass = codicon('graph-scatter');
        this.title.closable = true;

        this.loadKnowledgeGraph();
        this.update();
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.node.focus();
    }

    protected async loadKnowledgeGraph(): Promise<void> {
        try {
            // Simulate loading knowledge graph from OpenCog AtomSpace
            this.knowledgeGraph = {
                nodes: [
                    {
                        id: 'node-1',
                        name: 'React Component',
                        type: 'concept',
                        strength: 0.9,
                        confidence: 0.85,
                        connections: ['node-2', 'node-3'],
                        properties: { language: 'typescript', framework: 'react' },
                        description: 'Reusable UI component in React framework'
                    },
                    {
                        id: 'node-2',
                        name: 'State Management',
                        type: 'pattern',
                        strength: 0.8,
                        confidence: 0.92,
                        connections: ['node-1', 'node-4'],
                        properties: { complexity: 'medium', usage: 'frequent' },
                        description: 'Pattern for managing component state'
                    },
                    {
                        id: 'node-3',
                        name: 'BaseWidget',
                        type: 'class',
                        strength: 0.95,
                        confidence: 0.98,
                        connections: ['node-1'],
                        properties: { package: '@theia/core', inheritance: 'Widget' },
                        description: 'Base class for Theia widgets'
                    },
                    {
                        id: 'node-4',
                        name: 'Event Handling',
                        type: 'concept',
                        strength: 0.7,
                        confidence: 0.78,
                        connections: ['node-2', 'node-5'],
                        properties: { complexity: 'low', frequency: 'high' },
                        description: 'Pattern for handling user interactions'
                    },
                    {
                        id: 'node-5',
                        name: 'Disposable Pattern',
                        type: 'pattern',
                        strength: 0.85,
                        confidence: 0.88,
                        connections: ['node-4'],
                        properties: { purpose: 'resource-management' },
                        description: 'Pattern for proper resource cleanup'
                    }
                ],
                relationships: [
                    { from: 'node-1', to: 'node-2', type: 'uses', strength: 0.8 },
                    { from: 'node-1', to: 'node-3', type: 'extends', strength: 0.9 },
                    { from: 'node-2', to: 'node-4', type: 'implements', strength: 0.7 },
                    { from: 'node-4', to: 'node-5', type: 'requires', strength: 0.6 }
                ]
            };
            this.update();
        } catch (error) {
            console.error('Failed to load knowledge graph:', error);
        }
    }

    protected async searchKnowledge(query: string): Promise<void> {
        if (!query.trim()) return;

        try {
            // Simulate knowledge search
            const results = this.knowledgeGraph?.nodes.filter(node => 
                node.name.toLowerCase().includes(query.toLowerCase()) ||
                node.description?.toLowerCase().includes(query.toLowerCase()) ||
                Object.values(node.properties).some(prop => 
                    String(prop).toLowerCase().includes(query.toLowerCase())
                )
            ) || [];

            const queryResult: QueryResult = {
                query,
                results,
                relevanceScore: results.length > 0 ? 0.85 : 0,
                timestamp: new Date().toLocaleTimeString()
            };

            this.queryResults = [queryResult, ...this.queryResults.slice(0, 4)]; // Keep last 5 searches
            this.update();
        } catch (error) {
            console.error('Failed to search knowledge:', error);
        }
    }

    protected selectNode(node: KnowledgeNode): void {
        this.selectedNode = node;
        this.update();
    }

    protected getNodeIcon(type: string): string {
        switch (type) {
            case 'concept': return 'lightbulb';
            case 'relationship': return 'arrow-both';
            case 'pattern': return 'symbol-pattern';
            case 'file': return 'file';
            case 'function': return 'symbol-function';
            case 'class': return 'symbol-class';
            default: return 'circle-outline';
        }
    }

    protected getStrengthColor(strength: number): string {
        if (strength >= 0.8) return 'strong';
        if (strength >= 0.6) return 'medium';
        return 'weak';
    }

    protected render(): React.ReactNode {
        return (
            <div className='knowledge-explorer-widget'>
                {/* Toolbar */}
                <div className='explorer-toolbar'>
                    <div className='view-controls'>
                        <button 
                            className={`view-button ${this.viewMode === 'graph' ? 'active' : ''}`}
                            onClick={() => { this.viewMode = 'graph'; this.update(); }}
                        >
                            <i className={codicon('graph-scatter')} />
                            Graph
                        </button>
                        <button 
                            className={`view-button ${this.viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => { this.viewMode = 'list'; this.update(); }}
                        >
                            <i className={codicon('list-tree')} />
                            List
                        </button>
                        <button 
                            className={`view-button ${this.viewMode === 'search' ? 'active' : ''}`}
                            onClick={() => { this.viewMode = 'search'; this.update(); }}
                        >
                            <i className={codicon('search')} />
                            Search
                        </button>
                    </div>
                    
                    <div className='search-controls'>
                        <input
                            type='text'
                            placeholder='Search knowledge...'
                            value={this.searchQuery}
                            onChange={(e) => {
                                this.searchQuery = e.target.value;
                                if (e.target.value) {
                                    this.searchKnowledge(e.target.value);
                                }
                                this.update();
                            }}
                            className='search-input'
                        />
                        <button 
                            onClick={() => this.searchKnowledge(this.searchQuery)}
                            className='search-button'
                        >
                            <i className={codicon('search')} />
                        </button>
                    </div>
                </div>

                <div className='explorer-content'>
                    {this.viewMode === 'graph' && this.renderGraphView()}
                    {this.viewMode === 'list' && this.renderListView()}
                    {this.viewMode === 'search' && this.renderSearchView()}
                </div>

                {/* Node Details Panel */}
                {this.selectedNode && this.renderNodeDetails()}
            </div>
        );
    }

    protected renderGraphView(): React.ReactNode {
        if (!this.knowledgeGraph) {
            return (
                <div className='loading-message'>
                    <i className={codicon('loading')} />
                    <span>Loading knowledge graph...</span>
                </div>
            );
        }

        return (
            <div className='graph-view'>
                <div className='graph-canvas'>
                    <div className='graph-nodes'>
                        {this.knowledgeGraph.nodes.map(node => (
                            <div
                                key={node.id}
                                className={`graph-node ${this.getStrengthColor(node.strength)} ${this.selectedNode?.id === node.id ? 'selected' : ''}`}
                                onClick={() => this.selectNode(node)}
                                style={{
                                    left: `${Math.random() * 60 + 20}%`,
                                    top: `${Math.random() * 60 + 20}%`
                                }}
                            >
                                <i className={codicon(this.getNodeIcon(node.type))} />
                                <span className='node-label'>{node.name}</span>
                                <div className='node-strength'>
                                    {Math.round(node.strength * 100)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    protected renderListView(): React.ReactNode {
        if (!this.knowledgeGraph) return null;

        return (
            <div className='list-view'>
                <div className='nodes-list'>
                    {this.knowledgeGraph.nodes.map(node => (
                        <div
                            key={node.id}
                            className={`node-item ${this.selectedNode?.id === node.id ? 'selected' : ''}`}
                            onClick={() => this.selectNode(node)}
                        >
                            <div className='node-header'>
                                <div className='node-info'>
                                    <i className={codicon(this.getNodeIcon(node.type))} />
                                    <span className='node-name'>{node.name}</span>
                                    <span className='node-type'>{node.type}</span>
                                </div>
                                <div className='node-metrics'>
                                    <span className={`strength ${this.getStrengthColor(node.strength)}`}>
                                        {Math.round(node.strength * 100)}%
                                    </span>
                                    <span className='confidence'>
                                        {Math.round(node.confidence * 100)}%
                                    </span>
                                </div>
                            </div>
                            {node.description && (
                                <p className='node-description'>{node.description}</p>
                            )}
                            <div className='node-connections'>
                                <i className={codicon('references')} />
                                {node.connections.length} connections
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    protected renderSearchView(): React.ReactNode {
        return (
            <div className='search-view'>
                {this.queryResults.length === 0 ? (
                    <div className='no-results'>
                        <i className={codicon('search')} />
                        <span>Enter a search query to explore knowledge</span>
                    </div>
                ) : (
                    <div className='search-results'>
                        {this.queryResults.map((result, index) => (
                            <div key={index} className='query-result'>
                                <div className='result-header'>
                                    <span className='query-text'>"{result.query}"</span>
                                    <span className='result-meta'>
                                        {result.results.length} results • {result.timestamp}
                                    </span>
                                </div>
                                <div className='result-nodes'>
                                    {result.results.map(node => (
                                        <div
                                            key={node.id}
                                            className='result-node'
                                            onClick={() => this.selectNode(node)}
                                        >
                                            <i className={codicon(this.getNodeIcon(node.type))} />
                                            <span className='node-name'>{node.name}</span>
                                            <span className='node-type'>{node.type}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    protected renderNodeDetails(): React.ReactNode {
        const node = this.selectedNode!;
        const connectedNodes = this.knowledgeGraph?.nodes.filter(n => 
            node.connections.includes(n.id)
        ) || [];

        return (
            <div className='node-details-panel'>
                <div className='details-header'>
                    <h3>
                        <i className={codicon(this.getNodeIcon(node.type))} />
                        {node.name}
                    </h3>
                    <button 
                        className='close-button'
                        onClick={() => { this.selectedNode = undefined; this.update(); }}
                    >
                        <i className={codicon('close')} />
                    </button>
                </div>

                <div className='details-content'>
                    <div className='node-metrics'>
                        <div className='metric'>
                            <span className='label'>Strength:</span>
                            <span className={`value ${this.getStrengthColor(node.strength)}`}>
                                {Math.round(node.strength * 100)}%
                            </span>
                        </div>
                        <div className='metric'>
                            <span className='label'>Confidence:</span>
                            <span className='value'>{Math.round(node.confidence * 100)}%</span>
                        </div>
                        <div className='metric'>
                            <span className='label'>Type:</span>
                            <span className='value'>{node.type}</span>
                        </div>
                    </div>

                    {node.description && (
                        <div className='node-description'>
                            <h4>Description</h4>
                            <p>{node.description}</p>
                        </div>
                    )}

                    <div className='node-properties'>
                        <h4>Properties</h4>
                        <div className='properties-list'>
                            {Object.entries(node.properties).map(([key, value]) => (
                                <div key={key} className='property-item'>
                                    <span className='property-key'>{key}:</span>
                                    <span className='property-value'>{String(value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {connectedNodes.length > 0 && (
                        <div className='connected-nodes'>
                            <h4>Connected Nodes</h4>
                            <div className='connections-list'>
                                {connectedNodes.map(connectedNode => (
                                    <div
                                        key={connectedNode.id}
                                        className='connection-item'
                                        onClick={() => this.selectNode(connectedNode)}
                                    >
                                        <i className={codicon(this.getNodeIcon(connectedNode.type))} />
                                        <span className='connection-name'>{connectedNode.name}</span>
                                        <span className='connection-type'>{connectedNode.type}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    dispose(): void {
        super.dispose();
        this.toDispose.dispose();
    }
}