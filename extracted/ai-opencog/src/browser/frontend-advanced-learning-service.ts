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

import { injectable, inject } from '@theia/core/shared/inversify';
import { RpcProxy } from '@theia/core/lib/common/rpc-proxy';
import {
    AdvancedLearningService,
    ADVANCED_LEARNING_SERVICE_PATH
} from '../common/advanced-learning-service';
import {
    AdvancedLearningType,
    AdvancedLearningData,
    AdvancedLearningResult,
    AdvancedLearningModel,
    TensorData,
    Tensor3D
} from '../common/opencog-types';

/**
 * Frontend proxy for Advanced Learning Service
 */
@injectable()
export class FrontendAdvancedLearningService implements AdvancedLearningService {

    private readonly proxy: RpcProxy<AdvancedLearningService>;

    constructor() {
        this.proxy = RpcProxy.createProxy<AdvancedLearningService>(ADVANCED_LEARNING_SERVICE_PATH);
    }

    async createAdvancedModel(type: AdvancedLearningType, config: any): Promise<AdvancedLearningModel> {
        return this.proxy.createAdvancedModel(type, config);
    }

    async trainAdvancedModel(modelId: string, data: AdvancedLearningData[]): Promise<AdvancedLearningResult> {
        return this.proxy.trainAdvancedModel(modelId, data);
    }

    async predict(modelId: string, input: TensorData | Tensor3D | any): Promise<AdvancedLearningResult> {
        return this.proxy.predict(modelId, input);
    }

    async evaluateModel(modelId: string, testData: AdvancedLearningData[]): Promise<AdvancedLearningResult> {
        return this.proxy.evaluateModel(modelId, testData);
    }

    async updateModel(modelId: string, data: AdvancedLearningData[]): Promise<AdvancedLearningResult> {
        return this.proxy.updateModel(modelId, data);
    }

    async getModelInfo(modelId: string): Promise<AdvancedLearningModel | undefined> {
        return this.proxy.getModelInfo(modelId);
    }

    async listModels(type?: AdvancedLearningType): Promise<AdvancedLearningModel[]> {
        return this.proxy.listModels(type);
    }

    async deleteModel(modelId: string): Promise<boolean> {
        return this.proxy.deleteModel(modelId);
    }

    async getStats(): Promise<{
        totalModels: number;
        typeDistribution: Record<AdvancedLearningType, number>;
        averagePerformance: Record<AdvancedLearningType, number>;
        memoryUsage: number;
    }> {
        return this.proxy.getStats();
    }
}