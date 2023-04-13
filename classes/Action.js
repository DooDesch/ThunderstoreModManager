import PackageUpdater from '../thunderstore/PackageUpdater.js';
import ThunderstorePackageHandler from './ThunderstorePackageHandler.js';
import Modpack from './Modpack.js';

class Action {
    constructor() {
        this.packageUpdater = new PackageUpdater();
        this.thunderstorePackageHandler = new ThunderstorePackageHandler();
    }

    async init() {
        return await this.packageUpdater.isDone();
    }

    installPackageByName(packageName) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.init();

                await this.installOrUpdatePackageByName(packageName);

                const installedPackages = this.thunderstorePackageHandler.thunderstorePackage.getInstalledPackages();
                const totalInstalledMods = Object.keys(installedPackages).length
                console.log('-------------------------')
                console.log(`Total installed packages: ${totalInstalledMods}`)

                resolve();
            } catch (error) {
                console.error(`Error installing package '${packageName}':`, error);
                reject(error);
            }
        });
    }

    updatePackageByName(packageName) {
        return new Promise(async (resolve) => {
            await this.init();

            await this.installOrUpdatePackageByName(packageName);

            resolve();
        });
    }

    installOrUpdatePackageByName(packageName) {
        return new Promise(async (resolve) => {
            await this.init();

            if (packageName) await this.thunderstorePackageHandler.installPackageByName(packageName);
            else await this.thunderstorePackageHandler.updateInstalledPackages();

            resolve();
        });
    }

    removePackageByName(packageName) {
        return new Promise(async (resolve) => {
            await this.init();

            await this.thunderstorePackageHandler.removePackageByName(packageName);

            resolve();
        });
    }

    createManifest() {
        return new Promise(async (resolve) => {
            await this.init();

            await this.thunderstorePackageHandler.createManifest();

            resolve();
        });
    }

    createModpack(updateManifest) {
        return new Promise(async (resolve) => {
            await this.init();

            const modpack = new Modpack();
            if (updateManifest) await this.createManifest();
            await modpack.createModpack();

            resolve();
        });
    }
}

export default Action;
