import fs from 'fs';

class PackageInfo {
    constructor(packageName) {
        this.packageName = packageName;
        this.details = this.getPackageInfoFromCurrentPackages(packageName);
    }

    getPackageInfoFromCurrentPackages(packageName) {
        try {
            // Load "currentPackages.json" into a variable called currentPackages
            const currentPackagesFile = fs.readFileSync('./cache/currentPackages.json', 'utf8');
            const currentPackages = JSON.parse(currentPackagesFile);

            // Find the package with the given name
            const thunderstorePackage = currentPackages.find(pkg => pkg.name === packageName);

            // Return null if the package is not found
            if (!thunderstorePackage) {
                return null;
            }

            // Get the latest version of the package
            const latestVersion = thunderstorePackage.versions[0];

            // Get the download URL and dependencies for the latest version
            const downloadUrl = latestVersion.download_url;
            const dependencies = latestVersion.dependencies;

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
                versionNumber: latestVersion.version_number,
                description: latestVersion.description,
                icon: latestVersion.icon,
                downloadUrl: downloadUrl,
                dependencies: dependencies,
                downloads: latestVersion.downloads,
                websiteUrl: latestVersion.website_url,
                isActive: latestVersion.is_active,
                fileSize: latestVersion.file_size,
                latest: latestVersion.version_number,
            };

            // Add the latest version information to the package object
            packageInfo.versions = [latestVersion];

            // Return the package information
            return packageInfo;
        } catch (error) {
            console.error(error);
            return null;
        }
    }
}

export default PackageInfo;