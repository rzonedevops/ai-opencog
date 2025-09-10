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
import { CompletionProvider, CompletionContext, Position } from '@theia/monaco-editor-core/esm/vs/editor/common/languages';
import { ITextModel } from '@theia/monaco-editor-core/esm/vs/editor/common/model';
import { CompletionList, CompletionItem, CompletionItemKind } from '@theia/monaco-editor-core/esm/vs/editor/common/languages';
import { OpenCogService } from '../common/opencog-service';
import { ReasoningQuery, Atom } from '../common/opencog-types';

/**
 * Semantic Code Completion Provider using OpenCog reasoning
 * as specified in Phase 2 requirements
 */
@injectable()
export class SemanticCompletionProvider implements CompletionProvider {

    constructor(
        @inject(OpenCogService) private opencog: OpenCogService
    ) {}

    async provideCompletionItems(
        model: ITextModel,
        position: Position,
        context: CompletionContext
    ): Promise<CompletionList> {
        try {
            const contextData = this.extractContext(model, position);
            const suggestions = await this.opencog.reason({
                type: 'code-completion',
                context: contextData,
                atoms: contextData.semanticAtoms
            });

            const completionItems = this.convertToCompletionItems(suggestions, contextData);

            return {
                suggestions: completionItems,
                incomplete: false,
                dispose: () => {}
            };
        } catch (error) {
            console.error('Error in semantic completion:', error);
            return {
                suggestions: [],
                incomplete: false,
                dispose: () => {}
            };
        }
    }

    private extractContext(model: ITextModel, position: Position) {
        const lineContent = model.getLineContent(position.lineNumber);
        const textUntilPosition = lineContent.substr(0, position.column - 1);
        const textAfterPosition = lineContent.substr(position.column - 1);
        
        // Get surrounding lines for better context
        const startLine = Math.max(1, position.lineNumber - 5);
        const endLine = Math.min(model.getLineCount(), position.lineNumber + 5);
        const surroundingText = model.getLinesContent().slice(startLine - 1, endLine).join('\n');
        
        // Extract semantic information
        const semanticAtoms = this.extractSemanticAtoms(surroundingText, textUntilPosition);
        
        // Detect current context (function, class, etc.)
        const currentContext = this.detectCurrentContext(model, position);
        
        return {
            currentLine: lineContent,
            textUntilPosition,
            textAfterPosition,
            surroundingText,
            semanticAtoms,
            currentContext,
            language: this.getLanguageFromModel(model),
            position: {
                line: position.lineNumber,
                column: position.column
            }
        };
    }

    private extractSemanticAtoms(text: string, currentText: string): Atom[] {
        const atoms: Atom[] = [];
        
        // Extract identifiers that might be relevant
        const identifiers = text.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
        const uniqueIdentifiers = [...new Set(identifiers)];
        
        // Create atoms for identifiers
        for (const identifier of uniqueIdentifiers.slice(0, 20)) { // Limit for performance
            atoms.push({
                type: 'ConceptNode',
                name: identifier,
                truthValue: { strength: 0.8, confidence: 0.6 },
                outgoing: []
            });
        }
        
        // Extract function calls
        const functionCalls = text.match(/(\w+)\s*\(/g) || [];
        for (const call of functionCalls) {
            const functionName = call.replace(/\s*\($/, '');
            atoms.push({
                type: 'PredicateNode',
                name: `calls_${functionName}`,
                truthValue: { strength: 0.9, confidence: 0.7 },
                outgoing: []
            });
        }
        
        return atoms;
    }

    private detectCurrentContext(model: ITextModel, position: Position): any {
        const lines = model.getLinesContent();
        let functionContext = null;
        let classContext = null;
        
        // Look backwards for function or class declarations
        for (let i = position.lineNumber - 1; i >= 0; i--) {
            const line = lines[i];
            
            // Check for function
            const functionMatch = line.match(/(?:function\s+(\w+)|(\w+)\s*\(.*\)\s*{|(\w+)\s*:\s*\(.*\)\s*=>)/);
            if (functionMatch && !functionContext) {
                functionContext = {
                    name: functionMatch[1] || functionMatch[2] || functionMatch[3],
                    type: 'function',
                    line: i + 1
                };
            }
            
            // Check for class
            const classMatch = line.match(/class\s+(\w+)/);
            if (classMatch && !classContext) {
                classContext = {
                    name: classMatch[1],
                    type: 'class',
                    line: i + 1
                };
                break; // Class scope is broader than function scope
            }
        }
        
        return {
            function: functionContext,
            class: classContext,
            indentLevel: this.getIndentLevel(model.getLineContent(position.lineNumber))
        };
    }

    private getIndentLevel(line: string): number {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
    }

    private getLanguageFromModel(model: ITextModel): string {
        const uri = model.uri.toString();
        const extension = uri.split('.').pop()?.toLowerCase();
        const languageMap: Record<string, string> = {
            'ts': 'typescript',
            'js': 'javascript',
            'py': 'python',
            'java': 'java'
        };
        return languageMap[extension || ''] || 'javascript';
    }

    private convertToCompletionItems(suggestions: any, context: any): CompletionItem[] {
        const items: CompletionItem[] = [];
        
        // Generate completion items based on reasoning results
        if (suggestions.conclusions) {
            for (const conclusion of suggestions.conclusions.slice(0, 10)) {
                if (conclusion.type === 'suggestion' && conclusion.value) {
                    items.push({
                        label: conclusion.value,
                        kind: this.getCompletionKind(conclusion),
                        detail: conclusion.explanation || 'OpenCog semantic suggestion',
                        documentation: conclusion.reasoning || 'Generated through cognitive reasoning',
                        insertText: conclusion.value,
                        range: undefined // Monaco will handle this
                    });
                }
            }
        }
        
        // Add context-aware suggestions
        items.push(...this.generateContextAwareSuggestions(context));
        
        // Add semantic pattern suggestions
        items.push(...this.generateSemanticPatternSuggestions(context));
        
        return items;
    }

    private getCompletionKind(conclusion: any): CompletionItemKind {
        const value = conclusion.value?.toLowerCase() || '';
        
        if (value.includes('function') || conclusion.category === 'function') {
            return CompletionItemKind.Function;
        }
        if (value.includes('class') || conclusion.category === 'class') {
            return CompletionItemKind.Class;
        }
        if (value.includes('variable') || conclusion.category === 'variable') {
            return CompletionItemKind.Variable;
        }
        if (value.includes('method') || conclusion.category === 'method') {
            return CompletionItemKind.Method;
        }
        
        return CompletionItemKind.Text;
    }

    private generateContextAwareSuggestions(context: any): CompletionItem[] {
        const items: CompletionItem[] = [];
        
        // Function context suggestions
        if (context.currentContext.function) {
            items.push({
                label: 'return',
                kind: CompletionItemKind.Keyword,
                detail: 'Return statement',
                documentation: `Return from function ${context.currentContext.function.name}`,
                insertText: 'return ',
                range: undefined
            });
        }
        
        // Class context suggestions
        if (context.currentContext.class) {
            items.push({
                label: 'this.',
                kind: CompletionItemKind.Keyword,
                detail: 'Class member access',
                documentation: `Access member of class ${context.currentContext.class.name}`,
                insertText: 'this.',
                range: undefined
            });
        }
        
        // Language-specific suggestions
        if (context.language === 'typescript' || context.language === 'javascript') {
            items.push({
                label: 'console.log',
                kind: CompletionItemKind.Function,
                detail: 'Console logging',
                documentation: 'Debug output to console',
                insertText: 'console.log($1)',
                range: undefined
            });
        }
        
        return items;
    }

    private generateSemanticPatternSuggestions(context: any): CompletionItem[] {
        const items: CompletionItem[] = [];
        
        // Analyze patterns in semantic atoms
        const conceptNodes = context.semanticAtoms.filter((atom: Atom) => atom.type === 'ConceptNode');
        const predicateNodes = context.semanticAtoms.filter((atom: Atom) => atom.type === 'PredicateNode');
        
        // Suggest based on existing patterns
        if (conceptNodes.length > 0) {
            const commonConcepts = this.findCommonPatterns(conceptNodes);
            for (const concept of commonConcepts.slice(0, 3)) {
                items.push({
                    label: concept,
                    kind: CompletionItemKind.Variable,
                    detail: 'Semantic pattern suggestion',
                    documentation: 'Based on existing code patterns',
                    insertText: concept,
                    range: undefined
                });
            }
        }
        
        return items;
    }

    private findCommonPatterns(atoms: Atom[]): string[] {
        const names = atoms.map(atom => atom.name).filter(name => name && name.length > 2);
        const frequency: {[key: string]: number} = {};
        
        for (const name of names) {
            frequency[name!] = (frequency[name!] || 0) + 1;
        }
        
        return Object.keys(frequency)
            .sort((a, b) => frequency[b] - frequency[a])
            .slice(0, 5);
    }
}