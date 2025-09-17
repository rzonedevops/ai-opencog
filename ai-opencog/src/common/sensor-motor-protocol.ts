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

/**
 * Protocol definitions for sensor-motor system communication
 */

export namespace SensorMotorProtocol {
    
    /**
     * Protocol messages for sensor data transmission
     */
    export interface SensorDataMessage {
        id: string;
        sensorType: 'code-change' | 'activity' | 'environment';
        timestamp: number;
        data: any;
        metadata?: {
            source?: string;
            confidence?: number;
            priority?: 'low' | 'medium' | 'high';
            [key: string]: any;
        };
    }

    /**
     * Protocol messages for actuator commands
     */
    export interface ActuatorCommandMessage {
        id: string;
        actuatorType: 'code-modification' | 'tool-control' | 'environment-management';
        command: string;
        parameters: any;
        timestamp: number;
        metadata?: {
            priority?: 'low' | 'medium' | 'high';
            timeout?: number;
            retries?: number;
            [key: string]: any;
        };
    }

    /**
     * Protocol messages for actuator responses
     */
    export interface ActuatorResponseMessage {
        id: string;
        commandId: string;
        success: boolean;
        result?: any;
        error?: string;
        timestamp: number;
        executionTime?: number;
        metadata?: {
            [key: string]: any;
        };
    }

    /**
     * Protocol messages for cognitive processing requests
     */
    export interface CognitiveProcessingRequest {
        id: string;
        type: 'reasoning' | 'pattern-recognition' | 'learning' | 'optimization';
        inputAtoms: any[];
        context?: {
            workspace?: string;
            file?: string;
            user?: string;
            session?: string;
            [key: string]: any;
        };
        parameters?: {
            timeout?: number;
            confidenceThreshold?: number;
            maxResults?: number;
            [key: string]: any;
        };
        timestamp: number;
    }

    /**
     * Protocol messages for cognitive processing responses
     */
    export interface CognitiveProcessingResponse {
        id: string;
        requestId: string;
        success: boolean;
        result?: {
            conclusion: any[];
            confidence: number;
            explanation?: string;
            reasoning?: string[];
            metadata?: any;
        };
        error?: string;
        processingTime?: number;
        timestamp: number;
    }

    /**
     * Protocol messages for system status updates
     */
    export interface SystemStatusMessage {
        id: string;
        component: 'sensor-motor-service' | 'sensor' | 'actuator' | 'opencog';
        status: 'online' | 'offline' | 'busy' | 'error';
        timestamp: number;
        details?: {
            version?: string;
            performance?: {
                cpu?: number;
                memory?: number;
                responseTime?: number;
            };
            errors?: string[];
            warnings?: string[];
            [key: string]: any;
        };
    }

    /**
     * Protocol message wrapper for all communication
     */
    export interface ProtocolMessage {
        type: 'sensor-data' | 'actuator-command' | 'actuator-response' | 
              'cognitive-request' | 'cognitive-response' | 'system-status';
        payload: SensorDataMessage | ActuatorCommandMessage | ActuatorResponseMessage |
                CognitiveProcessingRequest | CognitiveProcessingResponse | SystemStatusMessage;
        source: string;
        destination?: string;
        timestamp: number;
        version: string;
    }

    /**
     * Protocol constants
     */
    export const PROTOCOL_VERSION = '1.0.0';
    export const DEFAULT_TIMEOUT = 30000; // 30 seconds
    export const MAX_RETRIES = 3;
    export const HEARTBEAT_INTERVAL = 10000; // 10 seconds

    /**
     * Message factory functions
     */
    export function createSensorDataMessage(
        sensorType: SensorDataMessage['sensorType'],
        data: any,
        metadata?: SensorDataMessage['metadata']
    ): SensorDataMessage {
        return {
            id: generateId(),
            sensorType,
            data,
            timestamp: Date.now(),
            metadata
        };
    }

    export function createActuatorCommandMessage(
        actuatorType: ActuatorCommandMessage['actuatorType'],
        command: string,
        parameters: any,
        metadata?: ActuatorCommandMessage['metadata']
    ): ActuatorCommandMessage {
        return {
            id: generateId(),
            actuatorType,
            command,
            parameters,
            timestamp: Date.now(),
            metadata
        };
    }

    export function createCognitiveProcessingRequest(
        type: CognitiveProcessingRequest['type'],
        inputAtoms: any[],
        context?: CognitiveProcessingRequest['context'],
        parameters?: CognitiveProcessingRequest['parameters']
    ): CognitiveProcessingRequest {
        return {
            id: generateId(),
            type,
            inputAtoms,
            context,
            parameters,
            timestamp: Date.now()
        };
    }

    export function wrapMessage(
        type: ProtocolMessage['type'],
        payload: ProtocolMessage['payload'],
        source: string,
        destination?: string
    ): ProtocolMessage {
        return {
            type,
            payload,
            source,
            destination,
            timestamp: Date.now(),
            version: PROTOCOL_VERSION
        };
    }

    /**
     * Utility functions
     */
    function generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    export function validateMessage(message: ProtocolMessage): boolean {
        return !!(
            message.type &&
            message.payload &&
            message.source &&
            message.timestamp &&
            message.version
        );
    }

    export function isExpired(message: ProtocolMessage, timeoutMs: number = DEFAULT_TIMEOUT): boolean {
        return Date.now() - message.timestamp > timeoutMs;
    }
}