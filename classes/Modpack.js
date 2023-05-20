import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import Utils from './Utils.js';

import inquirer from 'inquirer';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

class Modpack {
    iconFileName = "icon.png";
    readmeFileName = "README.md";
    manifestFileName = "manifest.json";
    changelogFileName = "CHANGELOG.md";
    modpackDirectory = process.env.MODPACK_FOLDER || "./modpack";
    cacheFolder = process.env.MODPACK_CACHE_FOLDER || "./cache/modpack";
    manifest = {};

    constructor() {
        const manifestFileContent = fs.readFileSync(path.join(this.modpackDirectory, this.manifestFileName), 'utf-8');
        this.manifest = JSON.parse(manifestFileContent);

        // Create cache folder if it doesn't exist
        const directoryExists = fs.existsSync(this.cacheFolder);
        if (!directoryExists) {
            fs.mkdirSync(this.cacheFolder, { recursive: true });
        }
    }

    async init() {
        return new Promise(async (resolve) => {
            await this.iconExists();
            await this.readmeExists();

            const check = [
                this.modpackDirectory,
                path.join(this.modpackDirectory, this.manifestFileName),
            ]

            this.filesOrDirectoriesExistOrError(check);
            resolve();
        });
    }

    async createModpack() {
        await this.init();

        return new Promise(async (resolve, reject) => {
            try {
                // Get modpack name from manifest
                const modpackName = this.manifest.name;
                const modpackVersion = this.manifest.version_number;

                // Create zip file using adm-zip
                const zip = new AdmZip();
                const folderToZip = this.modpackDirectory;
                const zipFileName = `${modpackName}-${modpackVersion}.zip`;
                const dist = process.env.MODPACK_DIST_FOLDER || "./dist";
                const zipFilePath = path.join(dist, zipFileName);

                // Create dist directory if it doesn't exist
                const directoryExists = fs.existsSync(dist);
                if (!directoryExists) {
                    fs.mkdirSync(dist);
                }

                // Add files to zip
                zip.addLocalFolder(folderToZip);
                zip.writeZip(zipFilePath);

                console.log(`[${path.basename(__filename)}] :: Modpack ${zipFileName} created successfully!`);
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    fileOrDirectoryExistsOrError(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`[${path.basename(__filename)}] :: File or directory does not exist: ${filePath}`);
        }
    }

    filesOrDirectoriesExistOrError(filePaths) {
        for (const filePath of filePaths) {
            this.fileOrDirectoryExistsOrError(filePath);
        }
    }

    async iconExists() {
        try {
            this.fileOrDirectoryExistsOrError(path.join(this.modpackDirectory, this.iconFileName));
            return true;
        } catch (err) {
            const answer = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'createImage',
                    message: `[${path.basename(__filename)}] :: Icon does not exist. Create one?`,
                },
            ]);

            if (answer.createImage) {
                const iconPath = path.join(this.modpackDirectory, this.iconFileName);
                const name = this.manifest.name.replaceAll("_", "+");
                await Utils.generateAvatar(name, iconPath);

                return true;
            } else {
                throw new Error(err);
            }
        }
    }

    async readmeExists() {
        try {
            this.fileOrDirectoryExistsOrError(path.join(this.modpackDirectory, this.readmeFileName));
            return true;
        } catch (err) {
            const answer = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'createReadme',
                    message: `[${path.basename(__filename)}] :: README does not exist. Create one?`,
                },
            ]);

            if (answer.createReadme) {
                const readmePath = path.join(this.modpackDirectory, this.readmeFileName);
                const name = this.manifest.name.replaceAll("_", " ");
                const description = this.manifest.description;
                Utils.generateReadme(name, description, readmePath);

                return true;
            } else {
                throw new Error(err);
            }
        }
    }

    backupManifest() {
        return new Promise(async (resolve, reject) => {
            const manifestBackupPath = path.join(this.cacheFolder, this.manifestFileName);
            fs.copyFileSync(path.join(this.modpackDirectory, this.manifestFileName), manifestBackupPath);

            console.log(`[${path.basename(__filename)}] :: Manifest backed up to ${manifestBackupPath}`);
            resolve();
        });
    }

    backupChangelog() {
        return new Promise(async (resolve, reject) => {
            const changelogBackupPath = path.join(this.cacheFolder, this.changelogFileName);
            fs.copyFileSync(path.join(this.modpackDirectory, this.changelogFileName), changelogBackupPath);

            console.log(`[${path.basename(__filename)}] :: Changelog backed up to ${changelogBackupPath}`);
            resolve();
        });
    }

    rollbackManifest() {
        return new Promise(async (resolve, reject) => {
            const manifestBackupPath = path.join(this.cacheFolder, this.manifestFileName);
            fs.copyFileSync(manifestBackupPath, path.join(this.modpackDirectory, this.manifestFileName));

            console.log(`[${path.basename(__filename)}] :: Manifest rolled back to ${manifestBackupPath}`);
            resolve();
        });
    }

    rollbackChangelog() {
        return new Promise(async (resolve, reject) => {
            const changelogBackupPath = path.join(this.cacheFolder, this.changelogFileName);
            fs.copyFileSync(changelogBackupPath, path.join(this.modpackDirectory, this.changelogFileName));

            console.log(`[${path.basename(__filename)}] :: Changelog rolled back to ${changelogBackupPath}`);
            resolve();
        });
    }

    async rollbackModpack() {
        await this.rollbackManifest();
        await this.rollbackChangelog();
    }
}

export default Modpack;