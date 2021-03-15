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

	// -- CatalogEntryParentCatalogGroupRelationship with Sequence
	outputStreams.csvCatEntParentCatGrpRelStreamSeq = stringify(writeoptions);
	outputStreams.csvCatEntParentCatGrpRelStreamSeq.on('readable', function(){
		if (fsoutputStreams.csvCatEntParentCatGrpRelStreamSeq === undefined)
		{
			fsoutputStreams.csvCatEntParentCatGrpRelStreamSeq = fs.createWriteStream(outputDirectory + 'catentrycatgrprelseq-EMR-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntParentCatGrpRelStreamSeq.read()) !== null){
			fsoutputStreams.csvCatEntParentCatGrpRelStreamSeq.write(row);
		}
	});
	outputStreams.csvCatEntParentCatGrpRelStreamSeq.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntParentCatGrpRelStreamSeq.on('finish', function(){
		fsoutputStreams.csvCatEntParentCatGrpRelStreamSeq.end();
	});
	outputStreams.csvCatEntParentCatGrpRelStreamSeq.write(['CatalogEntryParentCatalogGroupRelationship','','','','','']);
	outputStreams.csvCatEntParentCatGrpRelStreamSeq.write(['PartNumber','Type','ParentGroupIdentifier','ParentStoreIdentifier','Sequence','Delete']);
	
	// -- CatalogEntryParentProductRelationship with Sequence
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
   
	
	// -- CatalogEntryDescription - ShortDescription
	outputStreams.csvCatEntDescShortDescStream = stringify(writeoptions);
	outputStreams.csvCatEntDescShortDescStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntDescShortDescStream === undefined)
		{
			fsoutputStreams.csvCatEntDescShortDescStream = fs.createWriteStream(outputDirectory + 'catentryshortdesc-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntDescShortDescStream.read()) !== null){
			fsoutputStreams.csvCatEntDescShortDescStream.write(row);
		}
	});
	outputStreams.csvCatEntDescShortDescStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntDescShortDescStream.on('finish', function(){
		fsoutputStreams.csvCatEntDescShortDescStream.end();
	});
	outputStreams.csvCatEntDescShortDescStream.write(['CatalogEntryDescription','','','','']);
	outputStreams.csvCatEntDescShortDescStream.write(['PartNumber','Type','LanguageId','ShortDescription','Delete']);
	
	
	// -- CatalogEntryDescription - FullImage
	outputStreams.csvCatEntDescFullImageStream = stringify(writeoptions);
	outputStreams.csvCatEntDescFullImageStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntDescFullImageStream === undefined)
		{
			fsoutputStreams.csvCatEntDescFullImageStream = fs.createWriteStream(outputDirectory + 'catentryfullimage-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntDescFullImageStream.read()) !== null){
			fsoutputStreams.csvCatEntDescFullImageStream.write(row);
		}
	});
	outputStreams.csvCatEntDescFullImageStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntDescFullImageStream.on('finish', function(){
		fsoutputStreams.csvCatEntDescFullImageStream.end();
	});
	outputStreams.csvCatEntDescFullImageStream.write(['CatalogEntryDescription','','','','']);
	outputStreams.csvCatEntDescFullImageStream.write(['PartNumber','Type','LanguageId','FullImage','Delete']);
	
	
	// -- CatalogEntryDescription - Thumbnail
	outputStreams.csvCatEntDescThumbnailImageStream = stringify(writeoptions);
	outputStreams.csvCatEntDescThumbnailImageStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntDescThumbnailImageStream === undefined)
		{
			fsoutputStreams.csvCatEntDescThumbnailImageStream = fs.createWriteStream(outputDirectory + 'catentrythumbnail-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntDescThumbnailImageStream.read()) !== null){
			fsoutputStreams.csvCatEntDescThumbnailImageStream.write(row);
		}
	});
	outputStreams.csvCatEntDescThumbnailImageStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntDescThumbnailImageStream.on('finish', function(){
		fsoutputStreams.csvCatEntDescThumbnailImageStream.end();
	});
	outputStreams.csvCatEntDescThumbnailImageStream.write(['CatalogEntryDescription','','','','']);
	outputStreams.csvCatEntDescThumbnailImageStream.write(['PartNumber','Type','LanguageId','Thumbnail','Delete']);
	
	
	// -- CatalogEntryDescription - Image Alt Text
	outputStreams.csvCatEntSEOImgAltDescStream = stringify(writeoptions);
	outputStreams.csvCatEntSEOImgAltDescStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntSEOImgAltDescStream === undefined)
		{
			fsoutputStreams.csvCatEntSEOImgAltDescStream = fs.createWriteStream(outputDirectory + 'catentryimgalttext-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntSEOImgAltDescStream.read()) !== null){
			fsoutputStreams.csvCatEntSEOImgAltDescStream.write(row);
		}
	});
	outputStreams.csvCatEntSEOImgAltDescStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntSEOImgAltDescStream.on('finish', function(){
		fsoutputStreams.csvCatEntSEOImgAltDescStream.end();
	});
	outputStreams.csvCatEntSEOImgAltDescStream.write(['CatalogEntryDescription','','','','']);
	outputStreams.csvCatEntSEOImgAltDescStream.write(['PartNumber','Type','LanguageId','ImageAltText','Delete']);
	
	
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

	// -- CatalogEntryComponentPartsList
	outputStreams.csvCatEntryComponentPartsListStream = stringify(writeoptions);
	outputStreams.csvCatEntryComponentPartsListStream.on('readable', function(){
		if (fsoutputStreams.csvCatEntryComponentPartsListStream === undefined)
		{
			fsoutputStreams.csvCatEntryComponentPartsListStream = fs.createWriteStream(outputDirectory + 'catentrycomppartslist-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatEntryComponentPartsListStream.read()) !== null){
			fsoutputStreams.csvCatEntryComponentPartsListStream.write(row);
		}
	});
	outputStreams.csvCatEntryComponentPartsListStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatEntryComponentPartsListStream.on('finish', function(){
		fsoutputStreams.csvCatEntryComponentPartsListStream.end();
	});
	outputStreams.csvCatEntryComponentPartsListStream.write(['CatalogEntryAssociation','','','','','','','','']);
	outputStreams.csvCatEntryComponentPartsListStream.write(['PartNumber','AssociationType','TargetPartNumber','TargetStoreIdentifier','Sequence','SemanticSpecifier','Quantity','Field1','Delete']);
	
	
	createFileForArchive(outputDirectory,batchid);
	
	return outputStreams;
};

//create the file with batchid that will use for archiving
function createFileForArchive(outputDirectory,batchid){
	fsWriteStream = fs.createWriteStream(outputDirectory+'dataload_csv_' + batchid + ".txt");
	
	fsWriteStream.write(batchid);
	
	fsWriteStream.end();
	
}
