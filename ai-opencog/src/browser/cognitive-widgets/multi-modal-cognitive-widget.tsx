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

import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { DisposableCollection } from '@theia/core';
import { OpenCogService } from '../../common';
import * as React from '@theia/core/shared/react';
import {
    MultiModalData,
    MultiModalPatternInput,
    ModalityType,
    TensorData,
    TextData,
    ImageData,
    AudioData
} from '../../common/opencog-types';

const { useState, useEffect, useCallback } = React;

/**
 * Multi-Modal Cognitive Processing Widget for Phase 5 advanced features.
 * Provides interface for processing text, image, audio, and tensor data with 4 DoF.
 */
@injectable()
export class MultiModalCognitiveWidget extends ReactWidget {

    static readonly ID = 'multi-modal-cognitive-widget';
    static readonly LABEL = 'Multi-Modal Cognitive Processing';

    protected readonly toDispose = new DisposableCollection();

    @inject(OpenCogService)
    protected readonly openCogService: OpenCogService;

    @postConstruct()
    protected init(): void {
        this.id = MultiModalCognitiveWidget.ID;
        this.title.label = MultiModalCognitiveWidget.LABEL;
        this.title.caption = 'Multi-modal cognitive processing and pattern recognition';
        this.title.closable = true;
        this.title.iconClass = 'fa fa-brain'; // Brain icon for cognitive processing
        this.update();
    }

    protected onCloseRequest(): void {
        this.toDispose.dispose();
        super.onCloseRequest();
    }

    protected render(): React.ReactNode {
        return <MultiModalCognitiveComponent openCogService={this.openCogService} />;
    }
}

interface MultiModalCognitiveComponentProps {
    openCogService: OpenCogService;
}

const MultiModalCognitiveComponent: React.FC<MultiModalCognitiveComponentProps> = ({ openCogService }) => {
    const [selectedModality, setSelectedModality] = useState<ModalityType>('text');
    const [processingData, setProcessingData] = useState<MultiModalData[]>([]);
    const [processingResults, setProcessingResults] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [tensorShape, setTensorShape] = useState<[number, number, number, number]>([1, 28, 28, 1]);
    const [attentionType, setAttentionType] = useState<'spatial' | 'temporal' | 'cross-modal' | 'cognitive'>('cognitive');

    // Load statistics on component mount
    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = useCallback(async () => {
        try {
            const stats = await openCogService.getMultiModalLearningStats();
            setStats(stats);
        } catch (error) {
            console.error('Error loading multi-modal stats:', error);
        }
    }, [openCogService]);

    const handleAddModalData = useCallback(async () => {
        const modalData: MultiModalData = {
            id: `modal_${Date.now()}`,
            type: selectedModality,
            content: createModalContent(selectedModality, tensorShape),
            timestamp: Date.now()
        };

        setProcessingData(prev => [...prev, modalData]);
    }, [selectedModality, tensorShape]);

    const handleProcessBatch = useCallback(async () => {
        if (processingData.length === 0) return;

        setIsProcessing(true);
        try {
            // Process the multi-modal data
            const processed = await openCogService.processMultiModalBatch(processingData);
            
            // Recognize patterns
            const patterns = await openCogService.recognizeMultiModalPatterns({
                data: processed,
                options: {
                    crossModal: processed.length > 1,
                    fusionStrategy: 'attention',
                    maxResults: 10
                }
            });

            // Analyze context
            const context = await openCogService.analyzeMultiModalContext(processed);

            // Apply attention mechanism
            const attention = await openCogService.applyAttentionMechanism(processed, attentionType);

            setProcessingResults([
                { type: 'Processed Data', data: processed },
                { type: 'Pattern Recognition', data: patterns },
                { type: 'Context Analysis', data: context },
                { type: 'Attention Analysis', data: attention }
            ]);

            // Update stats
            await loadStats();
        } catch (error) {
            console.error('Error processing multi-modal data:', error);
        } finally {
            setIsProcessing(false);
        }
    }, [processingData, openCogService, attentionType, loadStats]);

    const handleClearData = useCallback(() => {
        setProcessingData([]);
        setProcessingResults([]);
    }, []);

    const handleTensorOperation = useCallback(async () => {
        if (processingData.length === 0) return;

        const tensorData = processingData.find(d => d.type === 'tensor');
        if (!tensorData) return;

        setIsProcessing(true);
        try {
            const processed = await openCogService.performTensorOperation(
                tensorData.content as TensorData,
                'attention',
                { attention: 'softmax' }
            );

            setProcessingResults(prev => [...prev, {
                type: 'Tensor Operation Result',
                data: processed
            }]);
        } catch (error) {
            console.error('Error performing tensor operation:', error);
        } finally {
            setIsProcessing(false);
        }
    }, [processingData, openCogService]);

    return (
        <div className="multi-modal-cognitive-container" style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
            <div className="header-section" style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#007ACC', marginBottom: '8px' }}>
                    🧠 Multi-Modal Cognitive Processing
                </h3>
                <p style={{ fontSize: '14px', color: '#6A6A6A', marginBottom: '16px' }}>
                    Process and analyze text, image, audio, and tensor data with 4 degrees of freedom. 
                    Supports cross-modal pattern recognition and attention mechanisms.
                </p>
                
                {stats && (
                    <div className="stats-section" style={{ 
                        background: '#F8F9FA', 
                        padding: '12px', 
                        borderRadius: '6px',
                        marginBottom: '16px'
                    }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Processing Statistics</h4>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
                            <span>📊 Total Records: {stats.totalMultiModalRecords}</span>
                            <span>🔄 Cross-Modal Patterns: {stats.crossModalPatterns}</span>
                            <span>📈 Text Accuracy: {(stats.processingAccuracy.text * 100).toFixed(1)}%</span>
                            <span>🖼️ Image Accuracy: {(stats.processingAccuracy.image * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="input-section" style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '12px', fontSize: '16px' }}>Add Multi-Modal Data</h4>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                    <label>Modality:</label>
                    <select 
                        value={selectedModality} 
                        onChange={(e) => setSelectedModality(e.target.value as ModalityType)}
                        style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #CCC' }}
                    >
                        <option value="text">📝 Text</option>
                        <option value="image">🖼️ Image</option>
                        <option value="audio">🔊 Audio</option>
                        <option value="tensor">🧮 Tensor (4 DoF)</option>
                        <option value="mixed">🔀 Mixed</option>
                    </select>

                    {selectedModality === 'tensor' && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <label>Shape:</label>
                            <input
                                type="text"
                                value={tensorShape.join(',')}
                                onChange={(e) => {
                                    const values = e.target.value.split(',').map(v => parseInt(v.trim()) || 1);
                                    if (values.length === 4) {
                                        setTensorShape(values as [number, number, number, number]);
                                    }
                                }}
                                placeholder="batch,height,width,channels"
                                style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #CCC', width: '150px' }}
                            />
                        </div>
                    )}

                    <button 
                        onClick={handleAddModalData}
                        style={{ 
                            padding: '6px 12px', 
                            backgroundColor: '#007ACC', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Add Data
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label>Attention Type:</label>
                    <select 
                        value={attentionType} 
                        onChange={(e) => setAttentionType(e.target.value as any)}
                        style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #CCC' }}
                    >
                        <option value="spatial">🗺️ Spatial</option>
                        <option value="temporal">⏰ Temporal</option>
                        <option value="cross-modal">🔄 Cross-Modal</option>
                        <option value="cognitive">🧠 Cognitive</option>
                    </select>
                </div>
            </div>

            <div className="data-section" style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '12px', fontSize: '16px' }}>
                    Current Data ({processingData.length} items)
                </h4>
                
                {processingData.length > 0 ? (
                    <div style={{ 
                        background: '#F8F9FA', 
                        padding: '12px', 
                        borderRadius: '6px',
                        maxHeight: '150px',
                        overflow: 'auto'
                    }}>
                        {processingData.map((data, index) => (
                            <div key={index} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '8px',
                                borderBottom: index < processingData.length - 1 ? '1px solid #DDD' : 'none'
                            }}>
                                <span>{getModalityIcon(data.type)} {data.type} - {data.id}</span>
                                <span style={{ fontSize: '12px', color: '#666' }}>
                                    {new Date(data.timestamp || 0).toLocaleTimeString()}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: '#999', fontStyle: 'italic' }}>No data added yet</p>
                )}
            </div>

            <div className="actions-section" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        onClick={handleProcessBatch}
                        disabled={processingData.length === 0 || isProcessing}
                        style={{ 
                            padding: '8px 16px', 
                            backgroundColor: processingData.length > 0 && !isProcessing ? '#28A745' : '#6C757D', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px',
                            cursor: processingData.length > 0 && !isProcessing ? 'pointer' : 'not-allowed'
                        }}
                    >
                        {isProcessing ? '⏳ Processing...' : '🚀 Process Multi-Modal Data'}
                    </button>

                    <button 
                        onClick={handleTensorOperation}
                        disabled={!processingData.some(d => d.type === 'tensor') || isProcessing}
                        style={{ 
                            padding: '8px 16px', 
                            backgroundColor: processingData.some(d => d.type === 'tensor') && !isProcessing ? '#FD7E14' : '#6C757D', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px',
                            cursor: processingData.some(d => d.type === 'tensor') && !isProcessing ? 'pointer' : 'not-allowed'
                        }}
                    >
                        🧮 Tensor Operation
                    </button>

                    <button 
                        onClick={handleClearData}
                        style={{ 
                            padding: '8px 16px', 
                            backgroundColor: '#DC3545', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        🗑️ Clear Data
                    </button>
                </div>
            </div>

            <div className="results-section">
                <h4 style={{ marginBottom: '12px', fontSize: '16px' }}>
                    Processing Results ({processingResults.length})
                </h4>
                
                {processingResults.length > 0 ? (
                    <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                        {processingResults.map((result, index) => (
                            <div key={index} style={{ 
                                marginBottom: '16px',
                                background: '#FFFFFF',
                                border: '1px solid #DDD',
                                borderRadius: '6px',
                                padding: '12px'
                            }}>
                                <h5 style={{ 
                                    margin: '0 0 8px 0', 
                                    fontSize: '14px', 
                                    color: '#495057',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    {getResultIcon(result.type)} {result.type}
                                </h5>
                                <pre style={{ 
                                    background: '#F8F9FA', 
                                    padding: '8px', 
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    overflow: 'auto',
                                    maxHeight: '200px',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {JSON.stringify(result.data, null, 2)}
                                </pre>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: '#999', fontStyle: 'italic' }}>No processing results yet</p>
                )}
            </div>
        </div>
    );
};

// Helper functions
function createModalContent(modality: ModalityType, tensorShape: [number, number, number, number]): any {
    switch (modality) {
        case 'text':
            return {
                text: `Sample text data for cognitive processing. Timestamp: ${Date.now()}`,
                language: 'en',
                format: 'plain' as const
            } as TextData;
        
        case 'image':
            return {
                data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                format: 'png' as const,
                width: 1,
                height: 1,
                channels: 3,
                description: 'Sample image data'
            } as ImageData;
        
        case 'audio':
            return {
                data: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgYOsbs2vPX',
                format: 'wav' as const,
                duration: 1.0,
                sampleRate: 44100,
                channels: 1,
                transcript: 'Sample audio data'
            } as AudioData;
        
        case 'tensor':
            const totalSize = tensorShape.reduce((product, dim) => product * dim, 1);
            return {
                data: new Float32Array(totalSize).map(() => Math.random()),
                shape: tensorShape,
                dtype: 'float32' as const,
                description: `Sample tensor data with shape ${tensorShape.join('x')}`
            } as TensorData;
        
        case 'mixed':
            return {
                components: [
                    { 
                        id: `text_${Date.now()}`, 
                        type: 'text' as const, 
                        content: createModalContent('text', tensorShape),
                        timestamp: Date.now()
                    },
                    { 
                        id: `image_${Date.now()}`, 
                        type: 'image' as const, 
                        content: createModalContent('image', tensorShape),
                        timestamp: Date.now()
                    }
                ],
                fusionStrategy: 'attention' as const
            };
        
        default:
            return {};
    }
}

function getModalityIcon(modality: ModalityType): string {
    switch (modality) {
        case 'text': return '📝';
        case 'image': return '🖼️';
        case 'audio': return '🔊';
        case 'tensor': return '🧮';
        case 'mixed': return '🔀';
        default: return '❓';
    }
}

function getResultIcon(resultType: string): string {
    switch (resultType) {
        case 'Processed Data': return '⚙️';
        case 'Pattern Recognition': return '🔍';
        case 'Context Analysis': return '🎯';
        case 'Attention Analysis': return '👁️';
        case 'Tensor Operation Result': return '🧮';
        default: return '📊';
    }
}