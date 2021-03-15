//properties
var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;

// setup extended properties
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var systemProperties = propertiesReader.getSystemProperties();

var lookupDirectory = process.env.CATMAN_INTALLATION_FOLDER + systemProperties.path().catman.lookupDirectory;
var sqlScriptsDirectory = process.env.CATMAN_INTALLATION_FOLDER + systemProperties.path().catman.sqlScriptsDirectory;

// fetch params
var request = process.argv[2];

// node modules
var readline = require('readline');
var fs = require('fs');

// initialize variables
var fileWriteStream;
var lineReader;
var recordCount = 0;
var headersRowCount = 1;

if (request == 'deleteSalesCategory'){
	createSqlToDeleteCategory();
}

function createSqlToDeleteCategory(){
	//create csv file
	fileWriteStream = fs.createWriteStream( sqlScriptsDirectory + 'sales-category-deletion.sql', {highWaterMark: Math.pow(2,14)});
	//write 1st line sql statement
	fileWriteStream.write("DELETE FROM CATGROUP WHERE IDENTIFIER IN (");
	//read lookup csv
	fileReadStream = fs.createReadStream(lookupDirectory + 'sales-category-deletion.csv');
	lineReader = readline.createInterface({ input: fileReadStream});
	
	var previousValue = '';
	var currentValue = '';

	lineReader.on('line', function(line) {
	
		recordCount++;

		if(recordCount > headersRowCount){
			currentValue = line;

			if(previousValue !== ''){
				fileWriteStream.write("'" + previousValue + "', ");
			}

			previousValue = currentValue;
		}
	}).on('close', () => {
		fileWriteStream.write("'" + currentValue + "'");
		fileWriteStream.write(");");
		fileWriteStream.end();
	});
}