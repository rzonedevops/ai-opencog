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
import { Container } from '@theia/core/shared/inversify';
import { OpenCogService } from '../common/opencog-service';
import { SensorMotorService } from '../browser/sensor-motor-service';
import { CodeChangeSensor } from '../browser/code-change-sensor';
import { ActivitySensor } from '../browser/activity-sensor';
import { EnvironmentSensor } from '../browser/environment-sensor';
import { CodeModificationActuator } from '../browser/code-modification-actuator';
import { ToolControlActuator } from '../browser/tool-control-actuator';
import { EnvironmentManagementActuator } from '../browser/environment-management-actuator';

describe('Phase 4 Sensor-Motor System', () => {

    let container: Container;
    let mockOpenCogService: any;
    let sensorMotorService: SensorMotorService;

    beforeEach(() => {
        container = new Container();
        
        // Mock OpenCog service
        mockOpenCogService = {
            addAtom: async () => 'mock-atom-id',
            reason: async () => ({ 
                conclusion: [], 
                confidence: 0.8, 
                explanation: 'mock reasoning',
                metadata: { domain: 'test' }
            }),
            queryAtoms: async () => [],
            getAtomSpaceSize: async () => 100
        };

        // Mock other required services
        const mockFileService = {
            onDidFilesChange: () => ({ dispose: () => {} }),
            resolve: async () => ({ isDirectory: false, size: 1000 }),
            read: async () => ({ value: 'console.log("test");' })
        };

        const mockEditorManager = {
            onCreated: () => ({ dispose: () => {} }),
            onCurrentEditorChanged: () => ({ dispose: () => {} }),
            all: []
        };

        const mockPreferenceService = {
            get: (key: string) => undefined,
            set: async (key: string, value: any) => {}
        };

        // Bind services
        container.bind(OpenCogService).toConstantValue(mockOpenCogService);
        container.bind('FileService').toConstantValue(mockFileService);
        container.bind('EditorManager').toConstantValue(mockEditorManager);
        container.bind('NavigatorContribution').toConstantValue({});
        container.bind('TerminalService').toConstantValue({
            onDidCreateTerminal: () => ({ dispose: () => {} }),
            onDidChangeActiveTerminal: () => ({ dispose: () => {} })
        });
        container.bind('TaskService').toConstantValue({
            onDidStartTask: () => ({ dispose: () => {} }),
            onDidEndTask: () => ({ dispose: () => {} }),
            run: async () => ({ taskId: 'mock-task' }),
            getTasks: async () => []
        });
        container.bind('DebugService').toConstantValue({
            onDidStartDebugSession: () => ({ dispose: () => {} }),
            onDidTerminateDebugSession: () => ({ dispose: () => {} }),
            getModel: () => ({
                onDidChangeBreakpoints: () => ({ dispose: () => {} })
            }),
            start: async () => {}
        });
        container.bind('ProblemManager').toConstantValue({});
        container.bind('MarkerManager').toConstantValue({
            onDidChangeMarkers: () => ({ dispose: () => {} }),
            findMarkers: () => []
        });
        container.bind('PreferenceService').toConstantValue(mockPreferenceService);
        container.bind('Workspace').toConstantValue({
            tryGetRoots: () => []
        });

        // Bind our components
        container.bind(CodeChangeSensor).toSelf().inSingletonScope();
        container.bind(ActivitySensor).toSelf().inSingletonScope();
        container.bind(EnvironmentSensor).toSelf().inSingletonScope();
        container.bind(CodeModificationActuator).toSelf().inSingletonScope();
        container.bind(ToolControlActuator).toSelf().inSingletonScope();
        container.bind(EnvironmentManagementActuator).toSelf().inSingletonScope();
        container.bind(SensorMotorService).toSelf().inSingletonScope();

        sensorMotorService = container.get(SensorMotorService);
    });

    describe('SensorMotorService', () => {
        
        it('should initialize with correct sensors and actuators', () => {
            expect(sensorMotorService).to.not.be.undefined;
            expect(sensorMotorService.isActive()).to.be.false;
        });

        it('should start and stop successfully', async () => {
            await sensorMotorService.start();
            expect(sensorMotorService.isActive()).to.be.true;
            
            await sensorMotorService.stop();
            expect(sensorMotorService.isActive()).to.be.false;
        });

        it('should execute actuators correctly', async () => {
            const result = await sensorMotorService.executeActuator('code-modification', {
                type: 'rename',
                target: 'test',
                parameters: { oldName: 'foo', newName: 'bar' }
            });
            
            expect(result).to.have.property('success');
            expect(result).to.have.property('message');
        });

        it('should return error for unknown actuator', async () => {
            const result = await sensorMotorService.executeActuator('unknown-actuator', {});
            
            expect(result.success).to.be.false;
            expect(result.message).to.include('Unknown actuator type');
        });

        it('should provide sensor statistics', async () => {
            const stats = sensorMotorService.getSensorStats();
            
            expect(stats).to.have.property('totalSensors');
            expect(stats).to.have.property('availableActuators');
            expect(stats.totalSensors).to.equal(3);
            expect(stats.availableActuators).to.include('code-modification');
            expect(stats.availableActuators).to.include('tool-control');
            expect(stats.availableActuators).to.include('environment-management');
        });

    });

    describe('CodeModificationActuator', () => {
        
        let actuator: CodeModificationActuator;

        beforeEach(() => {
            actuator = container.get(CodeModificationActuator);
        });

        it('should be available', async () => {
            const available = await actuator.isAvailable();
            expect(available).to.be.true;
        });

        it('should handle rename operations', async () => {
            const result = await actuator.execute({
                type: 'rename',
                target: 'test',
                parameters: { oldName: 'oldVar', newName: 'newVar', fileUri: 'file:///test.ts' }
            });
            
            expect(result).to.have.property('success');
            expect(result).to.have.property('message');
        });

        it('should handle extract method operations', async () => {
            const result = await actuator.execute({
                type: 'extract-method',
                target: 'test',
                parameters: { 
                    fileUri: 'file:///test.ts',
                    startLine: 1,
                    endLine: 3,
                    methodName: 'extractedMethod'
                }
            });
            
            expect(result).to.have.property('success');
            expect(result).to.have.property('message');
        });

        it('should return error for unsupported refactoring types', async () => {
            const result = await actuator.execute({
                type: 'unsupported-type' as any,
                target: 'test',
                parameters: {}
            });
            
            expect(result.success).to.be.false;
            expect(result.message).to.include('Unsupported refactoring type');
        });

    });

    describe('ToolControlActuator', () => {
        
        let actuator: ToolControlActuator;

        beforeEach(() => {
            actuator = container.get(ToolControlActuator);
        });

        it('should be available', async () => {
            const available = await actuator.isAvailable();
            expect(available).to.be.true;
        });

        it('should configure editor settings', async () => {
            const result = await actuator.execute({
                action: 'configure-editor',
                config: {
                    settings: {
                        'editor.fontSize': 14,
                        'editor.tabSize': 2
                    },
                    scope: 'user'
                }
            });
            
            expect(result).to.have.property('success');
            expect(result.success).to.be.true;
        });

        it('should optimize settings', async () => {
            const result = await actuator.execute({
                action: 'optimize-settings',
                performanceData: {
                    memoryUsage: 600,
                    responseTime: 1200
                }
            });
            
            expect(result).to.have.property('success');
            expect(result.success).to.be.true;
        });

    });

    describe('EnvironmentManagementActuator', () => {
        
        let actuator: EnvironmentManagementActuator;

        beforeEach(() => {
            actuator = container.get(EnvironmentManagementActuator);
        });

        it('should be available', async () => {
            const available = await actuator.isAvailable();
            expect(available).to.be.true;
        });

        it('should allocate resources', async () => {
            const result = await actuator.execute({
                action: 'allocate-resources',
                allocation: {
                    memory: 512,
                    cpu: 70,
                    priority: 'high'
                }
            });
            
            expect(result).to.have.property('success');
            expect(result.success).to.be.true;
        });

        it('should manage cache', async () => {
            const result = await actuator.execute({
                action: 'manage-cache',
                action: 'optimize',
                sizeLimit: 100
            });
            
            expect(result).to.have.property('success');
            expect(result.success).to.be.true;
        });

    });

    describe('Integration Tests', () => {

        it('should handle cognitive-motor cycle integration', async () => {
            await sensorMotorService.start();
            
            // Simulate a reasoning result that triggers actuators
            const mockReasoning = {
                suggestedActions: [
                    {
                        actuatorType: 'tool-control',
                        parameters: {
                            action: 'optimize-settings',
                            context: { workloadType: 'heavy-editing' }
                        }
                    }
                ]
            };

            const results = await sensorMotorService.triggerCognitiveActuation(mockReasoning);
            
            expect(results).to.have.lengthOf(1);
            expect(results[0]).to.have.property('success');
            
            await sensorMotorService.stop();
        });

        it('should provide comprehensive sensor data', async () => {
            const sensorData = sensorMotorService.getRecentSensorData();
            
            expect(sensorData).to.have.property('activities');
            expect(sensorData).to.have.property('environmentMetrics');
            expect(sensorData).to.have.property('timestamp');
        });

    });

});