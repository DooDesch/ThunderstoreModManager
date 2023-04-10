const fs = require('fs');
const axios = require('axios');

class Package {
    constructor(name, packageInfo) {
        const { latest, dependencies, downloadUrl, fullName } = packageInfo;
        this.name = name;
        this.fullName = fullName;
        this.version = latest;
        this.dependencies = dependencies;
        this.downloadUrl = downloadUrl;

        this.directory = `./zipped-packages`;
        this.fileName = `${this.fullName}-${this.version}.zip`;
        this.filePath = `${this.directory}/${this.fileName}`;

        this.maxRetryCount = process.env.MAX_DOWNLOAD_RETRY_COUNT;

        this.createDirectoryIfNotExists();
    }

    async downloadPackage(url = this.downloadUrl, retryCount = this.maxRetryCount) {
        const packageAlreadyDownloaded = await this.packageAlreadyDownloaded();
        if (packageAlreadyDownloaded) {
            return true;
        }

        const writer = fs.createWriteStream(this.filePath);

        try {
            const response = await axios({
                url,
                method: 'GET',
                responseType: 'stream'
            });

            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    writer.close();
                    resolve();
                });

                writer.on('error', (err) => {
                    fs.unlink(this.filePath, () => {
                        reject(err);
                    });
                });

                response.data.on('error', async (err) => {
                    if (err.code === 'ECONNRESET' && retryCount > 0) {
                        await this.downloadPackage(url, retryCount - 1);
                        resolve();
                    } else {
                        fs.unlink(this.filePath, () => {
                            reject(err);
                        });
                    }
                });
            });
        } catch (err) {
            if (retryCount > 0) {
                await this.downloadPackage(url, retryCount - 1);
                return;
            }

            throw err;
        }
    }

    async packageAlreadyDownloaded() {
        const path = require('path');
        const { promisify } = require('util');
        const access = promisify(fs.access);

        try {
            await access(this.filePath, fs.constants.F_OK);

            const fileSize = fs.statSync(this.filePath).size;
            if (fileSize <= 0) {
                throw new Error('File is empty');
            }

            console.log(`[${path.basename(__filename)}] :: ${this.fullName} is already up-to-date...`);
            return true;
        } catch (error) {
            console.log(`[${path.basename(__filename)}] :: Downloading ${this.fullName} now...`);
            return false;
        }
    }


    createDirectoryIfNotExists() {
        if (!fs.existsSync(this.directory)) {
            fs.mkdirSync(this.directory);
        }
    }
}

export default Package;
