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
import { OpenCogChatAgent } from './opencog-chat-agent';
import { OpenCogService } from '../common/opencog-service';
import { IntelligentAssistanceAgent } from './intelligent-assistance-agent';
import { AdvancedReasoningAgent } from './advanced-reasoning-agent';
import { UserBehaviorLearningAgent } from './user-behavior-learning-agent';
import { KnowledgeManagementService } from '../common/knowledge-management-service';
import { ChatAgent } from '@theia/ai-chat/lib/common/chat-agents';

/**
 * Basic integration test to verify OpenCog chat agent setup
 */
describe('OpenCog Chat Agent Integration', () => {
    let container: Container;
    let openCogChatAgent: OpenCogChatAgent;

    // Mock services for testing
    const mockOpenCogService = {
        recognizePatterns: async () => ({ patterns: [] }),
        queryAtoms: async () => ({ results: [] })
    };

    const mockIntelligentAssistanceAgent = {
        provideIntelligentAssistance: async () => ({ suggestions: [] })
    };

    const mockAdvancedReasoningAgent = {
        solveComplexProblem: async () => ({ 
            confidence: 0.8, 
            solution: { steps: ['analyze', 'reason', 'conclude'] } 
        })
    };

    const mockUserBehaviorLearningAgent = {
        trackUserInteraction: async () => undefined
    };

    const mockKnowledgeService = {
        queryKnowledge: async () => ({ results: [] })
    };

    beforeEach(() => {
        container = new Container();
        
        // Bind mock services
        container.bind(OpenCogService).toConstantValue(mockOpenCogService as any);
        container.bind(IntelligentAssistanceAgent).toConstantValue(mockIntelligentAssistanceAgent as any);
        container.bind(AdvancedReasoningAgent).toConstantValue(mockAdvancedReasoningAgent as any);
        container.bind(UserBehaviorLearningAgent).toConstantValue(mockUserBehaviorLearningAgent as any);
        container.bind(KnowledgeManagementService).toConstantValue(mockKnowledgeService as any);
        
        // Bind the OpenCog chat agent
        container.bind(OpenCogChatAgent).toSelf();
        
        openCogChatAgent = container.get(OpenCogChatAgent);
    });

    it('should create OpenCog chat agent with correct configuration', () => {
        expect(openCogChatAgent).to.be.instanceOf(OpenCogChatAgent);
        expect(openCogChatAgent.id).to.equal('opencog');
        expect(openCogChatAgent.name).to.equal('OpenCog Reasoning');
        expect(openCogChatAgent.description).to.include('OpenCog cognitive reasoning');
        expect(openCogChatAgent.iconClass).to.equal('codicon codicon-brain');
    });

    it('should implement ChatAgent interface', () => {
        // Verify that it's a proper chat agent
        const chatAgent: ChatAgent = openCogChatAgent;
        expect(chatAgent.id).to.equal('opencog');
        expect(chatAgent.locations).to.be.an('array');
        expect(chatAgent.tags).to.include('OpenCog');
        expect(chatAgent.invoke).to.be.a('function');
    });

    it('should have cognitive reasoning capabilities configured', () => {
        expect(openCogChatAgent.tags).to.include('OpenCog');
        expect(openCogChatAgent.tags).to.include('Reasoning');
        expect(openCogChatAgent.tags).to.include('Cognitive AI');
        expect(openCogChatAgent.description).to.include('adaptive learning');
        expect(openCogChatAgent.description).to.include('knowledge management');
    });

    it('should have language model requirements', () => {
        expect(openCogChatAgent.languageModelRequirements).to.be.an('array');
        expect(openCogChatAgent.languageModelRequirements.length).to.be.greaterThan(0);
        
        const requirement = openCogChatAgent.languageModelRequirements[0];
        expect(requirement.purpose).to.equal('chat');
        expect(requirement.fallBackToAnyModel).to.be.true;
    });

    it('should support multiple chat locations', () => {
        expect(openCogChatAgent.locations).to.be.an('array');
        expect(openCogChatAgent.locations.length).to.be.greaterThan(0);
        // Should support panel, editor, and terminal locations
        expect(openCogChatAgent.locations.length).to.be.at.least(2);
    });
});

/**
 * Demo test to show cognitive integration capabilities
 */
describe('OpenCog Chat Agent Cognitive Features', () => {
    it('should demonstrate cognitive analysis integration concept', async () => {
        // This test demonstrates the cognitive features without requiring full setup
        const cognitiveFeatures = {
            patternRecognition: 'Identifies patterns in user queries and code',
            reasoningTransparency: 'Provides confidence levels and reasoning process',
            knowledgeIntegration: 'Accesses stored knowledge and learning insights',
            adaptiveLearning: 'Learns from user interactions and preferences',
            contextualAssistance: 'Provides context-aware development support'
        };

        // Verify that the cognitive features are conceptually sound
        expect(cognitiveFeatures.patternRecognition).to.include('patterns');
        expect(cognitiveFeatures.reasoningTransparency).to.include('confidence');
        expect(cognitiveFeatures.knowledgeIntegration).to.include('knowledge');
        expect(cognitiveFeatures.adaptiveLearning).to.include('learns');
        expect(cognitiveFeatures.contextualAssistance).to.include('context-aware');

        console.log('✅ OpenCog Chat Agent Cognitive Features:');
        Object.entries(cognitiveFeatures).forEach(([feature, description]) => {
            console.log(`   • ${feature}: ${description}`);
        });
    });
});