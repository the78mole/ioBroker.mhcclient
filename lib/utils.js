var controllerDir;
var appName;

function getAppName() {
    var parts = __dirname.replace(/\\/g, '/').split('/');
    return parts[parts.length - 2].split('.')[0];
}

// Get js-controller directory to load libs
function getControllerDir(isInstall) {
    var fs = require('fs');
    var path = require('path');
    var scriptdir = path.dirname(path.dirname(process.argv[1]));
    var testlink = scriptdir + '/' + appName.toLowerCase() + '.js-controller';
    var testpass = fs.existsSync(testlink);
    console.log('Utils Scriptdir: ' +  scriptdir);
    console.log('Test Link      : ' + testlink);
    console.log('Test           : ' + testpass);
    // Find the js-controller location
    var controllerDir = __dirname.replace(/\\/g, '/');
    var scriptdir =
    controllerDir = controllerDir.split('/');
    if (controllerDir[controllerDir.length - 3] === 'adapter') {
        console.log("Option 1...");
        controllerDir.splice(controllerDir.length - 3, 3);
        controllerDir = controllerDir.join('/');
    } else if (controllerDir[controllerDir.length - 3] === 'node_modules') {
        console.log("Option 2...");
        controllerDir.splice(controllerDir.length - 3, 3);
        controllerDir = controllerDir.join('/');
        if (fs.existsSync(controllerDir + '/node_modules/' + appName + '.js-controller')) {
            controllerDir += '/node_modules/' + appName + '.js-controller';
        } else if (fs.existsSync(controllerDir + '/node_modules/' + appName.toLowerCase() + '.js-controller')) {
            controllerDir += '/node_modules/' + appName.toLowerCase() + '.js-controller';
        } else if (!fs.existsSync(controllerDir + '/controller.js')) {
            if (!isInstall) {
                console.log('Cannot find js-controller');
                process.exit(10);
            } else {
                process.exit();
            }
        }
    } else if (fs.existsSync(__dirname + '/../../node_modules/' + appName.toLowerCase() + '.js-controller')) {
        console.log("Option 3...");
        controllerDir.splice(controllerDir.length - 2, 2);
        return controllerDir.join('/') + '/node_modules/' + appName.toLowerCase() + '.js-controller';
    } else if (testpass) {
        console.log("Option 4...");
        console.log("Seems we are in npm link mode... Using alternative controller search.");
        controllerDir = testlink;
    } else {
        console.log("Option 5...");
        if (!isInstall) {
            console.log('Cannot find js-controller');
            process.exit(10);
        } else {
            process.exit();
        }
    }
    return controllerDir;
}

// Read controller configuration file
function getConfig() {
    var fs = require('fs');
    if (fs.existsSync(controllerDir + '/conf/' + appName + '.json')) {
        return JSON.parse(fs.readFileSync(controllerDir + '/conf/' + appName + '.json'));
    } else if (fs.existsSync(controllerDir + '/conf/' + appName.toLowerCase() + '.json')) {
        return JSON.parse(fs.readFileSync(controllerDir + '/conf/' + appName.toLowerCase() + '.json'));
    } else {
        throw new Error('Cannot find ' + controllerDir + '/conf/' + appName + '.json');
    }
}
appName       = getAppName();
controllerDir = getControllerDir(typeof process !== 'undefined' && process.argv && process.argv.indexOf('--install') !== -1);

exports.controllerDir = controllerDir;
exports.getConfig =     getConfig;
exports.Adapter =       require(controllerDir + '/lib/adapter.js');
exports.appName =       appName;
