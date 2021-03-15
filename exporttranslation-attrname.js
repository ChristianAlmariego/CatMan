var env = process.argv[2]; // Environment argument
var storeName = "emr"; // Store argument
var lookups;
var langId = process.argv[3]; // language id argument

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
var optionsAttr = {
    delimiter : ',', // default is , 
    endLine : '\n', // default is \n, 
	columns : ['Identifier','Type','AttributeType','Sequence','Displayable','Searchable','Comparable','Facetable','STOREDISPLAY','Merchandisable','AttributeField1','AttributeField2','AttributeField3','LanguageId','Name','Description','SecondaryDescription','AssociatedKeyword','Field1','Footnote','UnitOfMeasure'], // default is null
    escapeChar : '"', // default is an empty string 
    enclosedChar : '"' // default is an empty string 
};

var rlAttr = readline.createInterface({
	input: fs.createReadStream(jsonObject.baseSharedDirectory+'TMS/CatMan/ExtractForXLIFF/attrnameattrdictattr-output.csv')
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
var xliffAttr = [];
var lkupAttrs = [];
lookups = loadLookups.getLookups(storeName);
lkupAttrs.EMR_Core_Attributes = [];
lkupAttrs.EMR_Extended_Attributes = [];
for (var k in lookups.header['EMR'])
{
	if (k !== undefined && (k.startsWith('EMR Certification Badge') || k.startsWith('EMR Export Status') ||
			k.startsWith('EMR Generic Spec') || k.startsWith('EMR Product Family') || k.startsWith('EMR TabSequence')))
	{
		continue;
	}
	if (k !== undefined && k !== '' && lookups.header['EMR'][k].Displayable === 'TRUE' && lookups.header['EMR'][k].AttrValPrefix === 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes')
	{
		lkupAttrs.EMR_Core_Attributes[lookups.header['EMR'][k].Identifier] = lookups.header['EMR'][k];
	}
	if (k !== undefined && k !== '' && lookups.header['EMR'][k].Displayable === 'TRUE' && lookups.header['EMR'][k].AttrValPrefix === 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Extended_Attributes')
	{
		lkupAttrs.EMR_Extended_Attributes[lookups.header['EMR'][k].Identifier] = lookups.header['EMR'][k];
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

function processAttr(currAttrRow)
{
	if (currAttrRow === undefined || !(lkupAttrs.EMR_Core_Attributes[currAttrRow.Identifier] !== undefined || lkupAttrs.EMR_Extended_Attributes[currAttrRow.Identifier] !== undefined))
	{
		return;
	}
	if (xliffAttr[currAttrRow.Identifier] === undefined)
	{
		xliffAttr[currAttrRow.Identifier] = [];
	}
	xliffAttr[currAttrRow.Identifier].Identifier = currAttrRow.Identifier;
	xliffAttr[currAttrRow.Identifier].Name = currAttrRow.Name;
}

function writeHeader(attrGroupName)
{
	var attrFilePath = baseDirectory + '/Emerson' + batchid + attrGroupName + '_' + targetLang + '_ACM_Attr_Names_MERRILLBRINK.xml';
	console.log("@@@INFO: Attribute Group Name is : " + attrGroupName);
	console.log("--------------------------------------------------------------------------")
	fsOutputStream = fs.createWriteStream(attrFilePath, {highWaterMark: Math.pow(2,14)});
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
	fsOutputStream.write('<group id=\'1\' name=\'' + attrGroupName + '\'>'+os.EOL);
}

var seq = 0;
function writeAttrVal(sourceValue, targetValue, unitId)
{
	var attrMaxWidth = 254;

	fsOutputStream.write('<trans-unit maxwidth="' + attrMaxWidth + '" id="' + escape.encodeNonUTF(unitId) + '" name="' + '' + targetLang + '_display_name">'+os.EOL);
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
	fsOutputStream.write('</file>'+os.EOL);
	fsOutputStream.write('</xliff>]]></payload>'+os.EOL);
	fsOutputStream.write('		</item>'+os.EOL);
	fsOutputStream.write('	</items>'+os.EOL);
	fsOutputStream.write('</translation>'+os.EOL);
	fsOutputStream.end();
}

function writeAttributes()
{
	var seq = 1;
	writeHeader('EMR_Core_Attributes');
	for (var attr in lkupAttrs.EMR_Core_Attributes)
	{
		//console.log(attr);
		var sourceValue = lkupAttrs.EMR_Core_Attributes[attr].Name;
		var targetValue = '';
		
		console.log("@@@INFO: EMR Core Attribute value is : " + attr);
		
		if (xliffAttr[attr] !== undefined)
		{
			targetValue = xliffAttr[attr].Name;
		}
		var unitId = attr;
		writeAttrVal(sourceValue, targetValue, unitId);
		seq++;
	}
	writeFooter();
	seq = 1;
	writeHeader('EMR_Extended_Attributes');
	for (var attr in lkupAttrs.EMR_Extended_Attributes)
	{
		var sourceValue = lkupAttrs.EMR_Extended_Attributes[attr].Name;
		var targetValue = '';
		
		console.log("@@@INFO: EMR Extended Attribute value is : " + attr);
		
		if (xliffAttr[attr] !== undefined)
		{
			targetValue = xliffAttr[attr].Name;
		}
		var unitId = attr;
		writeAttrVal(sourceValue, targetValue, unitId);
		seq++;
	}
	writeFooter();
}

rlAttr.on('close',function () {
	writeAttributes();
});

rlAttr.on('line',function (line) {
	// ignore header row
	if (line.startsWith('Identifier,') || line.startsWith('AttributeDictionaryAttributeAndAllowedValues'))
	{
		return;
	}
	
	var currAttrValRow = csv(line, optionsAttr);
	processAttr(currAttrValRow[0]);
});