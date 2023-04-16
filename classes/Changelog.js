import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

export default class Changelog {
    initialized = false;
    additions = [];
    updates = [];
    removals = [];

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

    async updateChangelog(version, { additions, updates, removals }) {
        await this.init();

        this.additions = additions;
        this.updates = updates;
        this.removals = removals;

        const changes = this.additions.length + this.updates.length + this.removals.length;

        if (version === "1.0.0") return new Promise((resolve) => { resolve(); });
        if (await this.versionExists(version)) return new Promise((resolve) => { resolve(); });
        if (!changes) return new Promise((resolve) => { resolve(); });

        console.log(`[${path.basename(__filename)}] :: Updating changelog for version ${version}, adding ${changes} changes...`);

        this.resolveAdditionsAndRemovals();

        let changelog = `## ${version}\n\n`;

        if (this.additions.length > 0) {
            changelog += "- Added:\n";
            for (const addition of this.additions) {
                changelog += `  - ${addition}\n`;
            }
        }

        if (this.updates.length > 0) {
            changelog += "- Updated:\n";
            for (const update of this.updates) {
                changelog += `  - ${update}\n`;
            }
        }

        if (this.removals.length > 0) {
            changelog += "- Removed:\n";
            for (const removal of this.removals) {
                changelog += `  - ${removal}\n`;
            }
        }

        this.changelog = `${changelog}\n${this.changelog}`;

        return new Promise((resolve) => {
            console.log(`[${path.basename(__filename)}] :: Writing changelog to file...`);
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

    resolveAdditionsAndRemovals() {
        // Seperate author, name and version, which are seperated by a minus sign
        const additions = this.additions.map((addition) => {
            const [author, name, version] = addition.split('-');
            return { author, name, version };
        });

        // Seperate author, name and version, which are seperated by a minus sign
        const removals = this.removals.map((removal) => {
            const [author, name, version] = removal.split('-');
            return { author, name, version };
        });

        // Find all additions that are also removals
        const additionsAndRemovals = additions.filter((addition) => {
            return removals.some((removal) => {
                return removal.name === addition.name;
            });
        });

        // Remove all additions that are also removals
        this.additions = this.additions.filter((addition) => {
            return !additionsAndRemovals.some((additionAndRemoval) => {
                return additionAndRemoval.name === addition.split('-')[1];
            });
        });

        // Remove all removals that are also additions
        this.removals = this.removals.filter((removal) => {
            return !additionsAndRemovals.some((additionAndRemoval) => {
                return additionAndRemoval.name === removal.split('-')[1];
            });
        });

        // Add all additions that are also removals to the updates array
        this.updates.push(...additionsAndRemovals.map((additionAndRemoval) => {
            return `${additionAndRemoval.author}-${additionAndRemoval.name} to version ${additionAndRemoval.version}`;
        }));
    }
}