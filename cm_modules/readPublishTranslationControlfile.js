var env = process.argv[2]; // Environment argument
var storeName = process.argv[3]; // Store argument
var buildtag = ''; // **optional** buildtag
if (process.argv[4] !== undefined)
{
	buildtag = process.argv[4] + '-';
}
//SA1-1007 create tms publish control file based on the onhold save files from Import xliff back from Translation
process.chdir('..');
var lookups;

var jsonReader = require("../cm_modules/jsonReader");
var jsonObject = jsonReader.getJsonProperties(env, storeName);

var csv = require('csv-parse');
var csvsync = require('csv-parse/lib/sync');
var fs = require('fs');
var os = require('os');
var loadLookups = require('../cm_modules/loadLookups');
var lookups = loadLookups.getLookups(storeName);

var validLocales = jsonObject.validLocales;
var currtime = new Date();
var batchid = buildtag+currtime.getFullYear() + ("0"+(currtime.getMonth()+1)).slice(-2) +
	("0"+currtime.getDate()).slice(-2) + ("0"+currtime.getHours()).slice(-2) +
	("0"+currtime.getMinutes()).slice(-2) + ("0"+currtime.getSeconds()).slice(-2) +
	("00"+currtime.getMilliseconds()).slice(-3);
var srcBatchId = batchid;
var translationsPath = 'TMS/CatMan/';
var extractForPublishPath = 'TMS/CatMan/ExtractForPublish/';
var extractForPublishOnhold = 'TMS/CatMan/ExtractForPublish/onhold/';
var options = {
    delimiter : ',', // default is , 
    endLine : '\n', // default is \n, 
	columns : true, // default is null
	escapeChar : '"', // default is an empty string 
    enclosedChar : '"', // default is an empty string 
    skip_empty_lines : true, //default is false
    relax_column_count : true
}
var batchLimit = 300;
var tmsextractPublishOnholdDir = jsonObject.baseSharedDirectory + extractForPublishOnhold;
var productAutosolReportPath;
var productComresReportPath;
var existsAutosol = false;
var existsComres = false;
var fsAutosolReportStream;
var fsComresReportStream;
try {
	if (fs.existsSync(tmsextractPublishOnholdDir)) {
		var baseDirFiles = fs.readdirSync(tmsextractPublishOnholdDir);
		var tmsFilepath = jsonObject.baseSharedDirectory + extractForPublishPath +'tms-publish-control-item-' + batchid + ".txt";
		var fsWritePublishTranslationStream;
		for (var k in validLocales){
			var codeValue =[];
			var reqMailerList = [];
			baseDirFiles.forEach(function (file){
				if(file.includes("tms-publish-control-item"+validLocales[k]+"-", 0)){	
					fsReadStream = fs.readFileSync(jsonObject.baseSharedDirectory + extractForPublishOnhold + file, 'utf8');
					var data=fsReadStream.split('|');
					codeValue.push("''"+data[6].trim()+"''");
					reqMailerList.push(data[3]);
					var partnumber = data[6].trim();
					var masterCatgp = data[2].trim();
					var targetLang = data[1].trim();
					writePlatformReportRow(partnumber,masterCatgp,targetLang,'NA','');
					fs.unlinkSync(jsonObject.baseSharedDirectory + extractForPublishOnhold + file);
				}
				if(codeValue.length > batchLimit){
					writePublishControl(codeValue,reqMailerList);
				}
			});
			if (codeValue.length > 0){
				writePublishControl(codeValue,reqMailerList);
			}
		}
		if(fsWritePublishTranslationStream !== undefined){
			fsWritePublishTranslationStream.end();
		}
	} else {
		console.log(tmsextractPublishOnholdDir +": Directory does not exist.");
	}
} catch(e) {
	console.log("Error: readPublishTranslationControlfile :"+e);
}

function writePublishControl(CodeArr,reqMailerListArr){
	if(fsWritePublishTranslationStream === undefined){
		fsWritePublishTranslationStream = fs.createWriteStream(tmsFilepath);
	}
	reqMailerListArr = reqMailerListArr.toString().replace("\,",";");
	var startresult = "null|null|"+reqMailerListArr+"|AutoPublish|";
	var endresult = "|"+validLocales[k]+"|"+CodeArr;
	fsWritePublishTranslationStream.write(startresult + batchid + endresult + os.EOL);
	
	var waitTill = new Date(new Date().getTime() + 5);
	while(waitTill > new Date()){} //force change of Milliseconds to make a unique batchid
	currtime = new Date();
	batchid = buildtag+currtime.getFullYear() + ("0"+(currtime.getMonth()+1)).slice(-2) +
		("0"+currtime.getDate()).slice(-2) + ("0"+currtime.getHours()).slice(-2) +
		("0"+currtime.getMinutes()).slice(-2) + ("0"+currtime.getSeconds()).slice(-2) +
		("00"+currtime.getMilliseconds()).slice(-3);
	codeValue =[];
}

function writePlatformReportRow(currproduct,currmasterpath,targetLang,fname,catalogFilename)
{
	var currProdName = handleProductName(currproduct);
	var brand = currproduct.split('-')[0];
	if(findForPlatform(currmasterpath) == "emr"){
		if(fsAutosolReportStream === undefined){
			createAutosolImportReport();			
		}
		fsAutosolReportStream.write(fname + ',' + currProdName + ',' + currmasterpath + ',' + targetLang + ',' + currproduct.split('-')[0] + ',' + 
			"" + ("0"+(currtime.getMonth()+1)).slice(-2) + "/" + ("0"+currtime.getDate()).slice(-2) + "/" + currtime.getFullYear() + os.EOL);			
	} else {
		if(fsComresReportStream === undefined){
			createComresImportReport();
		}
		fsComresReportStream.write(fname + ',' + currProdName + ',' + currmasterpath + ',' + targetLang + ',' + currproduct.split('-')[0] + ',' + 
			"" + ("0"+(currtime.getMonth()+1)).slice(-2) + "/" + ("0"+currtime.getDate()).slice(-2) + "/" + currtime.getFullYear() + os.EOL);			
	}
	if(env.toLowerCase() == 'stage'){
		fsPartNumbersExportStream = fs.createWriteStream(jsonReader.getJsonProperties("prod", storeName).baseSharedDirectory + "CatMan/Export/TranslationDashboard/PartNumbersTranslatedP1.csv", {flags: 'a'});
	}else{
		fsPartNumbersExportStream = fs.createWriteStream(jsonObject.baseSharedDirectory + "CatMan/Export/TranslationDashboard/PartNumbersTranslatedP1.csv", {flags: 'a'});
	}
	fsPartNumbersExportStream.write(currProdName + ',' + targetLang + os.EOL);
}

function handleProductName(currentProduct){
	if (currentProduct.indexOf(",") > -1) {
		currentProduct = '"' + currentProduct + '"';
	}
	return currentProduct;
}

function findForPlatform(catgrp)
{ 	var lpcount=0;
	while(!(catgrp==='M-Automation-Solutions' || catgrp==='M-Commercial-Residential-Solutions' || catgrp==='ETC') && lpcount!=5){
		catgrp=lookups.mastercategorylookup[catgrp];
		lpcount++;
	}
	if(catgrp==='M-Automation-Solutions'){
		catgrp='emr';
	}
	else if(catgrp==='M-Commercial-Residential-Solutions' || catgrp==='ETC'){
		catgrp='climate';
	}
	else{
		catgrp='emr';
	}
	
	return catgrp;	
}

function createAutosolImportReport(){
	if (existsAutosol) { 
	  	fsAutosolReportStream = fs.createWriteStream(productAutosolReportPath, {highWaterMark: Math.pow(2,14), 'flags': 'a'});	  	
	} else{
		productAutosolReportPath = jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForPublish/Emerson' + srcBatchId + '_AutosolProductImport.csv';		
		fsAutosolReportStream = fs.createWriteStream(productAutosolReportPath, {highWaterMark: Math.pow(2,14)});
		fsAutosolReportStream.write('File Name,Code,Master Category,Locale,Manufacturer/Brand,Date Imported'+os.EOL);	
		existsAutosol = true;	
	}
}

function createComresImportReport(){
	if (existsComres) { 
	  	fsComresReportStream = fs.createWriteStream(productComresReportPath, {highWaterMark: Math.pow(2,14), 'flags': 'a'});
	} else{
		productComresReportPath = jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForPublish/Emerson' + srcBatchId + '_ComresProductImport.csv';
		fsComresReportStream = fs.createWriteStream(productComresReportPath, {highWaterMark: Math.pow(2,14)});
		fsComresReportStream.write('File Name,Code,Master Category,Locale,Manufacturer/Brand,Date Imported'+os.EOL);
		existsComres = true;
	}
}
