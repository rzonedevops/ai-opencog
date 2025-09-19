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

/**
 * Service symbols for dependency injection
 * These symbols are used instead of interfaces to avoid TS2693 "Type vs Value" errors
 */

// Core OpenCog services
export const OpenCogServiceSymbol = Symbol.for('OpenCogService');
export const KnowledgeManagementServiceSymbol = Symbol.for('KnowledgeManagementService');

// Reasoning services
export const DeductiveReasoningServiceSymbol = Symbol.for('DeductiveReasoningService');
export const InductiveReasoningServiceSymbol = Symbol.for('InductiveReasoningService');
export const AbductiveReasoningServiceSymbol = Symbol.for('AbductiveReasoningService');

// Learning services
export const SupervisedLearningServiceSymbol = Symbol.for('SupervisedLearningService');
export const UnsupervisedLearningServiceSymbol = Symbol.for('UnsupervisedLearningService');
export const ReinforcementLearningServiceSymbol = Symbol.for('ReinforcementLearningService');
export const AdvancedLearningServiceSymbol = Symbol.for('AdvancedLearningService');

// Production services
export const ProductionOptimizationServiceSymbol = Symbol.for('ProductionOptimizationService');
export const ProductionConfigurationServiceSymbol = Symbol.for('ProductionConfigurationService');
export const ProductionDeploymentServiceSymbol = Symbol.for('ProductionDeploymentService');
export const ProductionMonitoringServiceSymbol = Symbol.for('ProductionMonitoringService');

// Distributed services
export const DistributedReasoningServiceSymbol = Symbol.for('DistributedReasoningService');

// Community services
export const CommunityEnhancementServiceSymbol = Symbol.for('CommunityEnhancementService');

// Widget factory symbol to avoid TS2693 errors
export const WidgetFactorySymbol = Symbol.for('WidgetFactory');

// Contribution symbols to avoid TS2693 errors
export const FrontendApplicationContributionSymbol = Symbol.for('FrontendApplicationContribution');
export const CommandContributionSymbol = Symbol.for('CommandContribution');
export const MenuContributionSymbol = Symbol.for('MenuContribution');
export const ChatAgentSymbol = Symbol.for('ChatAgent');