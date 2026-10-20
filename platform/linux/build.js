const builder = require('electron-builder');
const path = require('path');
const fs = require('fs');

const publishDir = process.env.PUBLISH_DIR ? path.resolve(process.env.PUBLISH_DIR) : path.resolve(__dirname, '../../publish');
if (!fs.existsSync(publishDir)) {
    fs.mkdirSync(publishDir, { recursive: true });
}

function prepareBuildAssets() {
    const srcAssets = path.resolve(__dirname, '../../Assets');
    const destAssets = path.resolve(__dirname, 'assets');
    if (!fs.existsSync(destAssets)) {
        fs.mkdirSync(destAssets, { recursive: true });
    }
    if (fs.existsSync(srcAssets)) {
        for (const file of fs.readdirSync(srcAssets)) {
            fs.copyFileSync(path.join(srcAssets, file), path.join(destAssets, file));
        }
    }

    const srcLoader = path.resolve(__dirname, '../../loader.user.js');
    const destLoader = path.resolve(__dirname, 'loader.user.js');
    if (fs.existsSync(srcLoader)) {
        fs.copyFileSync(srcLoader, destLoader);
    }
}

async function buildAllLinux() {
    prepareBuildAssets();

    console.log("=== Building Linux Standalone (Regular) ===");
    await builder.build({
        targets: builder.Platform.LINUX.createTarget(["AppImage", "tar.gz"]),
        publish: 'never',
        config: {
            appId: "com.izumii.bcdesktop",
            productName: "Bondage Club",
            publish: null,
            directories: {
                output: publishDir
            },
            linux: {
                target: [
                    { target: "AppImage", arch: ["x64"] },
                    { target: "tar.gz", arch: ["x64"] }
                ],
                category: "Game",
                icon: path.resolve(__dirname, "assets/app_logo.png"),
                artifactName: "BC-Linux.${ext}"
            },
            files: [
                "main.js",
                "package.json",
                "loader.user.js",
                "assets/**/*"
            ]
        }
    });

    console.log("\n=== Building Linux Standalone (Hidden / Discreet) ===");
    await builder.build({
        targets: builder.Platform.LINUX.createTarget(["AppImage", "tar.gz"]),
        publish: 'never',
        config: {
            appId: "com.izumii.bcdesktop.hidden",
            productName: "\u3164",
            extraMetadata: { productName: "\u3164" },
            publish: null,
            directories: {
                output: publishDir
            },
            linux: {
                target: [
                    { target: "AppImage", arch: ["x64"] },
                    { target: "tar.gz", arch: ["x64"] }
                ],
                category: "Game",
                icon: path.resolve(__dirname, "assets/transparent.png"),
                artifactName: "BC-Linux-Hidden.${ext}"
            },
            files: [
                "main.js",
                "package.json",
                "loader.user.js",
                "assets/**/*"
            ]
        }
    });

    // Clean up temporary intermediate build files
    const unpackedDir = path.join(publishDir, "linux-unpacked");
    if (fs.existsSync(unpackedDir)) {
        fs.rmSync(unpackedDir, { recursive: true, force: true });
    }
    const debugYml = path.join(publishDir, "builder-debug.yml");
    if (fs.existsSync(debugYml)) {
        fs.rmSync(debugYml, { force: true });
    }
    const latestYml = path.join(publishDir, "latest-linux.yml");
    if (fs.existsSync(latestYml)) {
        fs.rmSync(latestYml, { force: true });
    }
    const destAssets = path.resolve(__dirname, 'assets');
    if (fs.existsSync(destAssets)) {
        fs.rmSync(destAssets, { recursive: true, force: true });
    }
    const destLoader = path.resolve(__dirname, 'loader.user.js');
    if (fs.existsSync(destLoader)) {
        fs.rmSync(destLoader, { force: true });
    }

    console.log("\nLinux build complete! Clean standalone packages saved to publish/");
}

buildAllLinux().catch(err => {
    console.error("Linux build failed:", err);
    process.exit(1);
});
