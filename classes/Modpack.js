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
    modpackDirectory = process.env.MODPACK_FOLDER || "./modpack";

    constructor() {
        const manifestFileContent = fs.readFileSync(path.join(this.modpackDirectory, this.manifestFileName), 'utf-8');
        this.manifest = JSON.parse(manifestFileContent);
    }

    async init() {
        return new Promise(async (resolve, reject) => {
            await this.iconExists();

            const check = [
                this.modpackDirectory,
                path.join(this.modpackDirectory, this.manifestFileName),
                path.join(this.modpackDirectory, this.readmeFileName),
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
                const name = this.manifest.name;
                await Utils.generateAvatar(name, iconPath);

                return true;
            } else {
                throw new Error(err);
            }
        }
    }
}

export default Modpack;