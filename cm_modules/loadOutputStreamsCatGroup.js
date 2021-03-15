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

exports.getOutputStreams = function(outputDirectory,batchid) {
	var outputStreams = {};
	var row = '';

	// Create the output files and write their headers
	// -- CatalogGroup
	outputStreams.csvCatGrpStream = stringify(writeoptions);
	outputStreams.csvCatGrpStream.on('readable', function(){
		if (fsoutputStreams.csvCatGrpStream === undefined)
		{
			fsoutputStreams.csvCatGrpStream = fs.createWriteStream(outputDirectory + 'catgrp-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatGrpStream.read()) !== null){
			fsoutputStreams.csvCatGrpStream.write(row);
		}
	});
	outputStreams.csvCatGrpStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatGrpStream.on('finish', function(){
		fsoutputStreams.csvCatGrpStream.end();
	});
	outputStreams.csvCatGrpStream.write(['CatalogGroup','','']);
	outputStreams.csvCatGrpStream.write(['GroupIdentifier','TopGroup','ParentGroupIdentifier', 'Name','Delete']);

	// -- CatalogGroup Master
	outputStreams.csvCatGrpMasterStream = stringify(writeoptions);
	outputStreams.csvCatGrpMasterStream.on('readable', function(){
		if (fsoutputStreams.csvCatGrpMasterStream === undefined)
		{
			fsoutputStreams.csvCatGrpMasterStream = fs.createWriteStream(outputDirectory + 'catgrpmaster-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatGrpMasterStream.read()) !== null){
			fsoutputStreams.csvCatGrpMasterStream.write(row);
		}
	});
	outputStreams.csvCatGrpMasterStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatGrpMasterStream.on('finish', function(){
		fsoutputStreams.csvCatGrpMasterStream.end();
	});
	outputStreams.csvCatGrpMasterStream.write(['CatalogGroup','','']);
	outputStreams.csvCatGrpMasterStream.write(['GroupIdentifier','TopGroup','ParentGroupIdentifier', 'Name','Delete']);


	// -- CatalogGroup - Name
	outputStreams.csvCatGrpNameStream = stringify(writeoptions);
	outputStreams.csvCatGrpNameStream.on('readable', function(){
		if (fsoutputStreams.csvCatGrpNameStream === undefined)
		{
			fsoutputStreams.csvCatGrpNameStream = fs.createWriteStream(outputDirectory + 'catgrpname-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatGrpNameStream.read()) !== null){
			fsoutputStreams.csvCatGrpNameStream.write(row);
		}
	});
	outputStreams.csvCatGrpNameStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatGrpNameStream.on('finish', function(){
		fsoutputStreams.csvCatGrpNameStream.end();
	});
	outputStreams.csvCatGrpNameStream.write(['CatalogGroupDescription','','','']);
	outputStreams.csvCatGrpNameStream.write(['GroupIdentifier','Language','Name','Delete']);

	// -- CatalogGroupDescription - SEOUrlKeyword
	outputStreams.csvCatGrpSEOUrlKeywordStream = stringify(writeoptions);
	outputStreams.csvCatGrpSEOUrlKeywordStream.on('readable', function(){
		if (fsoutputStreams.csvCatGrpSEOUrlKeywordStream === undefined)
		{
			fsoutputStreams.csvCatGrpSEOUrlKeywordStream = fs.createWriteStream(outputDirectory + 'catgrpurlkeyword-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatGrpSEOUrlKeywordStream.read()) !== null){
			fsoutputStreams.csvCatGrpSEOUrlKeywordStream.write(row);
		}
	});
	outputStreams.csvCatGrpSEOUrlKeywordStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatGrpSEOUrlKeywordStream.on('finish', function(){
		fsoutputStreams.csvCatGrpSEOUrlKeywordStream.end();
	});
	outputStreams.csvCatGrpSEOUrlKeywordStream.write(['CatalogGroupDescription','','','','']);
	outputStreams.csvCatGrpSEOUrlKeywordStream.write(['GroupIdentifier','Language','URLKeyword','Name','Delete']);

	// -- CatalogGroupDescription - SEOPageTitle
	outputStreams.csvCatGrpSEOPageTitleStream = stringify(writeoptions);
	outputStreams.csvCatGrpSEOPageTitleStream.on('readable', function(){
		if (fsoutputStreams.csvCatGrpSEOPageTitleStream === undefined)
		{
			fsoutputStreams.csvCatGrpSEOPageTitleStream = fs.createWriteStream(outputDirectory + 'catgrppagetitle-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatGrpSEOPageTitleStream.read()) !== null){
			fsoutputStreams.csvCatGrpSEOPageTitleStream.write(row);
		}
	});
	outputStreams.csvCatGrpSEOPageTitleStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatGrpSEOPageTitleStream.on('finish', function(){
		fsoutputStreams.csvCatGrpSEOPageTitleStream.end();
	});
	outputStreams.csvCatGrpSEOPageTitleStream.write(['CatalogGroupDescription','','','','']);
	outputStreams.csvCatGrpSEOPageTitleStream.write(['GroupIdentifier','Language','PageTitle','Name','Delete']);

	// -- CatalogGroupDescription - MetaDescription
	outputStreams.csvCatGrpSEOMetaDescStream = stringify(writeoptions);
	outputStreams.csvCatGrpSEOMetaDescStream.on('readable', function(){
		if (fsoutputStreams.csvCatGrpSEOMetaDescStream === undefined)
		{
			fsoutputStreams.csvCatGrpSEOMetaDescStream = fs.createWriteStream(outputDirectory + 'catgrpmetadesc-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatGrpSEOMetaDescStream.read()) !== null){
			fsoutputStreams.csvCatGrpSEOMetaDescStream.write(row);
		}
	});
	outputStreams.csvCatGrpSEOMetaDescStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatGrpSEOMetaDescStream.on('finish', function(){
		fsoutputStreams.csvCatGrpSEOMetaDescStream.end();
	});
	outputStreams.csvCatGrpSEOMetaDescStream.write(['CatalogGroupDescription','','','','']);
	outputStreams.csvCatGrpSEOMetaDescStream.write(['GroupIdentifier','Language','MetaDescription','Name','Delete']);

	// -- CatalogGroupDescription - ShortDescription
	outputStreams.csvCatGrpShortDescStream = stringify(writeoptions);
	outputStreams.csvCatGrpShortDescStream.on('readable', function(){
		if (fsoutputStreams.csvCatGrpShortDescStream === undefined)
		{
			fsoutputStreams.csvCatGrpShortDescStream = fs.createWriteStream(outputDirectory + 'catgrpshortdesc-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatGrpShortDescStream.read()) !== null){
			fsoutputStreams.csvCatGrpShortDescStream.write(row);
		}
	});
	outputStreams.csvCatGrpShortDescStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatGrpShortDescStream.on('finish', function(){
		fsoutputStreams.csvCatGrpShortDescStream.end();
	});
	outputStreams.csvCatGrpShortDescStream.write(['CatalogGroupDescription','','','','']);
	outputStreams.csvCatGrpShortDescStream.write(['GroupIdentifier','Language','ShortDescription','Name','Delete']);

	// -- CatalogGroupDescription - Published
	outputStreams.csvCatGrpPublishedStream = stringify(writeoptions);
	outputStreams.csvCatGrpPublishedStream.on('readable', function(){
		if (fsoutputStreams.csvCatGrpPublishedStream === undefined)
		{
			fsoutputStreams.csvCatGrpPublishedStream = fs.createWriteStream(outputDirectory + 'catgrppublished-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatGrpPublishedStream.read()) !== null){
			fsoutputStreams.csvCatGrpPublishedStream.write(row);
		}
	});
	outputStreams.csvCatGrpPublishedStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatGrpPublishedStream.on('finish', function(){
		fsoutputStreams.csvCatGrpPublishedStream.end();
	});
	outputStreams.csvCatGrpPublishedStream.write(['CatalogGroupDescription','','','','']);
	outputStreams.csvCatGrpPublishedStream.write(['GroupIdentifier','Language','Published','Name','Delete']);


	// -- CatalogGroup Facet
	outputStreams.csvCatGrpFacetListStream = stringify(writeoptions);
	outputStreams.csvCatGrpFacetListStream.on('readable', function(){
		if (fsoutputStreams.csvCatGrpFacetListStream === undefined)
		{
			fsoutputStreams.csvCatGrpFacetListStream = fs.createWriteStream(outputDirectory + 'catgrpfacet-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatGrpFacetListStream.read()) !== null){
			fsoutputStreams.csvCatGrpFacetListStream.write(row);
		}
	});
	outputStreams.csvCatGrpFacetListStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatGrpFacetListStream.on('finish', function(){
		fsoutputStreams.csvCatGrpFacetListStream.end();
	});
	outputStreams.csvCatGrpFacetListStream.write(['']);
	outputStreams.csvCatGrpFacetListStream.write(['FACET_IDENTIFIER','SEQUENCE','CATGROUP_IDENTIFIER','STOREENT_ID','DISPLAYABLE','Delete']);

	// -- CatalogGroup Facet OOB
	outputStreams.csvCatGrpFacetOOBListStream = stringify(writeoptions);
	outputStreams.csvCatGrpFacetOOBListStream.on('readable', function(){
		if (fsoutputStreams.csvCatGrpFacetOOBListStream === undefined)
		{
			fsoutputStreams.csvCatGrpFacetOOBListStream = fs.createWriteStream(outputDirectory + 'catgrpfacetoob-output' + batchid + '.csv', {highWaterMark: Math.pow(2,14)});
		}
		while((row = outputStreams.csvCatGrpFacetOOBListStream.read()) !== null){
			fsoutputStreams.csvCatGrpFacetOOBListStream.write(row);
		}
	});
	outputStreams.csvCatGrpFacetOOBListStream.on('error', function(err){
		console.log(err.message);
	});
	outputStreams.csvCatGrpFacetOOBListStream.on('finish', function(){
		fsoutputStreams.csvCatGrpFacetOOBListStream.end();
	});
	outputStreams.csvCatGrpFacetOOBListStream.write(['']);
	outputStreams.csvCatGrpFacetOOBListStream.write(['FACET_IDENTIFIER','SEQUENCE','CATGROUP_IDENTIFIER','STOREENT_ID','DISPLAYABLE','Delete']);

	createFileForArchive(outputDirectory,batchid);

	return outputStreams;
};


//create the file with batchid that will use for archiving
function createFileForArchive(outputDirectory,batchid){
	fsWriteStream = fs.createWriteStream(outputDirectory+'catgrp_dataload_csv_' + batchid + ".txt");

	fsWriteStream.write(batchid);

	fsWriteStream.end();

}
