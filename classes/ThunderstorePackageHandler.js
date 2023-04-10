const path = require('path');
const fs = require('fs');

class ThunderstorePackageHandler {
    constructor() {
        const ThunderstorePackage = require('./ThunderstorePackage');
        const thunderstorePackage = new ThunderstorePackage();

        this.thunderstorePackage = thunderstorePackage;
        this.isInitialized = false;

        this.installedPackages = [];
    }

    async init() {
        return new Promise(async (resolve, reject) => {
            if (this.isInitialized) {
                resolve();
                return;
            }

            this.isInitialized = true;
            await this.thunderstorePackage.init();

            console.log(`[${path.basename(__filename)}] :: ThunderstorePackageHandler initialized`)
            resolve();
        });
    }

    async installPackageByName(packageName) {
        if (this.installedPackages.includes(packageName)) return;

        return new Promise(async (resolve, reject) => {
            await this.init();

            const PackageInfo = require('../thunderstore/PackageInfo');
            const packageInfo = new PackageInfo(packageName);

            if (!packageInfo.details) {
                resolve();
                return console.error(`[${path.basename(__filename)}] :: Package ${packageName} not found`)
            }

            const Package = require('../thunderstore/Package');
            const tsPackage = new Package(packageName, packageInfo.details);

            // Download dependencies first
            if (tsPackage.dependencies) {
                for (const dependency in tsPackage.dependencies) {
                    const regexPattern = /^[^-]+-([^-\d]+)-([\d\.]+)$/;

                    const match = tsPackage.dependencies[dependency].match(regexPattern);
                    if (match) {
                        await this.installPackageByName(match[1]);
                    } else {
                        console.error(`[${path.basename(__filename)}] :: Failed to install dependency ${tsPackage.dependencies[dependency]} for ${packageName}`);
                    }
                }
            }

            await tsPackage.downloadPackage()
                .then(async () => {
                    await this.thunderstorePackage.extractPackage(tsPackage);
                    await this.thunderstorePackage.saveInstalledPackages(packageName, tsPackage.version);
                    this.installedPackages.push(packageName);
                    resolve();
                })
                .catch((err) => {
                    console.error(`[${path.basename(__filename)}] :: Failed to install ${packageName}: ${err}`);
                    reject(err);
                });
        });
    }

    async updateInstalledPackages() {
        return new Promise(async (resolve, reject) => {
            await this.init();

            const installedPackages = this.thunderstorePackage.getInstalledPackages();

            try {
                for (const packageName in installedPackages) {
                    await this.installPackageByName(packageName);
                }
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    async removePackageByName(packageName) {
        return new Promise(async (resolve, reject) => {
            await this.init();

            // Get packageInfo
            const PackageInfo = require('../thunderstore/PackageInfo');
            const packageInfo = new PackageInfo(packageName);

            await this.thunderstorePackage.removeInstalledPackage(packageName, packageInfo.details.fullName);

            resolve();
        });
    }

    async createManifest() {
        return new Promise(async (resolve, reject) => {
            await this.init();

            const manifestFileName = process.env.MANIFEST_FILE_NAME || "manifest.json";
            const manifestDirectory = process.env.MANIFEST_FOLDER || "./manifest";

            let manifest = {
                "name": process.env.MANIFEST_NAME || "Modpack",
                "version_number": process.env.MANIFEST_VERSION || "1.0.0",
                "website_url": process.env.MANIFEST_WEBSITE_URL || "https://github.com/thunderstore-io",
                "description": process.env.MANIFEST_DESCRIPTION || "Modpack Description",
                "dependencies": [],
            }

            let hasPatchChanges = false;
            let hasMinorChanges = false;
            const dependencyArray = [];

            try {
                const installedPackages = this.thunderstorePackage.getInstalledPackages();

                const directoryExists = await fs.existsSync(manifestDirectory);
                if (!directoryExists) {
                    fs.mkdirSync(manifestDirectory);
                }

                for (const packageName in installedPackages) {
                    const PackageInfo = require('../thunderstore/PackageInfo');
                    const packageInfo = new PackageInfo(packageName);

                    const name = packageInfo.details.fullName;
                    const version = installedPackages[packageName];
                    dependencyArray.push(`${name}-${version}`);
                }

                /**
                 * Check if manifest already exists
                 * If it does, compare the dependencies
                 * If there are any changes, tell to update the minor version
                 */
                const filePath = path.join(process.env.MANIFEST_FOLDER, manifestFileName);
                const fileExists = await fs.existsSync(filePath);
                if (fileExists) {
                    console.log(`[${path.basename(__filename)}] :: Manifest already exists, updating dependencies...`);

                    const manifestFileContent = await fs.readFileSync(filePath, 'utf-8');
                    manifest = JSON.parse(manifestFileContent);

                    const additions = dependencyArray.filter(x => !manifest.dependencies.includes(x));
                    const removals = manifest.dependencies.filter(x => !dependencyArray.includes(x));

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

                manifest.version_number = [major, minor, patch].join(".");
                manifest.dependencies = dependencyArray;

                await fs.writeFileSync(filePath, JSON.stringify(manifest, null, 4));
                const createdUpdatedString = fileExists ? "updated" : "created";
                console.log(`[${path.basename(__filename)}] :: Manifest ${createdUpdatedString} successfully!`);
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }
}

module.exports = ThunderstorePackageHandler;