//EDS-4922, code implementation to generate report on publish translation job
var env = process.argv[2];
var storeName = process.argv[3];
var batchId = process.argv[4];
var fsReadStream,csvReadStream;
var csv = require('csv-parse'),
csvsync = require('csv-parse/lib/sync');
var readline = require('readline'); // use line reader to handle 1st non-csv row
var fs = require('fs');
var os = require('os');
var jsonReader = require("./jsonReader");
var jsonObject = jsonReader.getJsonProperties(env, storeName);
var rowStack = [];
rowStack.CatValue = [];
var nextCatValueRow = [];
var currproduct = '';
var currmasterpath ='';
var currlang = '';
var currtime = new Date();

var rlCatValue = readline.createInterface({
	input: fs.createReadStream(jsonObject.baseSharedDirectory+'TMS/CatMan/ExtractForPublish/catentry'+batchId+'published-output.csv')
});
var fsReportStream;

//Create a new product import report
var productReportPath = jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForPublish' + '/Emerson' +batchId+ '_ProductImport.csv';
fsReportStream = fs.createWriteStream(productReportPath, {highWaterMark: Math.pow(2,14)});
fsReportStream.write('File Name,Code,Master Category,Locale,Manufacturer/Brand,Date Promoted'+os.EOL);

var validLocales = jsonObject.validLocales;

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

function writeReportRow(currproduct,langVal,currmasterpath)
{
	fsReportStream.write('NA' + ',' + currproduct + ',' + currmasterpath + ',' + langVal + ',' + currproduct.split('-')[0] + ',' + 
			"" + ("0"+(currtime.getMonth()+1)).slice(-2) + "/" + ("0"+currtime.getDate()).slice(-2) + "/" + currtime.getFullYear() + os.EOL);
	if(env.toLowerCase() == 'stage')
		fsPartNumbersExportStream = fs.createWriteStream(jsonReader.getJsonProperties("prod", storeName).baseSharedDirectory + "CatMan/Export/TranslationDashboard/PartNumbersTranslatedP1.csv", {flags: 'a'});
	else
		fsPartNumbersExportStream = fs.createWriteStream(jsonObject.baseSharedDirectory + "CatMan/Export/TranslationDashboard/PartNumbersTranslatedP1.csv", {flags: 'a'});
	if(currproduct.includes(","))
		fsPartNumbersExportStream.write('"' + currproduct + '",' + langVal + os.EOL);
	else
		fsPartNumbersExportStream.write(currproduct + ',' + langVal + os.EOL);
}

//Method to lookup corresponding master category information using code/partnumber, return masterCategory
function findMasterCategory(code){
	for (i = 0; i < csv.length; i++)
	{
		if(code == csv[i][0]){
			return csv[i][1];
		}
	}
	return '';
}

csv = csvsync(fs.readFileSync('./lookup_csv/mastercatalogPartNumber.csv').toString(), {delimiter: ',', columns: null});
rlCatValue.on('line',function (line) {
	processrl('CatValue', line);
});

function processrl(fileno,line)
{
	// ignore header row
	if (line.startsWith('PartNumber,') || line.startsWith('CatalogEntryDescription') || line.startsWith('CatalogEntryDescriptionPublishedItemLevel'))
	{
		return;
	}
	rowStack[fileno].unshift(line);
	var CatValueStackLength = rowStack.CatValue.length;
	if (CatValueStackLength > 0)
	{
		nextCatValueRow = rowStack.CatValue[0].split(',');
		currproduct = nextCatValueRow[0];
		currlang = nextCatValueRow[1];
		var langVal= getLanguage(currlang);
		currmasterpath=findMasterCategory(currproduct);
		//update the report with code details
		writeReportRow(currproduct,langVal,currmasterpath);
	}
}

rlCatValue.on('close',function () {
	csv.splice(0)
	fsReportStream.end();
});
