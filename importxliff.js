//--------------------------------------------
//Author: 		Ray Seibert
//
//Description: 	XLIFF import products
//				English (en_US) Specified Locale
//
//--------------------------------------------

//**********Change path different Doc Store Location**********
var env = process.argv[2];
var storeName = process.argv[3];

// setup node modules
var xml2js = require('xml2js');
var fs = require('fs');
var os = require('os');

// setup default properties
var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;

// setup extended properties
console.log("Setting up directories");
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var envProperties = propertiesReader.getEnvironmentProperties(env);
var systemProperties = propertiesReader.getSystemProperties();

// setup cm_modules
var genericUtil = require(envProperties.path().catman.rootDirectory + systemProperties.path().catman.cmModulesDirectory + systemProperties.path().catman.genericUtilities);
var loadLookups = require(envProperties.path().catman.rootDirectory + systemProperties.path().catman.cmModulesDirectory + systemProperties.path().catman.loadLookups);
var	loadOutputStreams = require(envProperties.path().catman.rootDirectory + systemProperties.path().catman.cmModulesDirectory + systemProperties.path().catman.loadTranslationOutputStreams);
var	jsonReader = require(envProperties.path().catman.rootDirectory + systemProperties.path().catman.cmModulesDirectory + systemProperties.path().catman.jsonReader);
var	mailer = require(envProperties.path().catman.rootDirectory + systemProperties.path().catman.cmModulesDirectory + systemProperties.path().catman.email);

var jsonObject = jsonReader.getJsonProperties(env, storeName);
var tmsimportDir = jsonObject.baseSharedDirectory + "Translation-WorkingFolder/outbound/catman/";
var tmsprocessDir = jsonObject.baseSharedDirectory + "Translation-WorkingFolder/outbound/catman/processing/";
var errDir = jsonObject.baseSharedDirectory + "Translation-WorkingFolder/error/outbound/catman/";
var archiveDir = jsonObject.baseSharedDirectory + "Translation-WorkingFolder/archive/outbound/catman/";
var tmsextractPublishOnholdDir = jsonObject.baseSharedDirectory + "TMS/CatMan/ExtractForPublish/onhold/";

var successFileList = [];
var errorFileList = [];
var ignoreFileList = [];
var emailList  = "";
var langIdList = ["","","",""];
var currtime = new Date();
var batchid = ""+currtime.getFullYear() + ("0"+(currtime.getMonth()+1)).slice(-2)
	+ ("0"+currtime.getDate()).slice(-2) + ("0"+currtime.getHours()).slice(-2)
	+ ("0"+currtime.getMinutes()).slice(-2) + ("0"+currtime.getSeconds()).slice(-2)
	+ ("00"+currtime.getMilliseconds()).slice(-3);

var productAutosolReportPath;
var productComresReportPath;
var categoryAutosolReportPath;
var categoryComresReportPath;
var attributeReportPath;
var lookupReportPath;
var existsAutosol = false;
var existsComres = false;
var existsCatAutosol = false;
var existsCatComres = false;
var existsAttr = false;
var existsLookup = false;
var baseDirFiles = fs.readdirSync(jsonObject.baseSharedDirectory + 'Translation-WorkingFolder/outbound/catman');

console.log("Processing Files...")
baseDirFiles.forEach(function (file){
		if(file.includes("Emerson", 0)){
			if(file.includes("_AutosolProductImport.csv",0)){
				existsAutosol = true;				
				productAutosolReportPath = jsonObject.baseSharedDirectory + 'Translation-WorkingFolder/outbound/catman/processing/Emerson' + batchid + file;
			} else if(file.includes("_ComresProductImport.csv",0)){
				existsComres = true;
				productComresReportPath = jsonObject.baseSharedDirectory + 'Translation-WorkingFolder/outbound/catman/processing/Emerson' + batchid + file;
			}
		}
});

function findForPlatform(catgrp)
{ 	var lpcount=0;
	while(!(catgrp==='M-Automation-Solutions' || catgrp==='M-Commercial-Residential-Solutions' || catgrp==='ETC') && lpcount!=5){
		catgrp=lookups.mastercategorylookup[catgrp];
		lpcount++;
	}
	if(catgrp==='M-Automation-Solutions'){
		catgrp='emr';
	}
	else if(catgrp==='M-Commercial-Residential-Solutions' || catgrp==='ETC'){
		catgrp='climate';
	}
	else{
		catgrp='emr';
	}
	
	return catgrp;	
}
//EDS-7556 code changes
function findForCategoryPlatform(catgrp)
{
	while(!(catgrp==='Automation-Solutions' || catgrp==='Commercial-and-Residential-Solutions')){
		//catgrp=lookups.salescategorylookup[catgrp];
		catgrp=lookups.salescategorymainlookup[catgrp].ParentIdentifier;
	}
	return catgrp;
}

var validLocales = jsonObject.validLocales;
var deprecatedLocales = jsonObject.deprecatedLocales; 
var localeList = ["","","",""];
var jobTriggers = "|";

var currproduct= "";
var currmasterpath="";
var processProduct=false;

var processCategory=false;
var processAttr=false;
var processLookup=false;
var outputStreams = loadOutputStreams.getOutputStreams(tmsprocessDir,batchid,validLocales);
var lookups = loadLookups.getLookups(storeName);
var headerlookup = lookups.header['EMR'];

var fsAutosolReportStream;
var fsComresReportStream;
var fsAutosolCatReportStream;
var fsComresCatReportStream;
var fsAttrReportStream;
var fsLookupReportStream;

var fsImportStream;
var productImportPath = jsonObject.baseSharedDirectory + 'Translation-WorkingFolder/outbound/catman/processing' + '/Report' + batchid + '_ProductImport_logs.csv';
fsImportStream = fs.createWriteStream(productImportPath, {highWaterMark: Math.pow(2,14)});
fsImportStream.write (getDate() + '*****Processing Import Products*****'+ os.EOL); 

var attrlookup = [];
var lkupnamelookup = [];

for (var k in headerlookup)
{
	if (k !== undefined && k !== '')
	{
		if (headerlookup[k].Identifier !== undefined)
		{
			attrlookup[headerlookup[k].Identifier] = headerlookup[k];
		}
		if (headerlookup[k].LkupTableName !== undefined)
		{
			lkupnamelookup[headerlookup[k].LkupTableName] = headerlookup[k];
		}
	}
}

function getLocale(locale)
{
	//TODO move to validator
	if (locale in validLocales)
	{
		return validLocales[locale];
	}
	else
	{
		return 0;
	}
}

function createAutosolImportReport(){
	if (existsAutosol) { 
	  	fsAutosolReportStream = fs.createWriteStream(productAutosolReportPath, {highWaterMark: Math.pow(2,14), 'flags': 'a'});	  	
	} else{
		productAutosolReportPath = jsonObject.baseSharedDirectory + 'Translation-WorkingFolder/outbound/catman/processing/Emerson' + batchid + '_AutosolProductImport.csv';		
		fsAutosolReportStream = fs.createWriteStream(productAutosolReportPath, {highWaterMark: Math.pow(2,14)});
		fsAutosolReportStream.write('File Name,Catalog File Name,Code,Master Category,Locale,Manufacturer/Brand,Date Imported'+os.EOL);	
		existsAutosol = true;	
	}
}

function createComresImportReport(){
	if (existsComres) { 
	  	fsComresReportStream = fs.createWriteStream(productComresReportPath, {highWaterMark: Math.pow(2,14), 'flags': 'a'});
	} else{
		productComresReportPath = jsonObject.baseSharedDirectory + 'Translation-WorkingFolder/outbound/catman/processing/Emerson' + batchid + '_ComresProductImport.csv';
		fsComresReportStream = fs.createWriteStream(productComresReportPath, {highWaterMark: Math.pow(2,14)});
		fsComresReportStream.write('File Name,Catalog File Name,Code,Master Category,Locale,Manufacturer/Brand,Date Imported'+os.EOL);
		existsComres = true;
	}
}

function createAutosolCategoryImportReport(){
	if (existsCatAutosol) { 
	  	fsAutosolCatReportStream = fs.createWriteStream(categoryAutosolReportPath, {highWaterMark: Math.pow(2,14), 'flags': 'a'});	  	
	} else{
		categoryAutosolReportPath = jsonObject.baseSharedDirectory + 'Translation-WorkingFolder/outbound/catman/processing/Emerson' + batchid + '_AutosolCategoryImport.csv';		
		fsAutosolCatReportStream = fs.createWriteStream(categoryAutosolReportPath, {highWaterMark: Math.pow(2,14)});
		fsAutosolCatReportStream.write('File Name,Category Group,Locale,Date Imported'+os.EOL);	
		existsCatAutosol = true;	
	}
}

function createComresCategoryImportReport(){
	if (existsCatComres) { 
	  	fsComresCatReportStream = fs.createWriteStream(categoryComresReportPath, {highWaterMark: Math.pow(2,14), 'flags': 'a'});
	} else{
		categoryComresReportPath = jsonObject.baseSharedDirectory + 'Translation-WorkingFolder/outbound/catman/processing/Emerson' + batchid + '_ComresCategoryImport.csv';
		fsComresCatReportStream = fs.createWriteStream(categoryComresReportPath, {highWaterMark: Math.pow(2,14)});
		fsComresCatReportStream.write('File Name,Category Group,Locale,Date Imported'+os.EOL);
		existsCatComres = true;
	}
}

function createAttributeImportReport(){
	if (existsAttr) { 
	  	fsAttrReportStream = fs.createWriteStream(attributeReportPath, {highWaterMark: Math.pow(2,14), 'flags': 'a'});
	} else{
		attributeReportPath = jsonObject.baseSharedDirectory + 'Translation-WorkingFolder/outbound/catman/processing/Emerson' + batchid + '_AttributeImport.csv';
		fsAttrReportStream = fs.createWriteStream(attributeReportPath, {highWaterMark: Math.pow(2,14)});
		fsAttrReportStream.write('File Name,Attributes,Locale,Date Imported'+os.EOL);
		existsAttr = true;
	}
}

function createLookupImportReport(){
	if (existsLookup) { 
	  	fsLookupReportStream = fs.createWriteStream(lookupReportPath, {highWaterMark: Math.pow(2,14), 'flags': 'a'});
	} else{
		lookupReportPath = jsonObject.baseSharedDirectory + 'Translation-WorkingFolder/outbound/catman/processing/Emerson' + batchid + '_LookupImport.csv';
		fsLookupReportStream = fs.createWriteStream(lookupReportPath, {highWaterMark: Math.pow(2,14)});
		fsLookupReportStream.write('File Name,Attribute Lookups,Locale,Date Imported'+os.EOL);
		existsLookup = true;
	}
}

function writeProductFields(targetLang,partnumber,itemResult,transUnitId)
{
	var str = '';
	var updated = false;
	var transUnitNameParsed = itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].$.name.split('/');
	var output = [];
	if (transUnitNameParsed[transUnitNameParsed.length - 2] === "Name")
	{
		if (itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].source[0]._ !== undefined && itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].source[0]._ !== '')
		{
			//write Name to catentryname-output.csv
			output[0] = partnumber;
			output[1] = getLocale(targetLang);
			output[2] = itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].target[0]._;
			output[3] = '';
			
			outputStreams.csvCatEntDescNameStream.write(output);
			fsImportStream.write (getDate() + 'Partnumber: ' + output[0] + os.EOL);
			str = itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].source[0]._ ;
			fsImportStream.write (getDate() + 'Name: ' + escapeDoubleQuotes( str )+os.EOL);
			updated = true;
		}
	}
	else if (transUnitNameParsed[transUnitNameParsed.length - 2] === "Long description")
	{
		if (itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].source[0]._ !== undefined && itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].source[0]._ !== '')
		{
			//write Long description to catentrylongdesc-output.csv
			//handle errors in one batch of imports
			if (transUnitNameParsed[transUnitNameParsed.length - 1] === targetLang && itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].source[0]._ !== 'null')
			{
				output[0] = partnumber;
				output[1] = getLocale(targetLang);
				output[2] = itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].target[0]._;
				output[3] = '';

				outputStreams.csvCatEntDescLongDescStream.write(output);
				str = itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].source[0]._ ;
				fsImportStream.write ( getDate() + 'Long Description: ' + escapeDoubleQuotes(str)+  os.EOL);
				updated = true;
			}
		}
	}
	else if (transUnitNameParsed[transUnitNameParsed.length - 2] === "Keyword")
	{
		if (itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].source[0]._ !== undefined && itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].source[0]._ !== '')
		{
			//write Keyword to catentrykeyword-output.csv
			output[0] = partnumber;
			output[1] = getLocale(targetLang);
			output[2] = itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].target[0]._;
			output[3] = '';
			
			outputStreams.csvCatEntDescKeywordStream.write(output);
			str = itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].source[0]._ ;
			fsImportStream.write (getDate() + 'Keyword: ' + escapeDoubleQuotes(str) + os.EOL);
			updated = true;
		}
	}
	else if (transUnitNameParsed[transUnitNameParsed.length - 2] === "Page title")
	{
		if (itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].source[0]._ !== undefined && itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].source[0]._ !== '')
		{
			//write Page title to catentrypagetitle-output.csv
			output[0] = partnumber;
			output[1] = itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].target[0]._;
			output[2] = '';
			
			outputStreams['csvCatEntSEOPageTitleStream' + targetLang].write(output);
			str = itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].source[0]._ ;
			fsImportStream.write (getDate() + 'Page Title: ' + escapeDoubleQuotes(str)+ os.EOL );
			updated = true;
		}
	}
	else if (transUnitNameParsed[transUnitNameParsed.length - 2] === "Meta description")
	{
		if (itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].source[0]._ !== undefined && itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].source[0]._ !== '')
		{
			//write Meta description to catentrymetadesc-output.csv
			output[0] = partnumber;
			output[1] = itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].target[0]._;
			output[2] = '';

			outputStreams['csvCatEntSEOMetaDescStream' + targetLang].write(output);
			str = itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].source[0]._ ;
			fsImportStream.write (getDate() + 'Meta Description: '+ escapeDoubleQuotes(str)+ os.EOL);
			updated = true;
		}
	}
	else if (itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].target[0]._ !== undefined
				&& itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].target[0]._ !== '')
	{
		// proccess extended attributes
		// write Custom Attribute to attrdictattrallowvals-output.csv & catentryattrrel-output.csv

		var attrIdentifier = transUnitNameParsed[transUnitNameParsed.length - 2];
		if (attrlookup[attrIdentifier] === undefined || attrIdentifier.includes('EMR PDP Format') || attrIdentifier.includes('EMR TabSequence'))
		{
			return updated;
		}
		output[0] = partnumber;
		output[1] = attrIdentifier;
		output[2] = getLocale(targetLang);
		
		//this is not in a lookup table so the value needs to be in the catalog entry specific allowed values
		var attroutput = [];
		var suffix = '';
		var seq = 0;
		
		var unitId = itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].$.id;
		var valueSequence = itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].$.valueSequence;

		if (unitId.includes('-')) {
			seq = unitId.split('-')[1];
			suffix = '_' + seq;
		}
		else if (attrIdentifier.includes('EMR Utility Belt')){
			//SA1-220 restrict valueID 0 and 1 for utility belts
			seq = 2;
			suffix = '_' + seq;
		}

		if (!genericUtil.isUndefined(valueSequence)
			&& !genericUtil.isTrimmedEmptyString(valueSequence)) {
			seq = valueSequence;
		}

		output[3] = attrlookup[attrIdentifier].AttrValPrefix + '_' + attrIdentifier.replace(/\W/g,'_') + '_' + 
						partnumber.replace(/\W/g,'_') + '_ValueID' + suffix;
		attroutput[0] = attrIdentifier; //Identifier
		attroutput[1] = getLocale(targetLang); //LanguageId
		attroutput[2] = output[3]; //ValueIdentifier
		attroutput[3] = seq; //Sequence
		attroutput[4] = itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].target[0]._; //Value
		attroutput[5] = '1'; //ValueUsage
		attroutput[6] = ''; //AttributeValueField1
		attroutput[7] = ''; //AttributeValueField2
		attroutput[8] = ''; //AttributeValueField3
		attroutput[9] = ''; //Image1
		attroutput[10] = ''; //Image2
		attroutput[11] = ''; //Field1
		attroutput[12] = ''; //Field2
		attroutput[13] = ''; //Field3
		outputStreams.csvAttrDictAttrAllowValsStream.write(attroutput);

		//reset output array for next row
		attroutput.splice(0);

		output[4] = itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].target[0]._;
		output[5] = 'Descriptive';
		output[6] = seq;
		output[7] = 'EmersonCAS';
		output[8] = '';
		output[9] = '';
		output[10] = '';
		output[11] = '';
		outputStreams.csvCatEntAttrDictAttrRelStream.write(output);

		//reset output array for next row
		output.splice(0);
		updated = true;
	}
	return updated;
}

function processProductXLIFF(contents,fname)
{
	var parser = new xml2js.Parser({async: false});
    parser.parseString(contents, function (err, result) {
    	//console.log(result.translated.item[0].payload);
    	var itemParser = new xml2js.Parser({async: false});
    	itemParser.parseString(result.translated.item[0].payload, function (err, itemResult)
    	{
    		var targetLang = itemResult.xliff.file[0].$['target-language'];    		
    		var groupId = itemResult.xliff.file[0].body[0].group[0].$.id;
    		var updated = false;

			if (deprecatedLocales.indexOf(targetLang) !== -1){

				errorFileList[errorFileList.length] = fname;
    			return;
			}
			else if (getLocale(targetLang) === 0){

    			ignoreFileList[ignoreFileList.length] = fname;
    			return;
			}
			
    		if (lookups.mastercataloglookup[groupId] === undefined){
    			fsImportStream.write (getDate() + 'PartNumber: ' + groupId +os.EOL);
				fsImportStream.write (getDate() + '@@@ERROR: Catalog entry no longer exists.' +os.EOL);				
				if(fsAutosolReportStream === undefined ){
					createAutosolImportReport();
					}
				if(fsComresReportStream === undefined){
					createComresImportReport();
				}
				
				var currProdName = handleProductName(groupId);
				
				fsAutosolReportStream.write(fname + ',' + itemResult.xliff.file[0].$['catalog-filename'] + ',' + currProdName + ',,' + targetLang + ',' + groupId.split('-')[0] + ',' + 
						"ERROR: Catalog entry no longer exists." + os.EOL);						
				fsComresReportStream.write(fname + ',' + itemResult.xliff.file[0].$['catalog-filename'] + ',' + currProdName + ',,' + targetLang + ',' + groupId.split('-')[0] + ',' + 
					"ERROR: Catalog entry no longer exists." + os.EOL);
				processProduct=true;
				writeDataloadControlFile();
				return;
			}
    		for (var i = 0; i < itemResult.xliff.file[0].body[0].group[0]['trans-unit'].length; i++)
    		{
    			var returnResult = writeProductFields(targetLang,groupId,itemResult,i);
        		updated = updated || returnResult;
    		}
    		if (updated)
    		{
    			var urlkeyword = groupId.trim().replace(/\W+/g,'-').replace('-P-','-').toLowerCase();
    			var output = [];
    			//write URL keyword to catentryurlkeyword-output.csv
    			output[0] = groupId;
    			output[1] = getLocale(targetLang);
    			output[2] = urlkeyword + '-' + targetLang.replace('_', '-').toLowerCase();
    			output[3] = '';

    			outputStreams.csvCatEntSEOUrlKeywordStream.write(output);

    			//reset output array for next row
    			output.splice(0);

    			output[0] = groupId;
    			output[1] = getLocale(targetLang);
    			output[2] = '1';
    			output[3] = '';

    			outputStreams.csvCatEntDescPublishedStream.write(output);
    			
    			//reset output array for next file
    			output.splice(0);
    			//EDS-4289, EDS-4922 reporting code changes
    			currproduct=itemResult.xliff.file[0].body[0].group[0].$.id;
    			catalogFilename=itemResult.xliff.file[0].$['catalog-filename'];
    			email=itemResult.xliff.file[0].$['requester-email'];
    			if(!(emailList.includes(email))){
    				if(emailList == ""){
						if (email !== undefined) {
							emailList=email;
						}    					
    				}
    				else{
    					emailList=emailList+','+email;
    				}
    			}
    			if(!(localeList[0].includes(targetLang))){
    				if(localeList[0] == ""){
    					localeList[0]=targetLang;
    					langIdList[0]=getLocale(targetLang);
    				}
    				else{
    					localeList[0]=localeList[0]+','+targetLang;
    					langIdList[0]=langIdList[0]+','+getLocale(targetLang);
    				}
    			}
    			if(!(jobTriggers.includes("Publish Translation"))){
    				if(jobTriggers == "|"){
    					jobTriggers="|Publish Translation";
    				}
    				else{
    					jobTriggers=jobTriggers+','+"Publish Translation";
    				}
    			}
        		//EDS-5477 reporting code changes
    			if(!(itemResult.xliff.file[0].header[0].note == undefined) && !(itemResult.xliff.file[0].header[0].note[0].master == undefined)){
    				currmasterpath=(itemResult.xliff.file[0].header[0].note[0].master[0]).trim();
    			}
    			//EDS-1007 Automate catentry promotion translation
    			writePublishTranslationControlFile(groupId,getLocale(targetLang),currmasterpath,email.trim(),targetLang);
    			
    			//EDS-5477 reporting code changes end
    			writeReportRow(currproduct,currmasterpath,targetLang,fname,catalogFilename);
    			//EDS-4289, EDS-4922 reporting code changes end
    			if (errorFileList.indexOf(fname) === -1)
    			{
        			successFileList[successFileList.length] = fname;
    			}
    		}
    		else if (errorFileList.indexOf(fname) === -1)
			{
    			errorFileList[errorFileList.length] = fname;
			}
    	});
    });

}

function writeCategoryFields(targetLang,partnumber,itemResult,transUnitId)
{
	var updated = false;
	var output = [];
	var categoryId = itemResult.xliff.file[0].group[transUnitId].$.id.split('/');

	if (lookups.mastercategorylookup[categoryId[categoryId.length - 1]] !== undefined && lookups.mastercategorylookup[categoryId[categoryId.length - 1]] !== '')
	{
		output[0] = categoryId[categoryId.length - 1];//GroupIdentifier
		output[1] = getLocale(targetLang);//LanguageId
		output[2] = itemResult.xliff.file[0].group[transUnitId]['trans-unit'][0].target[0]._;//Name
		output[3] = '';//ShortDescription
		output[4] = '';//LongDescription
		output[5] = '';//Thumbnail
		output[6] = '';//FullImage
		output[7] = '1';//Published
		output[8] = '';//Keyword
		output[9] = '';//Note
		output[10] = categoryId[categoryId.length - 1].replace(/\W+/g,'-').toLowerCase() + '-' + targetLang.replace('_','-').toLowerCase();//URLKeyword
		output[11] = '';//PageTitle
		output[12] = '';//MetaDescription
		output[13] = '';//ImageAltText
		output[14] = '';//Delete
		
		//console.log(output);
		outputStreams.csvCatGrpDesc.write(output);
		updated = true;
	}
	else {
		fsImportStream.write (getDate() + ' @@@ERROR: ' + categoryId[categoryId.length - 1] + ' is an invalid sales category identifier.' +os.EOL);
	}
	return updated;
}

function processCategoryXLIFF(contents,fname)
{
	var parser = new xml2js.Parser({async: false});
    parser.parseString(contents, function (err, result) {
    	var itemParser = new xml2js.Parser({async: false});
    	itemParser.parseString(result.translated.item[0].payload, function (err, itemResult)
    	{
    		var targetLang = itemResult.xliff.file[0].$['target-language'];
    		var updated = false;
			
			if (deprecatedLocales.indexOf(targetLang) !== -1){

				errorFileList[errorFileList.length] = fname;
    			return;
			}
			else if (getLocale(targetLang) === 0){

    			ignoreFileList[ignoreFileList.length] = fname;
    			return;
			}
			
    		for (var i = 0; i < itemResult.xliff.file[0].group.length; i++)
    		{
        		var groupId = itemResult.xliff.file[0].group[i].$.id;
    			var returnResult = writeCategoryFields(targetLang,groupId,itemResult,i);
        		updated = updated || returnResult;
        		writeCategoryReportRow(groupId,targetLang,fname);
    		}
    		if (updated && errorFileList.indexOf(fname) === -1)
    		{
    			successFileList[successFileList.length] = fname;
    		}
    		else if (errorFileList.indexOf(fname) === -1)
			{
    			errorFileList[errorFileList.length] = fname;
			}
			if(!(localeList[1].includes(targetLang))){
    			if(localeList[1] == ""){
    				localeList[1]=targetLang;
    				langIdList[1]=getLocale(targetLang);
    			}
    			else{
    				localeList[1]=localeList[1]+','+targetLang;
    				langIdList[1]=langIdList[1]+','+getLocale(targetLang);
    			}
    		}
    		if(!(jobTriggers.includes("Publish Translated Category Names"))){
    			if(jobTriggers == "|"){
    				jobTriggers="|Publish Translated Category Names";
    			}
    			else{
    				jobTriggers=jobTriggers+','+"Publish Translated Category Names";
    			}
    		}
    	});
    });

}

function writeAttrNameFields(targetLang,partnumber,itemResult,transUnitId,fname)
{
	var updated = false;
	var checker  = true;
	var output = [];
	
	if (attrlookup[itemResult.xliff.file[0].group[0]['trans-unit'][transUnitId].$.id] === undefined)
	{
		console.log('Attribute: ' + itemResult.xliff.file[0].group[0]['trans-unit'][transUnitId].$.id + ' not found');
		if (errorFileList.indexOf(fname) === -1)
		{
			errorFileList[errorFileList.length] = fname;
		}
		return updated;
	}
	if (itemResult.xliff.file[0].group[0]['trans-unit'][transUnitId].$.id.includes('EMR Generic Spec ')
			|| itemResult.xliff.file[0].group[0]['trans-unit'][transUnitId].$.id === 'EMR PDP Format' 
			|| itemResult.xliff.file[0].group[0]['trans-unit'][transUnitId].$.id === 'EMR TabSequence'
			|| itemResult.xliff.file[0].group[0]['trans-unit'][transUnitId].target[0]._ === '')
	{
		// These attribute names should not be translated
		return updated;
	}
	//Included validation for EDS-4835
	if(attrlookup[itemResult.xliff.file[0].group[0]['trans-unit'][transUnitId].$.id] === undefined)
	{
		console.log("@@INFO: Attribute Group not found");
		checker=false;
	}
	output[0] = itemResult.xliff.file[0].group[0]['trans-unit'][transUnitId].$.id;//Identifier
	//Included validation for EDS-4835
	if(checker){
		output[1] = attrlookup[itemResult.xliff.file[0].group[0]['trans-unit'][transUnitId].$.id].Type;//Type
		output[2] = attrlookup[itemResult.xliff.file[0].group[0]['trans-unit'][transUnitId].$.id].AttributeType;//AttributeType
		output[3] = attrlookup[itemResult.xliff.file[0].group[0]['trans-unit'][transUnitId].$.id].Sequence;//Sequence
		output[4] = attrlookup[itemResult.xliff.file[0].group[0]['trans-unit'][transUnitId].$.id].Displayable;//Displayable
		output[5] = attrlookup[itemResult.xliff.file[0].group[0]['trans-unit'][transUnitId].$.id].Searchable;//Searchable
		output[6] = attrlookup[itemResult.xliff.file[0].group[0]['trans-unit'][transUnitId].$.id].Comparable;//Comparable
		output[7] = attrlookup[itemResult.xliff.file[0].group[0]['trans-unit'][transUnitId].$.id].Facetable;//Facetable
		output[8] = attrlookup[itemResult.xliff.file[0].group[0]['trans-unit'][transUnitId].$.id].STOREDISPLAY;//STOREDISPLAY
		output[9] = attrlookup[itemResult.xliff.file[0].group[0]['trans-unit'][transUnitId].$.id].Merchandisable;//Merchandisable
	}
	else{
		output[1] ='';//Type
		output[2] ='';//AttributeType
		output[3] ='';//Sequence
		output[4] ='';//Displayable
		output[5] ='';//Searchable
		output[6] ='';//Comparable
		output[7] ='';//Facetable
		output[8] ='';//STOREDISPLAY
		output[9] ='';//Merchandisable
	}
	output[10] = '';//AttributeField1
	output[11] = '';//AttributeField2
	output[12] = '';//AttributeField3
	output[13] = getLocale(targetLang);//LanguageId
	output[14] = itemResult.xliff.file[0].group[0]['trans-unit'][transUnitId].target[0]._;//Name
	output[15] = itemResult.xliff.file[0].group[0]['trans-unit'][transUnitId].$.id;//Description
	output[16] = '';//SecondaryDescription
	output[17] = '';//AssociatedKeyword
	output[18] = '';//Field1
	output[19] = '';//Footnote
	output[20] = '';//UnitOfMeasure
	
	//console.log(output);
	outputStreams.csvAttrDictAttrStream.write(output);
	updated = true;
	return updated;
}

function processAttrNameXLIFF(contents,fname)
{
	var parser = new xml2js.Parser({async: false});
    parser.parseString(contents, function (err, result) {
    	//console.log(result.translated.item[0].payload);
    	var itemParser = new xml2js.Parser({async: false});
    	itemParser.parseString(result.translated.item[0].payload, function (err, itemResult)
    	{
    		var targetLang = itemResult.xliff.file[0].$['target-language'];
    		var groupId = itemResult.xliff.file[0].group[0].$.name;
    		var updated = false;
			var processType= 'Attr';
			
			if (deprecatedLocales.indexOf(targetLang) !== -1){

				errorFileList[errorFileList.length] = fname;
    			return;
			}
			else if (getLocale(targetLang) === 0){

    			ignoreFileList[ignoreFileList.length] = fname;
    			return;
			}

    		for (var i = 0; i < itemResult.xliff.file[0].group[0]['trans-unit'].length; i++)
    		{
    			var returnResult = writeAttrNameFields(targetLang,groupId,itemResult,i,fname);
        		updated = updated || returnResult;
    		}
    		if (updated){
    			writeAttrAndLookupReportRow(groupId, targetLang, fname, processType);
    		}
    		if (updated && errorFileList.indexOf(fname) === -1)
    		{
    			successFileList[successFileList.length] = fname;
    		}
    		else if (errorFileList.indexOf(fname) === -1)
			{
    			errorFileList[errorFileList.length] = fname;
			}
			if(!(localeList[2].includes(targetLang))){
    			if(localeList[2] == ""){
    				localeList[2]=targetLang;
    				langIdList[2]=getLocale(targetLang);
    			}
    			else{
    				localeList[2]=localeList[2]+','+targetLang;
    				langIdList[2]=langIdList[2]+','+getLocale(targetLang);
    			}
    		}
    		if(!(jobTriggers.includes("Publish Translated Attribute Names"))){
    			if(jobTriggers == "|"){
    				jobTriggers="|Publish Translated Attribute Names";
    			}
    			else{
    				jobTriggers=jobTriggers+','+"Publish Translated Attribute Names";
    			}
    		}
    	});
    });

}

function writeLookupFields(targetLang,partnumber,itemResult,transUnitId)
{
	var updated = false;
	var checker = 0;
	var output = [];
	var attrname = '';
	if (itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].target[0]._ === undefined
			|| itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].target[0]._ === '')
	{
		return updated;
	}
	//Included validation for EDS-4835
	if (lkupnamelookup[itemResult.xliff.file[0].body[0].group[0].$.name] === undefined)
	{
		console.log("@@INFO: Lookup Table - \""+itemResult.xliff.file[0].body[0].group[0].$.name+"\" not found");
		return checker;
	}
	output[0] = lkupnamelookup[itemResult.xliff.file[0].body[0].group[0].$.name].Identifier;//Identifier
	output[1] = getLocale(targetLang);//LanguageId
	output[2] = lkupnamelookup[itemResult.xliff.file[0].body[0].group[0].$.name].AttrValPrefix + '_' + 
					lkupnamelookup[itemResult.xliff.file[0].body[0].group[0].$.name].Identifier.replace(/\W/g,'_') + '_' + 
					itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].$.id.split('-')[0] + 
					"_ValueID";//ValueIdentifier
	output[3] = itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].$.id.split('-')[0];//Sequence
	output[4] = itemResult.xliff.file[0].body[0].group[0]['trans-unit'][transUnitId].target[0]._;//Value
	output[5] = '1';//ValueUsage
	output[6] = '';//AttributeValueField1
	output[7] = '';//AttributeValueField2
	output[8] = '';//AttributeValueField3
	output[9] = '';//Image1
	output[10] = '';//Image2
	output[11] = '';//Field1
	output[12] = '';//Field2
	output[13] = '';//Field3
	output[14] = '';//Delete

	//console.log(output);
	outputStreams.csvAttrDictAttrAllowValsStream.write(output);
	updated = true;
	return updated;
}

function processLookupXLIFF(contents,fname)
{
	var parser = new xml2js.Parser({async: false});
    parser.parseString(contents, function (err, result) {
    	//console.log(result.translated.item[0].payload);
    	var itemParser = new xml2js.Parser({async: false});
    	itemParser.parseString(result.translated.item[0].payload, function (err, itemResult)
    	{
    		var targetLang = itemResult.xliff.file[0].$['target-language'];
    		var groupId = itemResult.xliff.file[0].body[0].group[0].$.id;
    		var groupName = itemResult.xliff.file[0].body[0].group[0].$.name;
    		var updated = false;
    		var processType= 'Lookup';
			
			if (deprecatedLocales.indexOf(targetLang) !== -1){

				errorFileList[errorFileList.length] = fname;
    			return;
			}   
			else if (getLocale(targetLang) === 0){

    			ignoreFileList[ignoreFileList.length] = fname;
    			return;
			}
 		
    		for (var i = 0; i < itemResult.xliff.file[0].body[0].group[0]['trans-unit'].length; i++)
    		{
    			var returnResult = writeLookupFields(targetLang,groupId,itemResult,i);
    			//Included validation for EDS-4835
    			if(returnResult==0){
    				break;
    			}
        		updated = updated || returnResult;
    		}
    		if (updated){
    			writeAttrAndLookupReportRow(groupName, targetLang, fname, processType);
    		}
    		if (updated && errorFileList.indexOf(fname) === -1)
    		{
    			successFileList[successFileList.length] = fname;    			
    		}
    		else if (errorFileList.indexOf(fname) === -1)
			{
    			errorFileList[errorFileList.length] = fname;
			}
			if(!(localeList[3].includes(targetLang))){
    			if(localeList[3] == ""){
    				localeList[3]=targetLang;
    				langIdList[3]=getLocale(targetLang);
    			}
    			else{
    				localeList[3]=localeList[3]+','+targetLang;
    				langIdList[3]=langIdList[3]+','+getLocale(targetLang);
    			}
    		}
    		if(!(jobTriggers.includes("Publish Translated Predefined Attribute Values"))){
    			if(jobTriggers == "|"){
    				jobTriggers="|Publish Translated Predefined Attribute Values";
    			}
    			else{
    				jobTriggers=jobTriggers+','+"Publish Translated Predefined Attribute Values";
    			}
    		}
    	});
    });

}

function processErrorFiles()
{
	var errorBody = "";
	for (var k in errorFileList)
	{
		if (fs.statSync(tmsprocessDir + errorFileList[k]).isFile())
		{
			fs.renameSync(tmsprocessDir + errorFileList[k],  errDir + errorFileList[k]);
			errorBody = errorBody + errDir + errorFileList[k] + "\n";
		}
	}
}

function writeDataloadControlFile()
{
	var fsWriteStream;
	fsWriteStream = fs.createWriteStream(tmsprocessDir+'tms-publish-control' + batchid + ".txt");
	var startresult = "null|null|"+emailList+"|null|";
	var endresult = "|"+langIdList[0]+"~"+langIdList[1]+"~"+langIdList[2]+"~"+langIdList[3]+"|null|";
	var processEmail= processProduct+","+processCategory+","+processAttr+","+processLookup;
	
	fsWriteStream.write(startresult + batchid + endresult + processEmail + jobTriggers + os.EOL);
	fsWriteStream.end();
}

function writePublishTranslationControlFile(code,langId,masterpath,mailerlist,targetLocale)
{
	try {
		if (fs.existsSync(tmsextractPublishOnholdDir)) {
			var fsWritePublishTranslationStream;
			fsWritePublishTranslationStream = fs.createWriteStream(tmsextractPublishOnholdDir+'tms-publish-control-item' + langId + "-" + code.replace(/\W/g,'_') + ".txt");
			var startresult = "null|"+targetLocale+"|"+masterpath+"|"+mailerlist+"|";
			var endresult = "|"+langId+"|"+code;
			fsWritePublishTranslationStream.write(startresult + batchid + endresult + os.EOL);
			fsWritePublishTranslationStream.end();
		} else {
			console.log(tmsextractPublishOnholdDir+ " Directory does not exist.")
		}
	} catch(e) {
		console.log("Error: writePublishTranslationControlFile");
	}
}


function processSuccessFiles()
{
	for (var k in successFileList)
	{
		if (fs.statSync(tmsprocessDir + successFileList[k]).isFile())
		{
			fs.renameSync(tmsprocessDir + successFileList[k],  archiveDir + successFileList[k]);
		}
	}
	if (successFileList.length > 0)
	{
		writeDataloadControlFile();
	}
}

function processFinished()
{
	processErrorFiles();
	processSuccessFiles();
	fsImportStream.write (getDate() + '*****End of Product Import *****'+ os.EOL); 
	if(fsAutosolReportStream != undefined){
	fsAutosolReportStream.end();
	}
	if(fsComresReportStream != undefined){
	fsComresReportStream.end();	
	}
	if(fsAutosolCatReportStream != undefined){
		fsAutosolCatReportStream.end();	
	}
	if(fsComresCatReportStream != undefined){
		fsComresCatReportStream.end();	
	}
	if(fsAttrReportStream != undefined){
		fsAttrReportStream.end();	
	}
	if(fsLookupReportStream != undefined){
		fsLookupReportStream.end();	
	}
}

function writeReportRow(currproduct,currmasterpath,targetLang,fname,catalogFilename)
{
	var currProdName = handleProductName(currproduct);
	
	if(findForPlatform(currmasterpath) == "emr"){
		if(fsAutosolReportStream === undefined){
			createAutosolImportReport();			
		}
		fsAutosolReportStream.write(fname + ',' + catalogFilename + ',' + currProdName + ',' + currmasterpath + ',' + targetLang + ',' + currproduct.split('-')[0] + ',' + 
			"" + ("0"+(currtime.getMonth()+1)).slice(-2) + "/" + ("0"+currtime.getDate()).slice(-2) + "/" + currtime.getFullYear() + os.EOL);			
	} else {
		if(fsComresReportStream === undefined){
			createComresImportReport();
		}
		fsComresReportStream.write(fname + ',' + catalogFilename + ',' + currProdName + ',' + currmasterpath + ',' + targetLang + ',' + currproduct.split('-')[0] + ',' + 
			"" + ("0"+(currtime.getMonth()+1)).slice(-2) + "/" + ("0"+currtime.getDate()).slice(-2) + "/" + currtime.getFullYear() + os.EOL);			
	}
	if(env.toLowerCase() == 'stage')
		fsPartNumbersExportStream = fs.createWriteStream(jsonReader.getJsonProperties("prod", storeName).baseSharedDirectory + "CatMan/Export/TranslationDashboard/PartNumbersTranslatedS1.csv", {flags: 'a'});
	else
		fsPartNumbersExportStream = fs.createWriteStream(jsonObject.baseSharedDirectory + "CatMan/Export/TranslationDashboard/PartNumbersTranslatedS1.csv", {flags: 'a'});
	fsPartNumbersExportStream.write(currProdName + ',' + targetLang + os.EOL);
}

function writeCategoryReportRow(groupId,targetLang,fname)
{
	catgrp = groupId.split('SALES_CATALOG/')[1];
	var assignedStore =  undefined;
	if(lookups.salescategorymainlookup[catgrp]!=undefined){
		assignedStore =  lookups.salescategorymainlookup[catgrp].Store;
	}
	if (assignedStore !== undefined) {
		if (assignedStore==='EMR'){
			var platform=findForCategoryPlatform(catgrp);
			if (platform === 'Automation-Solutions') {
				if(fsAutosolCatReportStream === undefined){
					createAutosolCategoryImportReport();			
				}
				fsAutosolCatReportStream.write(fname + ',' + groupId + ',' + targetLang + ',' + ("0"+(currtime.getMonth()+1)).slice(-2) + "/" + ("0"+currtime.getDate()).slice(-2) + "/" + currtime.getFullYear() + os.EOL);			
			}
			else if (platform === 'Commercial-and-Residential-Solutions') {
				if(fsComresCatReportStream === undefined){
					createComresCategoryImportReport();
				}
				fsComresCatReportStream.write(fname + ',' + groupId + ',' + targetLang + ',' + ("0"+(currtime.getMonth()+1)).slice(-2) + "/" + ("0"+currtime.getDate()).slice(-2) + "/" + currtime.getFullYear() + os.EOL);			
			}
		}
		else{
			if(fsComresCatReportStream === undefined){
				createComresCategoryImportReport();
			}
			fsComresCatReportStream.write(fname + ',' + groupId + ',' + targetLang + ',' + ("0"+(currtime.getMonth()+1)).slice(-2) + "/" + ("0"+currtime.getDate()).slice(-2) + "/" + currtime.getFullYear() + os.EOL);			
		}
	}
}

function writeAttrAndLookupReportRow(groupId,targetLang,fname,processType)
{
	if(processType==='Attr'){
		if(fsAttrReportStream === undefined){
			createAttributeImportReport();			
		}
		fsAttrReportStream.write(fname + ',' + groupId + ',' + targetLang + ',' + ("0"+(currtime.getMonth()+1)).slice(-2) + "/" + ("0"+currtime.getDate()).slice(-2) + "/" + currtime.getFullYear() + os.EOL);
	}
	if(processType==='Lookup'){
		if(fsLookupReportStream === undefined){
			createLookupImportReport();			
		}
		fsLookupReportStream.write(fname + ',' + groupId + ',' + targetLang + ',' + ("0"+(currtime.getMonth()+1)).slice(-2) + "/" + ("0"+currtime.getDate()).slice(-2) + "/" + currtime.getFullYear() + os.EOL);
	}
}

var dir = fs.readdirSync(tmsimportDir);
for (var k in dir)
{
	//Don't process directories or files that are newer than 1 min old
	if (fs.statSync(tmsimportDir + dir[k]).isFile() && (Date.now() - fs.statSync(tmsimportDir + dir[k]).mtime.getTime()) > 60000)
	{
		try
		{
			fs.renameSync(tmsimportDir + dir[k],  tmsprocessDir + dir[k]);
		}
		catch(err)
		{
			//do nothing, assume file is open and process on the next run
		}
	}
}

dir = fs.readdirSync(tmsprocessDir);

dir.sort(function(a, b) {
    return fs.statSync(tmsprocessDir + a).mtime.getTime() - 
           fs.statSync(tmsprocessDir + b).mtime.getTime();
});

var i;
for (i = 0; i < dir.length; i++)
{
	
	if (dir[i].includes('_translated.xml') && !(dir[i].includes('_Lookup_') || dir[i].includes('_SALES_CATALOG_') || dir[i].includes('_ACM_Attr_Names_')))
	{
		console.log(dir[i]);
		var contents = fs.readFileSync(tmsprocessDir+dir[i],'utf8');
		
		processProductXLIFF(contents,dir[i]);
		
		// Set flag to true if the product xliff is processed. Flag is used in loadtranslationsfromxliff.sh while reading the control file.
		processProduct=true;
	}
	if (dir[i].includes('_translated.xml') && dir[i].includes('_SALES_CATALOG_'))
	{
		console.log(dir[i]);
		var contents = fs.readFileSync(tmsprocessDir+dir[i],'utf8');
		
		processCategoryXLIFF(contents,dir[i]);
		processCategory=true;
	}
	if (dir[i].includes('_translated.xml') && dir[i].includes('_ACM_Attr_Names_'))
	{
		console.log(dir[i]);
		var contents = fs.readFileSync(tmsprocessDir+dir[i],'utf8');
		
		processAttrNameXLIFF(contents,dir[i]);
		processAttr=true;
	}
	if (dir[i].includes('_translated.xml') && dir[i].includes('_Lookup_'))
	{
		console.log(dir[i]);
		var contents = fs.readFileSync(tmsprocessDir+dir[i],'utf8');
		
		processLookupXLIFF(contents,dir[i]);
		processLookup=true;
	}

	// if this file didn't process then add it to the error file list unless it's one of our output files
	if (successFileList.indexOf(dir[i]) === -1 && errorFileList.indexOf(dir[i]) === -1 && ignoreFileList.indexOf(dir[i]) === -1 && !dir[i].includes(batchid))
	{
		errorFileList[errorFileList.length] = dir[i];
	}
}
processFinished();

function getDate(){
	var now = new Date();
	var reportField1 = now.getDate() + '-' + now.toLocaleString('en-us', { month: "short" });
	var hour = now.getHours();
	var timeStamp;

	if (hour > 12)
	timeStamp = now.getFullYear() + ' ' + (hour -12) + ':' + now.getMinutes() + ':' + now.getSeconds() + ' PM ';
	else
	timeStamp = now.getFullYear() + ' ' + hour + ':' + now.getMinutes() + ':' + now.getSeconds() + ' AM ';

	return reportField1 + '-' + timeStamp;
}

function escapeDoubleQuotes(str) {
	var res = str.replace(/,/g, " ");
	res.replace(/\\([\s\S])|(")/g,"\\$1$2"); 
	return res;
}

function handleProductName(currentProduct){
	if (currentProduct.indexOf(",") > -1) {
		currentProduct = '"' + currentProduct + '"';
	}
	return currentProduct;
}
