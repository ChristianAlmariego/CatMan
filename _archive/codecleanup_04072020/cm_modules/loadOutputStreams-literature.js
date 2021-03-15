//global variable
var fsoutputStreams = {};

// Load all required packages
var stringify = require('csv-stringify'),
	fs = require('fs');

// csv-parse options for asynchronous writing of the output files.  All of these arguments are optional.
var writeoptions = {
    delimiter : ',', // default is , 
    endLine : '\n', // default is \n, 
	columns : false, // default is null
    escapeChar : '"', // default is an empty string 
    enclosedChar : '"' // default is an empty string
};

exports.getOutputStreams = function(jsonObject,batchid) {
	var outputStreams = {};
	var row = '';
	var outputDirectory = jsonObject.dataloadDirectory + jsonObject.outputPath;

	// Create the output files and write their headers
	// -- CatalogEntry
	outputStreams.csvCatEntStream = stringify(writeoptions);
	outputStreams.csvCatEntStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntStream === undefined)
		{
			fsoutputStreams.csvCatEntStream = fs.createWriteStream(outputDirectory + 'catentry-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntStream.read()) !== null){
			fsoutputStreams.csvCatEntStream.write(row);
		}
	});
	outputStreams.csvCatEntStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntStream.on('finish', function(){
		fsoutputStreams.csvCatEntStream.end();
	});
	outputStreams.csvCatEntStream.write(['CatalogEntry','','','','','','','']);
	outputStreams.csvCatEntStream.write(['PartNumber','Type','ParentGroupIdentifier','Delete']);

	// -- CatalogEntryDescription - Name
	outputStreams.csvCatEntDescNameStream = stringify(writeoptions);
	outputStreams.csvCatEntDescNameStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntDescNameStream === undefined)
		{
			fsoutputStreams.csvCatEntDescNameStream = fs.createWriteStream(outputDirectory + 'catentryname-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntDescNameStream.read()) !== null){
			fsoutputStreams.csvCatEntDescNameStream.write(row);
		}
	});
	outputStreams.csvCatEntDescNameStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntDescNameStream.on('finish', function(){
		fsoutputStreams.csvCatEntDescNameStream.end();
	});
	outputStreams.csvCatEntDescNameStream.write(['CatalogEntryDescription','','','','']);
	outputStreams.csvCatEntDescNameStream.write(['PartNumber','Type','LanguageId','Name','Delete']);

	// -- CatalogEntryDescription - Published
	outputStreams.csvCatEntDescPublishedStream = stringify(writeoptions);
	outputStreams.csvCatEntDescPublishedStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntDescPublishedStream === undefined)
		{
			fsoutputStreams.csvCatEntDescPublishedStream = fs.createWriteStream(outputDirectory + 'catentrypublished-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntDescPublishedStream.read()) !== null){
			fsoutputStreams.csvCatEntDescPublishedStream.write(row);
		}
	});
	outputStreams.csvCatEntDescPublishedStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntDescPublishedStream.on('finish', function(){
		fsoutputStreams.csvCatEntDescPublishedStream.end();
	});
	outputStreams.csvCatEntDescPublishedStream.write(['CatalogEntryDescription','','','','']);
	outputStreams.csvCatEntDescPublishedStream.write(['PartNumber','Type','LanguageId','Published','Delete']);

	// -- CatalogEntryAttributeDictionaryAttributeRelationship
	outputStreams.csvCatEntAttrDictAttrRelStream = stringify(writeoptions);
	outputStreams.csvCatEntAttrDictAttrRelStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntAttrDictAttrRelStream === undefined)
		{
			fsoutputStreams.csvCatEntAttrDictAttrRelStream = fs.createWriteStream(outputDirectory + 'catentryattrrel-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntAttrDictAttrRelStream.read()) !== null){
			fsoutputStreams.csvCatEntAttrDictAttrRelStream.write(row);
		}
	});
	outputStreams.csvCatEntAttrDictAttrRelStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntAttrDictAttrRelStream.on('finish', function(){
		fsoutputStreams.csvCatEntAttrDictAttrRelStream.end();
	});
	outputStreams.csvCatEntAttrDictAttrRelStream.write(['CatalogEntryAttributeDictionaryAttributeRelationship','','','','','','','','','','','']);
	outputStreams.csvCatEntAttrDictAttrRelStream.write(['PartNumber','AttributeIdentifier','LanguageId','ValueIdentifier','Value','Usage','Sequence','AttributeStoreIdentifier','Field1','Field2','Field3','Delete']);

	// -- CatalogEntryParentCatalogGroupRelationship
	outputStreams.csvCatEntParentCatGrpRelStream = stringify(writeoptions);
	outputStreams.csvCatEntParentCatGrpRelStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntParentCatGrpRelStream === undefined)
		{
			fsoutputStreams.csvCatEntParentCatGrpRelStream = fs.createWriteStream(outputDirectory + 'catentrycatgrprel-EMR-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntParentCatGrpRelStream.read()) !== null){
			fsoutputStreams.csvCatEntParentCatGrpRelStream.write(row);
		}
	});
	outputStreams.csvCatEntParentCatGrpRelStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntParentCatGrpRelStream.on('finish', function(){
		fsoutputStreams.csvCatEntParentCatGrpRelStream.end();
	});
	outputStreams.csvCatEntParentCatGrpRelStream.write(['CatalogEntryParentCatalogGroupRelationship','','','','','']);
	outputStreams.csvCatEntParentCatGrpRelStream.write(['PartNumber','Type','ParentGroupIdentifier','ParentStoreIdentifier','Sequence','Delete']);


	// -- AttributeDictionaryAttributeAllowedValues
	outputStreams.csvAttrDictAttrAllowValsStream = stringify(writeoptions);
	outputStreams.csvAttrDictAttrAllowValsStream.on('readable', function(){
		if (fsoutputStreams.csvAttrDictAttrAllowValsStream === undefined)
		{
			fsoutputStreams.csvAttrDictAttrAllowValsStream = fs.createWriteStream(outputDirectory + 'attrdictattrallowvals-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvAttrDictAttrAllowValsStream.read()) !== null){
			fsoutputStreams.csvAttrDictAttrAllowValsStream.write(row);
		}
	});
	outputStreams.csvAttrDictAttrAllowValsStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvAttrDictAttrAllowValsStream.on('finish', function(){
		fsoutputStreams.csvAttrDictAttrAllowValsStream.end();
	});
	outputStreams.csvAttrDictAttrAllowValsStream.write(['AttributeDictionaryAttributeAllowedValues','','','','','','','','','','','','','','']);
	outputStreams.csvAttrDictAttrAllowValsStream.write(['Identifier','LanguageId','ValueIdentifier','Sequence','Value','ValueUsage','AttributeValueField1','AttributeValueField2','AttributeValueField3','Image1','Image2','Field1','Field2','Field3','Delete']);

	createFileForArchive(outputDirectory,batchid);
	
	return outputStreams;
};


//create the file with batchid that will use for archiving
function createFileForArchive(outputDirectory,batchid){
	fsWriteStream = fs.createWriteStream(outputDirectory+'dataload_csv_' + batchid + ".txt");
	
	fsWriteStream.write(batchid);
	
	fsWriteStream.end();
	
}
