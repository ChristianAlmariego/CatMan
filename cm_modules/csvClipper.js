//// setup default properties
var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;

//// fetch params
var inputFile = process.argv[2]; // fullPath
var outputLocation = process.argv[3];
var outputFileName = process.argv[4];

var headersRowCount = parseInt(process.argv[5]);
var columnNamesHeaderRowNum = parseInt(process.argv[6]);
var referenceCodeColumnNum = parseInt(process.argv[7]);
var batchCountLimit = parseInt(process.argv[8]);

var outputWithHeader = process.argv[9];
var singleHeaderOnly = process.argv[10];
var useReferenceCodeAsFileName = process.argv[11];

//// setup extended properties
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var systemProperties = propertiesReader.getSystemProperties();

//// setup cm_modules
var constants = require(cmModulesPath + systemProperties.path().catman.constants);
var genericUtil = require(cmModulesPath + systemProperties.path().catman.genericUtilities);

//// setup node modules
var csv = require(systemProperties.path().node.csvParseSync);
var readline = require(systemProperties.path().node.readLine);
var fs = require(systemProperties.path().node.fileSystem);
var os = require(systemProperties.path().node.operatingSystem);

//// setup params
if (genericUtil.isUndefined(outputWithHeader)) {
	outputWithHeader = true; // default
} else {
	if (outputWithHeader == constants.BOOLEAN_STRING_TRUE) {
		outputWithHeader = true;
	} else {
		outputWithHeader = false;
	}
}

if (genericUtil.isUndefined(singleHeaderOnly)) {
	singleHeaderOnly = false; // default
} else {
	if (singleHeaderOnly == constants.BOOLEAN_STRING_TRUE) {
		singleHeaderOnly = true;
	} else {
		singleHeaderOnly = false;
	}
}

if (genericUtil.isUndefined(useReferenceCodeAsFileName)) {
	useReferenceCodeAsFileName = false; // default
} else {
	if (useReferenceCodeAsFileName == constants.BOOLEAN_STRING_TRUE) {
		useReferenceCodeAsFileName = true;
	} else {
		useReferenceCodeAsFileName = false;
	}
}

// initialize variables
var currentReferenceCodeInProcess = '';
var nextReferenceCodeToProcess = '';
var lineOnHoldToProcess;
var refereceCodeForBatching;
var columnNameHeader;

var fileReadStream;
var fileWriteStream;
var logFileWriteStream;
var lineReader;
var csvOptions;

var recordCount = 0;
var batchCounter = 0;
var batchFileCount = 0;
var tempBatchingFileName;
var isNewBatch = false;
var isForNewBatchFile = false;

var columnNameAsReferenceForBatching;
var headers = [];

//// start process
fileReadStream = fs.createReadStream(inputFile);
lineReader = readline.createInterface({ input: fileReadStream });

// TODO: validation of input args
// start clipping
lineReader.on('line', (line) => {
    var parsedRowData;
    var parsedRowDataToHold;
	var columnsHeaders;

	recordCount++;

	if (recordCount > headersRowCount) {
		parsedRowData = csv(line, csvOptions);

		if (useReferenceCodeAsFileName) {
			refereceCodeForBatching = genericUtil.convertReferenceForFileNaming(parsedRowData[0][columnNameAsReferenceForBatching]);
		}

		if (currentReferenceCodeInProcess == '' && nextReferenceCodeToProcess == '') {
			isNewBatch = true;
		}

		if (isNewBatch) {
			batchFileCount++;

			if (useReferenceCodeAsFileName) {
				tempBatchingFileName = outputFileName + constants.CHAR_HYPHEN + refereceCodeForBatching + '.csv';
			} else {
				tempBatchingFileName = outputFileName + batchFileCount + '.csv';
			}
			
            createOutputCsvFile(outputLocation + tempBatchingFileName, headers);
			isNewBatch = false;
		}
		
		nextReferenceCodeToProcess = parsedRowData[0][columnNameAsReferenceForBatching];

		// check if line data is for a new batch file
		if (isForNewBatchFile) {
			if (!genericUtil.isUndefined(lineOnHoldToProcess)) {
				batchCounter++;
				//write line data
				fileWriteStream.write(lineOnHoldToProcess + os.EOL);
				parsedRowDataToHold = csv(lineOnHoldToProcess, csvOptions);
				currentReferenceCodeInProcess = parsedRowDataToHold[0][columnNameAsReferenceForBatching];
			}
			isForNewBatchFile = false;
		}

		if (nextReferenceCodeToProcess != currentReferenceCodeInProcess) {
			if (batchCounter >= batchCountLimit) {
				isForNewBatchFile = true;
				lineOnHoldToProcess = line;
			} else {
				batchCounter++;
				// write line data
				fileWriteStream.write(line + os.EOL);
				currentReferenceCodeInProcess = nextReferenceCodeToProcess;
			}
		} else {
			// write line data
			fileWriteStream.write(line + os.EOL);
		}

		if (isForNewBatchFile) {
			nextReferenceCodeToProcess = '';
			currentReferenceCodeInProcess = '';
			fileWriteStream.end();
			batchCounter = 0;
		}
	} else {
        // gather headers
        headers.push(line);

        // check for column name header
        if (recordCount == columnNamesHeaderRowNum) {
			columnNameHeader = line;
            columnsHeaders = line.split(",");
            // get column name as reference for batching
            columnNameAsReferenceForBatching = columnsHeaders[referenceCodeColumnNum - 1];
            // setup csv options
            setupCsvOptions(columnsHeaders);
        }
    }
}).on('close', () => {
	if (isForNewBatchFile) {
		batchFileCount++;

		if (useReferenceCodeAsFileName) {
			tempBatchingFileName = outputFileName + constants.CHAR_HYPHEN + refereceCodeForBatching + '.csv';
		} else {
			tempBatchingFileName = outputFileName + batchFileCount + '.csv';
		}
        
        createOutputCsvFile(outputLocation + tempBatchingFileName, headers);

		if (!genericUtil.isUndefined(lineOnHoldToProcess)) {
			fileWriteStream.write(lineOnHoldToProcess + os.EOL);
		}
	}
	
	if (!genericUtil.isUndefined(fileWriteStream)) {
		fileWriteStream.end();
	}
	
	createLogFile();
});

var createLogFile = function() {
	var fileNamePath = outputLocation + outputFileName + '_batching.log'
	logFileWriteStream = fs.createWriteStream(fileNamePath, {highWaterMark: Math.pow(2,14)});
	logFileWriteStream.write('Batch Reference Name:' + outputFileName + os.EOL);
	logFileWriteStream.write('Number of Batches:' + batchFileCount + os.EOL);
	logFileWriteStream.end();
}

var setupCsvOptions = function(headerColumns) {
    csvOptions = {
        delimiter : ',', 
        endLine : '\n', 
        columns : headerColumns, 
        escapeChar : '"',  
        enclosedChar : '"' 
    };
}

var createOutputCsvFile = function(fileNamePath, headers) {
    // create csv file
	fileWriteStream = fs.createWriteStream(fileNamePath, {highWaterMark: Math.pow(2,14)});
	
	// add headers
	if (outputWithHeader) {
		if (singleHeaderOnly) {
			fileWriteStream.write(columnNameHeader + os.EOL);
		} else {
			for (var index in headers) {
				fileWriteStream.write(headers[index] + os.EOL);
			}
		}
	}
}