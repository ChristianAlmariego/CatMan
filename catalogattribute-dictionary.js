// Get arguments
var env = process.argv[2]; // Environment argument
var storeName = process.argv[3]; // Store argument
var reportName = process.argv[4]; // report name

var buildtag = ''; // **optional** buildtag
var checkerPrefix = 'CHECKER';
if (process.argv[5] !== undefined)
{
	buildtag = process.argv[5] + '-';
}


console.log('Processing ' +  storeName + ' Store');

checkArguments(); // Validate arguments
var jsonReader = require("./cm_modules/jsonReader");
var jsonObject = jsonReader.getJsonProperties(env, storeName);


console.log('Processing Automated Attribute Dictionary Documentation');

var lookups, outputStreams;
var loadLookups = require('./cm_modules/loadLookups');
var jsonReader = require("./cm_modules/jsonReader");

var csv = require('csv-parse');
var csvsync = require('csv-parse/lib/sync');
var fs = require('fs');
var loadLookups = require('./cm_modules/loadLookups');
var stringify = require('csv-stringify');
var mailer = require('./cm_modules/email');
var loadOutputStreams = require('./cm_modules/loadOutputStreamsAttributeDictionary');
var recordWriter = require('./cm_modules/recordWriterAttributeDictionary');



console.log('Load Lookups & Set outputstreams');
//Parse lookup tables synchronously so that all lookup tables are available prior to asynchronous processing of the input csv
lookups = loadLookups.getLookups();


console.log('Categories Folder Path: '+jsonObject.attributeDictionary_Categories);
console.log('Attributes Folder Path: '+jsonObject.attributeDictionary_Attribute);

console.log('Processing Report' +  reportName);


if(reportName === 'attribute'){
	outputStreams = loadOutputStreams.getOutputStreams(jsonObject, 'attribute');
	
try{
	//-- ATTRDICT ATTR
	var attrdictattr_dict = [];
	for(var i=0; i<lookups.total_attrdictattr_dict; i++ ){
			
			attrdictattr_dict['Identifier'] = lookups.attrdictattr_dict['Identifier_'+i];
			attrdictattr_dict['Sequence'] = lookups.attrdictattr_dict['Sequence_'+i];
			attrdictattr_dict['Displayable'] = lookups.attrdictattr_dict['Displayable_'+i];
			attrdictattr_dict['Searchable'] = lookups.attrdictattr_dict['Searchable_'+i];
			attrdictattr_dict['Comparable'] = lookups.attrdictattr_dict['Comparable_'+i];
			attrdictattr_dict['Facetable'] = lookups.attrdictattr_dict['Facetable_'+i];
			attrdictattr_dict['Merchandisable'] = lookups.attrdictattr_dict['Merchandisable_'+i];
			attrdictattr_dict['Name'] = lookups.attrdictattr_dict['Name_'+i];
			attrdictattr_dict['HeaderName'] = lookups.attrdictattr_dict['HeaderName_'+i];
			attrdictattr_dict['MultiLang'] = lookups.attrdictattr_dict['MultiLang_'+i];
			attrdictattr_dict['MaxOccurrence'] = lookups.attrdictattr_dict['MaxOccurrence_'+i];
			attrdictattr_dict['MinOcurrences'] = lookups.attrdictattr_dict['MinOcurrences_'+i];
			attrdictattr_dict['MaxLength'] = lookups.attrdictattr_dict['MaxLength_'+i];
			attrdictattr_dict['Datatype'] = lookups.attrdictattr_dict['Datatype_'+i];
			attrdictattr_dict['Defining'] = lookups.attrdictattr_dict['Defining_'+i];
			attrdictattr_dict['Attribute Type'] = lookups.attrdictattr_dict['Attribute Type_'+i];
			attrdictattr_dict['FacetableMultiSelect'] = lookups.attrdictattr_dict['FacetableMultiSelect_'+i];
			recordWriter.write('attrdictattr',attrdictattr_dict, outputStreams);
	}

console.log('AttrDictAttr - Successfully Created');

}catch(ex){
	console.log('AttrDictAttr Error: '+ex.toString());
}


//-- ATTRDICTATTRVAL 
try{
	var attrvallookup = [];
	for(var i=0; i<lookups.total_attrvallookup_dict; i++ ){
			attrvallookup['Attribute'] = lookups.attrvallookup_dict['Identifier_'+i];
			attrvallookup['Sequence'] = lookups.attrvallookup_dict['Sequence_'+i];
			attrvallookup['Value'] = lookups.attrvallookup_dict['Value_'+i];
			recordWriter.write('attrdictattrval',attrvallookup, outputStreams);
	}
		 console.log('AttrDictAttrVal- Successfully Created');
 
}catch(ex){
		console.log('AttrDictAttrVal Error: '+ex.toString());
}


//=========== CTA LOOKUP =========
try{
  var ctalookup = [];
  for (var key in lookups.ctalookup)
  {
		if (key !== undefined && key !== '')
		{
			ctalookup['key'] = key;
			ctalookup['value'] =lookups.ctalookup[key];
			recordWriter.write('ctalookup',ctalookup, outputStreams);
		}
  }
  	console.log('Control CTA Lookup - Successfully Created');

}
catch(ex){
	console.log('Control CTA Lookup Error: '+ex.toString());
}


//=========== Utility Belt LOOKUP =========
try{

var utilitybeltlookup = [];
	for (var key in lookups.utilitybeltlookup)
	{
		if (key !== undefined && key !== '')
		{
			utilitybeltlookup['key'] = key;
			utilitybeltlookup['value'] =lookups.utilitybeltlookup[key];
		   	recordWriter.write('utilitybelts',utilitybeltlookup, outputStreams);
		}
	}
   		 console.log('Control Utility Belts Lookup - Successfully Created');
}catch(ex){
		console.log('Control Utility Belts Lookup Error: '+ex.toString());z
}


try{
	var inputfielddef_dict = [];
	for(var i=0; i<lookups.total_inputfielddef_dict; i++ ){
			inputfielddef_dict['Identifier'] = lookups.inputfielddef_dict['Identifier_'+i];
			inputfielddef_dict['Sequence'] = lookups.inputfielddef_dict['Sequence_'+i];
			inputfielddef_dict['Displayable'] = lookups.inputfielddef_dict['Displayable_'+i];
			inputfielddef_dict['Searchable'] = lookups.inputfielddef_dict['Searchable_'+i];
			inputfielddef_dict['Comparable'] = lookups.inputfielddef_dict['Comparable_'+i];
			inputfielddef_dict['Facetable'] = lookups.inputfielddef_dict['Facetable_'+i];
			inputfielddef_dict['Merchandisable'] = lookups.inputfielddef_dict['Merchandisable_'+i];
			inputfielddef_dict['Name'] = lookups.inputfielddef_dict['Name_'+i];
			inputfielddef_dict['HeaderName'] = lookups.inputfielddef_dict['HeaderName_'+i];
			inputfielddef_dict['MultiLang'] = lookups.inputfielddef_dict['MultiLang_'+i];
			inputfielddef_dict['MaxOccurrence'] = lookups.inputfielddef_dict['MaxOccurrence_'+i];
			inputfielddef_dict['MinOcurrences'] = lookups.inputfielddef_dict['MinOcurrences_'+i];
			inputfielddef_dict['MaxLength'] = lookups.inputfielddef_dict['MaxLength_'+i];
			inputfielddef_dict['Datatype'] = lookups.inputfielddef_dict['Datatype_'+i];
			inputfielddef_dict['Defining'] = lookups.inputfielddef_dict['Defining_'+i];
			inputfielddef_dict['Attribute Type'] = lookups.inputfielddef_dict['Attribute Type_'+i];
			inputfielddef_dict['FacetableMultiSelect'] = lookups.inputfielddef_dict['FacetableMultiSelect_'+i];
			recordWriter.write('attrdictattr',inputfielddef_dict, outputStreams);
	}

	console.log('Input Field Definition  - Successfully Created');
}catch(ex){
	console.log('Input Field Definition Error: '+ex.toString());
}


}else if(reportName === 'category'){
		outputStreams = loadOutputStreams.getOutputStreams(jsonObject, 'category');
	//=========== Master Sales Category =========
	try{
		var salescatcategorylookup = [];
		for(var i=0; i<lookups.total_salescatcategorylookup_dict; i++ ){
				salescatcategorylookup['Master Catalog'] = lookups.salescatcategorylookup_dict['Master Catalog_'+i];
				salescatcategorylookup['Identifier'] = lookups.salescatcategorylookup_dict['Identifier_'+i];
				salescatcategorylookup['Parent Identifier'] = lookups.salescatcategorylookup_dict['Parent Identifier_'+i];
				salescatcategorylookup['Name US'] = lookups.salescatcategorylookup_dict['Name US_'+i];
				salescatcategorylookup['URLkeyword'] = lookups.salescatcategorylookup_dict['URL keyword_'+i];
				salescatcategorylookup['Page title'] = lookups.salescatcategorylookup_dict['Page title_'+i];
				salescatcategorylookup['Meta description'] = lookups.salescatcategorylookup_dict['Meta description_'+i];
				salescatcategorylookup['Facet Management'] = lookups.salescatcategorylookup_dict['Facet Management_'+i];
				salescatcategorylookup['STORE'] = lookups.salescatcategorylookup_dict['STORE_'+i];
				salescatcategorylookup['Short Description'] = lookups.salescatcategorylookup_dict['Short Description_'+i];
				salescatcategorylookup['Published'] = lookups.salescatcategorylookup_dict['Published_'+i];
				recordWriter.write('mastersalescategory',salescatcategorylookup, outputStreams);
		}
			console.log('Master Sales Category- Successfully Created');
	}catch(ex){
			console.log('Master Sales Category Error: '+ex.toString());
	} 

}



function checkArguments(){
	var envs = ['local','dev','stage','prod'];
	var stores = ['emr','fan','proteam','wsv','literature','emr-old'];
	var report = ['category','attribute'];
	if(env === undefined){
		env = "local";
		console.log('Please provide environment argument. Allowed values are : ' + envs);
		process.exit(1);
	}else if(envs.indexOf(env) < 0){
		console.log('Please provide valid environment argument. Allowed values are : ' + envs);
		process.exit(1);
	}
	if(storeName === undefined){
		storeName = "emr";
		console.log('Please provide store argument. Allowed values are : ' + stores);
		process.exit(1);
	}else if(stores.indexOf(storeName) < 0){
		console.log('Please provide valid store argument. Allowed values are : ' + stores);
		process.exit(1);
	}

	if(reportName === undefined){
		reportName = "category";
		console.log('Please provide report type argument. Allowed values are : ' + report);
		process.exit(1);
	}else if(report.indexOf(reportName) < 0){
		console.log('Please provide valid report type argument. Allowed values are : ' + report);
		process.exit(1);
	}


}