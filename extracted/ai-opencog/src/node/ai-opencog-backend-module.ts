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
import { ConnectionHandler, RpcConnectionHandler } from '@theia/core/lib/common/messaging';
import { 
    OpenCogService, 
    OPENCOG_SERVICE_PATH,
    KnowledgeManagementService,
    KNOWLEDGE_MANAGEMENT_SERVICE_PATH,
    DeductiveReasoningService,
    DEDUCTIVE_REASONING_SERVICE_PATH,
    InductiveReasoningService,
    INDUCTIVE_REASONING_SERVICE_PATH,
    AbductiveReasoningService,
    ABDUCTIVE_REASONING_SERVICE_PATH,
    SupervisedLearningService,
    SUPERVISED_LEARNING_SERVICE_PATH,
    UnsupervisedLearningService,
    UNSUPERVISED_LEARNING_SERVICE_PATH,
    ReinforcementLearningService,
    REINFORCEMENT_LEARNING_SERVICE_PATH,
    DistributedReasoningService,
    DISTRIBUTED_REASONING_SERVICE_PATH,
    ProductionOptimizationService,
    PRODUCTION_OPTIMIZATION_SERVICE_PATH
} from '../common';
import { AdvancedLearningService, ADVANCED_LEARNING_SERVICE_PATH } from '../common/advanced-learning-service';
import { AtomSpaceService } from './atomspace-service';
import { KnowledgeManagementServiceImpl } from './knowledge-management-service-impl';
// Phase 2 backend components
import { CodeAnalysisAgent } from './code-analysis-agent';
// Phase 3 reasoning engines
import { PLNReasoningEngine, PatternMatchingEngine, CodeAnalysisReasoningEngine } from './reasoning-engines';
// Phase 3 reasoning services
import { DeductiveReasoningServiceImpl } from './deductive-reasoning-service';
import { InductiveReasoningServiceImpl } from './inductive-reasoning-service';
import { AbductiveReasoningServiceImpl } from './abductive-reasoning-service';
// Phase 3 learning services
import { SupervisedLearningServiceImpl } from './supervised-learning-service';
import { UnsupervisedLearningServiceImpl } from './unsupervised-learning-service';
import { ReinforcementLearningServiceImpl } from './reinforcement-learning-service';
import { AdvancedLearningServiceImpl } from './advanced-learning-service';
// Phase 5 distributed reasoning
import { DistributedReasoningServiceImpl } from './distributed-reasoning-service-impl';
// Phase 5 production optimization
import { ProductionOptimizationServiceImpl } from './production-optimization-service-impl';

export default new ContainerModule(bind => {
    bind(OpenCogService).to(AtomSpaceService).inSingletonScope();
    bind(KnowledgeManagementService).to(KnowledgeManagementServiceImpl).inSingletonScope();
    
    // Phase 2: Bind node-based code analysis agent
    bind(CodeAnalysisAgent).toSelf().inSingletonScope();
    bind(Symbol.for('Agent')).to(CodeAnalysisAgent).inSingletonScope();
    
    // Phase 3: Bind reasoning engines
    bind(PLNReasoningEngine).toSelf().inSingletonScope();
    bind(PatternMatchingEngine).toSelf().inSingletonScope();
    bind(CodeAnalysisReasoningEngine).toSelf().inSingletonScope();
    
    // Phase 3: Bind reasoning services
    bind(DeductiveReasoningService).to(DeductiveReasoningServiceImpl).inSingletonScope();
    bind(InductiveReasoningService).to(InductiveReasoningServiceImpl).inSingletonScope();
    bind(AbductiveReasoningService).to(AbductiveReasoningServiceImpl).inSingletonScope();
    
    // Phase 3: Bind learning services
    bind(SupervisedLearningService).to(SupervisedLearningServiceImpl).inSingletonScope();
    bind(UnsupervisedLearningService).to(UnsupervisedLearningServiceImpl).inSingletonScope();
    bind(ReinforcementLearningService).to(ReinforcementLearningServiceImpl).inSingletonScope();
    
    // Phase 5: Bind advanced learning service
    bind(AdvancedLearningService).to(AdvancedLearningServiceImpl).inSingletonScope();
    
    // Phase 5: Bind distributed reasoning service
    bind(DistributedReasoningService).to(DistributedReasoningServiceImpl).inSingletonScope();
    
    // Phase 5: Bind production optimization service
    bind(ProductionOptimizationService).to(ProductionOptimizationServiceImpl).inSingletonScope();
    
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(OPENCOG_SERVICE_PATH, () =>
            ctx.container.get(OpenCogService)
        )
    ).inSingletonScope();

    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(KNOWLEDGE_MANAGEMENT_SERVICE_PATH, () =>
            ctx.container.get(KnowledgeManagementService)
        )
    ).inSingletonScope();
    
    // Phase 3: Bind reasoning service connection handlers
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(DEDUCTIVE_REASONING_SERVICE_PATH, () =>
            ctx.container.get(DeductiveReasoningService)
        )
    ).inSingletonScope();
    
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(INDUCTIVE_REASONING_SERVICE_PATH, () =>
            ctx.container.get(InductiveReasoningService)
        )
    ).inSingletonScope();
    
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(ABDUCTIVE_REASONING_SERVICE_PATH, () =>
            ctx.container.get(AbductiveReasoningService)
        )
    ).inSingletonScope();
    
    // Phase 3: Bind learning service connection handlers
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(SUPERVISED_LEARNING_SERVICE_PATH, () =>
            ctx.container.get(SupervisedLearningService)
        )
    ).inSingletonScope();
    
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(UNSUPERVISED_LEARNING_SERVICE_PATH, () =>
            ctx.container.get(UnsupervisedLearningService)
        )
    ).inSingletonScope();
    
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(REINFORCEMENT_LEARNING_SERVICE_PATH, () =>
            ctx.container.get(ReinforcementLearningService)
        )
    ).inSingletonScope();
    
    // Phase 5: Bind advanced learning service connection handler
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(ADVANCED_LEARNING_SERVICE_PATH, () =>
            ctx.container.get(AdvancedLearningService)
        )
    ).inSingletonScope();
    
    // Phase 5: Bind distributed reasoning service connection handler
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(DISTRIBUTED_REASONING_SERVICE_PATH, () =>
            ctx.container.get(DistributedReasoningService)
        )
    ).inSingletonScope();
    
    // Phase 5: Bind production optimization service connection handler
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(PRODUCTION_OPTIMIZATION_SERVICE_PATH, () =>
            ctx.container.get(ProductionOptimizationService)
        )
    ).inSingletonScope();
});