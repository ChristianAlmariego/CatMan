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
var optionsAttrVal = {
    delimiter : ',', // default is , 
    endLine : '\n', // default is \n, 
	columns : ['Identifier','LanguageId','ValueIdentifier','Sequence','Value','ValueUsage','AttributeValueField1','AttributeValueField2','AttributeValueField3','Image1','Image2','Field1','Field2','Field3','Delete'], // default is null
    escapeChar : '"', // default is an empty string 
    enclosedChar : '"' // default is an empty string 
};

var rlAttrVal = readline.createInterface({
	input: fs.createReadStream(jsonObject.baseSharedDirectory+'TMS/CatMan/ExtractForXLIFF/attrlkupattrdictattrallowvals-lkup-output.csv')
});
var fsOutputStream;
var currtime = new Date();
var batchid = ""+currtime.getFullYear() + ("0"+(currtime.getMonth()+1)).slice(-2) + 
	("0"+currtime.getDate()).slice(-2) + ("0"+currtime.getHours()).slice(-2) + 
	("0"+currtime.getMinutes()).slice(-2) + ("0"+currtime.getSeconds()).slice(-2) + 
	("00"+currtime.getMilliseconds()).slice(-3);

var sourceLang = 'en_US';
var validLocales = jsonObject.validLocales;//{fr_FR:-2,de_DE:-3,it_IT:-4,es_ES:-5,pt_BR:-6,zh_CN:-7,zh_TW:-8,ko_KR:-9,ja_JP:-10,ru_RU:-20,pl_PL:-22,en_CN:-1000,en_GB:-1001,en_SG:-1002};
var curridentifier = '';
var currlang = '';
var xliffAttrVal = [];

var lkupAttrs = [];
lookups = loadLookups.getLookups(storeName);
var attrvallookup = lookups.attrval;
for (var k in lookups.header['EMR'])
{
	if (k !== undefined && k !== '' && lookups.header['EMR'][k].LkupType === 'LOOKUP_TABLE')
	{
		lkupAttrs[lookups.header['EMR'][k].Identifier] = lookups.header['EMR'][k];
	}
}
//console.log(lkupAttrs);

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

function processAttrVal(currAttrValRow)
{
	if (currAttrValRow === undefined || lkupAttrs[currAttrValRow.Identifier] === undefined)
	{
		return;
	}
	if (currAttrValRow !== undefined)
	{
		if (xliffAttrVal[currAttrValRow.ValueIdentifier] === undefined)
		{
			xliffAttrVal[currAttrValRow.ValueIdentifier] = [];
		}
		xliffAttrVal[currAttrValRow.ValueIdentifier].AttributeIdentifier = currAttrValRow.Identifier;
		xliffAttrVal[currAttrValRow.ValueIdentifier].ValueIdentifier = currAttrValRow.ValueIdentifier;
		xliffAttrVal[currAttrValRow.ValueIdentifier].Value = currAttrValRow.Value;
		xliffAttrVal[currAttrValRow.ValueIdentifier].Sequence = currAttrValRow.Sequence;
	}
}

function writeHeader(lookupName)
{
	var lkupFilePath = baseDirectory + '/Emerson' + batchid + '_ACM_' + targetLang + '_Lookup_' + lookupName.replace(/\s/g, '-') + '_MERRILLBRINK.xml';
	console.log("@@@INFO: Lookup Name is : " + lookupName);
	console.log("-------------------------------------------------------------------------------------");
	fsOutputStream = fs.createWriteStream(lkupFilePath, {highWaterMark: Math.pow(2,14)});
	fsOutputStream.write('<?xml version="1.0" ?>'+os.EOL);
	fsOutputStream.write('<translation>'+os.EOL);
	fsOutputStream.write('	<routing>'+os.EOL);
	fsOutputStream.write('		<receiver>MERRILLBRINK</receiver>'+os.EOL);
	fsOutputStream.write('		<sender>ACM</sender>'+os.EOL);
	fsOutputStream.write('	</routing>'+os.EOL);
	fsOutputStream.write('	<batch>'+os.EOL);
	fsOutputStream.write('		<id>Emerson' + batchid + '</id>'+os.EOL);
	fsOutputStream.write('		<client>'+os.EOL);
	fsOutputStream.write('			<company>Emerson</company>'+os.EOL);
	fsOutputStream.write('			<businessPlatform>Corporation</businessPlatform>'+os.EOL);
	fsOutputStream.write('			<quoteApprover name="Quote Approver">' + lookups.tmsapproverlookup[storeName + targetLang].QuoteApproverEmail + '</quoteApprover>'+os.EOL);
	fsOutputStream.write('		</client>'+os.EOL);
	fsOutputStream.write('	</batch>'+os.EOL);
	fsOutputStream.write('	<items>'+os.EOL);
	fsOutputStream.write('		<item location="ACM" docType="xliff" version="1" id="Emerson' + batchid + '">'+os.EOL);
	fsOutputStream.write('			<operationType>Q</operationType>'+os.EOL);
	fsOutputStream.write('			<languages>'+os.EOL);
	fsOutputStream.write('				<language value="' + targetLang.split('_')[1] + '">'+os.EOL);
	fsOutputStream.write('					<variations>'+os.EOL);
	fsOutputStream.write('						<variation>' + targetLang + '</variation>'+os.EOL);
	fsOutputStream.write('					</variations>'+os.EOL);
	fsOutputStream.write('					<linguist name="Linquist Reviewer">' + lookups.tmsapproverlookup[storeName + targetLang].TextApproverEmail + '</linguist>'+os.EOL);
	fsOutputStream.write('				</language>'+os.EOL);
	fsOutputStream.write('			</languages>'+os.EOL);
	fsOutputStream.write('			<payload><![CDATA[<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">'+os.EOL);
	fsOutputStream.write('<file original="ACM native" source-language="en_US" target-language="' + targetLang + '" datatype="html">'+os.EOL);
	fsOutputStream.write('<header></header>'+os.EOL);
	fsOutputStream.write('<body>'+os.EOL);
	fsOutputStream.write('<group id=\'1\' name=\'' + lookupName + '\'>'+os.EOL);
}

var seq = 0;
function writeAttrVal(sourceValue, targetValue, unitId)
{
	var attrMaxWidth = 2000;

	fsOutputStream.write('<trans-unit maxwidth="' + attrMaxWidth + '" id="' + unitId + '">'+os.EOL);
	fsOutputStream.write('<source xml:lang="' + sourceLang + '">' + escape.encodeNonUTF(sourceValue) + '</source>'+os.EOL);
	fsOutputStream.write('<target xml:lang="' + targetLang + '">' + escape.encodeNonUTF(targetValue) + '</target>'+os.EOL);
	fsOutputStream.write('</trans-unit>'+os.EOL);
	
	console.log("@@@INFO: Trans-Unit Id is : " + unitId);
	console.log("@@@INFO: Source Language Attribute value is : " + sourceValue);
	console.log("@@@INFO: Target Language Attribute value is : " + targetValue);
	console.log("\n");
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

function writeLkupAttributes()
{
	var seq = 1;
	for (var attr in lkupAttrs)
	{
		writeHeader(lkupAttrs[attr].LkupTableName);
		for (var attrval in attrvallookup[attr])
		{
			var sourceValue = attrval;
			var targetValue = '';
			if (xliffAttrVal[attrvallookup[attr][attrval].ValueIdentifier] !== undefined)
			{
				targetValue = xliffAttrVal[attrvallookup[attr][attrval].ValueIdentifier].Value;
			}
			var unitId = attrvallookup[attr][attrval].Sequence + '-' + seq;
			writeAttrVal(sourceValue, targetValue, unitId);
		}
		writeFooter();
		seq++;
	}
}

rlAttrVal.on('close',function () {
	writeLkupAttributes();
});

rlAttrVal.on('line',function (line) {
	// ignore header row
	if (line.startsWith('Identifier,') || line.startsWith('AttributeDictionaryAttributeAllowedValues'))
	{
		return;
	}
	
	var currAttrValRow = csv(line, optionsAttrVal);
	processAttrVal(currAttrValRow[0]);
});