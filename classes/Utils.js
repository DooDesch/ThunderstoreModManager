import axios from 'axios';
import fs from 'fs';

class Utils {
    static async generateAvatar(name, filePath, size = 256) {
        name = name.replaceAll('_', '+');
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
}

export default Utils;
