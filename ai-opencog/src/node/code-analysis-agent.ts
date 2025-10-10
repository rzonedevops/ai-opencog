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
import { Agent } from '@theia/ai-core/lib/common/agent';
import { WorkspaceServer } from '@theia/workspace/lib/common';
import { OpenCogService } from '../common/opencog-service';
import { Atom, ReasoningQuery } from '../common/opencog-types';

/**
 * Server-side OpenCog-powered code analysis agent as specified in Phase 2 requirements
 */
@injectable()
export class CodeAnalysisAgent implements Agent {
    public id: string;
    public name: string;
    public description: string;
    public variables: any[] = [];
    public prompts: any[] = [];
    public functions: any[] = [];
    public languageModelRequirements: any[] = [];
    public agentSpecificVariables: any[] = [];

    constructor(
        @inject(OpenCogService) private opencog: OpenCogService,
        @inject(WorkspaceServer) private workspace: WorkspaceServer
    ) {
        this.id = 'opencog-code-analysis';
        this.name = 'OpenCog Code Analysis';
        this.description = 'Cognitive code analysis using OpenCog reasoning';
    }

    async analyzeCode(fileUri: string): Promise<any> {
        // Mock file reading for backend compilation
        const code = `// Mock code content for ${fileUri}`;
        const atoms = this.extractCodeAtoms(code);
        
        // Add atoms to OpenCog AtomSpace
        for (const atom of atoms) {
            await this.opencog.addAtom(atom);
        }
        
        // Perform reasoning on the code
        const result = await this.opencog.reason({ 
            type: 'code-analysis', 
            atoms,
            context: { fileUri, timestamp: Date.now() }
        });
        
        return result;
    }

    private extractCodeAtoms(code: string): Atom[] {
        const atoms: Atom[] = [];
        
        // Extract functions
        const functionMatches = code.match(/function\s+(\w+)/g) || [];
        for (const match of functionMatches) {
            const functionName = match.replace('function ', '');
            atoms.push({
                type: 'FunctionNode',
                name: functionName,
                truthValue: { strength: 0.9, confidence: 0.8 },
                outgoing: []
            });
        }
        
        // Extract classes
        const classMatches = code.match(/class\s+(\w+)/g) || [];
        for (const match of classMatches) {
            const className = match.replace('class ', '');
            atoms.push({
                type: 'ClassNode',
                name: className,
                truthValue: { strength: 0.95, confidence: 0.9 },
                outgoing: []
            });
        }
        
        return atoms;
    }
}