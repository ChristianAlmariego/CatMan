// setup default properties
var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;

// setup extended properties
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var systemProperties = propertiesReader.getSystemProperties();
var applicationProperties = propertiesReader.getApplicationProperties();

// setup cm_modules
var constants = require(cmModulesPath + systemProperties.path().catman.constants);
var genericUtil = require(cmModulesPath + systemProperties.path().catman.genericUtilities);

/*
 * accepts a catentry partnumber
 * analyze partnumber coding to check for catentry type
 * return catalog entry type
 */
exports.getCatEntryType = function(partNumber) {
    var catEntryType = constants.EMPTY_STRING;

    if (partNumber.indexOf(constants.CATENTRYTYPE_INFIX_PRODUCT) !== -1) {
        catEntryType = constants.CATENTRYTYPE_PRODUCT;
    } else if (partNumber.indexOf(constants.CATENTRYTYPE_INFIX_BUNDLE) !== -1) {
        catEntryType = constants.CATENTRYTYPE_BUNDLE;
    } else if (partNumber.indexOf(constants.CATENTRYTYPE_INFIX_STATICKIT) !== -1) {
        catEntryType = constants.CATENTRYTYPE_STATICKIT;
    } else if (partNumber.indexOf(constants.CATENTRYTYPE_INFIX_DYNAMICKIT) !== -1) {
        catEntryType = constants.CATENTRYTYPE_DYNAMICKIT;
    } else if (partNumber.indexOf(constants.CATENTRYTYPE_INFIX_SKU) !== -1) {
        catEntryType = constants.CATENTRYTYPE_SKU;
    }

    return catEntryType;
}

//TBD: code refactoring: remove this simple function
/*
 * accepts a string form array and a character separator
 * splits the string form array with the character separator
 * returns the array equivalent
 */
exports.splitStringToArray = function(stringFormArray, charSeparator) {
    var stringArray = stringFormArray.split(charSeparator);
    return stringArray;
}
//TBD: end


// accepts collection of data or an object
// checks for string values and remove unacceptable character inputs
// returns the cleaned up data
function removeDataElementsUnacceptableCharacters(rawData) {
    
    // if data is an object
    if (genericUtil.isObject(rawData)) {
        for (var property in rawData) {
            if (rawData.hasOwnProperty(property)) {
                var propertyValue = rawData[property];
                // checks for string
                if (genericUtil.isString(propertyValue)) {
                    propertyValue = removeNewLine(propertyValue);
                    rawData[property] = propertyValue;
                }
            }
        }
    }

    // if data is an array
    if (genericUtil.isArray(rawData)) {
        if (rawData.length > 0){
            for (i = 0; i < rawData.length; i++) {
                var arrayElement = rawData[i];
                // checks for string
                if (genericUtil.isString(arrayElement)) {
                    arrayElement = removeNewLine(arrayElement);
                    rawData[i] = arrayElement;
                }
            }
        }
    }

    return rawData;
}

// removes all new line occurrence from a string
function removeNewLine(inputString) {
    
    // check if the input is a string
    if (genericUtil.isString(inputString)) {
        inputString = inputString.replace(/(\r\n|\n|\r)/gm, "");
    }

    return inputString;
}

// accepts an array of elements (primitive as possible)
// removes invalid elements from the array based on generic rules
// returns the new array
function removeInvalidElements(inputArray) {
    
    // check if the input is an array
    if (genericUtil.isArray(inputArray)) {
        if (inputArray.length > 0){
            for (i = 0; i < inputArray.length; i++) {
                var arrayElement = inputArray[i];
                if (genericUtil.isUndefined(arrayElement) 
                    || genericUtil.isNull(arrayElement) 
                    || genericUtil.isEmptyString(arrayElement)
                    || genericUtil.isTrimmedEmptyString(arrayElement)) {
                    inputArray.splice(i, 1);
                }
            }
        }
    }

    return inputArray;
}

// accepts an array of elements (primitive as possible)
// group the elements into a group limit to return an array of arrays
// returns the new array
function groupElementsIntoArrayOfArrays(inputArray, noOfElementsPerGroup) {
    var arrayOfArrays = [];
    var singleArrayOfElements = [];

    // check if the input is an array
    if (genericUtil.isArray(inputArray)) {
        if (inputArray.length > 0 && noOfElementsPerGroup > 0){
            for (i = 0; i < inputArray.length; i++) {
                var arrayElement = inputArray[i];
                singleArrayOfElements.push(arrayElement);

                if (singleArrayOfElements.length >= noOfElementsPerGroup
                    || ((inputArray.length - 1) == i)) {
                    arrayOfArrays.push(singleArrayOfElements);
                    singleArrayOfElements = [];
                }
            }
        } else {
            // return the inut array as first element of the arrayOfArrays
            arrayOfArrays.push(inputArray);
        }
    }

    return arrayOfArrays;
}




// export helper functions here
exports.removeInvalidElements = removeInvalidElements;
exports.removeNewLine = removeNewLine;
exports.removeDataElementsUnacceptableCharacters = removeDataElementsUnacceptableCharacters;
exports.groupElementsIntoArrayOfArrays = groupElementsIntoArrayOfArrays;


//TBD: code refactoring - write all export functions like below

// retrieves a certain lookup entry by searching for a particular fieldName and its value
exports.getFieldValueLookupEntry = function(value, fieldName, lookup) {
    var lookupEntry;

    if (!genericUtil.isUndefined(lookup)) {
        for (var key in lookup) {
            var eachEntry = lookup[key];
    
            if (value == eachEntry[fieldName]) {
                lookupEntry = eachEntry;
            }
        }
    }
    
    return lookupEntry;
}

//TBD: code refactoring - move this to genericUtilities
// returns default csv option for fs read stream
exports.getDefaultCsvConfig = function() {
    var csvConfig = {
        delimiter : ',',
        endLine : '\n',
        columns : true,
        escapeChar : '"',
        enclosedChar : '"',
        skip_empty_lines : true,
        relax_column_count : true
    }

    return csvConfig;
};

//TBD: code refactoring - move this to genericUtilities
// returns default csv option for fs read stream
//TBD add more as needed
exports.getModifiedCsvConfig = function(columns, escapeChar, enclosedChar) {
    var csvConfig = {
        delimiter : ',',
        endLine : '\n',
        columns : columns,
        escapeChar : escapeChar,
        enclosedChar : enclosedChar,
        skip_empty_lines : true,
        relax_column_count : true
    }

    return csvConfig;
}

// acccepts fs readstream data in default format
// search/formulates for partnumber
// returns partnumber
//TBD: for review - ignore "Code" header for now
exports.getPartNumber = function(dataCode, dataCatEntryType, dataMftrPartNum, dataMftr) {
    var partNumber = constants.EMPTY_STRING;

    if (!genericUtil.isUndefined(dataCatEntryType) 
        && !genericUtil.isUndefined(dataMftrPartNum) 
        && !genericUtil.isUndefined(dataMftr)) {
        dataCatEntryType = dataCatEntryType.trim();
        dataMftrPartNum = dataMftrPartNum.trim();
        dataMftr = dataMftr.trim();
        
        switch (dataCatEntryType) {
            case constants.CATENTRYTYPE_PRODUCT:
                partNumber = dataMftr + constants.CATENTRYTYPE_INFIX_PRODUCT + dataMftrPartNum;
                break;
            case constants.CATENTRYTYPE_SKU:
                partNumber = dataMftr + constants.CATENTRYTYPE_INFIX_SKU + dataMftrPartNum;
                break;
            case constants.CATENTRYTYPE_BUNDLE:
                partNumber = dataMftr + constants.CATENTRYTYPE_INFIX_BUNDLE + dataMftrPartNum;
                break;
            case constants.CATENTRYTYPE_STATICKIT :
                partNumber = dataMftr + constants.CATENTRYTYPE_INFIX_STATICKIT + dataMftrPartNum;
                break;
            case constants.CATENTRYTYPE_DYNAMICKIT :
                partNumber = dataMftr + constants.CATENTRYTYPE_INFIX_DYNAMICKIT + dataMftrPartNum;
                break;
            default :
                partNumber = dataMftr + constants.CATENTRYTYPE_INFIX_UKNOWN + dataMftrPartNum;
        }
    }

    return partNumber;
}

// accepts lookupType
// evaluate equivalent attrType
// returns attrType
exports.getAttrType = function(lookupType) {
    var attrType;

    if (lookupType == constants.LOOKUPREF_LOOKUPTYPE_TABLE 
        || lookupType == constants.LOOKUPREF_LOOKUPTYPE_ENUM) {
        attrType = '1';
    } else if (lookupType == constants.EMPTY_STRING) {
        attrType = '2';
    }

    return attrType;
}

// accepts localeName
// finds the languageId equivalent
// returns languageId
exports.getLanguageId = function(localeName) {
    var languageId;
    var validLocalesMap = this.getValidLocalesMap(constants.LOCALES_MAPREF_LOCALENAME);
    languageId = validLocalesMap[localeName];

    return languageId;
}

// accepts languageId
// finds the localeName equivalent
// returns localeName
exports.getLocaleName = function(languageId) {
    var localeName;
    var validLocalesMap = this.getValidLocalesMap(constants.LOCALES_MAPREF_LANGUAGEID);
    localeName = validLocalesMap[languageId];

    return localeName;
}

// accepts a locale map reference 
// builds a map with the reference param of valid locales
// returns the map
exports.getValidLocalesMap = function(reference) {
    var rawValidLocalesList = applicationProperties.path().catman.validLocales;
    var localesPairArray =  rawValidLocalesList.split(constants.DEFAULT_DELIMITER);
    var validLocalesMap = [];
    
    if (constants.LOCALES_MAPREF_LANGUAGEID == reference) {
        validLocalesMap[constants.DEFAULT_LANGUAGE_ID] = constants.DEFAULT_LOCALE_NAME;
    } else {
        validLocalesMap[constants.DEFAULT_LOCALE_NAME] = constants.DEFAULT_LANGUAGE_ID;
    }

    localesPairArray.forEach(function (eachLocalesPair) {
        var localeDataArray = eachLocalesPair.split(constants.CHAR_COLON);

        if (constants.LOCALES_MAPREF_LANGUAGEID == reference) {
            validLocalesMap[localeDataArray[1]] = localeDataArray[0];
        } else {
            validLocalesMap[localeDataArray[0]] = localeDataArray[1];
        }
    });

    return validLocalesMap;
}

// accepts catman version of fullEMRExport Base field Header
// finds commerce version equivalent
// returns the commerce version
exports.getCommerceVersionFullEMRExportBaseHeader = function(catmanBaseFieldHeader) {
    var commerceFullEMRExportBaseFieldHeader;
    var baseFieldHeadersMap = this.getFullEMRExportBaseFieldHeadersMap(constants.SYSTEM_PLATFORM_CATMAN);
    commerceFullEMRExportBaseFieldHeader = baseFieldHeadersMap[catmanBaseFieldHeader];

    return commerceFullEMRExportBaseFieldHeader;
}

// accepts commerce version of fullEMRExport Base field Header
// finds catman version equivalent
// returns the catman version
exports.getCatmanVersionFullEMRExportBaseHeader = function(commerceBaseFieldHeader) {
    var catmanFullEMRExportBaseFieldHeader;
    var baseFieldHeadersMap = this.getFullEMRExportBaseFieldHeadersMap(constants.SYSTEM_PLATFORM_COMMERCE);
    catmanFullEMRExportBaseFieldHeader = baseFieldHeadersMap[commerceBaseFieldHeader];

    return catmanFullEMRExportBaseFieldHeader;
}

// accepts a fullEMRExport base field header systemPlatform reference 
// builds a map with the reference param of fullEMRExport headers
// returns the map
exports.getFullEMRExportBaseFieldHeadersMap = function(systemPlatform) {
    var rawBaseFieldList = applicationProperties.path().catman.headermap.fullemrexportbasefields;
    var baseFieldsPairArray =  rawBaseFieldList.split(constants.DEFAULT_DELIMITER);
    var baseFieldsHeadersMap = [];

    baseFieldsPairArray.forEach(function (eachHeaderPair) {
        var baseFieldHeaderArray = eachHeaderPair.split(constants.CHAR_COLON);

        if (constants.SYSTEM_PLATFORM_CATMAN == systemPlatform) {
            baseFieldsHeadersMap[baseFieldHeaderArray[0]] = baseFieldHeaderArray[1];
        } else {
            baseFieldsHeadersMap[baseFieldHeaderArray[1]] = baseFieldHeaderArray[0];
        }
    });

    return baseFieldsHeadersMap;
}

// accepts the attribute dictionary lookup
// separates the special and others attributes
// returns separated groups
exports.getFullEMRExportAttributesGroupings = function(attrDictionaryLookup) {
    var attributeGroups = {
        specialAttributes: [],
        additionalSpecialAttributes: [],
        otherAttributes: []
    };

    for (var attrIdentifier in attrDictionaryLookup) {
        var store = attrDictionaryLookup[attrIdentifier].Store;
    
        if (store == constants.STORE_EMR) {
            if (attrIdentifier.includes('CTA') || attrIdentifier.includes('Utility Belt_') 
                || attrIdentifier == 'EMR Features') {
                attributeGroups.specialAttributes.push(attrIdentifier);
            } else if (attrIdentifier.includes('EMR Generic Spec')) {
                attributeGroups.additionalSpecialAttributes.push(attrIdentifier);
            } else {
                attributeGroups.otherAttributes.push(attrIdentifier);
            }
        }
    }
    
    return attributeGroups;
}

// accepts a locale map reference 
// builds a map with the reference param of deprecated locales
// returns the map
exports.getDeprecatedLocalesMap = function(reference) {
    var rawDeprecatedLocalesList = applicationProperties.path().catman.deprecatedLocales;
    var localesPairArray =  rawDeprecatedLocalesList.split(constants.DEFAULT_DELIMITER);
    var deprecatedLocalesMap = [];

    localesPairArray.forEach(function (eachLocalesPair) {
        var localeDataArray = eachLocalesPair.split(constants.CHAR_COLON);

        if (constants.LOCALES_MAPREF_LANGUAGEID == reference) {
            deprecatedLocalesMap[localeDataArray[1]] = localeDataArray[0];
        } else {
            deprecatedLocalesMap[localeDataArray[0]] = localeDataArray[1];
        }
    });

    return deprecatedLocalesMap;
}

// accepts locale and type reference
// checks if it is included in the deprecated locales
// returns a boolean
exports.isDeprecatedLocale = function(locale, reference) {
    var deprecatedLocalesMap;
    var isDeprecated = false;

    if (constants.LOCALES_MAPREF_LANGUAGEID == reference) {
        deprecatedLocalesMap = this.getDeprecatedLocalesMap(constants.LOCALES_MAPREF_LANGUAGEID);
    } else {
        deprecatedLocalesMap = this.getDeprecatedLocalesMap(constants.LOCALES_MAPREF_LOCALENAME);
    }

    if (!genericUtil.isUndefined(deprecatedLocalesMap[locale])) {
        isDeprecated = true;
    }

    return isDeprecated;
}

// accepts catman version of catentrytype
// finds commerce version equivalent
// returns the commerce version
exports.getCommerceVersionCatEntryType = function(catmanCatEntryType) {
    var commerceCatEntryType;
    var catEntryTypeMap = this.getCatEntryTypeMap(constants.SYSTEM_PLATFORM_CATMAN);
    commerceCatEntryType = catEntryTypeMap[catmanCatEntryType];

    return commerceCatEntryType;
}

// accepts commerce version of catentrytype
// finds catman version equivalent
// returns the catman version
exports.getCatmanVersionCatEntryType = function(commerceCatEntryType) {
    var catmanCatEntryType;
    var catEntryTypeMap = this.getCatEntryTypeMap(constants.SYSTEM_PLATFORM_COMMERCE);
    catmanCatEntryType = catEntryTypeMap[commerceCatEntryType];

    return catmanCatEntryType;
}

// accepts system platform reference
// creates a map of catentrytype data with key based on the system platform
// returns the catentrytype map
exports.getCatEntryTypeMap = function(systemPlatform) {
    var rawCatEntryTypeList = applicationProperties.path().catman.catEntryTypes;
    var catEntryTypePairArray = rawCatEntryTypeList.split(constants.DEFAULT_DELIMITER);
    var catEntryTypeMap = [];

    catEntryTypePairArray.forEach(function (eachCatEntryTypePair) {
        var catEntryTypeDataArray = eachCatEntryTypePair.split(constants.CHAR_COLON);

        if (constants.SYSTEM_PLATFORM_CATMAN == systemPlatform) {
            catEntryTypeMap[catEntryTypeDataArray[0]] = catEntryTypeDataArray[1];
        } else {
            catEntryTypeMap[catEntryTypeDataArray[1]] = catEntryTypeDataArray[0];
        }
    });

    return catEntryTypeMap;
}

// accepts catman version of store
// finds commerce version equivalent
// returns the commerce version (storeIdentifiers)
exports.getCommerceVersionStore = function(catmanStore) {
    var commerceStore;
    var storeMap = this.getStoreMap(constants.SYSTEM_PLATFORM_CATMAN);
    commerceStore = storeMap[catmanStore];

    return commerceStore;
}

// accepts commerce version of store
// finds catman version equivalent
// returns the catman version (catman store)
exports.getCatManVersionStore = function(commerceStore) {
    var catmanStore;
    var storeMap = this.getStoreMap(constants.SYSTEM_PLATFORM_COMMERCE);
    catmanStore = storeMap[commerceStore];

    return catmanStore;
}

// accepts system platform reference
// creates a map of stores data with key based on the system platform
// returns the stores map
exports.getStoreMap = function(systemPlatform) {
    var rawStoreList = applicationProperties.path().catman.storeIdentifiers;
    var storePairArray = rawStoreList.split(constants.DEFAULT_DELIMITER);
    var storeMap = [];

    storePairArray.forEach(function (eachStorePair) {
        var storeDataArray = eachStorePair.split(constants.CHAR_COLON);

        if (constants.SYSTEM_PLATFORM_CATMAN == systemPlatform) {
            storeMap[storeDataArray[0]] = storeDataArray[1];
        } else {
            storeMap[storeDataArray[1]] = storeDataArray[0];
        }
    });

    return storeMap;
}

// accepts catman version of manage attr header
// finds commerce version equivalent
// returns the commerce version (catman manage attr header)
exports.getCommerceVersionManageAttrHeader = function(catmanHeader) {
    var commerceMngrAttrHeader;
    var headerMap = this.getAttrManagerHeaderMap(constants.SYSTEM_PLATFORM_CATMAN);
    commerceMngrAttrHeader = headerMap[catmanHeader];

    return commerceMngrAttrHeader;
}

// accepts commerce version of manage attr header
// finds catman version equivalent
// returns the catman version (catman manage attr header)
exports.getCatManVersionManageAttrHeader = function(commerceHeader) {
    var catmanMngrAttrHeader;
    var headerMap = this.getAttrManagerHeaderMap(constants.SYSTEM_PLATFORM_COMMERCE);
    catmanMngrAttrHeader = headerMap[commerceHeader];

    return catmanMngrAttrHeader;
}

// accepts system platform reference
// creates a map of attrmanager header data with key based on the system platform
// returns the dataload header - business catalog header map
exports.getAttrManagerHeaderMap = function(systemPlatform) {
    var rawHeaderList = applicationProperties.path().catman.headermap.manageattr;
    var headerPairArray = rawHeaderList.split(constants.DEFAULT_DELIMITER);
    var headerMap = [];

    headerPairArray.forEach(function (eachHeaderPair) {
        var headerDataArray = eachHeaderPair.split(constants.CHAR_COLON);
        var commerceHeaders = headerDataArray[0].split(constants.CHAR_PIPE);
        var catmanHeaders = headerDataArray[1].split(constants.CHAR_PIPE);

        if (constants.SYSTEM_PLATFORM_CATMAN == systemPlatform) {
            if (catmanHeaders.length > 1) {
                catmanHeaders.forEach(function (eachCatmanHeader) {
                    headerMap[eachCatmanHeader] = commerceHeaders[0];
                });
            } else {
                if (commerceHeaders.length > 1) {
                    headerMap[catmanHeaders[0]] = [];

                    commerceHeaders.forEach(function (eachCommerceHeader) {
                        headerMap[catmanHeaders[0]].push(eachCommerceHeader);
                    });
                } else {
                    headerMap[catmanHeaders[0]] = commerceHeaders[0];
                }
            }
        } else {
            if (commerceHeaders.length > 1) {
                commerceHeaders.forEach(function (eachCommerceHeader) {
                    headerMap[eachCommerceHeader] = catmanHeaders[0];
                });
            } else {
                if (catmanHeaders.length > 1) {
                    headerMap[commerceHeaders[0]] = [];

                    catmanHeaders.forEach(function (eachCatmanHeader) {
                        headerMap[commerceHeaders[0]].push(eachCatmanHeader);
                    });
                } else {
                    headerMap[commerceHeaders[0]] = catmanHeaders[0];
                }
            }
        }
    });

    return headerMap;
}

// accepts an attrvalprefix
// returns value usage (descriptive/defining)
exports.getPrefixValUsage = function(attrValPrefix) {
    var usage = constants.EMPTY_STRING;

    if (attrValPrefix.includes(constants.USAGE_DESCRIPTIVE)) {
        usage = constants.USAGE_DESCRIPTIVE
    }
    if (attrValPrefix.includes(constants.USAGE_DEFINING)) {
        usage = constants.USAGE_DEFINING
    }

    return usage;
}

// accepts an attrvalprefix
// returns value usage (descriptive/defining)
exports.getPrefixValScope = function(attrValPrefix) {
    var scope = constants.EMPTY_STRING;

    if (attrValPrefix.includes(constants.LOOKUPREF_VALSCOPE_CORE)) {
        scope = constants.LOOKUPREF_VALSCOPE_CORE
    }
    if (attrValPrefix.includes(constants.LOOKUPREF_VALSCOPE_EXTENDED)) {
        scope = constants.LOOKUPREF_VALSCOPE_EXTENDED
    }

    return scope;
}

// accepts a certain multival index
// returns decimal equivalent for catman sequencing
exports.getSequencingDecimal = function(index) {
    var sequencingDecimal;
    var catmanSequencingDecimalDigits = 4;

    if (index > 0) {
        var additionalZerosNeeded;

        sequencingDecimal = index.toString();
        additionalZerosNeeded = catmanSequencingDecimalDigits - sequencingDecimal.length;

        for (var i = 0; i < additionalZerosNeeded; i++) {
            sequencingDecimal = "0" + sequencingDecimal;
        }

        sequencingDecimal = constants.CHAR_DOT + sequencingDecimal;
    } else {
        sequencingDecimal = constants.EMPTY_STRING;
    }

    return sequencingDecimal;
}

// accepts a certain multival sequencing decimal
// returns catman sequencing index (opposite of getSequencingDecimal())
exports.getSequencingIndex = function(decimal) {
    var sequencingIndex;
    var catmanSequencingDecimalDigits = 4;

    decimal = decimal.toString().trim();

    if (!genericUtil.isTrimmedEmptyString(decimal)) {
        additionalZerosNeeded = catmanSequencingDecimalDigits - decimal.length;
        sequencingIndex = parseInt(decimal);
        for (var i = 0; i < additionalZerosNeeded; i++) {
            sequencingIndex = sequencingIndex*10;
        }
    } else {
        sequencingIndex = 0;
    }

    return sequencingIndex;
}
