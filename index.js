import { program } from 'commander';
import dotenv from 'dotenv';
import Action from './classes/Action.js';
import Utils from './classes/Utils.js';
import inquirer from 'inquirer';

// Check if .env file exists
await Utils.checkSetup();

dotenv.config();

program.version('1.0.0');

program
    .command('version')
    .description('Show version')
    .action(() => {
        console.log(program.version());
    });

program
    .command('install [package] [download]')
    .description('Install a package by name')
    .action(async (packageName, download = 'true') => {
        const action = new Action();
        await action.init();
        await action.installPackageByName(packageName, download === 'true');
    });

program
    .command('update [package] [download]')
    .description('Update all installed packages or a specific package')
    .action(async (packageName, download = 'true') => {
        const action = new Action();
        await action.init();
        await action.updatePackageByName(packageName, download === 'true');
    });

program
    .command('remove <package>')
    .description('Remove a package by name')
    .action(async (packageName) => {
        const action = new Action();
        await action.init();
        await action.removePackageByName(packageName);
    });

program
    .command('create:manifest')
    .description('Create a manifest file for your mod or modpack using the dependencies in your thunderstorePackage.json')
    .action(async () => {
        const action = new Action();
        await action.init();
        await action.createManifest();
    });

program
    .command('update:modpack')
    .description('Update the dependencies in your modpack using the dependencies in your thunderstorePackage.json')
    .action(async () => {
        const action = new Action();
        await action.init();
        await action.createManifest();
    });

program
    .command('create:modpack:zip [updateManifest]')
    .description('Zip your modpack using the dependencies in your thunderstorePackage.json')
    .action(async (updateManifest = 'true') => {
        const action = new Action();
        await action.init();
        await action.createModpack(updateManifest === 'true');
    });

program
    .command('start')
    .description('Start the mod manager')
    .action(async () => {
        const action = new Action();
        await action.init();

        const questions = [
            {
                type: 'list',
                name: 'action',
                message: 'What do you want to do?',
                choices: [
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
                when: (answers) => ['installPackageByName'].includes(answers.action), // only ask this question if the "install" option is selected
            },
            {
                type: 'input',
                name: 'packageName',
                message: 'Enter the name of the package to update:',
                when: (answers) => ['updatePackageByName'].includes(answers.action), // only ask this question if the "install" option is selected
            },
            {
                type: 'input',
                name: 'packageName',
                message: 'Enter the name of the package to remove:',
                when: (answers) => answers.action === 'remove', // only ask this question if the "remove" option is selected
            },
            {
                type: 'confirm',
                name: 'download',
                message: 'Do you want to download the package?',
                default: true,
                when: (answers) => ['installPackageByName', 'updatePackageByName', 'updatePackages'].includes(answers.action), // only ask this question if the "install" option is selected
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

        switch (actionName) {
            case 'installPackageByName':
                await action.installPackageByName(packageName, download);
                break;
            case 'updatePackages':
            case 'updatePackageByName':
                await action.updatePackageByName(packageName, download);
                break;
            case 'removePackageByName':
                await action.remove(packageName);
                break;
            case 'createManifest':
                await action.createManifest();
                break;
            case 'createModpack':
                await action.createModpack(updateManifest);
                break;
        }
    });

program.parse(process.argv);
