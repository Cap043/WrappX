// index.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const shell = require('shelljs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

let generatedAppName;  // Declare a variable to store the generated app name

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/generate-app', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'generate-app.html'));
});

app.post('/generate-app', async (req, res) => {
    const { websiteLink, appName, packageName, versionName, versionCode, platforms, logoFileName } = req.body;

    // Validate inputs here if needed

    // Generate a unique token
    const token = crypto.randomBytes(16).toString('hex');

    // Set the generated app name to the global variable
    generatedAppName = appName;

    const platformString = platforms.join(' ');

    try {
        // Wait for the logo to be uploaded before proceeding
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Run Cordova commands to generate the app, add platforms, and add plugins
        const cordovaCommand = `
            npx cordova create ${appName} ${packageName} ${appName} &&
            cd ${appName} &&
            mkdir resources &&
            cp ../public/logos/${logoFileName} resources/logo.png &&
            npx cordova platform add ${platformString} &&
            npx cordova plugin add cordova-plugin-inappbrowser &&
            echo '<!DOCTYPE html><html><head><title>${appName}</title><script type="text/javascript" src="cordova.js"></script><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"></head><body><script>document.addEventListener("deviceready", function() { var ref = cordova.InAppBrowser.open("${websiteLink}", "_blank", "location=no"); }, false);</script></body></html>' > www/index.html &&
            npx cordova plugin add cordova-plugin-splashscreen &&
            npx cordova plugin add cordova-plugin-statusbar &&
            npx cordova plugin add cordova-plugin-camera
        `;

        const executeInsertIconScript = `cd ${appName} && node ../insert-icon.js`;

        const cordovaBuildCommand = `cd ${appName} && npx cordova build ${platformString} -- --gradleArg=-PcdvVersionCode=${versionCode} --gradleArg=-PcdvVersionName=${versionName}`;

        await executeCommand(cordovaCommand);
        await executeCommand(executeInsertIconScript);
        await executeCommand(cordovaBuildCommand);

        res.json({ success: true, message: 'App generated successfully.', token });
    } catch (error) {
        console.error('Cordova Build Error:', error);
        res.status(500).json({ success: false, message: 'Error generating app.', error });
    }
});

app.get('/download/:token', async (req, res) => {
    const token = req.params.token;

  
    const apkFilePath = path.join(__dirname, generatedAppName, 'platforms', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');


    res.download(apkFilePath, `${generatedAppName}.apk`);
});

app.post('/upload-logo', upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No logo file uploaded.' });
        }

        const logoData = req.file.buffer;
        const fileName = `${Date.now()}-logo.png`; // Unique filename
        const filePath = path.join(__dirname, 'public', 'logos', fileName);

        await fs.promises.writeFile(filePath, logoData);

        res.json({ success: true, fileName });
    } catch (error) {
        console.error('Error uploading logo:', error);
        res.status(500).json({ success: false, message: 'Error uploading logo.', error });
    }
});

function executeCommand(command) {
    return new Promise((resolve, reject) => {
        shell.exec(command, (code, stdout, stderr) => {
            if (code === 0) {
                resolve();
            } else {
                reject(stderr);
            }
        });
    });
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
