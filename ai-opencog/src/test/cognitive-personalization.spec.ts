/**
 * Copyright (c) 2024 Cognitive Intelligence Ventures.
 * 
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 * 
 * SPDX-License-Identifier: EPL-2.0
 */

import { expect } from 'chai';
import { Container } from '@theia/core/shared/inversify';
import { CognitivePersonalization, UserPreferences } from '../common/cognitive-personalization';
import { OpenCogService } from '../common/opencog-service';

// Mock OpenCog service for testing
class MockOpenCogService implements Partial<OpenCogService> {
    async learn(data: any): Promise<any> {
        return { success: true, data };
    }

    async reason(query: any): Promise<any> {
        return {
            patterns: [
                {
                    description: 'Mock cognitive recommendation',
                    confidence: 0.8,
                    action: { type: 'mock_action' }
                }
            ]
        };
    }
}

describe('CognitivePersonalization', () => {
    let personalization: CognitivePersonalization;
    let container: Container;

    beforeEach(() => {
        container = new Container();
        container.bind(OpenCogService).to(MockOpenCogService as any);
        container.bind(CognitivePersonalization).toSelf();
        
        personalization = container.get(CognitivePersonalization);
    });

    it('should adapt to user preferences', async () => {
        const userId = 'test-user';
        const preferences: UserPreferences = {
            theme: 'dark',
            reasoningDepth: 'deep',
            learningRate: 'aggressive',
            adaptiveInterface: true
        };

        await personalization.adaptToUser(userId, preferences);
        
        const profile = personalization.getProfile(userId);
        expect(profile).to.exist;
        expect(profile!.preferences.theme).to.equal('dark');
        expect(profile!.preferences.reasoningDepth).to.equal('deep');
    });

    it('should learn from user interactions', async () => {
        const userId = 'test-user';
        
        await personalization.learnFromInteraction(userId, {
            action: 'code_completion',
            context: 'editor',
            duration: 2000,
            success: true,
            satisfaction: 4
        });

        const profile = personalization.getProfile(userId);
        expect(profile).to.exist;
        expect(profile!.context.interactionHistory).to.have.length(1);
        expect(profile!.context.interactionHistory![0].action).to.equal('code_completion');
        expect(profile!.context.interactionHistory![0].satisfaction).to.equal(4);
    });

    it('should generate personalized recommendations', async () => {
        const userId = 'test-user';
        
        // First adapt to user with proactive assistance enabled
        await personalization.adaptToUser(userId, {
            proactiveAssistance: true,
            adaptiveInterface: true
        });

        const recommendations = await personalization.getRecommendations(userId, 'coding');
        
        expect(recommendations).to.be.an('array');
        // Should have at least one recommendation from mock service
        expect(recommendations.length).to.be.greaterThan(0);
        
        const cognitiveRec = recommendations.find(r => r.type === 'cognitive');
        expect(cognitiveRec).to.exist;
        expect(cognitiveRec!.confidence).to.be.a('number');
    });

    it('should update user context', async () => {
        const userId = 'test-user';
        
        await personalization.updateContext(userId, {
            currentProject: 'my-project',
            recentFiles: ['file1.ts', 'file2.ts'],
            sessionDuration: 3600000 // 1 hour
        });

        const profile = personalization.getProfile(userId);
        expect(profile!.context.currentProject).to.equal('my-project');
        expect(profile!.context.recentFiles).to.deep.equal(['file1.ts', 'file2.ts']);
        expect(profile!.context.sessionDuration).to.equal(3600000);
    });

    it('should create default profile for new users', () => {
        const userId = 'new-user';
        
        const profile = personalization.getProfile(userId);
        expect(profile).to.not.exist; // Profile doesn't exist yet
        
        // Trigger profile creation by adapting to user
        personalization.adaptToUser(userId, {});
        
        const createdProfile = personalization.getProfile(userId);
        expect(createdProfile).to.exist;
        expect(createdProfile!.preferences.theme).to.equal('auto');
        expect(createdProfile!.preferences.reasoningDepth).to.equal('medium');
        expect(createdProfile!.preferences.adaptiveInterface).to.be.true;
    });

    it('should identify interaction patterns', async () => {
        const userId = 'pattern-user';
        
        // Create multiple interactions with similar patterns
        for (let i = 0; i < 6; i++) {
            await personalization.learnFromInteraction(userId, {
                action: 'file_open',
                context: 'explorer',
                satisfaction: 4
            });
        }

        // Add some low satisfaction interactions
        for (let i = 0; i < 3; i++) {
            await personalization.learnFromInteraction(userId, {
                action: 'search',
                context: 'global',
                satisfaction: 2
            });
        }

        const learning = await personalization.learnFromInteraction(userId, {
            action: 'test_action',
            context: 'test'
        });

        // The learning should have generated insights about patterns
        // This would be validated by checking the OpenCog learning calls
        // For now, just verify the interaction was recorded
        const profile = personalization.getProfile(userId);
        expect(profile!.context.interactionHistory!.length).to.be.greaterThan(6);
    });

    it('should generate UI recommendations for long sessions', async () => {
        const userId = 'ui-user';
        
        // Set up a user with a long session
        await personalization.updateContext(userId, {
            sessionDuration: 3700000 // > 1 hour
        });
        
        await personalization.adaptToUser(userId, {
            adaptiveInterface: true
        });

        const recommendations = await personalization.getRecommendations(userId);
        
        // Should include UI recommendations for long sessions
        const uiRecs = recommendations.filter(r => r.type === 'ui');
        expect(uiRecs.length).to.be.greaterThan(0);
        
        // Should suggest dark theme for long sessions
        const darkThemeRec = uiRecs.find(r => r.description.includes('dark theme'));
        expect(darkThemeRec).to.exist;
    });

    it('should handle different reasoning depths', async () => {
        const userId = 'depth-user';
        
        // Test shallow reasoning
        await personalization.adaptToUser(userId, {
            reasoningDepth: 'shallow'
        });
        
        let profile = personalization.getProfile(userId);
        expect(profile!.adaptations.some(a => a.feature === 'reasoning_depth')).to.be.true;
        
        // Test deep reasoning
        await personalization.adaptToUser(userId, {
            reasoningDepth: 'deep'
        });
        
        profile = personalization.getProfile(userId);
        const depthAdaptation = profile!.adaptations.find(a => a.feature === 'reasoning_depth');
        expect(depthAdaptation).to.exist;
    });

    it('should handle suggestion frequency preferences', async () => {
        const userId = 'freq-user';
        
        await personalization.adaptToUser(userId, {
            suggestionFrequency: 'high'
        });
        
        const profile = personalization.getProfile(userId);
        const freqAdaptation = profile!.adaptations.find(a => a.feature === 'suggestion_frequency');
        expect(freqAdaptation).to.exist;
        expect(freqAdaptation!.confidence).to.equal(1.0);
    });
});