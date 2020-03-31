"use_strict";

import * as path from 'path';

import { Disposable, ExtensionContext, workspace, debug, OutputChannel, window, tasks } from 'vscode';

import { ApamaEnvironment } from './apama_util/apamaenvironment';
import { ApamaTaskProvider } from './apama_util/apamataskprovider';
import { ApamaDebugConfigurationProvider } from './apama_debug/apamadebugconfig';
import { ApamaProjectView } from './apama_project/apamaProjectView';
import { ApamaCommandProvider } from './apama_util/commands';//MY CHANGES

//
// client activation function, this is the entrypoint for the client
//
export function activate(context: ExtensionContext): void {
	let commands: Disposable[] = [];
	const logger = window.createOutputChannel('Apama Extension');
	logger.show();
	logger.appendLine('Started EPL Extension');

	let apamaEnv:ApamaEnvironment = new ApamaEnvironment(logger);
	const taskprov = new ApamaTaskProvider(logger,apamaEnv);
	context.subscriptions.push(tasks.registerTaskProvider( "apama" , taskprov ));

	const provider = new ApamaDebugConfigurationProvider(logger,apamaEnv);

	context.subscriptions.push(debug.registerDebugConfigurationProvider('apama', provider));
	context.subscriptions.push(provider);

	const commandprov = new ApamaCommandProvider(logger, apamaEnv, context);

	//this needs a workspace folder which under some circumstances can be undefined. 
	//but we can ignore in that case and things shjould still work
	if (workspace.workspaceFolders !== undefined) 
	{
		const projView = new ApamaProjectView(apamaEnv, logger, workspace.workspaceFolders ,context);
	}

	// Push the disposable to the context's subscriptions so that the 
	// client can be deactivated on extension deactivation
	commands.forEach(command => context.subscriptions.push(command));
}


// this method is called when your extension is deactivated
export function deactivate() { }
