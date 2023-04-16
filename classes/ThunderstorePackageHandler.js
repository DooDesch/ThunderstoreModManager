import fs from 'fs';
import path from 'path';
import ThunderstorePackage from './ThunderstorePackage.js';
import CurrentPackages from '../thunderstore/CurrentPackages.js';
import PackageInfo from '../thunderstore/PackageInfo.js';
import Package from '../thunderstore/Package.js';
import Changelog from './Changelog.js';
import inquirer from 'inquirer';
import AdmZip from 'adm-zip';
import crypto from 'crypto';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

class ThunderstorePackageHandler {
    isInitialized = false;
    installedPackages = [];

    constructor() {
        this.thunderstorePackage = new ThunderstorePackage();
    }

    init() {
        return new Promise(async (resolve) => {
            if (this.isInitialized) {
                resolve();
                return;
            }

            const currentPackages = new CurrentPackages();
            this.currentPackages = await currentPackages.getPackages();

            await this.thunderstorePackage.init();
            this.isInitialized = true;

            console.log(`[${path.basename(__filename)}] :: ThunderstorePackageHandler initialized`)
            resolve();
        });
    }

    installPackageByName({ name, version }, download = true) {
        if (this.installedPackages.includes(name)) return;

        return new Promise(async (resolve, reject) => {
            await this.init();

            const packageInfo = new PackageInfo({ name, version }, this.currentPackages);
            if (!packageInfo.details) {
                resolve();
                const versionString = version ? `@${version}` : '';
                return console.error(`[${path.basename(__filename)}] :: Package ${name}${versionString} not found`)
            }

            // Download dependencies first
            const tsPackage = new Package(name, packageInfo.details);
            if (tsPackage.dependencies) {
                for (const dependency in tsPackage.dependencies) {
                    const regexPattern = /^[^-]+-([^-\d]+)-([\d\.]+)$/;

                    const match = tsPackage.dependencies[dependency].match(regexPattern);
                    if (match) {
                        const packageData = {
                            name: match[1],
                            version: match[2]
                        }

                        await this.installPackageByName(packageData, download);
                    } else {
                        console.error(`[${path.basename(__filename)}] :: Failed to install dependency ${tsPackage.dependencies[dependency]} for ${name}`);
                    }
                }
            }

            if (!download) {
                console.log(`[${path.basename(__filename)}] :: Skipping download for ${name}...`);
                await this.thunderstorePackage.saveInstalledPackages(name, tsPackage.version);
                this.installedPackages.push(name);
                resolve();
                return;
            }

            await tsPackage.downloadPackage()
                .then(async () => {
                    await this.thunderstorePackage.extractPackage(tsPackage);
                    await this.thunderstorePackage.saveInstalledPackages(name, tsPackage.version);
                    this.installedPackages.push(name);
                    resolve();
                })
                .catch((err) => {
                    console.error(`[${path.basename(__filename)}] :: Failed to install ${name}: ${err}`);
                    reject(err);
                });
        });
    }

    updateInstalledPackages(download = true) {
        return new Promise(async (resolve, reject) => {
            await this.init();

            const installedPackages = this.thunderstorePackage.getInstalledPackages();

            try {
                for (const packageName in installedPackages) {
                    const packageData = {
                        name: packageName,
                        version: null
                    }
                    await this.installPackageByName(packageData, download);
                }
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    removePackageByName(name) {
        return new Promise(async (resolve, reject) => {
            await this.init();

            const packageInfo = new PackageInfo({ name }, this.currentPackages);
            await this.thunderstorePackage.removeInstalledPackage(name, packageInfo.details.fullName);

            resolve();
        });
    }

    askForManifestDetail(detailName, defaultValue) {
        return new Promise(async (resolve) => {
            const questions = [
                {
                    type: 'input',
                    name: 'detail',
                    message: `Enter ${detailName}:`,
                    default: defaultValue,
                }
            ];

            inquirer.prompt(questions).then(async (answers) => {
                resolve(answers.detail);
            });
        });
    }

    createManifest() {
        return new Promise(async (resolve, reject) => {
            await this.init();

            const manifestFileName = "manifest.json";
            const manifestDirectory = process.env.MODPACK_FOLDER || "./modpack";

            let manifest = {};
            let hasPatchChanges = false;
            let hasMinorChanges = false;
            const dependencyArray = [];

            try {
                let additions = [];
                let updates = [];
                let removals = [];

                const installedPackages = this.thunderstorePackage.getInstalledPackages();

                /**
                 * Create manifest directory if it doesn't exist
                 */
                const directoryExists = fs.existsSync(manifestDirectory);
                if (!directoryExists) {
                    fs.mkdirSync(manifestDirectory);
                }

                /**
                 * Check if manifest already exists
                 * If it does, compare the dependencies
                 * If there are any changes, tell to update the minor version
                 */
                const filePath = path.join(process.env.MODPACK_FOLDER, manifestFileName);
                const fileExists = fs.existsSync(filePath);
                if (fileExists) {
                    const manifestFileContent = fs.readFileSync(filePath, 'utf-8');
                    manifest = JSON.parse(manifestFileContent);
                } else {
                    manifest = {
                        "name": process.env.MANIFEST_NAME || await this.askForManifestDetail("Modpack Name", "Modpack"),
                        "version_number": process.env.MANIFEST_VERSION || await this.askForManifestDetail("Modpack Version", "1.0.0"),
                        "website_url": process.env.MANIFEST_WEBSITE_URL || await this.askForManifestDetail("Modpack Website URL", "https://github.com/thunderstore-io"),
                        "description": process.env.MANIFEST_DESCRIPTION || await this.askForManifestDetail("Modpack Description", "A modpack made with Thunderstore.io"),
                        "config_folder_hash": null,
                        "dependencies": [],
                    }
                }

                /** 
                 * Get config folder md5 hash
                 */
                const configFolder = path.join(process.env.MODPACK_FOLDER, "config");
                const configFolderExists = fs.existsSync(configFolder);
                if (configFolderExists) {
                    const configFolderHash = await this.getFolderHash(configFolder);
                    const currentConfigFolderHash = manifest.config_folder_hash || null;
                    if (currentConfigFolderHash !== configFolderHash) {
                        console.log(`[${path.basename(__filename)}] :: Config folder hash changed, updating manifest...`);
                        manifest.config_folder_hash = configFolderHash;
                        updates.push("Config files");
                        hasPatchChanges = true;
                    }
                }

                /**
                 * Create dependency array
                 */
                console.log(`[${path.basename(__filename)}] :: Checking dependencies...`);
                for (const packageName in installedPackages) {
                    if (packageName === manifest.name) continue;

                    const packageInfo = new PackageInfo({ name: packageName }, this.currentPackages);

                    const name = packageInfo.details.fullName;
                    const version = installedPackages[packageName];
                    dependencyArray.push(`${name}-${version}`);
                }

                /** 
                 * Check if there are any changes
                 */
                if (fileExists) {
                    additions = dependencyArray.filter(x => !manifest.dependencies.includes(x));
                    removals = manifest.dependencies.filter(x => !dependencyArray.includes(x));

                    if (additions.length > 0) {
                        console.log(`[${path.basename(__filename)}] :: Added dependencies: ${additions.join(", ")}`);
                        hasPatchChanges = true;
                    }
                    if (removals.length > 0) {
                        console.log(`[${path.basename(__filename)}] :: Removed dependencies: ${removals.join(", ")}`);
                        hasPatchChanges = true;
                    }

                    if (manifest.dependencies.length !== dependencyArray.length) {
                        hasMinorChanges = true;
                    }
                }

                /**
                 * Update the version number
                 */
                let [major, minor, patch] = manifest.version_number.split(".");
                if (hasPatchChanges) {
                    console.log(`[${path.basename(__filename)}] :: Manifest has patch changes, updating version number...`);
                    patch = parseInt(patch) + 1;
                }
                if (hasMinorChanges) {
                    console.log(`[${path.basename(__filename)}] :: Manifest has minor changes, updating version number...`);
                    minor = parseInt(minor) + 1;
                    patch = 0;
                }
                if (!hasPatchChanges && !hasMinorChanges) {
                    console.log(`[${path.basename(__filename)}] :: Manifest has no changes, skipping version number update...`);
                }

                /**
                 * Update the manifest
                 */
                manifest.version_number = [major, minor, patch].join(".");
                manifest.dependencies = dependencyArray;

                /**
                 * Save the manifest
                 */
                fs.writeFileSync(filePath, JSON.stringify(manifest, null, 4));
                const createdUpdatedString = fileExists ? "updated" : "created";
                console.log(`[${path.basename(__filename)}] :: Manifest ${createdUpdatedString} successfully!`);

                /**
                 * Update the changelog
                 */
                const changelog = new Changelog();
                await changelog.updateChangelog(manifest.version_number, { additions, updates, removals });

                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    getFolderHash(folderPath) {
        return new Promise(async (resolve, reject) => {
            try {
                // Zip files, get hash, remove zip
                const zip = new AdmZip();
                zip.addLocalFolder(folderPath);
                const zipPath = path.join(folderPath, "temp.zip");
                zip.writeZip(zipPath);
                const folderHash = await this.getFileHash(zipPath);
                fs.unlinkSync(zipPath);

                resolve(folderHash);
            } catch (err) {
                reject(err);
            }
        });
    }

    getFileHash(filePath) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('md5');
            const fileBuffer = fs.readFileSync(filePath);
            hash.update(fileBuffer);

            const base64Hash = hash.digest('base64');
            const base64HashNoPadding = base64Hash.replace(/=/g, "");

            resolve(base64HashNoPadding);
        });
    }

}

export default ThunderstorePackageHandler;