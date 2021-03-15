var env = process.argv[2]; // Environment argument
var storeName = process.argv[3]; // Store argument
var lookups;
var langId = process.argv[4]; // language id argument

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
var loadLookups = require(envProperties.path().catman.rootDirectory + systemProperties.path().catman.cmModulesDirectory + systemProperties.path().catman.loadLookups);
var jsonReader = require(envProperties.path().catman.rootDirectory + systemProperties.path().catman.cmModulesDirectory + systemProperties.path().catman.jsonReader);

const entities = require('html-entities').XmlEntities; //use to escape the html
const escape = new entities();
var jsonObject = jsonReader.getJsonProperties(env, storeName);
var translationsPath = 'Translation-WorkingFolder/inbound/catman';
var baseDirectory = jsonObject.baseSharedDirectory + translationsPath;
var optionsCatGrp = {
    delimiter : ',', // default is , 
    endLine : '\n', // default is \n, 
	columns : ['GroupIdentifier','LanguageId','Name','ShortDescription','LongDescription','Thumbnail','FullImage','Published','Keyword','Note','URLKeyword','PageTitle','MetaDescription','ImageAltText','Delete'], // default is null
    escapeChar : '"', // default is an empty string 
    enclosedChar : '"' // default is an empty string 
};

var rlAttr = readline.createInterface({
	input: fs.createReadStream(jsonObject.baseSharedDirectory+'TMS/CatMan/ExtractForXLIFF/salescatalog-emr-catgrpdesc.csv')
});
var fsOutputStream = new Array(2);
var currtime = new Date();
var batchid = ""+currtime.getFullYear() + ("0"+(currtime.getMonth()+1)).slice(-2) + 
	("0"+currtime.getDate()).slice(-2) + ("0"+currtime.getHours()).slice(-2) + 
	("0"+currtime.getMinutes()).slice(-2) + ("0"+currtime.getSeconds()).slice(-2) + 
	("00"+currtime.getMilliseconds()).slice(-3);

var sourceLang = 'en_US';
var validLocales = jsonObject.validLocales;//{fr_FR:-2,de_DE:-3,it_IT:-4,es_ES:-5,pt_BR:-6,zh_CN:-7,zh_TW:-8,ko_KR:-9,ja_JP:-10,ru_RU:-20,pl_PL:-22,en_CN:-1000,en_GB:-1001,en_SG:-1002};
var curridentifier = '';
var currlang = '';
var xliffCatGrp = [];
lookups = loadLookups.getLookups(storeName);

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
var targetLang = getLanguage(langId);

function processCatGrp(currCatGrpRow)
{
	if (currCatGrpRow === undefined || lookups.salescategorynamelookup[currCatGrpRow.GroupIdentifier] === undefined)
	{
		return;
	}
	if (xliffCatGrp[currCatGrpRow.GroupIdentifier] === undefined)
	{
		xliffCatGrp[currCatGrpRow.GroupIdentifier] = [];
	}
	xliffCatGrp[currCatGrpRow.GroupIdentifier].Identifier = currCatGrpRow.GroupIdentifier;
	xliffCatGrp[currCatGrpRow.GroupIdentifier].Name = currCatGrpRow.Name;
}

function writeHeader()
{
	var autosolCatgrpFilePath = baseDirectory + '/Emerson' + batchid + 'EMR_SALES_CATALOG_Automation-Solutions_' + targetLang + '_ACM_Cat_Desc_MERRILLBRINK.xml';
	var comresCatgrpFilePath = baseDirectory + '/Emerson' + batchid + 'EMR_SALES_CATALOG_Commercial-and-Residential-Solutions_' + targetLang + '_ACM_Cat_Desc_MERRILLBRINK.xml';
	fsOutputStream[0] = fs.createWriteStream(autosolCatgrpFilePath, {highWaterMark: Math.pow(2,14)});
	fsOutputStream[1] = fs.createWriteStream(comresCatgrpFilePath, {highWaterMark: Math.pow(2,14)});
	for(var i=0;i<=fsOutputStream.length-1;i++){
		fsOutputStream[i].write('<?xml version="1.0" ?>'+os.EOL);
		fsOutputStream[i].write('<translation>'+os.EOL);
		fsOutputStream[i].write('	<routing>'+os.EOL);
		fsOutputStream[i].write('		<receiver>MERRILLBRINK</receiver>'+os.EOL);
		fsOutputStream[i].write('		<sender>ACM</sender>'+os.EOL);
		fsOutputStream[i].write('	</routing>'+os.EOL);
		fsOutputStream[i].write('	<batch>'+os.EOL);
		fsOutputStream[i].write('		<id>Emerson' + batchid + '</id>'+os.EOL);
		fsOutputStream[i].write('		<client>'+os.EOL);
		fsOutputStream[i].write('			<company>Emerson</company>'+os.EOL);
		fsOutputStream[i].write('			<businessPlatform>Corporation</businessPlatform>'+os.EOL);
		if(i==0){
			fsOutputStream[i].write('			<quoteApprover name="Quote Approver">' + lookups.tmsapproverlookup['emr' + targetLang].QuoteApproverEmail + '</quoteApprover>'+os.EOL);
		} else {
			fsOutputStream[i].write('			<quoteApprover name="Quote Approver">' + lookups.tmsapproverlookup['climate' + targetLang].QuoteApproverEmail + '</quoteApprover>'+os.EOL);
		}
		fsOutputStream[i].write('		</client>'+os.EOL);
		fsOutputStream[i].write('	</batch>'+os.EOL);
		fsOutputStream[i].write('	<items>'+os.EOL);
		fsOutputStream[i].write('		<item location="ACM" docType="xliff" version="1" id="Emerson' + batchid + '">'+os.EOL);
		fsOutputStream[i].write('			<operationType>Q</operationType>'+os.EOL);
		fsOutputStream[i].write('			<languages>'+os.EOL);
		fsOutputStream[i].write('				<language value="' + targetLang.split('_')[1] + '">'+os.EOL);
		fsOutputStream[i].write('					<variations>'+os.EOL);
		fsOutputStream[i].write('						<variation>' + targetLang + '</variation>'+os.EOL);
		fsOutputStream[i].write('					</variations>'+os.EOL);
		if(i==0){
			fsOutputStream[i].write('					<linguist name="Linquist Reviewer">' + lookups.tmsapproverlookup['emr' + targetLang].TextApproverEmail + '</linguist>'+os.EOL);
		} else {
			fsOutputStream[i].write('					<linguist name="Linquist Reviewer">' + lookups.tmsapproverlookup['climate' + targetLang].TextApproverEmail + '</linguist>'+os.EOL);
		}
		fsOutputStream[i].write('				</language>'+os.EOL);
		fsOutputStream[i].write('			</languages>'+os.EOL);
		fsOutputStream[i].write('			<payload><![CDATA[<xliff version="1.2" xmlns="urn:oasis:names:tc:xlifD:document:1.2">'+os.EOL);
		fsOutputStream[i].write('<file original="ACM native" source-language="en_US" target-language="' + targetLang + '" datatype="html">'+os.EOL);

	}
	
}

var seqAutosol= 1;
var seqComres=1;
var seqTest=1;
function writeCatGrp(catgrp,sourceValue, targetValue, unitId, groupId)
{
	var attrMaxWidth = 254;
	var assignedStore =  lookups.salescategorymainlookup[catgrp].Store;

	if (assignedStore !== undefined) {
		if (assignedStore==='EMR'){
			var platform=findForPlatform(catgrp);
			if (platform === 'Automation-Solutions') {
				fsOutputStream[0].write('<group id="' + groupId + '" name="Catalog Entry Categories Spec/Code">' + os.EOL);
				fsOutputStream[0].write('<trans-unit maxwidth="' + attrMaxWidth + '" id="' + seqAutosol + '" name="Catalog Entry Categories Spec/General information/Name/' + targetLang + '">' + os.EOL);
				fsOutputStream[0].write('<source xml:lang="' + sourceLang + '">' + escape.encodeNonUTF(sourceValue) + '</source>' + os.EOL);
				fsOutputStream[0].write('<target xml:lang="' + targetLang + '">' + escape.encodeNonUTF(targetValue) + '</target>' + os.EOL);
				fsOutputStream[0].write('</trans-unit>' + os.EOL);
				fsOutputStream[0].write('</group>' + os.EOL);
				seqAutosol++;
			}
			else if (platform === 'Commercial-and-Residential-Solutions') {
				fsOutputStream[1].write('<group id="' + groupId + '" name="Catalog Entry Categories Spec/Code">'+os.EOL);
				fsOutputStream[1].write('<trans-unit maxwidth="' + attrMaxWidth + '" id="' + seqComres + '" name="Catalog Entry Categories Spec/General information/Name/' + targetLang +'">'+os.EOL);
				fsOutputStream[1].write('<source xml:lang="' + sourceLang + '">' + escape.encodeNonUTF(sourceValue) + '</source>'+os.EOL);
				fsOutputStream[1].write('<target xml:lang="' + targetLang + '">' + escape.encodeNonUTF(targetValue) + '</target>'+os.EOL);
				fsOutputStream[1].write('</trans-unit>'+os.EOL);
				fsOutputStream[1].write('</group>'+os.EOL);
				seqComres++;
			}
		}
		else if (assignedStore ==='TEST') {
			seqTest++;
		}
		else{
			fsOutputStream[1].write('<group id="' + groupId + '" name="Catalog Entry Categories Spec/Code">'+os.EOL);
			fsOutputStream[1].write('<trans-unit maxwidth="' + attrMaxWidth + '" id="' + seqComres + '" name="Catalog Entry Categories Spec/General information/Name/' + targetLang +'">'+os.EOL);
			fsOutputStream[1].write('<source xml:lang="' + sourceLang + '">' + escape.encodeNonUTF(sourceValue) + '</source>'+os.EOL);
			fsOutputStream[1].write('<target xml:lang="' + targetLang + '">' + escape.encodeNonUTF(targetValue) + '</target>'+os.EOL);
			fsOutputStream[1].write('</trans-unit>'+os.EOL);
			fsOutputStream[1].write('</group>'+os.EOL);
			seqComres++;
		}
	}

	console.log("@@@INFO: Catalog Group Name is : "+ sourceValue);
	console.log("@@@INFO: Catalog Entry Categories Spec/Code is : " + groupId);
	console.log("@@@INFO: Source Language Attribute value is : " + sourceValue );
	console.log("@@@INFO: Target Language Attribute value is : " + targetValue );
	console.log("\n");
}

function writeFooter()
{
	for(var i=0;i<=fsOutputStream.length-1;i++){
		fsOutputStream[i].write('</file>'+os.EOL);
		fsOutputStream[i].write('</xliff>]]></payload>'+os.EOL);
		fsOutputStream[i].write('		</item>'+os.EOL);
		fsOutputStream[i].write('	</items>'+os.EOL);
		fsOutputStream[i].write('</translation>'+os.EOL);
		fsOutputStream[i].end();
	}
}

function findForPlatform(catgrp)
{
	while(!(catgrp==='Automation-Solutions' || catgrp==='Commercial-and-Residential-Solutions')){
		//catgrp=lookups.salescategorylookup[catgrp];
		catgrp=lookups.salescategorymainlookup[catgrp].ParentIdentifier;
	}
	return catgrp;
}

function writeCatGroups()
{
	writeHeader();
	var targetStore = storeName.toUpperCase();
	console.log("@@@INFO: START Logging Category Group for Store: " + targetStore);
	for (var catgrp in lookups.salescategorynamelookup)
	{
		var sourceValue = lookups.salescategorynamelookup[catgrp];

		var targetValue = '';
		if (xliffCatGrp[catgrp] !== undefined)
		{
			targetValue = xliffCatGrp[catgrp].Name;
		}

		var assignedStore =  lookups.salescategorymainlookup[catgrp].Store;
		if (assignedStore === undefined) {
			assignedStore = '';
		}

		//correct the value for ISE (INSINKERATOR_SALES_CATALOG)
		if (assignedStore === 'ISE') {
			assignedStore = "INSINKERATOR";
		}

		var unitId = assignedStore + '_SALES_CATALOG/' + catgrp;
		var groupId = assignedStore + '_SALES_CATALOG/' + catgrp;

		if (targetStore === 'WSV' || targetStore === 'TEST')	{
			if (targetStore === assignedStore) {
				writeCatGrp(catgrp,sourceValue, targetValue, unitId, groupId);
			}
		}
		else if (targetStore === 'EMR') {
			if (assignedStore !== 'WSV' && assignedStore !== 'TEST') {
				writeCatGrp(catgrp,sourceValue, targetValue, unitId, groupId);
			}
		}
	}

	console.log("@@@INFO: END Logging Category Group for Store: " + targetStore);
	writeFooter();
}

rlAttr.on('close',function () {
	writeCatGroups();
});

rlAttr.on('line',function (line) {
	// ignore header row
	if (line.startsWith('GroupIdentifier,') || line.startsWith('CatalogGroupDescription'))
	{
		return;
	}
	
	var currCatGrpRow = csv(line, optionsCatGrp);
	processCatGrp(currCatGrpRow[0]);
});
