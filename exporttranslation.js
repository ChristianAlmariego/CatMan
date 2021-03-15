var env = process.argv[2]; // Environment argument
var storeName = process.argv[3]; // Store argument
var lookups;
var catalogFilename = process.argv[4]; // catalog file name argument
var email = process.argv[5]; // email address argument
var person = process.argv[6]; // name argument
var batchId = process.argv[7]; // batch id argument
var langId = process.argv[8]; // language id argument
var lists = (process.argv[9].replace(/'/g, '')).split(',');
var comment = process.argv[10].split(',');
var translationType = process.argv[11];
var processFilesByBatchId = process.argv[12];
var catDescDataFile = process.argv[13];
var attrValDataFile = process.argv[14];

var count;

// setup node modules
var csv = require('csv-parse/lib/sync');
var readline = require('readline'); // use line reader to handle 1st non-csv row
var fs = require('fs');
var os = require('os');

// setup default properties
var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;

// setup extended properties
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var envProperties = propertiesReader.getEnvironmentProperties(env);
var systemProperties = propertiesReader.getSystemProperties();

// setup cm_modules
var genericUtil = require(envProperties.path().catman.rootDirectory + systemProperties.path().catman.cmModulesDirectory + systemProperties.path().catman.genericUtilities);
var loadLookups = require(envProperties.path().catman.rootDirectory + systemProperties.path().catman.cmModulesDirectory + systemProperties.path().catman.loadLookups);
var jsonReader = require(envProperties.path().catman.rootDirectory + systemProperties.path().catman.cmModulesDirectory + systemProperties.path().catman.jsonReader);

const entities = require('html-entities').XmlEntities; //use to escape the html
const escape = new entities();
var jsonObject = jsonReader.getJsonProperties(env, storeName);
var translationsPath = 'Translation-WorkingFolder/inbound/catman';
var baseDirectory = jsonObject.baseSharedDirectory + translationsPath;
var optionsCatDesc = {
    delimiter : ',', // default is , 
    endLine : '\n', // default is \n, 
	columns : ['PartNumber','LanguageId','FullPath','Name','ShortDescription','LongDescription','Thumbnail','FullImage','AuxDescription1','AuxDescription2','Available','Published','AvailabilityDate','Keyword','URLKeyword','PageTitle','MetaDescription','Delete'], // default is null
    escapeChar : '"', // default is an empty string 
    enclosedChar : '"' // default is an empty string 
};
var optionsAttrVal = {
    delimiter : ',', // default is , 
    endLine : '\n', // default is \n, 
	columns : ['PartNumber','AttributeIdentifier','LanguageId','ValueIdentifier','Value','Usage','Sequence','AttributeStoreIdentifier','Field1','Field2','Field3','Delete'], // default is null
    escapeChar : '"', // default is an empty string 
    enclosedChar : '"' // default is an empty string 
};

// check if for batch processing
var processByBatchId = true; // default to true
var catDescFilePathName;
var attrValFilePathName;

if (processFilesByBatchId == 'Y') {
	processByBatchId = true;
} else if (processFilesByBatchId == 'N') {
	processByBatchId = false;
}

if (processByBatchId) {
	catDescFilePathName = jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForXLIFF/catentry'+ batchId +'desc-output.csv';
	attrValFilePathName = jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForXLIFF/catentry' + batchId + 'attrrel-output.csv';
} else {
	catDescFilePathName = catDescDataFile;
	attrValFilePathName = attrValDataFile;
}

var rlCatDesc = readline.createInterface({
	input: fs.createReadStream(catDescFilePathName)
});

var rlAttrVal = readline.createInterface({
	input: fs.createReadStream(attrValFilePathName)
});

var fsOutputStream;
var fsAutosolReportStream;
var fsComresReportStream;

var currtime = new Date();
var batchid = ""+currtime.getFullYear() + ("0"+(currtime.getMonth()+1)).slice(-2) + 
	("0"+currtime.getDate()).slice(-2) + ("0"+currtime.getHours()).slice(-2) + 
	("0"+currtime.getMinutes()).slice(-2) + ("0"+currtime.getSeconds()).slice(-2) + 
	("00"+currtime.getMilliseconds()).slice(-3);

var productAutosolReportPath;
var productComresReportPath;
var baseDirFiles = fs.readdirSync(jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForXLIFF');
var existsAutosol = false;
var existsComres = false;
baseDirFiles.forEach(function (file){
	if(file.includes("Emerson", 0)){
		if(file.includes("_AutosolProductExport.csv", 0)){
			existsAutosol = true;
			productAutosolReportPath = jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForXLIFF/' + file;
		} else if(file.includes("_ComresProductExport.csv", 0)){
			existsComres = true;
			productComresReportPath = jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForXLIFF/' + file;
		}
	}
});
function createAutosolExportReport(){
	if (existsAutosol) { 
	  	fsAutosolReportStream = fs.createWriteStream(productAutosolReportPath, {highWaterMark: Math.pow(2,14), 'flags': 'a'});
	} else{
		productAutosolReportPath = jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForXLIFF/Emerson' + batchid + '_AutosolProductExport.csv';
		fsAutosolReportStream = fs.createWriteStream(productAutosolReportPath, {highWaterMark: Math.pow(2,14)});
		fsAutosolReportStream.write('File Name,Catalog File Name,Code,Master Category,Locale,Manufacturer/Brand,Date Exported'+os.EOL);
	}
}
function createComresExportReport(){
	if (existsComres) { 
	  	fsComresReportStream = fs.createWriteStream(productComresReportPath, {highWaterMark: Math.pow(2,14), 'flags': 'a'});
	} else{
		productComresReportPath = jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForXLIFF/Emerson' + batchid + '_ComresProductExport.csv';
		fsComresReportStream = fs.createWriteStream(productComresReportPath, {highWaterMark: Math.pow(2,14)});
		fsComresReportStream.write('File Name,Catalog File Name,Code,Master Category,Locale,Manufacturer/Brand,Date Exported'+os.EOL);
	}
}
var fsExportStream;
var productExportPath = jsonObject.baseSharedDirectory + 'TMS/CatMan/ExtractForXLIFF' + '/Report' + batchid + '_ProductExport_logs.csv';
fsExportStream = fs.createWriteStream(productExportPath, {highWaterMark: Math.pow(2,14)});
fsExportStream.write (getDate() + '*****Exporting Product*****' + os.EOL);

var sourceLang = 'en_US';
var validLocales = jsonObject.validLocales;//{fr_FR:-2,de_DE:-3,it_IT:-4,es_ES:-5,pt_BR:-6,zh_CN:-7,zh_TW:-8,ko_KR:-9,ja_JP:-10,ru_RU:-20,pl_PL:-22,en_CN:-1000,en_GB:-1001,en_SG:-1002};
var rowStack = [];
var catEntryDataRows = [];
var currproduct = '';
var currmasterpath = '';
var xliffCatDesc = [];
var xliffAttrVal = [];
rowStack.CatDesc = [];
rowStack.AttrVal = [];

var multiOccCounter = [];
var lastAttrVal = '';
var localeAttrs = [];
var multiOccAttrs = [];
var store = '';

lookups = loadLookups.getLookups(storeName);
localeAttrs = getTranslatableAttrs(lookups);
multiOccAttrs = getTranslatableMultiOccAttrs(lookups);

//Included function findForPlatform to find the catentry group for EDS-6069
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

function getLocale(locale)
{
	//TODO move to validator
	if (locale in validLocales)
	{
		return validLocales[locale];
	}
	else
	{
		return -1;
	}
}

function getLanguage(lang)
{
	var validLanguages = {};
	for (var key in validLocales) {
		if (true) //eliminate warning about key filter
		{
			validLanguages[validLocales[key]] = key;
		}
	}
	
	var i = validLanguages[lang];
	if (i !== undefined)
	{
		return i;
	}
	else
	{
		return 'en_US';
	}
}

function getTranslatableAttrs(lookups)
{
	var localeAttrs = [];
	
	for (var k in lookups.header['EMR'])
	{
		if (k !== undefined && k !== '' && isAttrMultiLang(k) && !(isAttrStringEnumeration(k)))
		{
			localeAttrs.push(lookups.header['EMR'][k].Identifier);
		}
	}
	
	return localeAttrs;
}

function getTranslatableMultiOccAttrs(lookups)
{
	var multiOccAttrs = [];
	
	for (var k in lookups.header['EMR'])
	{
		//MultiLang = true
		//Is not String Enumeration = true
		//Multi Value = true
		if (k !== undefined && k !== '' && isAttrMultiLang(k) && !(isAttrStringEnumeration(k)) && isAttrMultiValue(k))
		{			
			multiOccAttrs.push(lookups.header['EMR'][k].Identifier);
		}
	}
	
	return multiOccAttrs;
}

function isAttrMultiLang(attr)
{
	var attribute = attr;
	var multiLang = false;
	
	if (lookups.header['EMR'][attribute].MultiLang === 'TRUE')
	{
		multiLang = true;
	}
	
	return multiLang;
}

function isAttrStringEnumeration(attr)
{
	var attribute = attr;
	var stringEnum = false;
	
	if (lookups.header['EMR'][attribute].LkupType === 'LOOKUP_TABLE' || lookups.header['EMR'][attribute].LkupType === 'STRING_ENUMERATION')
	{
		stringEnum = true;
	}
	
	return stringEnum;
}

function isAttrMultiValue(attr)
{
	var attribute = attr;
	var multiValue = false;
	
	if (lookups.header['EMR'][attribute].MultiValue > 1)
	{
		multiValue = true;
	}
	
	return multiValue;
}

var targetLang = getLanguage(langId);

function processCatDesc(currCatDescRow)
{
	
	if (xliffCatDesc[sourceLang] === undefined)
	{
		xliffCatDesc[sourceLang] = [];
	}
	if (xliffCatDesc[targetLang] === undefined)
	{
		xliffCatDesc[targetLang] = [];
	}
	if (currCatDescRow !== undefined && getLanguage(currCatDescRow.LanguageId) === sourceLang)
	{
		if (currCatDescRow.Name !== undefined && currCatDescRow.Name !== "")
		{
			xliffCatDesc[sourceLang].Name = currCatDescRow.Name;
			if (xliffCatDesc[targetLang].Name === undefined)
			{
				xliffCatDesc[targetLang].Name = '';
			}
		}
		if (currCatDescRow.ShortDescription !== undefined && currCatDescRow.ShortDescription !== "")
		{
			xliffCatDesc[sourceLang].ShortDescription = currCatDescRow.ShortDescription;
			if (xliffCatDesc[targetLang].ShortDescription === undefined)
			{
				xliffCatDesc[targetLang].ShortDescription = '';
			}
		}
		if (currCatDescRow.LongDescription !== undefined && currCatDescRow.LongDescription !== "")
		{
			xliffCatDesc[sourceLang].LongDescription = currCatDescRow.LongDescription;
			if (xliffCatDesc[targetLang].LongDescription === undefined)
			{
				xliffCatDesc[targetLang].LongDescription = '';
			}
		}
		if (currCatDescRow.Keyword !== undefined && currCatDescRow.Keyword !== "")
		{
			xliffCatDesc[sourceLang].Keyword = currCatDescRow.Keyword;
			if (xliffCatDesc[targetLang].Keyword === undefined)
			{
				xliffCatDesc[targetLang].Keyword = '';
			}
		}
		if (currCatDescRow.PageTitle !== undefined && currCatDescRow.PageTitle !== "")
		{
			xliffCatDesc[sourceLang].PageTitle = currCatDescRow.PageTitle;
			if (xliffCatDesc[targetLang].PageTitle === undefined)
			{
				xliffCatDesc[targetLang].PageTitle = '';
			}
		}
		if (currCatDescRow.MetaDescription !== undefined && currCatDescRow.MetaDescription !== "")
		{
			xliffCatDesc[sourceLang].MetaDescription = currCatDescRow.MetaDescription;
			if (xliffCatDesc[targetLang].MetaDescription === undefined)
			{
				xliffCatDesc[targetLang].MetaDescription = '';
			}
		}
	}
	else if (currCatDescRow !== undefined && getLanguage(currCatDescRow.LanguageId) === targetLang)
	{
		if (currCatDescRow.Name !== undefined && currCatDescRow.Name !== "")
		{
			xliffCatDesc[targetLang].Name = currCatDescRow.Name;
			if (xliffCatDesc[sourceLang].Name === undefined)
			{
				xliffCatDesc[sourceLang].Name = '';
			}
		}
		if (currCatDescRow.ShortDescription !== undefined && currCatDescRow.ShortDescription !== "")
		{
			xliffCatDesc[targetLang].ShortDescription = currCatDescRow.ShortDescription;
			if (xliffCatDesc[sourceLang].ShortDescription === undefined)
			{
				xliffCatDesc[sourceLang].ShortDescription = '';
			}
		}
		if (currCatDescRow.LongDescription !== undefined && currCatDescRow.LongDescription !== "")
		{
			xliffCatDesc[targetLang].LongDescription = currCatDescRow.LongDescription;
			if (xliffCatDesc[sourceLang].LongDescription === undefined)
			{
				xliffCatDesc[sourceLang].LongDescription = '';
			}
		}
		if (currCatDescRow.Keyword !== undefined && currCatDescRow.Keyword !== "")
		{
			xliffCatDesc[targetLang].Keyword = currCatDescRow.Keyword;
			if (xliffCatDesc[sourceLang].Keyword === undefined)
			{
				xliffCatDesc[sourceLang].Keyword = '';
			}
		}
		if (currCatDescRow.PageTitle !== undefined && currCatDescRow.PageTitle !== "")
		{
			xliffCatDesc[targetLang].PageTitle = currCatDescRow.PageTitle;
			if (xliffCatDesc[sourceLang].PageTitle === undefined)
			{
				xliffCatDesc[sourceLang].PageTitle = '';
			}
		}
		if (currCatDescRow.MetaDescription !== undefined && currCatDescRow.MetaDescription !== "")
		{
			xliffCatDesc[targetLang].MetaDescription = currCatDescRow.MetaDescription;
			if (xliffCatDesc[sourceLang].MetaDescription === undefined)
			{
				xliffCatDesc[sourceLang].MetaDescription = '';
			}
		}
	}
}

function processAttrVal(currAttrValRow)
{
	if (currAttrValRow === undefined || localeAttrs.indexOf(currAttrValRow.AttributeIdentifier) === -1)
	{
		return
	}
	if (currAttrValRow !== undefined && (getLanguage(currAttrValRow.LanguageId) === sourceLang || getLanguage(currAttrValRow.LanguageId) === targetLang))
	{
		if (!genericUtil.isUndefined(currAttrValRow)) {

			var currentDataRowLanguage = getLanguage(currAttrValRow.LanguageId);
			var currentDataRowIdentifier = currAttrValRow.AttributeIdentifier;

			if (xliffAttrVal[currentDataRowLanguage] === undefined) {
				xliffAttrVal[currentDataRowLanguage] = [];
			}

			if (multiOccAttrs.indexOf(currentDataRowIdentifier) === -1) {
				//non multi occurence attribute

				if (xliffAttrVal[currentDataRowLanguage][currentDataRowIdentifier] === undefined) {
					xliffAttrVal[currentDataRowLanguage][currentDataRowIdentifier] = [];
				}

				xliffAttrVal[currentDataRowLanguage][currentDataRowIdentifier].ValueIdentifier = currAttrValRow.ValueIdentifier;
				xliffAttrVal[currentDataRowLanguage][currentDataRowIdentifier].Value = currAttrValRow.Value;
				xliffAttrVal[currentDataRowLanguage][currentDataRowIdentifier].Sequence = currAttrValRow.Sequence;
				xliffAttrVal[currentDataRowLanguage][currentDataRowIdentifier].AttributeIdentifier = currAttrValRow.AttributeIdentifier;
			} else {
				//If multi occurence attribute

				multiOccCounter[currentDataRowIdentifier] = (multiOccCounter[currentDataRowIdentifier] || 0)+1; 
				var multiAttrID = currentDataRowIdentifier+'-'+multiOccCounter[currentDataRowIdentifier];
				
				if (xliffAttrVal[currentDataRowLanguage][multiAttrID] === undefined) {
					xliffAttrVal[currentDataRowLanguage][multiAttrID] = [];
				}

				xliffAttrVal[currentDataRowLanguage][multiAttrID].ValueIdentifier = currAttrValRow.ValueIdentifier;
				xliffAttrVal[currentDataRowLanguage][multiAttrID].Value = currAttrValRow.Value;
				xliffAttrVal[currentDataRowLanguage][multiAttrID].Sequence = currAttrValRow.Sequence;
				xliffAttrVal[currentDataRowLanguage][multiAttrID].AttributeIdentifier = currAttrValRow.AttributeIdentifier;
				xliffAttrVal[currentDataRowLanguage][multiAttrID].MultiOccurence = multiOccCounter[currentDataRowIdentifier]-1;
			}
		}
	}
}

function writeHeader(currproduct)
{
	//Emerson72120176115_ACM_Product_Rosemount-P-68Q Temperature Sensor_zh_CN_MERRILLBRINK.xml
	var productFilePath = baseDirectory + '/Emerson' + batchid + '_ACM_Product_' + currproduct.replace(/\W+/g,'_') + '_' + targetLang + '_MERRILLBRINK.xml';
	fsOutputStream = fs.createWriteStream(productFilePath, {highWaterMark: Math.pow(2,14)});
	fsOutputStream.write('<?xml version="1.0" ?>'+os.EOL);
	fsOutputStream.write('<translation>'+os.EOL);
	fsOutputStream.write('	<routing>'+os.EOL);
	fsOutputStream.write('		<receiver>MERRILLBRINK</receiver>'+os.EOL);
	fsOutputStream.write('		<sender>ACM</sender>'+os.EOL);
	fsOutputStream.write('	</routing>'+os.EOL);
	fsOutputStream.write('	<batch>'+os.EOL);
	fsOutputStream.write('		<id>Emerson' + batchId + '</id>'+os.EOL);
	fsOutputStream.write('		<client>'+os.EOL);
	fsOutputStream.write('			<company>Emerson</company>'+os.EOL);
	fsOutputStream.write('			<businessPlatform>Corporation</businessPlatform>'+os.EOL);
	fsOutputStream.write('			<quoteApprover name="Quote Approver">' + lookups.tmsapproverlookup[store + targetLang].QuoteApproverEmail + '</quoteApprover>'+os.EOL);
	fsOutputStream.write('		</client>'+os.EOL);
	fsOutputStream.write('	</batch>'+os.EOL);
	fsOutputStream.write('	<items>'+os.EOL);
	fsOutputStream.write('		<item location="ACM" docType="xliff" version="1" id="Emerson' + batchId + '">'+os.EOL);
	fsOutputStream.write('			<operationType>Q</operationType>'+os.EOL);
	fsOutputStream.write('			<Brand>' + currproduct.split('-')[0] + '</Brand>'+os.EOL);
	fsOutputStream.write('			<languages>'+os.EOL);
	fsOutputStream.write('				<language value="' + targetLang.split('_')[1] + '">'+os.EOL);
	fsOutputStream.write('					<variations>'+os.EOL);
	fsOutputStream.write('						<variation>' + targetLang + '</variation>'+os.EOL);
	fsOutputStream.write('					</variations>'+os.EOL);
	fsOutputStream.write('					<linguist name="Linquist Reviewer">' + lookups.tmsapproverlookup[store + targetLang].TextApproverEmail + '</linguist>'+os.EOL);
	fsOutputStream.write('				</language>'+os.EOL);
	fsOutputStream.write('			</languages>'+os.EOL);
	fsOutputStream.write('			<payload><![CDATA[<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">'+os.EOL);
	fsOutputStream.write('<file original="ACM native" catalog-filename="' + catalogFilename + '" requester-email="' + email + '" source-language="en_US" target-language="' + targetLang + '" datatype="html">'+os.EOL);
	if(comment[count] === undefined || comment[count] === ''){
		fsOutputStream.write('<header>'+os.EOL)
		fsOutputStream.write('<note>'+os.EOL)
		fsOutputStream.write('<master>'+os.EOL)
		fsOutputStream.write(currmasterpath+os.EOL)
		fsOutputStream.write('</master>'+os.EOL)
		fsOutputStream.write('</note>'+os.EOL)
		fsOutputStream.write('</header>'+os.EOL);
	}
	else{
		fsOutputStream.write('<header>'+os.EOL)
		fsOutputStream.write('<note>'+os.EOL)
		fsOutputStream.write(comment[count]+os.EOL)
		fsOutputStream.write('<master>'+os.EOL)
		fsOutputStream.write(currmasterpath+os.EOL)
		fsOutputStream.write('</master>'+os.EOL)
		fsOutputStream.write('</note>'+os.EOL)
		fsOutputStream.write('</header>'+os.EOL);
	}
	fsOutputStream.write('<body>'+os.EOL);
	fsOutputStream.write('<group id="' + currproduct + '" name="Catalog Entry Spec/Code">'+os.EOL);
	
	

}

var seq = -1;
function writeCatDesc()
{
	fsExportStream.write (getDate() + '*****Processing Catalog Entry Descriptions*****' + os.EOL);
	
	if (xliffCatDesc[sourceLang].Name !== undefined && (xliffCatDesc[sourceLang].Name !== "" || xliffCatDesc[targetLang].Name !== ""))
	{
		fsOutputStream.write('<trans-unit maxwidth="'+ lookups.inputfielddef['EMR-Name'].MAXLENGTH + '" id="' + ++seq + '" name="Catalog Entry Spec/General information/Name/' + targetLang + '">'+os.EOL);
		fsOutputStream.write('<source xml:lang="' + sourceLang + '">' + escape.encodeNonUTF(xliffCatDesc[sourceLang].Name) + '</source>'+os.EOL);
		fsOutputStream.write('<target xml:lang="' + targetLang + '"></target>'+os.EOL);
		fsOutputStream.write('</trans-unit>'+os.EOL);
	}
	if (xliffCatDesc[sourceLang].ShortDescription !== undefined && (xliffCatDesc[sourceLang].ShortDescription !== "" || xliffCatDesc[targetLang].ShortDescription !== ""))
	{
		fsOutputStream.write('<trans-unit maxwidth="'+ lookups.inputfielddef['EMR-Short description'].MAXLENGTH + '" id="' + ++seq + '" name="Catalog Entry Spec/General information/Short description/' + targetLang + '">'+os.EOL);
		fsOutputStream.write('<source xml:lang="' + sourceLang + '">' + escape.encodeNonUTF(xliffCatDesc[sourceLang].ShortDescription) + '</source>'+os.EOL);
		fsOutputStream.write('<target xml:lang="' + targetLang + '"></target>'+os.EOL);
		fsOutputStream.write('</trans-unit>'+os.EOL);
	}
	if (xliffCatDesc[sourceLang].LongDescription !== undefined && (xliffCatDesc[sourceLang].LongDescription !== "" || xliffCatDesc[targetLang].LongDescription !== ""))
	{
		fsOutputStream.write('<trans-unit maxwidth="'+ lookups.inputfielddef['EMR-Long description'].MAXLENGTH + '" id="' + ++seq + '" name="Catalog Entry Spec/General information/Long description/' + targetLang + '">'+os.EOL);
		fsOutputStream.write('<source xml:lang="' + sourceLang + '">' + escape.encodeNonUTF(xliffCatDesc[sourceLang].LongDescription) + '</source>'+os.EOL);
		fsOutputStream.write('<target xml:lang="' + targetLang + '"></target>'+os.EOL);
		fsOutputStream.write('</trans-unit>'+os.EOL);
	}
	if (xliffCatDesc[sourceLang].Keyword !== undefined && (xliffCatDesc[sourceLang].Keyword !== "" || xliffCatDesc[targetLang].Keyword !== ""))
	{
		fsOutputStream.write('<trans-unit maxwidth="'+ lookups.inputfielddef['EMR-Keyword'].MAXLENGTH + '" id="' + ++seq + '" name="Catalog Entry Spec/General information/Keyword/' + targetLang + '">'+os.EOL);
		fsOutputStream.write('<source xml:lang="' + sourceLang + '">' + escape.encodeNonUTF(xliffCatDesc[sourceLang].Keyword) + '</source>'+os.EOL);
		fsOutputStream.write('<target xml:lang="' + targetLang + '"></target>'+os.EOL);
		fsOutputStream.write('</trans-unit>'+os.EOL);
	}
	if (xliffCatDesc[sourceLang].URLKeyword !== undefined && (xliffCatDesc[sourceLang].URLKeyword !== "" || xliffCatDesc[targetLang].URLKeyword !== ""))
	{
		fsOutputStream.write('<trans-unit maxwidth="'+ lookups.inputfielddef['EMR-URL'].MAXLENGTH + '" id="' + ++seq + '" name="Catalog Entry Spec/Search Engine Optimization/URL keyword/' + targetLang + '">'+os.EOL);
		fsOutputStream.write('<source xml:lang="' + sourceLang + '">' + escape.encodeNonUTF(xliffCatDesc[sourceLang].URLKeyword) + '</source>'+os.EOL);
		fsOutputStream.write('<target xml:lang="' + targetLang + '"></target>'+os.EOL);
		fsOutputStream.write('</trans-unit>'+os.EOL);
	}
	if (xliffCatDesc[sourceLang].PageTitle !== undefined && (xliffCatDesc[sourceLang].PageTitle !== "" || xliffCatDesc[targetLang].PageTitle !== ""))
	{
		fsOutputStream.write('<trans-unit maxwidth="'+ lookups.inputfielddef['EMR-Page title'].MAXLENGTH + '" id="' + ++seq + '" name="Catalog Entry Spec/Search Engine Optimization/Page title/' + targetLang + '">'+os.EOL);
		fsOutputStream.write('<source xml:lang="' + sourceLang + '">' + escape.encodeNonUTF(xliffCatDesc[sourceLang].PageTitle) + '</source>'+os.EOL);
		fsOutputStream.write('<target xml:lang="' + targetLang + '"></target>'+os.EOL);
		fsOutputStream.write('</trans-unit>'+os.EOL);
	}
	if (xliffCatDesc[sourceLang].MetaDescription !== undefined && (xliffCatDesc[sourceLang].MetaDescription !== "" || xliffCatDesc[targetLang].MetaDescription !== ""))
	{
		fsOutputStream.write('<trans-unit maxwidth="'+ lookups.inputfielddef['EMR-Meta description'].MAXLENGTH + '" id="' + ++seq + '" name="Catalog Entry Spec/Search Engine Optimization/Meta description/' + targetLang + '">'+os.EOL);
		fsOutputStream.write('<source xml:lang="' + sourceLang + '">' + escape.encodeNonUTF(xliffCatDesc[sourceLang].MetaDescription) + '</source>'+os.EOL);
		fsOutputStream.write('<target xml:lang="' + targetLang + '"></target>'+os.EOL);
		fsOutputStream.write('</trans-unit>'+os.EOL);
	}
	
	fsExportStream.write (getDate() + '*****End of processing Catalog Entry Descriptions*****' + os.EOL);
}

function writeAttrVal() {
	// sort attr values before writing
	sortAttrVal();
	var transUnitId;
	var attrMaxWidth = 2000;
	fsExportStream.write(getDate() + '*****Processing attributes*****' + os.EOL); 
	
	// for all attribute values
	for (var key in xliffAttrVal[sourceLang])
	{
		if (xliffAttrVal[sourceLang][key] !== undefined && xliffAttrVal[sourceLang][key].AttributeIdentifier!=="EMR sourceERP" && xliffAttrVal[sourceLang][key].AttributeIdentifier!=="EMR Division ID")
		{
			if (xliffAttrVal[sourceLang][key].MultiOccurence === undefined)
			{
				fsOutputStream.write('<trans-unit maxwidth="' + attrMaxWidth + '" id="' + ++seq + '" name="Catalog Manager Attributes/' 
									+ xliffAttrVal[sourceLang][key].AttributeIdentifier + "/" + targetLang 
									+ '" valueSequence="' + xliffAttrVal[sourceLang][key].Sequence + '">' + os.EOL);
				fsOutputStream.write('<source xml:lang="' + sourceLang + '">' + escape.encodeNonUTF(xliffAttrVal[sourceLang][key].Value) + '</source>'+os.EOL);
				fsOutputStream.write('<target xml:lang="' + targetLang + '"></target>'+os.EOL);
				fsOutputStream.write('</trans-unit>'+os.EOL);
			}
			else
			{
				if (lastAttrVal.valueOf() != xliffAttrVal[sourceLang][key].AttributeIdentifier.valueOf()) ++seq;
				
				transUnitId = seq + "-" + xliffAttrVal[sourceLang][key].MultiOccurence;
				fsOutputStream.write('<trans-unit maxwidth="' + attrMaxWidth + '" id="' + transUnitId + '" name="Catalog Manager Attributes/' 
									+ xliffAttrVal[sourceLang][key].AttributeIdentifier + "/" + targetLang 
									+ "#" + xliffAttrVal[sourceLang][key].MultiOccurence 
									+ '" valueSequence="' + xliffAttrVal[sourceLang][key].Sequence + '">' + os.EOL);
				fsOutputStream.write('<source xml:lang="' + sourceLang + '">' + escape.encodeNonUTF(xliffAttrVal[sourceLang][key].Value) + '</source>'+os.EOL);
				fsOutputStream.write('<target xml:lang="' + targetLang + '"></target>'+os.EOL);
				fsOutputStream.write('</trans-unit>'+os.EOL);
			}
			lastAttrVal = xliffAttrVal[sourceLang][key].AttributeIdentifier;
			
			fsExportStream.write (getDate() + lastAttrVal + os.EOL);
		}
	}
	
	fsExportStream.write (getDate() + '***** End of Processing Attributes *****' + os.EOL);
}

function writeFooter()
{
	fsOutputStream.write('</group>'+os.EOL);
	fsOutputStream.write('</body>'+os.EOL);
	fsOutputStream.write('</file>'+os.EOL);
	fsOutputStream.write('</xliff>]]></payload>'+os.EOL);
	fsOutputStream.write('		</item>'+os.EOL);
	fsOutputStream.write('	</items>'+os.EOL);
	fsOutputStream.write('</translation>'+os.EOL);
	fsOutputStream.end();
}

function writeReportRow(currproduct,currmasterpath)
{
	//Emerson72120176115_ACM_Product_Rosemount-P-68Q Temperature Sensor_zh_CN_MERRILLBRINK.xml
	var productFilePath = 'Emerson' + batchid + '_ACM_Product_' + currproduct.replace(/\W+/g,'_') + '_' + targetLang + '_MERRILLBRINK.xml';
	//writeRow
	if(findForPlatform(currmasterpath) == "emr"){
		if(fsAutosolReportStream === undefined){
			createAutosolExportReport();
		}
		fsAutosolReportStream.write(productFilePath + ',' + catalogFilename + ',' + currproduct + ',' + currmasterpath + ',' + targetLang + ',' + currproduct.split('-')[0] + ',' + 
			"" + ("0"+(currtime.getMonth()+1)).slice(-2) + "/" + ("0"+currtime.getDate()).slice(-2) + "/" + currtime.getFullYear() + os.EOL);
	} else {
		if(fsComresReportStream === undefined){
			createComresExportReport();
		}
		fsComresReportStream.write(productFilePath + ',' + catalogFilename + ',' + currproduct + ',' + currmasterpath + ',' + targetLang + ',' + currproduct.split('-')[0] + ',' + 
			"" + ("0"+(currtime.getMonth()+1)).slice(-2) + "/" + ("0"+currtime.getDate()).slice(-2) + "/" + currtime.getFullYear() + os.EOL);
	}
	if(env.toLowerCase() != 'stage'){
		fsPartNumbersExportStream = fs.createWriteStream(jsonObject.baseSharedDirectory + "CatMan/Export/TranslationDashboard/PartNumbersInTranslation.csv", {flags: 'a'});
		if(currproduct.includes(","))
			fsPartNumbersExportStream.write('"' + currproduct + '",' + targetLang + os.EOL);
		else
			fsPartNumbersExportStream.write(currproduct + ',' + targetLang + os.EOL);
	}
}

function closeCurrentProduct()
{	
	fsExportStream.write (getDate() + '*****Processing PartNumber*****' +os.EOL);
	fsExportStream.write (getDate() + 'Code: ' + currproduct +os.EOL);
	fsExportStream.write (getDate() + '*****Master Category*****' +os.EOL);
	fsExportStream.write (getDate() + 'Category: ' + currmasterpath +os.EOL);
	var catgrp = lookups.mastercataloglookup[currproduct];
	store = findForPlatform(catgrp);
	writeHeader(currproduct);
	writeCatDesc();
	//writeExportFile(currproduct, targetLang, localeAttrs, currmasterpath);
	writeAttrVal();
	writeFooter();
	
	writeReportRow(currproduct,currmasterpath);
	
	
	
	//reset back to blank
	xliffCatDesc = [];
	xliffAttrVal = [];
	multiOccCounter = [];
	
	fsExportStream.write (getDate() + 'Locale: ' + targetLang +os.EOL );
	fsExportStream.write (getDate() + 'Exported!!' +os.EOL );
}

// arrange the row entries per catentry
function buildCatEntryDataRows(dataType, line) {

	var dataRow;

	// ignore header row
	if (line.startsWith('PartNumber,') 
		|| line.startsWith('CatalogEntryDescription') 
		|| line.startsWith('CatalogEntryAttributeDictionaryAttributeRelationship')) {
		return;
	}

	// transform line data to row data
	if ('CatDesc' === dataType) {
		dataRow = csv(line, optionsCatDesc);
	} else if ('AttrVal' === dataType) {
		dataRow = csv(line, optionsAttrVal);
	}
	dataRow = dataRow[0];
	
	// start building
	if (!genericUtil.isUndefined(dataRow)) {
		if (!genericUtil.isUndefined(catEntryDataRows[dataRow.PartNumber])) {
			// if partnumber already exists
			addCatEntryDataRowPerLocale(dataType, dataRow);
		} else {
			// if partnumber is new
			catEntryDataRows[dataRow.PartNumber] = [];
			catEntryDataRows[dataRow.PartNumber].CatDesc = [];
			catEntryDataRows[dataRow.PartNumber].AttrVal = [];
			addCatEntryDataRowPerLocale(dataType, dataRow);
		}
	}
}

// adds the dataRow per locale into catEntryDataRows
function addCatEntryDataRowPerLocale(dataType, dataRow) {
	var locale = dataRow.LanguageId;

	if ('CatDesc' === dataType) {
		if (genericUtil.isUndefined(catEntryDataRows[dataRow.PartNumber].CatDesc[locale])) {
			catEntryDataRows[dataRow.PartNumber].CatDesc[locale] = [];
		}
		catEntryDataRows[dataRow.PartNumber].CatDesc[locale].push(dataRow);
	} else if ('AttrVal' === dataType) {
		if (genericUtil.isUndefined(catEntryDataRows[dataRow.PartNumber].AttrVal[locale])) {
			catEntryDataRows[dataRow.PartNumber].AttrVal[locale] = [];
		}
		catEntryDataRows[dataRow.PartNumber].AttrVal[locale].push(dataRow);
	}
}

// process the complete batch data inside catEntryDataRows
function processCatEntryDataRows() {
	
	if (!genericUtil.isUndefined(catEntryDataRows) && genericUtil.isArray(catEntryDataRows)) {

		for (var partnum in catEntryDataRows) {
			var newDataExists = false;
			var dataPerPartNum = catEntryDataRows[partnum];
			var lastProcessedCatDescDataRow;

			// process all CatDesc data
			for (var locale in dataPerPartNum.CatDesc) {
				var dataPerLocale = dataPerPartNum.CatDesc[locale];

				for (var i = 0; i < dataPerLocale.length; i++) {
					processCatDesc(dataPerLocale[i]);
					newDataExists = true;
					lastProcessedCatDescDataRow = dataPerLocale[i];
				}
			}

			// process all AttrVal data
			for (var locale in dataPerPartNum.AttrVal) {
				var dataPerLocale = dataPerPartNum.AttrVal[locale];

				for (var i = 0; i < dataPerLocale.length; i++) {
					processAttrVal(dataPerLocale[i]);
				}

				multiOccCounter = [];
			}

			if (newDataExists) {
				currproduct = lastProcessedCatDescDataRow.PartNumber;
				currmasterpath = lastProcessedCatDescDataRow.FullPath;

				if(translationType === 'category') {
					count = lists.indexOf(currmasterpath);
					var master = currmasterpath;
					while(count<0){
						master=lookups.mastercategorylookup[master];
						count=lists.indexOf(master);
					}
				} else if (translationType === 'item') {
					count=lists.indexOf(currproduct);
				}

				// process the catentry details
				closeCurrentProduct(currproduct,currmasterpath);
			}
		}
	}
}

rlCatDesc.on('line',function (line) {
	buildCatEntryDataRows('CatDesc', line);
});

rlAttrVal.on('line',function (line) {
	buildCatEntryDataRows('AttrVal', line);
});

rlAttrVal.on('close',function () {
	processCatEntryDataRows();
	
	if(fsAutosolReportStream != undefined){
	fsAutosolReportStream.end();
	}
	if(fsComresReportStream != undefined){
	fsComresReportStream.end();
	}
});


function sortAttrVal()
{
	//Sort Attr Values according to Attribute Identifier
	xliffAttrVal.sort(function(a,b) {
	    return a[0]-b[0]
	});
}

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

