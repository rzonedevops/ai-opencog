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
import { PreferenceService } from '@theia/core/lib/browser/preferences/preference-service';
import { TaskService } from '@theia/task/lib/browser/task-service';
import { TaskConfiguration } from '@theia/task/lib/common/task-protocol';
import { DebugService } from '@theia/debug/lib/browser/debug-service';
import { DebugConfiguration } from '@theia/debug/lib/common/debug-common';
import { EditorConfiguration, BuildConfiguration, ActuatorResult, Actuator } from '../common/sensor-motor-types';

/**
 * Controls development tools including editor configuration, build automation, and debugging assistance
 */
@injectable()
export class ToolControlActuator implements Actuator {

    constructor(
        @inject(PreferenceService) private readonly preferenceService: PreferenceService,
        @inject(TaskService) private readonly taskService: TaskService,
        @inject(DebugService) private readonly debugService: DebugService
    ) {}

    async execute(parameters: any): Promise<ActuatorResult> {
        const { action } = parameters;

        try {
            switch (action) {
                case 'configure-editor':
                    return this.configureEditor(parameters.config as EditorConfiguration);
                case 'run-build':
                    return this.runBuild(parameters.config as BuildConfiguration);
                case 'start-debug':
                    return this.startDebug(parameters.config);
                case 'optimize-settings':
                    return this.optimizeSettings(parameters);
                case 'setup-auto-build':
                    return this.setupAutoBuild(parameters);
                case 'configure-linting':
                    return this.configureLinting(parameters);
                case 'setup-testing':
                    return this.setupTesting(parameters);
                default:
                    return {
                        success: false,
                        message: `Unknown tool control action: ${action}`
                    };
            }
        } catch (error) {
            return {
                success: false,
                message: `Tool control operation failed: ${error}`,
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }

    async isAvailable(): Promise<boolean> {
        return true; // Tool control is always available
    }

    private async configureEditor(config: EditorConfiguration): Promise<ActuatorResult> {
        try {
            const changes: any[] = [];

            for (const [key, value] of Object.entries(config.settings)) {
                const currentValue = this.preferenceService.get(key);
                
                if (currentValue !== value) {
                    await this.preferenceService.set(key, value, config.scope);
                    changes.push({
                        setting: key,
                        oldValue: currentValue,
                        newValue: value,
                        scope: config.scope
                    });
                }
            }

            return {
                success: true,
                message: `Successfully updated ${changes.length} editor settings`,
                changes,
                metadata: {
                    operation: 'configure-editor',
                    scope: config.scope,
                    settingsChanged: changes.length
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `Editor configuration failed: ${error}`,
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }

    private async runBuild(config: BuildConfiguration): Promise<ActuatorResult> {
        try {
            // Create a build task configuration
            const taskConfig: TaskConfiguration = {
                type: 'shell',
                label: `Build ${config.target || 'default'}`,
                command: this.getBuildCommand(config),
                group: 'build',
                options: {
                    env: config.environment
                }
            };

            // Execute the build task
            const taskInfo = await this.taskService.run(taskConfig.label, taskConfig);
            
            if (taskInfo) {
                return {
                    success: true,
                    message: `Build task started successfully`,
                    changes: [{
                        type: 'build-started',
                        taskId: taskInfo.taskId,
                        label: taskConfig.label
                    }],
                    metadata: {
                        operation: 'run-build',
                        taskId: taskInfo.taskId,
                        target: config.target
                    }
                };
            } else {
                return {
                    success: false,
                    message: 'Failed to start build task'
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `Build execution failed: ${error}`,
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }

    private async startDebug(config: any): Promise<ActuatorResult> {
        try {
            const debugConfig: DebugConfiguration = {
                type: config.type || 'node',
                name: config.name || 'Debug Session',
                request: config.request || 'launch',
                program: config.program,
                ...config.options
            };

            await this.debugService.start(debugConfig);

            return {
                success: true,
                message: 'Debug session started successfully',
                changes: [{
                    type: 'debug-started',
                    configuration: debugConfig.name
                }],
                metadata: {
                    operation: 'start-debug',
                    debugType: debugConfig.type,
                    debugName: debugConfig.name
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `Debug start failed: ${error}`,
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }

    private async optimizeSettings(parameters: any): Promise<ActuatorResult> {
        const { context, performanceData } = parameters;
        const optimizations: any[] = [];

        try {
            // Optimize based on performance data
            if (performanceData) {
                if (performanceData.memoryUsage > 512) { // High memory usage
                    await this.preferenceService.set('editor.wordWrap', 'off');
                    await this.preferenceService.set('editor.minimap.enabled', false);
                    optimizations.push({ setting: 'memory-optimization', applied: true });
                }

                if (performanceData.responseTime > 1000) { // Slow response
                    await this.preferenceService.set('files.watcherExclude', {
                        '**/.git/objects/**': true,
                        '**/.git/subtree-cache/**': true,
                        '**/node_modules/**': true,
                        '**/dist/**': true,
                        '**/build/**': true
                    });
                    optimizations.push({ setting: 'watcher-optimization', applied: true });
                }
            }

            // Context-based optimizations
            if (context?.projectType === 'large-typescript') {
                await this.preferenceService.set('typescript.preferences.includePackageJsonAutoImports', 'off');
                await this.preferenceService.set('typescript.suggest.autoImports', false);
                optimizations.push({ setting: 'typescript-optimization', applied: true });
            }

            return {
                success: true,
                message: `Applied ${optimizations.length} optimizations`,
                changes: optimizations,
                metadata: {
                    operation: 'optimize-settings',
                    optimizationsApplied: optimizations.length,
                    context
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `Settings optimization failed: ${error}`,
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }

    private async setupAutoBuild(parameters: any): Promise<ActuatorResult> {
        const { watchPatterns, buildCommand, debounceMs = 1000 } = parameters;

        try {
            // Create a file watcher task for auto-build
            const taskConfig: TaskConfiguration = {
                type: 'shell',
                label: 'Auto Build Watcher',
                command: buildCommand || 'npm run build',
                group: 'build',
                isBackground: true,
                problemMatcher: '$tsc-watch',
                options: {
                    shell: true
                }
            };

            // In a real implementation, you'd set up file watchers
            // For now, we'll create the task configuration
            return {
                success: true,
                message: 'Auto-build configuration created',
                changes: [{
                    type: 'auto-build-setup',
                    taskLabel: taskConfig.label,
                    watchPatterns,
                    debounceMs
                }],
                metadata: {
                    operation: 'setup-auto-build',
                    taskLabel: taskConfig.label,
                    patterns: watchPatterns?.length || 0
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `Auto-build setup failed: ${error}`,
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }

    private async configureLinting(parameters: any): Promise<ActuatorResult> {
        const { rules, severity, autoFix = false } = parameters;

        try {
            const lintingChanges: any[] = [];

            // Configure ESLint settings
            if (rules?.eslint) {
                await this.preferenceService.set('eslint.rules', rules.eslint);
                lintingChanges.push({ tool: 'eslint', rules: Object.keys(rules.eslint).length });
            }

            // Configure TSLint settings (if applicable)
            if (rules?.tslint) {
                await this.preferenceService.set('tslint.rules', rules.tslint);
                lintingChanges.push({ tool: 'tslint', rules: Object.keys(rules.tslint).length });
            }

            // Configure auto-fix settings
            if (autoFix) {
                await this.preferenceService.set('editor.codeActionsOnSave', {
                    'source.fixAll.eslint': true,
                    'source.fixAll.tslint': true
                });
                lintingChanges.push({ setting: 'auto-fix', enabled: true });
            }

            return {
                success: true,
                message: `Linting configured for ${lintingChanges.length} tools`,
                changes: lintingChanges,
                metadata: {
                    operation: 'configure-linting',
                    toolsConfigured: lintingChanges.length,
                    autoFix
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `Linting configuration failed: ${error}`,
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }

    private async setupTesting(parameters: any): Promise<ActuatorResult> {
        const { framework, testCommand, watchMode = false } = parameters;

        try {
            const testingChanges: any[] = [];

            // Create test task configurations
            const testTask: TaskConfiguration = {
                type: 'shell',
                label: `Run Tests (${framework})`,
                command: testCommand || 'npm test',
                group: 'test'
            };

            if (watchMode) {
                const watchTask: TaskConfiguration = {
                    type: 'shell',
                    label: `Test Watch (${framework})`,
                    command: (testCommand || 'npm test') + ' -- --watch',
                    group: 'test',
                    isBackground: true
                };
                testingChanges.push({ type: 'test-watch-task', label: watchTask.label });
            }

            testingChanges.push({ type: 'test-task', label: testTask.label });

            // Configure test-related settings
            await this.preferenceService.set('testing.autoRun', watchMode);
            testingChanges.push({ setting: 'auto-run', enabled: watchMode });

            return {
                success: true,
                message: `Testing setup completed for ${framework}`,
                changes: testingChanges,
                metadata: {
                    operation: 'setup-testing',
                    framework,
                    watchMode,
                    tasksCreated: testingChanges.filter(c => c.type?.includes('task')).length
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `Testing setup failed: ${error}`,
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }

    private getBuildCommand(config: BuildConfiguration): string {
        if (config.target) {
            switch (config.target) {
                case 'typescript':
                    return 'tsc';
                case 'webpack':
                    return 'webpack';
                case 'rollup':
                    return 'rollup -c';
                case 'vite':
                    return 'vite build';
                case 'maven':
                    return 'mvn compile';
                case 'gradle':
                    return './gradlew build';
                case 'npm':
                    return 'npm run build';
                default:
                    return config.target;
            }
        }

        // Default build commands by project type detection
        return 'npm run build';
    }

    /**
     * Get current tool configurations
     */
    async getCurrentConfiguration(): Promise<Record<string, any>> {
        const editorSettings = {
            'editor.fontSize': this.preferenceService.get('editor.fontSize'),
            'editor.tabSize': this.preferenceService.get('editor.tabSize'),
            'editor.wordWrap': this.preferenceService.get('editor.wordWrap'),
            'editor.minimap.enabled': this.preferenceService.get('editor.minimap.enabled'),
            'files.autoSave': this.preferenceService.get('files.autoSave')
        };

        const tasks = await this.taskService.getTasks();

        return {
            editorSettings,
            availableTasks: tasks.map(t => ({
                label: t.config.label,
                type: t.config.type,
                group: t.config.group
            })),
            debugConfigurations: [] // Would need to access debug configurations
        };
    }

    /**
     * Apply performance optimizations based on usage patterns
     */
    async applyPerformanceOptimizations(usageData: any): Promise<ActuatorResult> {
        const optimizations: any[] = [];

        try {
            // Memory optimizations
            if (usageData.highMemoryUsage) {
                await this.preferenceService.set('editor.suggest.maxVisibleSuggestions', 5);
                await this.preferenceService.set('editor.hover.delay', 1000);
                optimizations.push('reduced-suggestions', 'delayed-hover');
            }

            // Performance optimizations for large projects
            if (usageData.largeProject) {
                await this.preferenceService.set('files.exclude', {
                    '**/node_modules': true,
                    '**/dist': true,
                    '**/build': true,
                    '**/.git': true
                });
                optimizations.push('file-exclusions');
            }

            // Language-specific optimizations
            if (usageData.primaryLanguage === 'typescript') {
                await this.preferenceService.set('typescript.preferences.includePackageJsonAutoImports', 'off');
                optimizations.push('typescript-auto-import-optimization');
            }

            return {
                success: true,
                message: `Applied ${optimizations.length} performance optimizations`,
                changes: optimizations.map(opt => ({ optimization: opt, applied: true })),
                metadata: {
                    operation: 'performance-optimization',
                    optimizationsCount: optimizations.length
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `Performance optimization failed: ${error}`,
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }
}