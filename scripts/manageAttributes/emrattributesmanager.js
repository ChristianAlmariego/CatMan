//// fetch params
var env = process.argv[2];
var storeName = process.argv[3];
var buildtag = process.argv[4];

//// setup default properties
var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;

//// setup extended properties
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var applicationProperties = propertiesReader.getApplicationProperties();
var systemProperties = propertiesReader.getSystemProperties();
var environmentProperties = propertiesReader.getEnvironmentProperties(env);

//// setup cm_modules
var constants = require(cmModulesPath + systemProperties.path().catman.constants);
var lookupsBuilder = require(cmModulesPath + systemProperties.path().catman.lookupsBuilder).setEnvironmentProperties(env);
var genericUtil = require(cmModulesPath + systemProperties.path().catman.genericUtilities);
var recordValidator = require(cmModulesPath + systemProperties.path().catman.recordValidator);
var recordWriter = require(cmModulesPath + systemProperties.path().catman.recordWriter);
var loadOutputStream = require(cmModulesPath + systemProperties.path().catman.loadOutputStream);
var lookupsModifier = require(cmModulesPath + systemProperties.path().catman.lookupsModifier);

//// setup node modules
var fs = require('fs');
var csv = require('csv-parse');
var os = require('os');

//// initialize variables
var requestCtr = 0;
var validRequestStatuses = {};

//// start process
var currentLookupDirectory = environmentProperties.path().catman.rootDirectory 
	+ systemProperties.path().catman.lookupDirectory;
var resourcePath = environmentProperties.path().catman.rootDirectory 
	+ systemProperties.path().catman.requestsDirectory 
	+ systemProperties.path().catman.workspaceAttributesAndAttrValues 
	+ systemProperties.path().catman.wrkspcResource;
var queueLocation = environmentProperties.path().catman.baseSharedDirectory 
	+ systemProperties.path().catman.requestsDirectory 
	+ systemProperties.path().catman.workspaceAttributesAndAttrValues;
var processingDirectory = queueLocation + systemProperties.path().catman.wrkspcProcessing;
var reportDirectory = queueLocation + systemProperties.path().catman.wrkspcReport;
var archivedDirectory = queueLocation + systemProperties.path().catman.wrkspcArchive;
var errorProcessingDirectory = queueLocation + systemProperties.path().catman.wrkspcErrorProcessing;
var resourceTmpDirectory = resourcePath + systemProperties.path().catman.wrkspctmp;

var outputLookupDirectory = resourcePath + systemProperties.path().catman.lookupDirectory;
var outputLookupArchiveDirectory = outputLookupDirectory + systemProperties.path().catman.wrkspcArchive;

var validRequestsFilePath = resourcePath + applicationProperties.path().file.name.validRequests 
	+ constants.CHAR_HYPHEN + buildtag + constants.FILE_EXT_TXT;
var validRequests = lookupsBuilder.getRequestsLookup(validRequestsFilePath);

// start processing each requests
validRequests.forEach(function (eachRequest) {
	var attrControlFilename = eachRequest[0];
	var attrCatalogFilename = eachRequest[1];
	var runRequest = eachRequest[4];

	genericUtil.moveFile(attrControlFilename, fs, queueLocation, processingDirectory);
	genericUtil.moveFile(attrCatalogFilename, fs, queueLocation, processingDirectory);

	validRequestStatuses[attrControlFilename] = true;

	processManageAttributeRequest(attrControlFilename, attrCatalogFilename, runRequest);
});

//// methods
function processManageAttributeRequest(attrControlFilename, attrCatalogFilename, runRequest) {
	var attrCtlgFileReadStream = fs.createReadStream(processingDirectory + attrCatalogFilename);
	var reportFilePath = reportDirectory + "Report-" + attrCatalogFilename;
	var reportWriteFileStream = genericUtil.createWriteFileStream(reportFilePath, fs);

	console.log(' Processing attrcatalog file... ' + attrControlFilename);

	attrCtlgFileReadStream.pipe(csv(genericUtil.getDefaultCsvOptions()))
		.on(constants.NODE_KEY_DATA, function(rowData) {
			attrCtlgFileReadStream.pause();

			try {
				var attributeIdentifier = rowData[constants.CSV_HEADER_ATTRIDENTIFIER];
				console.log(' Processing attribute... ' + attributeIdentifier);
				genericUtil.writeReportFileLine(reportWriteFileStream, ' Attribute Identifier: ' + attributeIdentifier);

				switch (runRequest) {
					case applicationProperties.path().manageattr.runrequestcode.attrSettingsChange:
						processRowDataForAttrSettingsChanges(rowData, reportWriteFileStream, attrControlFilename);
						break;
					case applicationProperties.path().manageattr.runrequestcode.attrDeletion:
						processRowDataForAttrDeletion(rowData, reportWriteFileStream, attrControlFilename);
						break;
					case applicationProperties.path().manageattr.runrequestcode.attrAddition:
						processRowDataForAttrAddition(rowData, reportWriteFileStream, attrControlFilename);
						break;
					case applicationProperties.path().manageattr.runrequestcode.attrvalChange:
						processRowDataForAttrValuesChange(rowData, reportWriteFileStream, attrControlFilename);
						break;
					case applicationProperties.path().manageattr.runrequestcode.attrvalDeletion:
						processRowDataForAttrValuesDeletion(rowData, reportWriteFileStream, attrControlFilename);
						break;
					case applicationProperties.path().manageattr.runrequestcode.attrvalAddition:
						processRowDataForAttrValuesAddition(rowData, reportWriteFileStream, attrControlFilename);
						break;
					default:
						// do nothing
				}
			} catch (error) {
				var errorMessage = ' ERROR: Undefined error encountered. ';
				console.log(errorMessage);
				console.log(error);
				genericUtil.writeReportFileLine(reportWriteFileStream, errorMessage);
				validRequestStatuses[attrControlFilename] = false;
			}

			process.nextTick(function() {
				attrCtlgFileReadStream.resume();
			});
		})
		.on(constants.NODE_KEY_END, function(attrControlFilename, attrCatalogFilename) { return function() {
			requestCtr++;
			moveProcessedFiles(attrControlFilename, attrCatalogFilename);

			if (requestCtr == validRequests.length) {
				createLookupCsvNewVersions();
				copyCatalogFilesToResourceTemp();
			}
		}}(attrControlFilename, attrCatalogFilename))
		.on(constants.NODE_KEY_ERROR, function(error) {
			console.log(error);
		});

	genericUtil.endFsNodeResource(reportWriteFileStream);
}


// attr deletion
function processRowDataForAttrDeletion(rowData, reportWriteFileStream, attrControlFilename){
	var validation = recordValidator.validateRowDataForAttrDeletion(rowData, lookupsBuilder);

	genericUtil.writeReportFileLine(reportWriteFileStream, ' ***Attribute Deletion:	*** ');
	genericUtil.writeReportMessages(reportWriteFileStream, validation.warningMessages);
	genericUtil.writeReportMessages(reportWriteFileStream, validation.errorMessages);

	if (validation.isValid) {
		lookupsModifier.modifyLookupForAttrDeletion(rowData, lookupsBuilder);
		genericUtil.writeReportFileLine(reportWriteFileStream, ' Attribute successfully deleted! ');
	} else {
		validRequestStatuses[attrControlFilename] = false;
		genericUtil.writeReportFileLine(reportWriteFileStream, ' Failed deleting the attribute! ');
	}
}

// attr settings change
function processRowDataForAttrSettingsChanges(rowData, reportWriteFileStream, attrControlFilename) {
	var validation = recordValidator.validateRowDataForAttrSettingsChange(rowData, lookupsBuilder);	
	
	genericUtil.writeReportFileLine(reportWriteFileStream, ' ***Attribute Settings Change*** ');
	genericUtil.writeReportMessages(reportWriteFileStream, validation.warningMessages);
	genericUtil.writeReportMessages(reportWriteFileStream, validation.errorMessages);

	if (validation.isValid) {
		lookupsModifier.modifyLookupForAttrSettingsChange(rowData, lookupsBuilder);
		genericUtil.writeReportFileLine(reportWriteFileStream, ' Attribute successfully updated! ');
	} else {
		validRequestStatuses[attrControlFilename] = false;
		genericUtil.writeReportFileLine(reportWriteFileStream, ' Failed updating the attribute! ');
	}
}

// attr addition
function processRowDataForAttrAddition(rowData, reportWriteFileStream, attrControlFilename) {
	var validation = recordValidator.validateRowDataForAttrAddition(rowData, lookupsBuilder);
	
	genericUtil.writeReportFileLine(reportWriteFileStream, ' ***Attribute Addition*** ');
	genericUtil.writeReportMessages(reportWriteFileStream, validation.warningMessages);
	genericUtil.writeReportMessages(reportWriteFileStream, validation.errorMessages);

	if (validation.isValid) {
		lookupsModifier.modifyLookupForAttrAddition(rowData, lookupsBuilder);
		genericUtil.writeReportFileLine(reportWriteFileStream, ' Attribute successfully added! ');
	} else {
		validRequestStatuses[attrControlFilename] = false;
		genericUtil.writeReportFileLine(reportWriteFileStream, ' Failed adding the attribute! ');
	}
}

// attrval update
function processRowDataForAttrValuesChange(rowData, reportWriteFileStream, attrControlFilename) {
	var validation = recordValidator.validateRowDataForAttrValChange(rowData, lookupsBuilder);

	genericUtil.writeReportFileLine(reportWriteFileStream, ' ***Attribute Values Change*** ');
	genericUtil.writeReportMessages(reportWriteFileStream, validation.warningMessages);
	genericUtil.writeReportMessages(reportWriteFileStream, validation.errorMessages);
	
	if (validation.isValid) {
		lookupsModifier.modifyLookupForAttrValuesChange(rowData, lookupsBuilder); //TBD
		genericUtil.writeReportFileLine(reportWriteFileStream, ' Attribute Value successfully updated! ');
	} else {
		validRequestStatuses[attrControlFilename] = false;
		genericUtil.writeReportFileLine(reportWriteFileStream, ' Failed updating Attribute Values! ');
	}
}

// attrval deletion
function processRowDataForAttrValuesDeletion(rowData, reportWriteFileStream, attrControlFilename) {
	var validation = recordValidator.validateRowDataForAttrValDeletion(rowData, lookupsBuilder);

	genericUtil.writeReportFileLine(reportWriteFileStream, ' ***Attribute Values Deletion*** ');
	genericUtil.writeReportMessages(reportWriteFileStream, validation.warningMessages);
	genericUtil.writeReportMessages(reportWriteFileStream, validation.errorMessages);
	
	if (validation.isValid) {
		lookupsModifier.modifyLookupForAttrValuesDeletion(rowData, lookupsBuilder); //TBD
		genericUtil.writeReportFileLine(reportWriteFileStream, ' Attribute Value successfully deleted! ');
	} else {
		validRequestStatuses[attrControlFilename] = false;
		genericUtil.writeReportFileLine(reportWriteFileStream, ' Failed deleting Attribute Values! ');
	}
}

// attrval addition
function processRowDataForAttrValuesAddition(rowData, reportWriteFileStream, attrControlFilename) {
	var validation = recordValidator.validateRowDataForAttrValAddition(rowData, lookupsBuilder);

	genericUtil.writeReportFileLine(reportWriteFileStream, ' ***Attribute Values Addition*** ');
	genericUtil.writeReportMessages(reportWriteFileStream, validation.warningMessages);
	genericUtil.writeReportMessages(reportWriteFileStream, validation.errorMessages);
	
	if (validation.isValid) {
		lookupsModifier.modifyLookupForAttrValuesAddition(rowData, lookupsBuilder); //TBD
		genericUtil.writeReportFileLine(reportWriteFileStream, ' Attribute Value successfully added! ');
	} else {
		validRequestStatuses[attrControlFilename] = false;
		genericUtil.writeReportFileLine(reportWriteFileStream, ' Failed adding Attribute Values! ');
	}
}

//// create new versions of lookup csvs
function createLookupCsvNewVersions() {
	var summaryLookup = lookupsBuilder.getManageAttributesSummaryLookup();
	var valueUsageUpdatesLookup = lookupsBuilder.getManageAttributesUsageUpdatesLookup();
	var searchableUpdatesLookup = lookupsBuilder.getManageAttributesSearchableUpdatesLookup();
	var attrDeletionLookup = lookupsBuilder.getManageAttributesDeletionLookup();
	var attrValDeletionLookup = lookupsBuilder.getManageAttributeValuesDeletionLookup();
	var attrValUpdatesLookup = lookupsBuilder.getManageAttributesAttrValUpdatesLookup();
	var datatypeUpdatesForAttrValUpdateLookup = lookupsBuilder.getManageAttributesDatatypeForUpdateLookup();
    var datatypeUpdatesForAttrValDeleteLookup = lookupsBuilder.getManageAttributesDatatypeForDeleteLookup();

	if (summaryLookup.attrUpdatesExists) {
		createNewVersionOfAttributeDictionaryLookupCsv();
	}
	if (summaryLookup.attrValUpdatesExists) {
		createNewVersionOfAttributeValuesDictionaryLookupCsv();
	}
	if (summaryLookup.ctaUpdatesExists) {
		createNewVersionOfCtaMapLookupCsv();
	}
	if (summaryLookup.ubeltUpdatesExists) {
		createNewVersionOfUBeltMapLookupCsv();
	}
	if (valueUsageUpdatesLookup.length > 0) {
		createAttrValueUsageUpdatesReferenceFile();
	}
	if (searchableUpdatesLookup.length > 0) {
		createAttrSearchableUpdatesReferenceFile();
	}
	if (attrDeletionLookup.length > 0) {
		createAttrDeletionReferenceFile();
	}
	if (attrValDeletionLookup.length > 0) {
		createAttrValuesDeletionReferenceFile();
	}
	if (attrValUpdatesLookup.length > 0) {
		createAttrValUpdatesReferenceFile();
	}
	if (datatypeUpdatesForAttrValUpdateLookup.length > 0) {
		createDatatypeUpdatesForAttrValUpdateReferenceFile();
	}
	if (datatypeUpdatesForAttrValDeleteLookup.length > 0) {
		createDatatypeUpdatesForAttrValDeleteReferenceFile();
	}
}

//// move files to appropriate workspace locations after processing
function moveProcessedFiles(attrControlFilename, attrCatalogFilename) {
	if (validRequestStatuses[attrControlFilename]) {
		genericUtil.moveFile(attrControlFilename, fs, processingDirectory, archivedDirectory);
		genericUtil.moveFile(attrCatalogFilename, fs, processingDirectory, archivedDirectory);
	} else {
		genericUtil.moveFile(attrControlFilename, fs, processingDirectory, errorProcessingDirectory);
		genericUtil.moveFile(attrCatalogFilename, fs, processingDirectory, errorProcessingDirectory);
	}
}

//// create new version of attrdictattr-dataload.csv
function createNewVersionOfAttributeDictionaryLookupCsv() {
	var attrDictionaryLookupFileName = systemProperties.path().lookups.attrDictionary;
	var newAttrDictionaryLookupFilePath = outputLookupDirectory + attrDictionaryLookupFileName;
	var archivedAttrDictionaryLookupFileName;

	var fileNameArray = attrDictionaryLookupFileName.split(constants.CHAR_DOT);
	var dateStamp = genericUtil.getCurrentDateStamp();

	archivedAttrDictionaryLookupFileName = fileNameArray[0] + constants.CHAR_HYPHEN 
		+ dateStamp + constants.CHAR_HYPHEN + buildtag + constants.CHAR_DOT + fileNameArray[1];

	var outputStreams = loadOutputStream.getManageAttributeDictionaryLookupStream(newAttrDictionaryLookupFilePath);
	var attrDictionaryOutputStream = outputStreams.csvAttributeDictionaryLookupStream;

	recordWriter.writeAttributeDictionary(lookupsBuilder.getAttributeDictionaryLookup(), attrDictionaryOutputStream);

	// archive old version
	genericUtil.moveFile(attrDictionaryLookupFileName, fs, currentLookupDirectory, outputLookupArchiveDirectory);
	genericUtil.renameFile(attrDictionaryLookupFileName, archivedAttrDictionaryLookupFileName, fs, outputLookupArchiveDirectory);

	// move in the new version of the lookup csv file
	genericUtil.moveFile(attrDictionaryLookupFileName, fs, outputLookupDirectory, currentLookupDirectory);
}

//// create new version of attrdictattrval-dataload.csv
function createNewVersionOfAttributeValuesDictionaryLookupCsv() {
	var attrValDictionaryLookupFileName = systemProperties.path().lookups.attrValDictionary;
	var newAttrValDictionaryLookupFilePath = outputLookupDirectory + attrValDictionaryLookupFileName;
	var archivedAttrValDictionaryLookupFileName;

	var fileNameArray = attrValDictionaryLookupFileName.split(constants.CHAR_DOT);
	var dateStamp = genericUtil.getCurrentDateStamp();

	archivedAttrValDictionaryLookupFileName = fileNameArray[0] + constants.CHAR_HYPHEN 
		+ dateStamp + constants.CHAR_HYPHEN + buildtag + constants.CHAR_DOT + fileNameArray[1];

	var outputStreams = loadOutputStream.getManageAttributeValuesDictionaryLookupStream(newAttrValDictionaryLookupFilePath);
	var attrValDictionaryOutputStream = outputStreams.csvAttributeValuesDictionaryLookupStream;

	recordWriter.writeAttributeValuesDictionary(lookupsBuilder.getAttributeValuesDictionaryLookup(), attrValDictionaryOutputStream);

	// archive old version
	genericUtil.moveFile(attrValDictionaryLookupFileName, fs, currentLookupDirectory, outputLookupArchiveDirectory);
	genericUtil.renameFile(attrValDictionaryLookupFileName, archivedAttrValDictionaryLookupFileName, fs, outputLookupArchiveDirectory);

	// move in the new version of the lookup csv file
	console.log("Update Lookup version of attribute dictionary CSV");
	genericUtil.moveFile(attrValDictionaryLookupFileName, fs, outputLookupDirectory, currentLookupDirectory);
	console.log("Lookup CSV Version completed");
}

//// create new version of control-cta-lookup.csv
function createNewVersionOfCtaMapLookupCsv() {
	var ctaMapLookupFileName = systemProperties.path().lookups.ctaMapKeys;
	var newCtaMapLookupFilePath = outputLookupDirectory + ctaMapLookupFileName;
	var archivedCtaMapLookupFileName;

	var fileNameArray = ctaMapLookupFileName.split(constants.CHAR_DOT);
	var dateStamp = genericUtil.getCurrentDateStamp();

	archivedCtaMapLookupFileName = fileNameArray[0] + constants.CHAR_HYPHEN 
		+ dateStamp + constants.CHAR_HYPHEN + buildtag + constants.CHAR_DOT + fileNameArray[1];

	var outputStreams = loadOutputStream.getManageCtaMapLookupStream(newCtaMapLookupFilePath);
	var ctaMapOutputStream = outputStreams.csvCtaMapLookupStream;

	recordWriter.writeCallToActionsMap(lookupsBuilder.getCtaMapLookup(), ctaMapOutputStream);

	// archive old version
	genericUtil.moveFile(ctaMapLookupFileName, fs, currentLookupDirectory, outputLookupArchiveDirectory);
	genericUtil.renameFile(ctaMapLookupFileName, archivedCtaMapLookupFileName, fs, outputLookupArchiveDirectory);

	// move in the new version of the lookup csv file
	genericUtil.moveFile(ctaMapLookupFileName, fs, outputLookupDirectory, currentLookupDirectory);
}

//// create new version of control-utility-belt-lookup.csv
function createNewVersionOfUBeltMapLookupCsv() {
	var ubeltMapLookupFileName = systemProperties.path().lookups.ubeltMapKeys;
	var newUBeltMapLookupFilePath = outputLookupDirectory + ubeltMapLookupFileName;
	var archivedUBeltMapLookupFileName;

	var fileNameArray = ubeltMapLookupFileName.split(constants.CHAR_DOT);
	var dateStamp = genericUtil.getCurrentDateStamp();

	archivedUBeltMapLookupFileName = fileNameArray[0] + constants.CHAR_HYPHEN 
		+ dateStamp + constants.CHAR_HYPHEN + buildtag + constants.CHAR_DOT + fileNameArray[1];

	var outputStreams = loadOutputStream.getManageUBeltMapLookupStream(newUBeltMapLookupFilePath);
	var ubeltMapOutputStream = outputStreams.csvUBeltMapLookupStream;

	recordWriter.writeUtilityBeltsMap(lookupsBuilder.getUBeltMapLookup(), ubeltMapOutputStream);

	// archive old version
	genericUtil.moveFile(ubeltMapLookupFileName, fs, currentLookupDirectory, outputLookupArchiveDirectory);
	genericUtil.renameFile(ubeltMapLookupFileName, archivedUBeltMapLookupFileName, fs, outputLookupArchiveDirectory);

	// move in the new version of the lookup csv file
	genericUtil.moveFile(ubeltMapLookupFileName, fs, outputLookupDirectory, currentLookupDirectory);
}

// create the attribute value usage update reference file (cm-updates-valusage-<buildtag>.txt)
function createAttrValueUsageUpdatesReferenceFile() {
	var valueUsageUpdatesReferenceFilePath = resourcePath + applicationProperties.path().file.name.valueUsageUpdates
		+ constants.CHAR_HYPHEN + buildtag + constants.FILE_EXT_TXT;
	var valueUsageUpdatesFileWriteStream = fs.createWriteStream(valueUsageUpdatesReferenceFilePath, {highWaterMark: Math.pow(2,14)});

	lookupsBuilder.getManageAttributesUsageUpdatesLookup().forEach(function (eachValueUsageUpdate) {
		valueUsageUpdatesFileWriteStream.write(eachValueUsageUpdate[0] + constants.CHAR_PIPE 
			+ eachValueUsageUpdate[1] + os.EOL);
    });
}

// create the attribute value usage update reference file (cm-updates-valusage-<buildtag>.txt)
function createAttrSearchableUpdatesReferenceFile() {
	var searchableUpdatesReferenceFilePath = resourcePath + applicationProperties.path().file.name.searchableUpdates
		+ constants.CHAR_HYPHEN + buildtag + constants.FILE_EXT_TXT;
	var searchableUpdatesFileWriteStream = fs.createWriteStream(searchableUpdatesReferenceFilePath, {highWaterMark: Math.pow(2,14)});

	lookupsBuilder.getManageAttributesSearchableUpdatesLookup().forEach(function (eachSearhableUpdate) {
		searchableUpdatesFileWriteStream.write(eachSearhableUpdate + os.EOL);
    });
}

function createAttrDeletionReferenceFile() {
	var deletionReferenceFilePath = resourcePath + applicationProperties.path().file.name.attrDeletion
		+ constants.CHAR_HYPHEN + buildtag + constants.FILE_EXT_TXT;
	var deletionFileWriteStream = fs.createWriteStream(deletionReferenceFilePath, {highWaterMark: Math.pow(2,14)});

	lookupsBuilder.getManageAttributesDeletionLookup().forEach(function (eachDeletion) {
		deletionFileWriteStream.write(eachDeletion + os.EOL);
    });
}

function createAttrValuesDeletionReferenceFile() {
	var deletionReferenceFilePath = resourcePath + applicationProperties.path().file.name.attrValDeletion
		+ constants.CHAR_HYPHEN + buildtag + constants.FILE_EXT_TXT;
	var deletionFileWriteStream = fs.createWriteStream(deletionReferenceFilePath, {highWaterMark: Math.pow(2,14)});

	lookupsBuilder.getManageAttributeValuesDeletionLookup().forEach(function (eachDeletion) {
		deletionFileWriteStream.write(eachDeletion + os.EOL);
    });
}

function createAttrValUpdatesReferenceFile() {
	var updatesReferenceFilePath = resourcePath + applicationProperties.path().file.name.attrValUpdates
		+ constants.CHAR_HYPHEN + buildtag + constants.FILE_EXT_TXT;
	var updatesFileWriteStream = fs.createWriteStream(updatesReferenceFilePath, {highWaterMark: Math.pow(2,14)});

	lookupsBuilder.getManageAttributesAttrValUpdatesLookup().forEach(function (eachUpdates) {
		updatesFileWriteStream.write(eachUpdates + os.EOL);
    });
}

function createDatatypeUpdatesForAttrValUpdateReferenceFile() {
	var dataTypeUpdateReferenceFilePath = resourcePath + applicationProperties.path().file.name.lookupTypeAttrValUpdate
		+ constants.CHAR_HYPHEN + buildtag + constants.FILE_EXT_TXT;
	var dataTypeUpdateFileWriteStream = fs.createWriteStream(dataTypeUpdateReferenceFilePath, {highWaterMark: Math.pow(2,14)});

	lookupsBuilder.getManageAttributesDatatypeForUpdateLookup().forEach(function (eachDataTypeForUpdate) {
		dataTypeUpdateFileWriteStream.write(eachDataTypeForUpdate[0] + constants.CHAR_PIPE 
			+ eachDataTypeForUpdate[1] + constants.CHAR_PIPE 
			+ eachDataTypeForUpdate[2] + os.EOL);
    });
}

function createDatatypeUpdatesForAttrValDeleteReferenceFile() {
	var dataTypeUpdateReferenceFilePath = resourcePath + applicationProperties.path().file.name.lookupTypeAttrValDelete
		+ constants.CHAR_HYPHEN + buildtag + constants.FILE_EXT_TXT;
	var dataTypeUpdateFileWriteStream = fs.createWriteStream(dataTypeUpdateReferenceFilePath, {highWaterMark: Math.pow(2,14)});

	lookupsBuilder.getManageAttributesDatatypeForDeleteLookup().forEach(function (eachDataTypeForDeletion) {
		dataTypeUpdateFileWriteStream.write(eachDataTypeForDeletion[0] + constants.CHAR_PIPE 
			+ eachDataTypeForDeletion[1] + os.EOL);
    });
}

// creates copies of processed catalog files to resource/tmp folder for verification processing
function copyCatalogFilesToResourceTemp() {
	validRequests.forEach(function (eachRequest) {
		var attrControlFilename = eachRequest[0];
		var attrCatalogFilename = eachRequest[1];

		if (validRequestStatuses[attrControlFilename]) {
			genericUtil.copyFile(attrCatalogFilename, fs, archivedDirectory, resourceTmpDirectory);
		} else {
			genericUtil.copyFile(attrCatalogFilename, fs, errorProcessingDirectory, resourceTmpDirectory);
		}
	});
}
