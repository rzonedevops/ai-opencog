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

import { ContainerModule } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { CommandContribution, MenuContribution } from '@theia/core/lib/common';
import { 
    OpenCogService,
    KnowledgeManagementService,
    DeductiveReasoningService,
    InductiveReasoningService,
    AbductiveReasoningService,
    SupervisedLearningService,
    UnsupervisedLearningService,
    ReinforcementLearningService,
    ProductionOptimizationService,
    ProductionConfigurationService,
    ProductionDeploymentService,
    ProductionMonitoringService,
    CommunityEnhancementService,
    OpenCogServiceSymbol,
    KnowledgeManagementServiceSymbol,
    DeductiveReasoningServiceSymbol,
    InductiveReasoningServiceSymbol,
    AbductiveReasoningServiceSymbol,
    SupervisedLearningServiceSymbol,
    UnsupervisedLearningServiceSymbol,
    ReinforcementLearningServiceSymbol,
    AdvancedLearningServiceSymbol,
    ProductionOptimizationServiceSymbol,
    ProductionConfigurationServiceSymbol,
    ProductionDeploymentServiceSymbol,
    ProductionMonitoringServiceSymbol,
    CommunityEnhancementServiceSymbol,
    WidgetFactorySymbol,
    FrontendApplicationContributionSymbol,
    CommandContributionSymbol,
    MenuContributionSymbol,
    ChatAgentSymbol
} from '../common';
import { AdvancedLearningService } from '../common/advanced-learning-service';
import { FrontendOpenCogService } from './frontend-opencog-service';
import { FrontendKnowledgeManagementService } from './frontend-knowledge-management-service';
import { FrontendAdvancedLearningService } from './frontend-advanced-learning-service';
import { CodeAnalysisAgent } from './code-analysis-agent';
import { LearningAdaptationAgent } from './learning-adaptation-agent';
// Phase 2 cognitive services
import { PatternRecognitionAgent } from './pattern-recognition-agent';
import { LearningAgent } from './enhanced-learning-agent';
import { SemanticCompletionProvider } from './semantic-completion';
import { IntelligentRefactoringProvider } from './intelligent-refactoring';
import { RealTimeCodeAnalyzer } from './real-time-analyzer';
import { CognitiveEditorIntegration } from './cognitive-editor-integration';
// Phase 3 AI Agent Enhancement - Cognitive Code Analysis Agents
import { ComprehensiveCodeAnalysisAgent } from './comprehensive-code-analysis-agent';
import { IntelligentAssistanceAgent } from './intelligent-assistance-agent';
import { AdvancedReasoningAgent } from './advanced-reasoning-agent';
import { AdvancedLearningAgent } from './advanced-learning-agent';
import { UserBehaviorLearningAgent } from './user-behavior-learning-agent';
import { UserBehaviorMonitorService } from './user-behavior-monitor-service';
import { SpecializedProblemSolvingAgent } from './specialized-problem-solving-agent';
// Phase 3 frontend services
import { 
    FrontendDeductiveReasoningService,
    FrontendInductiveReasoningService,
    FrontendAbductiveReasoningService
} from './frontend-reasoning-services';
import {
    FrontendSupervisedLearningService,
    FrontendUnsupervisedLearningService,
    FrontendReinforcementLearningService
} from './frontend-learning-services';
// Phase 4 sensor-motor system
import { CodeChangeSensor } from './code-change-sensor';
import { ActivitySensor } from './activity-sensor';
import { EnvironmentSensor } from './environment-sensor';
import { CodeModificationActuator } from './code-modification-actuator';
import { ToolControlActuator } from './tool-control-actuator';
import { EnvironmentManagementActuator } from './environment-management-actuator';
import { SensorMotorService } from './sensor-motor-service';

// Phase 4: Cognitive Visualization Widgets
import { CodeIntelligenceWidget } from './cognitive-widgets/code-intelligence-widget';
import { LearningProgressWidget } from './cognitive-widgets/learning-progress-widget';
import { KnowledgeExplorerWidget } from './cognitive-widgets/knowledge-explorer-widget';
import { CognitiveAssistantWidget } from './cognitive-widgets/cognitive-assistant-widget';
import { 
    CognitiveWidgetsContribution,
    LearningProgressContribution,
    KnowledgeExplorerContribution,
    CognitiveAssistantContribution,
    MultiModalCognitiveContribution
} from './cognitive-widgets/cognitive-widgets-contribution';
// OpenCog Chat Agent
import { OpenCogChatAgent } from './opencog-chat-agent';
import { ChatAgent } from '@theia/ai-chat/lib/common/chat-agents';
// Phase 5: Multi-Modal Cognitive Processing Widget
import { MultiModalCognitiveWidget } from './cognitive-widgets/multi-modal-cognitive-widget';
// Phase 5: Production Monitoring Widget
import { ProductionMonitoringWidget } from './production-monitoring-widget';
import { FrontendProductionOptimizationService } from './frontend-production-optimization-service';
import { ProductionMonitoringContribution } from './production-monitoring-contribution';
// Phase 6: Production Deployment Services
import { FrontendProductionConfigurationService } from './frontend-production-configuration';
import { FrontendCommunityEnhancementService } from './frontend-community-enhancement';

export default new ContainerModule(bind => {
    // Note: Frontend services typically connect to backend via RPC
    // Using symbols to avoid TS2693 "Type vs Value" errors
    
    // Bind the frontend OpenCog service
    bind(OpenCogServiceSymbol).to(FrontendOpenCogService).inSingletonScope();
    
    // Bind the frontend Knowledge Management service
    bind(KnowledgeManagementServiceSymbol).to(FrontendKnowledgeManagementService).inSingletonScope();
    
    // Bind the frontend Advanced Learning service
    bind(AdvancedLearningServiceSymbol).to(FrontendAdvancedLearningService).inSingletonScope();
    
    // Phase 5: Bind the frontend Production Optimization service
    bind(ProductionOptimizationServiceSymbol).to(FrontendProductionOptimizationService).inSingletonScope();
    
    // Phase 6: Bind Production Deployment Services
    bind(ProductionConfigurationServiceSymbol).to(FrontendProductionConfigurationService).inSingletonScope();
    bind(ProductionDeploymentServiceSymbol).toSelf().inSingletonScope();
    bind(ProductionMonitoringServiceSymbol).toSelf().inSingletonScope();
    bind(CommunityEnhancementServiceSymbol).to(FrontendCommunityEnhancementService).inSingletonScope();
    
    // Phase 3: Bind frontend reasoning services
    bind(DeductiveReasoningServiceSymbol).to(FrontendDeductiveReasoningService).inSingletonScope();
    bind(InductiveReasoningServiceSymbol).to(FrontendInductiveReasoningService).inSingletonScope();
    bind(AbductiveReasoningServiceSymbol).to(FrontendAbductiveReasoningService).inSingletonScope();
    
    // Phase 3: Bind frontend learning services
    bind(SupervisedLearningServiceSymbol).to(FrontendSupervisedLearningService).inSingletonScope();
    bind(UnsupervisedLearningServiceSymbol).to(FrontendUnsupervisedLearningService).inSingletonScope();
    bind(ReinforcementLearningServiceSymbol).to(FrontendReinforcementLearningService).inSingletonScope();
    
    // Bind the existing agents
    bind(CodeAnalysisAgent).toSelf().inSingletonScope();
    bind(LearningAdaptationAgent).toSelf().inSingletonScope();
    
    // Bind Phase 2 cognitive services
    bind(PatternRecognitionAgent).toSelf().inSingletonScope();
    bind(LearningAgent).toSelf().inSingletonScope();
    bind(SemanticCompletionProvider).toSelf().inSingletonScope();
    bind(IntelligentRefactoringProvider).toSelf().inSingletonScope();
    bind(RealTimeCodeAnalyzer).toSelf().inSingletonScope();
    
    // Bind Phase 3 AI Agent Enhancement - Cognitive Code Analysis Agents
    bind(ComprehensiveCodeAnalysisAgent).toSelf().inSingletonScope();
    bind(IntelligentAssistanceAgent).toSelf().inSingletonScope();
    bind(AdvancedReasoningAgent).toSelf().inSingletonScope();
    bind(AdvancedLearningAgent).toSelf().inSingletonScope();
    bind(UserBehaviorLearningAgent).toSelf().inSingletonScope();
    bind(SpecializedProblemSolvingAgent).toSelf().inSingletonScope();
    
    // Bind user behavior monitoring service
    bind(UserBehaviorMonitorService).to(UserBehaviorMonitorService).inSingletonScope();
    
    // Bind editor integration
    bind(CognitiveEditorIntegration).toSelf().inSingletonScope();
    
    // Register the agents with the agent service
    bind(Symbol.for('Agent')).to(CodeAnalysisAgent).inSingletonScope();
    bind(Symbol.for('Agent')).to(LearningAdaptationAgent).inSingletonScope();
    bind(Symbol.for('Agent')).to(PatternRecognitionAgent).inSingletonScope();
    bind(Symbol.for('Agent')).to(LearningAgent).inSingletonScope();
    
    // Register Phase 3 agents with the agent service
    bind(Symbol.for('Agent')).to(ComprehensiveCodeAnalysisAgent).inSingletonScope();
    bind(Symbol.for('Agent')).to(IntelligentAssistanceAgent).inSingletonScope();
    bind(Symbol.for('Agent')).to(AdvancedReasoningAgent).inSingletonScope();
    bind(Symbol.for('Agent')).to(AdvancedLearningAgent).inSingletonScope();
    bind(Symbol.for('Agent')).to(UserBehaviorLearningAgent).inSingletonScope();
    bind(Symbol.for('Agent')).to(SpecializedProblemSolvingAgent).inSingletonScope();

    // Phase 4: Bind sensor-motor system components
    bind(CodeChangeSensor).toSelf().inSingletonScope();
    bind(ActivitySensor).toSelf().inSingletonScope();
    bind(EnvironmentSensor).toSelf().inSingletonScope();
    bind(CodeModificationActuator).toSelf().inSingletonScope();
    bind(ToolControlActuator).toSelf().inSingletonScope();
    bind(EnvironmentManagementActuator).toSelf().inSingletonScope();
    bind(SensorMotorService).toSelf().inSingletonScope();

    // Phase 4: Cognitive Visualization Widgets
    bind(CodeIntelligenceWidget).toSelf();
    bind(LearningProgressWidget).toSelf();
    bind(KnowledgeExplorerWidget).toSelf();
    bind(CognitiveAssistantWidget).toSelf();
    
    // Phase 5: Multi-Modal Cognitive Processing Widget
    bind(MultiModalCognitiveWidget).toSelf();
    
    // Phase 5: Production Monitoring Widget
    bind(ProductionMonitoringWidget).toSelf();

    // Bind widget factories - using symbols to avoid TS2693 Type vs Value errors
    bind(WidgetFactorySymbol).toDynamicValue((ctx: any) => ({
        id: CodeIntelligenceWidget.ID,
        createWidget: () => ctx.container.get(CodeIntelligenceWidget)
    })).inSingletonScope();

    bind(WidgetFactorySymbol).toDynamicValue((ctx: any) => ({
        id: LearningProgressWidget.ID,
        createWidget: () => ctx.container.get(LearningProgressWidget)
    })).inSingletonScope();

    bind(WidgetFactorySymbol).toDynamicValue((ctx: any) => ({
        id: KnowledgeExplorerWidget.ID,
        createWidget: () => ctx.container.get(KnowledgeExplorerWidget)
    })).inSingletonScope();

    bind(WidgetFactorySymbol).toDynamicValue((ctx: any) => ({
        id: CognitiveAssistantWidget.ID,
        createWidget: () => ctx.container.get(CognitiveAssistantWidget)
    })).inSingletonScope();

    bind(WidgetFactorySymbol).toDynamicValue((ctx: any) => ({
        id: MultiModalCognitiveWidget.ID,
        createWidget: () => ctx.container.get(MultiModalCognitiveWidget)
    })).inSingletonScope();

    bind(WidgetFactorySymbol).toDynamicValue((ctx: any) => ({
        id: ProductionMonitoringWidget.ID,
        createWidget: () => ctx.container.get(ProductionMonitoringWidget)
    })).inSingletonScope();

    // Bind widget contributions
    bind(CognitiveWidgetsContribution).toSelf().inSingletonScope();
    bind(LearningProgressContribution).toSelf().inSingletonScope();
    bind(KnowledgeExplorerContribution).toSelf().inSingletonScope();
    bind(CognitiveAssistantContribution).toSelf().inSingletonScope();
    bind(MultiModalCognitiveContribution).toSelf().inSingletonScope();
    bind(ProductionMonitoringContribution).toSelf().inSingletonScope();

    // Register contributions - using symbols to avoid TS2693 Type vs Value errors
    bind(FrontendApplicationContributionSymbol).toService(CognitiveWidgetsContribution);
    bind(CommandContributionSymbol).toService(CognitiveWidgetsContribution);
    bind(MenuContributionSymbol).toService(CognitiveWidgetsContribution);

    // Register production monitoring contributions
    bind(CommandContributionSymbol).toService(ProductionMonitoringContribution);
    bind(MenuContributionSymbol).toService(ProductionMonitoringContribution);

    // Bind OpenCog Chat Agent - using symbol to avoid TS2693 errors
    bind(OpenCogChatAgent).toSelf().inSingletonScope();
    bind(ChatAgentSymbol).toService(OpenCogChatAgent);
});