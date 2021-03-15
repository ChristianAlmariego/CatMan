var env = process.argv[2]; // Environment argument
var storeName = process.argv[3]; // Store argument
var lookups;

//setup node modules
var csv = require('csv-parse/lib/sync');
var fs = require('fs');
var os = require('os');

//setup default properties
require('dotenv').config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;

// setup extended properties
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var envProperties = propertiesReader.getEnvironmentProperties(env);
var systemProperties = propertiesReader.getSystemProperties();

// setup cm_modules
var jsonReader = require(envProperties.path().catman.rootDirectory + systemProperties.path().catman.cmModulesDirectory + systemProperties.path().catman.jsonReader);

var jsonObject = jsonReader.getJsonProperties(env, storeName);
var csvData = csv(fs.readFileSync('./lookup_csv/mastersalescategory_lookup.csv').toString(), {delimiter: ',', columns: true});
var masterCatalogPath = ' ["'+csvData[0].Identifier+'"';
for (i = 1; i < csvData.length; i++)
{
	masterCatalogPath += ', "'+csvData[i].Identifier+'"';
}
masterCatalogPath += ']';
csvData = csv(fs.readFileSync('./lookup_csv/mastercatalogPartNumber.csv').toString(), {delimiter: ',', columns: null});
var code = ' ["'+csvData[0][0]+'"';
for (i = 1; i < csvData.length; i++)
{
	code += ', "'+csvData[i][0]+'"';
}
code += ']';
code = code.replace(/\\/g, "\\\\");
masterCatalogPath = masterCatalogPath.replace(/\\/g, "\\\\");
var fsWriteStream = fs.createWriteStream(jsonObject.baseSharedDirectory + "CatMan/Export/CSVGenerator/CSVDATA.js");
fsWriteStream.write('var masterElements =' + masterCatalogPath + ';' + os.EOL);
fsWriteStream.write('var codeElements =' + code + ';' + os.EOL);
fsWriteStream.end();