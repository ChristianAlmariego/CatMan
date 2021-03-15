var env = process.argv[2]; // Environment argument
var storeName = process.argv[3]; // Store argument

var catManBaseDir = process.argv[4];
var processId = process.argv[5];
var countryCode = process.argv[6];
var inputFileName = process.argv[7];

var readline = require('readline');
var fs = require('fs');
var csv = require('csv-parse/lib/sync');

var loadOutputStreams = require(catManBaseDir + '/cm_modules/loadOutputStreams-' + storeName);

console.log('START BUILDING PUBLISHED UPDATE DATALOAD CSV');
console.log('env: ' + env);
console.log('storeName: ' + storeName);
console.log('catManBaseDir: ' + catManBaseDir);
console.log('processId: ' + processId);
console.log('countryCode: ' + countryCode);
console.log('inputFileName: ' + inputFileName);

var csvOptions = {
    delimiter : ',', // default is , 
    endLine : '\n', // default is \n, 
	columns : ['PartNumber','CatEntryTypeId','LanguageId'], // default is null
    escapeChar : '"', // default is an empty string 
    enclosedChar : '"' // default is an empty string 
};

var catEntMissingCountryLocalesPublishedFilePathName = catManBaseDir + "/scripts/dataCleanUp/resources/" + inputFileName;
var customOutputStreams = loadOutputStreams.getCatEntDescPublishedStream(catManBaseDir + '/scripts/dataCleanUp/dataload/processing/', processId);

var rlCatEntMissingCountryLocalesPublished = readline.createInterface({
	input: fs.createReadStream(catEntMissingCountryLocalesPublishedFilePathName)
});

rlCatEntMissingCountryLocalesPublished.on('line',function (line) {
	processLine(line);
});

function processLine(line) {

	// ignore header row
	// TODO: this should be dynamic
	if (line.startsWith('PartNumber,') 
		|| line.startsWith('CatEntryMissingCountryLocalesPublished')) {
		return;
	}

	var dataRow = csv(line, csvOptions);
	dataRow = dataRow[0];

	var data = [];

	data['PartNumber'] = dataRow.PartNumber;
	data['Type'] = getDataloadCatEntryType(dataRow.CatEntryTypeId);
	data['LanguageId'] = dataRow.LanguageId;
	data['Published'] = '0';
	data['Delete'] = '';

	writePublishFlagDataloadCsvRow(customOutputStreams, data);
}

function writePublishFlagDataloadCsvRow(customOutputStreams, data) {
	var output = [];

	output[0] = data.PartNumber;
	output[1] = data.Type;
	output[2] = data.LanguageId;
	output[3] = data.Published;
	output[4] = data.Delete;

	customOutputStreams.csvCatEntDescPublishedStream.write(output);
}

//TODO: utility
function getDataloadCatEntryType(defaultWcCatEntryTypeType) {
	var dataloadCatEntryType = '';

	switch (defaultWcCatEntryTypeType) { 
	case 'ItemBean':
		dataloadCatEntryType = 'Item';
		break;
	case 'ProductBean':
		dataloadCatEntryType = 'Product';
		break;
	case 'BundleBean':
		dataloadCatEntryType = 'Bundle';
		break;
	case 'PackageBean':
		dataloadCatEntryType = 'Package';
		break;
	case 'DynamicKitBean':
		dataloadCatEntryType = 'DynamicKit';
		break;
	}
	
	return dataloadCatEntryType;
}
