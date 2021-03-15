/*
 * After script finishes, the files will be either in the respective ErrorProcessing or Archive directory depending on success/failure
 * 
 * Use this commands to run locally:
 * node cmcatgroup.js <env> <store>	<transformtype>		--> env : local/dev/stage/prod,  store: emr/fan/proteam/wsv/master/climate/ise/sensi, transformtype: category/literature
 */

//declare all variables before functions
var fsReadStream,csvReadStream,outputStreams;

// Load all required packages
var csv = require('csv-parse'),
	csvsync = require('csv-parse/lib/sync'),
    fs = require('fs'),
	loadOutputStreams = require('./cm_modules/loadOutputStreamsCatGroup'),	
	recordWriter = require('./cm_modules/recordWriterCatGroup');
var jsonReader = require("./cm_modules/jsonReader");
var loadLookups = require('./cm_modules/loadLookups');

// Get arguments
var env = process.argv[2]; // Environment argument, local, dev, stage, prod
var storeName = process.argv[3]; // Store argument, emr, fan, proteam, wsv, master, climate, ise, sensi
var transformType = process.argv[4]; // Transform type argument, category, literature
var buildtag = ''; // **optional** buildtag
if (process.argv[5] !== undefined)
{
	buildtag = process.argv[5] + '-';
}
checkArguments(); // Validate arguments

var jsonObject = jsonReader.getJsonProperties(env, storeName);
if (transformType === "category") {
	var inputFile = jsonObject.lookupFolder + jsonObject.masterSalesCategoryFile;
} else if (transformType === "literature") {
	var inputFile = jsonObject.lookupFolder + jsonObject.literatureCategoryFile;
}
var storeID = jsonObject.storeID;
var outputDirectory = jsonObject.dataloadDirectory + jsonObject.outputPath;
console.log("Output Directory: " + outputDirectory);

//Parse lookup tables synchronously so that all lookup tables are available prior to asynchronous processing of the input csv
lookups = loadLookups.getLookups();
// do not load facetable attributes for master categories
if (storeName !== "master") {
//prep the facetable attributes for the given store in order to avoid multiple loops later on
lookups.facetableAttributes = getFacetableAttributes(lookups);
}

//csv-parse options for asynchronous reading of the input file.  All of these arguments are optional.
var options = {
 delimiter : ',', // default is , 
 endLine : '\n', // default is \n, 
	columns : true, // default is null
 escapeChar : '"', // default is an empty string 
 enclosedChar : '"' // default is an empty string 
};

var currtime = new Date();
var batchid = buildtag+currtime.getFullYear() + ("0"+(currtime.getMonth()+1)).slice(-2) + 
("0"+currtime.getDate()).slice(-2) + ("0"+currtime.getHours()).slice(-2) + 
("0"+currtime.getMinutes()).slice(-2) + ("0"+currtime.getSeconds()).slice(-2) + 
("00"+currtime.getMilliseconds()).slice(-3);

// parse the input csv asynchronously to increase performance and limit memory consumption
csvReadStream = csv(options);

outputStreams = loadOutputStreams.getOutputStreams(outputDirectory,batchid);

fsReadStream = fs.createReadStream(__dirname+inputFile);
fsReadStream.pipe(csvReadStream)
    .on('error',function(err){
        console.error(err);
    })
    .on('data',function(data){
    	//pause the input while we process the row
		fsReadStream.pause();	
		if ('TRUE' === data['Master Catalog'] && storeName === "master") 
		{
			recordWriter.write(data,outputStreams,storeID,lookups,storeName);
		}
		else if ('TRUE' !== data['Master Catalog']) 
			{
				if (data['STORE'].toUpperCase() === storeName.toUpperCase())
				{
					recordWriter.write(data,outputStreams,storeID,lookups,storeName);
				}
			}
		//resume the input on the next i/o operation
		process.nextTick(function(){
			fsReadStream.resume();
		});
    });



function checkArguments(){
	var envs = ['local','dev','stage','prod'];
	var stores = ['emr','fan','proteam','wsv','master','climate','ise','sensi','test'];
	var runtype = ['category','literature'];
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
	if(transformType === undefined){
		transformType = "category";
		console.log('Please provide transform type argument. Allowed values are : ' + runtype);
		process.exit(1);
	}else if(runtype.indexOf(transformType) < 0){
		console.log('Please provide valid transform type argument. Allowed values are : ' + runtype);
		process.exit(1); 
	}
}

//prep the list of facetable attributes in the attribute dictionary in order to avoid multiple loops later on
function getFacetableAttributes(lookups) {
	var facetableAttrs = [];
	var strName;
	
	//use proper value for multi-store
	switch (storeName) {
	case 'emr':
		strName = storeName.toUpperCase();
		break;
	case 'fan':
		strName = storeName.toUpperCase();
		break;
	case 'proteam':
		strName = 'ProTeam';
		break;
	case 'wsv':
		strName = storeName.toUpperCase();
		break;
	case 'climate':
		strName = 'EMR';
		break;
	case 'ise':
		strName = 'EMR';
		break;
	case 'sensi':
		strName = 'EMR';
	case 'test':
		strName = 'EMR';
	}
	
	var headers = lookups.header[strName]; //clone the array so that the original is not modified
	var headerNames = Object.keys(headers);
	
	var headerDetails;
	for (var k = 0; k < headerNames.length; k++) {
		headerDetails = headers[headerNames[k]];
		//console.log('headerDetails=' + headerDetails['Facetable'] + ' = ' + headerDetails['Identifier']);
		
		if (headerDetails['Facetable'] === 'TRUE') {
			facetableAttrs.push(headerDetails['Identifier']);
			//console.log('added ' + headerDetails['Identifier']);
		}
	}
	//console.log('facetableAttrs=' + facetableAttrs.length + '*' + headerNames.length);

	return facetableAttrs;
}