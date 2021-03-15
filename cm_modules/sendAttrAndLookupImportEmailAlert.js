//declare all variables before functions
//EDS-7556 reporting alert code changes
//This script is used to trigger an email from a shell file.
//Requires Environment, store name and batchId values as input params.
var env = process.argv[2];
var storeName = process.argv[3];
var batchid = process.argv[4];
var processType = process.argv[5];
var jobType = process.argv[6];
var jsonReader = require("./jsonReader");
var jsonObject = jsonReader.getJsonProperties(env, storeName);
var targetDirectory = jsonObject.baseSharedDirectory + 'TMS/CatMan/Export';
var fs = require('fs');


var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var systemProperties = propertiesReader.getSystemProperties();

if(jobType==='promoteTranslation'){
	var baseDirFiles = fs.readdirSync(jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForPublish');
	var reportPath = jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForPublish';
}
if(jobType==='importTranslation'){
	var baseDirFiles = fs.readdirSync(jsonObject.baseSharedDirectory + 'Translation-WorkingFolder/outbound/catman/processing');
	var reportPath = jsonObject.baseSharedDirectory + 'Translation-WorkingFolder/outbound/catman/processing';
}

var reportAttr = "";
var reportLookup = "";

if (processType==='Attribute'){
	baseDirFiles.forEach(function (file){
		if(file.includes("Emerson"+batchid, 0)){		
			if(file.includes("_AttributeImport.csv", 0)){
				reportAttr = file;
			} 
		}
	});	
}
if (processType==='Lookup'){
	baseDirFiles.forEach(function (file){
		if(file.includes("Emerson"+batchid, 0)){		
			if(file.includes("_LookupImport.csv", 0)){
				reportLookup = file;
			} 
		}
	});	
}

var mailer = require('./email');
var emailList = (jsonObject.productImportReportULG == null) ? '' : jsonObject.productImportReportULG;


if (processType==='Attribute' && reportAttr != ""){
	moveFile(reportAttr, reportPath, targetDirectory);
}
if (processType==='Lookup' && reportLookup != ""){
	moveFile(reportLookup, reportPath, targetDirectory);
}


if(env == 'prod'){
	var emailSubject = "CATALOG: Translated content promoted from STAGE to PROD";
}
else {
	var emailSubject = "CATALOG: Translated content ready for review on "+env+" env";
}

var emailText = "Please refer to the link for the details of the import.";
if (env == 'stage' || env == 'prod' || env == 'dev' || env == 'local'){
	if (emailList != '') {
		if (reportAttr != "") {		
			sendValidationReportFile(targetDirectory + '/' + reportAttr, emailList, '', emailSubject , "\nExport Report: " + jsonObject.baseSharedFolder4Email + 'TMS/CatMan/Export/' + reportAttr +	"\n\n" + emailText);
		}
		if (reportLookup != "") {		
			sendValidationReportFile(targetDirectory + '/' + reportLookup, emailList, '', emailSubject , "\nExport Report: " + jsonObject.baseSharedFolder4Email + 'TMS/CatMan/Export/' + reportLookup +	"\n\n" + emailText);
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