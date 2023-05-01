import fs from 'fs';

export default class CurrentPackages {
    packages = [];

    constructor() { }

    init() {
        return new Promise((resolve) => {
            // Load "currentPackages.json" into a variable called currentPackages
            const currentPackagesFile = fs.readFileSync('./cache/currentPackages.json', 'utf8');
            this.packages = JSON.parse(currentPackagesFile);

            resolve();
        });
    }

    async getPackages() {
        await this.init();

        return new Promise((resolve) => {
            resolve(this.packages);
        });
    }

    async clearPackages() {
        await this.init();

        return new Promise((resolve) => {
            fs.rmSync('./cache/currentPackages.json');

            resolve();
        });
    }
}