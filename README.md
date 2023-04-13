# Thunderstore Nodejs Mod Manager

Thunderstore Nodejs Mod Manager is a command-line tool that makes it easy to download and manage mods for your favorite games from [Thunderstore](https://thunderstore.io), a popular mod hosting website.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

## Features

- Install mods from Thunderstore with a single command
- Update installed mods to the latest version
- Remove installed mods
- Create and manage modpacks

## Installation

1. Clone the repository:

```sh
git clone https://github.com/DooDesch/ThunderstoreNodejsModManager.git
```

2. Install dependencies:

```sh
npm install
```

3. Create a .env file based on the .env-example file, and modify the values as needed.

## Usage

Thunderstore Nodejs Mod Manager can be run with the following command:

```sh
node index [command] [options]
```

For a list of available commands, run:

```sh
node index --help
```

Here are some examples of how to use the tool:

- Install a mod: `node index install mod-name [download = true]`
- Update a mod: `node index update mod-name [download = true]`
- Remove a mod: `node index remove mod-name`
- Create a manifest file: `node index create:manifest`
- Update the manifest file: `node index update:manifest`
- Create a modpack: `node index create:modpack:zip [updateManifest = true]`

## Configuration

The `.env` file contains several configuration options that you can customize to fit your needs. Here are the available options:

- `MOD_INSTALL_PATH`: The path where the downloaded mods will be installed. Defaults to `"./config/plugins"`.
- `MAX_DOWNLOAD_RETRY_COUNT`: The number of times to retry downloading a mod before giving up. Defaults to `20`.
- `GAME`: The name of the game for which you want to download mods. Defaults to `"Valheim"`.
- `MODPACK_FOLDER`: The folder where the modpack files are located. Defaults to `"./modpack"`.
- `MODPACK_DIST_FOLDER`: The folder where the modpack zip file will be located. Defaults to `"./dist"`.
- `MANIFEST_FILE_NAME`: The name of the manifest file for the modpack. Defaults to `"manifest.json"`.

## Contributing

Contributions to this project are welcome! To contribute:

1. Fork the repository
2. Create a new branch: `git checkout -b my-new-feature`
3. Make changes and commit them: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request

## License

Thunderstore Nodejs Mod Manager is licensed under the MIT License. See [LICENSE](LICENSE) for more information.