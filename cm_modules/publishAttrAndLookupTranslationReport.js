//EDS-7556, code implementation to generate report on publish translation job
var env = process.argv[2];
var storeName = process.argv[3];
var batchId = process.argv[4];
var processType = process.argv[5];
var fsReadStream,csvReadStream;
var csv = require('csv-parse'),
csvsync = require('csv-parse/lib/sync');
var loadLookups = require('./loadLookups');
var readline = require('readline'); // use line reader to handle 1st non-csv row
var fs = require('fs');
var os = require('os');
var lookups = loadLookups.getLookups(storeName);
var jsonReader = require("./jsonReader");
var jsonObject = jsonReader.getJsonProperties(env, storeName);
var rowStack = [];
rowStack.CatValue = [];
var nextCatValueRow = [];
var curritem = '';
var currlang = '';
var processAttributeReport= false;
var processLookupReport= false;
var currtime = new Date();
var validLocales = jsonObject.validLocales;
var baseDirFiles = fs.readdirSync(jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForPublish');
var rlAttrValue;
var fsAttrReportStream;
var rlLookupValue;
var fsLookupReportStream; 

if(processType==='Attribute'){
	baseDirFiles.forEach(function (file){
		if(file.includes("attrname-"+batchId, 0)){
			processAttributeReport=true;
		}
	});
}
if (processType==='Lookup'){
	baseDirFiles.forEach(function (file){
		if(file.includes("lkup-"+batchId, 0)){
			processLookupReport=true;
		}
	});
}

if (processAttributeReport){
	rlAttrValue = readline.createInterface({
		input: fs.createReadStream(jsonObject.baseSharedDirectory+'TMS/CatMan/ExtractForPublish/attrname-'+batchId+'-attrdictattr-output.csv')
	});
	var reportPath = jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForPublish' + '/Emerson' +batchId+ '_AttributeImport.csv';
	fsAttrReportStream = fs.createWriteStream(reportPath, {highWaterMark: Math.pow(2,14)});
	fsAttrReportStream.write('File Name,Attributes,Locale,Date Promoted'+os.EOL);
	rlAttrValue.on('line',function (line) {
		processrl('CatValue', line,processType);
	});
}
if (processLookupReport){
	rlLookupValue = readline.createInterface({
		input: fs.createReadStream(jsonObject.baseSharedDirectory+'TMS/CatMan/ExtractForPublish/lkup-'+batchId+'-attrdictattrallowvals-output.csv')
	});
	var reportPath = jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForPublish' + '/Emerson' +batchId+ '_LookupImport.csv';
	fsLookupReportStream = fs.createWriteStream(reportPath, {highWaterMark: Math.pow(2,14)});
	fsLookupReportStream.write('File Name,Attribute Lookups,Locale,Date Promoted'+os.EOL);
	rlLookupValue.on('line',function (line) {
		processrl('CatValue', line,processType);
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
	
	if (ptype==='Attribute'){
		if(fsAttrReportStream != undefined){
		fsAttrReportStream.write('NA' + ',' + curritem + ',' + langVal + ',' + ("0"+(currtime.getMonth()+1)).slice(-2) + "/" + ("0"+currtime.getDate()).slice(-2) + "/" + currtime.getFullYear() + os.EOL);
		}
	}
	if (ptype==='Lookup'){
		if(fsLookupReportStream != undefined){
		fsLookupReportStream.write('NA' + ',' + curritem + ',' + langVal + ',' + ("0"+(currtime.getMonth()+1)).slice(-2) + "/" + ("0"+currtime.getDate()).slice(-2) + "/" + currtime.getFullYear() + os.EOL);
		}
	}
	
}

function processrl(fileno,line,ptype)
{
	// ignore header row
	if (ptype==='Attribute'){
		if (line.startsWith('PublishAttributeDictionaryAttributeAndAllowedValues') || line.startsWith('Identifier'))
		{
			return;
		}
		rowStack[fileno].unshift(line);
		var CatValueStackLength = rowStack.CatValue.length;
		if (CatValueStackLength > 0)
		{
			nextCatValueRow = rowStack.CatValue[0].split(',');
			curritem = nextCatValueRow[0];
			currlang = nextCatValueRow[13];
			var langVal= getLanguage(currlang);
			//update the report with item details
			writeReportRow(curritem,langVal,ptype);
		}
	}
	if (ptype==='Lookup'){
		if (line.startsWith('PublishAttributeDictionaryAttributeAllowedValuesLkup') || line.startsWith('Identifier'))
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
	
}

function processFinished()
{
	if(rlAttrValue!=undefined){
		rlAttrValue.on('close',function () {
			if (fsAttrReportStream!=undefined){
				fsAttrReportStream.end();
			}
			
		});
	}
	if(rlLookupValue!=undefined){
		rlLookupValue.on('close',function () {
			if (fsLookupReportStream!=undefined){
				fsLookupReportStream.end();
			}
			
		});	
	}
}
	
processFinished();