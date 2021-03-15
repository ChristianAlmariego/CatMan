//// fetch params
var env = process.argv[2];
var buildtag = process.argv[3];
var processCode = process.argv[4];

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
var recordVerifier = require(cmModulesPath + systemProperties.path().catman.recordVerifier);
var mailer = require(cmModulesPath + systemProperties.path().catman.email);

//// setup node modules
var fs = require('fs');
var os = require('os');
var csv = require('csv-parse');
const { report } = require('process');

//// initialize variables
var requestCtr = 0;
var summaryReport = {};

//// start process
switch (processCode) {
    case applicationProperties.path().catman.productTransform:
        // TBD
        break;
    case applicationProperties.path().catman.manageAttributes:
        verifyManageAttributeProcess();
		break;
	case applicationProperties.path().catman.manageCategory:
		verifyManageCategoryProcess();
		break;
    case applicationProperties.path().catman.extractProductForTranslation:
        // TBD
		break;
	case applicationProperties.path().catman.extractProductForPublish:
		// TBD
		break;
    default:
        // do nothing
}

//// methods
function verifyManageAttributeProcess() {
	var workspaceDirectory = environmentProperties.path().catman.rootDirectory 
		+ systemProperties.path().catman.requestsDirectory 
		+ systemProperties.path().catman.workspaceAttributesAndAttrValues;
	var resourceDirectory = workspaceDirectory + systemProperties.path().catman.wrkspcResource;
	var tmpDirectory = resourceDirectory + systemProperties.path().catman.wrkspctmp;

	var validRequestsFilePath = resourceDirectory + applicationProperties.path().file.name.validRequests 
		+ constants.CHAR_HYPHEN + buildtag + constants.FILE_EXT_TXT;
	var validRequests = lookupsBuilder.getRequestsLookup(validRequestsFilePath);

	// start verifying catalog files
	validRequests.forEach(function (eachRequest) {
		var attrControlFilename = eachRequest[0];
		var attrCatalogFilename = eachRequest[1];
		var runRequest = eachRequest[4];
		var attrCtlgFileReadStream = fs.createReadStream(tmpDirectory + attrCatalogFilename);

		console.log(' Verifying attrcatalog file... ' + attrCatalogFilename);
		summaryReport[attrCatalogFilename] = [];
		
		attrCtlgFileReadStream.pipe(csv(genericUtil.getDefaultCsvOptions()))
			.on(constants.NODE_KEY_DATA, function(rowData) {
				attrCtlgFileReadStream.pause();

				var verification;

				try {
					switch (runRequest) {
						case applicationProperties.path().manageattr.runrequestcode.attrSettingsChange:
							verification = recordVerifier.verifyRowDataForAttrSettingsChange(rowData, lookupsBuilder);
							break;
						case applicationProperties.path().manageattr.runrequestcode.attrAddition:
							verification = recordVerifier.verifyRowDataForAttrAddition(rowData, lookupsBuilder);
							break;
						case applicationProperties.path().manageattr.runrequestcode.attrDeletion:
							verification = recordVerifier.verifyRowDataForAttrDeletion(rowData, lookupsBuilder);
							break;
						case applicationProperties.path().manageattr.runrequestcode.attrvalChange:
							verification = recordVerifier.verifyRowDataForAttrValChange(rowData, lookupsBuilder);
							break;
						case applicationProperties.path().manageattr.runrequestcode.attrvalAddition:
							verification = recordVerifier.verifyRowDataForAttrValAddition(rowData, lookupsBuilder);
							break;
						case applicationProperties.path().manageattr.runrequestcode.attrvalDeletion:
							verification = recordVerifier.verifyRowDataForAttrValDeletion(rowData, lookupsBuilder);
							break;
						default:
							// do nothing
					}
				} catch (error) {
					var errorMessage = ' ERROR: Undefined error encountered. ';
					console.log(errorMessage);
					console.log(error);
				}

				var reportEntry = [];
				reportEntry.push(rowData[constants.CSV_HEADER_ATTRIDENTIFIER]);
				reportEntry.push(runRequest);

				if (runRequest == applicationProperties.path().manageattr.runrequestcode.attrvalChange) {
					reportEntry.push(rowData[constants.CSV_HEADER_NEWVALUE]);
				} else if (runRequest == applicationProperties.path().manageattr.runrequestcode.attrvalAddition
					|| runRequest == applicationProperties.path().manageattr.runrequestcode.attrvalDeletion) {
					reportEntry.push(rowData[constants.CSV_HEADER_CURRENTVALUE]);
				} else {
					reportEntry.push("");
				}

				reportEntry.push(verification.status);
				summaryReport[attrCatalogFilename].push(reportEntry);

				process.nextTick(function() {
					attrCtlgFileReadStream.resume();
				});
			})
			.on(constants.NODE_KEY_END, function(attrControlFilename, attrCatalogFilename) { return function() {
				// increment request counter
				requestCtr++

				if (requestCtr == validRequests.length) {
					var reportFilePath = createSummaryReportFile();
					sendSummaryReportFile(reportFilePath);
				}
			}}(attrControlFilename, attrCatalogFilename))
			.on(constants.NODE_KEY_ERROR, function(error) {
				console.log(error);
			});
	});
}


function verifyManageCategoryProcess() {
	var workspaceDirectory = environmentProperties.path().catman.rootDirectory 
		+ systemProperties.path().catman.requestsDirectory 
		+ systemProperties.path().catman.workspaceCategories;
	var resourceDirectory = workspaceDirectory + systemProperties.path().catman.wrkspcResource;
	var tmpDirectory = resourceDirectory + systemProperties.path().catman.wrkspctmp;

	var validRequestsFilePath = resourceDirectory + applicationProperties.path().file.name.validRequests 
		+ constants.CHAR_HYPHEN + buildtag + constants.FILE_EXT_TXT;
	var validRequests = lookupsBuilder.getRequestsLookup(validRequestsFilePath);

	// start verifying catalog files
	validRequests.forEach(function (eachRequest) {
		var categoryControlFilename = eachRequest[0];
		var categoryCatalogFilename = eachRequest[1];
		var runRequest = eachRequest[4];
		var categoryCtlgFileReadStream = fs.createReadStream(tmpDirectory + categoryCatalogFilename);

		console.log(' Verifying categorycatalog file... ' + categoryCatalogFilename);
		summaryReport[categoryCatalogFilename] = [];
		
		categoryCtlgFileReadStream.pipe(csv(genericUtil.getDefaultCsvOptions()))
			.on(constants.NODE_KEY_DATA, function(rowData) {
				categoryCtlgFileReadStream.pause();

				var verification;

				try {
					switch (runRequest) {
						case applicationProperties.path().managecategory.runrequestcode.categoryUpdate:
							verification = recordVerifier.verifyRowDataForCategoryUpdate(rowData, lookupsBuilder);
							break;
							case applicationProperties.path().managecategory.runrequestcode.categoryAddition:
							verification = recordVerifier.verifyRowDataForCategoryAddition(rowData, lookupsBuilder);
							break;
							case applicationProperties.path().managecategory.runrequestcode.categoryDeletion:
							verification = recordVerifier.verifyRowDataForCategoryDeletion(rowData, lookupsBuilder);
							break;
						default:
							// do nothing
					}
				} catch (error) {
					var errorMessage = ' ERROR: Undefined error encountered. ';
					console.log(errorMessage);
					console.log(error);
				}

				var reportEntry = [];
				reportEntry.push(rowData[constants.CSV_HEADER_CAT_IDENTIFIER]);
				reportEntry.push(rowData[constants.CSV_HEADER_CAT_PARENTIDENTIFIER]);
				reportEntry.push(runRequest);

				reportEntry.push(verification.status);
				summaryReport[categoryCatalogFilename].push(reportEntry);

				process.nextTick(function() {
					categoryCtlgFileReadStream.resume();
				});
			})
			.on(constants.NODE_KEY_END, function(categoryControlFilename, categoryCatalogFilename) { return function() {
				// increment request counter
				requestCtr++

				if (requestCtr == validRequests.length) {
					var reportFilePath = createSummaryReportFile();
					sendCategorySummaryReportFile(reportFilePath);
				}
			}}(categoryControlFilename, categoryCatalogFilename))
			.on(constants.NODE_KEY_ERROR, function(error) {
				console.log(error);
			});
	});
}

// create the summary report file to be sent via email
function createSummaryReportFile() {
	var reportHeader;
	var reportDirectory;
	var reportFilePath;
	
	switch (processCode) {
		case applicationProperties.path().catman.productTransform:
			// TBD
			break;
		case applicationProperties.path().catman.manageAttributes:
			reportDirectory = environmentProperties.path().catman.baseSharedDirectory 
				+ systemProperties.path().catman.requestsDirectory 
				+ systemProperties.path().catman.workspaceAttributesAndAttrValues
				+ systemProperties.path().catman.wrkspcReport;
			reportFilePath = reportDirectory + "ManageAttribute-Summary-" + buildtag + constants.FILE_EXT_CSV;
			reportHeader = 'attr-catalog File Name,Attribute Identifier,Update Type,Attribute Value,Status';
			break;
		case applicationProperties.path().catman.manageCategory:
			reportDirectory = environmentProperties.path().catman.baseSharedDirectory 
				+ systemProperties.path().catman.requestsDirectory 
				+ systemProperties.path().catman.workspaceCategories
				+ systemProperties.path().catman.wrkspcReport;
			reportFilePath = reportDirectory + "ManageCategory-Summary-" + buildtag + constants.FILE_EXT_CSV;
			reportHeader = 'category-catalog File Name,Identifier,Parent Identifier,Update Type,Status';
			break;
		case applicationProperties.path().catman.extractProductForTranslation:
			// TBD
			break;
		case applicationProperties.path().catman.extractProductForPublish:
			// TBD
			break;
		default:
			// do nothing
	}

	var reportWriteFileStream = genericUtil.createWriteFileStream(reportFilePath, fs);
	reportWriteFileStream.write(reportHeader + os.EOL);

	for (var filenamekey in summaryReport) {
		var reportEntry = summaryReport[filenamekey];
		var reportLine;

		reportEntry.forEach(function (eachFileEntry) {
			reportLine = filenamekey + constants.DEFAULT_DELIMITER;

			for (var index = 0; index < eachFileEntry.length; index++) {
				var eachDetail = eachFileEntry[index];
				reportLine = reportLine + eachDetail;

				if (index < eachFileEntry.length - 1) {
					reportLine = reportLine + constants.DEFAULT_DELIMITER;
				}
			}

			reportWriteFileStream.write(reportLine + os.EOL);
		});
	}

	return reportFilePath;
}


// send summary report file via email
function sendSummaryReportFile(reportFilePath) {
	var mailSettings = {
		smtpHost: systemProperties.path().catman.smtpHost,
		smtpPort: systemProperties.path().catman.smtpPort,
		emailFrom: systemProperties.path().catman.emailFrom
	};

	var recipient = systemProperties.path().catman.defaultRecipients.split('|').join(';');
	var copyEmails = '';
	var subject = '[Catalog Manager] ' + env + ' - Configure Attributes and Attribute Values Verification Report';
	var text = 'CatMan Team,\n\n'
		+ 'Kindly review the attached verification report file of the previously triggered QB job with build number '
		+ buildtag + '.\n\n\n' 
		+ 'Note: FAILED status from the report file can be caused by duplicate update request for the attribute. If the other entry’s status is SUCCESS, it is the last version of data saved to the system database.';
	
	var filePathArray = reportFilePath.split('/');
	var reportFileName = filePathArray[filePathArray.length - 1];

	var attachments = [{
		filename: reportFileName,
		path: reportFilePath
	}];

	mailer.sendEmailAttachment(mailSettings, recipient, copyEmails, subject, text, attachments);
}

//TBD: For future enhancements
//send category summary report file via email
function sendCategorySummaryReportFile(reportFilePath) {
	var mailSettings = {
		smtpHost: systemProperties.path().catman.smtpHost,
		smtpPort: systemProperties.path().catman.smtpPort,
		emailFrom: systemProperties.path().catman.emailFrom
	};

	var recipient = systemProperties.path().catman.defaultRecipients.split('|').join(';');
	var copyEmails = '';
	var subject = '[Catalog Manager] ' + env + ' - Configure Category Verification Report';
	var text = 'CatMan Team,\n\n'
		+ 'Kindly review the attached verification report file of the previously triggered QB job with build number '
		+ buildtag + '.\n\n\n' 
		+ 'Note: FAILED status from the report file can be caused by duplicate update request for the category. If the other entry’s status is SUCCESS, it is the last version of data saved to the system database.';
	
	var filePathArray = reportFilePath.split('/');
	var reportFileName = filePathArray[filePathArray.length - 1];

	var attachments = [{
		filename: reportFileName,
		path: reportFilePath
	}];

	mailer.sendEmailAttachment(mailSettings, recipient, copyEmails, subject, text, attachments);
}

