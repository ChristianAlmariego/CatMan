//// setup default properties
var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;

//// fetch params
var env = process.argv[2];
var inputFileName = process.argv[3];
var inputFileLocation = process.argv[4];
var systemTmpDir = process.argv[5];

//// setup extended properties
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var applicationProperties = propertiesReader.getApplicationProperties();
var systemProperties = propertiesReader.getSystemProperties();
var messagesProperties = propertiesReader.getMessagesProperties();
var environmentProperties = propertiesReader.getEnvironmentProperties(env);

//// setup cm_modules
var constants = require(cmModulesPath + systemProperties.path().catman.constants);
var genericUtil = require(cmModulesPath + systemProperties.path().catman.genericUtilities);
var dataHelper = require(cmModulesPath + systemProperties.path().catman.dataHelper);

//// setup node modules
var fs = require(systemProperties.path().node.fileSystem);
var os = require(systemProperties.path().node.operatingSystem);
var readline = require(systemProperties.path().node.readLine);
var csv = require(systemProperties.path().node.csvParse);
var csvsync = require(systemProperties.path().node.csvParseSync);

//// initialize variables
var unsupportedEOL = '\r';
var supportedEOL = '\n';
var fileReadStream;
var fileWriteStream;
var csvConfig;

// start processing
// move file to system tmp dir
genericUtil.moveFile(inputFileName, fs, inputFileLocation, systemTmpDir);

// read and write streams
fileReadStream = fs.createReadStream(systemTmpDir + inputFileName);
fileWriteStream = fs.createWriteStream(inputFileLocation + inputFileName, {highWaterMark: Math.pow(2,14)});

//TBD - using csv-parse (save the codes for now)
csvConfig = csv({endLine : unsupportedEOL});

fileReadStream.pipe(csvConfig)
    .on(constants.NODE_KEY_DATA, function(data) {
        fileReadStream.pause();

        var dataCtr = 0;

        for (var key in data) {
            fileWriteStream.write(genericUtil.formatAsCsvCellEntry(data[key]));
            dataCtr++;

            if (data.length > dataCtr) {
                fileWriteStream.write(constants.DEFAULT_DELIMITER);
            }
        }

        fileWriteStream.write(supportedEOL);

        process.nextTick(function(){
            fileReadStream.resume();
        });
    }).on(constants.NODE_KEY_END, function() {
        fileWriteStream.end();
    }).on(constants.NODE_KEY_ERROR, function(errorMessage) {
        console.error(messagesProperties.path().error.cmmodule.eolConverter 
            + messagesProperties.path().error.file.readingInputFile 
            + error.cmmodule.eolConverter + os.EOL
            + errorMessage);
        fileWriteStream.end();
    });