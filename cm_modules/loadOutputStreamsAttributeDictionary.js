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

exports.getOutputStreams = function(jsonObject, reportType) {
	var outputStreams = {};
	var row = '';
	var outputDirectoryAttribute = jsonObject.baseSharedDirectory + jsonObject.attributeDictionary_Attribute;
	var outputDirectoryCategory = jsonObject.baseSharedDirectory + jsonObject.attributeDictionary_Categories;

	if(reportType === 'attribute'){
		// -- Control CTA Lookup
			outputStreams.csvCTALookup = stringify(writeoptions);
			outputStreams.csvCTALookup.on('readable', function(){
				if (fsoutputStreams.csvCTALookup === undefined)
				{
					fsoutputStreams.csvCTALookup = fs.createWriteStream(outputDirectoryAttribute + 'CTAs.csv', {highWaterMark: Math.pow(2,14)});
				}
				while((row = outputStreams.csvCTALookup.read()) !== null){
					fsoutputStreams.csvCTALookup.write(row);
				}
			});
			outputStreams.csvCTALookup.on('error', function(err){
				console.log(err.message);
			});
			outputStreams.csvCTALookup.on('finish', function(){
				fsoutputStreams.csvCTALookup.end();
			});
			// outputStreams.csvCTALookup.write(['']);
			outputStreams.csvCTALookup.write(['key','value']);

			
		// -- Control Utility Belt Lookup
			outputStreams.csvUtilityBeltLookup = stringify(writeoptions);
			outputStreams.csvUtilityBeltLookup.on('readable', function(){
				if (fsoutputStreams.csvUtilityBeltLookup === undefined)
				{
					fsoutputStreams.csvUtilityBeltLookup = fs.createWriteStream(outputDirectoryAttribute + 'UtilityBelts.csv', {highWaterMark: Math.pow(2,14)});
				}
				while((row = outputStreams.csvUtilityBeltLookup.read()) !== null){
					fsoutputStreams.csvUtilityBeltLookup.write(row);
				}
			});
			outputStreams.csvUtilityBeltLookup.on('error', function(err){
				console.log(err.message);
			});
			outputStreams.csvUtilityBeltLookup.on('finish', function(){
				fsoutputStreams.csvUtilityBeltLookup.end();
			});
			// outputStreams.csvCTALookup.write(['']);
			outputStreams.csvUtilityBeltLookup.write(['key','value']);


		// --Attr Dict AttrVal
			outputStreams.csvAttrDictAttrVal = stringify(writeoptions);
			outputStreams.csvAttrDictAttrVal.on('readable', function(){
				if (fsoutputStreams.csvAttrDictAttrVal === undefined)
				{
					fsoutputStreams.csvAttrDictAttrVal = fs.createWriteStream(outputDirectoryAttribute + 'AttributeValues.csv', {highWaterMark: Math.pow(2,14)});
				}
				while((row = outputStreams.csvAttrDictAttrVal.read()) !== null){
					fsoutputStreams.csvAttrDictAttrVal.write(row);
				}
			});
			outputStreams.csvAttrDictAttrVal.on('error', function(err){
				console.log(err.message);
			});
			outputStreams.csvAttrDictAttrVal.on('finish', function(){
				fsoutputStreams.csvAttrDictAttrVal.end();
			});
			// outputStreams.csvCTALookup.write(['']);
			outputStreams.csvAttrDictAttrVal.write(['Attribute','Sequence', 'Value']);


		// --Attr Dict Attr
			outputStreams.csvAttrDictAttr = stringify(writeoptions);
			outputStreams.csvAttrDictAttr.on('readable', function(){
				if (fsoutputStreams.csvAttrDictAttr === undefined)
				{
					fsoutputStreams.csvAttrDictAttr = fs.createWriteStream(outputDirectoryAttribute + 'Attributes.csv', {highWaterMark: Math.pow(2,14)});
				}
				while((row = outputStreams.csvAttrDictAttr.read()) !== null){
					fsoutputStreams.csvAttrDictAttr.write(row);
				}
			});
			outputStreams.csvAttrDictAttr.on('error', function(err){
				console.log(err.message);
			});
			outputStreams.csvAttrDictAttr.on('finish', function(){
				fsoutputStreams.csvAttrDictAttr.end();
			});
			// outputStreams.csvCTALookup.write(['']);
			outputStreams.csvAttrDictAttr.write(['Identifier','Sequence', 'Displayable', 'Searchable','Comparable', 'Facetable', 'Merchandisable','Name', 'HeaderName', 'MultiLang','MaxOccurrence','MinOcurrences',
			'MaxLength', 'Datatype','Defining','Attribute Type','FacetableMultiSelect']);
	}else if(reportType === 'category'){
	// --Master Sales Category
		outputStreams.csvMasterSalesCategory = stringify(writeoptions);
		outputStreams.csvMasterSalesCategory.on('readable', function(){
			if (fsoutputStreams.csvMasterSalesCategory === undefined)
			{
				fsoutputStreams.csvMasterSalesCategory = fs.createWriteStream(outputDirectoryCategory + 'Categories.csv', {highWaterMark: Math.pow(2,14)});
			}
			while((row = outputStreams.csvMasterSalesCategory.read()) !== null){
				fsoutputStreams.csvMasterSalesCategory.write(row);
			}
		});
		outputStreams.csvMasterSalesCategory.on('error', function(err){
			console.log(err.message);
		});
		outputStreams.csvMasterSalesCategory.on('finish', function(){
			fsoutputStreams.csvMasterSalesCategory.end();
		});
		// outputStreams.csvCTALookup.write(['']);
		outputStreams.csvMasterSalesCategory.write(['Master Catalog','Identifier', 'Parent Identifier', 'Name US', 'URL keyword','Page title','Meta description','Facet Management','STORE','Short Description','Published']);

	}

   

	return outputStreams;
};
