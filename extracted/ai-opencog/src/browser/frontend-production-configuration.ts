/*
 * Copyright (C) 2024 Theia contributors.
 *
 * Licensed under the Eclipse Public License 2.0 (EPL-2.0);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.eclipse.org/legal/epl-2.0
 */

import { injectable, inject } from '@theia/core/shared/inversify';
import { 
    ProductionConfigurationService, 
    ProductionConfig, 
    EnvironmentSettings 
} from '../common/production-configuration';
import { PreferenceService } from '@theia/core/lib/browser';

/**
 * Frontend implementation of ProductionConfigurationService
 */
@injectable()
export class FrontendProductionConfigurationService extends ProductionConfigurationService {

    @inject(PreferenceService)
    protected override readonly preferenceService: PreferenceService;

    constructor() {
        super();
    }

    /**
     * Get configuration with frontend-specific optimizations
     */
    override async getConfiguration(): Promise<ProductionConfig> {
        const config = await super.getConfiguration();
        
        // Frontend-specific adjustments
        if (typeof window !== 'undefined') {
            // Browser environment
            config.deployment.containerized = false; // Frontend always runs in browser
            config.monitoring.logLevel = 'info'; // Reduce log verbosity in browser
        }
        
        return config;
    }

    /**
     * Apply configuration changes with UI feedback
     */
    async applyConfigurationWithFeedback(updates: Partial<ProductionConfig>): Promise<void> {
        try {
            await this.updateConfiguration(updates);
            
            // Show success message
            if (typeof window !== 'undefined' && (window as any).theiaNotificationService) {
                (window as any).theiaNotificationService.info('Production configuration updated successfully');
            }
        } catch (error) {
            console.error('Failed to apply configuration:', error);
            
            // Show error message
            if (typeof window !== 'undefined' && (window as any).theiaNotificationService) {
                (window as any).theiaNotificationService.error(`Failed to update configuration: ${error}`);
            }
            throw error;
        }
    }

    /**
     * Get browser-specific environment settings
     */
    async getBrowserEnvironmentSettings(): Promise<EnvironmentSettings & { browser: boolean; userAgent: string }> {
        const baseSettings = await this.getEnvironmentSettings();
        
        return {
            ...baseSettings,
            browser: true,
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
        };
    }
}