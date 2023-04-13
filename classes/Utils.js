import axios from 'axios';
import fs from 'fs';

class Utils {
    static async generateAvatar(name, filePath, size = 256) {
        const numberOfSpaces = (name.match(/\+/g) || []).length;

        const response = await axios({
            method: 'GET',
            url: 'https://ui-avatars.com/api/',
            params: {
                name: name,
                length: numberOfSpaces + 1,
                size: size,
                rounded: false,
                background: 'random',
                bold: true,
                'font-size': 0.2,
            },
            responseType: 'stream',
        });

        const writeStream = fs.createWriteStream(filePath);
        response.data.pipe(writeStream);

        return new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });
    }

    static generateReadme(name, description, filePath) {
        const readme = `# ${name}\n\n${description}`;

        fs.writeFile(filePath, readme, (err) => {
            if (err) {
                throw err;
            }
        });
    }

    static generateFolderStructure(folderPath) {
        return new Promise((resolve) => {
            if (fs.existsSync(folderPath)) return resolve();

            fs.mkdirSync(folderPath);
            resolve();
        });
    }
}

export default Utils;
