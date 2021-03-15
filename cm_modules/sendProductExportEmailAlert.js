//EDS-5751: sendEmailAlert is called at extractForXLIFF.sh
//This script is used to trigger an email from a shell file.
var env = process.argv[2];
var storeName = process.argv[3];
var mailer = require('./email');
var jsonReader = require("./jsonReader");
var jsonObject = jsonReader.getJsonProperties(env, storeName);
var targetDirectory = jsonObject.baseSharedDirectory + 'TMS/CatMan/Export';
var emailSubject = "CATALOG: " + env + " content exported for translation"
var fs = require('fs');
var emailText = "Please refer to the link for the details of the export.";
var baseDirFiles = fs.readdirSync(jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForXLIFF');
var productReportPath = jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForXLIFF'
var reportAutosol = "";
var reportComres = "";

var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var systemProperties = propertiesReader.getSystemProperties();

baseDirFiles.forEach(function (file){
	if(file.includes("Emerson", 0)){
		if(file.includes("_AutosolProductExport.csv", 0)){
			reportAutosol = file;
		} else if(file.includes("_ComresProductExport.csv", 0)){
			reportComres = file;
		}
	}
});
if (reportAutosol != "" && reportComres != "") {
	moveFile(reportAutosol, productReportPath, targetDirectory);
	moveFile(reportComres, productReportPath, targetDirectory);
	sendValidationReportFile(targetDirectory + '/'+ reportAutosol, jsonObject.productExportReportULG, '', emailSubject , "\nAutosol Export Report: " + jsonObject.baseSharedFolder4Email + 'TMS/CatMan/Export/' + reportAutosol + "\n\n" + emailText);		
	sendValidationReportFile(targetDirectory + '/' + reportComres, jsonObject.productExportReportULG, '', emailSubject , "\nComres Export Report: " + jsonObject.baseSharedFolder4Email + 'TMS/CatMan/Export/' + reportComres + "\n\n" + emailText);
}
else if(reportAutosol != ""){
	moveFile(reportAutosol, productReportPath, targetDirectory);
	sendValidationReportFile(targetDirectory + '/'+ reportAutosol, jsonObject.productExportReportULG, '', emailSubject , "\nAutosol Export Report: " + jsonObject.baseSharedFolder4Email + 'TMS/CatMan/Export/' + reportAutosol + "\n\n" + emailText);		
} else if(reportComres != ""){
	moveFile(reportComres, productReportPath, targetDirectory);
	sendValidationReportFile(targetDirectory + '/' + reportComres, jsonObject.productExportReportULG, '', emailSubject , "\nComres Export Report: " + jsonObject.baseSharedFolder4Email + 'TMS/CatMan/Export/' + reportComres + "\n\n" + emailText);
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