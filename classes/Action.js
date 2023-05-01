import PackageUpdater from '../thunderstore/PackageUpdater.js';
import ThunderstorePackageHandler from './ThunderstorePackageHandler.js';
import Modpack from './Modpack.js';
import inquirer from 'inquirer';
import fs from 'fs';

class Action {
    constructor() {
        this.packageUpdater = new PackageUpdater();
        this.thunderstorePackageHandler = new ThunderstorePackageHandler();
    }

    async init() {
        return await this.packageUpdater.isDone();
    }

    installPackageByName(packageName, download = true) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.init();

                await this.installOrUpdatePackageByName(packageName, download);

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

    updatePackageByName(packageName, download = true) {
        return new Promise(async (resolve) => {
            await this.init();

            await this.installOrUpdatePackageByName(packageName, download);

            resolve();
        });
    }

    installOrUpdatePackageByName(packageName, download = true) {
        return new Promise(async (resolve) => {
            await this.init();

            if (packageName === 'false') {
                packageName = null;
                download = false;
            }

            if (!packageName) {
                await this.thunderstorePackageHandler.updateInstalledPackages(download)
                resolve();
                return;
            };

            //Check if packagnename includes a version
            const splittedPackagaName = packageName.split('@');
            const packageData = {
                name: splittedPackagaName[0],
                version: splittedPackagaName[1] || null
            }

            await this.thunderstorePackageHandler.installPackageByName(packageData, download);

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

    start() {
        this.packageUpdater = new PackageUpdater();
        this.thunderstorePackageHandler = new ThunderstorePackageHandler();

        const lastInput = this.getLastInput();

        return new Promise(async () => {
            const questions = [
                {
                    type: 'list',
                    name: 'action',
                    message: 'What do you want to do?',
                    choices: [
                        {
                            name: 'Install packages from thunderstorePackage.json file',
                            value: 'installAllPackages',
                        },
                        {
                            name: 'Install a package',
                            value: 'installPackageByName',
                        },
                        {
                            name: 'Update all packages',
                            value: 'updatePackages',
                        },
                        {
                            name: 'Remove a package',
                            value: 'removePackageByName',
                        },
                        {
                            name: 'Create a manifest file',
                            value: 'createManifest',
                        },
                        {
                            name: 'Update your modpack',
                            value: 'createManifest',
                        },
                        {
                            name: 'Zip your modpack',
                            value: 'createModpack',
                        },
                        {
                            name: 'Exit',
                            value: 'exit',
                        },
                    ],
                },
                {
                    type: 'input',
                    name: 'packageName',
                    message: 'Enter the name of the package to install:',
                    default: lastInput.installPackageByName || null,
                    when: (answers) => ['installPackageByName'].includes(answers.action), // only ask this question if the "install" option is selected
                },
                {
                    type: 'input',
                    name: 'packageName',
                    message: 'Enter the name of the package to update:',
                    default: lastInput.updatePackageByName || null,
                    when: (answers) => ['updatePackageByName'].includes(answers.action), // only ask this question if the "install" option is selected
                },
                {
                    type: 'input',
                    name: 'packageName',
                    message: 'Enter the name of the package to remove:',
                    default: lastInput.removePackageByName || null,
                    when: (answers) => answers.action === 'removePackageByName', // only ask this question if the "remove" option is selected
                },
                {
                    type: 'confirm',
                    name: 'download',
                    message: 'Do you want to download the package/s?',
                    default: true,
                    when: (answers) => ['installPackageByName', 'installAllPackages', 'updatePackageByName', 'updatePackages'].includes(answers.action), // only ask this question if the "install" option is selected
                },
                {
                    type: 'confirm',
                    name: 'updateManifest',
                    message: 'Do you want to update the manifest file?',
                    default: true,
                    when: (answers) => answers.action === 'createModpack', // only ask this question if the "update" option is selected
                }
            ];

            const { action: actionName, packageName, download, updateManifest } = await inquirer.prompt(questions);

            if (actionName === 'exit') {
                process.exit(0);
            }

            this.setLastInputByActionName(actionName, packageName);

            switch (actionName) {
                case 'installAllPackages':
                case 'installPackageByName':
                    await this.installPackageByName(packageName, download);
                    break;
                case 'updatePackages':
                case 'updatePackageByName':
                    await this.updatePackageByName(packageName, download);
                    break;
                case 'removePackageByName':
                    await this.removePackageByName(packageName);
                    break;
                case 'createManifest':
                    await this.createManifest();
                    break;
                case 'createModpack':
                    await this.createModpack(updateManifest);
                    break;
            }

            // Ask again
            return await this.start();
        });
    }

    getLastInput() {
        if (!fs.existsSync('./cache/lastInput.json')) {
            fs.writeFileSync('./cache/lastInput.json', JSON.stringify({}));
        }

        const lastInput = fs.readFileSync('./cache/lastInput.json', 'utf8');

        return JSON.parse(lastInput);
    }

    setLastInputByActionName(actionName, input) {
        const lastInput = {
            ...this.getLastInput(),
            [actionName]: input,
        }

        fs.writeFileSync('./cache/lastInput.json', JSON.stringify(lastInput));
    }
}

export default Action;
