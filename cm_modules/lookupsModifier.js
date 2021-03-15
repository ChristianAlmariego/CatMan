//// setup default properties
var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;

//// setup extended properties
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var systemProperties = propertiesReader.getSystemProperties();
var applicationProperties = propertiesReader.getApplicationProperties();
var environmentProperties;

//// setup cm_modules
var constants = require(cmModulesPath + systemProperties.path().catman.constants);
var genericUtil = require(cmModulesPath + systemProperties.path().catman.genericUtilities);
var dataHelper = require(cmModulesPath + systemProperties.path().catman.dataHelper);

//// setup node modules
var fs = require(systemProperties.path().node.fileSystem);
var csvsync = require(systemProperties.path().node.csvParseSync);

//// initialize variables

//// methods

// converts any attr update (settings change or addition) into a lookupentry object
function convertAttrUpdateToLookupEntry(rowData, currentLookupEntry, lookupsBuilder) {
    var lookupEntry;
    var isNewEntry = false;
    var attrDictionaryHeaders = lookupsBuilder.getAttributeDictionaryHeadersLookup();

    if (genericUtil.isUndefined(currentLookupEntry)) {
        lookupEntry = {};
        isNewEntry = true;
    } else {
        lookupEntry = currentLookupEntry;
    }
 
    attrDictionaryHeaders.forEach(function (commerceHeader) {
        var catmanHeader = dataHelper.getCatManVersionManageAttrHeader(commerceHeader);
        var fieldValue;
        var isToGetDefaultOrExistingValue = false;

        if (!genericUtil.isUndefined(catmanHeader)) {
            if (genericUtil.isArray(catmanHeader)) {
                var updateExists = false;

                // check if there's an update from users input
                catmanHeader.forEach(function (eachCatmanHeader) {
                    if (!genericUtil.isUndefined(rowData[eachCatmanHeader])) {
                        updateExists = true;
                    }
                });

                if (updateExists) {
                    // special handling for AttrValPrefix
                    if (catmanHeader.includes(constants.CSV_HEADER_VALUEUSAGE) 
                        && catmanHeader.includes(constants.CSV_HEADER_VALUESCOPE)) {
                        var currentPrefix;
                        
                        if (isNewEntry) {
                            currentPrefix = getAttributeDictionaryDefaultValue(commerceHeader);
                        } else {
                            currentPrefix = currentLookupEntry[commerceHeader];
                        }
                        
                        catmanHeader.forEach(function (eachCatmanHeader) {
                            var inputValue = rowData[eachCatmanHeader];

                            // special handling for AttrValPrefix - Value Usage
                            if (eachCatmanHeader == constants.CSV_HEADER_VALUEUSAGE) {
                                var currentValueUsage;

                                if (currentPrefix.includes(constants.USAGE_DESCRIPTIVE)) {
                                    currentValueUsage = constants.USAGE_DESCRIPTIVE;
                                } else {
                                    currentValueUsage = constants.USAGE_DEFINING;
                                }
                
                                if (inputValue == constants.USAGE_DESCRIPTIVE
                                    || inputValue == constants.USAGE_DEFINING) {
                                    var currentPrefixValueArray = currentPrefix.split(currentValueUsage);
                                    fieldValue = currentPrefixValueArray[0] + inputValue + currentPrefixValueArray[1];
                                } else {
                                    fieldValue = currentPrefix;
                                }
                            }

                            // special handling for AttrValPrefix - Value Scope
                            if (eachCatmanHeader == constants.CSV_HEADER_VALUESCOPE) {
                                var currentValueScope;

                                if (currentPrefix.includes(constants.LOOKUPREF_VALSCOPE_CORE)) {
                                    currentValueScope = constants.LOOKUPREF_VALSCOPE_CORE;
                                } else {
                                    currentValueScope = constants.LOOKUPREF_VALSCOPE_EXTENDED;
                                }

                                if (inputValue == constants.LOOKUPREF_VALSCOPE_CORE
                                    || inputValue == constants.LOOKUPREF_VALSCOPE_EXTENDED) {
                                    var currentPrefixValueArray = currentPrefix.split(currentValueScope);
                                    fieldValue = currentPrefixValueArray[0] + inputValue + currentPrefixValueArray[1];
                                } else {
                                    fieldValue = currentPrefix;
                                }
                            }

                            currentPrefix = fieldValue;
                        });
                    }
                } else {
                    isToGetDefaultOrExistingValue = true;
                }
            } else {
                var inputValue = rowData[catmanHeader];

                if (!genericUtil.isUndefined(inputValue) && !genericUtil.isTrimmedEmptyString(inputValue)) {
                    inputValue = inputValue.trim();
        
                    // for normal values
                    fieldValue = inputValue;
        
                    // for boolean values
                    if (catmanHeader == constants.CSV_HEADER_DISPLAYABLE || catmanHeader == constants.CSV_HEADER_SEARCHABLE 
                        || catmanHeader == constants.CSV_HEADER_COMPARABLE || catmanHeader == constants.CSV_HEADER_FACETABLE 
                        || catmanHeader == constants.CSV_HEADER_MERCHANDISABLE || catmanHeader == constants.CSV_HEADER_SEQUENCINGENABLED 
                        || catmanHeader == constants.CSV_HEADER_FACETABLEMULTISELECT) {
                        if (inputValue.toUpperCase() == constants.BOOLEAN_STRING_TRUE
                            || inputValue.toUpperCase() == constants.BOOLEAN_STRING_FALSE) {
                            fieldValue = inputValue.toUpperCase();
                        } else {
                            isToGetDefaultOrExistingValue = true;
                        }
                    }

                    // for integer values
                    if (catmanHeader == constants.CSV_HEADER_SEQUENCE || catmanHeader == constants.CSV_HEADER_MAXOCCURENCE 
                        || catmanHeader == constants.CSV_HEADER_MINOCCURENCE || catmanHeader == constants.CSV_HEADER_MAXLENGHT) {
                        if (!Number.isInteger(parseInt(inputValue))) {
                            isToGetDefaultOrExistingValue = true;
                        }
                    }
        
                    // special handling for LkupType
                    if (catmanHeader == constants.CSV_HEADER_DATATYPE) {
                        if (inputValue == 'Lookup Table') {
                            fieldValue = constants.LOOKUPREF_LOOKUPTYPE_TABLE;
                            lookupEntry['AttributeType'] = dataHelper.getAttrType(constants.LOOKUPREF_LOOKUPTYPE_TABLE);
                        } else if (inputValue == 'String Enumeration') {
                            fieldValue = constants.LOOKUPREF_LOOKUPTYPE_ENUM;
                            lookupEntry['AttributeType'] = dataHelper.getAttrType(constants.LOOKUPREF_LOOKUPTYPE_ENUM);
                        } else {
                            fieldValue = constants.EMPTY_STRING;
                            lookupEntry['AttributeType'] = dataHelper.getAttrType(constants.EMPTY_STRING);
                        }
                    }
                } else {
                    isToGetDefaultOrExistingValue = true;
                }
            }
        } else {
            isToGetDefaultOrExistingValue = true;
        }

        if (isToGetDefaultOrExistingValue) {
            if (isNewEntry) {
                fieldValue = getAttributeDictionaryDefaultValue(commerceHeader);
            } else {
                fieldValue = currentLookupEntry[commerceHeader];
            }
        }

        lookupEntry[commerceHeader] = fieldValue;
    });
    
    return lookupEntry;
}

// converts any attrval update (settings change or addition) into a lookupentry object
function convertAttrValUpdateToLookupEntry(rowData, currentLookupEntry, lookupsBuilder) {
    var lookupEntry;
    var isNewEntry = false;
    var attrValuesDictionaryHeaders = lookupsBuilder.getAttrValDictionaryHeadersLookup();
    var inputAttrIdentifier = rowData[constants.CSV_HEADER_ATTRIDENTIFIER];
    var needsNewSequence = false;
    var newSequenceHolder = 0;

    if (genericUtil.isUndefined(currentLookupEntry)) {
        lookupEntry = {};
        isNewEntry = true;
        needsNewSequence = true;
    } else {
        lookupEntry = currentLookupEntry;
    }

    attrValuesDictionaryHeaders.forEach(function (commerceHeader) {
        var fieldValue;
        var isToGetDefaultOrExistingValue = false;

        // special handling for attr and attrval identifiers
        if (commerceHeader == 'Identifier') {
            if (isNewEntry) {
                fieldValue = inputAttrIdentifier;
            } else {
                fieldValue = currentLookupEntry[commerceHeader];
            }
        } else if (commerceHeader == 'ValueIdentifier') {
            if (isNewEntry) {
                var valSequence = getAttrValNewSequence(inputAttrIdentifier, lookupsBuilder);
                var attrPrefix = lookupsBuilder.getAttributeDictionaryLookup()[inputAttrIdentifier].AttrValPrefix;

                fieldValue = attrPrefix + constants.DEFAULT_ID_SEPARATOR 
                    + inputAttrIdentifier.split(constants.CHAR_SPACE).join(constants.DEFAULT_ID_SEPARATOR) 
                    + constants.DEFAULT_ID_SEPARATOR + valSequence + constants.DEFAULT_ID_SEPARATOR + constants.VALUE_ID;
                newSequenceHolder = valSequence;
            } else {
                fieldValue = currentLookupEntry[commerceHeader];
            }
        } else if (commerceHeader == 'Sequence') {
            if (needsNewSequence) {
                fieldValue = newSequenceHolder;
            } else {
                isToGetDefaultOrExistingValue = true;
            }
        } else {
            // for now, "Value" is the only field to configure
            if (commerceHeader == 'Value') {
                if (isNewEntry) {
                    fieldValue = rowData[constants.CSV_HEADER_CURRENTVALUE];
                } else {
                    fieldValue = rowData[constants.CSV_HEADER_NEWVALUE];
                }
            } else {
                isToGetDefaultOrExistingValue = true;
            }
        }

        if (isToGetDefaultOrExistingValue) {
            if (isNewEntry) {
                fieldValue = getAttrValuesDictionaryDefaultValue(commerceHeader);
            } else {
                fieldValue = currentLookupEntry[commerceHeader];
            }
        }

        lookupEntry[commerceHeader] = fieldValue;
    });

    return lookupEntry;
}

function getAttrValNewSequence(attributeIdentifier, lookupsBuilder) {
    var attrValDictionaryLookup = lookupsBuilder.getAttributeValuesDictionaryLookup();
    var lookupEntry = attrValDictionaryLookup[attributeIdentifier];
    var highestSequence = 0;
    var newSequence;

    if (!genericUtil.isUndefined(lookupEntry)) {
        for (var attrvalId in lookupEntry) {
            var attrValEntry = lookupEntry[attrvalId];
            var idArray = attrValEntry.ValueIdentifier.split(constants.DEFAULT_ID_SEPARATOR);
            var sequence = parseInt(idArray[idArray.length - 2]);

            if (sequence > highestSequence) {
                highestSequence = sequence;
            }
        }

        newSequence = highestSequence + 1;
    } else {
        newSequence = 0;
    }

    return newSequence;
}

// updates attrval identifiers of the whole single attribute entry to attrval dictionary
function convertAttrPrefixUpdateToAttrValDictionaryEntry(newValUsage, newValScope, currentPrefix, currentLookupEntry) {
    var lookupEntry = {};

    for (var attrValIdentifier in currentLookupEntry) {
        var currentAttrValLookupEntry = currentLookupEntry[attrValIdentifier];
        var currentValUsage = dataHelper.getPrefixValUsage(currentPrefix);
        var currentValScope = dataHelper.getPrefixValScope(currentPrefix);

        var newPrefix = currentPrefix;
        var prefixArray;

        if (!genericUtil.isUndefined(newValUsage) && !genericUtil.isTrimmedEmptyString(newValUsage) 
            && currentPrefix.includes(currentValUsage)) {
            prefixArray = newPrefix.split(currentValUsage);
            newPrefix = prefixArray[0] + newValUsage + prefixArray[1];
        }

        if (!genericUtil.isUndefined(newValScope) && !genericUtil.isTrimmedEmptyString(newValScope) 
            && currentPrefix.includes(currentValScope)) {
            prefixArray = newPrefix.split(currentValScope);
            newPrefix = prefixArray[0] + newValScope + prefixArray[1];
        }

        var attrValIdentifierArray = attrValIdentifier.split(currentPrefix);
        var newAttrValIdentifier = newPrefix + attrValIdentifierArray[1];

        currentAttrValLookupEntry.ValueIdentifier = newAttrValIdentifier;
        lookupEntry[newAttrValIdentifier] = currentAttrValLookupEntry;
    }

    return lookupEntry;
}

//// supporting functions
function getAttributeDictionaryDefaultValue(lookupHeader) {
    // TMP: code refacotoring - how about we can have a map for this in property file?

    // for blank default values
    var defaultValue = constants.EMPTY_STRING;

    // defaults values
    if (lookupHeader == 'Displayable' || lookupHeader == 'Searchable' || lookupHeader == 'Comparable' 
        || lookupHeader == 'Facetable' || lookupHeader == 'Merchandisable' || lookupHeader == 'MultiLang'
        || lookupHeader == 'SequencingEnabled' || lookupHeader == 'FacetableMultiSelect') {
        defaultValue = constants.BOOLEAN_STRING_FALSE;
    } else if (lookupHeader == 'Type') {
        defaultValue = 'STRING';
    } else if (lookupHeader == 'AttributeType' || lookupHeader == 'MultiValue') {
        defaultValue = '1';
    } else if (lookupHeader == 'Sequence' || lookupHeader == 'MinOcurrences') {
        defaultValue = '0';
    } else if (lookupHeader == 'MaxLength') {
        defaultValue = '100';
    } else if (lookupHeader == 'AttrValPrefix') {
        defaultValue = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Extended_Attributes';
    } else if (lookupHeader == 'LanguageId') {
        defaultValue = '-1';
    }

    return defaultValue;
}

function getAttrValuesDictionaryDefaultValue(lookupHeader) {
    // TMP: code refacotoring - how about we can have a map for this in property file?

    // for blank default values
    var defaultValue = constants.EMPTY_STRING;

    // defaults values
    if (lookupHeader == 'ValueUsage') {
        defaultValue = '1';
    } else if (lookupHeader == 'Sequence') {
        defaultValue = '0';
    } else if (lookupHeader == 'LanguageId') {
        defaultValue = '-1';
    }

    return defaultValue;
}

// converts any category update into a lookupentry object
function convertCategoryUpdateToLookupEntry(rowData, currentLookupEntry, lookupsBuilder){
    var lookupEntry;
    var isNewEntry = false;
    var publishedDefaultValue = constants.BOOLEAN_STRING_TRUE;
    var masterSalesCategoryHeaders = lookupsBuilder.getMasterSalesCategoryHeadersLookup();

    if (genericUtil.isUndefined(currentLookupEntry)) {
        lookupEntry = {};
        isNewEntry = true;
    } else {
        lookupEntry = currentLookupEntry;
    }

    masterSalesCategoryHeaders.forEach(function (header){
        var inputValue = rowData[header];

        if (!genericUtil.isUndefined(inputValue) && !genericUtil.isTrimmedEmptyString(inputValue)){
            if (header == constants.CSV_HEADER_CAT_URLKEYWORD) {
                inputValue = inputValue.toLowerCase();
                lookupEntry[header] = inputValue;
            } else {
                lookupEntry[header] = inputValue;  
            }                  
        } else {
            if (isNewEntry) {
                if (header == constants.CSV_HEADER_CAT_PUBLISHED) {                   
                    inputValue = publishedDefaultValue;
                    lookupEntry[header] = inputValue;        
                } else {
                    lookupEntry[header] = constants.EMPTY_STRING;
                }            
            }
        }
    });
    return lookupEntry;
}

// update urlkeyword for multi-parent
function updateCategoryLookupForUrlKeyword(categoryIdentifier, urlKeyword, masterSalesCategoryLookup){
    var categoryIdentifierLookupEntryMap = masterSalesCategoryLookup[categoryIdentifier];
    var urlkeywordHeader = constants.CSV_HEADER_CAT_URLKEYWORD;
    for (var categoryParentIdentifier in categoryIdentifierLookupEntryMap){
        categoryIdentifierLookupEntryMap[categoryParentIdentifier][urlkeywordHeader] = urlKeyword;
    }            
}

//// exported functions
exports.modifyLookupForAttrDeletion = function(rowData, lookupsBuilder) {
    var attrIdentifier = rowData[constants.CSV_HEADER_ATTRIDENTIFIER];
    var attrDictionaryLookup = lookupsBuilder.getAttributeDictionaryLookup();
    var attrValDictionaryLookup = lookupsBuilder.getAttributeValuesDictionaryLookup();
    var ctaMapLookup = lookupsBuilder.getCtaMapLookup();
    var ubeltMapLookup = lookupsBuilder.getUBeltMapLookup();
    var deletionLookup = lookupsBuilder.getManageAttributesDeletionLookup();
    var manageAttributesSummaryLookup = lookupsBuilder.getManageAttributesSummaryLookup();
    
    if (attrIdentifier.includes('CTA')) {
        delete ctaMapLookup[attrIdentifier];
        manageAttributesSummaryLookup.ctaUpdatesExists = true;
    }

    if (attrIdentifier.includes('Utility Belt_')) {
        delete ubeltMapLookup[attrIdentifier];
        manageAttributesSummaryLookup.ubeltUpdatesExists = true;
    }

    if (!genericUtil.isUndefined(attrValDictionaryLookup[attrIdentifier])) {
        delete attrValDictionaryLookup[attrIdentifier];
        manageAttributesSummaryLookup.attrValUpdatesExists = true;
    }

    // populate deletion lookup
    deletionLookup.push(attrIdentifier);

    //delete attrIdentifier[attrValDictionaryLookup];
    delete attrDictionaryLookup[attrIdentifier];
    manageAttributesSummaryLookup.attrUpdatesExists = true;
}

exports.modifyLookupForAttrSettingsChange = function(rowData, lookupsBuilder) {
    var attrIdentifier = rowData[constants.CSV_HEADER_ATTRIDENTIFIER];
    var attrDictionaryLookup = lookupsBuilder.getAttributeDictionaryLookup();
    var attrValDictionaryLookup = lookupsBuilder.getAttributeValuesDictionaryLookup();
    var ctaMapLookup = lookupsBuilder.getCtaMapLookup();
    var ubeltMapLookup = lookupsBuilder.getUBeltMapLookup();
    var valUsageUpdatesLookup = lookupsBuilder.getManageAttributesUsageUpdatesLookup();
    var searchableUpdatesLookup = lookupsBuilder.getManageAttributesSearchableUpdatesLookup();
    var datatypeUpdatesForAttrValUpdateLookup = lookupsBuilder.getManageAttributesDatatypeForUpdateLookup();
    var datatypeUpdatesForAttrValDeleteLookup = lookupsBuilder.getManageAttributesDatatypeForDeleteLookup();
    var manageAttributesSummaryLookup = lookupsBuilder.getManageAttributesSummaryLookup();

    var includesNameUpdate = false;
    var includesValUsageUpdate = false;
    var includesValScopeUpdate = false;
    var includesSearchableUpdate = false;
    var includesDatatypeUpdate = false;

    var currentNameValue = attrDictionaryLookup[attrIdentifier].Name;
    var currentPrefix = attrDictionaryLookup[attrIdentifier].AttrValPrefix;
    var currentValUsage = dataHelper.getPrefixValUsage(currentPrefix);
    var currentValScope = dataHelper.getPrefixValScope(currentPrefix);
    var currentSearchable = attrDictionaryLookup[attrIdentifier].Searchable;
    var currentDatatype = attrDictionaryLookup[attrIdentifier].LkupType;

    var nameAfterLookupUpdate;
    var valUsageAfterLookupUpdate;
    var valScopeAfterLookupUpdate;
    var searchableAfterLookupUpdate;
    var dataTypeAfterLookupUpdate;
    
    // update lookup entry
    var updatedLookupEntry = convertAttrUpdateToLookupEntry(rowData, attrDictionaryLookup[attrIdentifier], lookupsBuilder);
    attrDictionaryLookup[attrIdentifier] = updatedLookupEntry;
    manageAttributesSummaryLookup.attrUpdatesExists = true;

    nameAfterLookupUpdate = attrDictionaryLookup[attrIdentifier].Name;
    valUsageAfterLookupUpdate = dataHelper.getPrefixValUsage(attrDictionaryLookup[attrIdentifier].AttrValPrefix);
    valScopeAfterLookupUpdate = dataHelper.getPrefixValScope(attrDictionaryLookup[attrIdentifier].AttrValPrefix);
    searchableAfterLookupUpdate = attrDictionaryLookup[attrIdentifier].Searchable;
    dataTypeAfterLookupUpdate = attrDictionaryLookup[attrIdentifier].LkupType;

    if (currentNameValue != nameAfterLookupUpdate) {
        includesNameUpdate = true;
    }

    if (currentValUsage != valUsageAfterLookupUpdate) {
        includesValUsageUpdate = true;
    }

    if (currentValScope != valScopeAfterLookupUpdate) {
        includesValScopeUpdate = true;
    }

    if (currentSearchable != searchableAfterLookupUpdate) {
        includesSearchableUpdate = true;
    }

    if (currentDatatype != dataTypeAfterLookupUpdate) {
        includesDatatypeUpdate = true;
    }

    // populate valusage updates lookup
    if (includesValUsageUpdate) {
        // add array with attributeIdentifier and the old value usage
        valUsageUpdatesLookup.push([attrIdentifier, currentValUsage]);
    }

    // update attrval lookup when prefix is updated
    if (includesValUsageUpdate || includesValScopeUpdate) {
        attrValDictionaryLookup[attrIdentifier] = convertAttrPrefixUpdateToAttrValDictionaryEntry(valUsageAfterLookupUpdate, 
            valScopeAfterLookupUpdate, currentPrefix, attrValDictionaryLookup[attrIdentifier]);
        manageAttributesSummaryLookup.attrValUpdatesExists = true;
    }

    // populate searchable updates lookup
    if (includesSearchableUpdate && (searchableAfterLookupUpdate == constants.BOOLEAN_STRING_FALSE)) {
        searchableUpdatesLookup.push(attrIdentifier);
    }

    // update attrval lookup based on datatype updates
    if (includesDatatypeUpdate) {
        if (dataTypeAfterLookupUpdate == constants.EMPTY_STRING) {
            // attrtype is updated from 1 to 2
            delete attrValDictionaryLookup[attrIdentifier];
        } else {
            // attrtype is updated from 2 to 1
            var inputAttrValues = rowData[constants.CSV_HEADER_ATTRVALUES].split(constants.CHAR_PIPE);
            attrValDictionaryLookup[attrIdentifier] = {};
            var sqlFormatAttributeIdentifiers = constants.EMPTY_STRING;
            var attrValCtr = 0;

            inputAttrValues.forEach(function (eachInputAttrValue) {
                var currentAttrValLookupEntry = dataHelper.getFieldValueLookupEntry(eachInputAttrValue, 
                    'Value', attrValDictionaryLookup[attrIdentifier]);;
                var attrValRowData = {};
                attrValRowData[constants.CSV_HEADER_ATTRIDENTIFIER] = attrIdentifier;
                attrValRowData[constants.CSV_HEADER_CURRENTVALUE] = eachInputAttrValue;
                var lookupEntry = convertAttrValUpdateToLookupEntry(attrValRowData, currentAttrValLookupEntry, lookupsBuilder);
                attrValDictionaryLookup[attrIdentifier][lookupEntry.ValueIdentifier] = lookupEntry;

                // populate datatype lookup for update
                datatypeUpdatesForAttrValUpdateLookup.push([attrIdentifier, lookupEntry.ValueIdentifier, lookupEntry.Value]);

                attrValCtr++;
                sqlFormatAttributeIdentifiers = sqlFormatAttributeIdentifiers 
                    + constants.CHAR_SQUOTE + lookupEntry.ValueIdentifier + constants.CHAR_SQUOTE;
                if (attrValCtr < inputAttrValues.length) {
                    sqlFormatAttributeIdentifiers = sqlFormatAttributeIdentifiers + constants.DEFAULT_DELIMITER;
                }
            });

            // populate datatype lookup for delete
            datatypeUpdatesForAttrValDeleteLookup.push([attrIdentifier, sqlFormatAttributeIdentifiers]);
        }

        manageAttributesSummaryLookup.attrValUpdatesExists = true;
    }

    // TBD: for review - if need to have a separate function
    if (attrIdentifier.includes('CTA') && includesNameUpdate) {
        var ctaMapLookupEntry = ctaMapLookup[attrIdentifier];

        if (!genericUtil.isUndefined(ctaMapLookupEntry)) {
            ctaMapLookupEntry.key = nameAfterLookupUpdate;
            ctaMapLookup[attrIdentifier] = ctaMapLookupEntry;
            manageAttributesSummaryLookup.ctaUpdatesExists = true;
        }
    }

    // TBD: for review - if need to have a separate function
    if (attrIdentifier.includes('Utility Belt_') && includesNameUpdate) {
        var ubeltMapLookupEntry = ubeltMapLookup[attrIdentifier];

        if (!genericUtil.isUndefined(ubeltMapLookupEntry)) {
            ubeltMapLookupEntry.key = nameAfterLookupUpdate;
            ubeltMapLookup[attrIdentifier] = ubeltMapLookupEntry;
            manageAttributesSummaryLookup.ubeltUpdatesExists = true;
        }
    }
}

exports.modifyLookupForAttrAddition = function(rowData, lookupsBuilder) {
    var attrIdentifier = rowData[constants.CSV_HEADER_ATTRIDENTIFIER];
    var attrDictionaryLookup = lookupsBuilder.getAttributeDictionaryLookup();
    var attrValDictionaryLookup = lookupsBuilder.getAttributeValuesDictionaryLookup();
    var ctaMapLookup = lookupsBuilder.getCtaMapLookup();
    var ubeltMapLookup = lookupsBuilder.getUBeltMapLookup();
    var manageAttributesSummaryLookup = lookupsBuilder.getManageAttributesSummaryLookup();

    // update lookup entry
    var lookupEntry = convertAttrUpdateToLookupEntry(rowData, attrDictionaryLookup[attrIdentifier], lookupsBuilder);
    attrDictionaryLookup[attrIdentifier] = lookupEntry;
    manageAttributesSummaryLookup.attrUpdatesExists = true;

    var dataType = attrDictionaryLookup[attrIdentifier].LkupType;
    
    if (attrIdentifier.includes('CTA')) {
        ctaMapLookup[attrIdentifier] = {
            key: lookupEntry.Name,
            value: attrIdentifier
        };
        manageAttributesSummaryLookup.ctaUpdatesExists = true;
    }

    if (attrIdentifier.includes('Utility Belt_')) {
        ubeltMapLookup[attrIdentifier] = {
            key: lookupEntry.Name,
            value: attrIdentifier
        };
        manageAttributesSummaryLookup.ubeltUpdatesExists = true;
    }

    // update attrval lookup based on input data type
    if (dataType == constants.LOOKUPREF_LOOKUPTYPE_TABLE || dataType == constants.LOOKUPREF_LOOKUPTYPE_ENUM) {
        var inputAttrValues = rowData[constants.CSV_HEADER_ATTRVALUES].split(constants.CHAR_PIPE);
        attrValDictionaryLookup[attrIdentifier] = {};

        inputAttrValues.forEach(function (eachInputAttrValue) {
            var currentAttrValLookupEntry = dataHelper.getFieldValueLookupEntry(eachInputAttrValue, 
                'Value', attrValDictionaryLookup[attrIdentifier]);;
            var attrValRowData = {};
            attrValRowData[constants.CSV_HEADER_ATTRIDENTIFIER] = attrIdentifier;
            attrValRowData[constants.CSV_HEADER_CURRENTVALUE] = eachInputAttrValue;
            var lookupEntry = convertAttrValUpdateToLookupEntry(attrValRowData, currentAttrValLookupEntry, lookupsBuilder);
            attrValDictionaryLookup[attrIdentifier][lookupEntry.ValueIdentifier] = lookupEntry;
        });

        manageAttributesSummaryLookup.attrValUpdatesExists = true;
    }
}

exports.modifyLookupForAttrValuesChange = function(rowData, lookupsBuilder) {
    var attrIdentifier = rowData[constants.CSV_HEADER_ATTRIDENTIFIER];
    var currentAttrValLookupEntry = dataHelper.getFieldValueLookupEntry(rowData[constants.CSV_HEADER_CURRENTVALUE], 
        'Value', lookupsBuilder.getAttributeValuesDictionaryLookup()[attrIdentifier]);
    var attrValDictionaryLookup = lookupsBuilder.getAttributeValuesDictionaryLookup();
    var summaryLookup = lookupsBuilder.getManageAttributesSummaryLookup();
    var attrValUpdatesLookup = lookupsBuilder.getManageAttributesAttrValUpdatesLookup();

    var updatedLookupEntry = convertAttrValUpdateToLookupEntry(rowData, currentAttrValLookupEntry, lookupsBuilder);
    
    // populate attrval updates lookup
    if (!attrValUpdatesLookup.includes(attrIdentifier)) {
        attrValUpdatesLookup.push(attrIdentifier);
    }

    attrValDictionaryLookup[attrIdentifier][updatedLookupEntry.ValueIdentifier] = updatedLookupEntry;
    summaryLookup.attrValUpdatesExists = true;
}

exports.modifyLookupForAttrValuesDeletion = function(rowData, lookupsBuilder) {
    var attrIdentifier = rowData[constants.CSV_HEADER_ATTRIDENTIFIER];
    var currentAttrValLookupEntry = dataHelper.getFieldValueLookupEntry(rowData[constants.CSV_HEADER_CURRENTVALUE], 
        'Value', lookupsBuilder.getAttributeValuesDictionaryLookup()[attrIdentifier]);
    var attrValDictionaryLookup = lookupsBuilder.getAttributeValuesDictionaryLookup();
    var summaryLookup = lookupsBuilder.getManageAttributesSummaryLookup();
    var deletionLookup = lookupsBuilder.getManageAttributeValuesDeletionLookup();
    var attrValUpdatesLookup = lookupsBuilder.getManageAttributesAttrValUpdatesLookup();
    
    // populate deletion lookup
    deletionLookup.push(currentAttrValLookupEntry.ValueIdentifier);

    // populate attrval updates lookup
    if (!attrValUpdatesLookup.includes(attrIdentifier)) {
        attrValUpdatesLookup.push(attrIdentifier);
    }

    delete attrValDictionaryLookup[attrIdentifier][currentAttrValLookupEntry.ValueIdentifier];
    summaryLookup.attrValUpdatesExists = true;
}

exports.modifyLookupForAttrValuesAddition = function(rowData, lookupsBuilder) {
    var attrIdentifier = rowData[constants.CSV_HEADER_ATTRIDENTIFIER];
    var currentAttrValLookupEntry = dataHelper.getFieldValueLookupEntry(rowData[constants.CSV_HEADER_CURRENTVALUE], 
        'Value', lookupsBuilder.getAttributeValuesDictionaryLookup()[attrIdentifier]);
    var attrValDictionaryLookup = lookupsBuilder.getAttributeValuesDictionaryLookup();
    var summaryLookup = lookupsBuilder.getManageAttributesSummaryLookup();
    var attrValUpdatesLookup = lookupsBuilder.getManageAttributesAttrValUpdatesLookup();

    var lookupEntry = convertAttrValUpdateToLookupEntry(rowData, currentAttrValLookupEntry, lookupsBuilder);
    
    if (genericUtil.isUndefined(attrValDictionaryLookup[attrIdentifier])) {
        // this means that the attr value entry is just the first value to process for a particular attribute
        attrValDictionaryLookup[attrIdentifier] = {};
    }

    // populate attrval updates lookup
    if (!attrValUpdatesLookup.includes(attrIdentifier)) {
        attrValUpdatesLookup.push(attrIdentifier);
    }

    attrValDictionaryLookup[attrIdentifier][lookupEntry.ValueIdentifier] = lookupEntry;
    summaryLookup.attrValUpdatesExists = true;
}

exports.modifyLookupForCategoryUpdate = function(rowData, lookupsBuilder){
    var categoryIdentifier = rowData[constants.CSV_HEADER_CAT_IDENTIFIER];
    var categoryParentIdentifier = rowData[constants.CSV_HEADER_CAT_PARENTIDENTIFIER];
    var urlkeyword = constants.CSV_HEADER_CAT_URLKEYWORD;
    var facet =  constants.CSV_HEADER_CAT_FACETMANAGEMENT;
    var categoryStore = rowData[constants.CSV_HEADER_CAT_STORE];
    var masterSalesCategoryLookup = lookupsBuilder.getMasterSalesCategoryLookup();
    var manageCategorySummaryLookups = lookupsBuilder.getManageCategorySummaryLookup();
    var urlKeywordUpdateLookup = lookupsBuilder.getManageCategoryUrlKeywordUpdatesLookup();
    var facetUpdateLookup = lookupsBuilder.getManageCategoryFacetUpdatesLookup();
    var categoryStoreLookup = lookupsBuilder.getManageCategoryStoreLookup();
    var masterStore = applicationProperties.path().catman.category.store.master;
    var masterCategoryFormat = 'M-'

    var includesUrlKeywordUpdate = false;
    var includesFacetUpdate = false;

    var currentUrlKeyword = masterSalesCategoryLookup[categoryIdentifier][categoryParentIdentifier][urlkeyword];
    var currentFacet = masterSalesCategoryLookup[categoryIdentifier][categoryParentIdentifier][facet];

    var urlkeywordAfterUpdateLookup;
    var facetAfterUpdateLookup;

    // update lookup entry
    var updatedLookupEntry = convertCategoryUpdateToLookupEntry(rowData, masterSalesCategoryLookup[categoryIdentifier][categoryParentIdentifier], lookupsBuilder);
    masterSalesCategoryLookup[categoryIdentifier][categoryParentIdentifier] = updatedLookupEntry;
    manageCategorySummaryLookups.categoryUpdatesExists = true;

    urlkeywordAfterUpdateLookup = masterSalesCategoryLookup[categoryIdentifier][categoryParentIdentifier][urlkeyword];
    facetAfterUpdateLookup = masterSalesCategoryLookup[categoryIdentifier][categoryParentIdentifier][facet];

    if (currentUrlKeyword != urlkeywordAfterUpdateLookup) {
        includesUrlKeywordUpdate = true;
    }

    if(currentFacet != facetAfterUpdateLookup) {
        includesFacetUpdate = true;
    }

    // populate valusage updates lookup
    if (includesUrlKeywordUpdate){
        updateCategoryLookupForUrlKeyword(categoryIdentifier, urlkeywordAfterUpdateLookup, masterSalesCategoryLookup);
        // add category identifier to delete urlkeyword
        urlKeywordUpdateLookup.push(currentUrlKeyword);
    }

    if (includesFacetUpdate) {
        var facetForDeletionArray = [];
        var currentFacetArr = currentFacet.split(constants.CHAR_PIPE);
        var facetAfterUpdateArr = facetAfterUpdateLookup.split(constants.CHAR_PIPE);
                 
        currentFacetArr.forEach(function (eachFacet) { 
            var eachFacet = eachFacet.trim();
            if (!genericUtil.isTrimmedEmptyString(eachFacet)) {
                if (!facetAfterUpdateArr.includes(eachFacet)){
                    facetForDeletionArray.push(eachFacet);
                }
            }
        });  
        if (facetForDeletionArray.length > 0){
            facetUpdateLookup.push([categoryIdentifier, facetForDeletionArray]);   
        }                  
    }
    
    var categoryStore = categoryStore.toLowerCase();
    if (categoryStoreLookup.includes(masterCategoryFormat)) {
        if (!categoryStoreLookup.includes(masterStore)){
            categoryStoreLookup.push(masterStore);
        }
    } else if (!categoryStoreLookup.includes(categoryStore)){
        categoryStoreLookup.push(categoryStore);
    }
    
}

exports.modifyLookupForCategoryAddition = function(rowData, lookupsBuilder){
    var categoryIdentifier = rowData[constants.CSV_HEADER_CAT_IDENTIFIER];
    var categoryParentIdentifier = rowData[constants.CSV_HEADER_CAT_PARENTIDENTIFIER];
    var categoryStore = rowData[constants.CSV_HEADER_CAT_STORE];
    var categoryType = rowData[constants.CSV_HEADER_CAT_MASTERCATALOG];
    var masterSalesCategoryLookup = lookupsBuilder.getMasterSalesCategoryLookup();
    var manageCategorySummaryLookups = lookupsBuilder.getManageCategorySummaryLookup();
    var categoryStoreLookup = lookupsBuilder.getManageCategoryStoreLookup();
    var masterStore = applicationProperties.path().catman.category.store.master;

    if (genericUtil.isUndefined(masterSalesCategoryLookup[categoryIdentifier])) {
        masterSalesCategoryLookup[categoryIdentifier] = {};  
    }

    var updatedLookupEntry = convertCategoryUpdateToLookupEntry(rowData, masterSalesCategoryLookup[categoryIdentifier][categoryParentIdentifier], lookupsBuilder);
    masterSalesCategoryLookup[categoryIdentifier][categoryParentIdentifier] = updatedLookupEntry;
    manageCategorySummaryLookups.categoryUpdatesExists = true;

    var categoryStore = categoryStore.toLowerCase();
    if (categoryType == constants.BOOLEAN_STRING_TRUE) {
        if (!categoryStoreLookup.includes(masterStore)){
            categoryStoreLookup.push(masterStore);
        }
    } else if (!categoryStoreLookup.includes(categoryStore)){
        categoryStoreLookup.push(categoryStore);
    }
    
}

exports.modifyLookupForCategoryDeletion = function(rowData, lookupsBuilder){
    var categoryIdentifier = rowData[constants.CSV_HEADER_CAT_IDENTIFIER];
    var categoryParentIdentifier = rowData[constants.CSV_HEADER_CAT_PARENTIDENTIFIER];
    var categoryStore = rowData[constants.CSV_HEADER_CAT_STORE];
    var masterSalesCategoryLookup = lookupsBuilder.getMasterSalesCategoryLookup();
    var manageCategorySummaryLookups = lookupsBuilder.getManageCategorySummaryLookup();
    var categoryDeletionLookup = lookupsBuilder.getManageCategoryDeletionLookup();
    var categoryStoreLookup = lookupsBuilder.getManageCategoryStoreLookup();
    var masterStore = applicationProperties.path().catman.category.store.master;
    var masterCategoryFormat = 'M-'

    if (!genericUtil.isUndefined(masterSalesCategoryLookup[categoryIdentifier][categoryParentIdentifier])) {
        delete masterSalesCategoryLookup[categoryIdentifier][categoryParentIdentifier];
        manageCategorySummaryLookups.categoryUpdatesExists = true;
    }

    categoryDeletionLookup.push(categoryIdentifier);

    var categoryStore = categoryStore.toLowerCase();
    if (categoryStoreLookup.includes(masterCategoryFormat)) {
        if (!categoryStoreLookup.includes(masterStore)){
            categoryStoreLookup.push(masterStore);
        }
    } else if (!categoryStoreLookup.includes(categoryStore)){
        categoryStoreLookup.push(categoryStore);
    }




}
