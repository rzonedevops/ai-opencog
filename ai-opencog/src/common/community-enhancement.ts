/*
 * Copyright (C) 2024 Theia contributors.
 *
 * Licensed under the Eclipse Public License 2.0 (EPL-2.0);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.eclipse.org/legal/epl-2.0
 */

import { injectable, inject } from '@theia/core/shared/inversify';
import { FeedbackIntegration } from './feedback-integration';
import { ProductionMonitoringService } from './production-monitoring';

export interface EnhancementRequest {
    id: string;
    title: string;
    description: string;
    category: 'feature' | 'performance' | 'cognitive' | 'usability' | 'documentation';
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'submitted' | 'reviewing' | 'approved' | 'in-progress' | 'testing' | 'deployed' | 'rejected';
    submittedBy: string;
    submittedAt: Date;
    votes: number;
    feedback: string[];
    estimatedEffort: 'small' | 'medium' | 'large' | 'extra-large';
    targetVersion?: string;
}

export interface CommunityContribution {
    id: string;
    type: 'documentation' | 'tutorial' | 'example' | 'plugin' | 'improvement';
    title: string;
    description: string;
    contributor: string;
    submittedAt: Date;
    status: 'pending' | 'reviewed' | 'accepted' | 'merged' | 'rejected';
    reviewComments: string[];
    downloadCount?: number;
    rating?: number;
}

export interface ReleaseInfo {
    version: string;
    releaseDate: Date;
    features: string[];
    improvements: string[];
    bugFixes: string[];
    cognitiveEnhancements: string[];
    breakingChanges: string[];
    migrationGuide?: string;
}

/**
 * Community building and continuous enhancement service
 */
@injectable()
export class CommunityEnhancementService {

    private enhancements = new Map<string, EnhancementRequest>();
    private contributions = new Map<string, CommunityContribution>();
    private releases: ReleaseInfo[] = [];

    constructor(
        @inject(FeedbackIntegration) protected readonly feedbackService: FeedbackIntegration,
        @inject(ProductionMonitoringService) protected readonly monitoringService: ProductionMonitoringService
    ) {}

    /**
     * Submit an enhancement request
     */
    async submitEnhancement(request: Omit<EnhancementRequest, 'id' | 'submittedAt' | 'votes' | 'feedback' | 'status'>): Promise<string> {
        const id = this.generateId('enhancement');
        const enhancement: EnhancementRequest = {
            ...request,
            id,
            submittedAt: new Date(),
            votes: 0,
            feedback: [],
            status: 'submitted'
        };

        this.enhancements.set(id, enhancement);
        
        this.monitoringService.log('info', 'community', `New enhancement request submitted: ${request.title}`, {
            enhancementId: id,
            category: request.category,
            priority: request.priority
        });

        // Auto-analyze enhancement based on existing feedback
        await this.analyzeEnhancement(enhancement);

        return id;
    }

    /**
     * Vote for an enhancement
     */
    async voteForEnhancement(enhancementId: string, userId: string): Promise<void> {
        const enhancement = this.enhancements.get(enhancementId);
        if (!enhancement) {
            throw new Error(`Enhancement ${enhancementId} not found`);
        }

        enhancement.votes++;
        this.enhancements.set(enhancementId, enhancement);

        this.monitoringService.log('info', 'community', `Vote cast for enhancement: ${enhancement.title}`, {
            enhancementId,
            userId,
            totalVotes: enhancement.votes
        });

        // Check if enhancement should be prioritized based on votes
        if (enhancement.votes >= 10 && enhancement.priority === 'low') {
            enhancement.priority = 'medium';
            this.monitoringService.log('info', 'community', `Enhancement ${enhancementId} priority upgraded due to votes`);
        }
    }

    /**
     * Submit a community contribution
     */
    async submitContribution(contribution: Omit<CommunityContribution, 'id' | 'submittedAt' | 'status' | 'reviewComments'>): Promise<string> {
        const id = this.generateId('contribution');
        const contrib: CommunityContribution = {
            ...contribution,
            id,
            submittedAt: new Date(),
            status: 'pending',
            reviewComments: []
        };

        this.contributions.set(id, contrib);

        this.monitoringService.log('info', 'community', `New contribution submitted: ${contribution.title}`, {
            contributionId: id,
            type: contribution.type,
            contributor: contribution.contributor
        });

        return id;
    }

    /**
     * Review and accept/reject contribution
     */
    async reviewContribution(contributionId: string, decision: 'accept' | 'reject', comments: string[]): Promise<void> {
        const contribution = this.contributions.get(contributionId);
        if (!contribution) {
            throw new Error(`Contribution ${contributionId} not found`);
        }

        contribution.status = decision === 'accept' ? 'accepted' : 'rejected';
        contribution.reviewComments = comments;

        this.contributions.set(contributionId, contribution);

        this.monitoringService.log('info', 'community', `Contribution ${decision}: ${contribution.title}`, {
            contributionId,
            decision,
            comments
        });

        if (decision === 'accept') {
            // Generate enhancement request from accepted contribution
            await this.submitEnhancement({
                title: `Implement: ${contribution.title}`,
                description: `Community contribution: ${contribution.description}`,
                category: this.mapContributionTypeToCategory(contribution.type),
                priority: 'medium',
                submittedBy: contribution.contributor,
                estimatedEffort: 'medium'
            });
        }
    }

    /**
     * Plan next release based on feedback and enhancements
     */
    async planNextRelease(targetVersion: string): Promise<ReleaseInfo> {
        // Analyze feedback trends
        const feedbackAnalysis = await this.feedbackService.analyzeFeedback();
        
        // Get recent usage analytics
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        const usageAnalytics = await this.monitoringService.generateUsageAnalytics(startDate, endDate);

        // Select enhancements for release
        const selectedEnhancements = this.selectEnhancementsForRelease(feedbackAnalysis, usageAnalytics);

        const releaseInfo: ReleaseInfo = {
            version: targetVersion,
            releaseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            features: [],
            improvements: [],
            bugFixes: [],
            cognitiveEnhancements: [],
            breakingChanges: []
        };

        // Categorize enhancements
        for (const enhancement of selectedEnhancements) {
            enhancement.status = 'approved';
            enhancement.targetVersion = targetVersion;
            this.enhancements.set(enhancement.id, enhancement);

            switch (enhancement.category) {
                case 'feature':
                    releaseInfo.features.push(enhancement.title);
                    break;
                case 'performance':
                    releaseInfo.improvements.push(enhancement.title);
                    break;
                case 'cognitive':
                    releaseInfo.cognitiveEnhancements.push(enhancement.title);
                    break;
                case 'usability':
                    releaseInfo.improvements.push(enhancement.title);
                    break;
                case 'documentation':
                    // Documentation improvements don't require release notes
                    break;
            }
        }

        // Add items based on feedback analysis
        if (feedbackAnalysis.insights.some(i => i.type === 'performance')) {
            releaseInfo.improvements.push('Performance optimizations based on user feedback');
        }

        if (feedbackAnalysis.insights.some(i => i.type === 'cognitive')) {
            releaseInfo.cognitiveEnhancements.push('Enhanced cognitive reasoning capabilities');
        }

        this.releases.push(releaseInfo);

        this.monitoringService.log('info', 'community', `Release ${targetVersion} planned`, {
            releaseInfo,
            selectedEnhancements: selectedEnhancements.length
        });

        return releaseInfo;
    }

    /**
     * Get community statistics
     */
    getCommunityStats(): {
        enhancements: {
            total: number;
            byStatus: { [status: string]: number };
            byCategory: { [category: string]: number };
        };
        contributions: {
            total: number;
            byType: { [type: string]: number };
            byStatus: { [status: string]: number };
        };
        engagement: {
            totalVotes: number;
            activeContributors: number;
            averageResponseTime: number;
        };
    } {
        const enhancementsByStatus: { [status: string]: number } = {};
        const enhancementsByCategory: { [category: string]: number } = {};
        let totalVotes = 0;

        for (const enhancement of this.enhancements.values()) {
            enhancementsByStatus[enhancement.status] = (enhancementsByStatus[enhancement.status] || 0) + 1;
            enhancementsByCategory[enhancement.category] = (enhancementsByCategory[enhancement.category] || 0) + 1;
            totalVotes += enhancement.votes;
        }

        const contributionsByType: { [type: string]: number } = {};
        const contributionsByStatus: { [status: string]: number } = {};
        const contributors = new Set<string>();

        for (const contribution of this.contributions.values()) {
            contributionsByType[contribution.type] = (contributionsByType[contribution.type] || 0) + 1;
            contributionsByStatus[contribution.status] = (contributionsByStatus[contribution.status] || 0) + 1;
            contributors.add(contribution.contributor);
        }

        return {
            enhancements: {
                total: this.enhancements.size,
                byStatus: enhancementsByStatus,
                byCategory: enhancementsByCategory
            },
            contributions: {
                total: this.contributions.size,
                byType: contributionsByType,
                byStatus: contributionsByStatus
            },
            engagement: {
                totalVotes,
                activeContributors: contributors.size,
                averageResponseTime: 2.5 // days - simplified calculation
            }
        };
    }

    /**
     * Get enhancement requests
     */
    getEnhancements(status?: EnhancementRequest['status'], category?: EnhancementRequest['category']): EnhancementRequest[] {
        let enhancements = Array.from(this.enhancements.values());
        
        if (status) {
            enhancements = enhancements.filter(e => e.status === status);
        }
        if (category) {
            enhancements = enhancements.filter(e => e.category === category);
        }

        return enhancements.sort((a, b) => {
            // Sort by priority, then by votes, then by date
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            if (a.votes !== b.votes) {
                return b.votes - a.votes;
            }
            return b.submittedAt.getTime() - a.submittedAt.getTime();
        });
    }

    /**
     * Get community contributions
     */
    getContributions(type?: CommunityContribution['type'], status?: CommunityContribution['status']): CommunityContribution[] {
        let contributions = Array.from(this.contributions.values());
        
        if (type) {
            contributions = contributions.filter(c => c.type === type);
        }
        if (status) {
            contributions = contributions.filter(c => c.status === status);
        }

        return contributions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
    }

    /**
     * Get release history
     */
    getReleases(): ReleaseInfo[] {
        return this.releases.sort((a, b) => b.releaseDate.getTime() - a.releaseDate.getTime());
    }

    private async analyzeEnhancement(enhancement: EnhancementRequest): Promise<void> {
        // Use feedback integration to analyze if this enhancement aligns with user needs
        const feedbackAnalysis = await this.feedbackService.analyzeFeedback();
        
        // Check if enhancement addresses common feedback themes
        const relatedInsights = feedbackAnalysis.insights.filter(insight => 
            insight.description.toLowerCase().includes(enhancement.title.toLowerCase()) ||
            insight.description.toLowerCase().includes(enhancement.description.toLowerCase())
        );

        if (relatedInsights.length > 0) {
            enhancement.priority = 'high';
            enhancement.feedback.push('Auto-prioritized: Addresses common user feedback themes');
            this.enhancements.set(enhancement.id, enhancement);
        }
    }

    private selectEnhancementsForRelease(feedbackAnalysis: any, usageAnalytics: any): EnhancementRequest[] {
        const candidates = Array.from(this.enhancements.values())
            .filter(e => e.status === 'submitted' || e.status === 'reviewing')
            .sort((a, b) => {
                // Prioritize by votes, priority, and alignment with feedback
                const scoreA = this.calculateEnhancementScore(a, feedbackAnalysis, usageAnalytics);
                const scoreB = this.calculateEnhancementScore(b, feedbackAnalysis, usageAnalytics);
                return scoreB - scoreA;
            });

        // Select top enhancements that fit within release capacity
        const selected: EnhancementRequest[] = [];
        let totalEffort = 0;
        const maxEffort = 20; // Arbitrary release capacity

        for (const enhancement of candidates) {
            const effort = this.getEffortPoints(enhancement.estimatedEffort);
            if (totalEffort + effort <= maxEffort) {
                selected.push(enhancement);
                totalEffort += effort;
            }
        }

        return selected;
    }

    private calculateEnhancementScore(enhancement: EnhancementRequest, feedbackAnalysis: any, usageAnalytics: any): number {
        let score = 0;

        // Vote weight
        score += enhancement.votes * 2;

        // Priority weight
        const priorityWeight = { critical: 100, high: 50, medium: 25, low: 10 };
        score += priorityWeight[enhancement.priority];

        // Category weight based on usage analytics
        if (enhancement.category === 'cognitive' && usageAnalytics.cognitive.totalOperations > 100) {
            score += 30; // High cognitive usage
        }
        if (enhancement.category === 'performance' && usageAnalytics.cognitive.averageResponseTime > 200) {
            score += 40; // Performance issues detected
        }

        // Feedback alignment
        const alignmentBonus = feedbackAnalysis.insights.filter((insight: any) => 
            insight.description.toLowerCase().includes(enhancement.title.toLowerCase())
        ).length * 20;
        score += alignmentBonus;

        return score;
    }

    private getEffortPoints(effort: EnhancementRequest['estimatedEffort']): number {
        const effortPoints = { small: 1, medium: 3, large: 8, 'extra-large': 13 };
        return effortPoints[effort];
    }

    private mapContributionTypeToCategory(type: CommunityContribution['type']): EnhancementRequest['category'] {
        const mapping = {
            documentation: 'documentation' as const,
            tutorial: 'documentation' as const,
            example: 'usability' as const,
            plugin: 'feature' as const,
            improvement: 'performance' as const
        };
        return mapping[type];
    }

    private generateId(prefix: string): string {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}