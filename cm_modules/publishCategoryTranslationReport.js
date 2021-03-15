//EDS-7556, code implementation to generate report on publish translation job
var env = process.argv[2];
var platformType = process.argv[3];
var batchId = process.argv[4];
var fsReadStream,csvReadStream;
var csv = require('csv-parse'),
csvsync = require('csv-parse/lib/sync');
var loadLookups = require('./loadLookups');
var readline = require('readline'); // use line reader to handle 1st non-csv row
var fs = require('fs');
var os = require('os');
var storeName= 'emr';
var lookups = loadLookups.getLookups(storeName);
var jsonReader = require("./jsonReader");
var jsonObject = jsonReader.getJsonProperties(env, storeName);
var rowStack = [];
rowStack.CatValue = [];
var nextCatValueRow = [];
var curritem = '';
var currlang = '';
var processAutoSolReport = false;
var processComResReport= false;
var processBothReport= false;
var currtime = new Date();
var validLocales = jsonObject.validLocales;
var baseDirFiles = fs.readdirSync(jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForPublish');
var rlAutoSolCatValue;
var fsAutosolReportStream;
var rlComResCatValue;
var fsComresReportStream; 
var rlCatValue;

if(platformType==='AutoSol'){
	baseDirFiles.forEach(function (file){
		if(file.includes("salescatalog-autosol-emr"+batchId, 0)){
			processAutoSolReport=true;
		}
	});
}
else if (platformType==='ComRes'){
	baseDirFiles.forEach(function (file){
		if(file.includes("salescatalog-comres-emr"+batchId, 0)){
			processComResReport=true;
		}
	});
}
else{
	baseDirFiles.forEach(function (file){
		if(file.includes("salescatalog-emr"+batchId, 0)){
			processBothReport=true;
		}
	});
}
if (processAutoSolReport){
	rlAutoSolCatValue = readline.createInterface({
		input: fs.createReadStream(jsonObject.baseSharedDirectory+'TMS/CatMan/ExtractForPublish/salescatalog-autosol-emr'+batchId+'catgrpdesc.csv')
	});
	var reportPath = jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForPublish' + '/Emerson' +batchId+ '_AutosolCategoryImport.csv';
	fsAutosolReportStream = fs.createWriteStream(reportPath, {highWaterMark: Math.pow(2,14)});
	fsAutosolReportStream.write('File Name,Category Group,Locale,Date Promoted'+os.EOL);
	rlAutoSolCatValue.on('line',function (line) {
		processrl('CatValue', line,platformType);
	});
}
if (processComResReport){
	rlComResCatValue = readline.createInterface({
		input: fs.createReadStream(jsonObject.baseSharedDirectory+'TMS/CatMan/ExtractForPublish/salescatalog-comres-emr'+batchId+'catgrpdesc.csv')
	});
	var reportPath = jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForPublish' + '/Emerson' +batchId+ '_ComresCategoryImport.csv';
	fsComresReportStream = fs.createWriteStream(reportPath, {highWaterMark: Math.pow(2,14)});
	fsComresReportStream.write('File Name,Category Group,Locale,Date Promoted'+os.EOL);
	rlComResCatValue.on('line',function (line) {
		processrl('CatValue', line,platformType);
	});
}
if (processBothReport){
	rlCatValue = readline.createInterface({
		input: fs.createReadStream(jsonObject.baseSharedDirectory+'TMS/CatMan/ExtractForPublish/salescatalog-emr'+batchId+'catgrpdesc.csv')
	});
	var autosolReportPath = jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForPublish' + '/Emerson' +batchId+ '_AutosolCategoryImport.csv';
	var comresReportPath = jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForPublish' + '/Emerson' +batchId+ '_ComresCategoryImport.csv';
	fsAutosolReportStream = fs.createWriteStream(autosolReportPath, {highWaterMark: Math.pow(2,14)});
	fsAutosolReportStream.write('File Name,Category Group,Locale,Date Promoted'+os.EOL);
	fsComresReportStream = fs.createWriteStream(comresReportPath, {highWaterMark: Math.pow(2,14)});
	fsComresReportStream.write('File Name,Category Group,Locale,Date Promoted'+os.EOL);
	rlCatValue.on('line',function (line) {
		processrl('CatValue', line,platformType);
	});
	
}



//convert language ID to corresponding locale
function getLanguage(lang)
{
	var validLanguages = {};
	for (var key in validLocales) {
		if (true) //eliminate warning about key filter
		{
			validLanguages[validLocales[key]] = key;
		}
	}

	var i = validLanguages[lang];
	if (i !== undefined)
	{
		return i;
	}
	else
	{
		return 'en_US';
	}
}

function writeReportRow(curritem,langVal,ptype)
{
	
	if (ptype==='AutoSol'){
		if(fsAutosolReportStream != undefined){
			fsAutosolReportStream.write('NA' + ',' + curritem + ',' + langVal + ',' + ("0"+(currtime.getMonth()+1)).slice(-2) + "/" + ("0"+currtime.getDate()).slice(-2) + "/" + currtime.getFullYear() + os.EOL);
		}
	}
	else if (ptype==='ComRes'){
		if(fsComresReportStream != undefined){
			fsComresReportStream.write('NA' + ',' + curritem + ',' + langVal + ',' + ("0"+(currtime.getMonth()+1)).slice(-2) + "/" + ("0"+currtime.getDate()).slice(-2) + "/" + currtime.getFullYear() + os.EOL);
		}
	}
	else{
		var assignedStore =  undefined;
		if(lookups.salescategorymainlookup[curritem]!=undefined){
			assignedStore =  lookups.salescategorymainlookup[curritem].Store;
		}
		if (assignedStore !== undefined) {
			if (assignedStore==='EMR'){
				var platform=findForCategoryPlatform(curritem);
				if (platform === 'Automation-Solutions') {
					if(fsAutosolReportStream != undefined){
						fsAutosolReportStream.write('NA' + ',' + curritem + ',' + langVal + ',' + ("0"+(currtime.getMonth()+1)).slice(-2) + "/" + ("0"+currtime.getDate()).slice(-2) + "/" + currtime.getFullYear() + os.EOL);			
					}
				}
				else if (platform === 'Commercial-and-Residential-Solutions') {
					if(fsComresReportStream != undefined){
						fsComresReportStream.write('NA' + ',' + curritem + ',' + langVal + ',' + ("0"+(currtime.getMonth()+1)).slice(-2) + "/" + ("0"+currtime.getDate()).slice(-2) + "/" + currtime.getFullYear() + os.EOL);
					}
				}
			}
			else{
				if(fsComresReportStream != undefined){
					fsComresReportStream.write('NA' + ',' + curritem + ',' + langVal + ',' + ("0"+(currtime.getMonth()+1)).slice(-2) + "/" + ("0"+currtime.getDate()).slice(-2) + "/" + currtime.getFullYear() + os.EOL);
				}
			}
		}
	}
	
}

function processrl(fileno,line,ptype)
{
	// ignore header row 
	if (line.startsWith('CatalogGroupDescription') || line.startsWith('GroupIdentifier'))
	{
		return;
	}
	rowStack[fileno].unshift(line);
	var CatValueStackLength = rowStack.CatValue.length;
	if (CatValueStackLength > 0)
	{
		nextCatValueRow = rowStack.CatValue[0].split(',');
		curritem = nextCatValueRow[0];
		currlang = nextCatValueRow[1];
		var langVal= getLanguage(currlang);
		//update the report with item details
		writeReportRow(curritem,langVal,ptype);
	}
}
function findForCategoryPlatform(catgrp)
{
	while(!(catgrp==='Automation-Solutions' || catgrp==='Commercial-and-Residential-Solutions')){
		catgrp=lookups.salescategorymainlookup[catgrp].ParentIdentifier;
	}
	return catgrp;
}

function processFinished()
{
	if(rlAutoSolCatValue!=undefined){
		rlAutoSolCatValue.on('close',function () {
			if (fsAutosolReportStream!=undefined){
				fsAutosolReportStream.end();
			}
			
		});
	}
	if(rlComResCatValue!=undefined){
		rlComResCatValue.on('close',function () {
			if (fsComresReportStream!=undefined){
				fsComresReportStream.end();
			}
			
		});	
	}
	if(rlCatValue!=undefined){
		rlCatValue.on('close',function () {
			if (fsComresReportStream!=undefined){
				fsComresReportStream.end();
			}
			if (fsAutosolReportStream!=undefined){
				fsAutosolReportStream.end();
			}
			
		});
	}
}
	
	
processFinished();


