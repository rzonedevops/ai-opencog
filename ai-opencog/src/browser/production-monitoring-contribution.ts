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
import { CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry } from '@theia/core/lib/common';
import { ApplicationShell, WidgetManager } from '@theia/core/lib/browser';
import { ProductionMonitoringWidget, PRODUCTION_MONITORING_WIDGET_ID } from './production-monitoring-widget';

export namespace ProductionCommands {
    export const OPEN_PRODUCTION_MONITORING = {
        id: 'production.monitoring.open',
        label: 'Open Production Monitoring'
    };
}

@injectable()
export class ProductionMonitoringContribution implements CommandContribution, MenuContribution {

    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;

    @inject(WidgetManager)
    protected readonly widgetManager: WidgetManager;

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(ProductionCommands.OPEN_PRODUCTION_MONITORING, {
            label: 'Production Monitoring',
            execute: () => this.openProductionMonitoring()
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerSubmenu(['tools'], 'Tools');
        menus.registerMenuAction(['tools'], {
            commandId: ProductionCommands.OPEN_PRODUCTION_MONITORING.id,
            label: 'Production Monitoring'
        });
    }

    protected async openProductionMonitoring(): Promise<void> {
        const widget = await this.widgetManager.getOrCreateWidget(PRODUCTION_MONITORING_WIDGET_ID);
        this.shell.addWidget(widget, { area: 'main' });
        this.shell.activateWidget(widget);
    }
}