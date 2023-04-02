const path = require('path');

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
}

module.exports = ThunderstorePackageHandler;