//declare all variables before functions
//EDS-7556 reporting alert code changes
//This script is used to trigger an email from a shell file.
//Requires Environment, store name and batchId values as input params.
var env = process.argv[2];
var storeName = process.argv[3];
var batchid = process.argv[4];
var jobType = process.argv[5];
var jsonReader = require("./jsonReader");
var jsonObject = jsonReader.getJsonProperties(env, storeName);
var targetDirectory = jsonObject.baseSharedDirectory + 'TMS/CatMan/Export';
var fs = require('fs');
if(jobType==='promoteTranslation'){
	var baseDirFiles = fs.readdirSync(jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForPublish');
	var CategoryReportPath = jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForPublish';
}
if(jobType==='importTranslation'){
	var baseDirFiles = fs.readdirSync(jsonObject.baseSharedDirectory + 'Translation-WorkingFolder/outbound/catman/processing');
	var CategoryReportPath = jsonObject.baseSharedDirectory + 'Translation-WorkingFolder/outbound/catman/processing';
}
var reportAutosol = "";
var reportComres = "";
baseDirFiles.forEach(function (file){
	if(file.includes("Emerson"+batchid, 0)){		
		if(file.includes("_AutosolCategoryImport.csv", 0)){
			reportAutosol = file;
		} else if(file.includes("_ComresCategoryImport.csv", 0)){
			reportComres = file;
		}
	}
});

var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var systemProperties = propertiesReader.getSystemProperties();

var mailer = require('./email');
//var emailList = (jsonObject.productImportReportULG == null) ? '' : jsonObject.productImportReportULG;
var autosolEmailList = (jsonObject.autosolProductImportReportULG == null) ? '' : jsonObject.autosolProductImportReportULG;
var comresEmailList = (jsonObject.comresProductImportReportULG == null) ? '' : jsonObject.comresProductImportReportULG;

	
if(reportAutosol != "" && reportComres != ""){		
	//moveFile('Emerson' + batchid + '_ProductImport.csv', productReportPath, targetDirectory);
	moveFile(reportAutosol, CategoryReportPath, targetDirectory);
	moveFile(reportComres, CategoryReportPath, targetDirectory);	
}else if(reportAutosol != ""){	
moveFile(reportAutosol, CategoryReportPath, targetDirectory);
}else if(reportComres != ""){
moveFile(reportComres, CategoryReportPath, targetDirectory);	
}

if(env == 'prod'){
	var emailSubject = "CATALOG: Translated content promoted from STAGE to PROD";
}
else {
	var emailSubject = "CATALOG: Translated content ready for review on "+env+" env";
}

var emailText = "Please refer to the link for the details of the import.";
if (env == 'stage' || env == 'prod' || env == 'dev' || env == 'local'){
	if (autosolEmailList != '' || comresEmailList != '') {
		if (reportAutosol != "" && reportComres != "") {		
			sendValidationReportFile(targetDirectory + '/'+ reportAutosol, autosolEmailList, '', emailSubject , "\nAutosol Export Report: " + jsonObject.baseSharedFolder4Email + 'TMS/CatMan/Export/' + reportAutosol +	"\n\n" + emailText)
			sendValidationReportFile(targetDirectory + '/' + reportComres, comresEmailList,  '', emailSubject , "\nComres Export Report: " + jsonObject.baseSharedFolder4Email + 'TMS/CatMan/Export/' + reportComres +	"\n\n" + emailText);
		} else if(reportAutosol != "") {
			sendValidationReportFile(targetDirectory + '/'+ reportAutosol, autosolEmailList, '', emailSubject , "\nAutosol Export Report: " + jsonObject.baseSharedFolder4Email + 'TMS/CatMan/Export/' + reportAutosol +	"\n\n" + emailText);
		} else if(reportComres != "") {
			sendValidationReportFile(targetDirectory + '/' + reportComres, comresEmailList,  '', emailSubject , "\nComres Export Report: " + jsonObject.baseSharedFolder4Email + 'TMS/CatMan/Export/' + reportComres +	"\n\n" + emailText);
		}
	}
}
function moveFile(file, sourceDir, targetDir){
	fs.renameSync(sourceDir + '/' + file, targetDir+ '/' + file);
}

function sendValidationReportFile(reportFilePath, recipient, copyEmails, emailSubject, emailBody) {
	var mailSettings = {
		smtpHost: systemProperties.path().catman.smtpHost,
		smtpPort: systemProperties.path().catman.smtpPort,
		emailFrom: systemProperties.path().catman.emailFrom
	};

	var reportFilePathArray = reportFilePath.split('/');
	var reportFileName = reportFilePathArray[reportFilePathArray.length - 1];

	var attachments = [
		{
			filename: reportFileName,
			path: reportFilePath
		}
	];

	mailer.sendEmailAttachment(mailSettings, recipient, copyEmails, emailSubject, emailBody, attachments);
}