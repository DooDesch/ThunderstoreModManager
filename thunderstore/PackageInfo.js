import fs from 'fs';

class PackageInfo {
    constructor({ name, version }, currentPackages) {
        this.name = name;
        this.version = version;
        this.currentPackages = currentPackages;
        this.details = this.getPackageInfoFromCurrentPackages(name);
    }

    getPackageInfoFromCurrentPackages(name) {
        try {
            // Find the package with the given name
            const thunderstorePackage = this.currentPackages.find(pkg => pkg.name === name);

            // Return null if the package is not found
            if (!thunderstorePackage) {
                return null;
            }

            // Get the latest version of the package
            const latestVersion = thunderstorePackage.versions[0];
            let version = latestVersion;

            // Overwrite version with the requested version if it exists
            if (this.version) {
                const requestedVersion = thunderstorePackage.versions.find(version => version.version_number === this.version);

                if (requestedVersion) {
                    version = requestedVersion;
                }
            }

            // Get the download URL and dependencies for the latest version
            const downloadUrl = version.download_url;
            const dependencies = version.dependencies;

            // Create an object containing all the package information
            const packageInfo = {
                name: thunderstorePackage.name,
                fullName: thunderstorePackage.full_name,
                owner: thunderstorePackage.owner,
                packageUrl: thunderstorePackage.package_url,
                dateCreated: thunderstorePackage.date_created,
                dateUpdated: thunderstorePackage.date_updated,
                uuid4: thunderstorePackage.uuid4,
                ratingScore: thunderstorePackage.rating_score,
                isPinned: thunderstorePackage.is_pinned,
                isDeprecated: thunderstorePackage.is_deprecated,
                hasNsfwContent: thunderstorePackage.has_nsfw_content,
                categories: thunderstorePackage.categories,
                versionNumber: version.version_number,
                description: version.description,
                icon: version.icon,
                downloadUrl: downloadUrl,
                dependencies: dependencies,
                downloads: version.downloads,
                websiteUrl: version.website_url,
                isActive: version.is_active,
                fileSize: version.file_size,
                latest: latestVersion.version_number,
            };

            // Add the latest version information to the package object
            packageInfo.versions = [latestVersion, version];

            // Return the package information
            return packageInfo;
        } catch (error) {
            console.error(error);
            return null;
        }
    }
}

export default PackageInfo;