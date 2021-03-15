//// setup default properties
var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;

//// fetch params
var environment = process.argv[2];
var platform = process.argv[3];
var languageId = process.argv[4];

//// setup extended properties
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var environmentProperties = propertiesReader.getEnvironmentProperties(environment);
var systemProperties = propertiesReader.getSystemProperties();

//// setup cm_modules
var fs = require(systemProperties.path().node.fileSystem);
var csv = require(systemProperties.path().node.csvParse);
var os = require(systemProperties.path().node.operatingSystem);

//// setup cm_modules
var constants = require(cmModulesPath + systemProperties.path().catman.constants);
var genericUtil = require(cmModulesPath + systemProperties.path().catman.genericUtilities);
var dataHelper = require(cmModulesPath + systemProperties.path().catman.dataHelper);
var lookupsBuilder = require(cmModulesPath + systemProperties.path().catman.lookupsBuilder).setEnvironmentProperties(environment);

// setup variables
var fullEmrExportWrkspcPath = environmentProperties.path().catman.rootDirectory 
    + systemProperties.path().catman.workspaceFullEmrExport;
var exportPath = fullEmrExportWrkspcPath + systemProperties.path().catman.wrkspcExport;
var processingPath = fullEmrExportWrkspcPath + systemProperties.path().catman.wrkspcProcessing;

var dataExtractFilePath = fullEmrExportWrkspcPath + platform 
    + languageId + '-full-export-base.csv';
var baseFieldsHeadersMap = dataHelper.getFullEMRExportBaseFieldHeadersMap(constants.SYSTEM_PLATFORM_CATMAN);
var specialAttrHeaders;
var othersAttrHeaders;
var specialAttributesData;
var othersAttributesData;
var specialAttrBatchFileCtr = 0;
var othersAttrBatchFileCtr = 0;

var fileReadStream;
var fileWriteStream;
var csvConfig = csv(dataHelper.getDefaultCsvConfig());

var batchLimit = 20000;
var batchCounter = 0;
var batchNum = 1;

// get special attr headers
var anyBatchSpecialAttrDataFileString = fs.readFileSync(processingPath + dataHelper.getLocaleName(languageId) 
    + constants.CHAR_SLASH + platform + '-attributes-SPECIAL-1.csv').toString();
specialAttrHeaders = anyBatchSpecialAttrDataFileString.split('\n')[0].replace("Code,", constants.EMPTY_STRING);

// get others attr headers
var anyBatchOthersAttrDataFileString = fs.readFileSync(processingPath + dataHelper.getLocaleName(languageId) 
    + constants.CHAR_SLASH + platform + '-attributes-OTHERS-1.csv').toString();
othersAttrHeaders = anyBatchOthersAttrDataFileString.split('\n')[0].replace("Code,", constants.EMPTY_STRING);

// start processing
fileReadStream = fs.createReadStream(dataExtractFilePath);

fileReadStream.pipe(csvConfig)
    .on(constants.NODE_KEY_DATA, function(data) {
        // pause stream
        fileReadStream.pause();

        var partNumber = data['PARTNUMBER'];

        if (batchCounter == 0) {
            createBatchedFile(batchNum);
        }

        // setup needed special attribute data
        if (genericUtil.isUndefined(specialAttributesData)) {
            specialAttrBatchFileCtr++;
            specialAttributesData = lookupsBuilder.getFullEMRExportSpecialAttributesLookup(processingPath 
                + dataHelper.getLocaleName(languageId) + constants.CHAR_SLASH + platform 
                + '-attributes-SPECIAL-' + specialAttrBatchFileCtr + '.csv');
        }

        // setup needed others attribute data
        if (genericUtil.isUndefined(othersAttributesData)) {
            othersAttrBatchFileCtr++;
            othersAttributesData = lookupsBuilder.getFullEMRExportOthersAttributesLookup(processingPath 
                + dataHelper.getLocaleName(languageId) + constants.CHAR_SLASH + platform 
                + '-attributes-OTHERS-' + othersAttrBatchFileCtr + '.csv');
        }

        // write base fields
        for (var catmanHeader in baseFieldsHeadersMap) {
            var commerceHeader = baseFieldsHeadersMap[catmanHeader];
            fileWriteStream.write(genericUtil.formatAsCsvCellEntry(data[commerceHeader]) + constants.DEFAULT_DELIMITER);
        }

        // others attribute in base extract
        var country = data['EMRCOUNTRY'];
        var tabSequence = data['EMRTABSEQUENCE'];

        // write special attrs
        var specialAttrHeadersArray = specialAttrHeaders.split(constants.DEFAULT_DELIMITER);
        var catEntSpecialAttributes = specialAttributesData[partNumber];
        
        if (!genericUtil.isUndefined(catEntSpecialAttributes)) {
            specialAttrHeadersArray.forEach(function (eachSpecialAttrHeader) {
                eachSpecialAttrHeader = eachSpecialAttrHeader.trim();
                fileWriteStream.write(genericUtil.formatAsCsvCellEntry(catEntSpecialAttributes[eachSpecialAttrHeader]) 
                    + constants.DEFAULT_DELIMITER);
            });

            if (catEntSpecialAttributes['isLastEntry']) {
                specialAttributesData = undefined;
            }
        } else {
            specialAttrHeadersArray.forEach(function (eachSpecialAttrHeader) {
                fileWriteStream.write(constants.DEFAULT_DELIMITER);
            });
        }

        // write others attrs
        var othersAttrHeadersArray = othersAttrHeaders.split(constants.DEFAULT_DELIMITER);
        var catEntOthersAttributes = othersAttributesData[partNumber];
        var counter = 0;

        if (!genericUtil.isUndefined(catEntOthersAttributes)) {
            othersAttrHeadersArray.forEach(function (eachOthersAttrHeader) {
                eachOthersAttrHeader = eachOthersAttrHeader.trim();

                if (eachOthersAttrHeader == 'Country') {
                    fileWriteStream.write(country);
                } else if (eachOthersAttrHeader == 'TabSequence') {
                    fileWriteStream.write(tabSequence);
                } else {
                    fileWriteStream.write(genericUtil.formatAsCsvCellEntry(catEntOthersAttributes[eachOthersAttrHeader]));
                }
                
                counter++;

                if (counter < othersAttrHeadersArray.length) {
                    fileWriteStream.write(constants.DEFAULT_DELIMITER);
                }
            });

            if (catEntOthersAttributes['isLastEntry']) {
                othersAttributesData = undefined;
            }
        } else {
            othersAttrHeadersArray.forEach(function (eachOthersAttrHeader) {
                // Special handling for EMR Locale
                if (eachOthersAttrHeader == 'Locale') {
                    fileWriteStream.write(dataHelper.getLocaleName(languageId));
                }

                counter++;

                if (counter < othersAttrHeadersArray.length) {
                    fileWriteStream.write(constants.DEFAULT_DELIMITER);
                }
            });
        }

        //TBD
        fileWriteStream.write(os.EOL);

        batchCounter++;
        if (batchCounter == batchLimit) {
            batchCounter = 0;
            fileWriteStream.end();
            batchNum++;
        }

        // resume stream on the next i/o operation
        process.nextTick(function() {
            fileReadStream.resume();
        });
    }).on(constants.NODE_KEY_END, function() {
        fileReadStream.close();
        fileWriteStream.end();
    }).on(constants.NODE_KEY_ERROR, function(errorMessage) {
        console.log('Error in reading file:');
        console.log(errorMessage);
        fileReadStream.close();
        fileWriteStream.end();
    });

// create batched file
var createBatchedFile = function(batchNum) {
    var completeHeaders = constants.EMPTY_STRING;
    // create csv file
    fileWriteStream = fs.createWriteStream(exportPath + platform + constants.CHAR_HYPHEN 
        + dataHelper.getLocaleName(languageId) + '-Page' + batchNum + '-Export.csv', 
        {highWaterMark: Math.pow(2,14)});
    
    for (var catmanHeader in baseFieldsHeadersMap) {
        completeHeaders = completeHeaders + catmanHeader + constants.DEFAULT_DELIMITER;
    }

    completeHeaders = completeHeaders + specialAttrHeaders.trim() + constants.DEFAULT_DELIMITER;
    completeHeaders = completeHeaders + othersAttrHeaders.trim();

    fileWriteStream.write(completeHeaders + os.EOL);
}
