import axios from 'axios';
import fs from 'fs';
import inquirer from 'inquirer';

class Utils {
    static async checkSetup() {
        // Check if .env file exists
        if (!fs.existsSync('.env')) {
            // Ask user to create .env file
            const { createEnv } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'createEnv',
                    message: 'No .env file found. Do you want to create one?',
                },
            ]);

            if (createEnv) {
                // Create .env-example file
                const envExample = fs.readFileSync('.env-example', 'utf8');
                const envExampleJson = envExample.split('\n').reduce((acc, line) => {
                    // Skip empty and commented lines
                    if (!line.includes('=')) return acc;

                    const [key, value] = line.split('=');
                    acc[key] = value;
                    return acc;
                }, {});

                // Ask user for values
                const envValues = await inquirer.prompt(
                    Object.keys(envExampleJson).map((key) => {
                        return {
                            type: 'input',
                            name: key,
                            message: `Enter value for ${key}`,
                            default: envExampleJson[key],
                        };
                    })
                );

                // Create .env file
                const envFile = Object.keys(envValues).reduce((acc, key) => {
                    acc += `${key}=${envValues[key]}\n`;
                    return acc;
                }, '');

                fs.writeFileSync('.env', envFile);
            }

            // Check if .env file exists again
            if (!fs.existsSync('.env')) {
                throw new Error('No .env file found. Please create one.');
            }
        }
    }

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

    static sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    static getAuthorNameVersionFromPackageString = (packageString) => {
        const splittedString = packageString.split('-');
        const version = splittedString.pop();
        const name = splittedString.pop();
        const author = splittedString.join('-');

        return {
            author,
            name,
            version,
        };
    };

    static getLastInput() {
        if (!fs.existsSync('./cache/lastInput.json')) {
            fs.writeFileSync('./cache/lastInput.json', JSON.stringify({}));
        }

        const lastInput = fs.readFileSync('./cache/lastInput.json', 'utf8');

        return JSON.parse(lastInput);
    }

    static setLastInputByActionName(actionName, input) {
        const lastInput = {
            ...this.getLastInput(),
            [actionName]: input,
        }

        fs.writeFileSync('./cache/lastInput.json', JSON.stringify(lastInput));
    }

    static clearLastInput() {
        fs.rmSync('./cache/lastInput.json');
    }
}

export default Utils;
