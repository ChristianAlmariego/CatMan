var env = process.argv[2]; // Environment argument
var storeName = process.argv[3]; // Store argument
var translationsPath = 'TMS/CatMan/Processing/';

// setup default properties
var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;

// setup extended properties
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var envProperties = propertiesReader.getEnvironmentProperties(env);
var systemProperties = propertiesReader.getSystemProperties();

var jsonReader = require(envProperties.path().catman.rootDirectory + systemProperties.path().catman.cmModulesDirectory + systemProperties.path().catman.jsonReader);
var jsonObject = jsonReader.getJsonProperties(env, storeName);
var tmsimportDir = jsonObject.baseSharedDirectory + "Translation-WorkingFolder/outbound/catman/";
var tmsprocessDir = jsonObject.baseSharedDirectory + "Translation-WorkingFolder/outbound/catman/processing/";
var errDir = jsonObject.baseSharedDirectory + "Translation-WorkingFolder/error/outbound/catman/";
var archiveDir = jsonObject.baseSharedDirectory + "Translation-WorkingFolder/archive/outbound/catman/";
var baseDirectory = jsonObject.baseSharedDirectory + translationsPath;

//declare all variables before functions
var validLocales = jsonObject.validLocales;//{fr_FR:-2,de_DE:-3,it_IT:-4,es_ES:-5,pt_BR:-6,zh_CN:-7,zh_TW:-8,ko_KR:-9,ja_JP:-10,ru_RU:-20,pl_PL:-22,en_CN:-1000,en_GB:-1001,en_SG:-1002};
var lookups,fsReadStream,csvReadStream,outputStreams;
var catalogFiles = [];
var currtime = new Date();
var batchid = ""+currtime.getFullYear() + ("0"+(currtime.getMonth()+1)).slice(-2) + 
	("0"+currtime.getDate()).slice(-2) + ("0"+currtime.getHours()).slice(-2) + 
	("0"+currtime.getMinutes()).slice(-2) + ("0"+currtime.getSeconds()).slice(-2) + 
	("00"+currtime.getMilliseconds()).slice(-3);

// Load all required packages
var csv = require('csv-parse'),
	csvsync = require('csv-parse/lib/sync'),
    fs = require('fs'),
	os = require('os'),
	loadLookups = require(envProperties.path().catman.rootDirectory + systemProperties.path().catman.cmModulesDirectory + systemProperties.path().catman.loadLookups),
	loadOutputStreams = require(envProperties.path().catman.rootDirectory + systemProperties.path().catman.cmModulesDirectory + systemProperties.path().catman.loadTranslationOutputStreams),
	//recordValidator = require('./cm_modules/recordValidator-emr'),
	recordWriter = require(envProperties.path().catman.rootDirectory + systemProperties.path().catman.cmModulesDirectory + systemProperties.path().catman.recordTranslationWriter);

// csv-parse options for asynchronous reading of the input file.  All of these arguments are optional.
var options = {
    delimiter : ',', // default is , 
    endLine : '\n', // default is \n, 
	columns : true, // default is null
    escapeChar : '"', // default is an empty string 
    enclosedChar : '"' // default is an empty string 
};

function moveFile(file, sourceDir, targetDir){
	fs.rename(sourceDir + '/' + file, targetDir+ '/' + file, function (err) {
		if (err) {
			console.error(err);
			throw err;
		}
	});
}

function writeDataloadControlFile()
{
	var fsWriteStream;
	fsWriteStream = fs.createWriteStream(tmsprocessDir+'tms-publish-control' + batchid + ".txt");
	var startresult = "null|null|null|null|";
	var endresult = "|-1|null";
	fsWriteStream.write(startresult + batchid + endresult + os.EOL);
	fsWriteStream.end();
}

// parse lookup tables synchronously so that all lookup tables are available prior to asynchronous processing of the input csv
lookups = loadLookups.getLookups(storeName);
//console.log(lookups);

//Read source folder and look for input files
var files = fs.readdirSync(baseDirectory);
files.forEach(function (file){
	if(file.startsWith("TMS-catalog-", 0)){
		catalogFiles.push(file);
    }
});

if(catalogFiles.length > 0)
{
	outputStreams = loadOutputStreams.getOutputStreams(tmsprocessDir,batchid,validLocales);
}

catalogFiles.forEach(function (catalogFile){
	fsReadStream = fs.createReadStream(baseDirectory+catalogFile);
	// parse the input csv asynchronously to increase performance and limit memory consumption
	csvReadStream = csv(options);
	fsReadStream.pipe(csvReadStream)
    .on('error',function(err){
        console.error(err);
    })
    .on('data',function(data){
    	//pause the input while we process the row
		fsReadStream.pause();
		//var isvalid = recordValidator.validate(data);
		//if (isvalid)
		//{
			recordWriter.write(data,outputStreams,lookups,validLocales);
		//}
		//resume the input on the next i/o operation
		process.nextTick(function(){
			fsReadStream.resume();
		});
    })
	.on('finish',function(){
		//console.log("got here: " + catalogFile);
		moveFile(catalogFile, baseDirectory, baseDirectory+'../Archive');
		writeDataloadControlFile();
	});
});