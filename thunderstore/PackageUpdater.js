const axios = require('axios');
const fs = require('fs');
const path = require('path');

class PackageUpdater {
    API_URL = 'https://valheim.thunderstore.io/api/v1/package/';

    constructor() {
        this.updatePackages();

        this.packageInfoPath = 'currentPackages.json';
    }


    retrievePackages() {
        return axios.get(this.API_URL)
            .then(response => response.data);
    }

    writePackagesToFile(packages) {
        fs.writeFile(this.packageInfoPath, JSON.stringify(packages), (err) => {
            if (err) throw err;
            console.log(`[${path.basename(__filename)}] :: Successfully updated packages!`);
        });
    }

    updatePackages() {
        if (fs.existsSync(this.packageInfoPath)) {
            const fileStats = fs.statSync(this.packageInfoPath);
            const currentTime = new Date().getTime();
            const fileAge = (currentTime - fileStats.mtime.getTime()) / 1000 / 60 / 60;

            if (fileAge > 1) {
                console.log(`[${path.basename(__filename)}] :: File is older than 1 hour. Updating packages...`);
                this.retrievePackages()
                    .then(packages => {
                        this.writePackagesToFile(packages);
                    })
                    .catch(error => {
                        console.log(error);
                    });
            } else {
                console.log(`[${path.basename(__filename)}] :: Packages are up-to-date!`);
            }
        } else {
            console.log(`[${path.basename(__filename)}] :: File does not exist. Creating file and updating packages...`);
            this.retrievePackages()
                .then(packages => {
                    this.writePackagesToFile(packages);
                })
                .catch(error => {
                    console.log(error);
                });
        }
    }
}

module.exports = PackageUpdater;