const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

class Modpack {
    iconFileName = "icon.png";
    readmeFileName = "README.md";
    manifestFileName = "manifest.json";
    modpackDirectory = process.env.MODPACK_FOLDER || "./modpack";

    constructor() {
        const check = [
            this.modpackDirectory,
            path.join(this.modpackDirectory, this.manifestFileName),
            path.join(this.modpackDirectory, this.readmeFileName),
            path.join(this.modpackDirectory, this.iconFileName),
        ]

        this.filesOrDirectoriesExistOrError(check);
    }

    createModpack() {
        return new Promise(async (resolve, reject) => {
            try {
                // Get modpack name from manifest
                const manifestFileContent = fs.readFileSync(path.join(this.modpackDirectory, this.manifestFileName), 'utf-8');
                const manifest = JSON.parse(manifestFileContent);
                const modpackName = manifest.name;
                const modpackVersion = manifest.version_number;

                // Create zip file using adm-zip
                const zip = new AdmZip();
                const folderToZip = this.modpackDirectory;
                const zipFileName = `${modpackName}-${modpackVersion}.zip`;
                const dist = process.env.MODPACK_DIST_FOLDER || "./dist";
                const zipFilePath = path.join(dist, zipFileName);

                // Create dist directory if it doesn't exist
                const directoryExists = fs.existsSync(dist);
                if (!directoryExists) {
                    fs.mkdirSync(dist);
                }

                // Add files to zip
                zip.addLocalFolder(folderToZip);
                zip.writeZip(zipFilePath);

                console.log(`[${path.basename(__filename)}] :: Modpack created successfully!`);
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    fileOrDirectoryExistsOrError(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`[${path.basename(__filename)}] :: File or directory does not exist: ${filePath}`);
        }
    }

    filesOrDirectoriesExistOrError(filePaths) {
        for (const filePath of filePaths) {
            this.fileOrDirectoryExistsOrError(filePath);
        }
    }
}

module.exports = Modpack;