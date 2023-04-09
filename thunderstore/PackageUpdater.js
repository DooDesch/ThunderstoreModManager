const axios = require('axios');
const fs = require('fs');
const path = require('path');

class PackageUpdater {
    game = process.env.GAME.toLowerCase();
    packageInfoPath = 'currentPackages.json'
    done = false;

    constructor() {
        const riskOfRain2Variants = [
            'riskofrain2',
            'risk-of-rain-2',
            'riskofrain',
            'risk-of-rain',
            'ror2',
            'ror',
        ]

        if (riskOfRain2Variants.includes(this.game)) {
            this.API_URL = 'https://thunderstore.io/api/v1/package/';
        } else {
            this.API_URL = `https://${process.env.GAME.toLowerCase()}.thunderstore.io/api/v1/package/`;
        }

        this.updatePackages();
    }


    retrievePackages() {
        return axios.get(this.API_URL)
            .then(response => response.data);
    }

    async writePackagesToFile(packages) {
        return new Promise((resolve, reject) => {
            fs.writeFile(this.packageInfoPath, JSON.stringify(packages), (err) => {
                if (err) {
                    reject(err);
                    return;
                };
                console.log(`[${path.basename(__filename)}] :: Successfully updated packages!`);
                resolve();
            });
        });
    }

    async updatePackages() {
        if (fs.existsSync(this.packageInfoPath)) {
            const fileStats = fs.statSync(this.packageInfoPath);
            const currentTime = new Date().getTime();
            const fileAge = (currentTime - fileStats.mtime.getTime()) / 1000 / 60 / 60;

            if (fileAge > 1) {
                console.log(`[${path.basename(__filename)}] :: File is older than 1 hour. Updating packages...`);
                await this.retrievePackages()
                    .then(async packages => {
                        await this.writePackagesToFile(packages);
                    })
                    .catch(error => {
                        console.log(error);
                    });
            } else {
                console.log(`[${path.basename(__filename)}] :: Packages are up-to-date!`);
            }
        } else {
            console.log(`[${path.basename(__filename)}] :: File does not exist. Creating file and updating packages...`);
            await this.retrievePackages()
                .then(async packages => {
                    await this.writePackagesToFile(packages);
                })
                .catch(error => {
                    console.log(error);
                });
        }
        this.done = true;
    }

    isDone() {
        return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                if (this.done) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }
}

module.exports = PackageUpdater;