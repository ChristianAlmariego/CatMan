//declare all variables before functions
//EDS-4289, 4922: sendEmailAlert is called at loadtranslationsfromxliff.sh
//This script is used to trigger an email from a shell file.
//Requires Environment, store name and batchId values as input params.
var env = process.argv[2];
var storeName = process.argv[3];
var batchid = process.argv[4];
var jobType = process.argv[5];
var jsonReader = require("./jsonReader");
var jsonObject = jsonReader.getJsonProperties(env, storeName);
var targetDirectory = jsonObject.baseSharedDirectory + 'TMS/CatMan/Export';
var extractForPublishPath = jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForPublish/';
var processingDirPath = jsonObject.baseSharedDirectory + 'TMS/CatMan/Processing/';
var fs = require('fs');
var readline = require('readline');
var mailer = require('./email');

var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var systemProperties = propertiesReader.getSystemProperties();

if(env == 'prod'){
	var emailSubject = "CATALOG: Translated content promoted from STAGE to PROD";
}
else {
	var emailSubject = "CATALOG: Translated content ready for review on "+env+" env";
}
var emailText = "Please refer to the link for the details of the import.";
var reportAutosol = "";
var reportComres = "";

if((process.argv[6] != undefined) && (process.argv[6] == 'AutoPublish')){
	var autosolEmailList = (jsonObject.autosolProductImportReportULG == null) ? '' : jsonObject.autosolProductImportReportULG;
	var comresEmailList = (jsonObject.comresProductImportReportULG == null) ? '' : jsonObject.comresProductImportReportULG;
	
	var processingDirFiles = fs.readdirSync(processingDirPath);
	processingDirFiles.forEach(function (file){
		if(file.includes("Emerson", 0)){		
			if(file.includes("_AutosolProductImport.csv", 0)){
				reportAutosol = file;
			} else if(file.includes("_ComresProductImport.csv", 0)){
				reportComres = file;
			}
		}
	});
	
	if(reportAutosol != "" || reportComres != ""){
		var extractDirFiles = fs.readdirSync(extractForPublishPath);
		var regEmailList = "";
		const searchRegExp = /,/g;
		const replaceWith = ';';
		//SA1 1092 fetch request mailer id from the tms publish control file
		extractDirFiles.forEach(function (file){
			if(file.includes("tms-publish-control-item-"+batchid, 0)){	
				fsReadStream = fs.readFileSync(extractForPublishPath + file, 'utf8');
				var data=fsReadStream.split('\n');
				data.forEach(function (line){
					var lineData=line.split('|');
					if((lineData[2] != null) && (lineData[2] != undefined)){
						var reqMails = lineData[2].replace(searchRegExp, replaceWith).split(';');
						reqMails.forEach(function (reqMail){
							if (!(regEmailList.includes(reqMail.trim()))){
								regEmailList=regEmailList+';'+reqMail.trim();
							}
						});
					}
				});
				
			}
		});
		
		var emailList = (regEmailList == undefined) ? '' : regEmailList.split(';');
		if(emailList != ''){
			emailList.forEach(function (mailList){
				if (!(autosolEmailList.includes(mailList) && reportAutosol != "")){
					autosolEmailList=autosolEmailList+';'+mailList;
				}
				if(!(comresEmailList.includes(mailList) && reportComres != "")){
					comresEmailList=comresEmailList+';'+mailList;
				}
			});
		}
	
		if (env == 'stage' || env == 'prod' || env == 'dev' || env == 'local'){
			if (autosolEmailList != '' || comresEmailList != '') {
				if(reportAutosol != "" && reportComres != ""){
					moveFile(reportAutosol, processingDirPath, targetDirectory);
					moveFile(reportComres, processingDirPath, targetDirectory);
					sendValidationReportFile(targetDirectory + '/' + reportAutosol, autosolEmailList, '', emailSubject , "\nAutosol Export Report: " + jsonObject.baseSharedFolder4Email + 'TMS/CatMan/Export/' + reportAutosol +	"\n\n" + emailText);
					sendValidationReportFile(targetDirectory + '/' + reportComres, comresEmailList, '', emailSubject , "\nComres Export Report: " + jsonObject.baseSharedFolder4Email + 'TMS/CatMan/Export/' + reportComres +	"\n\n" + emailText);
				}else if(reportAutosol != ""){
					moveFile(reportAutosol, processingDirPath, targetDirectory);
					sendValidationReportFile(targetDirectory + '/' + reportAutosol, autosolEmailList, '', emailSubject , "\nAutosol Export Report: " + jsonObject.baseSharedFolder4Email + 'TMS/CatMan/Export/' + reportAutosol +	"\n\n" + emailText);
				}else if(reportComres != ""){
					moveFile(reportComres, processingDirPath, targetDirectory);
					sendValidationReportFile(targetDirectory + '/' + reportComres, comresEmailList, '', emailSubject , "\nComres Export Report: " + jsonObject.baseSharedFolder4Email + 'TMS/CatMan/Export/' + reportComres +	"\n\n" + emailText);
				}
			}
		}
	}
}
else{
	var emailList = (jsonObject.productImportReportULG == null) ? '' : jsonObject.productImportReportULG;
	var reqMails = (process.argv[6] == undefined) ? '' : process.argv[6].split(',');
	if(reqMails != ''){
		reqMails.forEach(function (reqMail){
			if (!(emailList.includes(reqMail))){
				emailList=emailList+';'+reqMail;
			}
		});
	}
	if (jobType == 'promoteTranslation'){
		var productReportPath = jsonObject.baseSharedDirectory + 'TMS/CatMan/Processing';
		if (fs.existsSync(productReportPath+'/Emerson' + batchid + '_ProductImport.csv')) {
			moveFile('Emerson' + batchid + '_ProductImport.csv', productReportPath, targetDirectory);
		}
	}
	if (jobType == 'importTranslation'){
		var productReportPath = jsonObject.baseSharedDirectory + 'Translation-WorkingFolder/outbound/catman/processing';
		if (fs.existsSync(productReportPath+'/Emerson' + batchid + '_ProductImport.csv')) {
			moveFile('Emerson' + batchid + '_ProductImport.csv', productReportPath, targetDirectory);
		}
	}
	//EDS-4289, 4922: Send email alert to a preset list with an attachment containing report of product imports in Stage/Prod.
	if (env == 'stage' || env == 'prod' || env == 'dev' || env == 'local'){
		if (emailList != '') {
			sendValidationReportFile(targetDirectory + 'Emerson' + batchid + '_ProductImport.csv', emailList, '', emailSubject , "\nExport Report: " + jsonObject.baseSharedFolder4Email + 'TMS/CatMan/Export' + '/Emerson' + batchid + '_ProductImport.csv' +	"\n\n" + emailText);
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