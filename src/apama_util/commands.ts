import { ApamaRunner } from '../apama_util/apamarunner';
import * as vscode from 'vscode';
import { ApamaEnvironment } from '../apama_util/apamaenvironment';


export class ApamaCommandProvider{
    private injectCmd: ApamaRunner;
    private sendCmd: ApamaRunner;

    public constructor(private logger: vscode.OutputChannel, apamaEnv: ApamaEnvironment, private context: vscode.ExtensionContext) {
        this.injectCmd = new ApamaRunner("engine_inject", apamaEnv.getInjectCmdline(), logger);
        this.sendCmd = new ApamaRunner("engine_send", apamaEnv.getSendCmdLine(), logger);
        this.registerCommands();
    }

    registerCommands(): void {

        if (this.context !== undefined) {
            let port:any = vscode.workspace.getConfiguration("softwareag.apama").get("debugport");
            this.context.subscriptions.push.apply(this.context.subscriptions, 
                [
                // engine_inject command
		        vscode.commands.registerCommand('extension.apama.engine_inject', (monFile) => {
                    this.injectCmd.run('.',['-p', port.toString()].concat(monFile.fsPath))
                }),
                // engine_send command
                //vscode.commands.registerCommand('extension.apama.engine_send', (evtFile) => {
                //    this.sendCmd.run('.',['-p', port.toString()].concat(evtFile.fsPath))
                //})    
                ]
        );
        }
    }

    
	dispose() {
		return;
	}

}

