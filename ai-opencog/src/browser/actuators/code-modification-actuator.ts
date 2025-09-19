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
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import { Workspace } from '@theia/workspace/lib/browser/workspace-service';
import { RefactoringOperation, ActuatorResult, Actuator } from '../common/sensor-motor-types';
import URI from '@theia/core/lib/common/uri';
import * as monaco from '@theia/monaco-editor-core';

/**
 * Executes code modification operations including refactoring and automated code changes
 */
@injectable()
export class CodeModificationActuator implements Actuator {

    constructor(
        @inject(EditorManager) private readonly editorManager: EditorManager,
        @inject(FileService) private readonly fileService: FileService,
        @inject(Workspace) private readonly workspace: Workspace
    ) {}

    async execute(parameters: RefactoringOperation): Promise<ActuatorResult> {
        try {
            switch (parameters.type) {
                case 'rename':
                    return this.performRename(parameters);
                case 'extract-method':
                    return this.performExtractMethod(parameters);
                case 'inline':
                    return this.performInline(parameters);
                case 'move':
                    return this.performMove(parameters);
                case 'change-signature':
                    return this.performChangeSignature(parameters);
                default:
                    return {
                        success: false,
                        message: `Unsupported refactoring type: ${parameters.type}`
                    };
            }
        } catch (error) {
            return {
                success: false,
                message: `Error executing refactoring: ${error}`,
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }

    async isAvailable(): Promise<boolean> {
        return true; // Code modification is always available
    }

    private async performRename(operation: RefactoringOperation): Promise<ActuatorResult> {
        const { target, parameters } = operation;
        const { oldName, newName, fileUri } = parameters;

        if (!oldName || !newName) {
            return {
                success: false,
                message: 'Rename operation requires oldName and newName parameters'
            };
        }

        const changes: any[] = [];

        try {
            if (fileUri) {
                // Single file rename
                const result = await this.renameInFile(fileUri, oldName, newName, operation.preview);
                changes.push(...result.changes);
            } else {
                // Workspace-wide rename
                const workspaceResult = await this.renameInWorkspace(oldName, newName, operation.scope, operation.preview);
                changes.push(...workspaceResult.changes);
            }

            return {
                success: true,
                message: `Successfully renamed '${oldName}' to '${newName}'`,
                changes,
                metadata: {
                    operation: 'rename',
                    filesModified: changes.length,
                    preview: operation.preview
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `Rename operation failed: ${error}`,
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }

    private async performExtractMethod(operation: RefactoringOperation): Promise<ActuatorResult> {
        const { parameters } = operation;
        const { fileUri, startLine, endLine, methodName, visibility = 'private' } = parameters;

        if (!fileUri || startLine === undefined || endLine === undefined || !methodName) {
            return {
                success: false,
                message: 'Extract method requires fileUri, startLine, endLine, and methodName parameters'
            };
        }

        try {
            const editor = await this.getOrOpenEditor(fileUri);
            if (!editor) {
                return {
                    success: false,
                    message: 'Could not open file for extraction'
                };
            }

            const model = editor.getControl().getModel();
            if (!model) {
                return {
                    success: false,
                    message: 'Could not access file content'
                };
            }

            // Extract the selected lines
            const selectedCode = model.getValueInRange({
                startLineNumber: startLine,
                startColumn: 1,
                endLineNumber: endLine,
                endColumn: model.getLineMaxColumn(endLine)
            });

            // Detect parameters needed for the extracted method
            const extractedParameters = this.detectMethodParameters(selectedCode, model, startLine, endLine);
            const methodSignature = `${visibility} ${methodName}(${extractedParameters.join(', ')})`;
            
            // Create the new method
            const extractedMethod = this.generateExtractedMethod(methodSignature, selectedCode, model.getLanguageId());

            if (operation.preview) {
                return {
                    success: true,
                    message: 'Extract method preview generated',
                    changes: [{
                        type: 'extract-method-preview',
                        originalCode: selectedCode,
                        extractedMethod,
                        methodCall: `${methodName}(${extractedParameters.map(p => p.split(' ')[1]).join(', ')});`
                    }],
                    metadata: { preview: true }
                };
            }

            // Apply the extraction
            await this.applyExtractMethod(editor, startLine, endLine, extractedMethod, methodName, extractedParameters);

            return {
                success: true,
                message: `Successfully extracted method '${methodName}'`,
                changes: [{
                    type: 'extract-method',
                    fileUri,
                    methodName,
                    linesExtracted: endLine - startLine + 1
                }],
                metadata: {
                    operation: 'extract-method',
                    methodName,
                    extractedLines: endLine - startLine + 1
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `Extract method operation failed: ${error}`,
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }

    private async performInline(operation: RefactoringOperation): Promise<ActuatorResult> {
        const { parameters } = operation;
        const { fileUri, methodName, inline = 'all' } = parameters;

        // This is a simplified inline implementation
        // In a real implementation, you'd need sophisticated analysis to inline method calls
        
        return {
            success: false,
            message: 'Inline refactoring not yet implemented - requires advanced code analysis',
            metadata: { operation: 'inline', status: 'not-implemented' }
        };
    }

    private async performMove(operation: RefactoringOperation): Promise<ActuatorResult> {
        const { parameters } = operation;
        const { sourceFile, targetFile, elementName } = parameters;

        // This is a simplified move implementation
        // In practice, you'd need to handle imports, dependencies, etc.
        
        return {
            success: false,
            message: 'Move refactoring not yet implemented - requires dependency analysis',
            metadata: { operation: 'move', status: 'not-implemented' }
        };
    }

    private async performChangeSignature(operation: RefactoringOperation): Promise<ActuatorResult> {
        const { parameters } = operation;
        const { fileUri, methodName, newSignature } = parameters;

        // This is a simplified signature change implementation
        // In practice, you'd need to update all call sites
        
        return {
            success: false,
            message: 'Change signature refactoring not yet implemented - requires call site analysis',
            metadata: { operation: 'change-signature', status: 'not-implemented' }
        };
    }

    private async renameInFile(fileUri: string, oldName: string, newName: string, preview = false): Promise<{ changes: any[] }> {
        const changes: any[] = [];
        
        try {
            const uri = new URI(fileUri);
            const editor = await this.getOrOpenEditor(fileUri);
            
            if (editor) {
                const model = editor.getControl().getModel();
                if (model) {
                    const content = model.getValue();
                    const regex = new RegExp(`\\b${this.escapeRegExp(oldName)}\\b`, 'g');
                    let match;
                    const replacements: Array<{ range: monaco.Range; text: string }> = [];
                    
                    while ((match = regex.exec(content)) !== null) {
                        const position = model.getPositionAt(match.index);
                        const endPosition = model.getPositionAt(match.index + match[0].length);
                        
                        replacements.push({
                            range: new monaco.Range(
                                position.lineNumber, 
                                position.column, 
                                endPosition.lineNumber, 
                                endPosition.column
                            ),
                            text: newName
                        });
                    }

                    if (!preview && replacements.length > 0) {
                        model.pushEditOperations([], replacements, () => null);
                    }

                    changes.push({
                        type: 'rename',
                        fileUri,
                        replacements: replacements.length,
                        preview
                    });
                }
            }
        } catch (error) {
            console.error('Error renaming in file:', error);
        }

        return { changes };
    }

    private async renameInWorkspace(oldName: string, newName: string, scope: string = 'workspace', preview = false): Promise<{ changes: any[] }> {
        const changes: any[] = [];
        
        try {
            const workspaceRoots = this.workspace.tryGetRoots();
            
            for (const root of workspaceRoots) {
                const files = await this.findFilesInDirectory(root.resource);
                
                for (const file of files) {
                    const fileResult = await this.renameInFile(file.toString(), oldName, newName, preview);
                    changes.push(...fileResult.changes);
                }
            }
        } catch (error) {
            console.error('Error renaming in workspace:', error);
        }

        return { changes };
    }

    private async findFilesInDirectory(directory: URI): Promise<URI[]> {
        const files: URI[] = [];
        
        try {
            const stat = await this.fileService.resolve(directory);
            
            if (stat.isDirectory && stat.children) {
                for (const child of stat.children) {
                    if (child.isDirectory) {
                        const subFiles = await this.findFilesInDirectory(child.resource);
                        files.push(...subFiles);
                    } else if (this.isTextFile(child.resource.toString())) {
                        files.push(child.resource);
                    }
                }
            }
        } catch (error) {
            console.error('Error finding files:', error);
        }

        return files;
    }

    private isTextFile(uri: string): boolean {
        const textExtensions = ['.ts', '.js', '.java', '.py', '.cpp', '.c', '.cs', '.go', '.rs', '.php', '.rb'];
        return textExtensions.some(ext => uri.toLowerCase().endsWith(ext));
    }

    private async getOrOpenEditor(fileUri: string): Promise<MonacoEditor | undefined> {
        const uri = new URI(fileUri);
        
        // Try to get existing editor
        const existingEditor = this.editorManager.all.find(editor => 
            editor.editor.uri.toString() === uri.toString()
        );
        
        if (existingEditor && existingEditor.editor instanceof MonacoEditor) {
            return existingEditor.editor;
        }

        // Open new editor
        try {
            const editorWidget = await this.editorManager.open(uri);
            return editorWidget.editor instanceof MonacoEditor ? editorWidget.editor : undefined;
        } catch (error) {
            console.error('Error opening editor:', error);
            return undefined;
        }
    }

    private detectMethodParameters(code: string, model: monaco.editor.ITextModel, startLine: number, endLine: number): string[] {
        // Simplified parameter detection - would need more sophisticated analysis
        const parameters: string[] = [];
        const variableRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
        const declaredVariables = new Set<string>();
        const usedVariables = new Set<string>();

        // Get variables declared before the selected code
        for (let line = 1; line < startLine; line++) {
            const lineContent = model.getLineContent(line);
            const declarations = lineContent.match(/(?:const|let|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g);
            if (declarations) {
                declarations.forEach(decl => {
                    const varName = decl.split(/\s+/).pop();
                    if (varName) declaredVariables.add(varName);
                });
            }
        }

        // Find variables used in the selected code
        let match;
        while ((match = variableRegex.exec(code)) !== null) {
            usedVariables.add(match[1]);
        }

        // Parameters are variables used but not declared in the selection
        usedVariables.forEach(varName => {
            if (declaredVariables.has(varName)) {
                parameters.push(`unknown ${varName}`); // Would need type detection
            }
        });

        return parameters;
    }

    private generateExtractedMethod(signature: string, code: string, languageId: string): string {
        const indent = '    ';
        const lines = code.split('\n').map(line => indent + line);
        
        switch (languageId) {
            case 'typescript':
            case 'javascript':
                return `\n${indent}${signature} {\n${lines.join('\n')}\n${indent}}\n`;
            case 'java':
                return `\n${indent}${signature} {\n${lines.join('\n')}\n${indent}}\n`;
            case 'python':
                return `\n${indent.substring(0, 4)}def ${signature.split(' ').pop()}:\n${lines.join('\n')}\n`;
            default:
                return `\n${indent}${signature} {\n${lines.join('\n')}\n${indent}}\n`;
        }
    }

    private async applyExtractMethod(
        editor: MonacoEditor, 
        startLine: number, 
        endLine: number, 
        extractedMethod: string, 
        methodName: string, 
        parameters: string[]
    ): Promise<void> {
        const model = editor.getControl().getModel();
        if (!model) return;

        // Replace selected code with method call
        const methodCall = `${methodName}(${parameters.map(p => p.split(' ')[1] || '').join(', ')});`;
        
        const range = new monaco.Range(startLine, 1, endLine, model.getLineMaxColumn(endLine));
        
        // Find insertion point for the new method (end of class or file)
        const insertionLine = this.findMethodInsertionPoint(model);
        const insertionRange = new monaco.Range(insertionLine, model.getLineMaxColumn(insertionLine), insertionLine, model.getLineMaxColumn(insertionLine));

        // Apply both changes
        model.pushEditOperations([], [
            { range, text: '    ' + methodCall },
            { range: insertionRange, text: extractedMethod }
        ], () => null);
    }

    private findMethodInsertionPoint(model: monaco.editor.ITextModel): number {
        // Simple heuristic: find last closing brace or end of file
        const content = model.getValue();
        const lines = content.split('\n');
        
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].trim() === '}') {
                return i; // Insert before the last closing brace
            }
        }
        
        return lines.length; // Insert at end of file
    }

    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}