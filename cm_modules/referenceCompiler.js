//// setup default properties
var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;

//// fetch params
var sourceFilePath = process.argv[2];
var destinationFileDirectory = process.argv[3];

//// setup extended properties
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var systemProperties = propertiesReader.getSystemProperties();

//// setup cm_modules
var constants = require(cmModulesPath + systemProperties.path().catman.constants);
var genericUtil = require(cmModulesPath + systemProperties.path().catman.genericUtilities);

//// setup node modules
var fs = require(systemProperties.path().node.fileSystem);
var os = require(systemProperties.path().node.operatingSystem);

//// initialize variables
var compiledEntries = [];
var compiledEntriesFileWriteStream;

//// start process
var sourceFilePathArray = sourceFilePath.split(constants.CHAR_SLASH);
var sourceFileName = sourceFilePathArray[sourceFilePathArray.length - 1];
var sourceFileNameArray = sourceFileName.replace('.txt', constants.EMPTY_STRING).split(constants.CHAR_HYPHEN);
var referenceNum = sourceFileNameArray[sourceFileNameArray.length - 1];
var destinationFileName = sourceFileName.replace(referenceNum, constants.COMPILED);

if (fs.existsSync(sourceFilePath)) {
    // get entries to be added
    var additionalEntries = fs.readFileSync(sourceFilePath).toString().split(os.EOL);

    // get existing entries
    if (fs.existsSync(destinationFileDirectory + destinationFileName)) {
        // compile
        var existingEntries = fs.readFileSync(destinationFileDirectory + destinationFileName).toString().split(os.EOL);
        // there's existing
        existingEntries.forEach(function (entry) {
            if (!genericUtil.isTrimmedEmptyString(entry)) {
                compiledEntries.push(entry);
            }
        });

        additionalEntries.forEach(function (entry) {
            if (!genericUtil.isTrimmedEmptyString(entry)) {
                if (!existingEntries.includes(entry)) {
                    compiledEntries.push(entry);
                }
            }
        });
    } else {
        // there's no existing
        additionalEntries.forEach(function (entry) {
            if (!genericUtil.isTrimmedEmptyString(entry)) {
                compiledEntries.push(entry);
            }
        });
    }
} else {
    console.log("Reference Compiler: No file to process.");
}

// create/overwrite the compiled reference file
compiledEntriesFileWriteStream = fs.createWriteStream(destinationFileDirectory + destinationFileName, {highWaterMark: Math.pow(2,14)});

compiledEntries.forEach(function (entry) {
    compiledEntriesFileWriteStream.write(entry + os.EOL);
});

genericUtil.endFsNodeResource(compiledEntriesFileWriteStream);
