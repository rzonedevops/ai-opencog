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
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { Disposable, DisposableCollection } from '@theia/core/lib/common/disposable';
import { OpenCogService } from '../common/opencog-service';
import { Atom } from '../common/opencog-types';
import { FileChange, Sensor, SensorResult } from '../common/sensor-motor-types';
import URI from '@theia/core/lib/common/uri';

/**
 * Monitors code changes and extracts atoms for OpenCog analysis
 */
@injectable()
export class CodeChangeSensor implements Sensor, Disposable {

    protected disposables = new DisposableCollection();
    protected active = false;

    constructor(
        @inject(FileService) private readonly fileService: FileService,
        @inject(OpenCogService) private readonly opencog: OpenCogService
    ) {}

    async start(): Promise<void> {
        if (this.active) {
            return;
        }

        this.active = true;
        
        // Subscribe to file system changes
        const watcher = this.fileService.onDidFilesChange(event => {
            this.handleFileChanges(event.changes).catch(console.error);
        });
        
        this.disposables.push(watcher);
    }

    async stop(): Promise<void> {
        this.active = false;
        this.disposables.dispose();
    }

    isActive(): boolean {
        return this.active;
    }

    dispose(): void {
        this.stop();
    }

    private async handleFileChanges(changes: Array<{ resource: URI; type: number }>): Promise<void> {
        for (const change of changes) {
            const fileChange = await this.convertToFileChange(change);
            if (fileChange) {
                const atoms = await this.extractChangeAtoms(fileChange.uri, [fileChange]);
                await this.addAtomsToOpenCog(atoms);
            }
        }
    }

    private async convertToFileChange(change: { resource: URI; type: number }): Promise<FileChange | null> {
        try {
            const uri = change.resource.toString();
            const stat = await this.fileService.resolve(change.resource);
            
            let type: 'create' | 'modify' | 'delete';
            switch (change.type) {
                case 1: // FileChangeType.ADDED
                    type = 'create';
                    break;
                case 2: // FileChangeType.UPDATED  
                    type = 'modify';
                    break;
                case 3: // FileChangeType.DELETED
                    type = 'delete';
                    break;
                default:
                    return null;
            }

            let content: string | undefined;
            if (stat && !stat.isDirectory && type !== 'delete') {
                try {
                    const fileContent = await this.fileService.read(change.resource);
                    content = fileContent.value;
                } catch (error) {
                    // File might not be readable, continue without content
                }
            }

            return {
                uri,
                type,
                content,
                timestamp: Date.now(),
                size: stat?.size,
                language: this.detectLanguage(uri)
            };
        } catch (error) {
            console.error('Error converting file change:', error);
            return null;
        }
    }

    private detectLanguage(uri: string): string | undefined {
        const ext = uri.split('.').pop()?.toLowerCase();
        const languageMap: Record<string, string> = {
            'ts': 'typescript',
            'js': 'javascript',
            'java': 'java',
            'py': 'python',
            'cpp': 'cpp',
            'c': 'c',
            'cs': 'csharp',
            'go': 'go',
            'rs': 'rust',
            'php': 'php',
            'rb': 'ruby',
            'scala': 'scala',
            'kt': 'kotlin',
            'swift': 'swift',
            'json': 'json',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'md': 'markdown'
        };
        return ext ? languageMap[ext] : undefined;
    }

    private async extractChangeAtoms(uri: string, changes: FileChange[]): Promise<Atom[]> {
        const atoms: Atom[] = [];
        
        for (const change of changes) {
            // Create file change atom
            const changeAtom: Atom = {
                type: 'CodeChangeAtom',
                name: `file-change-${change.timestamp}`,
                metadata: {
                    uri: change.uri,
                    changeType: change.type,
                    timestamp: change.timestamp,
                    size: change.size,
                    language: change.language
                },
                truthValue: {
                    strength: 0.9,
                    confidence: 0.8
                }
            };
            atoms.push(changeAtom);

            // Extract code structure atoms if content is available
            if (change.content && change.language) {
                const structureAtoms = await this.extractCodeStructureAtoms(change);
                atoms.push(...structureAtoms);
            }

            // Create file relation atoms
            if (change.type !== 'delete') {
                const fileAtom: Atom = {
                    type: 'FileAtom',
                    name: uri,
                    metadata: {
                        language: change.language,
                        lastModified: change.timestamp,
                        size: change.size
                    },
                    truthValue: {
                        strength: 1.0,
                        confidence: 0.9
                    }
                };
                atoms.push(fileAtom);

                // Create contains relationship
                const containsAtom: Atom = {
                    type: 'EvaluationLink',
                    outgoing: [
                        { type: 'PredicateNode', name: 'contains' },
                        { type: 'ListLink', outgoing: [fileAtom, changeAtom] }
                    ],
                    truthValue: {
                        strength: 1.0,
                        confidence: 0.9
                    }
                };
                atoms.push(containsAtom);
            }
        }

        return atoms;
    }

    private async extractCodeStructureAtoms(change: FileChange): Promise<Atom[]> {
        const atoms: Atom[] = [];
        
        if (!change.content || !change.language) {
            return atoms;
        }

        // Basic structure extraction based on language
        switch (change.language) {
            case 'typescript':
            case 'javascript':
                atoms.push(...this.extractJSStructureAtoms(change));
                break;
            case 'java':
                atoms.push(...this.extractJavaStructureAtoms(change));
                break;
            case 'python':
                atoms.push(...this.extractPythonStructureAtoms(change));
                break;
            // Add more language support as needed
        }

        return atoms;
    }

    private extractJSStructureAtoms(change: FileChange): Atom[] {
        const atoms: Atom[] = [];
        const content = change.content!;
        
        // Extract class definitions
        const classMatches = content.match(/class\s+(\w+)/g);
        if (classMatches) {
            for (const match of classMatches) {
                const className = match.replace('class ', '');
                atoms.push({
                    type: 'ClassAtom',
                    name: className,
                    metadata: {
                        file: change.uri,
                        language: change.language
                    },
                    truthValue: { strength: 0.9, confidence: 0.8 }
                });
            }
        }

        // Extract function definitions
        const functionMatches = content.match(/(function\s+\w+|async\s+function\s+\w+|\w+\s*:\s*\([^)]*\)\s*=>)/g);
        if (functionMatches) {
            for (const match of functionMatches) {
                let functionName = match;
                if (match.includes('function')) {
                    functionName = match.replace(/^(async\s+)?function\s+/, '');
                } else if (match.includes('=>')) {
                    functionName = match.split(':')[0].trim();
                }
                
                atoms.push({
                    type: 'FunctionAtom',
                    name: functionName,
                    metadata: {
                        file: change.uri,
                        language: change.language
                    },
                    truthValue: { strength: 0.9, confidence: 0.8 }
                });
            }
        }

        return atoms;
    }

    private extractJavaStructureAtoms(change: FileChange): Atom[] {
        const atoms: Atom[] = [];
        const content = change.content!;
        
        // Extract class definitions
        const classMatches = content.match(/(?:public|private|protected)?\s*(?:abstract\s+)?(?:final\s+)?class\s+(\w+)/g);
        if (classMatches) {
            for (const match of classMatches) {
                const className = match.split(/\s+/).pop()!;
                atoms.push({
                    type: 'ClassAtom',
                    name: className,
                    metadata: {
                        file: change.uri,
                        language: change.language
                    },
                    truthValue: { strength: 0.9, confidence: 0.8 }
                });
            }
        }

        // Extract method definitions
        const methodMatches = content.match(/(?:public|private|protected)\s+(?:static\s+)?(?:\w+\s+)?(\w+)\s*\([^)]*\)/g);
        if (methodMatches) {
            for (const match of methodMatches) {
                const parts = match.split(/\s+/);
                const methodName = parts[parts.length - 1].split('(')[0];
                
                atoms.push({
                    type: 'MethodAtom',
                    name: methodName,
                    metadata: {
                        file: change.uri,
                        language: change.language
                    },
                    truthValue: { strength: 0.9, confidence: 0.8 }
                });
            }
        }

        return atoms;
    }

    private extractPythonStructureAtoms(change: FileChange): Atom[] {
        const atoms: Atom[] = [];
        const content = change.content!;
        
        // Extract class definitions
        const classMatches = content.match(/^class\s+(\w+)/gm);
        if (classMatches) {
            for (const match of classMatches) {
                const className = match.replace('class ', '');
                atoms.push({
                    type: 'ClassAtom',
                    name: className,
                    metadata: {
                        file: change.uri,
                        language: change.language
                    },
                    truthValue: { strength: 0.9, confidence: 0.8 }
                });
            }
        }

        // Extract function definitions
        const functionMatches = content.match(/^def\s+(\w+)/gm);
        if (functionMatches) {
            for (const match of functionMatches) {
                const functionName = match.replace('def ', '');
                atoms.push({
                    type: 'FunctionAtom',
                    name: functionName,
                    metadata: {
                        file: change.uri,
                        language: change.language
                    },
                    truthValue: { strength: 0.9, confidence: 0.8 }
                });
            }
        }

        return atoms;
    }

    private async addAtomsToOpenCog(atoms: Atom[]): Promise<void> {
        try {
            for (const atom of atoms) {
                await this.opencog.addAtom(atom);
            }
        } catch (error) {
            console.error('Error adding atoms to OpenCog:', error);
        }
    }
}