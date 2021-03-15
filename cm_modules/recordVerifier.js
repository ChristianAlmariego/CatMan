// setup default properties
var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;

// setup extended properties
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var systemProperties = propertiesReader.getSystemProperties();

// setup cm_modules
var constants = require(cmModulesPath + systemProperties.path().catman.constants);
var genericUtil = require(cmModulesPath + systemProperties.path().catman.genericUtilities);
var dataHelper = require(cmModulesPath + systemProperties.path().catman.dataHelper);

//// methods

function verifyAttributeDictionaryFields(rowData, verification, lookupAttrDictionary, extractedAttrDictionary) {
    var attributeIdentifier = rowData[constants.CSV_HEADER_ATTRIDENTIFIER];
    var attrManagerHeaderMap = dataHelper.getAttrManagerHeaderMap(constants.SYSTEM_PLATFORM_CATMAN);

    for (var catmanHeader in attrManagerHeaderMap) {
        var inputValue = rowData[catmanHeader];

        if (!genericUtil.isUndefined(inputValue) && !genericUtil.isTrimmedEmptyString(inputValue)) {
            var commerceHeader = dataHelper.getCommerceVersionManageAttrHeader(catmanHeader);
            var processedValue = extractedAttrDictionary[attributeIdentifier][commerceHeader];

            if (genericUtil.isUndefined(processedValue)) {
                processedValue = lookupAttrDictionary[attributeIdentifier][commerceHeader];
            }

            switch (catmanHeader) {
                case constants.CSV_HEADER_VALUEUSAGE:
                    // specific comparison
                    verifyValueUsage(rowData, verification, lookupAttrDictionary);
                    break;
                case constants.CSV_HEADER_VALUESCOPE:
                    // specific comparison
                    verifyValueScope(rowData, verification, lookupAttrDictionary);
                    break;
                default:
                    // default comparison
                    if (inputValue != processedValue) {
                        verification.status = constants.STATUS_FAILED;
                        verification.discrepancies.push(catmanHeader);
                    }
            }
        }
    }
}

function verifyCategoryLookupFields(rowData, verification, extractedAttrDictionary, lookupsBuilder) {
    var categoryIdentifier = rowData[constants.CSV_HEADER_CAT_IDENTIFIER];
    var categoryParentIdentifier = rowData[constants.CSV_HEADER_CAT_PARENTIDENTIFIER];
    var masterSalesCategoryHeaders = lookupsBuilder.getMasterSalesCategoryHeadersLookup();

    masterSalesCategoryHeaders.forEach(function (catmanHeader){
        var inputValue = rowData[catmanHeader];

        if (!genericUtil.isUndefined(inputValue) && !genericUtil.isTrimmedEmptyString(inputValue)) {
            var processedValue = extractedAttrDictionary[categoryIdentifier][categoryParentIdentifier][catmanHeader];
            
                if (catmanHeader == constants.CSV_HEADER_CAT_FACETMANAGEMENT) {
                    var inputFacetArr = inputValue.split(constants.CHAR_PIPE);
                    var extractFacetArr = processedValue.split(constants.CHAR_PIPE);
    
                    inputFacetArr.forEach(function (eachFacet) { 
                        var eachFacet = eachFacet.trim();
                        if (!genericUtil.isTrimmedEmptyString(eachFacet)) {
                            if (!extractFacetArr.includes(eachFacet)){
                                verification.status = constants.STATUS_FAILED;
                                verification.discrepancies.push(catmanHeader);
                            }
                        }
                    });  
                } else {
                    if (inputValue != processedValue) {
                        verification.status = constants.STATUS_FAILED;
                        verification.discrepancies.push(catmanHeader);
                    }
                }  
            
        }
    });
}

function verifyValueUsage(rowData, verification, attrDictionary) {
    var attributeIdentifier = rowData[constants.CSV_HEADER_ATTRIDENTIFIER];
    var inputValUsage = rowData[constants.CSV_HEADER_VALUEUSAGE];

    if (!genericUtil.isUndefined(inputValUsage) && !genericUtil.isTrimmedEmptyString(inputValUsage)) {
        var commerceValPrefixHeader = dataHelper.getCommerceVersionManageAttrHeader(constants.CSV_HEADER_VALUEUSAGE);
        var processedValPrefix = attrDictionary[attributeIdentifier][commerceValPrefixHeader];

        if (!processedValPrefix.includes(inputValUsage)) {
            verification.status = constants.STATUS_FAILED;
            verification.discrepancies.push(constants.CSV_HEADER_VALUEUSAGE);
        }
    }
}

function verifyValueScope(rowData, verification, attrDictionary) {
    var attributeIdentifier = rowData[constants.CSV_HEADER_ATTRIDENTIFIER];
    var inputValScope = rowData[constants.CSV_HEADER_VALUESCOPE];

    if (!genericUtil.isUndefined(inputValScope) && !genericUtil.isTrimmedEmptyString(inputValScope)) {
        var commerceValPrefixHeader = dataHelper.getCommerceVersionManageAttrHeader(constants.CSV_HEADER_VALUESCOPE);
        var processedValPrefix = attrDictionary[attributeIdentifier][commerceValPrefixHeader];

        if (!processedValPrefix.includes(inputValScope)) {
            verification.status = constants.STATUS_FAILED;
            verification.discrepancies.push(constants.CSV_HEADER_VALUESCOPE);
        }
    }
}

//// exported functions
exports.verifyRowDataForAttrSettingsChange = function(rowData, lookupsBuilder) {
    var extractedAttrDictionary = lookupsBuilder.getManageAttrExportAttrDictionary();
    var lookupAttrDictionary = lookupsBuilder.getAttributeDictionaryLookup();

    var verification = {
        status: constants.STATUS_SUCCESS,
        discrepancies: []
    };

    verifyAttributeDictionaryFields(rowData, verification, lookupAttrDictionary, extractedAttrDictionary);

    return verification;
}

exports.verifyRowDataForAttrAddition = function(rowData, lookupsBuilder) {
    var attributeIdentifier = rowData[constants.CSV_HEADER_ATTRIDENTIFIER];
    var extractedAttrDictionary = lookupsBuilder.getManageAttrExportAttrDictionary();
    var lookupAttrDictionary = lookupsBuilder.getAttributeDictionaryLookup();
    
    var verification = {
        status: constants.STATUS_SUCCESS,
        discrepancies: []
    };

    // check if attribute identifier exists
    if (genericUtil.isUndefined(extractedAttrDictionary[attributeIdentifier])) {
        // Attribute Identifier doesn't exists
        verification.status = constants.STATUS_FAILED;
    } else {
        verifyAttributeDictionaryFields(rowData, verification, lookupAttrDictionary, extractedAttrDictionary);
    }

    return verification;
}

exports.verifyRowDataForAttrDeletion = function(rowData, lookupsBuilder) {
    var attributeIdentifier = rowData[constants.CSV_HEADER_ATTRIDENTIFIER];
    var extractedAttrDictionary = lookupsBuilder.getManageAttrExportAttrDictionary();

    var verification = {
        status: constants.STATUS_SUCCESS,
        discrepancies: []
    };

    // check if attribute identifier doesn't exists anymore
    if (!genericUtil.isUndefined(extractedAttrDictionary[attributeIdentifier])) {
        // Attribute Identifier still exists
        verification.status = constants.STATUS_FAILED;
    }

    return verification;
}

exports.verifyRowDataForAttrValChange = function(rowData, lookupsBuilder) {
    var attributeIdentifier = rowData[constants.CSV_HEADER_ATTRIDENTIFIER];
    var inputCurrentValue = rowData[constants.CSV_HEADER_CURRENTVALUE];
    var inputNewValue = rowData[constants.CSV_HEADER_NEWVALUE];
    var extractedAttrValDictionary = lookupsBuilder.getManageAttrExportAttrValDictionary();
    var oldLookupEntry = dataHelper.getFieldValueLookupEntry(inputCurrentValue, 'Value', extractedAttrValDictionary[attributeIdentifier]);
    var newLookupEntry = dataHelper.getFieldValueLookupEntry(inputNewValue, 'Value', extractedAttrValDictionary[attributeIdentifier]);

    var verification = {
        status: constants.STATUS_SUCCESS,
        discrepancies: []
    };

    // check if the value was succesfully updated, meaning old is gone new is existing
    if (!genericUtil.isUndefined(oldLookupEntry) || genericUtil.isUndefined(newLookupEntry)) {
        // Attribute Value not updated
        verification.status = constants.STATUS_FAILED;
    }

    return verification;
}

exports.verifyRowDataForAttrValAddition = function(rowData, lookupsBuilder) {
    var attributeIdentifier = rowData[constants.CSV_HEADER_ATTRIDENTIFIER];
    var inputCurrentValue = rowData[constants.CSV_HEADER_CURRENTVALUE];
    var extractedAttrValDictionary = lookupsBuilder.getManageAttrExportAttrValDictionary();
    var lookupEntry = dataHelper.getFieldValueLookupEntry(inputCurrentValue, 'Value', extractedAttrValDictionary[attributeIdentifier]);

    var verification = {
        status: constants.STATUS_SUCCESS,
        discrepancies: []
    };

    // check if the value is already existing
    if (genericUtil.isUndefined(lookupEntry)) {
        // Attribute Value still doesn't exists
        verification.status = constants.STATUS_FAILED;
    }

    return verification;
}

exports.verifyRowDataForAttrValDeletion = function(rowData, lookupsBuilder) {
    var attributeIdentifier = rowData[constants.CSV_HEADER_ATTRIDENTIFIER];
    var inputCurrentValue = rowData[constants.CSV_HEADER_CURRENTVALUE];
    var extractedAttrValDictionary = lookupsBuilder.getManageAttrExportAttrValDictionary();
    var lookupEntry = dataHelper.getFieldValueLookupEntry(inputCurrentValue, 'Value', extractedAttrValDictionary[attributeIdentifier]);

    var verification = {
        status: constants.STATUS_SUCCESS,
        discrepancies: []
    };

    // check if the value is already deleted
    if (!genericUtil.isUndefined(lookupEntry)) {
        // Attribute Value still exists
        verification.status = constants.STATUS_FAILED;
    }

    return verification;
}

exports.verifyRowDataForCategoryAddition = function(rowData, lookupsBuilder) {
    var categoryIdentifier = rowData[constants.CSV_HEADER_CAT_IDENTIFIER];
    var categoryParentIdentifier = rowData[constants.CSV_HEADER_CAT_PARENTIDENTIFIER];
    var extractedCategoryLookup = lookupsBuilder.getManageCategoryExportLookups();
    var masterSalesCategoryLookup = lookupsBuilder.getMasterSalesCategoryLookup();

    var verification = {
        status: constants.STATUS_SUCCESS,
        discrepancies: []
    };

    // check if category identifier exists
    if (!genericUtil.isUndefined(categoryIdentifier) || (!genericUtil.isTrimmedEmptyString(categoryIdentifier))) {
        if (!genericUtil.isUndefined(categoryParentIdentifier) || (!genericUtil.isTrimmedEmptyString(categoryParentIdentifier))) {
            if (genericUtil.isUndefined(extractedCategoryLookup[categoryIdentifier][categoryParentIdentifier])) {
                // Category Identifier doesn't exists
                verification.status = constants.STATUS_FAILED;
            } else {
                verifyCategoryLookupFields(rowData, verification, extractedCategoryLookup, lookupsBuilder);
            }
        
        }
    } 
    return verification;
}

exports.verifyRowDataForCategoryUpdate = function(rowData, lookupsBuilder) {
    var extractedCategoryLookup = lookupsBuilder.getManageCategoryExportLookups();
    var masterSalesCategoryLookup = lookupsBuilder.getMasterSalesCategoryLookup();

    var verification = {
        status: constants.STATUS_SUCCESS,
        discrepancies: []
    };

    verifyCategoryLookupFields(rowData, verification, extractedCategoryLookup, lookupsBuilder);

    return verification;
}

exports.verifyRowDataForCategoryDeletion = function(rowData, lookupsBuilder) {
    var categoryIdentifier = rowData[constants.CSV_HEADER_CAT_IDENTIFIER];
    var categoryParentIdentifier = rowData[constants.CSV_HEADER_CAT_PARENTIDENTIFIER];
    var extractedCategoryLookup = lookupsBuilder.getManageCategoryExportLookups();

    var verification = {
        status: constants.STATUS_SUCCESS,
        discrepancies: []
    };

    // check if category identifier doesn't exists anymore
    if (!genericUtil.isUndefined(categoryIdentifier)) {
        if (genericUtil.isUndefined(extractedCategoryLookup[categoryIdentifier])) {
            verification.status = constants.STATUS_SUCCESS;
        } else if (genericUtil.isUndefined(extractedCategoryLookup[categoryIdentifier][categoryParentIdentifier])) {
            verification.status = constants.STATUS_SUCCESS;
        } else {
            verification.status = constants.STATUS_FAILED;
        }
    }
    
    return verification;
}