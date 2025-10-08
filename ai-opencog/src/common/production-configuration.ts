/*
 * Copyright (C) 2024 Theia contributors.
 *
 * Licensed under the Eclipse Public License 2.0 (EPL-2.0);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.eclipse.org/legal/epl-2.0
 */

import { injectable, inject } from '@theia/core/shared/inversify';
import { PreferenceService } from '@theia/core/lib/browser';

export interface ProductionConfig {
    environment: 'development' | 'staging' | 'production';
    cognitiveServices: {
        enabled: boolean;
        maxConcurrency: number;
        timeout: number;
        retryAttempts: number;
        cacheSize: number;
    };
    performance: {
        memoryLimit: number;
        cpuThreshold: number;
        diskSpaceThreshold: number;
        responseTimeThreshold: number;
    };
    monitoring: {
        enabled: boolean;
        metricsInterval: number;
        alerting: boolean;
        logLevel: 'error' | 'warn' | 'info' | 'debug';
    };
    deployment: {
        containerized: boolean;
        autoScaling: boolean;
        healthCheckInterval: number;
        gracefulShutdownTimeout: number;
    };
}

export interface EnvironmentSettings {
    [key: string]: any;
}

/**
 * Production configuration management service
 */
@injectable()
export class ProductionConfigurationService {

    constructor(
        @inject(PreferenceService) protected readonly preferenceService: PreferenceService
    ) {}

    private readonly defaultConfig: ProductionConfig = {
        environment: 'development',
        cognitiveServices: {
            enabled: true,
            maxConcurrency: 10,
            timeout: 30000,
            retryAttempts: 3,
            cacheSize: 1000
        },
        performance: {
            memoryLimit: 2048,
            cpuThreshold: 80,
            diskSpaceThreshold: 85,
            responseTimeThreshold: 5000
        },
        monitoring: {
            enabled: true,
            metricsInterval: 60000,
            alerting: true,
            logLevel: 'info'
        },
        deployment: {
            containerized: false,
            autoScaling: false,
            healthCheckInterval: 30000,
            gracefulShutdownTimeout: 30000
        }
    };

    /**
     * Get current production configuration
     */
    async getConfiguration(): Promise<ProductionConfig> {
        const environment = await this.getEnvironment();
        const config = { ...this.defaultConfig };
        
        // Apply environment-specific overrides
        switch (environment) {
            case 'production':
                config.cognitiveServices.maxConcurrency = 50;
                config.performance.memoryLimit = 8192;
                config.monitoring.logLevel = 'warn';
                config.deployment.containerized = true;
                config.deployment.autoScaling = true;
                break;
            case 'staging':
                config.cognitiveServices.maxConcurrency = 25;
                config.performance.memoryLimit = 4096;
                config.monitoring.logLevel = 'info';
                config.deployment.containerized = true;
                break;
            case 'development':
                config.monitoring.logLevel = 'debug';
                break;
        }

        return config;
    }

    /**
     * Update configuration settings
     */
    async updateConfiguration(updates: Partial<ProductionConfig>): Promise<void> {
        const currentConfig = await this.getConfiguration();
        const newConfig = this.mergeConfig(currentConfig, updates);
        
        // Apply configuration changes
        await this.applyConfiguration(newConfig);
    }

    /**
     * Get current environment
     */
    async getEnvironment(): Promise<'development' | 'staging' | 'production'> {
        const env = process.env.NODE_ENV || 
                   await this.preferenceService.get('ai-opencog.environment');
        return env as 'development' | 'staging' | 'production';
    }

    /**
     * Configure cognitive service parameters
     */
    async configureCognitiveServices(settings: {
        enabled?: boolean;
        maxConcurrency?: number;
        timeout?: number;
        retryAttempts?: number;
        cacheSize?: number;
    }): Promise<void> {
        if (settings.enabled !== undefined) {
            await this.preferenceService.set('ai-opencog.cognitive.enabled', settings.enabled);
        }
        if (settings.maxConcurrency !== undefined) {
            await this.preferenceService.set('ai-opencog.cognitive.maxConcurrency', settings.maxConcurrency);
        }
        if (settings.timeout !== undefined) {
            await this.preferenceService.set('ai-opencog.cognitive.timeout', settings.timeout);
        }
        if (settings.retryAttempts !== undefined) {
            await this.preferenceService.set('ai-opencog.cognitive.retryAttempts', settings.retryAttempts);
        }
        if (settings.cacheSize !== undefined) {
            await this.preferenceService.set('ai-opencog.cognitive.cacheSize', settings.cacheSize);
        }
    }

    /**
     * Configure performance tuning settings
     */
    async configurePerformance(settings: {
        memoryLimit?: number;
        cpuThreshold?: number;
        diskSpaceThreshold?: number;
        responseTimeThreshold?: number;
    }): Promise<void> {
        if (settings.memoryLimit !== undefined) {
            await this.preferenceService.set('ai-opencog.performance.memoryLimit', settings.memoryLimit);
        }
        if (settings.cpuThreshold !== undefined) {
            await this.preferenceService.set('ai-opencog.performance.cpuThreshold', settings.cpuThreshold);
        }
        if (settings.diskSpaceThreshold !== undefined) {
            await this.preferenceService.set('ai-opencog.performance.diskSpaceThreshold', settings.diskSpaceThreshold);
        }
        if (settings.responseTimeThreshold !== undefined) {
            await this.preferenceService.set('ai-opencog.performance.responseTimeThreshold', settings.responseTimeThreshold);
        }
    }

    /**
     * Get environment-specific settings
     */
    async getEnvironmentSettings(): Promise<EnvironmentSettings> {
        const environment = await this.getEnvironment();
        const baseSettings = {
            NODE_ENV: environment,
            AI_OPENCOG_ENVIRONMENT: environment
        };

        switch (environment) {
            case 'production':
                return {
                    ...baseSettings,
                    AI_OPENCOG_LOG_LEVEL: 'warn',
                    AI_OPENCOG_METRICS_ENABLED: 'true',
                    AI_OPENCOG_CACHE_SIZE: '5000',
                    AI_OPENCOG_MAX_CONCURRENCY: '50'
                };
            case 'staging':
                return {
                    ...baseSettings,
                    AI_OPENCOG_LOG_LEVEL: 'info',
                    AI_OPENCOG_METRICS_ENABLED: 'true',
                    AI_OPENCOG_CACHE_SIZE: '2500',
                    AI_OPENCOG_MAX_CONCURRENCY: '25'
                };
            case 'development':
                return {
                    ...baseSettings,
                    AI_OPENCOG_LOG_LEVEL: 'debug',
                    AI_OPENCOG_METRICS_ENABLED: 'true',
                    AI_OPENCOG_CACHE_SIZE: '1000',
                    AI_OPENCOG_MAX_CONCURRENCY: '10'
                };
            default:
                return baseSettings;
        }
    }

    private mergeConfig(current: ProductionConfig, updates: Partial<ProductionConfig>): ProductionConfig {
        return {
            environment: updates.environment || current.environment,
            cognitiveServices: { ...current.cognitiveServices, ...updates.cognitiveServices },
            performance: { ...current.performance, ...updates.performance },
            monitoring: { ...current.monitoring, ...updates.monitoring },
            deployment: { ...current.deployment, ...updates.deployment }
        };
    }

    private async applyConfiguration(config: ProductionConfig): Promise<void> {
        // Apply cognitive services configuration
        await this.configureCognitiveServices(config.cognitiveServices);
        
        // Apply performance configuration
        await this.configurePerformance(config.performance);
        
        // Apply monitoring configuration
        await this.preferenceService.set('ai-opencog.monitoring.enabled', config.monitoring.enabled);
        await this.preferenceService.set('ai-opencog.monitoring.metricsInterval', config.monitoring.metricsInterval);
        await this.preferenceService.set('ai-opencog.monitoring.alerting', config.monitoring.alerting);
        await this.preferenceService.set('ai-opencog.monitoring.logLevel', config.monitoring.logLevel);
        
        // Apply deployment configuration
        await this.preferenceService.set('ai-opencog.deployment.containerized', config.deployment.containerized);
        await this.preferenceService.set('ai-opencog.deployment.autoScaling', config.deployment.autoScaling);
        await this.preferenceService.set('ai-opencog.deployment.healthCheckInterval', config.deployment.healthCheckInterval);
        await this.preferenceService.set('ai-opencog.deployment.gracefulShutdownTimeout', config.deployment.gracefulShutdownTimeout);
    }
}