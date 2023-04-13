import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

export default class Changelog {
    initialized = false;

    constructor() {
        this.changelog = "## 1.0.0\n\n- Initial release";
    }

    async init() {
        return new Promise((resolve) => {
            if (this.initialized) return resolve();

            fs.readFile(path.join(process.env.MODPACK_FOLDER, 'CHANGELOG.md'), 'utf8', (error, data) => {
                if (!error) {
                    this.changelog = data;
                }

                this.initialized = true;
                resolve();
            });
        });
    }

    async updateChangelog(version, additions, removals) {
        await this.init();

        if (version === "1.0.0") return new Promise((resolve) => { resolve(); });
        if (await this.versionExists(version)) return new Promise((resolve) => { resolve(); });
        if (!additions.length && !removals.length) return new Promise((resolve) => { resolve(); });

        console.log(`[${path.basename(__filename)}] :: Updating changelog for version ${version}...`);

        let changelog = `## ${version}\n\n`;

        if (additions.length > 0) {
            changelog += "- Added:\n";
            for (const addition of additions) {
                changelog += `  - ${addition}\n`;
            }
        }

        if (removals.length > 0) {
            changelog += "- Removed:\n";
            for (const removal of removals) {
                changelog += `  - ${removal}\n`;
            }
        }

        this.changelog = `${changelog}\n${this.changelog}`;

        return new Promise((resolve) => {
            fs.writeFile(path.join(process.env.MODPACK_FOLDER, 'CHANGELOG.md'), this.changelog, (error) => {
                if (error) {
                    console.error(error);
                }

                resolve();
            });
        });
    }

    async versionExists(version) {
        await this.init();

        return this.changelog.includes(`## ${version}`);
    }
}