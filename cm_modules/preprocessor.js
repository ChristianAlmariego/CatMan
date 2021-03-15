//// setup default properties
var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;

//// fetch params
var environment = process.argv[2];
var processCode = process.argv[3];
var buildReference = process.argv[4];

//// setup extended properties
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var applicationProperties = propertiesReader.getApplicationProperties();
var environmentProperties = propertiesReader.getEnvironmentProperties(environment);
var systemProperties = propertiesReader.getSystemProperties();

//// setup cm_modules
var constants = require(cmModulesPath + systemProperties.path().catman.constants);
var genericUtil = require(cmModulesPath + systemProperties.path().catman.genericUtilities);
var dataHelper = require(cmModulesPath + systemProperties.path().catman.dataHelper);
var lookupsBuilder = require(cmModulesPath + systemProperties.path().catman.lookupsBuilder).setEnvironmentProperties(environment);
var recordValidator = require(cmModulesPath + systemProperties.path().catman.recordValidator);
var mailer = require(cmModulesPath + systemProperties.path().catman.email);

//// setup node modules
var fs = require(systemProperties.path().node.fileSystem);
var os = require(systemProperties.path().node.operatingSystem);
var csvsync = require(systemProperties.path().node.csvParseSync);

//// initialize variables
var queueLocation;
var workspaceDirectory;
var resourcesDir;
var requestsFilePath;
var errorProcessingDirectory;
//TBD: for cleanup
var resourceFileName;

//// local variables
var dataExtractMap = [];
var batchCtr = 0;
var batchExtractLimit = 300;
var attrUsageUpdates = [];
var masterCategoryUpdatesMap = {};

var trimmedCsvLocation;
var trimmedCsvFileNamePrefix;
var initialTransformRequests;

//// start process
//TBD: code refactoring - deprecate transform specific get requests
resourceFileName = applicationProperties.path().file.name.validRequests 
    + constants.CHAR_HYPHEN + buildReference + constants.FILE_EXT_TXT;
initialTransformRequests = lookupsBuilder.getTransformRequestsLookup(resourceFileName);

switch (processCode) {
    case applicationProperties.path().catman.productTransform:
        queueLocation = environmentProperties.path().catman.baseSharedDirectory 
            + systemProperties.path().catman.workspaceDefault;
        workspaceDirectory = environmentProperties.path().catman.rootDirectory 
            + systemProperties.path().catman.workspaceDefault;
        resourcesDir = workspaceDirectory + systemProperties.path().catman.wrkspcResource;
        errorProcessingDirectory = queueLocation + systemProperties.path().catman.wrkspcErrorProcessing;
        trimmedCsvLocation = resourcesDir + systemProperties.path().catman.wrkspctmp;
        trimmedCsvFileNamePrefix = applicationProperties.path().file.name.csvTrimmed
            + constants.CHAR_HYPHEN + buildReference + constants.CHAR_HYPHEN;
        preprocessProductTransform();
        break;
    case applicationProperties.path().catman.extractProductForTranslation:
        // TBD
        break;
    case applicationProperties.path().catman.extractProductForPublish:
        // TBD
        break;
    case applicationProperties.path().catman.manageAttributes:
        queueLocation = environmentProperties.path().catman.baseSharedDirectory 
            + systemProperties.path().catman.requestsDirectory 
            + systemProperties.path().catman.workspaceAttributesAndAttrValues;
        workspaceDirectory = environmentProperties.path().catman.rootDirectory 
            + systemProperties.path().catman.requestsDirectory 
            + systemProperties.path().catman.workspaceAttributesAndAttrValues;
        resourcesDir = workspaceDirectory + systemProperties.path().catman.wrkspcResource;
        requestsFilePath = resourcesDir + applicationProperties.path().file.name.validRequests 
            + constants.CHAR_HYPHEN + buildReference + constants.FILE_EXT_TXT;
        preprocessManageAttributes();
        break;
    case applicationProperties.path().catman.manageCategory:
        queueLocation = environmentProperties.path().catman.baseSharedDirectory 
            + systemProperties.path().catman.requestsDirectory 
            + systemProperties.path().catman.workspaceCategories;
        workspaceDirectory = environmentProperties.path().catman.rootDirectory 
            + systemProperties.path().catman.requestsDirectory 
            + systemProperties.path().catman.workspaceCategories;
        resourcesDir = workspaceDirectory + systemProperties.path().catman.wrkspcResource;
        requestsFilePath = resourcesDir + applicationProperties.path().file.name.validRequests 
            + constants.CHAR_HYPHEN + buildReference + constants.FILE_EXT_TXT;
        preprocessManageCategory();
        break;
    default:
        // do nothing
}

//// methods
function preprocessProductTransform() {
    initialTransformRequests.forEach(function (transformRequest) {
        var controlFileName = transformRequest[0];
        var catalogFileName = transformRequest[1];
        var contactEmails = transformRequest[2];
        var contactNames = transformRequest[3];
        var runRequest = transformRequest[4];

        if (runRequest == applicationProperties.path().transform.runrequestcode.catentryFullReplace) {
            retrieveListForDataExtraction(catalogFileName);
            retrieveMasterCategoryUpdates(controlFileName, catalogFileName);
        }
    });

    processMasterCategoryUpdatesConflicts();
    createDataExtractionCtrlFile();
}

function preprocessManageAttributes() {
    var manageAttrRequests = lookupsBuilder.getRequestsLookup(requestsFilePath);

    manageAttrRequests.forEach(function (eachRequest) {
        var catalogFileName = eachRequest[1];
        var runRequest = eachRequest[4];

        if (runRequest == applicationProperties.path().manageattr.runrequestcode.attrSettingsChange) {
            retrieveListForAttrUsageUpdate(queueLocation + catalogFileName);
        }
    });
}

function preprocessManageCategory() {
    var manageCategoryRequests = lookupsBuilder.getRequestsLookup(requestsFilePath);

    manageCategoryRequests.forEach(function (eachRequest) {
        var catalogFileName = eachRequest[1];
        var runRequest = eachRequest[4];

        if (runRequest == applicationProperties.path().managecategory.runrequestcode.categoryUpdate) {
            
        }
    });
}

//// Supporting functions
// Manage Attribute preprocessing
function retrieveListForAttrUsageUpdate(catalogFilePath) {
    var rowDataArray = csvsync(fs.readFileSync(catalogFilePath).toString(), {
        delimiter: constants.DEFAULT_DELIMITER,
        columns: true
    });

    rowDataArray.forEach(function (rowData) {
        var validation = recordValidator.validateRowDataForAttrSettingsChange(rowData, lookupsBuilder);
        var attrIdentifier = rowData[constants.CSV_HEADER_ATTRIDENTIFIER];
        var attrUsageUpdateExists = false;

        if (validation.isValid) {
            var attrDictionaryLookup = lookupsBuilder.getAttributeDictionaryLookup();
            var attrLookupEntry = attrDictionaryLookup[attrIdentifier];

            if (!genericUtil.isUndefined(attrLookupEntry)) {
                var currentDatatype = attrDictionaryLookup[attrIdentifier].LkupType;
                var requestDatatype = rowData[constants.CSV_HEADER_DATATYPE];
                var attrType;

                if (!genericUtil.isUndefined(requestDatatype) && !genericUtil.isTrimmedEmptyString(requestDatatype)) {
                    if (requestDatatype == 'Lookup Table' || requestDatatype == 'String Enumeration') {
                        if (currentDatatype == constants.EMPTY_STRING) {
                            attrUsageUpdateExists = true;
    
                            if (requestDatatype == 'Lookup Table') {
                                attrType = dataHelper.getAttrType(constants.LOOKUPREF_LOOKUPTYPE_TABLE);
                            } else {
                                attrType = dataHelper.getAttrType(constants.LOOKUPREF_LOOKUPTYPE_ENUM);
                            }
                        }
                    } else {
                        if (currentDatatype == constants.LOOKUPREF_LOOKUPTYPE_TABLE 
                            || currentDatatype == constants.LOOKUPREF_LOOKUPTYPE_ENUM) {
                            attrUsageUpdateExists = true;
                            attrType = dataHelper.getAttrType(constants.EMPTY_STRING);
                        }
                    }
                }

                if (attrUsageUpdateExists) {
                    attrUsageUpdates.push([attrIdentifier, attrType]);
                }
            }
        }
    });

    if (attrUsageUpdates.length > 0) {
        createAttrUsageUpdateCtrlFile();
    }
}

// Product Transform preprocessing
function retrieveListForDataExtraction(catalogFileName) {
    var fileNamePath = trimmedCsvLocation + trimmedCsvFileNamePrefix + catalogFileName;
    var validLocales = applicationProperties.path().catman.validLocales;
    var masterPartNumbers = lookupsBuilder.getMasterPartNumsLookup();

    var rawDataArray = csvsync(fs.readFileSync(fileNamePath).toString(), {
        delimiter: constants.DEFAULT_DELIMITER,
        columns: true
    });

    rawDataArray.forEach(function (eachRawData) {
        var dataLocaleName = eachRawData[constants.CSV_HEADER_LOCALE];

        if (!genericUtil.isUndefined(dataLocaleName)) {
            dataLocaleName = dataLocaleName.trim();

            if (dataLocaleName == constants.DEFAULT_LOCALE_NAME || validLocales.includes(dataLocaleName)) {
                var partNumber = dataHelper.getPartNumber(eachRawData[constants.CSV_HEADER_CODE], 
                    eachRawData[constants.CSV_HEADER_CATENTRY_TYPE], 
                    eachRawData[constants.CSV_HEADER_MFTR_PART_NUM], 
                    eachRawData[constants.CSV_HEADER_MFTR]);

                // include partnumber for extraction only if the partnumber is already existing
                if (!genericUtil.isUndefined(partNumber) && masterPartNumbers.includes(partNumber)) {
                    if (genericUtil.isUndefined(dataExtractMap[dataLocaleName])) {
                        dataExtractMap[dataLocaleName] = [];
                        batchCtr = 0;
                        dataExtractMap[dataLocaleName][batchCtr] = [partNumber];
                    } else {
                        batchCtr = dataExtractMap[dataLocaleName].length - 1;
                        
                        if (dataExtractMap[dataLocaleName][batchCtr].length < batchExtractLimit) {
                            var isRecorded = false;
                            dataExtractMap[dataLocaleName].forEach(function (eachBatchPerLocale) {
                                if (eachBatchPerLocale.includes(partNumber)) {
                                    isRecorded = true;
                                }
                            });
                            if (!isRecorded) {
                                dataExtractMap[dataLocaleName][batchCtr].push(partNumber);
                            }
                        } else {
                            batchCtr = batchCtr + 1;
                            dataExtractMap[dataLocaleName][batchCtr] = [partNumber];
                        }
                    }
                }
            }
        }
    });
}

// Populate map for all master category updates
function retrieveMasterCategoryUpdates(controlFileName, catalogFileName) {
    var catalogFileNamePath = trimmedCsvLocation + trimmedCsvFileNamePrefix + catalogFileName;

    var rawDataArray = csvsync(fs.readFileSync(catalogFileNamePath).toString(), {
        delimiter: constants.DEFAULT_DELIMITER,
        columns: true
    });

    rawDataArray.forEach(function (eachRawData) {
        var dataMasterCategory = eachRawData[constants.CSV_HEADER_FULLPATH];

        if (!genericUtil.isUndefined(dataMasterCategory) && !genericUtil.isTrimmedEmptyString(dataMasterCategory)) {
            var partNumber = dataHelper.getPartNumber(eachRawData[constants.CSV_HEADER_CODE], 
                eachRawData[constants.CSV_HEADER_CATENTRY_TYPE], 
                eachRawData[constants.CSV_HEADER_MFTR_PART_NUM], 
                eachRawData[constants.CSV_HEADER_MFTR]);
            
            if (genericUtil.isUndefined(masterCategoryUpdatesMap[partNumber])) {
                masterCategoryUpdatesMap[partNumber] = [];
                masterCategoryUpdatesMap[partNumber][dataMasterCategory] = [];
            } else {
                if (genericUtil.isUndefined(masterCategoryUpdatesMap[partNumber][dataMasterCategory])) {
                    masterCategoryUpdatesMap[partNumber][dataMasterCategory] = [];
                }
            }

            masterCategoryUpdatesMap[partNumber][dataMasterCategory].push(controlFileName + constants.CHAR_PIPE + catalogFileName);
        }
    });
}

// Manage Attribute preprocessing
function createAttrUsageUpdateCtrlFile() {
    var attrUsageUpdateCtrllFilePath = resourcesDir + applicationProperties.path().file.name.lookupTypeAttrUpdate 
        + constants.CHAR_HYPHEN + buildReference + constants.FILE_EXT_TXT;
    var attrUsageUpdateFileWriteStream = fs.createWriteStream(attrUsageUpdateCtrllFilePath, {highWaterMark: Math.pow(2,14)});

    attrUsageUpdates.forEach(function (eachUpdate) {
        var attrIdentifier = eachUpdate[0];
        var attrType = eachUpdate[1];
		attrUsageUpdateFileWriteStream.write(attrIdentifier + constants.CHAR_PIPE + attrType + os.EOL);
    });
}

// Product Transform preprocessing
function processMasterCategoryUpdatesConflicts() {
    var masterCategoryConflictingUpdatesMap = [];

    for (var partNumKey in masterCategoryUpdatesMap) {
        if (Object.keys(masterCategoryUpdatesMap[partNumKey]).length > 1) {
            masterCategoryConflictingUpdatesMap[partNumKey] = masterCategoryUpdatesMap[partNumKey];
        }
    }

    if (Object.keys(masterCategoryConflictingUpdatesMap).length > 0) {
        // update transform request reference files
        var newTransformRequestFilePath = environmentProperties.path().catman.rootDirectory
            + systemProperties.path().catman.workspaceDefault
            + systemProperties.path().catman.wrkspcResource
            + resourceFileName;
        var newTransformReqFileWriteStream = fs.createWriteStream(newTransformRequestFilePath, {highWaterMark: Math.pow(2,14)});
        
        initialTransformRequests.forEach(function (transformRequest) {
            var controlFileName = transformRequest[0];
            var catalogFileName = transformRequest[1];
            var contactEmails = transformRequest[2];
            var contactNames = transformRequest[3];
            var runRequest = transformRequest[4];
            var hasConflict = false;
            var partNumWithConflict;
            var conflictingRequestFiles = [];

            for (var partNum in masterCategoryConflictingUpdatesMap) {
                for (var masterCategory in masterCategoryConflictingUpdatesMap[partNum]) {
                    var eachMasterCategoryRefMap = masterCategoryConflictingUpdatesMap[partNum][masterCategory];

                    eachMasterCategoryRefMap.forEach(function (requestFilesPair) {
                        var requestFilePairArray = requestFilesPair.split(constants.CHAR_PIPE);
                        var controlFileNameWithConflict = requestFilePairArray[0];

                        if (controlFileName == controlFileNameWithConflict) {
                            hasConflict = true;
                            partNumWithConflict = partNum;
                        } else {
                            conflictingRequestFiles.push(requestFilesPair);
                        }
                    });
                }
            }

            if (hasConflict) {
                // move request file to error processing
                genericUtil.moveFile(controlFileName, fs, queueLocation, errorProcessingDirectory);
                genericUtil.moveFile(catalogFileName, fs, queueLocation, errorProcessingDirectory);
                // send conflicting master category updates
                sendMasterCategoryConflictsReport(contactEmails, contactNames, controlFileName, catalogFileName, partNumWithConflict, conflictingRequestFiles);
            } else {
                // write to new transform request reference file
                newTransformReqFileWriteStream.write(controlFileName + constants.CHAR_PIPE
                    + catalogFileName + constants.CHAR_PIPE
                    + contactEmails + constants.CHAR_PIPE
                    + contactNames + constants.CHAR_PIPE
                    + runRequest + os.EOL);
            }
        });

        genericUtil.endFsNodeResource(newTransformReqFileWriteStream);
    }
}

// Product Transform preprocessing
function createDataExtractionCtrlFile() {
    var attrExtractCtrlFilePath = resourcesDir + applicationProperties.path().file.name.dataExtractPreProcess
        + constants.CHAR_HYPHEN + buildReference + constants.FILE_EXT_TXT;
    var attrExtractFileWriteStream = fs.createWriteStream(attrExtractCtrlFilePath, {highWaterMark: Math.pow(2,14)});

    for (var eachLocaleName in dataExtractMap) {
        for (var batchIndex in dataExtractMap[eachLocaleName]) {
            var batchCtr = 0;
            var languageId = dataHelper.getLanguageId(eachLocaleName);
            attrExtractFileWriteStream.write(languageId + constants.CHAR_PIPE + batchIndex + constants.CHAR_PIPE);

            dataExtractMap[eachLocaleName][batchIndex].forEach(function (eachPartNumber) {
                attrExtractFileWriteStream.write(constants.CHAR_SQUOTE + eachPartNumber + constants.CHAR_SQUOTE);
                batchCtr++;

                if (batchCtr < dataExtractMap[eachLocaleName][batchIndex].length) {
                    attrExtractFileWriteStream.write(constants.DEFAULT_DELIMITER);
                }
            });

            attrExtractFileWriteStream.write(os.EOL);
        }
    }
}

// send summary report file via email
function sendMasterCategoryConflictsReport(contactEmails, contactNames, controlFileName, catalogFileName, partNumWithConflict, conflictingRequestFiles) {
    var mailSettings = {
		smtpHost: systemProperties.path().catman.smtpHost,
		smtpPort: systemProperties.path().catman.smtpPort,
		emailFrom: systemProperties.path().catman.emailFrom
	};
    
    var copyEmails = constants.EMPTY_STRING; //systemProperties.path().catman.defaultRecipients.split(constants.CHAR_PIPE).join(';');
	var subject = '[Catalog Manager] ' + environment + ' - Conflicting Master Category Updates Alert';
	var text = 'Dear ' + contactNames + ',\n\n' 
		+ 'Your Product Transform request file below:\n\n' 
        + '\t-' + controlFileName + '\n' 
        + '\t-' + catalogFileName + '\n\n' 
		+ 'Encountered conflicting Master Category updates for ' + partNumWithConflict + ' with request files from other authors indicated below:\n\n';
	
    conflictingRequestFiles.forEach(function (eachConflict) {
        var conflictFilePairArray = eachConflict.split(constants.CHAR_PIPE);
        var controlFileNameWithConflict = conflictFilePairArray[0];
        var catalogFileNameWithConflict = conflictFilePairArray[1];

        initialTransformRequests.forEach(function (transformRequest) {
            if (transformRequest[0] == controlFileNameWithConflict) {
                var authorName = transformRequest[3];

                text = text + 'From ' + authorName + ':\n\n' 
                    + '\t-' + controlFileNameWithConflict + '\n' 
                    + '\t-' + catalogFileNameWithConflict + '\n\n';
            }
        });
    });

    text = text + 'The system needs to reject the request file and none of its data is processed.' 
        + 'Please coordinate with the other authors to correct the request files.\n\n' 
        + 'Thank you!';
    
    mailer.sendEmail(mailSettings, contactEmails, copyEmails, subject, text);
}
