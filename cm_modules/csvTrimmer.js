//// setup default properties
var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;

//// fetch params
var referenceCode = process.argv[2];
var inputCsvFileNamePath = process.argv[3];
var outputLocation = process.argv[4];
var retainedHeaders = process.argv[5];

//TBD - exclude this for now
//var headersRowCount = parseInt(process.argv[6]);
//var columnNamesHeaderRowNum = parseInt(process.argv[7]);

//// setup extended properties
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var applicationProperties = propertiesReader.getApplicationProperties();
var systemProperties = propertiesReader.getSystemProperties();
var messagesProperties = propertiesReader.getMessagesProperties();

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
var fileReadStream;
var lineReader;
var fileWriteStream;
var csvConfig;
var outputCsvFileName;
var inputCsvFileName;
var filePathArray;
var columnsHeaders;
var newColumnsHeaders;

//// local variables
var recordCount = 0;

//// start process
newColumnsHeaders = retainedHeaders.split(constants.DEFAULT_DELIMITER);

// write stream
filePathArray = inputCsvFileNamePath.split(constants.CHAR_SLASH);
inputCsvFileName = filePathArray[filePathArray.length - 1];
outputCsvFileName = applicationProperties.path().file.name.csvTrimmed 
    + constants.CHAR_HYPHEN + referenceCode 
    + constants.CHAR_HYPHEN + inputCsvFileName;
fileWriteStream = fs.createWriteStream(outputLocation + outputCsvFileName, {highWaterMark: Math.pow(2,14)});

// read stream
fileReadStream = fs.createReadStream(inputCsvFileNamePath);

//TBD - using csv-parse (save the codes for now)
fileWriteStream.write(retainedHeaders + os.EOL);
csvConfig = csv(dataHelper.getDefaultCsvConfig());
fileReadStream.pipe(csvConfig)
    .on(constants.NODE_KEY_DATA, function(data) {
        fileReadStream.pause();

        var cellData;
        var parsedCellDataCtr = 0;
        var newColumnsCount = newColumnsHeaders.length;

        newColumnsHeaders.forEach(function (eachColumnHeader) {
            cellData = data[eachColumnHeader];

            if (!genericUtil.isUndefined(cellData)) {
                fileWriteStream.write(genericUtil.formatAsCsvCellEntry(cellData));
            }

            parsedCellDataCtr++;

            if (parsedCellDataCtr < newColumnsCount) {
                fileWriteStream.write(constants.DEFAULT_DELIMITER);
            }
        });

        fileWriteStream.write(os.EOL);

        process.nextTick(function(){
            fileReadStream.resume();
        });
    }).on(constants.NODE_KEY_END, function() {
        fileWriteStream.end();
    }).on(constants.NODE_KEY_ERROR, function(errorMessage) {
        console.error(messagesProperties.path().error.cmmodule.csvTrimmer 
            + messagesProperties.path().error.file.readingInputFile 
            + inputCsvFileName + constants.CHAR_CR
            + errorMessage);
        fileWriteStream.end();
    });

// problem when using this node module is that it has issues when csv files has cells with carriage returns
//TBD - using csv-parse/lib/sync - (save the codes for now)
// lineReader = readline.createInterface({ input: fileReadStream });
// lineReader.on(constants.NODE_KEY_LINE, (line) => {
//     var parsedRowData;
//     recordCount++;
    
//     if (recordCount > headersRowCount) {
//         var cellData;
//         var parsedCellDataCtr = 0;
//         var newColumnsCount = newColumnsHeaders.length;
//         parsedRowData = csvsync(line, csvConfig);

//         newColumnsHeaders.forEach(function (eachColumnHeader) {
//             cellData = parsedRowData[0][eachColumnHeader];

//             if (!genericUtil.isUndefined(cellData)) {
//                 fileWriteStream.write(genericUtil.formatAsCsvCellEntry(cellData));
//             }

//             parsedCellDataCtr++;

//             if (parsedCellDataCtr < newColumnsCount) {
//                 fileWriteStream.write(constants.DEFAULT_DELIMITER);
//             }
//         });

//         fileWriteStream.write(os.EOL);
//     } else {
//         if (recordCount == columnNamesHeaderRowNum) {
//             columnsHeaders = line.split(constants.DEFAULT_DELIMITER);
//             csvConfig = dataHelper.getModifiedCsvConfig(columnsHeaders, constants.CHAR_QUOTE, constants.CHAR_QUOTE);
//             fileWriteStream.write(retainedHeaders + os.EOL);
//         } else {
//             fileWriteStream.write(line + os.EOL);
//         }
//     }
// }).on(constants.NODE_KEY_CLOSE, () => {
// 	fileWriteStream.end();
// });
