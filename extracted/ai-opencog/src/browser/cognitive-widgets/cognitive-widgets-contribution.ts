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

import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { Command, CommandRegistry } from '@theia/core/lib/common/command';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { nls } from '@theia/core/lib/common/nls';
import { codicon } from '@theia/core/lib/browser/widgets';
import { CodeIntelligenceWidget } from './code-intelligence-widget';
import { LearningProgressWidget } from './learning-progress-widget';
import { KnowledgeExplorerWidget } from './knowledge-explorer-widget';
import { CognitiveAssistantWidget } from './cognitive-assistant-widget';
import { MultiModalCognitiveWidget } from './multi-modal-cognitive-widget';

export const COGNITIVE_WIDGETS_COMMANDS = {
    SHOW_CODE_INTELLIGENCE: Command.toLocalizedCommand({
        id: 'cognitive.show-code-intelligence',
        label: 'Show Code Intelligence'
    }, 'theia/ai/cognitive/showCodeIntelligence'),
    
    SHOW_LEARNING_PROGRESS: Command.toLocalizedCommand({
        id: 'cognitive.show-learning-progress', 
        label: 'Show Learning Progress'
    }, 'theia/ai/cognitive/showLearningProgress'),
    
    SHOW_KNOWLEDGE_EXPLORER: Command.toLocalizedCommand({
        id: 'cognitive.show-knowledge-explorer',
        label: 'Show Knowledge Explorer'
    }, 'theia/ai/cognitive/showKnowledgeExplorer'),
    
    SHOW_COGNITIVE_ASSISTANT: Command.toLocalizedCommand({
        id: 'cognitive.show-cognitive-assistant',
        label: 'Show Cognitive Assistant'
    }, 'theia/ai/cognitive/showCognitiveAssistant'),
    
    SHOW_MULTI_MODAL_COGNITIVE: Command.toLocalizedCommand({
        id: 'cognitive.show-multi-modal-cognitive',
        label: 'Show Multi-Modal Cognitive Processing'
    }, 'theia/ai/cognitive/showMultiModalCognitive'),
    
    TOGGLE_ALL_COGNITIVE_WIDGETS: Command.toLocalizedCommand({
        id: 'cognitive.toggle-all-widgets',
        label: 'Toggle All Cognitive Widgets'
    }, 'theia/ai/cognitive/toggleAllWidgets')
};

@injectable()
export class CognitiveWidgetsContribution extends AbstractViewContribution<CodeIntelligenceWidget> {

    constructor() {
        super({
            widgetId: CodeIntelligenceWidget.ID,
            widgetName: CodeIntelligenceWidget.LABEL,
            defaultWidgetOptions: { area: 'right' },
            toggleCommandId: COGNITIVE_WIDGETS_COMMANDS.SHOW_CODE_INTELLIGENCE.id
        });
    }

    @postConstruct()
    protected init(): void {
        this.viewDidChange.fire();
    }

    registerCommands(commands: CommandRegistry): void {
        // Register individual widget commands
        commands.registerCommand(COGNITIVE_WIDGETS_COMMANDS.SHOW_CODE_INTELLIGENCE, {
            execute: () => this.openView({ activate: true, reveal: true })
        });

        commands.registerCommand(COGNITIVE_WIDGETS_COMMANDS.SHOW_LEARNING_PROGRESS, {
            execute: () => this.widget.then(async () => {
                const widget = await this.widgetManager.getOrCreateWidget(LearningProgressWidget.ID);
                this.shell.addWidget(widget, { area: 'right' });
                this.shell.activateWidget(widget.id);
            })
        });

        commands.registerCommand(COGNITIVE_WIDGETS_COMMANDS.SHOW_KNOWLEDGE_EXPLORER, {
            execute: () => this.widget.then(async () => {
                const widget = await this.widgetManager.getOrCreateWidget(KnowledgeExplorerWidget.ID);
                this.shell.addWidget(widget, { area: 'main', mode: 'tab-after' });
                this.shell.activateWidget(widget.id);
            })
        });

        commands.registerCommand(COGNITIVE_WIDGETS_COMMANDS.SHOW_COGNITIVE_ASSISTANT, {
            execute: () => this.widget.then(async () => {
                const widget = await this.widgetManager.getOrCreateWidget(CognitiveAssistantWidget.ID);
                this.shell.addWidget(widget, { area: 'bottom' });
                this.shell.activateWidget(widget.id);
            })
        });

        commands.registerCommand(COGNITIVE_WIDGETS_COMMANDS.SHOW_MULTI_MODAL_COGNITIVE, {
            execute: () => this.widget.then(async () => {
                const widget = await this.widgetManager.getOrCreateWidget(MultiModalCognitiveWidget.ID);
                this.shell.addWidget(widget, { area: 'main', mode: 'tab-after' });
                this.shell.activateWidget(widget.id);
            })
        });

        commands.registerCommand(COGNITIVE_WIDGETS_COMMANDS.TOGGLE_ALL_COGNITIVE_WIDGETS, {
            execute: async () => {
                // Toggle all cognitive widgets
                await Promise.all([
                    commands.executeCommand(COGNITIVE_WIDGETS_COMMANDS.SHOW_CODE_INTELLIGENCE.id),
                    commands.executeCommand(COGNITIVE_WIDGETS_COMMANDS.SHOW_LEARNING_PROGRESS.id),
                    commands.executeCommand(COGNITIVE_WIDGETS_COMMANDS.SHOW_KNOWLEDGE_EXPLORER.id),
                    commands.executeCommand(COGNITIVE_WIDGETS_COMMANDS.SHOW_COGNITIVE_ASSISTANT.id),
                    commands.executeCommand(COGNITIVE_WIDGETS_COMMANDS.SHOW_MULTI_MODAL_COGNITIVE.id)
                ]);
            }
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        // Register menu items in View menu
        const viewMenu = 'view/view-submenu';
        const cognitiveSubmenu = 'view/cognitive-submenu';
        
        // Create cognitive submenu
        menus.registerSubmenu(cognitiveSubmenu, nls.localize('theia/ai/cognitive/menu', 'Cognitive Views'), {
            order: '9'
        });

        // Add individual widget menu items
        menus.registerMenuAction(cognitiveSubmenu, {
            commandId: COGNITIVE_WIDGETS_COMMANDS.SHOW_CODE_INTELLIGENCE.id,
            label: COGNITIVE_WIDGETS_COMMANDS.SHOW_CODE_INTELLIGENCE.label,
            icon: codicon('graph'),
            order: '1'
        });

        menus.registerMenuAction(cognitiveSubmenu, {
            commandId: COGNITIVE_WIDGETS_COMMANDS.SHOW_LEARNING_PROGRESS.id,
            label: COGNITIVE_WIDGETS_COMMANDS.SHOW_LEARNING_PROGRESS.label,
            icon: codicon('graph-line'),
            order: '2'
        });

        menus.registerMenuAction(cognitiveSubmenu, {
            commandId: COGNITIVE_WIDGETS_COMMANDS.SHOW_KNOWLEDGE_EXPLORER.id,
            label: COGNITIVE_WIDGETS_COMMANDS.SHOW_KNOWLEDGE_EXPLORER.label,
            icon: codicon('graph-scatter'),
            order: '3'
        });

        menus.registerMenuAction(cognitiveSubmenu, {
            commandId: COGNITIVE_WIDGETS_COMMANDS.SHOW_COGNITIVE_ASSISTANT.id,
            label: COGNITIVE_WIDGETS_COMMANDS.SHOW_COGNITIVE_ASSISTANT.label,
            icon: codicon('hubot'),
            order: '4'
        });

        menus.registerMenuAction(cognitiveSubmenu, {
            commandId: COGNITIVE_WIDGETS_COMMANDS.SHOW_MULTI_MODAL_COGNITIVE.id,
            label: COGNITIVE_WIDGETS_COMMANDS.SHOW_MULTI_MODAL_COGNITIVE.label,
            icon: codicon('brain'),
            order: '5'
        });

        // Separator and toggle all command
        menus.registerMenuAction(cognitiveSubmenu, {
            commandId: COGNITIVE_WIDGETS_COMMANDS.TOGGLE_ALL_COGNITIVE_WIDGETS.id,
            label: COGNITIVE_WIDGETS_COMMANDS.TOGGLE_ALL_COGNITIVE_WIDGETS.label,
            icon: codicon('layout'),
            order: '6'
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        // Optionally show code intelligence widget on startup
        await this.openView();
    }
}

@injectable()
export class LearningProgressContribution extends AbstractViewContribution<LearningProgressWidget> {
    constructor() {
        super({
            widgetId: LearningProgressWidget.ID,
            widgetName: LearningProgressWidget.LABEL,
            defaultWidgetOptions: { area: 'right' },
            toggleCommandId: COGNITIVE_WIDGETS_COMMANDS.SHOW_LEARNING_PROGRESS.id
        });
    }
}

@injectable()
export class KnowledgeExplorerContribution extends AbstractViewContribution<KnowledgeExplorerWidget> {
    constructor() {
        super({
            widgetId: KnowledgeExplorerWidget.ID,
            widgetName: KnowledgeExplorerWidget.LABEL,
            defaultWidgetOptions: { area: 'main', mode: 'tab-after' },
            toggleCommandId: COGNITIVE_WIDGETS_COMMANDS.SHOW_KNOWLEDGE_EXPLORER.id
        });
    }
}

@injectable()
export class CognitiveAssistantContribution extends AbstractViewContribution<CognitiveAssistantWidget> {
    constructor() {
        super({
            widgetId: CognitiveAssistantWidget.ID,
            widgetName: CognitiveAssistantWidget.LABEL,
            defaultWidgetOptions: { area: 'bottom' },
            toggleCommandId: COGNITIVE_WIDGETS_COMMANDS.SHOW_COGNITIVE_ASSISTANT.id
        });
    }
}

@injectable()
export class MultiModalCognitiveContribution extends AbstractViewContribution<MultiModalCognitiveWidget> {
    constructor() {
        super({
            widgetId: MultiModalCognitiveWidget.ID,
            widgetName: MultiModalCognitiveWidget.LABEL,
            defaultWidgetOptions: { area: 'main', mode: 'tab-after' },
            toggleCommandId: COGNITIVE_WIDGETS_COMMANDS.SHOW_MULTI_MODAL_COGNITIVE.id
        });
    }
}