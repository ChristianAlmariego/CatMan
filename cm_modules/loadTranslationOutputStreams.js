//global variable
var fsoutputStreams = {};

// Load all required packages
var stringify = require('csv-stringify'),
	fs = require('fs'),
	os = require('os');

var validLocales;
var outputStreams = {};
var row = '';

// csv-parse options for asynchronous writing of the output files.  All of these arguments are optional.
var writeoptions = {
    delimiter : ',', // default is , 
    endLine : '\n', // default is \n, 
	columns : false, // default is null
    escapeChar : '"', // default is an empty string 
    enclosedChar : '"' // default is an empty string
};

function readableMetaDesc(j, outputDirectory, batchid){
	return function()
	{
		if (fsoutputStreams['csvCatEntSEOMetaDescStream' + j] === undefined)
		{
			fsoutputStreams['csvCatEntSEOMetaDescStream' + j] = fs.createWriteStream(outputDirectory+'/catentry' + batchid + 'metadesc' + validLocales[j] + '-output.csv', {highWaterMark: Math.pow(2,14)});
			fsoutputStreams['csvCatEntSEOMetaDescStream' + j].write('CatalogEntryDescription,,' + os.EOL);
			fsoutputStreams['csvCatEntSEOMetaDescStream' + j].write('PartNumber,MetaDescription,Delete' + os.EOL);
		}
		while((row = outputStreams['csvCatEntSEOMetaDescStream' + j].read()) !== null){
			fsoutputStreams['csvCatEntSEOMetaDescStream' + j].write(row);
		}
	};
}

function errorFunction(){
	return function(err)
	{
		console.log(err.message);
	};
}

function finishMetaDesc(j){
	return function()
	{
		fsoutputStreams['csvCatEntSEOMetaDescStream' + j].end();
	};
}

function readablePageTitle(j, outputDirectory, batchid){
	return function()
	{
		if (fsoutputStreams['csvCatEntSEOPageTitleStream' + j] === undefined)
		{
			fsoutputStreams['csvCatEntSEOPageTitleStream' + j] = fs.createWriteStream(outputDirectory+'/catentry' + batchid + 'pagetitle' + validLocales[j] + '-output.csv', {highWaterMark: Math.pow(2,14)});
			fsoutputStreams['csvCatEntSEOPageTitleStream' + j].write('CatalogEntryDescription,,' + os.EOL);
			fsoutputStreams['csvCatEntSEOPageTitleStream' + j].write('PartNumber,PageTitle,Delete' + os.EOL);
		}
		while((row = outputStreams['csvCatEntSEOPageTitleStream' + j].read()) !== null){
			fsoutputStreams['csvCatEntSEOPageTitleStream' + j].write(row);
		}
	};
}

function finishPageTitle(j){
	return function()
	{
		fsoutputStreams['csvCatEntSEOPageTitleStream' + j].end();
	};
}

exports.getOutputStreams = function(outputDirectory, batchid,validLocalesParam) {
	validLocales = validLocalesParam;

	// -- CatalogEntryDescription - Name
	outputStreams.csvCatEntDescNameStream = stringify(writeoptions);
	outputStreams.csvCatEntDescNameStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntDescNameStream === undefined)
		{
			fsoutputStreams.csvCatEntDescNameStream = fs.createWriteStream(outputDirectory+'/catentry' + batchid + 'name-output.csv', {highWaterMark: Math.pow(2,14)});
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
	outputStreams.csvCatEntDescNameStream.write(['PartNumber','LanguageId','Name','Delete']);

	// -- CatalogEntryDescription - LongDescription
	outputStreams.csvCatEntDescLongDescStream = stringify(writeoptions);
	outputStreams.csvCatEntDescLongDescStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntDescLongDescStream === undefined)
		{
			fsoutputStreams.csvCatEntDescLongDescStream = fs.createWriteStream(outputDirectory+'/catentry' + batchid + 'longdesc-output.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntDescLongDescStream.read()) !== null){
			fsoutputStreams.csvCatEntDescLongDescStream.write(row);
		}
	});
	outputStreams.csvCatEntDescLongDescStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntDescLongDescStream.on('finish', function(){
		fsoutputStreams.csvCatEntDescLongDescStream.end();
	});
	outputStreams.csvCatEntDescLongDescStream.write(['CatalogEntryDescription','','','','']);
	outputStreams.csvCatEntDescLongDescStream.write(['PartNumber','LanguageId','LongDescription','Delete']);

	// -- CatalogEntryDescription - Published
	outputStreams.csvCatEntDescPublishedStream = stringify(writeoptions);
	outputStreams.csvCatEntDescPublishedStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntDescPublishedStream === undefined)
		{
			fsoutputStreams.csvCatEntDescPublishedStream = fs.createWriteStream(outputDirectory+'/catentry' + batchid + 'published-output.csv', {highWaterMark: Math.pow(2,14)});
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
	outputStreams.csvCatEntDescPublishedStream.write(['PartNumber','LanguageId','Published','Delete']);

	// -- CatalogEntryDescription - Keyword
	outputStreams.csvCatEntDescKeywordStream = stringify(writeoptions);
	outputStreams.csvCatEntDescKeywordStream = stringify(writeoptions);
	outputStreams.csvCatEntDescKeywordStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntDescKeywordStream === undefined)
		{
			fsoutputStreams.csvCatEntDescKeywordStream = fs.createWriteStream(outputDirectory+'/catentry' + batchid + 'keyword-output.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntDescKeywordStream.read()) !== null){
			fsoutputStreams.csvCatEntDescKeywordStream.write(row);
		}
	});
	outputStreams.csvCatEntDescKeywordStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntDescKeywordStream.on('finish', function(){
		fsoutputStreams.csvCatEntDescKeywordStream.end();
	});
	outputStreams.csvCatEntDescKeywordStream.write(['CatalogEntryDescription','','','','']);
	outputStreams.csvCatEntDescKeywordStream.write(['PartNumber','LanguageId','Keyword','Delete']);

	// -- CatalogEntryDescription - URLKeyword
	outputStreams.csvCatEntSEOUrlKeywordStream = stringify(writeoptions);
	outputStreams.csvCatEntSEOUrlKeywordStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntSEOUrlKeywordStream === undefined)
		{
			fsoutputStreams.csvCatEntSEOUrlKeywordStream = fs.createWriteStream(outputDirectory+'/catentry' + batchid + 'urlkeyword-output.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntSEOUrlKeywordStream.read()) !== null){
			fsoutputStreams.csvCatEntSEOUrlKeywordStream.write(row);
		}
	});
	outputStreams.csvCatEntSEOUrlKeywordStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntSEOUrlKeywordStream.on('finish', function(){
		fsoutputStreams.csvCatEntSEOUrlKeywordStream.end();
	});
	outputStreams.csvCatEntSEOUrlKeywordStream.write(['CatalogEntryDescription','','','','']);
	outputStreams.csvCatEntSEOUrlKeywordStream.write(['PartNumber','LanguageId','URLKeyword','Delete']);

	// -- CatalogEntryDescription - PageTitle
	for (var k in validLocales)
	{
		outputStreams['csvCatEntSEOPageTitleStream' + k] = stringify(writeoptions);
		outputStreams['csvCatEntSEOPageTitleStream' + k].on('readable', readablePageTitle(k, outputDirectory, batchid));
		outputStreams['csvCatEntSEOPageTitleStream' + k].on('error', errorFunction());
		outputStreams['csvCatEntSEOPageTitleStream' + k].on('finish', finishPageTitle(k));
	}

	// -- CatalogEntryDescription - MetaDescription
	for (var k in validLocales)
	{
		outputStreams['csvCatEntSEOMetaDescStream' + k] = stringify(writeoptions);
		outputStreams['csvCatEntSEOMetaDescStream' + k].on('readable', readableMetaDesc(k, outputDirectory, batchid));
		outputStreams['csvCatEntSEOMetaDescStream' + k].on('error', errorFunction());
		outputStreams['csvCatEntSEOMetaDescStream' + k].on('finish', finishMetaDesc(k));
	}

	// -- CatalogEntryAttributeDictionaryAttributeRelationship
	outputStreams.csvCatEntAttrDictAttrRelStream = stringify(writeoptions);
	outputStreams.csvCatEntAttrDictAttrRelStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntAttrDictAttrRelStream === undefined)
		{
			fsoutputStreams.csvCatEntAttrDictAttrRelStream = fs.createWriteStream(outputDirectory+'/catentry' + batchid + 'attrrel-output.csv', {highWaterMark: Math.pow(2,14)});
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

	// -- AttributeDictionaryAttributeAllowedValues
	outputStreams.csvAttrDictAttrAllowValsStream = stringify(writeoptions);
	outputStreams.csvAttrDictAttrAllowValsStream.on('readable', function(){
		if (fsoutputStreams.csvAttrDictAttrAllowValsStream === undefined)
		{
			fsoutputStreams.csvAttrDictAttrAllowValsStream = fs.createWriteStream(outputDirectory+'/catentry' + batchid + 'attrdictattrallowvals-output.csv', {highWaterMark: Math.pow(2,14)});
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

	// -- AttributeDictionaryAttributeAndAllowedValues
	outputStreams.csvAttrDictAttrStream = stringify(writeoptions);
	outputStreams.csvAttrDictAttrStream.on('readable', function(){
		if (fsoutputStreams.csvAttrDictAttrStream === undefined)
		{
			fsoutputStreams.csvAttrDictAttrStream = fs.createWriteStream(outputDirectory+'/catentry' + batchid + 'attrdictattr-output.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvAttrDictAttrStream.read()) !== null){
			fsoutputStreams.csvAttrDictAttrStream.write(row);
		}
	});
	outputStreams.csvAttrDictAttrStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvAttrDictAttrStream.on('finish', function(){
		fsoutputStreams.csvAttrDictAttrStream.end();
	});
	outputStreams.csvAttrDictAttrStream.write(['AttributeDictionaryAttributeAndAllowedValues','','','','','','','','','','','','','','','','','','','','']);
	outputStreams.csvAttrDictAttrStream.write(['Identifier','Type','AttributeType','Sequence','Displayable','Searchable','Comparable','Facetable','STOREDISPLAY','Merchandisable','AttributeField1','AttributeField2','AttributeField3','LanguageId','Name','Description','SecondaryDescription','AssociatedKeyword','Field1','Footnote','UnitOfMeasure']);

	// -- Catalog Group Description
	outputStreams.csvCatGrpDesc = stringify(writeoptions);
	outputStreams.csvCatGrpDesc.on('readable', function(){
		if (fsoutputStreams.csvCatGrpDesc === undefined)
		{
			fsoutputStreams.csvCatGrpDesc = fs.createWriteStream(outputDirectory+'/salescatalog' + batchid + '-emrcatgrpdesc.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatGrpDesc.read()) !== null){
			fsoutputStreams.csvCatGrpDesc.write(row);
		}
	});
	outputStreams.csvCatGrpDesc.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatGrpDesc.on('finish', function(){
		fsoutputStreams.csvCatGrpDesc.end();
	});
	outputStreams.csvCatGrpDesc.write(['CatalogGroupDescription','','','','','','','','','','','','','','']);
	outputStreams.csvCatGrpDesc.write(['GroupIdentifier','LanguageId','Name','ShortDescription','LongDescription','Thumbnail','FullImage','Published','Keyword','Note','URLKeyword','PageTitle','MetaDescription','ImageAltText','Delete']);

	return outputStreams;
};
