//global variable
var fsoutputStreams = {};
var outputStreams = {};
var validLocales;

var fsWriteStream;

// Load all required packages
var stringify = require('csv-stringify'),
	os = require('os');
	fs = require('fs');

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

exports.getOutputStreams = function(jsonObject,batchid) {
	validLocales = jsonObject.validLocales;
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
	outputStreams.csvCatEntStream.write(['PartNumber','Type','ParentPartNumber','Manufacturer','ManufacturerPartNumber','Sequence','ParentGroupIdentifier','Delete']);

	// -- CatalogEntry - On Special
	outputStreams.csvCatEntOnSpecialStream = stringify(writeoptions);
	outputStreams.csvCatEntOnSpecialStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntOnSpecialStream === undefined)
		{
			fsoutputStreams.csvCatEntOnSpecialStream = fs.createWriteStream(outputDirectory + 'catentryonspecial-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntOnSpecialStream.read()) !== null){
			fsoutputStreams.csvCatEntOnSpecialStream.write(row);
		}
	});
	outputStreams.csvCatEntOnSpecialStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntOnSpecialStream.on('finish', function(){
		fsoutputStreams.csvCatEntOnSpecialStream.end();
	});
	outputStreams.csvCatEntOnSpecialStream .write(['CatalogEntry','','','']);
	outputStreams.csvCatEntOnSpecialStream .write(['PartNumber','Type','OnSpecial','Delete']);

	// -- CatalogEntry - For Purchase
	outputStreams.csvCatEntForPurchaseStream = stringify(writeoptions);
	outputStreams.csvCatEntForPurchaseStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntForPurchaseStream === undefined)
		{
			fsoutputStreams.csvCatEntForPurchaseStream = fs.createWriteStream(outputDirectory + 'catentryforpurchase-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntForPurchaseStream.read()) !== null){
			fsoutputStreams.csvCatEntForPurchaseStream.write(row);
		}
	});
	outputStreams.csvCatEntForPurchaseStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntForPurchaseStream.on('finish', function(){
		fsoutputStreams.csvCatEntForPurchaseStream.end();
	});
	outputStreams.csvCatEntForPurchaseStream.write(['CatalogEntry','','','']);
	outputStreams.csvCatEntForPurchaseStream.write(['PartNumber','Type','Buyable','Delete']);

	// -- CatalogEntry - Price
	outputStreams.csvCatEntPriceStream = stringify(writeoptions);
	outputStreams.csvCatEntPriceStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntPriceStream === undefined)
		{
			fsoutputStreams.csvCatEntPriceStream = fs.createWriteStream(outputDirectory + 'catentryprice-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntPriceStream.read()) !== null){
			fsoutputStreams.csvCatEntPriceStream.write(row);
		}
	});
	outputStreams.csvCatEntPriceStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntPriceStream.on('finish', function(){
		fsoutputStreams.csvCatEntPriceStream.end();
	});
	outputStreams.csvCatEntPriceStream.write(['CatalogEntry','','','','','']);
	outputStreams.csvCatEntPriceStream.write(['PartNumber','Type','CurrencyCode','ListPrice','Price','Delete']);

	// -- CatalogEntry - URL
	outputStreams.csvCatEntURLStream = stringify(writeoptions);
	outputStreams.csvCatEntURLStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntURLStream === undefined)
		{
			fsoutputStreams.csvCatEntURLStream = fs.createWriteStream(outputDirectory + 'catentryurl-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntURLStream.read()) !== null){
			fsoutputStreams.csvCatEntURLStream.write(row);
		}
	});
	outputStreams.csvCatEntURLStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntURLStream.on('finish', function(){
		fsoutputStreams.csvCatEntURLStream.end();
	});
	outputStreams.csvCatEntURLStream.write(['CatalogEntry','','','']);
	outputStreams.csvCatEntURLStream.write(['PartNumber','Type','URL','Delete']);

	// -- CatalogEntry - Subscription item
	outputStreams.csvCatEntSubsStream = stringify(writeoptions);
	outputStreams.csvCatEntSubsStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntSubsStream === undefined)
		{
			fsoutputStreams.csvCatEntSubsStream = fs.createWriteStream(outputDirectory + 'catentrysubs-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntSubsStream.read()) !== null){
			fsoutputStreams.csvCatEntSubsStream.write(row);
		}
	});
	outputStreams.csvCatEntSubsStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntSubsStream.on('finish', function(){
		fsoutputStreams.csvCatEntSubsStream.end();
	});
	outputStreams.csvCatEntSubsStream.write(['CatalogEntry','','','']);
	outputStreams.csvCatEntSubsStream.write(['PartNumber','Type','SUBSCPTYPE_ID','Delete']);

	// -- CatalogEntry - Recurring order item
	outputStreams.csvCatEntRecOrderStream = stringify(writeoptions);
	outputStreams.csvCatEntRecOrderStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntRecOrderStream === undefined)
		{
			fsoutputStreams.csvCatEntRecOrderStream = fs.createWriteStream(outputDirectory + 'catentryrecorder-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntRecOrderStream.read()) !== null){
			fsoutputStreams.csvCatEntRecOrderStream.write(row);
		}
	});
	outputStreams.csvCatEntRecOrderStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntRecOrderStream.on('finish', function(){
		fsoutputStreams.csvCatEntRecOrderStream.end();
	});
	outputStreams.csvCatEntRecOrderStream.write(['CatalogEntry','','','']);
	outputStreams.csvCatEntRecOrderStream.write(['PartNumber','Type','DISALLOW_REC_ORDER','Delete']);

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

	// -- CatalogEntryDescription - LongDescription
	outputStreams.csvCatEntDescLongDescStream = stringify(writeoptions);
	outputStreams.csvCatEntDescLongDescStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntDescLongDescStream === undefined)
		{
			fsoutputStreams.csvCatEntDescLongDescStream = fs.createWriteStream(outputDirectory + 'catentrylongdesc-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
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
	outputStreams.csvCatEntDescLongDescStream.write(['PartNumber','Type','LanguageId','LongDescription','Delete']);

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

	// -- CatalogEntryDescription - Keyword
	outputStreams.csvCatEntDescKeywordStream = stringify(writeoptions);
	outputStreams.csvCatEntDescKeywordStream = stringify(writeoptions);
	outputStreams.csvCatEntDescKeywordStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntDescKeywordStream === undefined)
		{
			fsoutputStreams.csvCatEntDescKeywordStream = fs.createWriteStream(outputDirectory + 'catentrykeyword-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
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
	outputStreams.csvCatEntDescKeywordStream.write(['PartNumber','Type','LanguageId','Keyword','Delete']);

	// -- CatalogEntryDescription - URLKeyword
	outputStreams.csvCatEntSEOUrlKeywordStream = stringify(writeoptions);
	outputStreams.csvCatEntSEOUrlKeywordStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntSEOUrlKeywordStream === undefined)
		{
			fsoutputStreams.csvCatEntSEOUrlKeywordStream = fs.createWriteStream(outputDirectory + 'catentryurlkeyword-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
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
	outputStreams.csvCatEntSEOUrlKeywordStream.write(['PartNumber','Type','LanguageId','URLKeyword','Delete']);

	// -- CatalogEntryDescription - PageTitle
	outputStreams.csvCatEntSEOPageTitleStream = stringify(writeoptions);
	outputStreams.csvCatEntSEOPageTitleStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntSEOPageTitleStream === undefined)
		{
			fsoutputStreams.csvCatEntSEOPageTitleStream = fs.createWriteStream(outputDirectory + 'catentrypagetitle-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntSEOPageTitleStream.read()) !== null){
			fsoutputStreams.csvCatEntSEOPageTitleStream.write(row);
		}
	});
	outputStreams.csvCatEntSEOPageTitleStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntSEOPageTitleStream.on('finish', function(){
		fsoutputStreams.csvCatEntSEOPageTitleStream.end();
	});
	outputStreams.csvCatEntSEOPageTitleStream.write(['CatalogEntryDescription','','','','']);
	outputStreams.csvCatEntSEOPageTitleStream.write(['PartNumber','Type','LanguageId','PageTitle','Delete']);

	// -- CatalogEntryDescription - MetaDescription
	outputStreams.csvCatEntSEOMetaDescStream = stringify(writeoptions);
	outputStreams.csvCatEntSEOMetaDescStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntSEOMetaDescStream === undefined)
		{
			fsoutputStreams.csvCatEntSEOMetaDescStream = fs.createWriteStream(outputDirectory + 'catentrymetadesc-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntSEOMetaDescStream.read()) !== null){
			fsoutputStreams.csvCatEntSEOMetaDescStream.write(row);
		}
	});
	outputStreams.csvCatEntSEOMetaDescStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntSEOMetaDescStream.on('finish', function(){
		fsoutputStreams.csvCatEntSEOMetaDescStream.end();
	});
	outputStreams.csvCatEntSEOMetaDescStream.write(['CatalogEntryDescription','','','','']);
	outputStreams.csvCatEntSEOMetaDescStream.write(['PartNumber','Type','LanguageId','MetaDescription','Delete']);

	// -- CatalogEntryDescription - PageTitle - non en_US
	for (var k in validLocales)
	{
		outputStreams['csvCatEntSEOPageTitleStream' + k] = stringify(writeoptions);
		outputStreams['csvCatEntSEOPageTitleStream' + k].on('readable', readablePageTitle(k, outputDirectory, batchid));
		outputStreams['csvCatEntSEOPageTitleStream' + k].on('error', errorFunction());
		outputStreams['csvCatEntSEOPageTitleStream' + k].on('finish', finishPageTitle(k));
	}

	// -- CatalogEntryDescription - MetaDescription - non en_US
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


	// -- CatalogEntryAttributeDictionaryAttributeRelationship - Single
	outputStreams.csvCatEntAttrDictAttrRelSingleStream = stringify(writeoptions);
	outputStreams.csvCatEntAttrDictAttrRelSingleStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntAttrDictAttrRelSingleStream === undefined)
		{
			fsoutputStreams.csvCatEntAttrDictAttrRelSingleStream = fs.createWriteStream(outputDirectory + 'catentryattrrel-single-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntAttrDictAttrRelSingleStream.read()) !== null){
			fsoutputStreams.csvCatEntAttrDictAttrRelSingleStream.write(row);
		}
	});
	outputStreams.csvCatEntAttrDictAttrRelSingleStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntAttrDictAttrRelSingleStream.on('finish', function(){
		fsoutputStreams.csvCatEntAttrDictAttrRelSingleStream.end();
	});
	outputStreams.csvCatEntAttrDictAttrRelSingleStream.write(['CatalogEntryAttributeDictionaryAttributeRelationship','','','','','','','','','','','']);
	outputStreams.csvCatEntAttrDictAttrRelSingleStream.write(['PartNumber','AttributeIdentifier','LanguageId','ValueIdentifier','Value','Usage','Sequence','AttributeStoreIdentifier','Field1','Field2','Field3','Delete']);


		// -- CatalogEntryAttributeDictionaryAttributeRelationship - Deletion
		outputStreams.csvCatEntAttrDictAttrRelDeleteStream = stringify(writeoptions);
		outputStreams.csvCatEntAttrDictAttrRelDeleteStream.on('readable', function(){
			if (fsoutputStreams.csvCatEntAttrDictAttrRelDeleteStream === undefined)
			{
				fsoutputStreams.csvCatEntAttrDictAttrRelDeleteStream = fs.createWriteStream(outputDirectory + 'catentryattrrel-delete-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
			}
			while((row = outputStreams.csvCatEntAttrDictAttrRelDeleteStream.read()) !== null){
				fsoutputStreams.csvCatEntAttrDictAttrRelDeleteStream.write(row);
			}
		});
		outputStreams.csvCatEntAttrDictAttrRelDeleteStream.on('error', function(err){
			console.log(err.message);
		});
		outputStreams.csvCatEntAttrDictAttrRelDeleteStream.on('finish', function(){
			fsoutputStreams.csvCatEntAttrDictAttrRelDeleteStream.end();
		});
		outputStreams.csvCatEntAttrDictAttrRelDeleteStream.write(['CatalogEntryAttributeDictionaryAttributeRelationship','','','','','','','','','','','']);
		outputStreams.csvCatEntAttrDictAttrRelDeleteStream.write(['PartNumber','AttributeIdentifier','LanguageId','ValueIdentifier','Value','Usage','Sequence','AttributeStoreIdentifier','Field1','Field2','Field3','Delete']);

		// -- CatalogEntryDeletion
		outputStreams.csvCatalogEntryDeleteStream = stringify(writeoptions);
		outputStreams.csvCatalogEntryDeleteStream.on('readable', function(){
			if (fsoutputStreams.csvCatalogEntryDeleteStream === undefined)
			{
				fsoutputStreams.csvCatalogEntryDeleteStream = fs.createWriteStream(outputDirectory + 'catentry-delete-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
			}
			while((row = outputStreams.csvCatalogEntryDeleteStream.read()) !== null){
				fsoutputStreams.csvCatalogEntryDeleteStream.write(row);
			}
		});
		outputStreams.csvCatalogEntryDeleteStream.on('error', function(err){
			console.log(err.message);
		});
		outputStreams.csvCatalogEntryDeleteStream.on('finish', function(){
			fsoutputStreams.csvCatalogEntryDeleteStream.end();
		});
		outputStreams.csvCatalogEntryDeleteStream.write(['CatalogEntry','','','','','','','']);
		outputStreams.csvCatalogEntryDeleteStream.write(['PartNumber','Type','ParentPartNumber','Manufacturer','ManufacturerPartNumber','Sequence','ParentGroupIdentifier','Delete']);

		// -- CatalogEntry Master Category
		outputStreams.catEntCatGrpRelStream = stringify(writeoptions);
		outputStreams.catEntCatGrpRelStream.on('readable', function() {
			if (fsoutputStreams.catEntCatGrpRelStream === undefined) {
				fsoutputStreams.catEntCatGrpRelStream = fs.createWriteStream(outputDirectory + 'catentrycatgrprel-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
			}
			while((row = outputStreams.catEntCatGrpRelStream.read()) !== null) {
				fsoutputStreams.catEntCatGrpRelStream.write(row);
			}
		});
		outputStreams.catEntCatGrpRelStream.on('error', function(err) {
			console.log(err.message);
		});
		outputStreams.catEntCatGrpRelStream.on('finish', function(){
			fsoutputStreams.catEntCatGrpRelStream.end();
		});
		outputStreams.catEntCatGrpRelStream.write(['CatalogEntryMasterCategory','','','','','']);
		outputStreams.catEntCatGrpRelStream.write(['PartNumber','Type','ParentGroupIdentifier','ParentStoreIdentifier','Sequence','Delete']);

		// -- CatalogEntry Master Category Deletion
		outputStreams.catEntCatGrpRelDeleteStream = stringify(writeoptions);
		outputStreams.catEntCatGrpRelDeleteStream.on('readable', function() {
			if (fsoutputStreams.catEntCatGrpRelDeleteStream === undefined) {
				fsoutputStreams.catEntCatGrpRelDeleteStream = fs.createWriteStream(outputDirectory + 'catentrycatgrprel-delete-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
			}
			while((row = outputStreams.catEntCatGrpRelDeleteStream.read()) !== null) {
				fsoutputStreams.catEntCatGrpRelDeleteStream.write(row);
			}
		});
		outputStreams.catEntCatGrpRelDeleteStream.on('error', function(err) {
			console.log(err.message);
		});
		outputStreams.catEntCatGrpRelDeleteStream.on('finish', function(){
			fsoutputStreams.catEntCatGrpRelDeleteStream.end();
		});
		outputStreams.catEntCatGrpRelDeleteStream.write(['CatalogEntryMasterCategory','','','','','']);
		outputStreams.catEntCatGrpRelDeleteStream.write(['PartNumber','Type','ParentGroupIdentifier','ParentStoreIdentifier','Sequence','Delete']);

		// --CatalogEntryParentSkuDeletion
		outputStreams.csvCatalogParentSkuDeleteStream = stringify(writeoptions);
		outputStreams.csvCatalogParentSkuDeleteStream.on('readable', function(){
			if (fsoutputStreams.csvCatalogParentSkuDeleteStream === undefined){
				fsoutputStreams.csvCatalogParentSkuDeleteStream = fs.createWriteStream(outputDirectory + 'catentrycatentreldel-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
			}
			while((row = outputStreams.csvCatalogParentSkuDeleteStream.read()) != null ){
				fsoutputStreams.csvCatalogParentSkuDeleteStream.write(row);
			}
		});
		outputStreams.csvCatalogParentSkuDeleteStream.on('error',function(err){
			console.log(err.message);
		});
		outputStreams.csvCatalogParentSkuDeleteStream.on('finish', function(){
			fsoutputStreams.csvCatalogParentSkuDeleteStream.end();
		});
		outputStreams.csvCatalogParentSkuDeleteStream.write(['CatalogEntryParentSkuDeletion','','','','']);
		outputStreams.csvCatalogParentSkuDeleteStream.write(['PartNumber','ParentPartNumber','Type','Sequence','Delete']);

		// --CatalogEntryParentSkuUpdate (New Parent/SKU Relationship without Sequence)
		outputStreams.csvCatalogParentSkuUpdateStream = stringify(writeoptions);
		outputStreams.csvCatalogParentSkuUpdateStream.on('readable',function(){
			if(fsoutputStreams.csvCatalogParentSkuUpdateStream === undefined){
				fsoutputStreams.csvCatalogParentSkuUpdateStream = fs.createWriteStream(outputDirectory + 'catentrycatentrelnew-output' + batchid + '.csv', {highWaterMark:Math.pow(2,14)});
			}
			while((row = outputStreams.csvCatalogParentSkuUpdateStream.read()) !==null){
				fsoutputStreams.csvCatalogParentSkuUpdateStream.write(row);
			}
		});
		outputStreams.csvCatalogParentSkuUpdateStream.on('error',function(err){
			console.log(err.message);
		});
		outputStreams.csvCatalogParentSkuUpdateStream.on('finish',function(){
			fsoutputStreams.csvCatalogParentSkuUpdateStream.end();
		});
		outputStreams.csvCatalogParentSkuUpdateStream.write(['CatalogEntryParentSkuUpdate','','','']);
		outputStreams.csvCatalogParentSkuUpdateStream.write(['PartNumber','Sequence','ParentPartNumber','Type','Delete']);	

		// --CatalogEntryHideAttributes
		outputStreams.csvCatalogEntryHideAttributesStream = stringify(writeoptions);
		outputStreams.csvCatalogEntryHideAttributesStream.on('readable',function(){
			if(fsoutputStreams.csvCatalogEntryHideAttributesStream === undefined){
				fsoutputStreams.csvCatalogEntryHideAttributesStream = fs.createWriteStream(outputDirectory + 'catentryattrrel-hide-output' + batchid + '.csv', {highWaterMark:Math.pow(2,14)});
			}
			while((row = outputStreams.csvCatalogEntryHideAttributesStream.read()) !== null){
				fsoutputStreams.csvCatalogEntryHideAttributesStream.write(row);
			}
		});
		outputStreams.csvCatalogEntryHideAttributesStream.on('error',function(err){
			console.log(err.message);
		});
		outputStreams.csvCatalogEntryHideAttributesStream.on('finish',function(){
			fsoutputStreams.csvCatalogEntryHideAttributesStream.end();
		});
		outputStreams.csvCatalogEntryHideAttributesStream.write(['CatalogEntryHideAttributes','','','','','','','','','','','']);
		outputStreams.csvCatalogEntryHideAttributesStream.write(['PartNumber','AttributeIdentifier','LanguageId','ValueIdentifier','Value','Usage','Sequence','AttributeStoreIdentifier','Field1','Field2','Field3','Delete']);


		// -- CatalogEntryURLKeywordDeletion
//		outputStreams.csvCatalogEntryURLKeywordDeleteStream = stringify(writeoptions);
//		outputStreams.csvCatalogEntryURLKeywordDeleteStream.on('readable', function(){
//			if (fsoutputStreams.csvCatalogEntryURLKeywordDeleteStream === undefined)
//			{
//				fsoutputStreams.csvCatalogEntryURLKeywordDeleteStream = fs.createWriteStream(outputDirectory + 'catentryurlkeyword-delete-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
//			}
//			while((row = outputStreams.csvCatalogEntryURLKeywordDeleteStream.read()) !== null){
//				fsoutputStreams.csvCatalogEntryURLKeywordDeleteStream.write(row);
//			}
//		});
//		outputStreams.csvCatalogEntryURLKeywordDeleteStream.on('error', function(err){
//			console.log(err.message);
//		});
//		outputStreams.csvCatalogEntryURLKeywordDeleteStream.on('finish', function(){
//			fsoutputStreams.csvCatalogEntryURLKeywordDeleteStream.end();
//		});
//		outputStreams.csvCatalogEntryURLKeywordDeleteStream.write(['CatalogEntryURLKeyword','','']);
//		outputStreams.csvCatalogEntryURLKeywordDeleteStream.write(['PartNumber','URLKeyword','LanguageID','Delete']);


	// -- CatalogEntryParentCatalogGroupRelationship
	//multi store support: load catgrprelstream for each supported store
	outputStreams.storesCatEntParentCatGrpRelStreams = [];
	var store;
	for (var i=0; i<jsonObject.supportedStores.length; i++) {
		store = jsonObject.supportedStores[i]['wcStoreIdentifier'];
		//console.log('load catentParentCatgrpEnRel OutputStream for ' + store);
		outputStreams.storesCatEntParentCatGrpRelStreams[store] = loadOutputStreamForStore(store,outputStreams,outputDirectory,batchid);
	}





// -- CatalogEntryParentCatalogGroupRelationship for Sequence Update
outputStreams.storesCatEntParentCatGrpRelStreamsSeq = [];
	var store;
	for (var i=0; i<jsonObject.supportedStores.length; i++) {
		store = jsonObject.supportedStores[i]['wcStoreIdentifier'];
		//console.log('load catentParentCatgrpEnRel OutputStream for ' + store);
		outputStreams.storesCatEntParentCatGrpRelStreamsSeq[store] = loadOutputStreamForStoreSequence(store,outputStreams,outputDirectory,batchid);
	}

			
			//************************************************
			//-- CatalogEntryParentProductRelationship (WITH SEQUENCE)
			outputStreams.csvCatEntParentProductRelStreamSeq = stringify(writeoptions);
			outputStreams.csvCatEntParentProductRelStreamSeq.on('readable', function(){
				if (fsoutputStreams.csvCatEntParentProductRelStreamSeq === undefined)
			{
					fsoutputStreams.csvCatEntParentProductRelStreamSeq = fs.createWriteStream(outputDirectory + 'catentrycatentrelseq-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
			}
			while((row = outputStreams.csvCatEntParentProductRelStreamSeq.read()) !== null){
			 		fsoutputStreams.csvCatEntParentProductRelStreamSeq.write(row);
			 	}
			 });
			 outputStreams.csvCatEntParentProductRelStreamSeq.on('error', function(err){
			 	console.log(err.message);
			 });
			 outputStreams.csvCatEntParentProductRelStreamSeq.on('finish', function(){
			 	fsoutputStreams.csvCatEntParentProductRelStreamSeq.end();
			 });
			 
			 outputStreams.csvCatEntParentProductRelStreamSeq.write(['CatalogEntryParentProductRelationship','','','']);
			 outputStreams.csvCatEntParentProductRelStreamSeq.write(['PartNumber','Sequence','ParentPartNumber','Delete']);
			//************************************************//	

	//************************************************
	//-- CatalogEntryParentCatalogGroupRelationship (WITH SEQUENCE)
	// outputStreams.csvCatEntParentCatGrpRelStreamSeq = stringify(writeoptions);
	// outputStreams.csvCatEntParentCatGrpRelStreamSeq.on('readable', function(){
	// 	if (fsoutputStreams.csvCatEntParentCatGrpRelStreamSeq === undefined)
	// 	{
	// 		fsoutputStreams.csvCatEntParentCatGrpRelStreamSeq = fs.createWriteStream(outputDirectory + 'catentrycatgrprelseq-EMR-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
	// 	}
	// 	while((row = outputStreams.csvCatEntParentCatGrpRelStreamSeq.read()) !== null){
	// 		fsoutputStreams.csvCatEntParentCatGrpRelStreamSeq.write(row);
	// 	}
	// });
	// outputStreams.csvCatEntParentCatGrpRelStreamSeq.on('error', function(err){
	// 	console.log(err.message);
	// });
	// outputStreams.csvCatEntParentCatGrpRelStreamSeq.on('finish', function(){
	// 	fsoutputStreams.csvCatEntParentCatGrpRelStreamSeq.end();
	// });
	// outputStreams.csvCatEntParentCatGrpRelStreamSeq.write(['CatalogEntryParentCatalogGroupRelationship','','','','']);
	// outputStreams.csvCatEntParentCatGrpRelStreamSeq.write(['Code','SalesCategoryIdentifier','Store','Sequence','Delete']);
	//************************************************//



	// -- CatalogEntryAssociation
	outputStreams.csvCatEntAssocStream = stringify(writeoptions);
	outputStreams.csvCatEntAssocStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntAssocStream === undefined)
		{
			fsoutputStreams.csvCatEntAssocStream = fs.createWriteStream(outputDirectory + 'catentryassoc-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntAssocStream.read()) !== null){
			fsoutputStreams.csvCatEntAssocStream.write(row);
		}
	});
	outputStreams.csvCatEntAssocStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntAssocStream.on('finish', function(){
		fsoutputStreams.csvCatEntAssocStream.end();
	});
	outputStreams.csvCatEntAssocStream.write(['CatalogEntryAssociation','','','','','','','']);
	outputStreams.csvCatEntAssocStream.write(['PartNumber','AssociationType','TargetPartNumber','TargetStoreIdentifier','Sequence','SemanticSpecifier','Quantity','Delete']);

	//EDS-8100: Changes added to Write Announcement Date and Withdrawal Date entries
	// -- CatalogEntryAnnouncementDate
	outputStreams.csvCatEntAnnouncementDateStream = stringify(writeoptions);
	outputStreams.csvCatEntAnnouncementDateStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntAnnouncementDateStream === undefined)
		{
			fsoutputStreams.csvCatEntAnnouncementDateStream = fs.createWriteStream(outputDirectory + 'catentryannouncementdate-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntAnnouncementDateStream.read()) !== null){
			fsoutputStreams.csvCatEntAnnouncementDateStream.write(row);
		}
	});
	outputStreams.csvCatEntAnnouncementDateStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntAnnouncementDateStream.on('finish', function(){
		fsoutputStreams.csvCatEntAnnouncementDateStream.end();
	});
	outputStreams.csvCatEntAnnouncementDateStream.write(['CatalogEntry','','','']);
	outputStreams.csvCatEntAnnouncementDateStream.write(['PartNumber','Type','StartDate','Delete']);
	
	// -- CatalogEntryWithdrawDate
	outputStreams.csvCatEntWithdrawDateStream = stringify(writeoptions);
	outputStreams.csvCatEntWithdrawDateStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntWithdrawDateStream === undefined)
		{
			fsoutputStreams.csvCatEntWithdrawDateStream = fs.createWriteStream(outputDirectory + 'catentrywithdrawdate-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntWithdrawDateStream.read()) !== null){
			fsoutputStreams.csvCatEntWithdrawDateStream.write(row);
		}
	});
	outputStreams.csvCatEntWithdrawDateStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntWithdrawDateStream.on('finish', function(){
		fsoutputStreams.csvCatEntWithdrawDateStream.end();
	});
	outputStreams.csvCatEntWithdrawDateStream.write(['CatalogEntry','','','']);
	outputStreams.csvCatEntWithdrawDateStream.write(['PartNumber','Type','EndDate','Delete']);

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

	// -- CatalogEntryComponent
	outputStreams.csvCatEntryComponentStream = stringify(writeoptions);
	outputStreams.csvCatEntryComponentStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntryComponentStream === undefined)
		{
			fsoutputStreams.csvCatEntryComponentStream = fs.createWriteStream(outputDirectory + 'catentrycomponent-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntryComponentStream.read()) !== null){
			fsoutputStreams.csvCatEntryComponentStream.write(row);
		}
	});
	outputStreams.csvCatEntryComponentStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntryComponentStream.on('finish', function(){
		fsoutputStreams.csvCatEntryComponentStream.end();
	});
	outputStreams.csvCatEntryComponentStream.write(['CatalogEntryComponent','','','','','','','','','','','','','','']);
	outputStreams.csvCatEntryComponentStream.write(['PartNumber','Type','ChildPartNumber','ChildStoreIdentifier','Sequence','SemanticSpecifier','Quantity','FIELD1','Delete']);

	// -- CatalogEntryComponentMerchandisingAssociation
	outputStreams.csvCatEntryComponentMerchAssocStream = stringify(writeoptions);
	outputStreams.csvCatEntryComponentMerchAssocStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntryComponentMerchAssocStream === undefined)
		{
			fsoutputStreams.csvCatEntryComponentMerchAssocStream = fs.createWriteStream(outputDirectory + 'catentrycomp-massoc-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntryComponentMerchAssocStream.read()) !== null){
			fsoutputStreams.csvCatEntryComponentMerchAssocStream.write(row);
		}
	});
	outputStreams.csvCatEntryComponentMerchAssocStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntryComponentMerchAssocStream.on('finish', function(){
		fsoutputStreams.csvCatEntryComponentMerchAssocStream.end();
	});
	outputStreams.csvCatEntryComponentMerchAssocStream.write(['CatalogEntryAssociation','','','','','','','','']);
	outputStreams.csvCatEntryComponentMerchAssocStream.write(['PartNumber','CatEntryTypeCode','AssociationType','TargetPartNumber','TargetStoreIdentifier','Sequence','SemanticSpecifier','Quantity','Field1','Delete']);


	// -- CatalogEntryClassificationCode
	outputStreams.csvCatEntryClassificationCodeStream = stringify(writeoptions);
	outputStreams.csvCatEntryClassificationCodeStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntryClassificationCodeStream === undefined)
		{
			fsoutputStreams.csvCatEntryClassificationCodeStream = fs.createWriteStream(outputDirectory + 'catentryclassificationcode-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntryClassificationCodeStream.read()) !== null){
			fsoutputStreams.csvCatEntryClassificationCodeStream.write(row);
		}
	});
	outputStreams.csvCatEntryClassificationCodeStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntryClassificationCodeStream.on('finish', function(){
		fsoutputStreams.csvCatEntryClassificationCodeStream.end();
	});
	outputStreams.csvCatEntryClassificationCodeStream.write(['ClassificationCode','','','']);
	outputStreams.csvCatEntryClassificationCodeStream.write(['PartNumber','Domain','Code','Delete']);

	// -- CatalogEntryHiddenFamilyCategory
	outputStreams.csvCatEntryHiddenFamilyCategoryStream = stringify(writeoptions);
	outputStreams.csvCatEntryHiddenFamilyCategoryStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntryHiddenFamilyCategoryStream === undefined)
		{
			fsoutputStreams.csvCatEntryHiddenFamilyCategoryStream = fs.createWriteStream(outputDirectory + 'catentryhiddenfamilycategory-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntryHiddenFamilyCategoryStream.read()) !== null){
			fsoutputStreams.csvCatEntryHiddenFamilyCategoryStream.write(row);
		}
	});
	outputStreams.csvCatEntryHiddenFamilyCategoryStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntryHiddenFamilyCategoryStream.on('finish', function(){
		fsoutputStreams.csvCatEntryHiddenFamilyCategoryStream.end();
	});
	outputStreams.csvCatEntryHiddenFamilyCategoryStream.write(['HiddenFamilyCategory','','','']);
	outputStreams.csvCatEntryHiddenFamilyCategoryStream.write(['PartNumber','Type', 'Category','Delete']);

	createFileForArchive(outputDirectory,batchid);

	return outputStreams;


};

//set up CatEntParentCatGrpRel outputStream for a given store
function loadOutputStreamForStore(store,outputStreams, outputDirectory,batchid) {

	var catpRelWriteStream = stringify(writeoptions);
	var catgpenrelFileName = outputDirectory + 'catentrycatgrprel-' + store + '-output' + batchid + '.csv';

	if (fsoutputStreams.csvCatEntParentCatGrpRelStream === undefined)
		fsoutputStreams.csvCatEntParentCatGrpRelStream =[];

	catpRelWriteStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntParentCatGrpRelStream[store] === undefined)
		{
			fsoutputStreams.csvCatEntParentCatGrpRelStream[store] = fs.createWriteStream(catgpenrelFileName, {highWaterMark: Math.pow(2,14)});
		}
		while((row = catpRelWriteStream.read()) !== null){
			fsoutputStreams.csvCatEntParentCatGrpRelStream[store].write(row);
		}
	});
	catpRelWriteStream.on('error', function(err){
		console.log(err.message);
	});
	catpRelWriteStream.on('finish', function(){
		fsoutputStreams.csvCatEntParentCatGrpRelStream[store].end();
	});
	catpRelWriteStream.write(['CatalogEntryParentCatalogGroupRelationship','','','','','']);
	catpRelWriteStream.write(['PartNumber','Type','ParentGroupIdentifier','ParentStoreIdentifier','Sequence','Delete']);

	return catpRelWriteStream;

}

//set up CatEntParentCatGrpRel outputStream for a given store
function loadOutputStreamForStoreSequence(store,outputStreams, outputDirectory,batchid) {

	var catpRelWriteStream = stringify(writeoptions);
	var catgpenrelFileName = outputDirectory + 'catentrycatgrprelseq-' + store + '-output' + batchid + '.csv';

	if (fsoutputStreams.csvCatEntParentCatGrpRelStreamSeq === undefined)
		fsoutputStreams.csvCatEntParentCatGrpRelStreamSeq =[];

	catpRelWriteStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntParentCatGrpRelStreamSeq[store] === undefined)
		{
			fsoutputStreams.csvCatEntParentCatGrpRelStreamSeq[store] = fs.createWriteStream(catgpenrelFileName, {highWaterMark: Math.pow(2,14)});
		}
		while((row = catpRelWriteStream.read()) !== null){
			fsoutputStreams.csvCatEntParentCatGrpRelStreamSeq[store].write(row);
		}
	});
	catpRelWriteStream.on('error', function(err){
		console.log(err.message);
	});
	catpRelWriteStream.on('finish', function(){
		fsoutputStreams.csvCatEntParentCatGrpRelStreamSeq[store].end();
	});
	catpRelWriteStream.write(['CatalogEntryParentCatalogGroupRelationship','','','','','']);
	catpRelWriteStream.write(['PartNumber','Type','ParentGroupIdentifier','ParentStoreIdentifier','Sequence','Delete']);

	return catpRelWriteStream;

}



//create the file with batchid that will use for archiving
function createFileForArchive(outputDirectory,batchid){
	fsWriteStream = fs.createWriteStream(outputDirectory+'dataload_csv_' + batchid + ".txt");

	fsWriteStream.write(batchid);

	fsWriteStream.end();

}



//TODO: For CatMan Code Refactor - loadOutPutStream implementation
//these are temporary codes only as part of code refactor for better design for code reusability
exports.getManageAttributeDictionaryLookupStream = function(outputFilePath) {
	createAttributeDictionaryLookupStream(outputFilePath);

	return outputStreams;
}

exports.getManageAttributeValuesDictionaryLookupStream = function(outputFilePath) {
	createAttributeValuesDictionaryLookupStream(outputFilePath);

	return outputStreams;
}

exports.getManageCtaMapLookupStream = function(outputFilePath) {
	createCtaMapLookupStream(outputFilePath);

	return outputStreams;
}

exports.getManageUBeltMapLookupStream = function(outputFilePath) {
	createUBeltMapLookupStream(outputFilePath);

	return outputStreams;
}

exports.getCatEntryAttributesStream = function(outputDirectory, batchid) {
	createCatEntryAttributesStream(outputDirectory, batchid);

	return outputStreams;
}

exports.getCatEntDescPublishedStream = function(outputDirectory, batchid) {
	createCatEntDescPublishedStream(outputDirectory, batchid);

	return outputStreams;
}

exports.getManageMasterSalesCategoryLookupStream = function(outputFilePath) {
	createMasterSalesCategoryLookupStream(outputFilePath);

	return outputStreams;
}

function createUBeltMapLookupStream(outputFilePath) {
	outputStreams.csvUBeltMapLookupStream = stringify(writeoptions);
	outputStreams.csvUBeltMapLookupStream.on('readable', function() {
		if (fsoutputStreams.csvUBeltMapLookupStream === undefined) {
			fsoutputStreams.csvUBeltMapLookupStream = fs.createWriteStream(outputFilePath, {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvUBeltMapLookupStream.read()) !== null) {
			fsoutputStreams.csvUBeltMapLookupStream.write(row);
		}
	});
	outputStreams.csvUBeltMapLookupStream.on('error', function(error) {
		console.log(error.message);
	});
	outputStreams.csvUBeltMapLookupStream.on('finish', function() {
		fsoutputStreams.csvUBeltMapLookupStream.end();
	});
	outputStreams.csvUBeltMapLookupStream.write(['key','value']);
}

function createCtaMapLookupStream(outputFilePath) {
	outputStreams.csvCtaMapLookupStream = stringify(writeoptions);
	outputStreams.csvCtaMapLookupStream.on('readable', function() {
		if (fsoutputStreams.csvCtaMapLookupStream === undefined) {
			fsoutputStreams.csvCtaMapLookupStream = fs.createWriteStream(outputFilePath, {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCtaMapLookupStream.read()) !== null) {
			fsoutputStreams.csvCtaMapLookupStream.write(row);
		}
	});
	outputStreams.csvCtaMapLookupStream.on('error', function(error) {
		console.log(error.message);
	});
	outputStreams.csvCtaMapLookupStream.on('finish', function() {
		fsoutputStreams.csvCtaMapLookupStream.end();
	});
	outputStreams.csvCtaMapLookupStream.write(['key','value']);
}

function createAttributeDictionaryLookupStream(outputFilePath) {
	outputStreams.csvAttributeDictionaryLookupStream = stringify(writeoptions);
	outputStreams.csvAttributeDictionaryLookupStream.on('readable', function() {
		if (fsoutputStreams.csvAttributeDictionaryLookupStream === undefined) {
			fsoutputStreams.csvAttributeDictionaryLookupStream = fs.createWriteStream(outputFilePath, {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvAttributeDictionaryLookupStream.read()) !== null) {
			fsoutputStreams.csvAttributeDictionaryLookupStream.write(row);
		}
	});
	outputStreams.csvAttributeDictionaryLookupStream.on('error', function(error) {
		console.log(error.message);
	});
	outputStreams.csvAttributeDictionaryLookupStream.on('finish', function() {
		fsoutputStreams.csvAttributeDictionaryLookupStream.end();
	});
	outputStreams.csvAttributeDictionaryLookupStream.write(['Identifier','Type','AttributeType','Sequence','Displayable','Searchable','Comparable','Facetable','STOREDISPLAY','Merchandisable','AttributeField1','AttributeField2','AttributeField3','LanguageId','Name','Description','SecondaryDescription','AssociatedKeyword','Field1','Footnote','UnitOfMeasure','Store','HeaderName','MultiLang','MultiValue','MinOcurrences','MaxLength','LkupType','AttrValPrefix','LkupTableName','SequencingEnabled','FacetableMultiSelect']);
}

function createAttributeValuesDictionaryLookupStream(outputFilePath) {
	outputStreams.csvAttributeValuesDictionaryLookupStream = stringify(writeoptions);
	outputStreams.csvAttributeValuesDictionaryLookupStream.on('readable', function() {
		if (fsoutputStreams.csvAttributeValuesDictionaryLookupStream === undefined) {
			fsoutputStreams.csvAttributeValuesDictionaryLookupStream = fs.createWriteStream(outputFilePath, {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvAttributeValuesDictionaryLookupStream.read()) !== null) {
			fsoutputStreams.csvAttributeValuesDictionaryLookupStream.write(row);
		}
	});
	outputStreams.csvAttributeValuesDictionaryLookupStream.on('error', function(error) {
		console.log(error.message);
	});
	outputStreams.csvAttributeValuesDictionaryLookupStream.on('finish', function() {
		fsoutputStreams.csvAttributeValuesDictionaryLookupStream.end();
	});
	outputStreams.csvAttributeValuesDictionaryLookupStream.write(['Identifier','LanguageId','ValueIdentifier','Sequence','Value','ValueUsage','AttributeValueField1','AttributeValueField3','Image1','Image2','Field1','Field2','Field3','Delete']);
}

function createMasterSalesCategoryLookupStream(outputFilePath) {
	outputStreams.csvMasterSalesCategoryLookupStream = stringify(writeoptions);
	outputStreams.csvMasterSalesCategoryLookupStream.on('readable', function() {
		if (fsoutputStreams.csvMasterSalesCategoryLookupStream === undefined) {
			fsoutputStreams.csvMasterSalesCategoryLookupStream = fs.createWriteStream(outputFilePath, {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvMasterSalesCategoryLookupStream.read()) !== null) {
			fsoutputStreams.csvMasterSalesCategoryLookupStream.write(row);
		}
	});
	outputStreams.csvMasterSalesCategoryLookupStream.on('error', function(error) {
		console.log(error.message);
	});
	outputStreams.csvMasterSalesCategoryLookupStream.on('finish', function() {
		fsoutputStreams.csvMasterSalesCategoryLookupStream.end();
	});
	outputStreams.csvMasterSalesCategoryLookupStream.write(['Master Catalog','Identifier','Parent Identifier','Name US','URL keyword','Page title','Meta description','Facet Management','STORE','Short Description','Published']);
}

function createCatEntryAttributesStream(outputDirectory, batchid) {
	// -- CatalogEntryAttributeDictionaryAttributeRelationship - Deletion
	outputStreams.csvCatEntryAttributesStream = stringify(writeoptions);
	outputStreams.csvCatEntryAttributesStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntryAttributesStream === undefined)
		{
			fsoutputStreams.csvCatEntryAttributesStream = fs.createWriteStream(outputDirectory + 'catentry-attributes-' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntryAttributesStream.read()) !== null){
			fsoutputStreams.csvCatEntryAttributesStream.write(row);
		}
	});
	outputStreams.csvCatEntryAttributesStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntryAttributesStream.on('finish', function(){
		fsoutputStreams.csvCatEntryAttributesStream.end();
	});
	outputStreams.csvCatEntryAttributesStream.write(['CatalogEntryAttributeDictionaryAttributeRelationship','','','','','','','','','','','']);
	outputStreams.csvCatEntryAttributesStream.write(['PartNumber','AttributeIdentifier','LanguageId','ValueIdentifier','Value','Usage','Sequence','AttributeStoreIdentifier','Field1','Field2','Field3','Delete']);
}

function createCatEntDescPublishedStream(outputDirectory, batchid) {
	var row = '';
	// -- CatalogEntryDescription - Published
	outputStreams.csvCatEntDescPublishedStream = stringify(writeoptions);
	outputStreams.csvCatEntDescPublishedStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntDescPublishedStream === undefined)
		{
			fsoutputStreams.csvCatEntDescPublishedStream = fs.createWriteStream(outputDirectory + 'catentrypublished-output-' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
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
}
