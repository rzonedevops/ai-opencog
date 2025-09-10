/*
 * Copyright (C) 2024 Theia contributors.
 *
 * Licensed under the Eclipse Public License 2.0 (EPL-2.0);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.eclipse.org/legal/epl-2.0
 */

import { injectable } from '@theia/core/shared/inversify';
import { 
    CommunityEnhancementService,
    EnhancementRequest,
    CommunityContribution,
    ReleaseInfo
} from '../common/community-enhancement';

/**
 * Frontend implementation of CommunityEnhancementService with UI integration
 */
@injectable()
export class FrontendCommunityEnhancementService extends CommunityEnhancementService {

    /**
     * Submit enhancement with UI validation
     */
    async submitEnhancementWithValidation(request: Omit<EnhancementRequest, 'id' | 'submittedAt' | 'votes' | 'feedback' | 'status'>): Promise<string> {
        // Validate input
        if (!request.title || request.title.trim().length < 10) {
            throw new Error('Enhancement title must be at least 10 characters long');
        }
        
        if (!request.description || request.description.trim().length < 50) {
            throw new Error('Enhancement description must be at least 50 characters long');
        }

        try {
            const enhancementId = await this.submitEnhancement(request);
            
            // Show success notification
            this.showNotification('success', `Enhancement request submitted successfully! ID: ${enhancementId}`);
            
            return enhancementId;
        } catch (error) {
            this.showNotification('error', `Failed to submit enhancement: ${error}`);
            throw error;
        }
    }

    /**
     * Submit contribution with file validation
     */
    async submitContributionWithValidation(
        contribution: Omit<CommunityContribution, 'id' | 'submittedAt' | 'status' | 'reviewComments'>,
        files?: File[]
    ): Promise<string> {
        // Validate contribution
        if (!contribution.title || contribution.title.trim().length < 5) {
            throw new Error('Contribution title must be at least 5 characters long');
        }

        // Validate files for certain contribution types
        if (contribution.type === 'plugin' && (!files || files.length === 0)) {
            throw new Error('Plugin contributions must include at least one file');
        }

        try {
            const contributionId = await this.submitContribution(contribution);
            
            // If files are provided, simulate file upload
            if (files && files.length > 0) {
                await this.uploadContributionFiles(contributionId, files);
            }
            
            this.showNotification('success', `Contribution submitted successfully! ID: ${contributionId}`);
            
            return contributionId;
        } catch (error) {
            this.showNotification('error', `Failed to submit contribution: ${error}`);
            throw error;
        }
    }

    /**
     * Get enhanced community statistics with UI formatting
     */
    getFormattedCommunityStats(): {
        summary: string;
        details: {
            enhancements: { label: string; value: string; trend: 'up' | 'down' | 'stable' }[];
            contributions: { label: string; value: string; trend: 'up' | 'down' | 'stable' }[];
            engagement: { label: string; value: string; trend: 'up' | 'down' | 'stable' }[];
        };
    } {
        const stats = this.getCommunityStats();
        
        return {
            summary: `${stats.enhancements.total} enhancement requests, ${stats.contributions.total} contributions, ${stats.engagement.activeContributors} active contributors`,
            details: {
                enhancements: [
                    { 
                        label: 'Total Requests', 
                        value: stats.enhancements.total.toString(), 
                        trend: 'up' as const 
                    },
                    { 
                        label: 'In Progress', 
                        value: (stats.enhancements.byStatus['in-progress'] || 0).toString(), 
                        trend: 'stable' as const 
                    },
                    { 
                        label: 'Completed', 
                        value: (stats.enhancements.byStatus['deployed'] || 0).toString(), 
                        trend: 'up' as const 
                    }
                ],
                contributions: [
                    { 
                        label: 'Total Contributions', 
                        value: stats.contributions.total.toString(), 
                        trend: 'up' as const 
                    },
                    { 
                        label: 'Pending Review', 
                        value: (stats.contributions.byStatus['pending'] || 0).toString(), 
                        trend: 'stable' as const 
                    },
                    { 
                        label: 'Accepted', 
                        value: (stats.contributions.byStatus['accepted'] || 0).toString(), 
                        trend: 'up' as const 
                    }
                ],
                engagement: [
                    { 
                        label: 'Active Contributors', 
                        value: stats.engagement.activeContributors.toString(), 
                        trend: 'up' as const 
                    },
                    { 
                        label: 'Total Votes', 
                        value: stats.engagement.totalVotes.toString(), 
                        trend: 'up' as const 
                    },
                    { 
                        label: 'Avg Response Time', 
                        value: `${stats.engagement.averageResponseTime} days`, 
                        trend: 'down' as const 
                    }
                ]
            }
        };
    }

    /**
     * Get roadmap data for UI visualization
     */
    getVisualizationData(): {
        timeline: Array<{
            date: string;
            version: string;
            features: number;
            improvements: number;
        }>;
        categoryDistribution: Array<{
            category: string;
            count: number;
            percentage: number;
        }>;
        priorityMatrix: Array<{
            priority: string;
            count: number;
            averageVotes: number;
        }>;
    } {
        const releases = this.getReleases();
        const enhancements = this.getEnhancements();
        
        // Timeline data
        const timeline = releases.map(release => ({
            date: release.releaseDate.toISOString().split('T')[0],
            version: release.version,
            features: release.features.length,
            improvements: release.improvements.length + release.cognitiveEnhancements.length
        }));

        // Category distribution
        const categoryCount = new Map<string, number>();
        const totalEnhancements = enhancements.length;
        
        enhancements.forEach(enhancement => {
            categoryCount.set(enhancement.category, (categoryCount.get(enhancement.category) || 0) + 1);
        });

        const categoryDistribution = Array.from(categoryCount.entries()).map(([category, count]) => ({
            category,
            count,
            percentage: Math.round((count / totalEnhancements) * 100)
        }));

        // Priority matrix
        const priorityStats = new Map<string, { count: number; totalVotes: number }>();
        
        enhancements.forEach(enhancement => {
            const current = priorityStats.get(enhancement.priority) || { count: 0, totalVotes: 0 };
            current.count++;
            current.totalVotes += enhancement.votes;
            priorityStats.set(enhancement.priority, current);
        });

        const priorityMatrix = Array.from(priorityStats.entries()).map(([priority, stats]) => ({
            priority,
            count: stats.count,
            averageVotes: stats.count > 0 ? Math.round(stats.totalVotes / stats.count) : 0
        }));

        return {
            timeline,
            categoryDistribution,
            priorityMatrix
        };
    }

    private async uploadContributionFiles(contributionId: string, files: File[]): Promise<void> {
        // Simulate file upload process
        console.log(`Uploading ${files.length} files for contribution ${contributionId}`);
        
        for (const file of files) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
            }
            
            // Validate file type
            const allowedTypes = ['.js', '.ts', '.json', '.md', '.txt', '.yml', '.yaml'];
            const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
            
            if (!allowedTypes.includes(fileExtension)) {
                throw new Error(`File type ${fileExtension} is not allowed for ${file.name}`);
            }
        }
        
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log(`Successfully uploaded ${files.length} files for contribution ${contributionId}`);
    }

    private showNotification(type: 'success' | 'error' | 'info', message: string): void {
        // Try to use Theia's notification service if available
        if (typeof window !== 'undefined') {
            const theiaNotificationService = (window as any).theiaNotificationService;
            if (theiaNotificationService) {
                switch (type) {
                    case 'success':
                        theiaNotificationService.info(message);
                        break;
                    case 'error':
                        theiaNotificationService.error(message);
                        break;
                    case 'info':
                        theiaNotificationService.info(message);
                        break;
                }
                return;
            }
        }
        
        // Fallback to console
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}