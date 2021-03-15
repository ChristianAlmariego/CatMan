// setup default properties
var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;

// fetch params
var environment = process.argv[2];
var processName = process.argv[3];
var buildReference = process.argv[4];
var logType = process.argv[5];
var inputFullFilePath = process.argv[6];

// setup extended properties
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var systemProperties = propertiesReader.getSystemProperties();
var applicationProperties = propertiesReader.getApplicationProperties();
var environmentProperties = propertiesReader.getEnvironmentProperties(environment);

// setup cm_modules
var constants = require(cmModulesPath + systemProperties.path().catman.constants);
var mailer = require(cmModulesPath + systemProperties.path().catman.email);
var genericUtil = require(cmModulesPath + systemProperties.path().catman.genericUtilities);

// node modules
var readline = require(systemProperties.path().node.readLine);
var fs = require(systemProperties.path().node.fileSystem);

// initialize variables
var fileReadStream;
var lineReader;
var errorFound = false;

fileReadStream = fs.createReadStream(inputFullFilePath);
lineReader = readline.createInterface({ input: fileReadStream });

// start reading the log file
lineReader.on('line', (line) => {

	if (logType == 'dataloadLog') {
		processDataloadLog(line);
	}
	
}).on('close', () => {
	// do nothing
});

var processDataloadLog = function(rowLine) {
	
	if (!errorFound) {
		checkForErrorFound(rowLine);
	} else {
		checkForDataloadLog(rowLine);
	}
}

var checkForErrorFound = function(rowLine) {
	var classKeyWord = "LoadItemErrorReport";
	var logKeyWord = "logSummaryReport";

	if (rowLine.indexOf(classKeyWord) != -1
		&& rowLine.indexOf(logKeyWord) != -1) {
		errorFound = true;
	}
}

// TBD: for future use
var checkForErrorCount = function(rowLine) {
	var keyWord = "Error Count:";

	if (rowLine.indexOf(keyWord) != -1) {
		var rowLinePartsArray = rowLine.split(keyWord);

		if (rowLinePartsArray.length > 1) {
			var errorCount = parseInt(rowLinePartsArray[1].trim().replace('.', ''));

			if (Number.isNaN(errorCount)) {
				errorCount = 0;
			}
		}
	}
}

var checkForDataloadLog = function(rowLine) {
	var keyWord = "Error log location:";

	if (rowLine.indexOf(keyWord) != -1) {
		var rowLinePartsArray = rowLine.split(keyWord);

		if (rowLinePartsArray.length > 1) {
			var dataloadLogFilePath = rowLinePartsArray[1].trim();
			dataloadLogFilePath = dataloadLogFilePath.substring(0, dataloadLogFilePath.length - 1);
			var dataloadLogFilePathArray = dataloadLogFilePath.split(constants.CHAR_SLASH);
			var dataloadLogFileName = dataloadLogFilePathArray[dataloadLogFilePathArray.length - 1];
			sendDataloadLog(dataloadLogFileName);
			errorFound = false;
		}
	}
}

var sendDataloadLog = function(logFileName) {
	var logFilePath;
	var processFolder;

	if (processName == applicationProperties.path().catman.process.productTransform) {
		processFolder = systemProperties.path().catman.productTransform;
	} else if (processName == applicationProperties.path().catman.process.manageAttrDataload) {
		processFolder = systemProperties.path().catman.manageAttributes;
	} else if (processName == applicationProperties.path().catman.process.translationsPromotePublish 
		|| processName == applicationProperties.path().catman.process.translationsLoadFromXLIFF) {
		processFolder = systemProperties.path().catman.translation;
	} else if (processName.includes(applicationProperties.path().catman.process.categoryTransform)) {
		processFolder = systemProperties.path().catman.manageCategories;
	}

	if (!genericUtil.isUndefined(processFolder)) {
		logFilePath = environmentProperties.path().catman.rootDirectory 
			+ systemProperties.path().catman.logsFolder 
			+ processFolder + logFileName;

		var mailSettings = {
			smtpHost: systemProperties.path().catman.smtpHost,
			smtpPort: systemProperties.path().catman.smtpPort,
			emailFrom: systemProperties.path().catman.emailFrom
		};
		
		if (buildReference.indexOf('-') != -1) {
			var referenceArray = buildReference.split('-');
			buildReference = referenceArray[0];
		}
	
		var recipient = systemProperties.path().catman.dataloadLogsErrorReportRecipient.split('|').join(';');
		var copyEmails = '';
		var subject = '[Catalog Manager] ' + environment + ' - Dataload Log contains Errors!';
		var text = 'Kindly investigate the errors found in the attached dataload logs.\n\n'
				+ 'See details below: \n'
				+ '\tProcess Name:\t\t' + processName + '\n'
				+ '\tBuild Reference:\t' + buildReference;
	
		var filePathArray = logFilePath.split('/');
		var logsFileName = filePathArray[filePathArray.length - 1];
	
		var attachments = [
			{
				filename: logsFileName,
				path: logFilePath
			}
		];
	
		mailer.sendEmailAttachment(mailSettings, recipient, copyEmails, subject, text, attachments);
	}
}
