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
var loadLookups = require(catManBaseDir + '/cm_modules/loadLookups');

console.log('START BUILDING COUNTRY DELETION DATALOAD CSV');
console.log('env: ' + env);
console.log('storeName: ' + storeName);
console.log('catManBaseDir: ' + catManBaseDir);
console.log('processId: ' + processId);
console.log('countryCode: ' + countryCode);
console.log('inputFileName: ' + inputFileName);

var lookups;
var csvOptions = {
    delimiter : ',', // default is , 
    endLine : '\n', // default is \n, 
	columns : ['PartNumber','CatEntryTypeId'], // default is null
    escapeChar : '"', // default is an empty string 
    enclosedChar : '"' // default is an empty string 
};
lookups = loadLookups.getLookups(storeName);

var catEntCountryExistMissingFlagFilePathName = catManBaseDir + "/scripts/dataCleanUp/resources/" + inputFileName;
var customOutputStreams = loadOutputStreams.getCatEntryAttributesStream(catManBaseDir + '/scripts/dataCleanUp/dataload/processing/', processId);

var rlCatEntCountryExistMissingFlag = readline.createInterface({
	input: fs.createReadStream(catEntCountryExistMissingFlagFilePathName)
});

rlCatEntCountryExistMissingFlag.on('line',function (line) {
	processLine(line);
});

function processLine(line) {

	// ignore header row
	// TODO: this should be dynamic
	if (line.startsWith('PartNumber,') 
		|| line.startsWith('CatEntryCountryExistMissingPublishFlag')
		|| line.startsWith('CatEntryCountryExistLocalesNotPublished')) {
		return;
	}

	var dataRow = csv(line, csvOptions);
	dataRow = dataRow[0];

	var data = [];
	var countryHeader = 'Country';
	var countryFieldReqs = lookups.header[storeName.toUpperCase()][countryHeader];
	var languageId = '-1';
	var attributeIdentifier = countryFieldReqs.Identifier;
	var sequence = countryFieldReqs.Sequence;
	var usage = '';
	var countryValueRefs = lookups.attrval[attributeIdentifier];
	var valueIdentifier = '';

	if(countryFieldReqs.AttrValPrefix.includes("Attribute_Dictionary_Descriptive_Attributes")) {
		usage = "Descriptive";
	} else {
		usage = "Defining";
	}

	valueIdentifier = countryValueRefs[countryCode].ValueIdentifier;

	data['PartNumber'] = dataRow.PartNumber;
	data['AttributeIdentifier'] = attributeIdentifier;
	data['LanguageId'] = languageId;
	data['ValueIdentifier'] = valueIdentifier;
	data['Value'] = countryCode;
	data['Usage'] = usage;
	data['Sequence'] = sequence;
	data['AttributeStoreIdentifier'] = 'EmersonCAS';
	data['Field1'] = '';
	data['Field2'] = '';
	data['Field3'] = '';
	data['Delete'] = '1';

	writeAttributeDataloadCsvRow(customOutputStreams, data);
}

function writeAttributeDataloadCsvRow(customOutputStreams, data) {
	var output = [];

	output[0] = data.PartNumber;
	output[1] = data.AttributeIdentifier;
	output[2] = data.LanguageId;
	output[3] = data.ValueIdentifier;
	output[4] = data.Value;
	output[5] = data.Usage;
	output[6] = data.Sequence;
	output[7] = data.AttributeStoreIdentifier;
	output[8] = data.Field1;
	output[9] = data.Field2;
	output[10] = data.Field3;
	output[11] = data.Delete;

	customOutputStreams.csvCatEntryAttributesStream.write(output);
}
