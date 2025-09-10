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

import { Atom } from './opencog-types';

/**
 * Represents a change in a file
 */
export interface FileChange {
    uri: string;
    type: 'create' | 'modify' | 'delete';
    content?: string;
    oldContent?: string;
    timestamp: number;
    size?: number;
    language?: string;
}

/**
 * User activity data
 */
export interface UserActivity {
    type: 'edit' | 'navigate' | 'search' | 'build' | 'debug' | 'test' | 'refactor';
    details: any;
    timestamp: number;
    duration?: number;
    context?: {
        file?: string;
        line?: number;
        column?: number;
        selection?: string;
    };
}

/**
 * Environment monitoring data
 */
export interface EnvironmentMetrics {
    buildTime?: number;
    memoryUsage?: number;
    cpuUsage?: number;
    diskUsage?: number;
    errorCount?: number;
    warningCount?: number;
    testResults?: TestResults;
    performance?: PerformanceMetrics;
}

/**
 * Test results data
 */
export interface TestResults {
    passed: number;
    failed: number;
    skipped: number;
    total: number;
    duration: number;
    coverage?: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
    responseTime: number;
    throughput: number;
    errorRate: number;
    resourceUtilization: Record<string, number>;
}

/**
 * Refactoring operation to be applied
 */
export interface RefactoringOperation {
    type: 'rename' | 'extract-method' | 'inline' | 'move' | 'change-signature';
    target: string;
    parameters: Record<string, any>;
    preview?: boolean;
    scope?: 'file' | 'project' | 'workspace';
}

/**
 * Editor configuration changes
 */
export interface EditorConfiguration {
    settings: Record<string, any>;
    scope: 'user' | 'workspace' | 'folder';
    merge?: boolean;
}

/**
 * Build configuration
 */
export interface BuildConfiguration {
    target?: string;
    options?: Record<string, any>;
    environment?: Record<string, string>;
}

/**
 * Resource allocation specification
 */
export interface ResourceAllocation {
    memory?: number;
    cpu?: number;
    disk?: number;
    network?: number;
    priority?: 'low' | 'normal' | 'high' | 'critical';
}

/**
 * Service configuration
 */
export interface ServiceConfiguration {
    service: string;
    enabled: boolean;
    parameters?: Record<string, any>;
    restart?: boolean;
}

/**
 * Result of a sensor operation
 */
export interface SensorResult {
    atoms: Atom[];
    metadata?: Record<string, any>;
}

/**
 * Result of an actuator operation
 */
export interface ActuatorResult {
    success: boolean;
    message?: string;
    changes?: any[];
    metadata?: Record<string, any>;
}

/**
 * Sensor interface for monitoring development environment
 */
export interface Sensor {
    /**
     * Start monitoring and return extracted atoms
     */
    start(): Promise<void>;
    
    /**
     * Stop monitoring
     */
    stop(): Promise<void>;
    
    /**
     * Get current sensor status
     */
    isActive(): boolean;
}

/**
 * Actuator interface for controlling development tools
 */
export interface Actuator {
    /**
     * Execute the actuator action
     */
    execute(parameters: any): Promise<ActuatorResult>;
    
    /**
     * Check if actuator is available
     */
    isAvailable(): Promise<boolean>;
}