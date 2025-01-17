import * as vscode from 'vscode';
import { emojify } from 'node-emoji';
import { ViewNode } from './viewnode';
import { AxiosRequestConfig } from 'axios';

export class APIConfig {
    constructor(
        public readonly server: string,
        public readonly token: string,
        public readonly default_owner: string
    ) { }

    get headers(): AxiosRequestConfig {
        return { headers: { Authorization: `Bearer ${this.token}` } };
    }
}

export const getConfig = () => {
    // Use drone configs from ENV if exist otherwise use vscode's configuration
    let server = process.env['DRONE_SERVER'] || vscode.workspace.getConfiguration('droneci').get<string>('server', '');
    let token = process.env['DRONE_TOKEN'] || vscode.workspace.getConfiguration('droneci').get<string>('token', '');
    let default_owner = vscode.workspace.getConfiguration('droneci').get<string>('default_owner', '');
    // remove trailing slash
    server = server.match('/$') ? server.substr(0, server.length - 1) : server;
    // auto add https prefix
    server = server.match('^(http)s?\:\/\/') ? server : 'https://' + server;
    return new APIConfig(server, token, default_owner);
};

function EmojiStatus(status: string): string {
    switch (status) {
        case 'success':
            return '✅';
        case 'failure':
            return '❌';
        case 'error':
            return '❌';
        case 'running':
            return '🕐';
        case 'killed':
            return '🔪';
        case 'skipped':
            return '🚫';
        default:
            console.log(`Unknown status: ${status}`);
            return '❔';
    }
}

export class Feed extends ViewNode {

    constructor(
        // public readonly active: Boolean,
        public readonly build: Build,
        public readonly name: string,
        public readonly slug: string,
        public readonly uid: string,
        public readonly version: Number,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command,
    ) {
        super(`${EmojiStatus(build.status)}  ${build.number} ${emojify(build.message)}`, collapsibleState);
    }


    get tooltip(): string {
        return `${this.slug}-${this.build.source}`;
    }

    get description(): string {
        return `${this.build.status}`;
    }

    get iconPath(): any {
        return vscode.Uri.parse(this.build.author_avatar);
    }
    get uri(): string {
        return `/api/repos/${this.slug}/builds/${this.build.number}`;
    }

    // contextValue = 'feed';
    get contextValue(): string {
        return 'feed' + this.build.status;
    }

}

export class Build extends ViewNode {
    constructor(
        public readonly author_avatar: string,
        public readonly author_name: string,
        public readonly created: Number,
        public readonly number: Number,
        public readonly message: string,
        public readonly status: string,
        public readonly source: string,
        public readonly stages: Stage[],
    ) {
        super(`${author_name}`, vscode.TreeItemCollapsibleState.Collapsed);
    }

    get uri(): string {
        return "";
    }
    get link(): string {
        return "";
    }
    contextValue = 'build';
}

class Stage extends ViewNode {
    constructor(
        public readonly name: string,
        public readonly number: Number,
        public readonly steps: Step[],
    ) {
        super(name, vscode.TreeItemCollapsibleState.Collapsed);
    }
    contextValue = 'stage';

}

export class Step extends ViewNode {
    constructor(
        public readonly slug: string,
        public readonly build_number: Number,
        public readonly stage_number: Number,
        public readonly number: Number,
        public readonly name: string,
        public readonly status: string,
    ) {
        super(`${EmojiStatus(status)} ${name}`, vscode.TreeItemCollapsibleState.None);
    }

    get command() {
        return {
            command: 'droneBuildFeed.viewLog',
            title: '',
            arguments: [this]
        };
    }

    get description(): string {
        return `${this.status}`;
    }

    get tooltip(): string {
        return `${this.status}`;
    }

    get link(): string {
        return `${this.slug}/${this.build_number}/${this.stage_number}/${this.number}`;
    }

    get logUri(): string {
        return `${this.slug}/builds/${this.build_number}/logs/${this.stage_number}/${this.number}`;
    }
    contextValue = 'step';
}

export class StepLog {
    constructor(
        public readonly pos: Number,
        public readonly out: string,
        public readonly time: Number
    ) {

    }
    toString(): string {
        return this.out;
    }
}
