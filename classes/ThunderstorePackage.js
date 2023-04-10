import fs from 'fs';
import path from 'path';
import extract from 'extract-zip';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

class ThunderstorePackage {
    isInitialized = false;
    fileName = 'thunderstorePackage.json';

    async init() {
        return new Promise(async (resolve) => {
            const packageJsonExists = await this.checkIfPackageJsonExists();
            if (!packageJsonExists) {
                this.createPackageJson();
            } else {
                const packageJsonHasContent = await this.getPackageJson();
                if (!packageJsonHasContent) {
                    this.createPackageJson();
                }
            }

            this.json = await this.getPackageJson();
            this.modInstallPath = process.env.MOD_INSTALL_PATH || this.json.modInstallPath;

            resolve();
        });
    }

    createPackageJson() {
        fs.writeFileSync(this.fileName, JSON.stringify({
            "modInstallPath": process.env.MOD_INSTALL_PATH || "./config/plugins",
            "packageInfoPath": "./currentPackages.json",
            "dependencies": {},
        }, null, 4));
    }

    async checkIfPackageJsonExists() {
        return new Promise((resolve) => {
            fs.access(this.fileName, fs.constants.F_OK, (err) => {
                if (err) {
                    console.log(`[${path.basename(__filename)}] :: ${this.fileName} does not exists, creating it now...`);
                    resolve(false);
                }
                console.log(`[${path.basename(__filename)}] :: ${this.fileName} exists, loading it now...`);
                resolve(true);
            });
        });
    }

    async getPackageJson() {
        return new Promise((resolve, reject) => {
            fs.readFile(this.fileName, 'utf8', (err, data) => {
                if (err) {
                    console.error(err);
                    reject(err);
                    return;
                }
                resolve(JSON.parse(data));
            });
        });
    }

    getInstalledPackages() {
        return this.json.dependencies;
    }

    saveInstalledPackages(name, version) {
        let isUpdating = false;
        if (this.json.dependencies[name]) {
            isUpdating = true;
        }

        this.json.dependencies[name] = version;

        return new Promise((resolve, reject) => {
            fs.writeFile(this.fileName, JSON.stringify(this.json, null, 4), (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                const text = isUpdating ? 'updated' : 'installed';
                console.log(`[${path.basename(__filename)}] :: Successfully ${text} ${name} with version ${version}!`)
                resolve();
            });
        });
    }

    async extractPackage(tsPackage) {
        const { fullName, filePath } = tsPackage;

        const resolvedFilePath = path.resolve(filePath);
        const resolvedModInstallPath = path.resolve(`${this.modInstallPath}/${fullName}`);

        // Check if folder exists, if yes, delete it
        if (fs.existsSync(resolvedModInstallPath)) {
            fs.rmSync(resolvedModInstallPath, { recursive: true });
        }

        console.log(`[${path.basename(__filename)}] :: Extracting ${fullName}...`)

        return new Promise(async (resolve, reject) => {
            await extract(resolvedFilePath, { dir: resolvedModInstallPath }, (err) => {
                if (err) {
                    console.error(`[${path.basename(__filename)}] :: Failed to extract ${fullName}!`);
                    reject(err);
                    return;
                }
            });

            console.log(`[${path.basename(__filename)}] :: Successfully extracted ${fullName}!`);
            resolve();
        });
    }

    async removeInstalledPackage(packageName, fullName) {
        return new Promise(async (resolve, reject) => {
            await this.init();

            const resolvedModInstallPath = path.resolve(`${this.modInstallPath}/${fullName}`);

            if (!fs.existsSync(resolvedModInstallPath)) {
                resolve();
                return console.error(`[${path.basename(__filename)}] :: Package ${packageName} not found`)
            }

            fs.rmSync(resolvedModInstallPath, { recursive: true });

            await this.removeInstalledPackageFromJson(packageName);

            resolve();
        });
    }

    async removeInstalledPackageFromJson(packageName, fullName) {
        return new Promise(async (resolve, reject) => {
            await this.init();

            if (!this.json.dependencies[packageName]) {
                resolve();
                return console.error(`[${path.basename(__filename)}] :: Package ${packageName} not found in ${fullName}`)
            }

            delete this.json.dependencies[packageName];

            fs.writeFile(this.fileName, JSON.stringify(this.json, null, 4), (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                console.log(`[${path.basename(__filename)}] :: Successfully removed ${packageName} from ${this.fileName}!`)
                resolve();
            });
        });
    }
}

export default ThunderstorePackage;