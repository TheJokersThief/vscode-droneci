// @ts-nocheck
import * as vscode from 'vscode';
import axios from 'axios';
import { ViewNode } from './viewnode';
import { APIConfig, getConfig, Build, Feed, Step } from './droneci';


export class BuildFeedProvider implements vscode.TreeDataProvider<ViewNode> {

    private _onDidChangeTreeData: vscode.EventEmitter<ViewNode | undefined> = new vscode.EventEmitter<ViewNode | undefined>();
    readonly onDidChangeTreeData: vscode.Event<ViewNode | undefined> = this._onDidChangeTreeData.event;
    private droneCfg: APIConfig;
    private repo: string;
    private owner: string;

    constructor() {
        this.droneCfg = getConfig();
        this.repo = vscode.workspace.workspaceFolders === undefined ? '' : vscode.workspace.workspaceFolders[0].name;
        this.owner = this.droneCfg.default_owner;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ViewNode): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ViewNode): Thenable<ViewNode[]> {
        if (element) {
            return this.GetSteps(element as Feed);
        }
        return this.GetFeed();
    }

    private GetSteps(feed: Feed): Promise<ViewNode[]> {
        return new Promise((resolve, reject) => {
            let url = `${this.droneCfg.server}${feed.uri}`;
            axios.get<Build>(url, this.droneCfg.headers)
                .then(resp => resp.data)
                .then(build => {
                    if (build.status === 'pending') {
                        return resolve([]);
                    }
                    let newData = build.stages.map(stg => {
                        return stg.steps.map(stp => new Step(feed.slug, build.number, stg.number, stp.number, stp.name, stp.status));
                    });
                    let dt: Step[] = [];
                    dt = dt.concat(...newData);
                    return resolve(dt);
                })
                .catch(err => reject(err));

        });
    }

    private GetFeed(): Promise<ViewNode[]> {
        return new Promise((resolve, reject) => {
            let slug = `${this.owner}/${this.repo}`;

            axios.get<Feed[]>(`${this.droneCfg.server}/api/repos/${slug}/builds`, this.droneCfg.headers)
                .then(resp => resp.data)
                .then(data => {
                    let newData: Feed[] = data.map(f => {
                        let build = new Build(f.author_avatar, f.author_name, f.created, f.number, f.message, f.status, f.source);
                        let feed = new Feed(build, f.name, slug, f.uid, f.version, vscode.TreeItemCollapsibleState.Collapsed);
                        return feed;
                    });

                    if (newData.length === 0) {
                        vscode.window.showInformationMessage("Build feed is empty");
                    }

                    return resolve(newData);
                })
                .catch(error => {
                    console.log(error.response.status);

                    if (error.response.status == 404){
                        vscode.window.showInformationMessage("Build feed is empty");
                        reject(error);
                        return
                    }
                    // handle error
                    vscode.window.showErrorMessage("Unable to fetch build feed: " + error);
                    reject(error);
                });
        });
    }

}