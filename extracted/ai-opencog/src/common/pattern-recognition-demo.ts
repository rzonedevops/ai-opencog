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

import { PatternInput, PatternResult } from './opencog-types';

/**
 * Demonstration of enhanced pattern recognition capabilities
 */
export class PatternRecognitionDemo {
    
    /**
     * Demonstrate code pattern recognition
     */
    static getCodePatternExample(): PatternInput {
        return {
            data: `
                // Dependency injection pattern
                @injectable()
                export class UserService {
                    constructor(
                        @inject(DatabaseService) private db: DatabaseService,
                        @inject(LoggerService) private logger: LoggerService
                    ) {}
                    
                    // Async/await pattern
                    async getUser(id: string): Promise<User> {
                        this.logger.info('Fetching user', { id });
                        
                        try {
                            const user = await this.db.findUser(id);
                            return user;
                        } catch (error) {
                            this.logger.error('Failed to fetch user', error);
                            throw error;
                        }
                    }
                    
                    // Observable pattern
                    getUserStream(id: string): Observable<User> {
                        return this.db.watchUser(id).pipe(
                            map(user => this.enrichUser(user)),
                            catchError(error => {
                                this.logger.error('User stream error', error);
                                return throwError(error);
                            })
                        );
                    }
                    
                    // Arrow function
                    private enrichUser = (user: User): User => {
                        return {
                            ...user,
                            lastSeen: new Date().toISOString()
                        };
                    }
                }
                
                // Singleton pattern
                container.bind(UserService).to(UserService).inSingletonScope();
            `,
            context: {
                language: 'typescript',
                framework: 'theia',
                patterns: ['dependency-injection', 'async-await', 'observable', 'singleton']
            },
            scope: 'project',
            options: {
                maxResults: 15,
                minConfidence: 0.2,
                patternTypes: ['design-pattern', 'async-pattern', 'reactive-pattern', 'syntax-pattern']
            }
        };
    }
    
    /**
     * Demonstrate structural pattern recognition
     */
    static getStructuralPatternExample(): PatternInput {
        return {
            data: [
                { type: 'service', name: 'UserService', dependencies: ['DatabaseService', 'LoggerService'] },
                { type: 'service', name: 'OrderService', dependencies: ['DatabaseService', 'NotificationService'] },
                { type: 'service', name: 'PaymentService', dependencies: ['DatabaseService', 'SecurityService'] },
                { type: 'repository', name: 'UserRepository', dependencies: ['DatabaseService'] },
                { type: 'repository', name: 'OrderRepository', dependencies: ['DatabaseService'] },
                { type: 'controller', name: 'UserController', dependencies: ['UserService'] },
                { type: 'controller', name: 'OrderController', dependencies: ['OrderService', 'PaymentService'] }
            ],
            context: {
                architecture: 'layered',
                framework: 'dependency-injection'
            },
            scope: 'global',
            options: {
                maxResults: 10,
                minConfidence: 0.4,
                patternTypes: ['structural', 'hierarchical']
            }
        };
    }
    
    /**
     * Demonstrate behavioral pattern recognition
     */
    static getBehavioralPatternExample(): PatternInput {
        return {
            data: {
                interactions: [
                    { timestamp: 1000, action: 'file-open', target: 'user.service.ts' },
                    { timestamp: 1200, action: 'edit', target: 'user.service.ts', lines: [42, 43, 44] },
                    { timestamp: 1500, action: 'file-save', target: 'user.service.ts' },
                    { timestamp: 1800, action: 'test-run', target: 'user.service.spec.ts' },
                    { timestamp: 2100, action: 'file-open', target: 'user.controller.ts' },
                    { timestamp: 2300, action: 'edit', target: 'user.controller.ts', lines: [15, 16] },
                    { timestamp: 2500, action: 'file-save', target: 'user.controller.ts' },
                    { timestamp: 2800, action: 'test-run', target: 'user.controller.spec.ts' }
                ],
                usage: {
                    features: ['editor', 'test-runner', 'file-explorer'],
                    frequency: 0.8,
                    duration: 1800,
                    tasks: 4
                }
            },
            context: {
                userType: 'developer',
                sessionType: 'test-driven-development'
            },
            scope: 'local',
            options: {
                maxResults: 5,
                minConfidence: 0.3,
                patternTypes: ['behavioral', 'interaction-rhythm', 'usage-profile']
            }
        };
    }
    
    /**
     * Get expected pattern results for demonstration
     */
    static getExpectedPatternResults(): { 
        code: Partial<PatternResult>[], 
        structural: Partial<PatternResult>[], 
        behavioral: Partial<PatternResult>[] 
    } {
        return {
            code: [
                {
                    pattern: { name: 'dependency-injection', type: 'design-pattern' },
                    confidence: 0.9,
                    metadata: { patternType: 'design-pattern', language: 'typescript' }
                },
                {
                    pattern: { name: 'async-await', type: 'async-pattern' },
                    confidence: 0.85,
                    metadata: { patternType: 'async-pattern', complexity: 'moderate' }
                },
                {
                    pattern: { name: 'observable-pattern', type: 'reactive-pattern' },
                    confidence: 0.8,
                    metadata: { patternType: 'reactive-pattern', framework: 'rxjs' }
                },
                {
                    pattern: { name: 'singleton-pattern', type: 'design-pattern' },
                    confidence: 0.75,
                    metadata: { patternType: 'design-pattern', scope: 'singleton' }
                }
            ],
            structural: [
                {
                    pattern: { type: 'hierarchical', depth: 3 },
                    confidence: 0.8,
                    metadata: { patternType: 'hierarchical', architecture: 'layered' }
                },
                {
                    pattern: { type: 'repetition', frequency: 0.7 },
                    confidence: 0.7,
                    metadata: { patternType: 'repetition', commonElement: 'DatabaseService' }
                }
            ],
            behavioral: [
                {
                    pattern: { type: 'interaction-rhythm', averageInterval: 300 },
                    confidence: 0.75,
                    metadata: { patternType: 'interaction-rhythm', consistency: 0.8 }
                },
                {
                    pattern: { type: 'usage-profile', frequency: 0.8 },
                    confidence: 0.65,
                    metadata: { patternType: 'usage-profile', efficiency: 0.0022 }
                }
            ]
        };
    }
    
    /**
     * Format pattern results for display
     */
    static formatPatternResults(patterns: PatternResult[]): string {
        if (patterns.length === 0) {
            return 'No patterns detected.';
        }
        
        let output = `Found ${patterns.length} patterns:\n\n`;
        
        patterns.forEach((pattern, index) => {
            output += `${index + 1}. ${pattern.pattern.name || pattern.pattern.type}\n`;
            output += `   Type: ${pattern.metadata?.patternType || 'unknown'}\n`;
            output += `   Confidence: ${(pattern.confidence * 100).toFixed(1)}%\n`;
            output += `   Instances: ${pattern.instances.length}\n`;
            
            if (pattern.metadata?.complexity) {
                output += `   Complexity: ${pattern.metadata.complexity}\n`;
            }
            
            if (pattern.metadata?.language) {
                output += `   Language: ${pattern.metadata.language}\n`;
            }
            
            output += '\n';
        });
        
        return output;
    }
}