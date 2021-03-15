//// fetch params
var env = process.argv[2];
var storeName = process.argv[3];
var buildtag = '';

if (process.argv[4] !== undefined) {
	buildtag = process.argv[4];
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
var dataHelper = require(cmModulesPath + systemProperties.path().catman.dataHelper);

console.log('Processing ' +  storeName + ' Store');

var lookups, outputStreams;
var reportOutputStream = [];
var fsReportOutputStream = [];
var controlFiles = [], baseDirControlFiles = [], baseDirCatalogFiles = [], controlFileData = [];
var filesDict = {};

//// Validate arguments
checkArguments();

var jsonReader = require("./cm_modules/jsonReader");
var jsonObject = jsonReader.getJsonProperties(env, storeName);

var csv = require('csv-parse');
var fs = require('fs');
var os = require('os');
var loadLookups = require('./cm_modules/loadLookups');
var loadOutputStreams = require('./cm_modules/loadOutputStreams-' + storeName);
var recordValidator = require('./cm_modules/recordValidator-' + storeName);
var recordWriter = require('./cm_modules/recordWriter-' + storeName);
var stringify = require('csv-stringify');
var mailer = require('./cm_modules/email');

//TMP: comments - coding guides compliant
// property variable from new property files impl
var catmanBaseSharedDir = environmentProperties.path().catman.baseSharedDirectory;
var serverCatManBaseSharedWorkspaceDir = catmanBaseSharedDir + systemProperties.path().catman.workspaceDefault;

//// initialize variables
var baseDirectory = jsonObject.baseSharedDirectory + jsonObject.storePath;
var processingDirectory = baseDirectory + jsonObject.processingDirectory;
var errorProcessingDirectory = baseDirectory + jsonObject.errorProcessingDirectory;
var reportDirectory = baseDirectory + jsonObject.reportDirectory;
var archiveDirectory = baseDirectory + jsonObject.archiveDirectory;
var emailSubject = '';
var validationErrors = [];
var validationWarnings = [];
var reportEmailStatus = [];
var emrFail = 0, emrPass = 0, emrNew = 0, emrExisting = 0;
var fansFail = 0, fansPass = 0,fansNew = 0,fansExisting = 0;
var climateFail = 0,climatePass = 0,climateNew = 0,climateExisting = 0;
var iseFail = 0, isePass = 0, iseNew = 0, iseExisting = 0;
var sensiFail = 0,sensiPass = 0,sensiNew = 0, sensiExisting = 0;
var proteamFail = 0, proteamPass = 0, proteamNew = 0, proteamExisting = 0;
var pairedControlFiles = {};

//TBD: code refactoring - rewrite this function of writing header per each request file processing
var localeArr =[];

var controlFilesProcessedCount;
var controlFilesProcessed;

var options = {
    delimiter : ',', // default is ,
    endLine : '\n', // default is \n,
	columns : true, // default is null
    escapeChar : '"', // default is an empty string
    enclosedChar : '"', // default is an empty string
    skip_empty_lines : true, //default is false
    relax_column_count : true
}

var currtime = new Date();
var batchid = buildtag + '-' + currtime.getFullYear() + ("0"+(currtime.getMonth()+1)).slice(-2)
	+ ("0"+currtime.getDate()).slice(-2) + ("0"+currtime.getHours()).slice(-2)
	+ ("0"+currtime.getMinutes()).slice(-2) + ("0"+currtime.getSeconds()).slice(-2)
	+ ("00"+currtime.getMilliseconds()).slice(-3);

// Disable pre-processing and build index if no catalog files provided.
var existDeltaPreprocessControlFile = false;
var preprocessControlPath = environmentProperties.path().catman.rootDirectory + systemProperties.path().catman.workspaceDefault + systemProperties.path().catman.wrkspcResource + constants.DELTA_PREPROCESS_CONTROL;
writeDeltaPreprocessControlFile(storeName);

// Parse lookup tables synchronously so that all lookup tables are available prior to asynchronous processing of the input csv
lookups = loadLookups.getLookups();

// Create dataload output steams and populate the headers
outputStreams = loadOutputStreams.getOutputStreams(jsonObject, batchid);

// Look through each control file and clean unpaired files
cleanUnpairedFiles();

controlFiles = baseDirControlFiles;

// If there are files to process
if(controlFiles.length != 0){
	// Read control files
	controlFilesProcessedCount = 0;
	controlFilesProcessed = [];
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
					var contactName = (controlFileData[controlFile].data[2].toString() !== "") ? controlFileData[controlFile].data[2] : "undefined";
					var runRequest = controlFileData[controlFile].data[3];

					if (genericUtil.isUndefined(runRequest)) {
						runRequest = applicationProperties.path().transform.runrequestcode.catentryDefault;
					} else {
						runRequest = runRequest[0];
					}

					// Process catalog file only if control file is valid && Move catalog and control file to processing folder
					if (validateControlFile(controlFile, controlFileData[controlFile])){

						validationErrors[catalogFileName] = {};
						validationErrors[catalogFileName].itemsProcessed = 0;
						validationErrors[catalogFileName].itemsSaved = 0;
						//EDS-6998/8017 Enable delta pre-process and build index only if catalog file exist
						if (!existDeltaPreprocessControlFile) {
							writeDeltaPreprocessControlFile(storeName);
							existDeltaPreprocessControlFile=true;
						}
						// Create report file for current control file
						createReportFile(reportDirectory + "Report-" + catalogFileName, controlFile);

						var csvReadStreamLocale = csv(options);
						var csvReadStream = csv(options);
						
						//TBD: code refactoring - rewrite this please! - separate function
						//EDS-5685 Start Locale specific header
						localeArr.splice(0);
						var catalofFileReadStreamLocale = fs.createReadStream(processingDirectory + catalogFileName);
						catalofFileReadStreamLocale.pipe(csvReadStreamLocale)
						.on('data', function(localeData){
							catalofFileReadStreamLocale.pause();
							createLocaleArray(localeData);
							//resume the input on the next i/o operation
							process.nextTick(function(){
								catalofFileReadStreamLocale.resume();
				      		});
						})
						.on('error',function(err){
							console.error("An error occured while reading catalog file : " + catalogFileName  + " , Error : \n" + err);
						});
						//EDS-5685 End Locale specific header
						//TBD: end

						console.log('Reading catalog file : ' + processingDirectory + catalogFileName);
					 
						// Check the runRequest
						//TBD: code refactoring - rewrite this!!!!!!!
						if (runRequest.trim() == applicationProperties.path().transform.runrequestcode.catentryComponent) {

							var writeCatEntHeaderExecuted=false;
							var rRequest = applicationProperties.path().transform.runrequestcode.catentryComponent;
							var catalofFileReadStream = fs.createReadStream(processingDirectory + catalogFileName);

							catalofFileReadStream.pipe(csvReadStream)
								.on('data', function(data){
									catalofFileReadStream.pause();
									if (!writeCatEntHeaderExecuted){
										createReportHeader(data,controlFile,storeName,localeArr);
										writeCatEntHeaderExecuted = true;
									}
									try {
										trimDataKeys(data);
										if (recordValidator.validateComponentRow(data)) {
											// Validate the data row. Add any validation errors to error object.
											var validation = recordValidator.validateComponent(data, lookups, jsonObject, lookupsBuilder);
											validationWarnings[catalogFileName] = validation.isWarning;
											writeToReportFile(controlFile,'***Association Update');
											writeToReportFile(controlFile,'Child Code: ' + recordValidator.getChildCode(data));

											// If valid row, write to the dataload csv files.
								      		if(validation.isValid){
								      			recordWriter.write(data, outputStreams, lookups, jsonObject, rRequest);
								      			validationErrors[catalogFileName].itemsSaved++;
								      			writeToReportFile(controlFile,'Item: ' + recordValidator.getChildCode(data) + ' Saved!');
								      			//TODO specify item
								      		}
								      		else{
								      			writeToReportFile(controlFile,'Item: ' + recordValidator.getChildCode(data) + ' Failed saving item!');
								      		}

								      		// Write validation messages to report file
											validation.errorMessages.forEach(function (error){
												//repotOutputStream[controlFile].write(error + '\n');
												writeToReportFile(controlFile,error);
											});

								      		validationErrors[catalogFileName].itemsProcessed++;
								      		validation.isValid = true; //resetting isValid. Otherwise other successful records will not be written to csv

										} else {
											writeToReportFile(controlFile,' ERROR: Invalid row detected. Component Code, Component Type, Child Code and Sequence is null.');
										}
									} catch (err) {
										console.log(err.toString() + " ERROR: Undefined error encountered.");
										writeToReportFile(controlFile," ERROR: Undefined error encountered.");
									}
									//resume the input on the next i/o operation
									process.nextTick(function(){
										catalofFileReadStream.resume();
						      		});
							})
								.on('end', function(controlFile, catalogFileName){ return function() {

									writeToReportFile(controlFile,'*******  SUMMARY ********');
									//repotOutputStream[controlFile].write('Number of Items Processed: ' + validationErrors[catalogFileName].itemsProcessed + '\n');
									writeToReportFile(controlFile,'Number of Items Processed: ' + validationErrors[catalogFileName].itemsProcessed);
									//repotOutputStream[controlFile].write('Number of Items Saved: ' + validationErrors[catalogFileName].itemsSaved + '\n');
									writeToReportFile(controlFile,'Number of Items Saved: ' + validationErrors[catalogFileName].itemsSaved);
									writeToReportFile(controlFile,'*************************');

									// Move files from processing directory to Error Processing directory / Archive directory
									var itemsFailed = validationErrors[catalogFileName].itemsSaved < validationErrors[catalogFileName].itemsProcessed || (validationErrors[catalogFileName].itemsSaved == 0 && validationErrors[catalogFileName].itemsProcessed == 0);
									var targetDirectory = itemsFailed ? errorProcessingDirectory : archiveDirectory;
									moveFile(controlFile, processingDirectory, targetDirectory);
									moveFile(catalogFileName, processingDirectory, targetDirectory);

									// Send email to authors and catalog group
									//contactEmail = "";  // TODO delete this line later. Put your email address to send email to yourself.
									if(contactEmail != ""){
										if(itemsFailed){
											controlFileData[controlFile].emailSubject = env + " - " + catalogFileName +" Log File. Error Saving Products!";
											var sharedFolderPath4Email = jsonObject.baseSharedFolder4Email + jsonObject.storePath;
											sendValidationReportFile(serverCatManBaseSharedWorkspaceDir + jsonObject.reportDirectory + "Report-" + catalogFileName, 
												serverCatManBaseSharedWorkspaceDir + jsonObject.errorProcessingDirectory + catalogFileName, 
												contactEmail, jsonObject.catalogGroup, controlFileData[controlFile].emailSubject, 
												"Dear " + contactName + ", \n\nCatalog File: " + sharedFolderPath4Email + jsonObject.errorProcessingDirectory + catalogFileName + 
												"\n\nReport File: " + sharedFolderPath4Email + jsonObject.reportDirectory + "Report-" + catalogFileName);
										}
										else{
											controlFileData[controlFile].emailSubject = validationWarnings[catalogFileName] ? (env + " - " + catalogFileName +" Log File. Warning Saving Products!") :
												(env + " - " + catalogFileName +" Log File. All Product Items were Added Successfully!");
											var sharedFolderPath4Email = jsonObject.baseSharedFolder4Email + jsonObject.storePath;
											sendValidationReportFile(serverCatManBaseSharedWorkspaceDir + jsonObject.reportDirectory + "Report-" + catalogFileName, 
												serverCatManBaseSharedWorkspaceDir + jsonObject.archiveDirectory + catalogFileName, 
												contactEmail, jsonObject.catalogGroup, controlFileData[controlFile].emailSubject, 
												"Dear " + contactName + ", \n\nCatalog File: " + sharedFolderPath4Email + jsonObject.archiveDirectory + catalogFileName + 
												"\n\nReport File: " + sharedFolderPath4Email + jsonObject.reportDirectory + "Report-" + catalogFileName);
										}
									}

									controlFilesProcessedCount++;
									controlFilesProcessed.push(catalogFileName);

									console.log('Finished reading catalog file : ' + catalogFileName);

									// Check if all catalog files are processed, send an email to catalog group
									if(controlFilesProcessedCount == controlFiles.length) {
										sendRequestsSummaryReportEmail();
									}

								}}(controlFile, catalogFileName))
								.on('error',function(err){
									console.error("An error occured while reading catalog file : " + catalogFileName  + " , Error : \n" + err);
									// TODO send an email to author
								});
						} else if (runRequest.trim() == applicationProperties.path().transform.runrequestcode.catentryParentCatGrpRel) {

								var writeCatGrpHeaderExecuted=false;	
								var rRequest = applicationProperties.path().transform.runrequestcode.catentryParentCatGrpRel;
							    var catalofFileReadStream = fs.createReadStream(processingDirectory + catalogFileName);
								
								catalofFileReadStream.pipe(csvReadStream)
								.on('data', function(data){
									catalofFileReadStream.pause();
									if (!writeCatGrpHeaderExecuted){
										createReportHeader(data,controlFile,storeName,localeArr);
										writeCatGrpHeaderExecuted = true;
									}
									try {
										trimDataKeys(data);
										if (recordValidator.validateSequenceRow(data)) {
											// Validate the data row. Add any validation errors to error object.
											var validation = recordValidator.validateSequenceComponent(data, lookups, jsonObject, lookupsBuilder);
											validationWarnings[catalogFileName] = validation.isWarning;
											writeToReportFile(controlFile,'***Sequence Update');
											writeToReportFile(controlFile,'Child Code: ' + recordValidator.getCodePartNumber(data));

											// If valid row, write to the dataload csv files.
								      		if(validation.isValid){
												recordWriter.write(data, outputStreams, lookups, jsonObject, rRequest);
								      			validationErrors[catalogFileName].itemsSaved++;
								      			writeToReportFile(controlFile,'Item: ' + recordValidator.getCodePartNumber(data) + ' Saved!');
								      			//TODO specify item
								      		}
								      		else{
								      			writeToReportFile(controlFile,'Item: ' + recordValidator.getCodePartNumber(data) + ' Failed saving item!');
								      		}

								      		// Write validation messages to report file
											validation.errorMessages.forEach(function (error){
												//repotOutputStream[controlFile].write(error + '\n');
												writeToReportFile(controlFile,error);
											});

								      		validationErrors[catalogFileName].itemsProcessed++;
								      		validation.isValid = true; //resetting isValid. Otherwise other successful records will not be written to csv

										} else {
											writeToReportFile(controlFile,' ERROR:  Child ID, Parent ID and Store is null.');
										}
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
									//repotOutputStream[controlFile].write('Number of Items Processed: ' + validationErrors[catalogFileName].itemsProcessed + '\n');
									writeToReportFile(controlFile,'Number of Items Processed: ' + validationErrors[catalogFileName].itemsProcessed);
									//repotOutputStream[controlFile].write('Number of Items Saved: ' + validationErrors[catalogFileName].itemsSaved + '\n');
									writeToReportFile(controlFile,'Number of Items Saved: ' + validationErrors[catalogFileName].itemsSaved);
									writeToReportFile(controlFile,'*************************');

									// Move files from processing directory to Error Processing directory / Archive directory
									var itemsFailed = validationErrors[catalogFileName].itemsSaved < validationErrors[catalogFileName].itemsProcessed || (validationErrors[catalogFileName].itemsSaved == 0 && validationErrors[catalogFileName].itemsProcessed == 0);
									var targetDirectory = itemsFailed ? errorProcessingDirectory : archiveDirectory;
									moveFile(controlFile, processingDirectory, targetDirectory);
									moveFile(catalogFileName, processingDirectory, targetDirectory);

									// Send email to authors and catalog group
									//contactEmail = "";  // TODO delete this line later. Put your email address to send email to yourself.
									if(contactEmail != ""){
										if(itemsFailed){
											controlFileData[controlFile].emailSubject = env + " - " + catalogFileName +" Log File. Error Updating Sequence!";
											var sharedFolderPath4Email = jsonObject.baseSharedFolder4Email + jsonObject.storePath;
											sendValidationReportFile(serverCatManBaseSharedWorkspaceDir + jsonObject.reportDirectory + "Report-" + catalogFileName, 
												serverCatManBaseSharedWorkspaceDir + jsonObject.errorProcessingDirectory + catalogFileName, 
												contactEmail, jsonObject.catalogGroup, controlFileData[controlFile].emailSubject, 
												"Dear " + contactName + ", \n\nCatalog File: " + sharedFolderPath4Email + jsonObject.errorProcessingDirectory + catalogFileName + 
												"\n\nReport File: " + sharedFolderPath4Email + jsonObject.reportDirectory + "Report-" + catalogFileName);
										}
										else{
											controlFileData[controlFile].emailSubject = validationWarnings[catalogFileName] ? (env + " - " + catalogFileName +" Log File. Warning Updating Sequence!") :
												(env + " - " + catalogFileName +" Log File. All Product Items were Updated Successfully!");
											var sharedFolderPath4Email = jsonObject.baseSharedFolder4Email + jsonObject.storePath;
											sendValidationReportFile(serverCatManBaseSharedWorkspaceDir + jsonObject.reportDirectory + "Report-" + catalogFileName, 
												serverCatManBaseSharedWorkspaceDir + jsonObject.archiveDirectory + catalogFileName, 
												contactEmail, jsonObject.catalogGroup, controlFileData[controlFile].emailSubject, 
												"Dear " + contactName + ", \n\nCatalog File: " + sharedFolderPath4Email + jsonObject.archiveDirectory + catalogFileName + 
												"\n\nReport File: " + sharedFolderPath4Email + jsonObject.reportDirectory + "Report-" + catalogFileName);
										}
									}

									controlFilesProcessedCount++;
									controlFilesProcessed.push(catalogFileName);

									console.log('Finished reading catalog file : ' + catalogFileName);

									// Check if all catalog files are processed, send an email to catalog group
									if(controlFilesProcessedCount == controlFiles.length) {
										sendRequestsSummaryReportEmail();
									}

								}}(controlFile, catalogFileName))


								.on('error',function(err){
									console.error("An error occured while reading catalog file : " + catalogFileName  + " , Error : \n" + err);
									// TODO send an email to author
								});
						} else if (runRequest.trim() == applicationProperties.path().transform.runrequestcode.catentryAttrRelDeletion) {

								var writeAttRelHeaderExecuted=false;
								var rRequest = applicationProperties.path().transform.runrequestcode.catentryAttrRelDeletion;
							    var catalofFileReadStream = fs.createReadStream(processingDirectory + catalogFileName);

								catalofFileReadStream.pipe(csvReadStream)
								.on('data', function(data){
									catalofFileReadStream.pause();
									if (!writeAttRelHeaderExecuted){
										createReportHeader(data,controlFile,storeName,localeArr);
										writeAttRelHeaderExecuted = true;
									}
									try {
										trimDataKeys(data);
										if (recordValidator.validateDeletionCode(data)) {
											// Validate the data row. Add any validation errors to error object.
											var validation = recordValidator.validateAttributeDeletionData(data, lookups, jsonObject, lookupsBuilder);
											validationWarnings[catalogFileName] = validation.isWarning;
											writeToReportFile(controlFile,'***Catalog Entry Attribute Relationship Deletion');
											writeToReportFile(controlFile,'Child Code: ' + recordValidator.getDeletionCode(data));

											// If valid row, write to the dataload csv files.
											if(validation.isValid){
												recordWriter.write(data, outputStreams, lookups, jsonObject, rRequest);
												validationErrors[catalogFileName].itemsSaved++;
												writeToReportFile(controlFile,'Item: ' + recordValidator.getDeletionCode(data) + ' Saved!');
												//TODO specify item
											}
											else{
												writeToReportFile(controlFile,'Item: ' + recordValidator.getDeletionCode(data) + ' Failed processing item!');
											}

											// Write validation messages to report file
											validation.errorMessages.forEach(function (error){
												//repotOutputStream[controlFile].write(error + '\n');
												writeToReportFile(controlFile,error);
											});

											validationErrors[catalogFileName].itemsProcessed++;
											validation.isValid = true; //resetting isValid. Otherwise other successful records will not be written to csv

										} else {
											writeToReportFile(controlFile,' ERROR: Invalid row detected. Deletion Code is null.');
										}
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
									//repotOutputStream[controlFile].write('Number of Items Processed: ' + validationErrors[catalogFileName].itemsProcessed + '\n');
									writeToReportFile(controlFile,'Number of Items Processed: ' + validationErrors[catalogFileName].itemsProcessed);
									//repotOutputStream[controlFile].write('Number of Items Saved: ' + validationErrors[catalogFileName].itemsSaved + '\n');
									writeToReportFile(controlFile,'Number of Items Saved: ' + validationErrors[catalogFileName].itemsSaved);
									writeToReportFile(controlFile,'*************************');

									// Move files from processing directory to Error Processing directory / Archive directory
									var itemsFailed = validationErrors[catalogFileName].itemsSaved < validationErrors[catalogFileName].itemsProcessed || (validationErrors[catalogFileName].itemsSaved == 0 && validationErrors[catalogFileName].itemsProcessed == 0);
									var targetDirectory = itemsFailed ? errorProcessingDirectory : archiveDirectory;
									moveFile(controlFile, processingDirectory, targetDirectory);
									moveFile(catalogFileName, processingDirectory, targetDirectory);

									// Send email to authors and catalog group
									//contactEmail = "";  // TODO delete this line later. Put your email address to send email to yourself.
									if(contactEmail != ""){
										if(itemsFailed){
											controlFileData[controlFile].emailSubject = env + " - " + catalogFileName +" Log File. Error on Attribute Deletion!";
											var sharedFolderPath4Email = jsonObject.baseSharedFolder4Email + jsonObject.storePath;
											sendValidationReportFile(serverCatManBaseSharedWorkspaceDir + jsonObject.reportDirectory + "Report-" + catalogFileName, 
												serverCatManBaseSharedWorkspaceDir + jsonObject.errorProcessingDirectory + catalogFileName, 
												contactEmail, jsonObject.catalogGroup, controlFileData[controlFile].emailSubject, 
												"Dear " + contactName + ", \n\nCatalog File: " + sharedFolderPath4Email + jsonObject.errorProcessingDirectory + catalogFileName +
												"\n\nReport File: " + sharedFolderPath4Email + jsonObject.reportDirectory + "Report-" + catalogFileName);
										}
										else{
											controlFileData[controlFile].emailSubject = validationWarnings[catalogFileName] ? (env + " - " + catalogFileName +" Log File. Warning on Attribute Deletion!") :
												(env + " - " + catalogFileName +" Log File. All Product Items were Processed Successfully!");
											var sharedFolderPath4Email = jsonObject.baseSharedFolder4Email + jsonObject.storePath;
											sendValidationReportFile(serverCatManBaseSharedWorkspaceDir + jsonObject.reportDirectory + "Report-" + catalogFileName, 
												serverCatManBaseSharedWorkspaceDir + jsonObject.archiveDirectory + catalogFileName, 
												contactEmail, jsonObject.catalogGroup, controlFileData[controlFile].emailSubject, 
												"Dear " + contactName + ", \n\nCatalog File: " + sharedFolderPath4Email + jsonObject.archiveDirectory + catalogFileName +
												"\n\nReport File: " + sharedFolderPath4Email + jsonObject.reportDirectory + "Report-" + catalogFileName);
										}
									}

									controlFilesProcessedCount++;
									controlFilesProcessed.push(catalogFileName);

									console.log('Finished reading catalog file : ' + catalogFileName);

									// Check if all catalog files are processed, send an email to catalog group
									if(controlFilesProcessedCount == controlFiles.length){
										sendRequestsSummaryReportEmail();
									}

								}}(controlFile, catalogFileName))


								.on('error',function(err){
									console.error("An error occured while reading catalog file : " + catalogFileName  + " , Error : \n" + err);
									// TODO send an email to author
								});



						} else if (runRequest.trim() == applicationProperties.path().transform.runrequestcode.catentryFullReplace) {
							//TODO
							processRequestForFullReplace(controlFile, catalogFileName);
						} else {

							var writeHeaderExecuted=false;
							var catalofFileReadStream = fs.createReadStream(processingDirectory + catalogFileName);
							catalofFileReadStream.pipe(csvReadStream)
								.on('data', function(data){
									catalofFileReadStream.pause();
									if (!writeHeaderExecuted){
										createReportHeader(data,controlFile,storeName,localeArr);
										writeHeaderExecuted = true;
									}
									try {
										trimDataKeys(data);
										if (recordValidator.validateRow(data)) {
											var productCreate = isNewProduct(data, lookups, recordValidator);

											if (productCreate){
							      				writeToReportFile(controlFile,' *** New Item');
							      			} else {
							      				writeToReportFile(controlFile,' *** Existing Item');
							      			}
											writeToReportFile(controlFile, 'Code: ' + recordValidator.getProductCode(data));

											//TODO: Email Status Report
											// Validate the data row. Add any validation errors to error object.
											var validation = recordValidator.validate(data, lookups, jsonObject, productCreate, lookupsBuilder);
											validationWarnings[catalogFileName] = validation.isWarning;

											// If valid row, write to the dataload csv files.
								      		if (validation.isValid) {
												// check first the partnumber if existing on the look up or not for the date created attribute.
												var partNumber = recordValidator.getProductCode(data);

												if (productCreate){
													console.log(partNumber + " *** NEW Item Insert Date Created*** ")
													addDataDateCreated(data);
												} else {
													console.log(partNumber + " *** EXISTS ON THE LOOKUP *** ")
												}

												//TBD: code refactoring - update master list of partNumber for next rowData processing
								      			// Add this catalog entry to the master catalog lookup to be used by subsequent rows/files during this run												  
												lookups.mastercataloglookup[recordValidator.getProductCode(data)] = data['Full Path'];												  
												//TBD: end

												recordWriter.write(data, outputStreams, lookups, jsonObject);												  
												validationErrors[catalogFileName].itemsSaved++;
												
												writeToReportFile(controlFile,'Item: ' + recordValidator.getProductCode(data) + ' Saved!');
								      		} else {
								      			writeToReportFile(controlFile,'Item: ' + recordValidator.getProductCode(data) + ' Failed saving item!');
								      		}

								      		// Write validation messages to report file
											validation.errorMessages.forEach(function (error){
												//repotOutputStream[controlFile].write(error + '\n');
												writeToReportFile(controlFile,error);
												
											});

											//TODO: Email Status Report
											var processStatus = true;

											if (validation.isWarning == true) {
												processStatus = true;
												}else if (validation.errorMessages.length > 0){
												processStatus = false;
											}
											reportEmailStatus.push([partNumber, data['Store'], processStatus, productCreate]);

											//TODO: Email Status Report
								      		validationErrors[catalogFileName].itemsProcessed++;
								      		validation.isValid = true; //resetting isValid. Otherwise other successful records will not be written to csv
										} else {
											writeToReportFile(controlFile,' ERROR: Invalid row detected. Manufacturer, Manufacturer part number and Catalog Entry Type is null.');
										}
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
									//repotOutputStream[controlFile].write('Number of Items Processed: ' + validationErrors[catalogFileName].itemsProcessed + '\n');
									writeToReportFile(controlFile,'Number of Items Processed: ' + validationErrors[catalogFileName].itemsProcessed);
									//repotOutputStream[controlFile].write('Number of Items Saved: ' + validationErrors[catalogFileName].itemsSaved + '\n');
									writeToReportFile(controlFile,'Number of Items Saved: ' + validationErrors[catalogFileName].itemsSaved);
									writeToReportFile(controlFile,'*************************');

									// Move files from processing directory to Error Processing directory / Archive directory
									var itemsFailed = validationErrors[catalogFileName].itemsSaved < validationErrors[catalogFileName].itemsProcessed || (validationErrors[catalogFileName].itemsSaved == 0 && validationErrors[catalogFileName].itemsProcessed == 0);
									var targetDirectory = itemsFailed ? errorProcessingDirectory : archiveDirectory;
									moveFile(controlFile, processingDirectory, targetDirectory);
									moveFile(catalogFileName, processingDirectory, targetDirectory);

									// Send email to authors and catalog group
									//contactEmail = "";  // TODO delete this line later. Put your email address to send email to yourself.
									if(contactEmail != ""){
										if(itemsFailed){
											controlFileData[controlFile].emailSubject = env + " - " + catalogFileName +" Log File. Error Saving Products!";
											var sharedFolderPath4Email = jsonObject.baseSharedFolder4Email + jsonObject.storePath;
											sendValidationReportFile(serverCatManBaseSharedWorkspaceDir + jsonObject.reportDirectory + "Report-" + catalogFileName, 
												serverCatManBaseSharedWorkspaceDir + jsonObject.errorProcessingDirectory + catalogFileName, 
												contactEmail, jsonObject.catalogGroup, controlFileData[controlFile].emailSubject, 
												"Dear " + contactName + ", \n\nCatalog File: " + sharedFolderPath4Email + jsonObject.errorProcessingDirectory + catalogFileName +
												"\n\nReport File: " + sharedFolderPath4Email + jsonObject.reportDirectory + "Report-" + catalogFileName);
										}
										else{
											controlFileData[controlFile].emailSubject = validationWarnings[catalogFileName] ? (env + " - " + catalogFileName +" Log File. Warning Saving Products!") :
												(env + " - " + catalogFileName +" Log File. All Product Items were Added Successfully!");
											var sharedFolderPath4Email = jsonObject.baseSharedFolder4Email + jsonObject.storePath;
											sendValidationReportFile(serverCatManBaseSharedWorkspaceDir + jsonObject.reportDirectory + "Report-" + catalogFileName, 
												serverCatManBaseSharedWorkspaceDir + jsonObject.archiveDirectory + catalogFileName, 
												contactEmail, jsonObject.catalogGroup, controlFileData[controlFile].emailSubject, 
												"Dear " + contactName + ", \n\nCatalog File: " + sharedFolderPath4Email + jsonObject.archiveDirectory + catalogFileName +
												"\n\nReport File: " + sharedFolderPath4Email + jsonObject.reportDirectory + "Report-" + catalogFileName);
										}
									}

									controlFilesProcessedCount++;
									controlFilesProcessed.push(catalogFileName);

									console.log('Finished reading catalog file : ' + catalogFileName);

									// Check if all catalog files are processed, send an email to catalog group
									if(controlFilesProcessedCount == controlFiles.length){
										var emailSubject = env + " - Catalog files processed";
										var emailText = "Following catalog files are processed : <br/><br/>";
									//TODO:Email Status Report

										 

									//TODO:Email Status Report
										controlFilesProcessed.forEach(function (catalogFileName){
											emailText = emailText + catalogFileName + "<br/>";
											console.log('Finished processing catalog file : ' + catalogFileName);
										});

										createReportStatus(reportEmailStatus);
										var totalFail = emrFail + climateFail + iseFail + sensiFail + proteamFail + fansFail;
										var totalPass = emrPass + climatePass + isePass + sensiPass + proteamPass + fansPass;
										var totalExisting = emrExisting + climateExisting + iseExisting + sensiExisting + proteamExisting + fansExisting;
										var totalNew = emrNew + climateNew + iseNew + sensiNew + proteamNew + fansNew;

										var emailHtmlTable = '';
										if(storeName == 'wsv'){
											emailHtmlTable = "<html>"+
											"<head>"+
											"</head>"+		
											"<body>"+
											"<p>"+emailText+"</p>"+					
											"</body>"+
											"</html>"
										}
										else{
											emailHtmlTable = "<html>"+
										"<head>"+
										"<style>"+
										"table, th, td {"+
										 	"border: 1px solid black;"+
											"border-collapse: collapse;"+
										"}"+
										"</style>"+
										"</head>"+
										"<body>"+
										
										"<table style='width:100%'>"+
										  "<tr>"+
											"<th>STORE</th>"+
											"<th>FAIL</th> "+
											"<th>PASS</th>"+
											"<th>EXISTING</th>"+
											"<th>NEW</th>"+
										  "</tr>"+
										  "<tr>"+
											"<td>EMR</td>"+
											"<td>"+emrFail+"</td>"+
											"<td>"+emrPass+"</td>"+
											"<td>"+emrExisting+"</td>"+
											"<td>"+emrNew+"</td>"+
										  "</tr>"+
										  "<tr>"+
											"<td>CLIMATE</td>"+
											"<td>"+climateFail+"</td>"+
											"<td>"+climatePass+"</td>"+
											"<td>"+climateExisting+"</td>"+
											"<td>"+climateNew+"</td>"+
										  "</tr>"+
										  "<tr>"+
											"<td>ISE</td>"+
											"<td>"+iseFail+"</td>"+
											"<td>"+isePass+"</td>"+
											"<td>"+iseExisting+"</td>"+
											"<td>"+iseNew+"</td>"+
										 "</tr>"+
										 "<tr>"+
											"<td>SENSI</td>"+
											"<td>"+sensiFail+"</td>"+
											"<td>"+sensiPass+"</td>"+
											"<td>"+sensiExisting+"</td>"+
											"<td>"+sensiNew+"</td>"+
										 "</tr>"+
										 "<tr>"+
											"<td>PROTEAM</td>"+
											"<td>"+proteamFail+"</td>"+
											"<td>"+proteamPass+"</td>"+
											"<td>"+proteamExisting+"</td>"+
											"<td>"+proteamNew+"</td>"+
										 "</tr>"+
										 "<tr>"+
											"<td>FANS</td>"+
											"<td>"+fansFail+"</td>"+
											"<td>"+fansPass+"</td>"+
											"<td>"+fansExisting+"</td>"+
											"<td>"+fansNew+"</td>"+
										 "</tr>"+
										 "<tr>"+
											"<td>TOTAL</td>"+
											"<td>"+totalFail+"</td>"+
											"<td>"+totalPass+"</td>"+
											"<td>"+totalExisting+"</td>"+
											"<td>"+totalNew+"</td>"+
										 "</tr>"+
										"</table>"+	
										
										"<p>"+emailText+"</p>"+								
										"</body>"+
										"</html>"
										}
										if(jsonObject.catalogGroup != ""){
											var sendEmailTo = jsonObject.catalogGroup + jsonObject.catalogSummaryGroup;
											mailer.sendEmailStatusTable(jsonObject, sendEmailTo, "", emailSubject , emailHtmlTable);
										}
									}

								}}(controlFile, catalogFileName))
								.on('error',function(err){
									console.error("An error occured while reading catalog file : " + catalogFileName  + " , Error : \n" + err);
									// TODO send an email to author
								});
						}
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
	console.log(env + " - " + storeName + " - No catalog files to import!");
	var emailSubject = env + " - " + storeName + " - No catalog files to import!";
	var emailText = "";
	if(jsonObject.catalogGroup != ""){
		mailer.sendEmail(jsonObject, jsonObject.catalogGroup, "", emailSubject , emailText);
	}
}

//TBD: code refactoring - pattern this with other runrequest
function processRequestForFullReplace(controlFileName, catalogFileName) {
	var catalogFileReadStream = fs.createReadStream(processingDirectory + catalogFileName);
	var isLocaleHeaderWritten = false;

	catalogFileReadStream.pipe(csv(options))
		.on(constants.NODE_KEY_DATA, function(rowData){
			catalogFileReadStream.pause();
			
			if (!isLocaleHeaderWritten) {
				// TBD: code refactor this - header for complete list of locales in the catalog file
				createReportHeader(rowData, controlFileName, storeName, localeArr);
				isLocaleHeaderWritten = true;
			}

			try {
				trimDataKeys(rowData);
				if (recordValidator.validateRow(rowData)) {
					var isNewItem = isNewProduct(rowData, lookups, recordValidator);
					var partNumber = dataHelper.getPartNumber(rowData[constants.CSV_HEADER_CODE], 
						rowData[constants.CSV_HEADER_CATENTRY_TYPE], 
						rowData[constants.CSV_HEADER_MFTR_PART_NUM], 
						rowData[constants.CSV_HEADER_MFTR]);

					if (isNewItem) {
						writeToReportFile(controlFileName,' *** Full Replace - New Item');
						writeToReportFile(controlFileName, 'Code: ' + partNumber);
						processRowDataAsNewProduct(rowData, controlFileName, catalogFileName);
					} else {
						writeToReportFile(controlFileName,' *** Full Replace - Existing Item');
						writeToReportFile(controlFileName, 'Code: ' + partNumber);
						processRowDataForFullReplace(rowData, controlFileName, catalogFileName);
					}
				} else {
					// TBD: code refactoring - can move this kind of checking on validator?
					writeToReportFile(controlFileName,' ERROR: Invalid row detected. Manufacturer, Manufacturer part number and Catalog Entry Type is null.');
				}
			} catch (error) {
				console.log(error + " ERROR: Undefined error encountered.");
				writeToReportFile(controlFileName, " ERROR: Undefined error encountered.");
			}

			process.nextTick(function(){
				catalogFileReadStream.resume();
			});
		})
		.on(constants.NODE_KEY_END, function(controlFileName, catalogFileName) { return function() {
			var noOfItemsSaved = validationErrors[catalogFileName].itemsSaved;
			var noOfItemsProcessed = validationErrors[catalogFileName].itemsProcessed;

			// write summary to the report file
			writeToReportFile(controlFileName, '*******  SUMMARY ********');
			writeToReportFile(controlFileName, 'Number of Items Processed: ' + noOfItemsProcessed);
			writeToReportFile(controlFileName, 'Number of Items Saved: ' + noOfItemsSaved);
			writeToReportFile(controlFileName, '*************************');

			// move catalog files out from processing
			if (noOfItemsSaved < noOfItemsProcessed	|| (noOfItemsSaved == 0 && noOfItemsProcessed == 0)) {
				moveFile(controlFileName, processingDirectory, errorProcessingDirectory);
				moveFile(catalogFileName, processingDirectory, errorProcessingDirectory);
			} else {
				moveFile(controlFileName, processingDirectory, archiveDirectory);
				moveFile(catalogFileName, processingDirectory, archiveDirectory);
			}
			
			// email the report file
			sendRequestReportEmail(controlFileName, catalogFileName);
			
			// update request counting
			controlFilesProcessedCount++;
			controlFilesProcessed.push(catalogFileName);

			console.log('Finished reading catalog file : ' + catalogFileName);
			
			if (controlFilesProcessedCount == controlFiles.length) {
				sendRequestsSummaryReportEmail();
			}
		}}(controlFileName, catalogFileName))
		.on(constants.NODE_KEY_ERROR, function(error) {
			console.error("An error occured while reading catalog file : " + catalogFileName  + " , Error : \n" + error);
		});
}

//TMP: comments - coding guides compliant
//TMP: comments - for coding standard enhancement, to be implemented not only for full replace
function sendRequestReportEmail(controlFileName, catalogFileName) {
	var noOfItemsSaved = validationErrors[catalogFileName].itemsSaved;
	var noOfItemsProcessed = validationErrors[catalogFileName].itemsProcessed;
	var contactEmail = controlFileData[controlFileName].data[1][0];
	var contactName = "Ma'am/Sir";
	var sharedFolderPath4Email = jsonObject.baseSharedFolder4Email + jsonObject.storePath;

	if (!genericUtil.isUndefined(controlFileData[controlFileName].data[2]) 
		|| !genericUtil.isTrimmedEmptyString(controlFileData[controlFileName].data[2][0])) {
			contactName = controlFileData[controlFileName].data[2][0];
	}

	if(contactEmail != ""){
		if(noOfItemsSaved < noOfItemsProcessed	|| (noOfItemsSaved == 0 && noOfItemsProcessed == 0)){
			controlFileData[controlFileName].emailSubject = env + " - " + catalogFileName +" Log File. Error Saving Products!";
			
			sendValidationReportFile(serverCatManBaseSharedWorkspaceDir + jsonObject.reportDirectory + "Report-" + catalogFileName, 
				serverCatManBaseSharedWorkspaceDir + jsonObject.errorProcessingDirectory + catalogFileName, 
				contactEmail, jsonObject.catalogGroup, controlFileData[controlFileName].emailSubject, 
				"Dear " + contactName + ", \n\nCatalog File: " + sharedFolderPath4Email + jsonObject.errorProcessingDirectory + catalogFileName + 
				"\n\nReport File: " + sharedFolderPath4Email + jsonObject.reportDirectory + "Report-" + catalogFileName);
		} else {
			controlFileData[controlFileName].emailSubject = validationWarnings[catalogFileName] ? (env + " - " + catalogFileName +" Log File. Warning Saving Products!") :
				(env + " - " + catalogFileName +" Log File. All Product Items were Added Successfully!");
			
			sendValidationReportFile(serverCatManBaseSharedWorkspaceDir + jsonObject.reportDirectory + "Report-" + catalogFileName, 
				serverCatManBaseSharedWorkspaceDir + jsonObject.archiveDirectory + catalogFileName, 
				contactEmail, jsonObject.catalogGroup, controlFileData[controlFileName].emailSubject, 
				"Dear " + contactName + ", \n\nCatalog File: " + sharedFolderPath4Email + jsonObject.archiveDirectory + catalogFileName +
				"\n\nReport File: " + sharedFolderPath4Email + jsonObject.reportDirectory + "Report-" + catalogFileName);
		}
	}
}

//TMP: comments - coding guides compliant
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

	var attachments = [
		{
			filename: catalogFileName,
			path: catalogFilePath
		},{
			filename: reportFileName,
			path: reportFilePath
		}
	];

	mailer.sendEmailAttachment(mailSettings, recipient, copyEmails, emailSubject, emailBody, attachments);
}

//TBD: code refactoring - replace long code of html email body for noemal product transform in the main block
//TMP: comments - coding guides compliant
function sendRequestsSummaryReportEmail() {
	var emailSubject = env + " - Catalog files processed";
	var emailText = "Following catalog files are processed : \n\n";

	controlFilesProcessed.forEach(function (catalogFileName){
		emailText = emailText + catalogFileName + "\n";
		console.log('Finished processing catalog file : ' + catalogFileName);
	});

	if(jsonObject.catalogGroup != "") {
		var sendEmailTo = jsonObject.catalogGroup + jsonObject.catalogSummaryGroup;
		mailer.sendEmail(jsonObject, sendEmailTo, "", emailSubject , emailText);
	}
}

//TBD: code refactoring - pattern this with types of data processing
//TMP: comments - processRowDataAsNewProduct() is planned to be reused by normal run request
function processRowDataAsNewProduct(rowData, controlFileName, catalogFileName) {
	//TMP: comments - assumptions
	//TMP: comments - all products entering here are new

	var partNumber = dataHelper.getPartNumber(rowData[constants.CSV_HEADER_CODE], 
		rowData[constants.CSV_HEADER_CATENTRY_TYPE], 
		rowData[constants.CSV_HEADER_MFTR_PART_NUM], 
		rowData[constants.CSV_HEADER_MFTR]);
	var validation = recordValidator.validate(rowData, lookups, jsonObject, true, lookupsBuilder);

	//TBD: can move below with other related code???
	validationWarnings[catalogFileName] = validation.isWarning;
	
	if (validation.isValid) {
		console.log(partNumber + " *** NEW Item Insert Date Created*** ")
		addDataDateCreated(rowData);
		//TBD: code refactoring - how to follow coding standard? - updates masterCatalogPartNum lookup
		lookups.mastercataloglookup[partNumber] = rowData['Full Path'];	

		recordWriter.write(rowData, outputStreams, lookups, jsonObject);	

		validationErrors[catalogFileName].itemsSaved++;
		writeToReportFile(controlFileName,'Item: ' + partNumber + ' Saved!');
	} else {
		writeToReportFile(controlFileName,'Item: ' + partNumber + ' Failed saving item!');
	}

	// Write validation messages to report file
	writeValidationMessagesToReportFile(controlFileName, validation);

	// TBD: rewrite this
	var processStatus = true;
	if (validation.isWarning == true) {
		processStatus = true;
	} else if (validation.errorMessages.length > 0) {
		processStatus = false;
	}
	reportEmailStatus.push([partNumber, rowData[constants.CSV_HEADER_STORE], processStatus, false]);
	validationErrors[catalogFileName].itemsProcessed++;
	// TBD: end
}

//TMP: comments - coding guides compliant
function processRowDataForFullReplace(rowData, controlFileName, catalogFileName) {
	//TMP: comments - assumptions
	//TMP: comments - all products entering here are existing

	var partNumber = dataHelper.getPartNumber(rowData[constants.CSV_HEADER_CODE], 
		rowData[constants.CSV_HEADER_CATENTRY_TYPE], 
		rowData[constants.CSV_HEADER_MFTR_PART_NUM], 
		rowData[constants.CSV_HEADER_MFTR]);
	var validation = recordValidator.validateRowDataForFullReplace(rowData, lookups, lookupsBuilder, jsonObject);
	
	//TBD: can move below with other related code???
	validationWarnings[catalogFileName] = validation.isWarning;

	if (validation.isValid) {
		recordWriter.writeRowDataForFullReplace(rowData, outputStreams, lookups, lookupsBuilder); //TODO - currently in progress

		validationErrors[catalogFileName].itemsSaved++;
		writeToReportFile(controlFileName, 'Item: ' + partNumber + ' Saved!');
	} else {
		writeToReportFile(controlFileName, 'Item: ' + partNumber + ' Failed saving item!');
	}
	
	// Write validation messages to report file
	writeValidationMessagesToReportFile(controlFileName, validation);

	// TBD: rewrite this
	var processStatus = true;
	if (validation.isWarning == true) {
		processStatus = true;
	} else if (validation.errorMessages.length > 0) {
		processStatus = false;
	}
	reportEmailStatus.push([partNumber, rowData[constants.CSV_HEADER_STORE], processStatus, false]);
	validationErrors[catalogFileName].itemsProcessed++;
	// TBD: end
}

// process validation messages
//TMP: comments - coding guides compliant
function writeValidationMessagesToReportFile(controlFileName, validation) {
	if (!genericUtil.isUndefined(validation.warningMessages)) {
		// Write warning messages
		validation.warningMessages.forEach(function (warningMessage) {
			writeToReportFile(controlFileName, warningMessage);
		})
	}
	if (!genericUtil.isUndefined(validation.errorMessages)) {
		// Write error messages
		validation.errorMessages.forEach(function (errorMessage) {
			writeToReportFile(controlFileName, errorMessage);
		})
	}
}

//TBD: code refactoring - data modifications - maybe a new module?
function addDataDateCreated(rowData) {
	var dateNow = new Date();
	var dateCreated = dateNow.getFullYear() + constants.CHAR_HYPHEN
		+ (dateNow.getMonth() + 1) + constants.CHAR_HYPHEN 
		+ dateNow.getDate() + constants.CHAR_SPACE
		+ dateNow.getHours() + constants.CHAR_COLON
		+ dateNow.getMinutes() + constants.CHAR_COLON
		+ dateNow.getSeconds() + constants.CHAR_DOT
		+ dateNow.getMilliseconds();

	rowData[constants.CSV_HEADER_DATECREATED] = dateCreated;
}

/* ********************************************
 * TBD: code refactoring - codes below are subject for major refactoring
 ******************************************** */
function cleanUnpairedFiles(){

	console.log('Cleaning unpaired files');

	var baseDirFiles = [], baseDirControlFileData = [];

	//TBD: code refactoring - for now utilize compiled requests files to populate baseDirFiles
	if (storeName.toUpperCase() == 'EMR') {
		var validRequestsFileName = applicationProperties.path().file.name.validRequests 
			+ constants.CHAR_HYPHEN + buildtag + constants.FILE_EXT_TXT;
		var invalidRequestsFileName = applicationProperties.path().file.name.invalidRequests 
			+ constants.CHAR_HYPHEN + buildtag + constants.FILE_EXT_TXT;
		var validRequests = lookupsBuilder.getTransformRequestsLookup(validRequestsFileName);
		var invalidRequests = lookupsBuilder.getInvalidTransformRequestsLookup(invalidRequestsFileName);

		validRequests.forEach(function (eachRequest) {
			baseDirFiles.push(eachRequest[0]);
			baseDirFiles.push(eachRequest[1]);
		});

		invalidRequests.forEach(function (eachRequest) {
			baseDirFiles.push(eachRequest[0]);
		});
	} else {
		// Read source folder and look for remaining files
		baseDirFiles = fs.readdirSync(baseDirectory);
	}
	//TBD: end

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
		var contactName = (baseDirControlFileData[controlFile].data[0][2].toString() != "") ? baseDirControlFileData[controlFile].data[0][2].toString() : "undefined";

		// Check if catalog file is in the directory 
		if (filesDict[catalogFileName.trim()] != null && !(baseDirCatalogFiles.includes(catalogFileName))) {
			baseDirCatalogFiles.push(catalogFileName);
			pairedControlFiles[catalogFileName] = controlFile+"|"+contactEmail+"|"+contactName;
			filesDict[catalogFileName.trim()] = 1;
			filesDict[controlFile] = 1;
		} else if(baseDirCatalogFiles.includes(catalogFileName)){
			console.log('Catalog file ' + catalogFileName + ' referenced by more than one Control file');
			filesDict[catalogFileName.trim()] = 0;
			var controlData = pairedControlFiles[catalogFileName].split("|");
			var duplicateControlFileName = controlData[0];
			var duplicateControlContactEmail = controlData[1];
			var duplicateControlContactName = controlData[2];
			pairedControlFiles[catalogFileName] = duplicateControlFileName+"||"+duplicateControlContactName;
			filesDict[duplicateControlFileName] = 0;
			emailSubject = env + " - An error is encountered while processing Control file";
			if (contactEmail != null) {
				mailer.sendEmail(jsonObject, contactEmail, '' , emailSubject , "Dear " + contactName + ", \n\nControl File: " + errorProcessingDirectory + controlFile + 
					"\n\n" + "Catalog file referenced by more than one Control file");
			}
			if (duplicateControlContactEmail != "") {
				mailer.sendEmail(jsonObject, duplicateControlContactEmail, '' , emailSubject , "Dear " + duplicateControlContactName + ", \n\nControl File: " + errorProcessingDirectory + duplicateControlFileName + 
					"\n\n" + "Catalog file referenced by more than one Control file");
			}
		} else {
			console.log('Catalog file ' + catalogFileName + ' does not exists');
			emailSubject = env + " - An error is encountered while processing Control file";
			if (contactEmail != null) {
				mailer.sendEmail(jsonObject, contactEmail, '' , emailSubject , "Dear " + contactName + ", \n\nControl File: " + errorProcessingDirectory + controlFile +
						"\n\n" + "Catalog file doesn't exist");
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
	var stores = ['emr','fan','proteam','wsv','literature','emr-old'];
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
		if(catalogFileName.toString().indexOf('.csv') == -1){
			console.log('Catalog file is not valid for control file (not csv): ' + controlFile);
			emailSubject = env + " - An error is encountered while processing Control file";
			mailer.sendEmail(jsonObject, contactEmail, '' , emailSubject , "Dear " + contactName + ", \n\nControl File: " + errorProcessingDirectory + controlFile +
					"\n\n" + "Catalog file is not valid");
			moveFile(controlFile, baseDirectory, errorProcessingDirectory);
			isValid = false;
		} else {
			//validate if file exists
			if(!(fs.existsSync(baseDirectory + catalogFileName))){
				console.log('Catalog file ' + catalogFileName + ' does not exists');
				emailSubject = env + " - An error is encountered while processing Control file";
				mailer.sendEmail(jsonObject, contactEmail, '' , emailSubject , "Dear " + contactName + ", \n\nControl File: " + errorProcessingDirectory + controlFile +
						"\n\n" + "Catalog file doesn't exists");
				moveFile(controlFile, baseDirectory, errorProcessingDirectory);
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
		mailer.sendEmail(jsonObject, contactEmail, '' , emailSubject , "Dear " + contactName + ", \n\nControl File: " + errorProcessingDirectory + controlFile +
				"\n\n" + "Catalog filename/Email address in missing");
		moveFile(controlFile, baseDirectory, errorProcessingDirectory);
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

//Check if the item is new or already exists
//TBD: code refactoring - rewrite this! recordValidator and lookup is a global var here! check for posibility of moving to dataHelper
function isNewProduct(data, lookups, recordValidator) {

    //var productType = data['Catalog Entry Type'];
	//var partNumber = data['Manufacturer'] + "-P-" + data['Manufacturer part number'];
	//if (productType !== 'Product') {
	//	partNumber = data['Manufacturer'] + "-" + data['Manufacturer part Number'];
	//}
	var partNumber = recordValidator.getProductCode(data);
    //console.log(' =' + partNumber);
    if (lookups.mastercataloglookup[partNumber] !== undefined) {
        console.log(partNumber + " *** EXISTS *** ")
         //validationObj.errorMessages.push("*** Existing Item");
        return false;
    }
    else {
    	console.log(partNumber + " *** NEW Item *** ")
    	//validationObj.errorMessages.push(" New Item Created");
        return true;
    }

};

//TBD: code refactoring - move this to dataHelper
function trimDataKeys(data){
	console.log('Start of validation of leading and trailing spaces');
	for(var key in data){
		var newKey = key;
		newKey = newKey.replace(/^\s+|\s+$/gm, '');
		if(newKey !== key){
			data[newKey] = data[key];
			delete data[key];
		}
	}console.log('End of validation of leading and trailing spaces');
}

//EDS-5685 Start Locale specific header
function createLocaleArray(localeData){
	
	var localeVal;
	if (localeData.Locale === undefined){
		localeVal = 'en_US';
	}
	else if (localeData.Locale === ''){
		localeVal = 'NULL';
	}
	else{
		localeVal = localeData.Locale;
	}
	if (!localeArr.includes(localeVal)) {
		localeArr.push(localeVal);
	}
}
function createReportHeader(data, controlFile, storeName, localeArr){
	
	if (typeof localeArr !== 'undefined' && localeArr.length > 0) {
		writeToReportFile(controlFile,'Importing ' + storeName + ' Products for Locale '+ localeArr.toString().replace(/,/g, '|'));
	}
	else{
		if (data.Locale === undefined){
			writeToReportFile(controlFile,'Importing ' + storeName + ' Products for Locale en_US');
		}
		else if (data.Locale === ''){
			writeToReportFile(controlFile,'Importing ' + storeName + ' Products for Locale NULL');
		}
		else{
			writeToReportFile(controlFile,'Importing ' + storeName + ' Products for Locale '+ data.Locale);
		}
		
	}
}
//EDS-5685 End Locale specific header

//EmailStatus
function createReportStatus(reportEmailStatus){
	
console.log("Total items processed : " + reportEmailStatus.length)
	for(var i=0; i<reportEmailStatus.length; i++){
//console.log(reportEmailStatus[i][0]);
//console.log(reportEmailStatus[i][1]);
//console.log(reportEmailStatus[i][2]);
//console.log(reportEmailStatus[i][3]);
		var storeName1 = reportEmailStatus[i][1];
		var processStatus1 = reportEmailStatus[i][2];
		var isNewValue1 = reportEmailStatus[i][3];

		//create a switch statement
		switch (storeName1){
			case 'EMR':
				if(processStatus1){
					emrPass++;
				}else{
					emrFail++;
				}
					if(isNewValue1){
						emrNew++;
					}else{
						emrExisting++;
					}
			break;			
			case 'FAN':	
				if(processStatus1){
					fansPass++;
				}else{
					fansFail++;
				}
					if(isNewValue1){
						fansNew++;
					}else{
						fansExisting++;
					}
			break;
			case 'Climate':
				if(processStatus1){
					climatePass++;
				}else{
					climateFail++;
				}
					if(isNewValue1){
						climateNew++;
					}else{
						climateExisting++;
					}
			break;
			case 'ISE':
				if(processStatus1){
					isePass++;
				}else{
					iseFail++;
				}
					if(isNewValue1){
						iseNew++;
					}else{
						iseExisting++;
					}
			break;
			case 'Sensi':
				if(processStatus1){
					sensiPass++;
				}else{
					sensiFail++;
				}
					if(isNewValue1){
						sensiNew++;
					}else{
						sensiExisting++;
					}
			break;
			case 'ProTeam':
				if(processStatus1){
					proteamPass++;
				}else{
					proteamFail++;
				}
					if(isNewValue1){
					proteamNew++;
					}else{
					proteamExisting++;
				}
			break;
		}//end switch
		

	}//end loop
}//end function

//EDS-6998/8017 code changes 
function writeDeltaPreprocessControlFile(storeName){
	var preprocessFlag = constants.CM_DELTA_PREPROCESS;
	if (fs.existsSync(preprocessControlPath)) {
		fs.readFile(preprocessControlPath, constants.UTF, function (err,data) {
			if (err) {
				return console.log(err);
			}
			if (existDeltaPreprocessControlFile){
				//update the flag to true if there are catalog files to process
				var result = (data.includes(preprocessFlag)) ? data.replace(/false/g, 'true') : preprocessFlag+" : true";
			}
			else{
				if(storeName.toUpperCase() === constants.STORE_EMR){
					//Initilize flag to false at the begining of the job
					var result = (data.includes(preprocessFlag)) ? data.replace(/true/g, 'false') : preprocessFlag+" : false";
				}
			}
			if (result != undefined){
				fs.writeFile(preprocessControlPath, result, constants.UTF, function (err) {
					if (err) return console.log(err);
				});
			}
		});
	}
	else{
		if(storeName.toUpperCase() === constants.STORE_EMR){
			//If flag file is missing at the start of the Job then the relevant flag file is created
			var fsDeltaWriteStream;
			fsDeltaWriteStream = fs.createWriteStream(preprocessControlPath);
			var content = (existDeltaPreprocessControlFile) ? preprocessFlag+" : true" : preprocessFlag+" : false";
			fsDeltaWriteStream.write(content + os.EOL);
			fsDeltaWriteStream.end();
		}
	}
}
