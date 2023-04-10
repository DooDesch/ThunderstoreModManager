const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

class Modpack {
    constructor() { }

    createModpack() {
        return new Promise(async (resolve, reject) => {
            try {
                const iconFileName = "icon.png";
                const readmeFileName = "README.md";
                const manifestFileName = "manifest.json";
                const modpackDirectory = process.env.MODPACK_FOLDER || "./modpack";

                const check = [
                    modpackDirectory,
                    path.join(modpackDirectory, manifestFileName),
                    path.join(modpackDirectory, readmeFileName),
                    path.join(modpackDirectory, iconFileName),
                ]
                this.filesOrDirectoriesExistOrError(check);

                // Get modpack name from manifest
                const manifestFileContent = fs.readFileSync(path.join(modpackDirectory, manifestFileName), 'utf-8');
                const manifest = JSON.parse(manifestFileContent);
                const modpackName = manifest.name;

                // Create zip file using adm-zip
                const zip = new AdmZip();
                const folderToZip = modpackDirectory;
                const zipFileName = `${modpackName}.zip`;
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