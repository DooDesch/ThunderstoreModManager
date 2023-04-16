import { program } from 'commander';
import dotenv from 'dotenv';
import Action from './classes/Action.js';
import Utils from './classes/Utils.js';

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

program.parse(process.argv);
