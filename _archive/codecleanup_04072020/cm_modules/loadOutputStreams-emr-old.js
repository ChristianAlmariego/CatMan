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


	// -- CatalogEntryParentCatalogGroupRelationship for Sequence Update
	//************************************************
	// -- CatalogEntryParentCatalogGroupRelationship (WITH SEQUENCE)
	// outputStreams.csvCatEntParentCatGrpRelStreamSeq = stringify(writeoptions);
	// outputStreams.csvCatEntParentCatGrpRelStreamSeq.on('readable', function(){
	// 	if (fsoutputStreams.csvCatEntParentCatGrpRelStreamSeq === undefined)
	// 	{
	// 		fsoutputStreams.csvCatEntParentCatGrpRelStreamSeq = fs.createWriteStream(outputDirectory + 'catentrycatgrprelseq-EMR-OLD-output.csv', {highWaterMark: Math.pow(2,14)});
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
	// outputStreams.csvCatEntParentCatGrpRelStreamSeq.write(['PartNumber','ParentGroupIdentifier','ParentStoreIdentifier','Sequence','Delete']);
	//************************************************//
	
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
	outputStreams.csvCatEntryComponentStream.write(['PartNumber','Type','ChildPartNumber','ChildStoreIdentifier','Sequence','Quantity','Delete']);

	
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
