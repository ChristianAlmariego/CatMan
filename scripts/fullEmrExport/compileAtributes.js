//// setup default properties
var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;

//// fetch params
var environment = process.argv[2];
var platform = process.argv[3];
var languageId = process.argv[4];
var type = process.argv[5];


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

// directories
var fullEmrExportWrkspcPath = environmentProperties.path().catman.rootDirectory 
    + systemProperties.path().catman.workspaceFullEmrExport;
var processingPath = fullEmrExportWrkspcPath + systemProperties.path().catman.wrkspcProcessing;

//TMP
var dataExtractFilePath = fullEmrExportWrkspcPath + platform 
    + languageId + '-full-export-attr-' 
    + type.toLowerCase() + '.csv';

// fs.createReadStream(dataExtractFilePath)
//     .pipe(es.split())
//         .pipe(es.mapSync(function(line) {
//             console.log(line);
//         }))
//         .on('error', function(err) {
//             console.log('Error while reading csv file.', err);
//         })
//         .on('end', function() {
//             console.log('end');
//         })

// read stream
var fileReadStream = fs.createReadStream(dataExtractFilePath);
var fileWriteStream;
var csvConfig = csv(dataHelper.getDefaultCsvConfig());

var batchLimit = 500;
var batchCounter = 0;
var batchNum = 1;
var partNumber;
var attributesArray = {};

var featuresMapKey = 'Features';
var ctasMapKey = 'CallToActions';
var ubeltsMapKey = 'UtilityBelts';
var maxFeatures = 12;
var maxCtas = 7;
var maxUBelts = 10;

// populate attribute maps
var attrDictionaryLookup = lookupsBuilder.getAttributeDictionaryLookup();
var attributeGroups = dataHelper.getFullEMRExportAttributesGroupings(attrDictionaryLookup);

// start processing
fileReadStream.pipe(csvConfig)
    .on(constants.NODE_KEY_DATA, function(data) {
        // pause stream
        fileReadStream.pause();
        var attrIdentifier = data['ATTRIBUTE_IDENTIFIER'];
        var attrValue = data['VALUE'];

        if (!genericUtil.isUndefined(partNumber)) {
            if (partNumber != data['PARTNUMBER']) {
                if (batchCounter == 0) {
                    createBatchedFile(batchNum);
                }

                if (type == 'SPECIAL') {
                    processSpecialAttributes(partNumber, attributesArray); //TBD
                    batchCounter++;
                } else {
                    // Special handling for EMR Locale
                    if (genericUtil.isUndefined(attributesArray['EMR Locale'])) {
                        attributesArray['EMR Locale'] = dataHelper.getLocaleName(languageId);
                    }

                    processNormalAttributes(partNumber, attributesArray);
                    batchCounter++;
                }

                if (batchCounter == batchLimit) {
                    batchCounter = 0;
                    batchNum++;
                }

                attributesArray = {};
                partNumber = data['PARTNUMBER'];
            }
        } else {
            partNumber = data['PARTNUMBER'];
        }

        if (type == 'SPECIAL') {
            // special way of populating the attribute array
            if (attrIdentifier.includes('Utility Belt_')) {
                var sequence = data['CATENTRYATTRSEQUENCE']; //TBD
                var sequenceParts = sequence.split(constants.CHAR_DOT);
                var wholeNumSeq = parseInt(sequenceParts[0]);

                if (genericUtil.isUndefined(attributesArray[ubeltsMapKey])) {
                    attributesArray[ubeltsMapKey] = [];
                }

                if (genericUtil.isUndefined(attributesArray[ubeltsMapKey][wholeNumSeq])) {
                    attributesArray[ubeltsMapKey][wholeNumSeq] = {
                        text: constants.EMPTY_STRING,
                        url: constants.EMPTY_STRING,
                        tag: constants.EMPTY_STRING
                    };
                }

                if (sequence.includes(constants.CHAR_DOT)) {
                    if (sequenceParts[1].includes('1')) {
                        attributesArray[ubeltsMapKey][wholeNumSeq].url = attrValue;
                    } else {
                        attributesArray[ubeltsMapKey][wholeNumSeq].tag = attrValue;
                    }
                } else {
                    attributesArray[ubeltsMapKey][wholeNumSeq].text = attrValue;
                }
            } else if (attrIdentifier.includes('CTA')) {
                var sequence = data['CATENTRYATTRSEQUENCE']; //TBD
                var ctaName;

                if (genericUtil.isUndefined(attributesArray[ctasMapKey])) {
                    attributesArray[ctasMapKey] = [];
                }

                ctaName = attrIdentifier.replace("EMR ", constants.EMPTY_STRING).replace(" CTA", constants.EMPTY_STRING);

                attributesArray[ctasMapKey][parseInt(sequence)] = {
                    name: ctaName,
                    url: attrValue
                };
            } else if (attrIdentifier == 'EMR Features') {
                var sequence = data['CATENTRYATTRSEQUENCE']; //TBD
                var sequenceParts = sequence.split(constants.CHAR_DOT);

                if (genericUtil.isUndefined(attributesArray[featuresMapKey])) {
                    attributesArray[featuresMapKey] = [];
                }

                if (sequence.includes(constants.CHAR_DOT)) {
                    var position = dataHelper.getSequencingIndex(sequenceParts[1]);
                    attributesArray[featuresMapKey][position] = attrValue;
                } else {
                    attributesArray[featuresMapKey][0] = attrValue;
                }
            } else {
                attributesArray[attrIdentifier] = attrValue;
            }
        } else { 
            // Special handling for EMR Locale
            if (attrIdentifier == 'EMR Locale') {
                if (genericUtil.isUndefined(attributesArray[attrIdentifier])) {
                    attributesArray[attrIdentifier] = dataHelper.getLocaleName(languageId);
                }
            } else {
                if (genericUtil.isUndefined(attributesArray[attrIdentifier])) {
                    attributesArray[attrIdentifier] = attrValue;
                } else {
                    attributesArray[attrIdentifier] = attributesArray[attrIdentifier] + constants.CHAR_PIPE + attrValue;
                }
            }
        }

        // resume stream on the next i/o operation
        process.nextTick(function() {
            fileReadStream.resume();
        });
    }).on(constants.NODE_KEY_END, function() {
        // write last data
        if (!genericUtil.isUndefined(fileWriteStream)) {
            if (type == 'SPECIAL') {
                processSpecialAttributes(partNumber, attributesArray);
            } else {
                processNormalAttributes(partNumber, attributesArray);
            }
        } else {
            createBatchedFile(batchNum);
        }

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
    // create csv file
    fileWriteStream = fs.createWriteStream(processingPath + dataHelper.getLocaleName(languageId) + constants.CHAR_SLASH 
        + platform + '-attributes-' + type + '-' + batchNum + '.csv', {highWaterMark: Math.pow(2,14)});
    
    // add headers
    if (type == 'SPECIAL') {
        var counter = 0;
        var header;

        // write special attrs headers
        fileWriteStream.write(constants.CSV_HEADER_CODE + constants.DEFAULT_DELIMITER);

        // features
        for (var i = 1; i <= maxFeatures; i++) {
            fileWriteStream.write("Feature " + i + constants.DEFAULT_DELIMITER);
        }

        // CallToActions
        for (var i = 1; i <= maxCtas; i++) {
            fileWriteStream.write("CallToAction " + i + " Name" + constants.DEFAULT_DELIMITER);
            fileWriteStream.write("CallToAction " + i + " URL" + constants.DEFAULT_DELIMITER);
        }

        // Utility Belts
        for (var i = 1; i <= maxUBelts; i++) {
            fileWriteStream.write("Utility Belt " + i + " Tag" + constants.DEFAULT_DELIMITER);
            fileWriteStream.write("Utility Belt " + i + " Text" + constants.DEFAULT_DELIMITER);
            fileWriteStream.write("Utility Belt " + i + " URL" + constants.DEFAULT_DELIMITER);
        }

        // additional
        attributeGroups.additionalSpecialAttributes.forEach(function (eachAttrId) {
            counter++;
            header = attrDictionaryLookup[eachAttrId].HeaderName;
            fileWriteStream.write(header);

            if (counter < attributeGroups.additionalSpecialAttributes.length) {
                fileWriteStream.write(constants.DEFAULT_DELIMITER);
            }
        });

        fileWriteStream.write(os.EOL);
    } else {
        // write other attrs headers
        var counter = 0;
        var header;

        fileWriteStream.write(constants.CSV_HEADER_CODE + constants.DEFAULT_DELIMITER);

        attributeGroups.otherAttributes.forEach(function (eachAttrId) {
            counter++;
            header = attrDictionaryLookup[eachAttrId].HeaderName;
            fileWriteStream.write(header);

            if (counter < attributeGroups.otherAttributes.length) {
                fileWriteStream.write(constants.DEFAULT_DELIMITER);
            }
        });

        fileWriteStream.write(os.EOL);
    }
}

// print normal attrs
var processNormalAttributes = function(partNumber, attributesArray) {
    var counter = 0;
    fileWriteStream.write(genericUtil.formatAsCsvCellEntry(partNumber));
    fileWriteStream.write(constants.DEFAULT_DELIMITER);

    attributeGroups.otherAttributes.forEach(function (eachAttrId) {
        var attrValue = attributesArray[eachAttrId];
        counter++;
        
        if (!genericUtil.isUndefined(attrValue)) {
            attrValue = genericUtil.formatAsCsvCellEntry(attrValue);
            fileWriteStream.write(attrValue);
        }

        if (counter < attributeGroups.otherAttributes.length) {
            fileWriteStream.write(constants.DEFAULT_DELIMITER);
        }
    });

    fileWriteStream.write(os.EOL);
}

// print special attrs
var processSpecialAttributes = function(partNumber, attributesArray) {
    var counter = 0;
    fileWriteStream.write(genericUtil.formatAsCsvCellEntry(partNumber));
    fileWriteStream.write(constants.DEFAULT_DELIMITER);

    // features
    for (var i = 0; i < maxFeatures; i++) {
        if (!genericUtil.isUndefined(attributesArray[featuresMapKey])) {
            if (!genericUtil.isUndefined(attributesArray[featuresMapKey][i])) {
                fileWriteStream.write(genericUtil.formatAsCsvCellEntry(attributesArray[featuresMapKey][i]));
            }
        }
        fileWriteStream.write(constants.DEFAULT_DELIMITER);
    }

    // CallToActions
    for (var i = 0; i < maxCtas; i++) {
        if (!genericUtil.isUndefined(attributesArray[ctasMapKey])) {
            if (!genericUtil.isUndefined(attributesArray[ctasMapKey][i])) {
                fileWriteStream.write(attributesArray[ctasMapKey][i].name 
                    + constants.DEFAULT_DELIMITER 
                    + genericUtil.formatAsCsvCellEntry(attributesArray[ctasMapKey][i].url));
            } else {
                fileWriteStream.write(constants.DEFAULT_DELIMITER);
            }
            fileWriteStream.write(constants.DEFAULT_DELIMITER);
        } else {
            fileWriteStream.write(constants.DEFAULT_DELIMITER + constants.DEFAULT_DELIMITER);
        }
    }

    // Utility Belts
    for (var i = 0; i < maxUBelts; i++) {
        if (!genericUtil.isUndefined(attributesArray[ubeltsMapKey])) {
            if (!genericUtil.isUndefined(attributesArray[ubeltsMapKey][i])) {
                fileWriteStream.write(attributesArray[ubeltsMapKey][i].tag 
                    + constants.DEFAULT_DELIMITER 
                    + genericUtil.formatAsCsvCellEntry(attributesArray[ubeltsMapKey][i].text) 
                    + constants.DEFAULT_DELIMITER 
                    + genericUtil.formatAsCsvCellEntry(attributesArray[ubeltsMapKey][i].url));
            } else {
                fileWriteStream.write(constants.DEFAULT_DELIMITER + constants.DEFAULT_DELIMITER);
            }
            fileWriteStream.write(constants.DEFAULT_DELIMITER);
        } else {
            fileWriteStream.write(constants.DEFAULT_DELIMITER + constants.DEFAULT_DELIMITER + constants.DEFAULT_DELIMITER);
        }
    }

    // additional
    attributeGroups.additionalSpecialAttributes.forEach(function (eachAttrId) {
        var attrValue = attributesArray[eachAttrId];
        counter++;
        
        if (!genericUtil.isUndefined(attrValue)) {
            attrValue = genericUtil.formatAsCsvCellEntry(attrValue);
            fileWriteStream.write(attrValue);
        }

        if (counter < attributeGroups.additionalSpecialAttributes.length) {
            fileWriteStream.write(constants.DEFAULT_DELIMITER);
        }
    });

    fileWriteStream.write(os.EOL);
}
