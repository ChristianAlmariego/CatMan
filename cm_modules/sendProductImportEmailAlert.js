//declare all variables before functions
//EDS-7047: sendEmailImportAlert is called at loadtranslationsfromxliff.sh
//This script is used to trigger an email from a shell file.
//Requires Environment, store name and batchId values as input params.
var env = process.argv[2];
var storeName = process.argv[3];
var batchid = process.argv[4];
var jsonReader = require("./jsonReader");
var jsonObject = jsonReader.getJsonProperties(env, storeName);
var targetDirectory = jsonObject.baseSharedDirectory + 'TMS/CatMan/Export';
var fs = require('fs');
var baseDirFiles = fs.readdirSync(jsonObject.baseSharedDirectory + 'Translation-WorkingFolder/outbound/catman/processing');
var autosolEmailList = (jsonObject.autosolProductImportReportULG == null) ? '' : jsonObject.autosolProductImportReportULG;
var comresEmailList = (jsonObject.comresProductImportReportULG == null) ? '' : jsonObject.comresProductImportReportULG;
var reqMails = (process.argv[5] == undefined) ? '' : process.argv[5].split(',');
var reportAutosol = "";
var reportComres = "";

var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var systemProperties = propertiesReader.getSystemProperties();

baseDirFiles.forEach(function (file){
	if(file.includes("Emerson", 0)){		
		if(file.includes("_AutosolProductImport.csv", 0)){
			reportAutosol = file;
		} else if(file.includes("_ComresProductImport.csv", 0)){
			reportComres = file;
		}
	}
});

var mailer = require('./email');
var productReportPath = jsonObject.baseSharedDirectory + 'Translation-WorkingFolder/outbound/catman/processing';	
if(reportAutosol != "" && reportComres != ""){		
	//moveFile('Emerson' + batchid + '_ProductImport.csv', productReportPath, targetDirectory);
	moveFile(reportAutosol, productReportPath, targetDirectory);
	moveFile(reportComres, productReportPath, targetDirectory);	
}else if(reportAutosol != ""){	
moveFile(reportAutosol, productReportPath, targetDirectory);
}else if(reportComres != ""){
moveFile(reportComres, productReportPath, targetDirectory);	
}	

if(reqMails != ''){
	reqMails.forEach(function (reqMail){
		if (!(autosolEmailList.includes(reqMail) && reportAutosol != "")){
			autosolEmailList=autosolEmailList+';'+reqMail;
		}else if(!(comresEmailList.includes(reqMail) && reportComres != "")){
			comresEmailList=comresEmailList+';'+reqMail;
		 }
	});
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
		if(reportAutosol != "" && reportComres != "") {		
			sendValidationReportFile(targetDirectory + '/'+ reportAutosol, autosolEmailList, '', emailSubject , "\nAutosol Export Report: " + jsonObject.baseSharedFolder4Email + 'TMS/CatMan/Export/' + reportAutosol +	"\n\n" + emailText);
			sendValidationReportFile(targetDirectory + '/' + reportComres, comresEmailList,  '', emailSubject , "\nComres Export Report: " + jsonObject.baseSharedFolder4Email + 'TMS/CatMan/Export/' + reportComres +	"\n\n" + emailText);
		} else if(reportAutosol != "") {
			sendValidationReportFile(targetDirectory + '/' + reportAutosol, autosolEmailList, '', emailSubject , "\nAutosol Export Report: " + jsonObject.baseSharedFolder4Email + 'TMS/CatMan/Export/' + reportAutosol +	"\n\n" + emailText);
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