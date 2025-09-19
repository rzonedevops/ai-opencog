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
    OPENCOG_SERVICE_PATH,
    KNOWLEDGE_MANAGEMENT_SERVICE_PATH,
    DEDUCTIVE_REASONING_SERVICE_PATH,
    INDUCTIVE_REASONING_SERVICE_PATH,
    ABDUCTIVE_REASONING_SERVICE_PATH,
    SUPERVISED_LEARNING_SERVICE_PATH,
    UNSUPERVISED_LEARNING_SERVICE_PATH,
    REINFORCEMENT_LEARNING_SERVICE_PATH,
    DISTRIBUTED_REASONING_SERVICE_PATH,
    PRODUCTION_OPTIMIZATION_SERVICE_PATH
} from '../common';
import {
    OpenCogServiceSymbol,
    KnowledgeManagementServiceSymbol,
    DeductiveReasoningServiceSymbol,
    InductiveReasoningServiceSymbol,
    AbductiveReasoningServiceSymbol,
    SupervisedLearningServiceSymbol,
    UnsupervisedLearningServiceSymbol,
    ReinforcementLearningServiceSymbol,
    AdvancedLearningServiceSymbol,
    DistributedReasoningServiceSymbol,
    ProductionOptimizationServiceSymbol
} from '../common/service-symbols';
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
    bind(OpenCogServiceSymbol).to(AtomSpaceService).inSingletonScope();
    bind(KnowledgeManagementServiceSymbol).to(KnowledgeManagementServiceImpl).inSingletonScope();
    
    // Phase 2: Bind node-based code analysis agent
    bind(CodeAnalysisAgent).toSelf().inSingletonScope();
    bind(Symbol.for('Agent')).to(CodeAnalysisAgent).inSingletonScope();
    
    // Phase 3: Bind reasoning engines
    bind(PLNReasoningEngine).toSelf().inSingletonScope();
    bind(PatternMatchingEngine).toSelf().inSingletonScope();
    bind(CodeAnalysisReasoningEngine).toSelf().inSingletonScope();
    
    // Phase 3: Bind reasoning services
    bind(DeductiveReasoningServiceSymbol).to(DeductiveReasoningServiceImpl).inSingletonScope();
    bind(InductiveReasoningServiceSymbol).to(InductiveReasoningServiceImpl).inSingletonScope();
    bind(AbductiveReasoningServiceSymbol).to(AbductiveReasoningServiceImpl).inSingletonScope();
    
    // Phase 3: Bind learning services
    bind(SupervisedLearningServiceSymbol).to(SupervisedLearningServiceImpl).inSingletonScope();
    bind(UnsupervisedLearningServiceSymbol).to(UnsupervisedLearningServiceImpl).inSingletonScope();
    bind(ReinforcementLearningServiceSymbol).to(ReinforcementLearningServiceImpl).inSingletonScope();
    
    // Phase 5: Bind advanced learning service
    bind(AdvancedLearningServiceSymbol).to(AdvancedLearningServiceImpl).inSingletonScope();
    
    // Phase 5: Bind distributed reasoning service
    bind(DistributedReasoningServiceSymbol).to(DistributedReasoningServiceImpl).inSingletonScope();
    
    // Phase 5: Bind production optimization service
    bind(ProductionOptimizationServiceSymbol).to(ProductionOptimizationServiceImpl).inSingletonScope();
    
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(OPENCOG_SERVICE_PATH, () =>
            ctx.container.get(OpenCogServiceSymbol)
        )
    ).inSingletonScope();

    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(KNOWLEDGE_MANAGEMENT_SERVICE_PATH, () =>
            ctx.container.get(KnowledgeManagementServiceSymbol)
        )
    ).inSingletonScope();
    
    // Phase 3: Bind reasoning service connection handlers
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(DEDUCTIVE_REASONING_SERVICE_PATH, () =>
            ctx.container.get(DeductiveReasoningServiceSymbol)
        )
    ).inSingletonScope();
    
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(INDUCTIVE_REASONING_SERVICE_PATH, () =>
            ctx.container.get(InductiveReasoningServiceSymbol)
        )
    ).inSingletonScope();
    
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(ABDUCTIVE_REASONING_SERVICE_PATH, () =>
            ctx.container.get(AbductiveReasoningServiceSymbol)
        )
    ).inSingletonScope();
    
    // Phase 3: Bind learning service connection handlers
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(SUPERVISED_LEARNING_SERVICE_PATH, () =>
            ctx.container.get(SupervisedLearningServiceSymbol)
        )
    ).inSingletonScope();
    
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(UNSUPERVISED_LEARNING_SERVICE_PATH, () =>
            ctx.container.get(UnsupervisedLearningServiceSymbol)
        )
    ).inSingletonScope();
    
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(REINFORCEMENT_LEARNING_SERVICE_PATH, () =>
            ctx.container.get(ReinforcementLearningServiceSymbol)
        )
    ).inSingletonScope();
    
    // Phase 5: Bind advanced learning service connection handler
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(ADVANCED_LEARNING_SERVICE_PATH, () =>
            ctx.container.get(AdvancedLearningServiceSymbol)
        )
    ).inSingletonScope();
    
    // Phase 5: Bind distributed reasoning service connection handler
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(DISTRIBUTED_REASONING_SERVICE_PATH, () =>
            ctx.container.get(DistributedReasoningServiceSymbol)
        )
    ).inSingletonScope();
    
    // Phase 5: Bind production optimization service connection handler
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(PRODUCTION_OPTIMIZATION_SERVICE_PATH, () =>
            ctx.container.get(ProductionOptimizationServiceSymbol)
        )
    ).inSingletonScope();
});