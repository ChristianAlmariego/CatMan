/*
 * For local testing put control and catalog files under this folder: TMS/CatMan/Checker
 * After script finishes, the files will be either in the respective ErrorProcessing or Archive directory depending on success/failure
 * 
 * Use this commands to run locally:
 * node translationcatalogchecker.js <env> <store>			--> env : local/dev/stage/prod,  store: emr/fan/proteam/wsv
 */

// Get arguments
var env = process.argv[2]; // Environment argument
var storeName = process.argv[3]; // Store argument
console.log('Processing ' +  storeName + ' Store');

var lookups;
var reportOutputStream = [];
var fsReportOutputStream = [];
var controlFiles = [], baseDirControlFiles = [], controlFileData = [];
var filesDict = [];

checkArguments(); // Validate arguments
var jsonReader = require("./cm_modules/jsonReader");
var jsonObject = jsonReader.getJsonProperties(env, storeName);

var csv = require('csv-parse');
var csvsync = require('csv-parse/lib/sync');
var fs = require('fs');
var loadLookups = require('./cm_modules/loadLookups');
var stringify = require('csv-stringify');
var mailer = require('./cm_modules/email');

var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var systemProperties = propertiesReader.getSystemProperties();
var applicationProperties = propertiesReader.getApplicationProperties();

var validLocales = jsonObject.validLocales;

var translationsPath = 'TMS/CatMan/Checker/';
var baseDirectory = jsonObject.baseSharedDirectory + translationsPath;
var processingDirectory = baseDirectory + jsonObject.processingDirectory;
var errorProcessingDirectory = baseDirectory + jsonObject.errorProcessingDirectory;
var reportDirectory = baseDirectory + jsonObject.reportDirectory;
var archiveDirectory = baseDirectory + jsonObject.archiveDirectory;
var emailSubject = '';
var validationRows = [];
var completerows={};
var catalogrows={};
var completerowsAcrossFiles=[];
var catalogrowsAcrossFiles=[];
var completeRowsAcrossFiles={};
var catalogRowsAcrossFiles={};
var options = {
    delimiter : ',', // default is , 
    endLine : '\n', // default is \n, 
	columns : true, // default is null
	escapeChar : '"', // default is an empty string 
    enclosedChar : '"', // default is an empty string 
    skip_empty_lines : true, //default is false
    relax_column_count : true
}

//Parse lookup tables synchronously so that all lookup tables are available prior to asynchronous processing of the input csv
lookups = loadLookups.getLookups();
var invalidCodes=lookups.mastercatalognullnamelongdesc;
// Look through each control file and clean unpaired files
cleanUnpairedFiles();
controlFiles = baseDirControlFiles;

controlFiles.forEach(function (controlFile){
	if (filesDict[controlFile] === 1) {
		fsReadStream = fs.readFileSync(baseDirectory+controlFile, 'utf8');
		var data=fsReadStream.split(/\r\n/);
		var catalogFileName = data[0].replace(/[^a-zA-Z0-9-._]+/g,'');;
		var catalogFilePath = baseDirectory+catalogFileName;
		fsReadStream = fs.readFileSync(catalogFilePath,'utf8');
		var rows=(fsReadStream.split(/\r\n|\r|\n/)).filter(function(v){return v!==''});
		completerows[catalogFileName]=[];
		catalogrows[catalogFileName]=[];
		rows.forEach(function (row){
			if(!(row.indexOf("Master Catalog Path,Code")>-1)){
				completerows[catalogFileName].push(row);
				completerowsAcrossFiles.push(row+'->'+catalogFileName);
				if(!row.startsWith(",")){
					catalogrows[catalogFileName].push(row);
					catalogrowsAcrossFiles.push(row+'->'+catalogFileName);
				}
			}
		});
	}
});

//If there are files to process
if(controlFiles.length != 0){
	// Read control files
	var controlFilesProcessedCount = 0;
	var controlFilesProcessed = [];
	controlFiles.forEach(function (controlFile){
		if (filesDict[controlFile] === 1) {
			controlFileData[controlFile]={};
		    controlFileData[controlFile].data = [];
		    controlFileData[controlFile].emailSubject = '';
		    
		    console.log('Reading control file : ' + baseDirectory + controlFile);
		    
		    var controlFileReadStream =fs.createReadStream(baseDirectory + controlFile)
			.pipe(csv({endLine : '\n'}))
			.on('data', function(controlFile){
				return function(csvrow) {
			        controlFileData[controlFile].data.push(csvrow);
				}
			}(controlFile))
			.on('end', function(controlFile){
				return function() {
					var catalogFileName = controlFileData[controlFile].data[0];
					var contactEmail = controlFileData[controlFile].data[1];
					var contactName = (controlFileData[controlFile].data[2].toString() !== "" ) ? controlFileData[controlFile].data[2] : "undefined";
					
					// Process catalog file only if control file is valid && Move catalog and control file to processing folder
					if (validateControlFile(controlFile, controlFileData[controlFile])){
		
						validationRows[catalogFileName] = {};
						validationRows[catalogFileName].rowsProcessed = 0;
						validationRows[catalogFileName].rowsPassed = 0;
						validationRows[catalogFileName].rowsFailed = 0;
					
						// Create report file for current control file
						createReportFile(reportDirectory + "Report-" + catalogFileName, controlFile);
						writeToReportFile(controlFile,'Checking ' + storeName + ' Products for Locale en_US');
					
						var csvReadStream = csv(options);
						console.log('Reading catalog file : ' + processingDirectory + catalogFileName);
						var catalofFileReadStream = fs.createReadStream(processingDirectory + catalogFileName);
						catalofFileReadStream.pipe(csvReadStream)
							.on('data', function(data){
								catalofFileReadStream.pause();
								try {
									var category = isCategory(data);
									console.log('\n***Translations Update');
									writeToReportFile(controlFile,'***Translations Update');
									if (category){
										console.log('Master Catalog Path: '+ data['Master Catalog Path']);
										writeToReportFile(controlFile,'Master Catalog Path: '+ data['Master Catalog Path']);
									}
						      		else {
						      			console.log('Item: ' + data['Code']);
							      		writeToReportFile(controlFile,'Code: '+ data['Code']);
						      		}
									// Validate the data row. Add any validation errors to error object.
									//console.log(productCreate);
									var validation = validateTranslation(data, lookups, jsonObject, catalogFileName);
																	
									if(validation.isValid && category){
										console.log('Master Catalog Path: '+ data['Master Catalog Path'] + ' Checked!\n');
										writeToReportFile(controlFile,'Category: ' + data['Master Catalog Path'] + ' Checked!');
										validationRows[catalogFileName].rowsPassed++;
							      	}
							      	else if(validation.isValid){
							      		console.log('Item: ' + data['Code'] + ' Checked!\n');
							      		writeToReportFile(controlFile,'Item: ' + data['Code'] + ' Checked!');
							      		validationRows[catalogFileName].rowsPassed++;
							      	}
							      	else if(category){
							      		console.log('Master Catalog Path: '+ data['Master Catalog Path'] + ' Failed validating item!\n');
										writeToReportFile(controlFile,'Category: ' + data['Master Catalog Path'] + ' Failed validating item!');
							      		validationRows[catalogFileName].rowsFailed++;
							      	}
							      	else{
							      		console.log('Item: ' + data['Code'] + ' Failed validating item!\n');
							      		writeToReportFile(controlFile,'Item: ' + data['Code'] + ' Failed validating item!');
							      		validationRows[catalogFileName].rowsFailed++;
							      	}
							      	
							      	// Write validation messages to report file
									validation.errorMessages.forEach(function (error){
										writeToReportFile(controlFile,error);
									});
									
							      	validationRows[catalogFileName].rowsProcessed++;
							      	validation.isValid = true; //resetting isValid. Otherwise other successful records will not be written to csv									
								} catch (err) {
									console.log(err + " ERROR: Undefined error encountered.");
									writeToReportFile(controlFile," ERROR: Undefined error encountered.");
								}
								//resume the input on the next i/o operation
								process.nextTick(function(){
									catalofFileReadStream.resume();
					      		});
							})
							.on('end', function(controlFile, catalogFileName){ return function() {
								
								writeToReportFile(controlFile,'*******  SUMMARY ********');
								writeToReportFile(controlFile,'Number of rows Processed: ' + validationRows[catalogFileName].rowsProcessed);
								writeToReportFile(controlFile,'Number of rows successfully Validated: ' + validationRows[catalogFileName].rowsPassed);
								writeToReportFile(controlFile,'*************************');
								
								
								// Move files from processing directory to Error Processing directory / Archive directory 
								var isFailed = validationRows[catalogFileName].rowsFailed > 0 || validationRows[catalogFileName].rowsProcessed == 0 ;
								var targetDirectory = isFailed ? errorProcessingDirectory : archiveDirectory;
								moveFile(controlFile, processingDirectory, targetDirectory);
								moveFile(catalogFileName, processingDirectory, targetDirectory);
								
								// Send email to authors and catalog group
								//contactEmail = "";  // TODO delete this line later. Put your email address to send email to yourself.
								if(contactEmail != ""){
									controlFileData[controlFile].emailSubject = isFailed ? ("CHECKER TRANSLATION - " + env + " - " + catalogFileName +". Error Processing Items!") :
									("CHECKER TRANSLATION - " + env + " - " + catalogFileName +". All Items were Successful!");
								if(isFailed){
									var sharedFolderPath4Email = jsonObject.baseSharedFolder4Email + translationsPath;
									
									sendValidationReportFile(reportDirectory + "Report-" + catalogFileName, errorProcessingDirectory + catalogFileName,
										contactEmail, '', controlFileData[controlFile].emailSubject, "Dear " + contactName + ", \n\nCatalog File: " + sharedFolderPath4Email + jsonObject.errorProcessingDirectory + catalogFileName + 
										"\n\nReport File: " + sharedFolderPath4Email + jsonObject.reportDirectory + "Report-" + catalogFileName + "\n\n**CHECKER ONLY** ");
								}
								else
								{
									var sharedFolderPath4Email = jsonObject.baseSharedFolder4Email + translationsPath;
																		
									sendValidationReportFile(reportDirectory + "Report-" + catalogFileName, archiveDirectory + catalogFileName,
										contactEmail, '', controlFileData[controlFile].emailSubject, "Dear " + contactName + ", \n\nCatalog File: " + sharedFolderPath4Email + jsonObject.archiveDirectory + catalogFileName + 
											"\n\nReport File: " + sharedFolderPath4Email + jsonObject.reportDirectory + "Report-" + catalogFileName + "\n\n**CHECKER ONLY** ");
								}}
								
								controlFilesProcessedCount++;
								controlFilesProcessed.push(catalogFileName);
								console.log('Finished reading catalog file : ' + catalogFileName);
								
								// Check if all catalog files are processed
								if(controlFilesProcessedCount == controlFiles.length){
									controlFilesProcessed.forEach(function (catalogFileName){
										console.log('Finished processing catalog file : ' + catalogFileName);
									});
								}
								
							}}(controlFile, catalogFileName))
							.on('error',function(err){
								console.error("An error occured while reading catalog file : " + catalogFileName  + " , Error : \n" + err);
								// TODO send an email to author
							});
				}else {
					controlFilesProcessedCount++;
				}
				
				console.log('Finished reading control file : ' + controlFile);
			}
			
		}(controlFile))
		.on('error',function(err){
			console.error("An error occured while reading control file : " + controlFile + " , Error : \n" + err);
			// TODO send an email to author
		});
		}
	});
} else {
	console.log(env + " - " + storeName + " - No catalog files to check!");
}

function cleanUnpairedFiles(){

	console.log('Cleaning unpaired files');
	var baseDirFiles = [], baseDirControlFileData = [];
	// Read source folder and look for remaining files
	var baseDirFiles = fs.readdirSync(baseDirectory);
	baseDirFiles.forEach(function (file){
		if (file.substring(0, 7) == applicationProperties.path().file.keyword.control) {
			baseDirControlFiles.push(file);
			filesDict[file] = 0;
		} else if (file.substring(0, 7) == applicationProperties.path().file.keyword.catalog) {
			filesDict[file] = 0;
		}
	});
	
	// Read control file contents and check if the catalog file is existing
	baseDirControlFiles.forEach(function (controlFile){
		baseDirControlFileData[controlFile]={};
		baseDirControlFileData[controlFile].data = [];
		baseDirControlFileData[controlFile].emailSubject = '';
	    
	    console.log('Reading control file contents : ' + baseDirectory + controlFile);
	    var controlDirFile = baseDirectory + controlFile;

		
	    var texts = fs.readFileSync(controlDirFile, 'utf8');
	
		baseDirControlFileData[controlFile].data.push(texts.split(/\r?\n/));
		var catalogFileName = baseDirControlFileData[controlFile].data[0][0].toString();
		var contactEmail = baseDirControlFileData[controlFile].data[0][1].toString();
		var contactName = (baseDirControlFileData[controlFile].data[0][2].toString() !== "") ? baseDirControlFileData[controlFile].data[0][2].toString() : "undefined";
		// Check if catalog file is in the directory
		if (filesDict[catalogFileName.trim()] != null) {
			if(controlFile.toString().toLowerCase().endsWith(".csv")){
				if(catalogFileName.toString().toLowerCase().endsWith(".csv")){
					filesDict[catalogFileName.trim()] = 1;
					filesDict[controlFile] = 1;
				}
				else{
					console.log('The File format of '+ catalogFileName +' is not supported');
					emailSubject = env + " - An error is encountered while processing Control file";
					if (contactEmail != null) {
						
						sendValidationReportFile('', errorProcessingDirectory + catalogFileName, contactEmail, '', emailSubject, 
							"Dear " + contactName + ", \n\nCatalog File: " + errorProcessingDirectory + catalogFileName + 
							"\n\n" + "The File format is not supported");
					}
				}
			}
			else{
				if(catalogFileName.toString().toLowerCase().endsWith(".csv")){
					console.log('The File format of '+ controlFile +' is not supported');
					emailSubject = env + " - An error is encountered while processing Control file";
					if (contactEmail != null) {
						
						sendValidationReportFile('', errorProcessingDirectory + controlFile, contactEmail, '' , emailSubject , 
							"Dear " + contactName + ", \n\nControl File: " + errorProcessingDirectory + controlFile + 
							"\n\n" + "The File format is not supported")
					}
				}
				else{
					console.log('The File format of '+ controlFile +' & '+ catalogFileName +' is not supported');
					emailSubject = env + " - An error is encountered while processing Control file";
					if (contactEmail != null) {
						sendValidationReportFile(errorProcessingDirectory + controlFile, errorProcessingDirectory + catalogFileName,
							contactEmail, '' , emailSubject, "Dear " + contactName + ", \n\nControl File: " + errorProcessingDirectory + controlFile + 
							"\n\n" + "Catalog File: " + errorProcessingDirectory + catalogFileName + "\n\n" + "The File formats were not supported" );
					}
				}
			}
		} else {
			console.log('Catalog file ' + catalogFileName + ' does not exists');
			emailSubject = env + " - An error is encountered while processing Control file";
			if (contactEmail != null) {
				sendValidationReportFile('', errorProcessingDirectory + controlFile, contactEmail, '' , emailSubject, 
					"Dear " + contactName + ", \n\nControl File: " + errorProcessingDirectory + controlFile + "\n\n" + "Catalog file doesn't exist");			
			}
		}
	});
	
	var baseDirFiles = fs.readdirSync(baseDirectory);
	baseDirFiles.forEach(function (file){
		if (filesDict[file] == 0) {
			moveFile(file, baseDirectory, errorProcessingDirectory);
			console.log(file + ' is moved to errorProcessing');
		}
	});
}

// send validation report file via email
function sendValidationReportFile(reportFilePath, catalogFilePath, recipient, copyEmails, emailSubject, emailBody) {
	var mailSettings = {
		smtpHost: systemProperties.path().catman.smtpHost,
		smtpPort: systemProperties.path().catman.smtpPort,
		emailFrom: systemProperties.path().catman.emailFrom
	};

	var catalogFilePathArray = catalogFilePath.split('/');
	var catalogFileName = catalogFilePathArray[catalogFilePathArray.length - 1];
	var reportFilePathArray = reportFilePath.split('/');
	var reportFileName = reportFilePathArray[reportFilePathArray.length - 1];
	
		if (reportFilePath != ''){
			var attachments = [
			{
				filename: catalogFileName,
				path: catalogFilePath
			},{
				filename: reportFileName,
				path: reportFilePath
			}
			];
		} else {
			var attachments = [
				{
					filename: catalogFileName,
					path: catalogFilePath
				}	
			];
		}

	mailer.sendEmailAttachment(mailSettings, recipient, copyEmails, emailSubject, emailBody, attachments);
}

function createReportFile(reportFilePath, controlFile){

	var writeoptions = {
		delimiter : ',', // default is , 
		endLine : '\n', // default is \n, 
		columns : false, // default is null
		escapeChar : '"', // default is an empty string 
		enclosedChar : '"' // default is an empty string
	}
	
	reportOutputStream[controlFile] = stringify(writeoptions);
	reportOutputStream[controlFile].on('readable', function(){
		if (fsReportOutputStream[controlFile] === undefined)
			fsReportOutputStream[controlFile] = fs.createWriteStream(reportFilePath, {highWaterMark: Math.pow(2,14)});
		while(row = reportOutputStream[controlFile].read()){
			fsReportOutputStream[controlFile].write(row);
		}
	})
	reportOutputStream[controlFile].on('error', function(err){
		console.log(err.message);
	})
	reportOutputStream[controlFile].on('finish', function(){
		fsReportOutputStream[controlFile].end();
	})
	
}
	
	
function moveFile(file, sourceDir, targetDir){
	fs.renameSync(sourceDir + '/' + file, targetDir+ '/' + file);
}
	
function checkArguments(){
	var envs = ['local','dev','stage','prod'];
	var stores = ['emr','fan','proteam','wsv','literature'];
	if(env === undefined){
		env = "local";
		console.log('Please provide environment argument. Allowed values are : ' + envs);
		process.exit(1);
	}else if(envs.indexOf(env) < 0){
		console.log('Please provide valid environment argument. Allowed values are : ' + envs);
		process.exit(1);
	}
	if(storeName === undefined){
		storeName = "emr";
		console.log('Please provide store argument. Allowed values are : ' + stores);
		process.exit(1);
	}else if(stores.indexOf(storeName) < 0){
		console.log('Please provide valid store argument. Allowed values are : ' + stores);
		process.exit(1);
	}
}
	
function validateControlFile(controlFile, controlFileData){
	var catalogFileName = controlFileData.data[0];
	var contactEmail = controlFileData.data[1];
	var contactName = (controlFileData.data[2].toString() !== "") ? controlFileData.data[2] : "undefined";
		
	var isValid = true;
	var emailSubject = "";
	
	//move control file to processing directory
	moveFile(controlFile, baseDirectory, processingDirectory);
	console.log('Control file is moved to processingDirectory: ' + controlFile);
	
	//validate that both Catalog Filename and Contact Email has value
	if (catalogFileName && contactEmail) {
		
		//validate Catalog Filename
		if(catalogFileName.toString().toLowerCase().indexOf('.csv') == -1){
			console.log('Catalog file is not valid for control file (not csv): ' + controlFile);
			emailSubject = env + " - An error is encountered while processing Control file";

			sendValidationReportFile('', errorProcessingDirectory + controlFile, contactEmail, '', emailSubject,
				"Dear " + contactName + ", \n\nControl File: " + errorProcessingDirectory + controlFile + "\n\n" + "Catalog file is not valid");
			
			moveFile(controlFile, processingDirectory, errorProcessingDirectory);
			isValid = false;
		} else {
			//validate if file exists
			if(!(fs.existsSync(baseDirectory + catalogFileName))){
				console.log('Catalog file ' + catalogFileName + ' does not exists');
				emailSubject = env + " - An error is encountered while processing Control file";

				sendValidationReportFile('', errorProcessingDirectory + controlFile, contactEmail, '' , emailSubject ,
				"Dear " + contactName + ", \n\nControl File: " + errorProcessingDirectory + controlFile + "\n\n" + "Catalog file doesn't exists");

				moveFile(controlFile, processingDirectory, errorProcessingDirectory);
				isValid = false;
			}else{
				//move catalog file to processing directory
				moveFile(catalogFileName, baseDirectory, processingDirectory);
				console.log('Catalog file is moved to processingDirectory: ' + catalogFileName);
			}
		}
	} else {
		console.log('Catalog filename/Email address in missing in ' + controlFile);
		emailSubject = env + " - An error is encountered while processing Control file";

		sendValidationReportFile('', errorProcessingDirectory + controlFile, contactEmail, '' , emailSubject , 
			"Dear " + contactName + ", \n\nControl File: " + errorProcessingDirectory + controlFile + "\n\n" + "Catalog filename/Email address in missing");
			
		moveFile(controlFile, processingDirectory, errorProcessingDirectory);
		isValid = false;
	}
	
	return isValid;
}

function writeToReportFile(controlFile, text) {
	//TBD: look into NPM package for date format
	var now = new Date();
	var reportField1 = now.getDate() + '-' + now.toLocaleString('en-us', { month: "short" });
	var hour = now.getHours();
	var timeStamp;
	
	if (hour > 12)
		timeStamp = now.getFullYear() + ' ' + (hour -12) + ':' + now.getMinutes() + ':' + now.getSeconds() + ' PM ';
	else
		timeStamp = now.getFullYear() + ' ' + hour + ':' + now.getMinutes() + ':' + now.getSeconds() + ' AM ';
	
	reportOutputStream[controlFile].write([reportField1, timeStamp +  text]);
}

//For EDS-4930 To validate catalog files


function validateTranslation(data, lookups, jsonProperties, catalogFileName)
{	
	var check=true;
	var validation = {
	        isValid: true,
	        errorMessages: []
    };

	var code = "";
	var master = "";
	if (data['Code'] === undefined) {
		code = "";
	}
	else {
		code = data['Code'];
	}
	
	if (data['Master Catalog Path'] === undefined) {
		master = "";
	}
	else {
		master = data['Master Catalog Path'];
	}
	
	var sourceLocale = data['Source Locale'];
	var translateLocale = data['Translation Locale'];
	var translateStatus = data['Translation Status'];
	
	if(code !== "" && master !== "")
	{
		console.log("@@@ERROR: Only Master Catalog Path or Code should be listed");
		validation.errorMessages.push("@@@ERROR: Only Master Catalog Path or Code should be listed");
		check=false;
		validation.isValid = false;
	}
	
	if(code === "" && master === "")
	{
		console.log("@@@ERROR: Master Catalog Path or Code is required");
		validation.errorMessages.push("@@@ERROR: Master Catalog Path or Code is required");
		check=false;
		validation.isValid = false;
		
	}
	
	if(code !== "" && master === "")
	{
		
		if(lookups.mastercataloglookup[code] === undefined || lookups.mastercataloglookup[code] === "")
		{
			console.log("@@@ERROR:  Invalid Code");
			validation.errorMessages.push("@@@ERROR:  Invalid Code");
			check=false;
			validation.isValid = false;
		}
		
	}
	
	if(code === "" && master !== "")
	{
		
		if(lookups.mastercatcategorylookup[master] === undefined || lookups.mastercatcategorylookup[master] === "")
		{
			console.log("@@@ERROR:  Invalid Master Catalog Path");
			validation.errorMessages.push("@@@ERROR:  Invalid Master Catalog Path");
			check=false;
			validation.isValid = false;
		}
		
	}
	
	if(translateStatus === "" || translateStatus === undefined)
	{
		console.log("@@@ERROR: Translation Status is required and missing");
		validation.errorMessages.push("@@@ERROR: Translation Status is required and missing");
		validation.isValid = false;
	}
	
	else if(translateStatus !== "Approved For Translation" && translateStatus !== "Approved For Publish")
	{
		console.log("@@@ERROR: Invalid Translation Status");
		validation.errorMessages.push("@@@ERROR: Invalid Translation Status");
		validation.isValid = false;
	}
	
	
	if(sourceLocale === "" || sourceLocale === undefined)
	{
		console.log("@@@ERROR: Source Locale is required and missing");
		validation.errorMessages.push("@@@ERROR: Source Locale is required and missing");
		validation.isValid = false;
	}
	else if(sourceLocale !== "en_US")
	{
		console.log("@@@ERROR: Invalid Source Locale");
		validation.errorMessages.push("@@@ERROR: Invalid Source Locale");
		validation.isValid = false;
	}
		
	var transLocale = validateTranslationLocale(data,jsonProperties);
	
	if(translateLocale === "" || translateLocale === undefined)
	{
		console.log("@@@ERROR: Translation Locale is required and missing");
		validation.errorMessages.push("@@@ERROR: Translation Locale is required and missing");
		validation.isValid = false;
	}
	else if(transLocale === 0)
	{
		console.log("@@@ERROR: Invalid Translation Locale");
		validation.errorMessages.push("@@@ERROR: Invalid Translation Locale");
		validation.isValid = false;
	}

	var isDeprecated = validateDeprecatedLocales(data, jsonProperties);
	
	if(isDeprecated) {
		validation.isValid = false;
	}
	
	var row = master+','+code+','+translateStatus+','+sourceLocale+','+translateLocale;
	var completeRows = completerows[catalogFileName];
	if(checkDuplicates(row,completeRows))
	{
		console.log("@@@ERROR: Duplicate Entry");
		validation.errorMessages.push("@@@ERROR: Duplicate Entry");
		validation.isValid = false;
	}
	if(completeRowsAcrossFiles[catalogFileName] == undefined || completeRowsAcrossFiles[catalogFileName] == ''){
		completeRowsAcrossFiles[catalogFileName] = completerowsAcrossFiles.slice();
		completeRows.forEach(function (completeRow){
			var n = completeRowsAcrossFiles[catalogFileName].indexOf(completeRow+'->'+catalogFileName);
			completeRowsAcrossFiles[catalogFileName].splice(n,1);
		});
	}
	var duplicates = checkDuplicatesAcrossFiles(row,completeRowsAcrossFiles[catalogFileName]);
	var files = '';
	duplicates[1].forEach(function (file){
		if(files.indexOf(file) < 0){
			if(files == ''){
				files = file;
			}
			else{
				files = files +', '+ file;
			}
		}
	});
	if(duplicates[0])
	{
		console.log("@@@ERROR: Duplicate Entry from file(s) "+files);
		validation.errorMessages.push("@@@ERROR: Duplicate Entry from file(s) "+files);
		validation.isValid = false;
	}
	var rowattr = translateStatus+','+sourceLocale+','+translateLocale;
	var catalogRows = catalogrows[catalogFileName];
	var result = checkParentDuplicates(code,master,lookups,rowattr,catalogRows);
	if(catalogRowsAcrossFiles[catalogFileName] == undefined || catalogRowsAcrossFiles[catalogFileName] == ''){
		catalogRowsAcrossFiles[catalogFileName] = catalogrowsAcrossFiles.slice();
		catalogRows.forEach(function (catalogRow){
			var n = catalogRowsAcrossFiles[catalogFileName].indexOf(catalogRow+'->'+catalogFileName);
			catalogRowsAcrossFiles[catalogFileName].splice(n,1);
		});
	}
	var masters = '';
	result[1].forEach(function (master){
		if(masters.indexOf(master) < 0){
			if(masters == ''){
				masters = master;
			}
			else{
				masters = masters +', '+ master;
			}
		}
	});
	if(check && catalogRows.length!=0 && result[0])
	{
		console.log("@@@ERROR: Duplicate Entry caused by Master Catalog Path "+masters);
		validation.errorMessages.push("@@@ERROR: Duplicate Entry caused by Master Catalog Path "+masters);
		validation.isValid = false;
	}
	var resultAcrossFiles = checkParentDuplicatesAcrossFiles(code,master,lookups,rowattr,catalogRowsAcrossFiles[catalogFileName]);
	masters = '';
	resultAcrossFiles[1].forEach(function (master){
		if(masters.indexOf(master) < 0){
			if(masters == ''){
				masters = master;
			}
			else{
				masters = masters +', '+ master;
			}
		}
	});
	files = '';
	resultAcrossFiles[2].forEach(function (file){
		if(files.indexOf(file) < 0){
			if(files == ''){
				files = file;
			}
			else{
				files = files +', '+ file;
			}
		}
	});
	if(check && catalogRows.length!=0 && resultAcrossFiles[0])
	{
		console.log("@@@ERROR: Duplicate Entry caused by Master Catalog Path "+masters+" from file(s) "+files);
		validation.errorMessages.push("@@@ERROR: Duplicate Entry caused by Master Catalog Path "+masters+" from file(s) "+files);
		validation.isValid = false;
	}
	if(check && code === ""){
		var codes = validateMasterNameLongDesc(master);
		if(codes != ""){
			console.log("@@@ERROR: Name and Long Description are found to be NULL for item(s) "+codes);
			validation.errorMessages.push("@@@ERROR: Name and Long Description are found to be NULL for item(s) "+codes);
			validation.isValid = false;
		}
	}
	else if(check && master ==="" && validateCodeNameLongDesc(code)){
		console.log("@@@ERROR: Name and Long Description are found to be NULL for item "+code);
		validation.errorMessages.push("@@@ERROR: Name and Long Description are found to be NULL for item "+code);
		validation.isValid = false;
	}
	return validation
}

function validateTranslationLocale(data,jsonProperties) {
	var locale = data['Translation Locale'];
    if (locale in jsonProperties.validLocales)
	{
		return 1;
	}
	else
	{
		return 0;
	}
}

function validateDeprecatedLocales(data, jsonProperties){
	var locale = data['Translation Locale'];
	var isDeprecated = false;

	if  (locale !== undefined && locale !== ''){
		if(jsonProperties.deprecatedLocales.indexOf(locale) !== -1){
			console.log("@@@Warning: Deprecated Locale encountered!!")
			isDeprecated = true;
		}
	}

	return isDeprecated;
}

function isCategory(data){
	var check=false;
	var masterCatalogPath=data['Master Catalog Path'];
	if(masterCatalogPath !== undefined && masterCatalogPath.trim() !== ''){
		check=true;
	}
	return check;
}

function checkDuplicates(row,completeRows) {
	var check = false;
	var count = 0;
	completeRows.forEach(function (completeRow){
		if(completeRow.split(",").length-1 > 4){
			var n = completeRow.split(",", 5).join(",").length;
			completeRow = completeRow.slice(0, n);
		}
		if(completeRow == row){
			count++;
		}
	});
	if(count>1){
		check = true;
	}
	return check;
}

function checkDuplicatesAcrossFiles(row,completeRows) {
	var check = false;
	var duplicateFiles = [];
	completeRows.forEach(function (completeRow){
		if(completeRow.split(",").length-1 > 4){
			var n = completeRow.split(",", 5).join(",").length;
			var completeRow1 = completeRow.slice(0, n);
		}
		if(completeRow1 == row){
			check = true;
			duplicateFiles.push(completeRow.slice(completeRow.lastIndexOf('->')+2));
		}
	});
	return [check,duplicateFiles];
}

function checkParentDuplicates(code,master,lookups,rowattr,catalogRows) {
	var check = false;
	var parentMaster = (lookups.mastercategorylookup[master] == undefined) ? "" : lookups.mastercategorylookup[master];
	var topParentMaster = (lookups.mastercategorylookup[parentMaster] == undefined) ? "" : lookups.mastercategorylookup[parentMaster];
	var codeIdentifier = (lookups.mastercataloglookup[code] == undefined) ? "" : lookups.mastercataloglookup[code];
	var parentIdentifier = (lookups.mastercategorylookup[codeIdentifier] == undefined) ? "" : lookups.mastercategorylookup[codeIdentifier];
	var topParentIdentifier = (lookups.mastercategorylookup[parentIdentifier] == undefined) ? "" : lookups.mastercategorylookup[parentIdentifier];
	var duplicateMaster = [];
	catalogRows.forEach(function (catalogRow){
		var n = catalogRow.indexOf(",", catalogRow.indexOf(",") + 1)+1;
		if(catalogRow.split(",").length-1 > 4){
			var m = catalogRow.split(",", 5).join(",").length;
			catalogattr = catalogRow.slice(n,m);
		} else {
			catalogattr = catalogRow.slice(n);
		}		
		if(catalogattr == rowattr){
			n = catalogRow.indexOf(",");
			var masterCatalogPath = catalogRow.slice(0, n);
			if(code == ""){
				if(parentMaster == masterCatalogPath || topParentMaster == masterCatalogPath){
					check = true;
					duplicateMaster.push(masterCatalogPath);
				}
			} else {
				if(codeIdentifier == masterCatalogPath || parentIdentifier == masterCatalogPath || topParentIdentifier == masterCatalogPath){
					check = true;
					duplicateMaster.push(masterCatalogPath);
				}
			}
		}
	});
	return [check,duplicateMaster];
}

function checkParentDuplicatesAcrossFiles(code,master,lookups,rowattr,catalogRows) {
	var check = false;
	var parentMaster = (lookups.mastercategorylookup[master] == undefined) ? "" : lookups.mastercategorylookup[master];
	var topParentMaster = (lookups.mastercategorylookup[parentMaster] == undefined) ? "" : lookups.mastercategorylookup[parentMaster];
	var codeIdentifier = (lookups.mastercataloglookup[code] == undefined) ? "" : lookups.mastercataloglookup[code];
	var parentIdentifier = (lookups.mastercategorylookup[codeIdentifier] == undefined) ? "" : lookups.mastercategorylookup[codeIdentifier];
	var topParentIdentifier = (lookups.mastercategorylookup[parentIdentifier] == undefined) ? "" : lookups.mastercategorylookup[parentIdentifier];
	var duplicateMaster = [];
	var duplicateFiles = [];
	catalogRows.forEach(function (catalogRow){
		var n = catalogRow.indexOf(",", catalogRow.indexOf(",") + 1)+1;
		if(catalogRow.split(",").length-1 > 4){
			var m = catalogRow.split(",", 5).join(",").length;
			catalogattr = catalogRow.slice(n,m);
		} else {
			catalogattr = catalogRow.slice(n);
		}		
		if(catalogattr == rowattr){
			n = catalogRow.indexOf(",");
			var masterCatalogPath = catalogRow.slice(0, n);
			if(code == ""){
				if(parentMaster == masterCatalogPath || topParentMaster == masterCatalogPath){
					check = true;
					duplicateMaster.push(masterCatalogPath);
					duplicateFiles.push(catalogRow.slice(catalogRow.lastIndexOf('->')+2));
				}
			} else {
				if(codeIdentifier == masterCatalogPath || parentIdentifier == masterCatalogPath || topParentIdentifier == masterCatalogPath){
					check = true;
					duplicateMaster.push(masterCatalogPath);
					duplicateFiles.push(catalogRow.slice(catalogRow.lastIndexOf('->')+2));
				}
			}
		}
	});
	return [check,duplicateMaster,duplicateFiles];
}
function validateMasterNameLongDesc(master){
	var matched = [];
	invalidCodes.forEach(function (invalidCode){
		var parent = lookups.mastercataloglookup[invalidCode];
		while(!(parent == undefined || master == parent)){
			parent = lookups.mastercategorylookup[parent];
		}
		if(parent != undefined){
			matched.push(invalidCode);
		}
	});
	return matched.toString();
}
function validateCodeNameLongDesc(code){
	if(invalidCodes.indexOf(code)>-1){
		return true;
	}
	return false;
};