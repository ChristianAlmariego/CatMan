// setup default properties
var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;

// setup extended properties
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var systemProperties = propertiesReader.getSystemProperties();

// setup cm_modules
var constants = require(cmModulesPath + systemProperties.path().catman.constants);

// setup node modules
var fs = require(systemProperties.path().node.fileSystem);
var os = require(systemProperties.path().node.operatingSystem);

// returns if a value is an object
function isObject (value) {
    return value && typeof value === 'object' && value.constructor === Object;
}

// returns if a value is empty string after being trimmed
function isTrimmedEmptyString(value) {
    if (isString(value)) {
        return value.trim() === '';
    } else {
        return false;
    }
}

// returns if a value is a string
function isString (value) {
    return typeof value === 'string' || value instanceof String;
}

// returns if a value is empty string
function isEmptyString(value) {
    return value === '';
}

// returns if a value is null
function isNull(value) {
    return value === null;
}
    
// returns if a value is undefined
function isUndefined(value) {
    return value === undefined;
}

// returns if a value is an array
function isArray (value) {
    return value && typeof value === 'object' && value.constructor === Array;
}

// return length of character byte
function getCharByteCount(string) {
    var utf8length = 0;
    if (!isUndefined(string)){
        for (var n = 0; n < string.length; n++) {
            var charCode = string.charCodeAt(n);
            if (charCode < 128) {
                utf8length++;
            }
            else if((charCode > 127) && (charCode < 2048)) {
                utf8length = utf8length+2;
            }
            else {
                utf8length = utf8length+3;
            }
        }
    }
    return utf8length;
}

// returns if an array is empty
function isEmptyArray(array) {
    var isEmptyArray = false;

    if (isArray(array)) {
        if (array.length == 0) {
            isEmptyArray = true;
        }
    }
    return isEmptyArray;
}

// returns if an array is not empty
function isNotEmptyArray(array) {
    var isNotEmptyArray = false;

    if (isArray(array)) {
        if (array.length > 0) {
            isNotEmptyArray = true;
        }
    }
    return isNotEmptyArray;
}

// ends fs node module resource
function endFsNodeResource(fsResource) {
    if (isUndefined(fsResource)) {
        fsResource.end();
    }
}

// export util functions here
exports.isEmptyString = isEmptyString;
exports.isNull = isNull;
exports.isUndefined = isUndefined;
exports.isString = isString;
exports.isTrimmedEmptyString = isTrimmedEmptyString;
exports.isObject = isObject;
exports.isArray = isArray;
exports.getCharByteCount = getCharByteCount;
exports.isEmptyArray = isEmptyArray;
exports.isNotEmptyArray = isNotEmptyArray;
exports.endFsNodeResource = endFsNodeResource;

//TBD: code refactoring - write all export functions like below

// check if an input file is alphanumeric
exports.isAlphanumeric = function(string) {
    var specialCharsPattern = new RegExp(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/);
    var isAlphanumeric = false;

    if (!specialCharsPattern.test(string)) {
        isAlphanumeric = true;
    }

    return isAlphanumeric;
}

// trims an input with undefined object handling
exports.getTrimmed = function(string) {
    var trimmedObject;

    if (!this.isUndefined(string)) {
        trimmedObject = string.trim();
    }

    return trimmedObject;
}

// replaces all invalid characters from a certain reference string with '_'
exports.convertReferenceForFileNaming = function(referenceString) {
    var invalidCharsForFilenaming = [
        constants.CHAR_BACKSLASH,
        constants.CHAR_SLASH,
        constants.CHAR_COLON,
        constants.CHAR_ASTERISK,
        constants.CHAR_QUESTIONMARK,
        constants.CHAR_QUOTE,
        constants.CHAR_ISLESSER,
        constants.CHAR_ISGREATER,
        constants.CHAR_PIPE
    ];

    invalidCharsForFilenaming.forEach(function (eachChar) {
        if (referenceString.includes(eachChar)) {
            referenceString = referenceString.split(eachChar).join(constants.DEFAULT_ID_SEPARATOR);
        }
    });

    return referenceString;
};

// transform a certain string input for csv cell population following excel rules
//TBD: for enhancement - for now this only deals with commas (,) - should also deal with quotes (") 
exports.formatAsCsvCellEntry = function(string) {
    var formattedString;

    if (string.includes(constants.DEFAULT_DELIMITER)) {
        if (string.includes(constants.CHAR_QUOTE)) {
            string = string.split(constants.CHAR_QUOTE).join(constants.CHAR_QUOTE + constants.CHAR_QUOTE);
        }
        formattedString = constants.CHAR_QUOTE + string + constants.CHAR_QUOTE;
    } else if (string.includes(constants.CHAR_QUOTE)) {
        string = string.split(constants.CHAR_QUOTE).join(constants.CHAR_QUOTE + constants.CHAR_QUOTE);
        formattedString = constants.CHAR_QUOTE + string + constants.CHAR_QUOTE;
    } else {
        formattedString =  string;
    }

    return formattedString;
}

//// reusable node stream functions
exports.getCurrentDateStamp = function() {
    var currentDate = new Date();
    var dateStamp = currentDate.getDate() + currentDate.toLocaleString('en-us', { month: "short" }) + currentDate.getFullYear();

    return dateStamp;
}

// get default csv options
exports.getDefaultCsvOptions = function() {
    var csvOptions = {
        delimiter : ',', // default is ,
        endLine : '\n', // default is \n,
        columns : true, // default is null
        escapeChar : '"', // default is an empty string
        enclosedChar : '"', // default is an empty string
        skip_empty_lines : true, //default is false
        relax_column_count : true
    }
    
    return csvOptions;
}

// get default write options
exports.getDefaultWriteOptions = function() {
    var writeOptions = {
	    delimiter : ',', // default is ,
	    endLine : '\n', // default is \n,
		columns : false, // default is null
	    escapeChar : '"', // default is an empty string
	    enclosedChar : '"' // default is an empty string
    }
    
    return writeOptions;
}

// copy file by using fsResource
exports.copyFile = function(fileName, fsResource, sourceDirectory, destinationDirectory) {
    fsResource.copyFileSync(sourceDirectory + fileName, destinationDirectory + fileName);
}

// move file by using fsResource
exports.moveFile = function(fileName, fsResource, sourceDirectory, destinationDirectory) {
    fsResource.renameSync(sourceDirectory + fileName, destinationDirectory + fileName);
}

// rename file by using fsResource
exports.renameFile = function(oldFileName, newFileName, fsResource, fileLocation) {
    fsResource.renameSync(fileLocation + oldFileName, fileLocation + newFileName);
}

// create write file stream with default settings
exports.createWriteFileStream = function(filePath) {
    var writeFileStream = fs.createWriteStream(filePath, {highWaterMark: Math.pow(2,14)});

    return writeFileStream;
}

// write to report file default format (single message)
exports.writeReportFileLine = function(reportWriteFileStream, reportLine) {
    var currentDate = new Date();
    var currentMonthDay = currentDate.getDate() + constants.CHAR_HYPHEN 
        + currentDate.toLocaleString('en-us', { month: "short" });
    var currentHour = currentDate.getHours();
    var currentHourTwelveHourFormat;
    var currenDayPortion;
	var currentTimeStamp;

	if (currentHour > 12) {
        currentHourTwelveHourFormat = currentHour - 12;
        currenDayPortion = 'PM';
    } else {
        currentHourTwelveHourFormat = currentHour;
        currenDayPortion = 'AM';
    }

    currentTimeStamp = currentDate.getFullYear() + constants.CHAR_SPACE + currentHourTwelveHourFormat 
        + constants.CHAR_COLON + currentDate.getMinutes() + constants.CHAR_COLON 
        + currentDate.getSeconds() + constants.CHAR_SPACE  + currenDayPortion;

    reportWriteFileStream.write(currentMonthDay + constants.DEFAULT_DELIMITER + currentTimeStamp 
        + constants.CHAR_SPACE + reportLine + os.EOL);
}

// write to report file default format (multiple messages)
exports.writeReportMessages = function(reportWriteFileStream, messageArray) {
    var self = this;
    messageArray.forEach(function (eachMessage) {
        self.writeReportFileLine(reportWriteFileStream, eachMessage);
    });
}
