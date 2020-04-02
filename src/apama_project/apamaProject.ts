import { OutputChannel, TreeItem, TreeItemCollapsibleState, Command, WorkspaceFolder, Uri, RelativePattern, workspace } from 'vscode';
import * as path from 'path';
import { ApamaRunner } from '../apama_util/apamarunner';



export interface ApamaTreeItem {
	logger: OutputChannel;
	label: string;
	fsDir: string;
	items: ApamaTreeItem[];
	contextValue: string;
	instance: boolean;
	ws: WorkspaceFolder;
	apama_project: ApamaRunner;
}

export class ApamaProjectWorkspace extends TreeItem implements ApamaTreeItem {

	constructor(
		public logger: OutputChannel,
		public readonly label: string,
		public readonly fsDir: string,
		public ws: WorkspaceFolder,
		public apama_project: ApamaRunner
	) {
		super(label, TreeItemCollapsibleState.Collapsed);
	}

	items: ApamaProject[] = [];
	contextValue: string = 'workspace';
	instance: boolean = false;

	//
	// Find all the projects 
	//
	async scanProjects(): Promise<ApamaProject[]> {

		let result: ApamaProject[] = [];

		//find .projects, but exclude anything with _deployed suffix
		//also covers all roots of a multi root workspace
		let projectsPattern: RelativePattern = new RelativePattern(this.ws, "**/.project");
		let ignorePattern: RelativePattern = new RelativePattern(this.ws, "**/*_deployed/**");
		let projectNames = await workspace.findFiles(projectsPattern, ignorePattern);

		for (let index = 0; index < projectNames.length; index++) {
			const project: Uri = projectNames[index];
			let current: ApamaProject = new ApamaProject(this.logger,
				path.relative(this.ws.uri.fsPath, path.dirname(project.fsPath)),
				path.dirname(project.fsPath),
				this.ws,
				this.apama_project
			);
			result.push(current);
		}
		return result;
	}
}


export class ApamaProject extends TreeItem implements ApamaTreeItem {
	constructor(
		public logger: OutputChannel,
		public readonly label: string,
		public readonly fsDir: string,
		public ws: WorkspaceFolder,
		public apama_project: ApamaRunner
	) {
		super(label, TreeItemCollapsibleState.Collapsed);
	}
	items: BundleItem[] = [];
	contextValue: string = 'project';
	instance: boolean = false;


	//
	// Use apama project tool to populate ApamaProject objects list of Bundles
	//
	async getBundlesFromProject(): Promise<BundleItem[]> {

		let items: BundleItem[] = [];
		let previousBundle: any;
		
		let result = await this.apama_project.run(this.fsDir, ['--json', 'list', 'bundles']);
		
		let jsonBundlesList = this.apama_project.parseOutput(result);
		let already_added_bundles = jsonBundlesList.msg.already_added;
		if (already_added_bundles !== undefined) {
			for (let i = 0; i < already_added_bundles.length; i++) {
				let item = already_added_bundles[i];

				// first work out if bundle is an instance (i.e. indentation is 12)
				let current = item.trimRight();
				let indentation = current.length;
				current = item.trimLeft();
				indentation = indentation - current.length;

				if (indentation === 12) { // if bundle is an instance
					previousBundle.instance = true;
					previousBundle.items.push(new BundleItem(this.logger, current, this.fsDir, this.ws, this.apama_project));
					if (i === already_added_bundles.length - 1) {
						items.push(previousBundle);
					}
				} else { // bundle is not an instance
					if (previousBundle !== undefined) {
						items.push(previousBundle);
					}
					previousBundle = new BundleItem(this.logger, current, this.fsDir, this.ws, this.apama_project);
				}
			}
		}
		return items;
	}
}

export class BundleItem extends TreeItem implements ApamaTreeItem {
	constructor(public logger: OutputChannel,
		public readonly label: string,
		public fsDir: string,
		public ws: WorkspaceFolder,
		public apama_project: ApamaRunner) {
		super(label, TreeItemCollapsibleState.Collapsed);
	}
	items: BundleItem[] = [];
	contextValue: string = 'bundle';
	instance: boolean = false;
}
