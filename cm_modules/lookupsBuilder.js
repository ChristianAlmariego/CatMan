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

//// setup node modules
var fs = require(systemProperties.path().node.fileSystem);
var csvsync = require(systemProperties.path().node.csvParseSync);

//// initialize variables
var lookups = [];

//// methods
function buildMasterPartNumRelatedLookups() {
    var lookupFilePath = environmentProperties.path().catman.rootDirectory
        + systemProperties.path().catman.lookupDirectory
        + systemProperties.path().lookups.masterPartNumbers;

    var rawLookupData = csvsync(fs.readFileSync(lookupFilePath).toString(), {
        delimiter: constants.DEFAULT_DELIMITER,
        columns: null
    });

    lookups.masterPartNumbers = [];
    lookups.catentryParents = [];
    lookups.catentryChilds = [];
    lookups.catentryMasterCategories = [];
    lookups.catentryUrlKeywords = []; //TBD

    rawLookupData.forEach(function (eachLookupData) {
        var partNumber = eachLookupData[0];
        var masterCategory = eachLookupData[1];
        var parent = eachLookupData[3];

        lookups.masterPartNumbers.push(partNumber);
        lookups.catentryParents[partNumber] = parent;
        lookups.catentryMasterCategories[partNumber] = masterCategory;

        if (!genericUtil.isUndefined(parent) && !genericUtil.isTrimmedEmptyString(parent))  {
            if (genericUtil.isUndefined(lookups.catentryChilds[parent])) {
                lookups.catentryChilds[parent] = [];
            }

            lookups.catentryChilds[parent].push(partNumber);
        }
    });
}

function buildAttributeDictionaryLookup() {
    var lookupFilePath = environmentProperties.path().catman.rootDirectory
        + systemProperties.path().catman.lookupDirectory
        + systemProperties.path().lookups.attrDictionary;

    var parsedDataArray = csvsync(fs.readFileSync(lookupFilePath).toString(), {
        delimiter: constants.DEFAULT_DELIMITER,
        columns: true
    });

    lookups.attributeDictionary = {};

    parsedDataArray.forEach(function (eachParsedData) {
        lookups.attributeDictionary[eachParsedData.Identifier] = eachParsedData;
    });
}

function buildManageAttrExportAttrDictionaryLookup() {
    var lookupFilePath = environmentProperties.path().catman.rootDirectory
        + systemProperties.path().catman.requestsDirectory 
        + systemProperties.path().catman.workspaceAttributesAndAttrValues 
        + systemProperties.path().catman.wrkspcResource 
        + systemProperties.path().lookups.exportAttrDictionary;

    var parsedDataArray = csvsync(fs.readFileSync(lookupFilePath).toString(), {
        delimiter: constants.DEFAULT_DELIMITER,
        columns: true
    });

    lookups.mngAttrExportAttrDictionary = {};

    parsedDataArray.forEach(function (eachParsedData) {
        lookups.mngAttrExportAttrDictionary[eachParsedData.Identifier] = eachParsedData;
    });
}

function buildManageCategoryExportLookups() {
    var lookupFilePath = environmentProperties.path().catman.rootDirectory
        + systemProperties.path().catman.requestsDirectory 
        + systemProperties.path().catman.workspaceCategories 
        + systemProperties.path().catman.wrkspcResource 
        + systemProperties.path().lookups.exportCategoryLookup;

    var parsedDataArray = csvsync(fs.readFileSync(lookupFilePath).toString(), {
        delimiter: constants.DEFAULT_DELIMITER,
        columns: true
    });

    lookups.mngCategoryExportLookups = {};

    parsedDataArray.forEach(function (eachParsedData) {
        if (genericUtil.isUndefined(lookups.mngCategoryExportLookups[eachParsedData.Identifier])){
            lookups.mngCategoryExportLookups[eachParsedData.Identifier] = {};
        }
        lookups.mngCategoryExportLookups[eachParsedData.Identifier][eachParsedData['Parent Identifier']] = eachParsedData;
    });
}

function buildAttributeValuesDictionaryLookup() {
    var lookupFilePath = environmentProperties.path().catman.rootDirectory
        + systemProperties.path().catman.lookupDirectory
        + systemProperties.path().lookups.attrValDictionary;

    var parsedDataArray = csvsync(fs.readFileSync(lookupFilePath).toString(), {
        delimiter: constants.DEFAULT_DELIMITER,
        columns: true
    });

    lookups.attributeValuesDictionary = {};

    parsedDataArray.forEach(function (eachParsedData) {
        if (genericUtil.isUndefined(lookups.attributeValuesDictionary[eachParsedData.Identifier])) {
            lookups.attributeValuesDictionary[eachParsedData.Identifier] = {};
        }
        
        lookups.attributeValuesDictionary[eachParsedData.Identifier][eachParsedData.ValueIdentifier] = eachParsedData;
    });
}

function buildManageAttrExportAttrValDictionaryLookup() {
    var lookupFilePath = environmentProperties.path().catman.rootDirectory
        + systemProperties.path().catman.requestsDirectory 
        + systemProperties.path().catman.workspaceAttributesAndAttrValues 
        + systemProperties.path().catman.wrkspcResource 
        + systemProperties.path().lookups.exportAttrValDictionary;

    var parsedDataArray = csvsync(fs.readFileSync(lookupFilePath).toString(), {
        delimiter: constants.DEFAULT_DELIMITER,
        columns: true
    });
    
    lookups.mngAttrExportAttrValDictionary = {};

    parsedDataArray.forEach(function (eachParsedData) {
        if (genericUtil.isUndefined(lookups.mngAttrExportAttrValDictionary[eachParsedData.Identifier])) {
            lookups.mngAttrExportAttrValDictionary[eachParsedData.Identifier] = {};
        }
        
        lookups.mngAttrExportAttrValDictionary[eachParsedData.Identifier][eachParsedData.ValueIdentifier] = eachParsedData;
    });
}

function buildCtaMapLookup() {
    var lookupFilePath = environmentProperties.path().catman.rootDirectory
        + systemProperties.path().catman.lookupDirectory
        + systemProperties.path().lookups.ctaMapKeys;
    
    var parsedDataArray = csvsync(fs.readFileSync(lookupFilePath).toString(), {
        delimiter: constants.DEFAULT_DELIMITER,
        columns: true
    });

    lookups.ctaMap = {};

    parsedDataArray.forEach(function (eachParsedData) {
        lookups.ctaMap[eachParsedData.value] = eachParsedData;
    });
}

function buildUBeltMapLookup() {
    var lookupFilePath = environmentProperties.path().catman.rootDirectory
        + systemProperties.path().catman.lookupDirectory
        + systemProperties.path().lookups.ubeltMapKeys;
    
    var parsedDataArray = csvsync(fs.readFileSync(lookupFilePath).toString(), {
        delimiter: constants.DEFAULT_DELIMITER,
        columns: true
    });

    lookups.ubeltMap = {};

    parsedDataArray.forEach(function (eachParsedData) {
        lookups.ubeltMap[eachParsedData.value] = eachParsedData;
    });
}

function buildAttributeDictionaryHeadersLookup() {
    var lookupFilePath = environmentProperties.path().catman.rootDirectory
        + systemProperties.path().catman.lookupDirectory
        + systemProperties.path().lookups.attrDictionary;

    var parsedDataArray = csvsync(fs.readFileSync(lookupFilePath).toString(), {
        delimiter: constants.DEFAULT_DELIMITER,
        columns: true
    });

    lookups.attributeDictionaryHeaders = [];

    for (var header in parsedDataArray[0]) {
        lookups.attributeDictionaryHeaders.push(header);
    }
}

function buildAttrValDictionaryHeadersLookup() {
    var lookupFilePath = environmentProperties.path().catman.rootDirectory
        + systemProperties.path().catman.lookupDirectory
        + systemProperties.path().lookups.attrValDictionary;

    var parsedDataArray = csvsync(fs.readFileSync(lookupFilePath).toString(), {
        delimiter: constants.DEFAULT_DELIMITER,
        columns: true
    });

    lookups.attrValDictionaryHeaders = [];

    for (var header in parsedDataArray[0]) {
        lookups.attrValDictionaryHeaders.push(header);
    }
}

function buildRequestsLookup(lookupFilePath) {
    lookups.requests = csvsync(fs.readFileSync(lookupFilePath).toString(), {
        delimiter: constants.CHAR_PIPE,
        columns: null
    });
}

function buildTransformRequestsLookup(lookupFileName) {
    var lookupFilePath = environmentProperties.path().catman.rootDirectory
        + systemProperties.path().catman.workspaceDefault
        + systemProperties.path().catman.wrkspcResource
        + lookupFileName;

    var lookUpFileExist = fs.existsSync(lookupFilePath);

    if (lookUpFileExist) {
        lookups.transformRequests = csvsync(fs.readFileSync(lookupFilePath).toString(), {
            delimiter: constants.CHAR_PIPE,
            columns: null
        });
    } else {
        lookups.singleCatEntrySalesCategoriesLookup = [];
    }
}

function buildInvalidTransformRequestsLookup(lookupFileName) {
    var lookupFilePath = environmentProperties.path().catman.rootDirectory
        + systemProperties.path().catman.workspaceDefault
        + systemProperties.path().catman.wrkspcResource
        + lookupFileName;

    lookups.invalidTransformRequests = csvsync(fs.readFileSync(lookupFilePath).toString(), {
        delimiter: constants.CHAR_PIPE,
        columns: null
    });
}

function buildFullEMRExportSpecialAttributesLookups(lookupFilePath) {
    var counter = 0;
    var isLastEntry = false;
    var parsedDataArray = csvsync(fs.readFileSync(lookupFilePath).toString(), {
        delimiter: constants.DEFAULT_DELIMITER,
        columns: true
    });

    lookups.fullEMRExportSpecialAttributes = [];

    parsedDataArray.forEach(function (eachParsedData) {
        counter++;
        if (counter == parsedDataArray.length) {
            isLastEntry = true;
        }
        eachParsedData['isLastEntry'] = isLastEntry;

        lookups.fullEMRExportSpecialAttributes[eachParsedData.Code] = eachParsedData;
    });
}

function buildFullEMRExportOthersAttributesLookups(lookupFilePath) {
    var counter = 0;
    var isLastEntry = false;
    var parsedDataArray = csvsync(fs.readFileSync(lookupFilePath).toString(), {
        delimiter: constants.DEFAULT_DELIMITER,
        columns: true
    });

    lookups.fullEMRExportOthersAttributes = [];

    parsedDataArray.forEach(function (eachParsedData) {
        counter++;
        if (counter == parsedDataArray.length) {
            isLastEntry = true;
        }
        eachParsedData['isLastEntry'] = isLastEntry;

        lookups.fullEMRExportOthersAttributes[eachParsedData.Code] = eachParsedData;
    });
}

function buildManageAttributesSummaryLookup() {
    lookups.manageAttributesSummary = {
        attrUpdatesExists: false,
        attrValUpdatesExists: false,
        ctaUpdatesExists: false,
        ubeltUpdatesExists: false
    };
}

function buildSingleCatEntrySalesCategoriesLookup(partNumber) {
    var lookupFilePath = environmentProperties.path().catman.rootDirectory
        + systemProperties.path().catman.workspaceDefault
        + systemProperties.path().catman.wrkspcResource
        + systemProperties.path().catman.wrkspcDefaultDataExtract
        + applicationProperties.path().dxdl.iokey.catentrysalescategories
        + constants.CHAR_HYPHEN
        + genericUtil.convertReferenceForFileNaming(partNumber)
        + constants.FILE_EXT_CSV;

    var lookUpFileExist = fs.existsSync(lookupFilePath);

    if (lookUpFileExist) {
        lookups.singleCatEntrySalesCategoriesLookup = csvsync(fs.readFileSync(lookupFilePath).toString(), {
            delimiter: constants.DEFAULT_DELIMITER,
            columns: true
        });
    } else {
        lookups.singleCatEntrySalesCategoriesLookup = [];
    }
}

function buildSingleCatEntryAttributesLookup(partNumber) {
    var lookupFilePath = environmentProperties.path().catman.rootDirectory
        + systemProperties.path().catman.workspaceDefault
        + systemProperties.path().catman.wrkspcResource
        + systemProperties.path().catman.wrkspcAttrExtract
        + applicationProperties.path().dxdl.iokey.catentryattributes
        + constants.CHAR_HYPHEN
        + genericUtil.convertReferenceForFileNaming(partNumber)
        + constants.FILE_EXT_CSV;

    var lookUpFileExist = fs.existsSync(lookupFilePath);

    if (lookUpFileExist) {
        lookups.singleCatEntryAttributesLookup = csvsync(fs.readFileSync(lookupFilePath).toString(), {
            delimiter: constants.DEFAULT_DELIMITER,
            columns: true
        });
    } else {
        lookups.singleCatEntryAttributesLookup = [];
    }
}

function buildMasterSalesCategoryLookup() {
    var lookupFilePath = environmentProperties.path().catman.rootDirectory
        + systemProperties.path().catman.lookupDirectory
        + systemProperties.path().lookups.masterSalesCategory;

    var parsedDataArray = csvsync(fs.readFileSync(lookupFilePath).toString(), {
        delimiter: constants.DEFAULT_DELIMITER,
        columns: true
    });

    lookups.masterSalesCategory = {};

    parsedDataArray.forEach(function (eachParsedData) {
        if (genericUtil.isUndefined(lookups.masterSalesCategory[eachParsedData.Identifier])){
            lookups.masterSalesCategory[eachParsedData.Identifier] = {};
        }
        lookups.masterSalesCategory[eachParsedData.Identifier][eachParsedData['Parent Identifier']] = eachParsedData;
    });
}

function buildMasterSalesCategoryHeadersLookup() {
    var lookupFilePath = environmentProperties.path().catman.rootDirectory
        + systemProperties.path().catman.lookupDirectory
        + systemProperties.path().lookups.masterSalesCategory;

    var parsedDataArray = csvsync(fs.readFileSync(lookupFilePath).toString(), {
        delimiter: constants.DEFAULT_DELIMITER,
        columns: true
    });

    lookups.masterSalesCategoryHeaders = [];

    for (var header in parsedDataArray[0]) {
        lookups.masterSalesCategoryHeaders.push(header);
    }
}

function buildManageCategorySummaryLookup() {
    lookups.manageCategorySummary = {
        categoryUpdatesExists: false,
    };
}


//// exported functions
exports.getLookups = function() {
    return lookups;
}

exports.setLookups = function(lookupsExt) {
    lookups = lookupsExt;
}

exports.setEnvironmentProperties = function(environment) {
    environmentProperties = propertiesReader.getEnvironmentProperties(environment);
    return this;
}

//// normal lookup csvs
exports.getMasterPartNumsLookup = function() {
    if (genericUtil.isUndefined(lookups.masterPartNumbers)) {
        buildMasterPartNumRelatedLookups();
    }
    return lookups.masterPartNumbers;
}

exports.getCatEntryParentsLookup = function() {
    if (genericUtil.isUndefined(lookups.catentryParents)) {
        buildMasterPartNumRelatedLookups();
    }
    return lookups.catentryParents;
}

exports.getCatEntryChildsLookup = function() {
    if (genericUtil.isUndefined(lookups.catentryChilds)) {
        buildMasterPartNumRelatedLookups();
    }
    return lookups.catentryChilds;
}

exports.getCatEntryMasterCategoriesLookup = function() {
    if (genericUtil.isUndefined(lookups.catentryMasterCategories)) {
        buildMasterPartNumRelatedLookups();
    }
    return lookups.catentryMasterCategories;
}

exports.getAttributeDictionaryLookup = function() {
    if (genericUtil.isUndefined(lookups.attributeDictionary)) {
        buildAttributeDictionaryLookup();
    }
    return lookups.attributeDictionary;
}

exports.getAttributeValuesDictionaryLookup = function() {
    if (genericUtil.isUndefined(lookups.attributeValuesDictionary)) {
        buildAttributeValuesDictionaryLookup();
    }
    return lookups.attributeValuesDictionary;
}

exports.getCtaMapLookup = function() {
    if (genericUtil.isUndefined(lookups.ctaMap)) {
        buildCtaMapLookup();
    }
    return lookups.ctaMap;
}

exports.getUBeltMapLookup = function() {
    if (genericUtil.isUndefined(lookups.ubeltMap)) {
        buildUBeltMapLookup();
    }
    return lookups.ubeltMap;
}

exports.getMasterSalesCategoryLookup = function() {
    if (genericUtil.isUndefined(lookups.masterSalesCategory)) {
        buildMasterSalesCategoryLookup();
    }
    return lookups.masterSalesCategory;
}
//// extended lookups
exports.getManageAttrExportAttrDictionary = function() {
    if (genericUtil.isUndefined(lookups.mngAttrExportAttrDictionary)) {
        buildManageAttrExportAttrDictionaryLookup();
    }
    return lookups.mngAttrExportAttrDictionary;
}

exports.getManageAttrExportAttrValDictionary = function() {
    if (genericUtil.isUndefined(lookups.mngAttrExportAttrValDictionary)) {
        buildManageAttrExportAttrValDictionaryLookup();
    }
    return lookups.mngAttrExportAttrValDictionary;
}

exports.getManageCategoryExportLookups = function() {
    if (genericUtil.isUndefined(lookups.mngCategoryExportLookups)) {
        buildManageCategoryExportLookups();
    }
    return lookups.mngCategoryExportLookups;
}

//// header lookups
exports.getAttributeDictionaryHeadersLookup = function() {
    if (genericUtil.isUndefined(lookups.attributeDictionaryHeaders)) {
        buildAttributeDictionaryHeadersLookup();
    }
    return lookups.attributeDictionaryHeaders;
}

exports.getAttrValDictionaryHeadersLookup = function() {
    if (genericUtil.isUndefined(lookups.attrValDictionaryHeaders)) {
        buildAttrValDictionaryHeadersLookup();
    }
    return lookups.attrValDictionaryHeaders;
}

// reference files lookups
exports.getRequestsLookup = function(lookupFilePath) {
    if (genericUtil.isUndefined(lookups.requests)) {
        buildRequestsLookup(lookupFilePath);
    }
    return lookups.requests;
}

exports.getTransformRequestsLookup = function(lookupFileName) {
    if (genericUtil.isUndefined(lookups.transformRequests)) {
        buildTransformRequestsLookup(lookupFileName);
    }
    return lookups.transformRequests;
}

exports.getInvalidTransformRequestsLookup = function(lookupFileName) {
    if (genericUtil.isUndefined(lookups.invalidTransformRequests)) {
        buildInvalidTransformRequestsLookup(lookupFileName);
    }
    return lookups.invalidTransformRequests;
}

exports.getMasterSalesCategoryHeadersLookup = function() {
    if (genericUtil.isUndefined(lookups.masterSalesCategoryHeaders)) {
        buildMasterSalesCategoryHeadersLookup();
    }
    return lookups.masterSalesCategoryHeaders;
}

//// special lookup csvs/ reference files
exports.getFullEMRExportSpecialAttributesLookup = function(lookupFilePath) {
    buildFullEMRExportSpecialAttributesLookups(lookupFilePath);
    return lookups.fullEMRExportSpecialAttributes;
}

exports.getFullEMRExportOthersAttributesLookup = function(lookupFilePath) {
    buildFullEMRExportOthersAttributesLookups(lookupFilePath);
    return lookups.fullEMRExportOthersAttributes;
}

exports.getManageAttributesSummaryLookup = function() {
    if (genericUtil.isUndefined(lookups.manageAttributesSummary)) {
        buildManageAttributesSummaryLookup();
    }
    return lookups.manageAttributesSummary;
}

exports.getSingleCatEntrySalesCategoriesLookup = function(partNumber) {
    if (genericUtil.isUndefined(lookups.singleCatEntrySalesCategoriesLookup)
        || genericUtil.isEmptyArray(lookups.singleCatEntrySalesCategoriesLookup) 
        || lookups.singleCatEntrySalesCategoriesLookup[0].PartNumber != partNumber) {
            buildSingleCatEntrySalesCategoriesLookup(partNumber);
    }
    
    return lookups.singleCatEntrySalesCategoriesLookup;
}

exports.getSingleCatEntryAttributesLookup = function(partNumber) {
    if (genericUtil.isUndefined(lookups.singleCatEntryAttributesLookup) 
        || genericUtil.isEmptyArray(lookups.singleCatEntryAttributesLookup)
        || lookups.singleCatEntryAttributesLookup[0].PartNumber != partNumber) {
            buildSingleCatEntryAttributesLookup(partNumber);
    }
    
    return lookups.singleCatEntryAttributesLookup;
}

exports.getManageCategorySummaryLookup = function() {
    if (genericUtil.isUndefined(lookups.manageCategorySummary)) {
        buildManageCategorySummaryLookup();
    }
    return lookups.manageCategorySummary;
}

//// lookups with no initial values
exports.getManageAttributesUsageUpdatesLookup = function() {
    if (genericUtil.isUndefined(lookups.manageAttributesUsageUpdates)) {
        lookups.manageAttributesUsageUpdates = [];
    }
    return lookups.manageAttributesUsageUpdates;
}

exports.getManageAttributesSearchableUpdatesLookup = function() {
    if (genericUtil.isUndefined(lookups.manageAttributesSearchableUpdates)) {
        lookups.manageAttributesSearchableUpdates = [];
    }
    return lookups.manageAttributesSearchableUpdates;
}

exports.getManageAttributesDeletionLookup = function() {
    if (genericUtil.isUndefined(lookups.manageAttributesDeletion)) {
        lookups.manageAttributesDeletion = [];
    }
    return lookups.manageAttributesDeletion;
}

exports.getManageAttributeValuesDeletionLookup = function() {
    if (genericUtil.isUndefined(lookups.manageAttributesValuesDeletion)) {
        lookups.manageAttributesValuesDeletion = [];
    }
    return lookups.manageAttributesValuesDeletion;
}

exports.getManageAttributesAttrValUpdatesLookup = function() {
    if (genericUtil.isUndefined(lookups.manageAttributesAttrValUpdates)) {
        lookups.manageAttributesAttrValUpdates = [];
    }
    return lookups.manageAttributesAttrValUpdates;
}

exports.getManageAttributesDatatypeForUpdateLookup = function() {
    if (genericUtil.isUndefined(lookups.manageAttributesDatatypeForUpdate)) {
        lookups.manageAttributesDatatypeForUpdate = [];
    }
    return lookups.manageAttributesDatatypeForUpdate;
}

exports.getManageAttributesDatatypeForDeleteLookup = function() {
    if (genericUtil.isUndefined(lookups.manageAttributesDatatypeForDelete)) {
        lookups.manageAttributesDatatypeForDelete = [];
    }
    return lookups.manageAttributesDatatypeForDelete;
}

exports.getManageCategoryUrlKeywordUpdatesLookup = function() {
    if (genericUtil.isUndefined(lookups.manageCategoryUrlKeywordUpdates)) {
        lookups.manageCategoryUrlKeywordUpdates = [];
    }
    return lookups.manageCategoryUrlKeywordUpdates;
}

exports.getManageCategoryFacetUpdatesLookup = function() {
    if (genericUtil.isUndefined(lookups.manageCategoryFacetUpdates)) {
        lookups.manageCategoryFacetUpdates = [];
    }
    return lookups.manageCategoryFacetUpdates;
}

exports.getManageCategoryDeletionLookup = function() {
    if (genericUtil.isUndefined(lookups.manageCategoryDeletion)) {
        lookups.manageCategoryDeletion = [];
    }
    return lookups.manageCategoryDeletion;
}

exports.getManageCategoryStoreLookup = function(){
    if (genericUtil.isUndefined(lookups.manageCategoryStore)) {
        lookups.manageCategoryStore = [];
    }
    return lookups.manageCategoryStore
}