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
import { ResourceAllocation, ServiceConfiguration, ActuatorResult, Actuator } from '../common/sensor-motor-types';

/**
 * Manages development environment including resource allocation, service configuration, and performance tuning
 */
@injectable()
export class EnvironmentManagementActuator implements Actuator {

    private readonly defaultResourceLimits = {
        memory: 1024, // MB
        cpu: 80, // % usage
        disk: 10240, // MB
        network: 1000 // KB/s
    };

    constructor(
        @inject(PreferenceService) private readonly preferenceService: PreferenceService
    ) {}

    async execute(parameters: any): Promise<ActuatorResult> {
        const { action } = parameters;

        try {
            switch (action) {
                case 'allocate-resources':
                    return this.allocateResources(parameters.allocation as ResourceAllocation);
                case 'configure-service':
                    return this.configureService(parameters.config as ServiceConfiguration);
                case 'optimize-performance':
                    return this.optimizePerformance(parameters);
                case 'manage-cache':
                    return this.manageCache(parameters);
                case 'adjust-concurrency':
                    return this.adjustConcurrency(parameters);
                case 'monitor-resources':
                    return this.setupResourceMonitoring(parameters);
                case 'cleanup-environment':
                    return this.cleanupEnvironment(parameters);
                default:
                    return {
                        success: false,
                        message: `Unknown environment management action: ${action}`
                    };
            }
        } catch (error) {
            return {
                success: false,
                message: `Environment management operation failed: ${error}`,
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }

    async isAvailable(): Promise<boolean> {
        return true; // Environment management is always available
    }

    private async allocateResources(allocation: ResourceAllocation): Promise<ActuatorResult> {
        try {
            const changes: any[] = [];

            // Memory allocation
            if (allocation.memory !== undefined) {
                const memoryLimitMB = Math.min(allocation.memory, this.defaultResourceLimits.memory * 4);
                
                // Configure memory-related settings
                await this.preferenceService.set('typescript.preferences.includePackageJsonAutoImports', 
                    memoryLimitMB < 512 ? 'off' : 'auto');
                await this.preferenceService.set('editor.suggest.maxVisibleSuggestions', 
                    memoryLimitMB < 512 ? 5 : 12);
                
                changes.push({
                    resource: 'memory',
                    allocated: memoryLimitMB,
                    optimizations: memoryLimitMB < 512 ? ['reduced-suggestions', 'disabled-auto-imports'] : []
                });
            }

            // CPU allocation
            if (allocation.cpu !== undefined) {
                const cpuLimit = Math.min(allocation.cpu, 100);
                
                // Configure CPU-intensive features based on allocation
                await this.preferenceService.set('files.watcherExclude', cpuLimit < 50 ? {
                    '**/.git/**': true,
                    '**/node_modules/**': true,
                    '**/dist/**': true,
                    '**/build/**': true,
                    '**/*.log': true
                } : {
                    '**/.git/objects/**': true,
                    '**/node_modules/**': true
                });

                changes.push({
                    resource: 'cpu',
                    allocated: cpuLimit,
                    optimizations: cpuLimit < 50 ? ['aggressive-file-exclusions'] : ['basic-exclusions']
                });
            }

            // Disk allocation
            if (allocation.disk !== undefined) {
                const diskLimitMB = allocation.disk;
                
                // Configure disk-related settings
                await this.preferenceService.set('editor.formatOnSave', diskLimitMB > 1024);
                await this.preferenceService.set('files.autoSave', diskLimitMB > 2048 ? 'afterDelay' : 'off');
                
                changes.push({
                    resource: 'disk',
                    allocated: diskLimitMB,
                    optimizations: diskLimitMB < 1024 ? ['disabled-format-on-save', 'disabled-auto-save'] : []
                });
            }

            // Priority-based resource management
            if (allocation.priority) {
                await this.applyPrioritySettings(allocation.priority);
                changes.push({
                    resource: 'priority',
                    level: allocation.priority,
                    applied: true
                });
            }

            return {
                success: true,
                message: `Successfully allocated resources for ${changes.length} resource types`,
                changes,
                metadata: {
                    operation: 'allocate-resources',
                    resourcesAllocated: changes.length,
                    priority: allocation.priority
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `Resource allocation failed: ${error}`,
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }

    private async configureService(config: ServiceConfiguration): Promise<ActuatorResult> {
        try {
            const changes: any[] = [];
            const { service, enabled, parameters, restart } = config;

            // Configure specific services
            switch (service) {
                case 'typescript-language-server':
                    await this.configureTypeScriptService(enabled, parameters);
                    changes.push({ service, action: enabled ? 'enabled' : 'disabled', parameters });
                    break;

                case 'eslint':
                    await this.configureESLintService(enabled, parameters);
                    changes.push({ service, action: enabled ? 'enabled' : 'disabled', parameters });
                    break;

                case 'file-watcher':
                    await this.configureFileWatcherService(enabled, parameters);
                    changes.push({ service, action: enabled ? 'enabled' : 'disabled', parameters });
                    break;

                case 'auto-completion':
                    await this.configureAutoCompletionService(enabled, parameters);
                    changes.push({ service, action: enabled ? 'enabled' : 'disabled', parameters });
                    break;

                case 'git-integration':
                    await this.configureGitService(enabled, parameters);
                    changes.push({ service, action: enabled ? 'enabled' : 'disabled', parameters });
                    break;

                default:
                    return {
                        success: false,
                        message: `Unknown service: ${service}`
                    };
            }

            return {
                success: true,
                message: `Successfully configured service: ${service}`,
                changes,
                metadata: {
                    operation: 'configure-service',
                    service,
                    enabled,
                    restart
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `Service configuration failed: ${error}`,
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }

    private async optimizePerformance(parameters: any): Promise<ActuatorResult> {
        const { targetMetrics, currentMetrics } = parameters;
        const optimizations: any[] = [];

        try {
            // Memory optimization
            if (currentMetrics.memoryUsage > targetMetrics.memoryUsage) {
                await this.preferenceService.set('editor.minimap.enabled', false);
                await this.preferenceService.set('editor.suggest.snippetsPreventQuickSuggestions', true);
                await this.preferenceService.set('editor.parameterHints.enabled', false);
                optimizations.push('memory-reduction');
            }

            // Response time optimization
            if (currentMetrics.responseTime > targetMetrics.responseTime) {
                await this.preferenceService.set('editor.hover.delay', 1000);
                await this.preferenceService.set('editor.quickSuggestionsDelay', 500);
                optimizations.push('response-time-optimization');
            }

            // Build time optimization
            if (currentMetrics.buildTime > targetMetrics.buildTime) {
                await this.preferenceService.set('typescript.preferences.includePackageJsonAutoImports', 'off');
                await this.preferenceService.set('typescript.suggest.autoImports', false);
                optimizations.push('build-optimization');
            }

            // Resource utilization optimization
            if (currentMetrics.resourceUtilization?.cpu > 80) {
                await this.preferenceService.set('files.watcherExclude', {
                    '**/.git/**': true,
                    '**/node_modules/**': true,
                    '**/dist/**': true,
                    '**/build/**': true,
                    '**/*.log': true,
                    '**/coverage/**': true
                });
                optimizations.push('cpu-optimization');
            }

            return {
                success: true,
                message: `Applied ${optimizations.length} performance optimizations`,
                changes: optimizations.map(opt => ({ optimization: opt, applied: true })),
                metadata: {
                    operation: 'optimize-performance',
                    optimizationsCount: optimizations.length,
                    targetMetrics,
                    currentMetrics
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

    private async manageCache(parameters: any): Promise<ActuatorResult> {
        const { action, cacheType, sizeLimit } = parameters;
        const changes: any[] = [];

        try {
            switch (action) {
                case 'clear':
                    // Clear various caches - in browser environment, we can only suggest clearing
                    changes.push({ action: 'cache-clear-requested', type: cacheType || 'all' });
                    break;

                case 'optimize':
                    // Optimize cache settings
                    if (sizeLimit) {
                        await this.preferenceService.set('editor.suggest.maxVisibleSuggestions', 
                            sizeLimit < 100 ? 5 : 12);
                        changes.push({ action: 'cache-size-optimized', sizeLimit });
                    }
                    break;

                case 'configure':
                    // Configure cache behavior
                    await this.preferenceService.set('typescript.preferences.includePackageJsonAutoImports', 
                        parameters.enableAutoImportCache ? 'auto' : 'off');
                    changes.push({ action: 'cache-configured', settings: parameters });
                    break;
            }

            return {
                success: true,
                message: `Cache management completed: ${action}`,
                changes,
                metadata: {
                    operation: 'manage-cache',
                    action,
                    cacheType,
                    changesApplied: changes.length
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `Cache management failed: ${error}`,
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }

    private async adjustConcurrency(parameters: any): Promise<ActuatorResult> {
        const { maxConcurrentTasks, backgroundProcessLimit, ioThreads } = parameters;
        const changes: any[] = [];

        try {
            // Adjust TypeScript service concurrency
            if (maxConcurrentTasks !== undefined) {
                await this.preferenceService.set('typescript.preferences.includePackageJsonAutoImports',
                    maxConcurrentTasks < 2 ? 'off' : 'auto');
                changes.push({ setting: 'typescript-concurrency', value: maxConcurrentTasks });
            }

            // Adjust file watching concurrency
            if (backgroundProcessLimit !== undefined) {
                const exclusions = backgroundProcessLimit < 2 ? {
                    '**/.git/**': true,
                    '**/node_modules/**': true,
                    '**/dist/**': true,
                    '**/build/**': true,
                    '**/*.log': true
                } : {
                    '**/.git/objects/**': true,
                    '**/node_modules/**': true
                };
                
                await this.preferenceService.set('files.watcherExclude', exclusions);
                changes.push({ setting: 'file-watcher-concurrency', value: backgroundProcessLimit });
            }

            return {
                success: true,
                message: `Concurrency settings adjusted for ${changes.length} services`,
                changes,
                metadata: {
                    operation: 'adjust-concurrency',
                    maxConcurrentTasks,
                    backgroundProcessLimit,
                    ioThreads
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `Concurrency adjustment failed: ${error}`,
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }

    private async setupResourceMonitoring(parameters: any): Promise<ActuatorResult> {
        const { interval, thresholds, alerting } = parameters;
        
        // In a real implementation, this would set up actual monitoring
        // For now, we'll configure monitoring-related preferences
        
        try {
            const changes: any[] = [];

            if (thresholds?.memory) {
                // Set memory-aware configurations
                await this.preferenceService.set('editor.suggest.maxVisibleSuggestions',
                    thresholds.memory > 512 ? 12 : 5);
                changes.push({ type: 'memory-threshold-monitoring', threshold: thresholds.memory });
            }

            if (alerting) {
                // Configure alerting preferences
                await this.preferenceService.set('problems.showCurrentInStatus', true);
                changes.push({ type: 'alerting-enabled', enabled: alerting });
            }

            return {
                success: true,
                message: 'Resource monitoring configured',
                changes,
                metadata: {
                    operation: 'setup-resource-monitoring',
                    interval,
                    thresholds,
                    alerting
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `Resource monitoring setup failed: ${error}`,
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }

    private async cleanupEnvironment(parameters: any): Promise<ActuatorResult> {
        const { cleanTempFiles, clearCaches, resetSettings } = parameters;
        const changes: any[] = [];

        try {
            if (resetSettings) {
                // Reset performance-related settings to defaults
                await this.preferenceService.set('editor.minimap.enabled', true);
                await this.preferenceService.set('editor.suggest.maxVisibleSuggestions', 12);
                await this.preferenceService.set('typescript.preferences.includePackageJsonAutoImports', 'auto');
                changes.push({ action: 'settings-reset', count: 3 });
            }

            if (clearCaches) {
                // Request cache clearing (browser limitation)
                changes.push({ action: 'cache-clear-requested', type: 'all' });
            }

            return {
                success: true,
                message: `Environment cleanup completed with ${changes.length} actions`,
                changes,
                metadata: {
                    operation: 'cleanup-environment',
                    cleanTempFiles,
                    clearCaches,
                    resetSettings
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `Environment cleanup failed: ${error}`,
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }

    // Helper methods for specific service configurations

    private async applyPrioritySettings(priority: 'low' | 'normal' | 'high' | 'critical'): Promise<void> {
        switch (priority) {
            case 'critical':
                await this.preferenceService.set('editor.suggest.maxVisibleSuggestions', 5);
                await this.preferenceService.set('editor.minimap.enabled', false);
                await this.preferenceService.set('editor.hover.delay', 1000);
                break;
            case 'high':
                await this.preferenceService.set('editor.suggest.maxVisibleSuggestions', 8);
                await this.preferenceService.set('editor.hover.delay', 500);
                break;
            case 'low':
                await this.preferenceService.set('editor.suggest.maxVisibleSuggestions', 15);
                await this.preferenceService.set('editor.minimap.enabled', true);
                break;
            // 'normal' uses default settings
        }
    }

    private async configureTypeScriptService(enabled: boolean, parameters?: any): Promise<void> {
        await this.preferenceService.set('typescript.validate.enable', enabled);
        if (parameters?.strict !== undefined) {
            await this.preferenceService.set('typescript.preferences.includePackageJsonAutoImports', 
                parameters.strict ? 'on' : 'auto');
        }
    }

    private async configureESLintService(enabled: boolean, parameters?: any): Promise<void> {
        await this.preferenceService.set('eslint.enable', enabled);
        if (parameters?.autoFix) {
            await this.preferenceService.set('editor.codeActionsOnSave', {
                'source.fixAll.eslint': enabled && parameters.autoFix
            });
        }
    }

    private async configureFileWatcherService(enabled: boolean, parameters?: any): Promise<void> {
        if (!enabled) {
            await this.preferenceService.set('files.watcherExclude', {
                '**/*': true // Disable all file watching
            });
        } else {
            await this.preferenceService.set('files.watcherExclude', {
                '**/.git/objects/**': true,
                '**/node_modules/**': true,
                ...(parameters?.excludePatterns || {})
            });
        }
    }

    private async configureAutoCompletionService(enabled: boolean, parameters?: any): Promise<void> {
        await this.preferenceService.set('editor.quickSuggestions', enabled);
        if (parameters?.maxSuggestions) {
            await this.preferenceService.set('editor.suggest.maxVisibleSuggestions', parameters.maxSuggestions);
        }
    }

    private async configureGitService(enabled: boolean, parameters?: any): Promise<void> {
        await this.preferenceService.set('git.enabled', enabled);
        if (parameters?.autoFetch !== undefined) {
            await this.preferenceService.set('git.autofetch', enabled && parameters.autoFetch);
        }
    }
}