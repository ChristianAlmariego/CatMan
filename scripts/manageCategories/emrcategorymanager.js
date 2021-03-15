//// fetch params
var env = process.argv[2];
var storeName = process.argv[3];
var buildtag = process.argv[4];
var isCheckerMode = false;

if (process.argv[5] == "CHECKONLY")  {
	isCheckerMode = true;
}

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
var mailer = require(cmModulesPath + systemProperties.path().catman.email);

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
var categoryWrkspaceDirectory = environmentProperties.path().catman.rootDirectory 
	+ systemProperties.path().catman.requestsDirectory 
	+ systemProperties.path().catman.workspaceCategories;
var resourcePath;

var queueLocation = environmentProperties.path().catman.baseSharedDirectory 
	+ systemProperties.path().catman.requestsDirectory 
	+ systemProperties.path().catman.workspaceCategories;

if (isCheckerMode) {
	queueLocation = queueLocation + systemProperties.path().catman.workspaceChecker;
	resourcePath = categoryWrkspaceDirectory + systemProperties.path().catman.workspaceChecker + systemProperties.path().catman.wrkspcResource;
} else {
	resourcePath = categoryWrkspaceDirectory + systemProperties.path().catman.wrkspcResource;
}

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
	var categoryControlFilename = eachRequest[0];
	var categoryCatalogFilename = eachRequest[1];
	var email = eachRequest[2];
	var name = eachRequest[3];
	var runRequest = eachRequest[4];

	genericUtil.moveFile(categoryControlFilename, fs, queueLocation, processingDirectory);
	genericUtil.moveFile(categoryCatalogFilename, fs, queueLocation, processingDirectory);

	validRequestStatuses[categoryControlFilename] = true;

	processManageCategoryRequest(categoryControlFilename, categoryCatalogFilename, email, name, runRequest);
});

//// methods
function processManageCategoryRequest(categoryControlFilename, categoryCatalogFilename, email, name, runRequest) {
	var categoryCtlgFileReadStream = fs.createReadStream(processingDirectory + categoryCatalogFilename);
	var reportFilePath = reportDirectory + "Report-" + categoryCatalogFilename;
	var reportWriteFileStream = genericUtil.createWriteFileStream(reportFilePath, fs);
	var archiveCatalogFilePath = archivedDirectory + categoryCatalogFilename;
	var errorCatalogFilePath = errorProcessingDirectory + categoryCatalogFilename;
	var categoryCatalogFilePath; 

	console.log(' Processing categorycatalog file... ' + categoryControlFilename);

	categoryCtlgFileReadStream.pipe(csv(genericUtil.getDefaultCsvOptions()))
		.on(constants.NODE_KEY_DATA, function(rowData) {
			categoryCtlgFileReadStream.pause();

			try {
				var categoryIdentifier = rowData[constants.CSV_HEADER_CAT_IDENTIFIER];
				console.log(' Processing category... ' + categoryIdentifier);
				genericUtil.writeReportFileLine(reportWriteFileStream, ' Category Identifier: ' + categoryIdentifier);

				switch (runRequest) {
					case applicationProperties.path().managecategory.runrequestcode.categoryUpdate:
						processRowDataForCategoryUpdate(rowData, reportWriteFileStream, categoryControlFilename);
						break;
					case applicationProperties.path().managecategory.runrequestcode.categoryAddition:
						processRowDataForCategoryAddition(rowData, reportWriteFileStream, categoryControlFilename);
						break;
					case applicationProperties.path().managecategory.runrequestcode.categoryDeletion:
						processRowDataForCategoryDeletion(rowData, reportWriteFileStream, categoryControlFilename);
						break;
					default:
						// do nothing
				}
			} catch (error) {
				var errorMessage = ' ERROR: Undefined error encountered. ';
				console.log(errorMessage);
				console.log(error);
				genericUtil.writeReportFileLine(reportWriteFileStream, errorMessage);
				validRequestStatuses[categoryControlFilename] = false;
			}

			process.nextTick(function() {
				categoryCtlgFileReadStream.resume();
			});
		})
		.on(constants.NODE_KEY_END, function(categoryControlFilename, categoryCatalogFilename) { return function() {
			// TBD - end process
			requestCtr++;
			moveProcessedFiles(categoryControlFilename, categoryCatalogFilename);

			if (!isCheckerMode) {
				if (requestCtr == validRequests.length) {
					createLookupCsvNewVersions();
					copyCatalogFilesToResourceTemp();
				}
			} 

			if (validRequestStatuses[categoryControlFilename]) {
				categoryCatalogFilePath = archiveCatalogFilePath;
			} else {
				categoryCatalogFilePath = errorCatalogFilePath;
			}
			sendReportFile(reportFilePath, categoryCatalogFilePath, email, name);

		}}(categoryControlFilename, categoryCatalogFilename))
		.on(constants.NODE_KEY_ERROR, function(error) {
			console.log(error);
		});

	genericUtil.endFsNodeResource(reportWriteFileStream);
}

// category update
function processRowDataForCategoryUpdate(rowData, reportWriteFileStream, categoryControlFilename) {
	var validation = recordValidator.validateRowDataForCategoryUpdate(rowData, lookupsBuilder);	
	
	genericUtil.writeReportFileLine(reportWriteFileStream, ' ***Category Update*** ');
	genericUtil.writeReportMessages(reportWriteFileStream, validation.warningMessages);
	genericUtil.writeReportMessages(reportWriteFileStream, validation.errorMessages);

	if (validation.isValid) {
		if (!isCheckerMode) {
			lookupsModifier.modifyLookupForCategoryUpdate(rowData, lookupsBuilder);
		} 		
		genericUtil.writeReportFileLine(reportWriteFileStream, ' Category successfully updated! ');
	} else {
		validRequestStatuses[categoryControlFilename] = false;
		genericUtil.writeReportFileLine(reportWriteFileStream, ' Failed updating the category! ');
	}
}

// category addition
function processRowDataForCategoryAddition(rowData, reportWriteFileStream, categoryControlFilename) {
	var validation = recordValidator.validateRowDataForCategoryAddition(rowData, lookupsBuilder);	
	
	genericUtil.writeReportFileLine(reportWriteFileStream, ' ***Category Addition*** ');
	genericUtil.writeReportMessages(reportWriteFileStream, validation.warningMessages);
	genericUtil.writeReportMessages(reportWriteFileStream, validation.errorMessages);

	if (validation.isValid) {
		if (!isCheckerMode) {
			lookupsModifier.modifyLookupForCategoryAddition(rowData, lookupsBuilder);
		}
		genericUtil.writeReportFileLine(reportWriteFileStream, ' Category successfully updated! ');
	} else {
		validRequestStatuses[categoryControlFilename] = false;
		genericUtil.writeReportFileLine(reportWriteFileStream, ' Failed updating the category! ');
	}
}

// category deletion
function processRowDataForCategoryDeletion(rowData, reportWriteFileStream, categoryControlFilename) {
	var validation = recordValidator.validateRowDataForCategoryDeletion(rowData, lookupsBuilder);	
	
	genericUtil.writeReportFileLine(reportWriteFileStream, ' ***Category Deletion*** ');
	genericUtil.writeReportMessages(reportWriteFileStream, validation.warningMessages);
	genericUtil.writeReportMessages(reportWriteFileStream, validation.errorMessages);

	if (validation.isValid) {
		if (!isCheckerMode) {
			lookupsModifier.modifyLookupForCategoryDeletion(rowData, lookupsBuilder);
		}
		genericUtil.writeReportFileLine(reportWriteFileStream, ' Category successfully updated! ');
	} else {
		validRequestStatuses[categoryControlFilename] = false;
		genericUtil.writeReportFileLine(reportWriteFileStream, ' Failed updating the category! ');
	}
}

//// create new versions of lookup csvs
 function createLookupCsvNewVersions() {
	var summaryLookup = lookupsBuilder.getManageCategorySummaryLookup();
	var urlkeywordDeletion = lookupsBuilder.getManageCategoryUrlKeywordUpdatesLookup();
	var facetDeletion = lookupsBuilder.getManageCategoryFacetUpdatesLookup();
	var categoryDeletion = lookupsBuilder.getManageCategoryDeletionLookup();
	var categoryStoreDataloadList = lookupsBuilder.getManageCategoryStoreLookup();

 	if (summaryLookup.categoryUpdatesExists) {
 		createNewVersionOfMasterSalesCategoryLookupCsv();
	}
	if (urlkeywordDeletion.length > 0) {
		createCategoryUrlKeywordDeletionReferenceFile();
	}
	if (facetDeletion.length > 0){
		createCategoryFacetDeletionReferenceFile();
	}
	if (categoryDeletion.length > 0){
		createCategoryDeletionReferenceFile();
	}
	if (categoryStoreDataloadList.length > 0){
		createCategoryStoreReferenceFile();
	}
 }

//// move files to appropriate workspace locations after processing
function moveProcessedFiles(categoryControlFilename, categoryCatalogFilename) {
	if (validRequestStatuses[categoryControlFilename]) {
		genericUtil.moveFile(categoryControlFilename, fs, processingDirectory, archivedDirectory);
		genericUtil.moveFile(categoryCatalogFilename, fs, processingDirectory, archivedDirectory);
	} else {
		genericUtil.moveFile(categoryControlFilename, fs, processingDirectory, errorProcessingDirectory);
		genericUtil.moveFile(categoryCatalogFilename, fs, processingDirectory, errorProcessingDirectory);
	}
}

// create new version of mastersalescategory_lookup.csv
function createNewVersionOfMasterSalesCategoryLookupCsv() {
	var masterSalesCategoryLookupFileName = systemProperties.path().lookups.masterSalesCategory;
	var newMasterSalesCategoryLookupFilePath = outputLookupDirectory + masterSalesCategoryLookupFileName;
	var archivedMasterSalesCategoryLookupFileName;

	var fileNameArray = masterSalesCategoryLookupFileName.split(constants.CHAR_DOT);
	var dateStamp = genericUtil.getCurrentDateStamp();

	archivedMasterSalesCategoryLookupFileName = fileNameArray[0] + constants.CHAR_HYPHEN 
		+ dateStamp + constants.CHAR_HYPHEN + buildtag + constants.CHAR_DOT + fileNameArray[1];

	var outputStreams = loadOutputStream.getManageMasterSalesCategoryLookupStream(newMasterSalesCategoryLookupFilePath);
	var masterSalesCategoryOutputStream = outputStreams.csvMasterSalesCategoryLookupStream;

	recordWriter.writeMasterSalesCategory(lookupsBuilder.getMasterSalesCategoryLookup(), masterSalesCategoryOutputStream);

	// archive old version
	genericUtil.moveFile(masterSalesCategoryLookupFileName, fs, currentLookupDirectory, outputLookupArchiveDirectory);
	genericUtil.renameFile(masterSalesCategoryLookupFileName, archivedMasterSalesCategoryLookupFileName, fs, outputLookupArchiveDirectory);

	// move in the new version of the lookup csv file
	genericUtil.moveFile(masterSalesCategoryLookupFileName, fs, outputLookupDirectory, currentLookupDirectory);
}

// create reference file for urlkeyword deletion
function createCategoryUrlKeywordDeletionReferenceFile() {
	var urlKeywordDeletionReferenceFilePath = resourcePath + applicationProperties.path().file.name.categoryUrlKeywordDeletion
		+ constants.CHAR_HYPHEN + buildtag + constants.FILE_EXT_TXT;
	var urlKeywordDeletionFileWriteStream = fs.createWriteStream(urlKeywordDeletionReferenceFilePath, {highWaterMark: Math.pow(2,14)});

	lookupsBuilder.getManageCategoryUrlKeywordUpdatesLookup().forEach(function (eachDeletion) {
		urlKeywordDeletionFileWriteStream.write(eachDeletion + os.EOL);
    });
}

// create reference file for facet deletion
function createCategoryFacetDeletionReferenceFile() {
	var facetDeletionReferenceFilePath = resourcePath + applicationProperties.path().file.name.categoryFacetDeletion
		+ constants.CHAR_HYPHEN + buildtag + constants.FILE_EXT_TXT;
	var facetDeletionFileWriteStream = fs.createWriteStream(facetDeletionReferenceFilePath, {highWaterMark: Math.pow(2,14)});

	lookupsBuilder.getManageCategoryFacetUpdatesLookup().forEach(function (eachFacetUpdate) {
		var counter = 0;
		var categoryIdentifier = eachFacetUpdate[0];
		var facetForDeletionArray = eachFacetUpdate[1];
		
		facetDeletionFileWriteStream.write(categoryIdentifier + constants.CHAR_PIPE);

		facetForDeletionArray.forEach(function (eachFacet){
			if (!genericUtil.isTrimmedEmptyString(eachFacet)){
				counter++;
				facetDeletionFileWriteStream.write(constants.CHAR_SQUOTE + eachFacet + constants.CHAR_SQUOTE);
				if (counter < facetForDeletionArray.length) {
					facetDeletionFileWriteStream.write(constants.DEFAULT_DELIMITER);
				}
			}
		});
		facetDeletionFileWriteStream.write(os.EOL);
    });
}

// create reference file for category deletion
function createCategoryDeletionReferenceFile() {
	var categoryDeletionReferenceFilePath = resourcePath + applicationProperties.path().file.name.categoryDeletion
		+ constants.CHAR_HYPHEN + buildtag + constants.FILE_EXT_TXT;
	var categoryDeletionFileWriteStream = fs.createWriteStream(categoryDeletionReferenceFilePath, {highWaterMark: Math.pow(2,14)});

	lookupsBuilder.getManageCategoryDeletionLookup().forEach(function (eachDeletion) {
		categoryDeletionFileWriteStream.write(eachDeletion + os.EOL);
    });
}

// create reference file for list of store to dataload
function createCategoryStoreReferenceFile() {
	var categoryStoreReferenceFilePath = resourcePath + applicationProperties.path().file.name.categoryStore
		+ constants.CHAR_HYPHEN + buildtag + constants.FILE_EXT_TXT;
	var categoryStoreFileWriteStream = fs.createWriteStream(categoryStoreReferenceFilePath, {highWaterMark: Math.pow(2,14)});

	lookupsBuilder.getManageCategoryStoreLookup().forEach(function (eachDeletion) {
		categoryStoreFileWriteStream.write(eachDeletion + os.EOL);
    });
}

// creates copies of processed catalog files to resource/tmp folder for verification processing
function copyCatalogFilesToResourceTemp() {
	validRequests.forEach(function (eachRequest) {
		var categoryControlFilename = eachRequest[0];
		var categoryCatalogFilename = eachRequest[1];

		if (validRequestStatuses[categoryControlFilename]) {
			genericUtil.copyFile(categoryCatalogFilename, fs, archivedDirectory, resourceTmpDirectory);
		} else {
			genericUtil.copyFile(categoryCatalogFilename, fs, errorProcessingDirectory, resourceTmpDirectory);
		}
	});
}

// send summary report file via email
function sendReportFile(reportFilePath, categoryCatalogFilePath, email, name) {
	var mailSettings = {
		smtpHost: systemProperties.path().catman.smtpHost,
		smtpPort: systemProperties.path().catman.smtpPort,
		emailFrom: systemProperties.path().catman.emailFrom
	};

	var recipient = email;
	var copyEmails = '';
	var subject = '';
	var text = '';
	if (!isCheckerMode) {
		subject = '[Catalog Manager] ' + env + ' - Manage Category ';
		text =  name + ',\n\n'
		+ 'Kindly review the attached report file of the previously triggered Manage Category QB job. ';
	} else {
		subject = '[Catalog Manager] ' + env + ' - Category Checker';
		text =  name + ',\n\n'
		+ 'Kindly review the attached report file of the previously triggered Category Checker QB job. ';
	}
	
	var categoryCatalogFilePathArray = categoryCatalogFilePath.split('/');
	var categoryCatalogFileName = categoryCatalogFilePathArray[categoryCatalogFilePathArray.length - 1];
	var filePathArray = reportFilePath.split('/');
	var reportFileName = filePathArray[filePathArray.length - 1];

	var attachments = [
		{
			filename: categoryCatalogFileName,
			path: categoryCatalogFilePath
		},{
			filename: reportFileName,
			path: reportFilePath
		}
	];

	mailer.sendEmailAttachment(mailSettings, recipient, copyEmails, subject, text, attachments);
}