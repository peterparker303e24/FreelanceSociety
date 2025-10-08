import fs from "fs";

// Read the package.js dependencies
const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
const dependencies = packageJson.dependencies || {};

// Clean the libraries folder
fs.rmSync("./js/libs", { recursive: true, force: true });
fs.mkdirSync('./js/libs');

// Iterate over each dependency and copy it to the js/libs folder
Object.keys(dependencies).forEach(dep => {
    fs.copyFile(
        `node_modules/${dep}/dist/${dep}.min.js`,
        `js/libs/${dep}.min.js`,
        (err) => {
            if (err) {
                console.error('Error copying file: ', err);
            } else {
                console.log(`File ${dep}.min.js copied successfully.`);
            }
        }
    );
});

