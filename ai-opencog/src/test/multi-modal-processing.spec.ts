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

import { expect } from 'chai';
import {
    MultiModalData,
    MultiModalPatternInput,
    TensorData,
    TextData,
    ImageData,
    AudioData,
    ModalityType
} from '../common/opencog-types';
import { MultiModalProcessingService } from '../node/multi-modal-processing-service';

describe('Multi-Modal Cognitive Processing - Phase 5', () => {
    let multiModalService: MultiModalProcessingService;

    beforeEach(() => {
        multiModalService = new MultiModalProcessingService();
    });

    describe('Multi-Modal Data Processing', () => {
        it('should process text data', async () => {
            const textData: MultiModalData = {
                id: 'test-text-1',
                type: 'text',
                content: {
                    text: 'This is a test text for cognitive processing.',
                    language: 'en',
                    format: 'plain'
                } as TextData,
                timestamp: Date.now()
            };

            const result = await multiModalService.processMultiModalData(textData);
            
            expect(result).to.not.be.undefined;
            expect(result.type).to.equal('text');
            expect(result.metadata?.cognitiveAnnotations).to.have.length.greaterThan(0);
            expect((result.content as TextData).semanticAnnotations).to.be.an('array');
        });

        it('should process image data', async () => {
            const imageData: MultiModalData = {
                id: 'test-image-1',
                type: 'image',
                content: {
                    data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                    format: 'png',
                    width: 1,
                    height: 1,
                    channels: 3,
                    description: 'Test image'
                } as ImageData,
                timestamp: Date.now()
            };

            const result = await multiModalService.processMultiModalData(imageData);
            
            expect(result).to.not.be.undefined;
            expect(result.type).to.equal('image');
            expect(result.metadata?.cognitiveAnnotations).to.have.length.greaterThan(0);
            expect((result.content as ImageData).features).to.be.an('array');
        });

        it('should process audio data', async () => {
            const audioData: MultiModalData = {
                id: 'test-audio-1',
                type: 'audio',
                content: {
                    data: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgYOsbs2vPX',
                    format: 'wav',
                    duration: 1.0,
                    sampleRate: 44100,
                    channels: 1,
                    transcript: 'Test audio'
                } as AudioData,
                timestamp: Date.now()
            };

            const result = await multiModalService.processMultiModalData(audioData);
            
            expect(result).to.not.be.undefined;
            expect(result.type).to.equal('audio');
            expect(result.metadata?.cognitiveAnnotations).to.have.length.greaterThan(0);
            expect((result.content as AudioData).features).to.be.an('array');
        });

        it('should process tensor data with 4 degrees of freedom', async () => {
            const tensorShape: [number, number, number, number] = [2, 28, 28, 3];
            const totalSize = tensorShape.reduce((product, dim) => product * dim, 1);
            
            const tensorData: MultiModalData = {
                id: 'test-tensor-1',
                type: 'tensor',
                content: {
                    data: new Float32Array(totalSize).map(() => Math.random()),
                    shape: tensorShape,
                    dtype: 'float32',
                    description: 'Test tensor with 4 DoF'
                } as TensorData,
                timestamp: Date.now()
            };

            const result = await multiModalService.processMultiModalData(tensorData);
            
            expect(result).to.not.be.undefined;
            expect(result.type).to.equal('tensor');
            expect(result.metadata?.cognitiveAnnotations).to.have.length.greaterThan(0);
            
            const processedTensor = result.content as TensorData;
            expect(processedTensor.shape).to.deep.equal(tensorShape);
            expect(processedTensor.operations).to.have.length.greaterThan(0);
        });
    });

    describe('Tensor Operations', () => {
        it('should perform convolution operation', async () => {
            const tensorData: TensorData = {
                data: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]),
                shape: [1, 3, 3, 1],
                dtype: 'float32',
                description: 'Test tensor for convolution'
            };

            const result = await multiModalService.performTensorOperation(
                tensorData,
                'convolution',
                { kernelSize: 3, stride: 1 }
            );

            expect(result).to.not.be.undefined;
            expect(result.operations).to.have.length.greaterThan(0);
            expect(result.operations![0].type).to.equal('convolution');
        });

        it('should perform attention operation', async () => {
            const tensorData: TensorData = {
                data: new Float32Array([0.1, 0.5, 0.3, 0.8, 0.2]),
                shape: [1, 1, 1, 5],
                dtype: 'float32',
                description: 'Test tensor for attention'
            };

            const result = await multiModalService.performTensorOperation(
                tensorData,
                'attention',
                { attention: 'softmax' }
            );

            expect(result).to.not.be.undefined;
            expect(result.operations).to.have.length.greaterThan(0);
            expect(result.operations![0].type).to.equal('attention');
            
            // Check that attention weights sum approximately to 1
            const attentionData = Array.from(result.data);
            const sum = attentionData.reduce((acc, val) => acc + val, 0);
            expect(sum).to.be.closeTo(1.0, 0.1);
        });

        it('should fuse multiple tensors', async () => {
            const tensor1: TensorData = {
                data: new Float32Array([1, 2, 3, 4]),
                shape: [1, 2, 2, 1],
                dtype: 'float32',
                description: 'First tensor'
            };

            const tensor2: TensorData = {
                data: new Float32Array([5, 6, 7, 8]),
                shape: [1, 2, 2, 1],
                dtype: 'float32',
                description: 'Second tensor'
            };

            const result = await multiModalService.fuseTensorData([tensor1, tensor2], 'addition');

            expect(result).to.not.be.undefined;
            expect(result.shape).to.deep.equal([1, 2, 2, 1]);
            expect(result.operations).to.have.length.greaterThan(0);
            expect(result.operations![0].type).to.equal('fusion');
            
            // Check that the result is element-wise addition
            const resultData = Array.from(result.data);
            expect(resultData).to.deep.equal([6, 8, 10, 12]);
        });
    });

    describe('Multi-Modal Pattern Recognition', () => {
        it('should recognize patterns in single modality', async () => {
            const testData: MultiModalData[] = [
                {
                    id: 'pattern-test-1',
                    type: 'text',
                    content: {
                        text: 'function analyze() { return pattern; }',
                        language: 'javascript',
                        format: 'code'
                    } as TextData,
                    timestamp: Date.now()
                }
            ];

            const input: MultiModalPatternInput = {
                data: testData,
                options: {
                    maxResults: 5,
                    minConfidence: 0.5
                }
            };

            const results = await multiModalService.recognizeMultiModalPatterns(input);

            expect(results).to.be.an('array');
            expect(results).to.have.length.greaterThan(0);
            expect(results[0].pattern).to.not.be.undefined;
            expect(results[0].confidence).to.be.a('number');
            expect(results[0].modalities).to.include('text');
        });

        it('should recognize cross-modal patterns', async () => {
            const testData: MultiModalData[] = [
                {
                    id: 'cross-modal-1',
                    type: 'text',
                    content: {
                        text: 'Image analysis code',
                        language: 'en',
                        format: 'plain'
                    } as TextData,
                    timestamp: Date.now()
                },
                {
                    id: 'cross-modal-2',
                    type: 'image',
                    content: {
                        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                        format: 'png',
                        width: 1,
                        height: 1,
                        description: 'Analysis result'
                    } as ImageData,
                    timestamp: Date.now()
                }
            ];

            const input: MultiModalPatternInput = {
                data: testData,
                options: {
                    crossModal: true,
                    fusionStrategy: 'attention'
                }
            };

            const results = await multiModalService.recognizeMultiModalPatterns(input);

            expect(results).to.be.an('array');
            expect(results).to.have.length.greaterThan(0);
            
            // Should have at least one cross-modal pattern
            const crossModalPattern = results.find(r => r.modalities.length > 1);
            expect(crossModalPattern).to.not.be.undefined;
            expect(crossModalPattern!.metadata?.crossModalCorrelation).to.be.a('number');
        });
    });

    describe('Multi-Modal Batch Processing', () => {
        it('should process batch of multi-modal data', async () => {
            const batchData: MultiModalData[] = [
                {
                    id: 'batch-1',
                    type: 'text',
                    content: {
                        text: 'First text item',
                        language: 'en',
                        format: 'plain'
                    } as TextData,
                    timestamp: Date.now()
                },
                {
                    id: 'batch-2',
                    type: 'tensor',
                    content: {
                        data: new Float32Array([1, 2, 3, 4]),
                        shape: [1, 2, 2, 1],
                        dtype: 'float32',
                        description: 'Batch tensor'
                    } as TensorData,
                    timestamp: Date.now()
                }
            ];

            const results = await multiModalService.processMultiModalBatch(batchData);

            expect(results).to.be.an('array');
            expect(results).to.have.length(2);
            expect(results[0].type).to.equal('text');
            expect(results[1].type).to.equal('tensor');
            
            // All items should be processed
            results.forEach(result => {
                expect(result.metadata?.cognitiveAnnotations).to.have.length.greaterThan(0);
            });
        });
    });

    describe('Learning Statistics', () => {
        it('should return multi-modal learning statistics', async () => {
            // Process some data first to generate stats
            const testData: MultiModalData = {
                id: 'stats-test',
                type: 'text',
                content: {
                    text: 'Stats test data',
                    language: 'en',
                    format: 'plain'
                } as TextData,
                timestamp: Date.now()
            };

            await multiModalService.processMultiModalData(testData);

            const stats = multiModalService.getMultiModalLearningStats();

            expect(stats).to.not.be.undefined;
            expect(stats.totalMultiModalRecords).to.be.a('number');
            expect(stats.modalityDistribution).to.be.an('object');
            expect(stats.crossModalPatterns).to.be.a('number');
            expect(stats.processingAccuracy).to.be.an('object');
            
            // Check that text modality was processed
            expect(stats.modalityDistribution.text).to.be.greaterThan(0);
            expect(stats.processingAccuracy.text).to.be.a('number');
        });
    });

    describe('Tensor Shape Validation', () => {
        it('should enforce 4 degrees of freedom for tensors', async () => {
            const invalidTensor: TensorData = {
                data: new Float32Array([1, 2, 3]),
                shape: [3] as any, // Invalid: only 1 dimension
                dtype: 'float32',
                description: 'Invalid tensor'
            };

            try {
                await multiModalService.processTensorData(invalidTensor);
                expect.fail('Should have thrown error for invalid tensor shape');
            } catch (error) {
                expect((error as Error).message).to.include('4 degrees of freedom');
            }
        });

        it('should accept valid 4D tensor shapes', async () => {
            const validShapes: Array<[number, number, number, number]> = [
                [1, 28, 28, 1],    // Single image, grayscale
                [32, 224, 224, 3], // Batch of RGB images
                [8, 10, 10, 64],   // Feature maps
                [2, 1, 1, 512]     // Batch of feature vectors
            ];

            for (const shape of validShapes) {
                const tensorData: TensorData = {
                    data: new Float32Array(shape.reduce((product, dim) => product * dim, 1)),
                    shape,
                    dtype: 'float32',
                    description: `Valid tensor ${shape.join('x')}`
                };

                const result = await multiModalService.processTensorData(tensorData);
                expect(result).to.not.be.undefined;
                expect(result.shape).to.deep.equal(shape);
            }
        });
    });
});