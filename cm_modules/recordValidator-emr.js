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
var dataHelper = require(cmModulesPath + systemProperties.path().catman.dataHelper);

/*
 * exported functions
 */

exports.validate = function(data,lookups, jsonProperties, productCreate, lookupsBuilder) {
	
	var validation = {
		isValid: true,
		isWarning: false,
		errorMessages: [],
		warningMessages: []
	};

	//test for the existence of Display to customers US, if it is not present and the Display to customers is present,
	//set the value of Display to customers US to Display to customers
	var displayToCustomerUs = data['Display to customers US'];
	if(displayToCustomerUs == undefined){
		displayToCustomerUs = data['Display to customers'];
		if (displayToCustomerUs !== undefined && displayToCustomerUs.trim() !== '')
		{
			data['Display to customers US'] = data['Display to customers'];
		}
	}

	validateProductTransformDataloadHeaders(data, applicationProperties.path().catman.headermap.fullemrexportbasefields, lookupsBuilder, validation);

	validateStores(data, validation);

	if (!validation.isValid) {
		//skip remainder of validation for this record as it is required for lookups
		return validation;
	}


	if (isDeprecatedLocale(data, jsonProperties)) {
		//validate attribute dictionary attributes and allowed values
		//attributeDictionaryDeprecatedLocaleValidation(data,lookups,validation,jsonProperties); // to display warnings
		attributeDictionaryDeprecatedLocaleValidation(data, lookups, validation, jsonProperties)
	} else {
		//validate attribute dictionary attributes and allowed values
		attributeDictionaryValidation(data, lookups, validation, productCreate);

		//validate Parent-Child relationship
		//comment the call to function as there is already a call below
		//validateParent(data, lookups, validation);

		//validate UNSPSC
		validateUNSPSC(data, validation);

		//validate Hidden Product Family Category
		validateHiddenProductFamilyCategory(data, lookups, validation);
	}

    // check for illegal characters
    illegalCharacters(data, validation);

    // check if new or existing product
    //var isNewProd = isNewProduct(data,lookups,validation);
    //console.log('New Product? ' + isNewProd);

    //validations performed Commerce fields(i.e. fields which are not attributes in Commerce)
    dataDrivenValidations(data, lookups,validation,productCreate);

    // validate if record type is 'Product' then parent category must be specified
    // validate if record type is 'SKU' and parent category is specified, then parent product must be empty -- SKU is singleton
    // validate if record type is 'SKU' and parent product is specified, then parent cateogry must be empty -- SKU is not a singleton
    // validate Master Catalog Category is correct
    // validate Sales Catalog Category is correct

    //Locale validation()
    validateLocale(data, validation,jsonProperties, productCreate);

	//TBD: code refactoring - duplicate validation?
	// Checking for the Master Catalog Category Exist in the Master list
	validateMasterCatalogCategory(data, lookups,validation);

	//Checking for the Sales Catalog Category Exist in the Master list
	validateSalesCatalogCategory(data, lookups, validation);

	//perform required validations for catalog entry type support
	validateCatalogEntryType(data, validation, jsonProperties);

	//validate Parent-Child relationship
	validateParent(data, lookups, validation, constants.DATALOAD_MODE_UPDATE);

	//TBD: code refactoring - duplicate validation?
	//validate Master Catalog for the Product
	validateProductMasterCatalog(data, lookups,validation,productCreate);

	//validate URL Keyword
	validateURLKeyword(data,lookups,validation,productCreate,jsonProperties);

	//validate PartNumber
	validatePartNumber(data, validation);

    return validation;
};

exports.validateRowDataForFullReplace = function(rowData, lookups, lookupBuilder, jsonProperties) {
	var dataLocaleName = rowData[constants.CSV_HEADER_LOCALE];
	var dataCode = rowData[constants.CSV_HEADER_CODE];
	var dataCatEntryType = rowData[constants.CSV_HEADER_CATENTRY_TYPE];
	var dataMftrPartNumber = rowData[constants.CSV_HEADER_MFTR_PART_NUM];
	var dataMftr = rowData[constants.CSV_HEADER_MFTR];
	var isNewItem = false;

	var partNumber = dataHelper.getPartNumber(dataCode, dataCatEntryType, dataMftrPartNumber, dataMftr);

	var validation = {
		isValid: true,
		isWarning: false,
		errorMessages: [],
		warningMessages: []
	};
	
	validateProductTransformDataloadHeaders(rowData, applicationProperties.path().catman.headermap.fullemrexportbasefields, lookupBuilder, validation);

	validateStores(rowData, validation);

	if (validation.isValid) {
		validateLocale(rowData, validation, jsonProperties, isNewItem);

		// for default locale
		if (dataLocaleName == constants.DEFAULT_LOCALE_NAME) {
			//TMP: comments - validateMasterCatalogCategory and validateProductMasterCatalog
			validateMasterCategory(rowData, partNumber, isNewItem, validation, lookups, lookupBuilder, constants.DATALOAD_MODE_REPLACE);
			//TBD: code refactoring - for improvement - name it validateSalesCategories()
			validateSalesCatalogCategory(rowData, lookups, validation);
			//TBD: code refactoring - for improvement
			validateUNSPSC(rowData, validation);
			//TBD: code refactoring - for improvement
			validateHiddenProductFamilyCategory(rowData, lookups, validation);
		}

		//TBD: code refactoring - for improvement
		illegalCharacters(rowData, validation);
		//TBD: code refactoring - for improvement
		validateCatalogEntryType(rowData, validation, jsonProperties);
		//TBD: code refactoring - for improvement
		validatePartNumber(rowData, validation);
		//TBD: code refactoring - for improvement
		validateParent(rowData, lookups, validation, constants.DATALOAD_MODE_REPLACE);

		//TMP: comments - dataDrivenValidations
		//TBD: for review - writer still support authoring of base field desc values for deplrecated locales
		validateBaseFields(rowData, isNewItem, validation, lookups);
		
		//TMP: comments - attributeDictionaryDeprecatedLocaleValidation
		//TMP: comments - attributeDictionaryValidation
		validateAttributes(rowData, dataLocaleName, isNewItem, validation, lookups, constants.DATALOAD_MODE_REPLACE);
		validateSpecialAttributes(rowData, dataLocaleName, validation, lookups);
	}

	return validation;
};

exports.validateRowDataForAttrDeletion = function(rowData, lookupsBuilder) {
	var validation = {
		isValid: true,
		isWarning: false,
		errorMessages: [],
		warningMessages: []
	};

	validateManageAttrHeaders(rowData, applicationProperties.path().catman.headermap.manageattr, validation);

	validateAttributeIdentifierTMP(rowData[constants.CSV_HEADER_ATTRIDENTIFIER], 
		lookupsBuilder.getAttributeDictionaryLookup(), validation, 
		applicationProperties.path().manageattr.runrequestcode.attrDeletion);
		
	return validation;
}

exports.validateRowDataForAttrSettingsChange = function(rowData, lookupsBuilder) {
	var validation = {
		isValid: true,
		isWarning: false,
		errorMessages: [],
		warningMessages: []
	};

	validateManageAttrHeaders(rowData, applicationProperties.path().catman.headermap.manageattr, validation);
	
	validateStores(rowData, validation);

	if (validation.isValid) {
		validateAttributeIdentifierTMP(rowData[constants.CSV_HEADER_ATTRIDENTIFIER], 
			lookupsBuilder.getAttributeDictionaryLookup(), validation, 
			applicationProperties.path().manageattr.runrequestcode.attrSettingsChange);

		validateSequenceTMP(rowData[constants.CSV_HEADER_SEQUENCE], validation, 
			applicationProperties.path().manageattr.runrequestcode.attrSettingsChange);
		
		validateHeaderName(rowData[constants.CSV_HEADER_HEADERNAME], validation, 
			applicationProperties.path().manageattr.runrequestcode.attrSettingsChange);

		validateAttrDataType(rowData, validation, 
			applicationProperties.path().manageattr.runrequestcode.attrSettingsChange);
	}

	return validation;
};

exports.validateRowDataForAttrAddition = function(rowData, lookupsBuilder) {
	var validation = {
		isValid: true,
		isWarning: false,
		errorMessages: [],
		warningMessages: []
	};

	validateManageAttrHeaders(rowData, applicationProperties.path().catman.headermap.manageattr, validation);

	validateStores(rowData, validation);

	if (validation.isValid) {
		validateAttributeIdentifierTMP(rowData[constants.CSV_HEADER_ATTRIDENTIFIER], 
			lookupsBuilder.getAttributeDictionaryLookup(), validation, 
			applicationProperties.path().manageattr.runrequestcode.attrAddition);

		validateSequenceTMP(rowData[constants.CSV_HEADER_SEQUENCE], validation, 
			applicationProperties.path().manageattr.runrequestcode.attrAddition);

		validateName(rowData[constants.CSV_HEADER_DISPLAYNAME], validation, 
			applicationProperties.path().manageattr.runrequestcode.attrAddition);
		
		validateHeaderName(rowData[constants.CSV_HEADER_HEADERNAME], validation, 
			applicationProperties.path().manageattr.runrequestcode.attrAddition);

		validateValueUsage(rowData[constants.CSV_HEADER_VALUEUSAGE], validation, 
			applicationProperties.path().manageattr.runrequestcode.attrAddition);

		validateValueScope(rowData[constants.CSV_HEADER_VALUESCOPE], validation, 
			applicationProperties.path().manageattr.runrequestcode.attrAddition);
		
		validateAttrDataType(rowData, validation, 
			applicationProperties.path().manageattr.runrequestcode.attrAddition);
	}

	return validation;
}

exports.validateRowDataForAttrValChange = function(rowData, lookupsBuilder) {
	var validation = {
		isValid: true,
		isWarning: false,
		errorMessages: [],
		warningMessages: []
	};

	var attrIdentifier = rowData[constants.CSV_HEADER_ATTRIDENTIFIER];

	validateManageAttrValHeaders(rowData, validation);

	validateAttributeIdentifierTMP(attrIdentifier, 
		lookupsBuilder.getAttributeDictionaryLookup(), validation, 
		applicationProperties.path().manageattr.runrequestcode.attrvalChange);

	validateAttributeValue(rowData[constants.CSV_HEADER_CURRENTVALUE], 
		lookupsBuilder.getAttributeValuesDictionaryLookup()[attrIdentifier], validation, 
		applicationProperties.path().manageattr.runrequestcode.attrvalChange);
	
	return validation;
}

exports.validateRowDataForAttrValDeletion = function(rowData, lookupsBuilder) {
	var validation = {
		isValid: true,
		isWarning: false,
		errorMessages: [],
		warningMessages: []
	};

	var attrIdentifier = rowData[constants.CSV_HEADER_ATTRIDENTIFIER];

	validateManageAttrValHeaders(rowData, validation);

	validateAttributeIdentifierTMP(attrIdentifier, 
		lookupsBuilder.getAttributeDictionaryLookup(), validation, 
		applicationProperties.path().manageattr.runrequestcode.attrvalDeletion);

	validateAttributeValue(rowData[constants.CSV_HEADER_CURRENTVALUE], 
		lookupsBuilder.getAttributeValuesDictionaryLookup()[attrIdentifier], validation, 
		applicationProperties.path().manageattr.runrequestcode.attrvalDeletion);

	return validation;
}

exports.validateRowDataForAttrValAddition = function(rowData, lookupsBuilder) {
	var validation = {
		isValid: true,
		isWarning: false,
		errorMessages: [],
		warningMessages: []
	};

	var attrIdentifier = rowData[constants.CSV_HEADER_ATTRIDENTIFIER];

	validateManageAttrValHeaders(rowData, validation);

	validateAttributeIdentifierTMP(attrIdentifier, 
		lookupsBuilder.getAttributeDictionaryLookup(), validation, 
		applicationProperties.path().manageattr.runrequestcode.attrvalAddition);

	validateAttributeValue(rowData[constants.CSV_HEADER_CURRENTVALUE], 
		lookupsBuilder.getAttributeValuesDictionaryLookup()[attrIdentifier], validation, 
		applicationProperties.path().manageattr.runrequestcode.attrvalAddition);

	return validation;
}

exports.validateRowDataForCategoryUpdate = function(rowData, lookupsBuilder) {
	var validation = {
		isValid: true,
		isWarning: false,
		errorMessages: [],
		warningMessages: []
	};

	validateManageCategoryHeaders(rowData, lookupsBuilder.getMasterSalesCategoryHeadersLookup(), validation);

	validateStores(rowData, validation);

	validateCategoryType(rowData[constants.CSV_HEADER_CAT_MASTERCATALOG], 
		rowData[constants.CSV_HEADER_CAT_IDENTIFIER], validation,
		lookupsBuilder.getMasterSalesCategoryLookup(),
		applicationProperties.path().managecategory.runrequestcode.categoryUpdate);

	validateCategoryPublished(rowData[constants.CSV_HEADER_CAT_PUBLISHED], validation);

	validateCategoryIdentifier(rowData[constants.CSV_HEADER_CAT_IDENTIFIER], 
		rowData[constants.CSV_HEADER_CAT_PARENTIDENTIFIER],
		lookupsBuilder.getMasterSalesCategoryLookup(), validation, 
		applicationProperties.path().managecategory.runrequestcode.categoryUpdate);
	
	valiadateCategoryFacet(rowData[constants.CSV_HEADER_CAT_FACETMANAGEMENT], 
		lookupsBuilder.getAttributeDictionaryLookup(), validation,
		applicationProperties.path().catman.valid.ootb.categoryFacets);

	validateCategoryUrlkeyword(rowData[constants.CSV_HEADER_CAT_IDENTIFIER], 
		rowData[constants.CSV_HEADER_CAT_PARENTIDENTIFIER], rowData[constants.CSV_HEADER_CAT_URLKEYWORD],
		lookupsBuilder.getMasterSalesCategoryLookup(), validation, 
		applicationProperties.path().managecategory.runrequestcode.categoryUpdate);
	
	return validation;
}

exports.validateRowDataForCategoryAddition = function(rowData, lookupsBuilder) {
	var validation = {
		isValid: true,
		isWarning: false,
		errorMessages: [],
		warningMessages: []
	};

	validateManageCategoryHeaders(rowData, lookupsBuilder.getMasterSalesCategoryHeadersLookup(), validation);

	validateStores(rowData, validation);

	validateRequiredField(constants.CSV_HEADER_CAT_NAMEUS, rowData[constants.CSV_HEADER_CAT_NAMEUS], validation);

	validateCategoryIdentifier(rowData[constants.CSV_HEADER_CAT_IDENTIFIER], 
		rowData[constants.CSV_HEADER_CAT_PARENTIDENTIFIER],
		lookupsBuilder.getMasterSalesCategoryLookup(), validation, 
		applicationProperties.path().managecategory.runrequestcode.categoryAddition);	
			
	validateCategoryType(rowData[constants.CSV_HEADER_CAT_MASTERCATALOG], 
		rowData[constants.CSV_HEADER_CAT_IDENTIFIER], validation,
		lookupsBuilder.getMasterSalesCategoryLookup(),
		applicationProperties.path().managecategory.runrequestcode.categoryAddition);

	validateCategoryPublished(rowData[constants.CSV_HEADER_CAT_PUBLISHED], validation);

	validateMasterCategoryIdentifierFormat(rowData[constants.CSV_HEADER_CAT_MASTERCATALOG], 
		rowData[constants.CSV_HEADER_CAT_IDENTIFIER], validation);
		
	valiadateCategoryFacet(rowData[constants.CSV_HEADER_CAT_FACETMANAGEMENT], 
		lookupsBuilder.getAttributeDictionaryLookup(), validation,
		applicationProperties.path().catman.valid.ootb.categoryFacets);
	
	validateCategoryUrlkeyword(rowData[constants.CSV_HEADER_CAT_IDENTIFIER], 
		rowData[constants.CSV_HEADER_CAT_PARENTIDENTIFIER], rowData[constants.CSV_HEADER_CAT_URLKEYWORD],
		lookupsBuilder.getMasterSalesCategoryLookup(), validation, 
		applicationProperties.path().managecategory.runrequestcode.categoryAddition);
	
	return validation;
}

exports.validateRowDataForCategoryDeletion = function(rowData, lookupsBuilder) {
	var validation = {
		isValid: true,
		isWarning: false,
		errorMessages: [],
		warningMessages: []
	};

	validateManageCategoryHeaders(rowData, lookupsBuilder.getMasterSalesCategoryHeadersLookup(), validation);

	validateStores(rowData, validation);

	validateCategoryIdentifier(rowData[constants.CSV_HEADER_CAT_IDENTIFIER], 
		rowData[constants.CSV_HEADER_CAT_PARENTIDENTIFIER],
		lookupsBuilder.getMasterSalesCategoryLookup(), validation, 
		applicationProperties.path().managecategory.runrequestcode.categoryUpdate);

	return validation;
}

/*
 * Start of field validations
 */

//TMP: comments - coding guides compliant
//TBD: code refactoring - combi of attributeDictionaryDeprecatedLocaleValidation and attributeDictionaryValidation - pattern with writer
function validateAttributes(rowData, localeName, isNewItem, validation, lookups, dataloadMode) {
	var attrReqs = lookups.attrIdentifier['EMR'];
	var validationMessage;

	//TBD: for code refactoring - restructure lookup "attrReqs.forEach(function (eachAttrReq) {"
	for (var key in attrReqs) {
		var attrReq = attrReqs[key];
		var attrIdentifier = attrReq.Identifier;
		var headerName = attrReq.HeaderName;
		var dataAttr = rowData[headerName];
		var isRequired = false;

		if (!genericUtil.isTrimmedEmptyString(attrReq.MinOcurrences)) {
			if (parseInt(attrReq.MinOcurrences) > 0) {
				isRequired = true;
			}
		}

		// this line of code will remove Features, CTAs and UBelts
		if (!genericUtil.isUndefined(headerName) 
			&& !genericUtil.isTrimmedEmptyString(headerName)
			&& headerName != constants.CSV_HEADER_LOCALE) {
			
			if (isNewItem && isRequired) {
				applyValidationForMinimumOccurence(isNewItem, headerName, dataAttr, attrReq, validation);
			}

			if (!genericUtil.isUndefined(dataAttr)) {
				if (!genericUtil.isTrimmedEmptyString(dataAttr)) {
					var deprecatedLocaleSupportedAttrs = constants.DEPRECATED_LOCALE_SUPPORTED_ATTRS.split(constants.CHAR_PIPE);
					
					if (localeName != constants.DEFAULT_LOCALE_NAME
						&& (attrReq.MultiLang == constants.BOOLEAN_STRING_FALSE 
							|| (!genericUtil.isUndefined(attrReq.LkupType) 
								&& !genericUtil.isTrimmedEmptyString(attrReq.LkupType)))) {
						// warning for locale specific authoring attributes which are not multilanguage
						validationMessage = ' @@@ WARNING : ' + headerName + ' is not supported for locale specific authoring';
						logValidationWarningMessage(validationMessage, validation);
					} else if (dataHelper.isDeprecatedLocale(localeName, constants.LOCALES_MAPREF_LOCALENAME)
						&& !deprecatedLocaleSupportedAttrs.includes(attrIdentifier)) {
						// warning for authoring attributes not supported for deprecated locales
						validationMessage = ' @@@ WARNING : ' + headerName
							+ ' is not supported for authoring on the target locale '
							+ localeName + constants.CHAR_DOT;
						logValidationWarningMessage(validationMessage, validation);
					}

					dataAttr = dataAttr.trim();

					// apply maximum length validation
					applyValidationForMaximumLength(headerName, dataAttr, attrReq, validation);
					// apply allowed values validation
					applyValidationForAttrAllowedValues(headerName, dataAttr, lookups.attrval[attrIdentifier], attrReq, validation);
				} else {
					// if replace mode, required fields can't be blank - warning only, writer will not do anything
					if (dataloadMode == constants.DATALOAD_MODE_REPLACE && isRequired) {
						validationMessage = ' @@@ WARNING : ' + headerName + ' deletion is not allowed. ';
						logValidationWarningMessage(validationMessage, validation);
					}
				}
			}
		}
	}
}


//TMP: comments - coding guides compliant
//TBD: code refactoring - to replace attributeDictionaryValidation somewhere below
function validateSpecialAttributes(rowData, localeName, validation, lookups) {
	var validationMessage;

	for (var dataHeaderName in rowData) {
		if (requiresSpecialValidationHandling(dataHeaderName)) {
			var specialAttrValidationKey = getSpecialValidationAttributeIdentifier(dataHeaderName);

			switch (specialAttrValidationKey) {
				case 'EMR Features':
					if (dataHelper.isDeprecatedLocale(localeName, constants.LOCALES_MAPREF_LOCALENAME)) {
						validationMessage = ' @@@ WARNING : Features is not supported for authoring on the target locale '
							+ localeName + constants.CHAR_DOT;
						logValidationWarningMessage(validationMessage, validation);
					} else {
						applyFeaturesValidations(dataHeaderName, rowData, lookups, validation)
					}
					break;
				case 'EMR CallToActions':
					applyCallToActionValidations(dataHeaderName, rowData, lookups, validation);
					break;
				case 'EMR UtilityBelts':
					applyUtilityBeltValidations(dataHeaderName, rowData, lookups, validation);
					break;
				default:
					// do nothing
			}
		}
	}
}

//TMP: comments - coding guides compliant
//TBD: code refactoring - to replace dataDrivenValidations
function validateBaseFields(rowData, isNewItem, validation, lookups) {
	var defaultDataRequiredFields = ['Manufacturer', 'Manufacturer part number', 'Catalog Entry Type'];
	var baseFieldReqs = lookups.inputfielddef;
	var validationMessage;

	for (var key in baseFieldReqs) {
		var baseFieldReq = baseFieldReqs[key];

		if (baseFieldReq.Store == constants.STORE_EMR) {
			var headerName = baseFieldReq['Attribute Name'];
			var dataBaseField = rowData[headerName];
			var isRequired = false;

			if (!genericUtil.isTrimmedEmptyString(baseFieldReq.MIN_OCCURRENCE)) {
				if (parseInt(baseFieldReq.MIN_OCCURRENCE) > 0) {
					isRequired = true;
				}
			}

			if (defaultDataRequiredFields.includes(headerName) || (isNewItem && isRequired)) {
				// check for non-US header for Diplay to customer
				if ((genericUtil.isUndefined(dataBaseField) || genericUtil.isTrimmedEmptyString(dataBaseField))
					&& headerName == 'Display to customers US') {
					headerName = 'Display to customers';
					dataBaseField = rowData[headerName];
				}

				// check for occurence
				//TBD: code refactoring - check how to use applyValidationForMinimumOccurence()
				if (genericUtil.isUndefined(dataBaseField) || genericUtil.isTrimmedEmptyString(dataBaseField)) {
					validationMessage = ' @@@ ERROR : ' + headerName + ' is required and empty.';
					logValidationErrorMessage(validationMessage, validation);
				}
			}
			
			if (!genericUtil.isUndefined(dataBaseField)) {
				// check for maxlength
				//TBD: code refactoring - check how to use applyValidationForMaximumLength()
				if (genericUtil.getCharByteCount(dataBaseField) > parseInt(baseFieldReq.MAXLENGTH)) {
					validationMessage = ' @@@ ERROR : ' + headerName + ' max length is ' + baseFieldReq.MAXLENGTH;
					logValidationErrorMessage(validationMessage, validation);
				}
			}
		}
	}
}

//TMP: comments - coding guides compliant
//TBD: code refactoring - to replace validateParent()
function validateParentTMP(rowData, partNumber, isNewItem, validation, lookups, dataloadMode) {
	var dataParent = rowData[constants.CSV_HEADER_PARENT];
	var dataCatEntryType = rowData[constants.CSV_HEADER_CATENTRY_TYPE];
	var validationMessage;

	if(!genericUtil.isUndefined(dataParent) && !genericUtil.isTrimmedEmptyString(dataParent)) {
		dataParent = dataParent.trim();

		// SKU, Static Kit, Dynamic kit cannot be a parent
		if (!dataParent.includes(constants.CATENTRYTYPE_INFIX_PRODUCT) 
			&& !dataParent.includes(constants.CATENTRYTYPE_INFIX_BUNDLE) 
			&& !dataParent.includes(constants.CATENTRYTYPE_INFIX_STATICKIT) 
			&& !dataParent.includes(constants.CATENTRYTYPE_INFIX_DYNAMICKIT)) {
			
			validationMessage = ' @@@ ERROR : Invalid Parent-Child relationship. ';
			logValidationErrorMessage(validationMessage, validation);
		}

		// Bundle, Static Kit, Dynamic kit cannot have a parent
		if (dataCatEntryType == constants.CATENTRYTYPE_BUNDLE 
			|| dataCatEntryType == constants.CATENTRYTYPE_STATICKIT 
			|| dataCatEntryType == constants.CATENTRYTYPE_DYNAMICKIT) {
			
			validationMessage = ' @@@ ERROR : Invalid Parent-Child relationship. ';
			logValidationErrorMessage(validationMessage, validation);
		}

		// Product type cannot have Static Kit, Dynamic kit or another Parent type as its parent
		if (dataCatEntryType == constants.CATENTRYTYPE_PRODUCT
			&& (dataParent.includes(constants.CATENTRYTYPE_INFIX_STATICKIT) 
				|| dataParent.includes(constants.CATENTRYTYPE_INFIX_DYNAMICKIT) 
				|| dataParent.includes(constants.CATENTRYTYPE_INFIX_PRODUCT))) {
			
			validationMessage = ' @@@ ERROR : Invalid Parent-Child relationship. ';
			logValidationErrorMessage(validationMessage, validation);
		}

		//	check if the parent is an existing product
		if (genericUtil.isUndefined(lookups.mastercataloglookup[dataParent])) {
			validationMessage = ' @@@ ERROR : Parent does not exist. ';
			logValidationErrorMessage(validationMessage, validation);
		}

		if (dataloadMode != constants.DATALOAD_MODE_REPLACE) {
			// check for possible multiple parent occurence
			if (!isNewItem) {
				var currentParent = lookups.mastercatalogParent[partNumber];

				if(!genericUtil.isUndefined(currentParent) && !genericUtil.isTrimmedEmptyString(currentParent) && currentParent !== dataParent){
					validationMessage = ' @@@ ERROR : Invalid Parent-Child relationship (SKU cannot have more than one parent product). ';
					logValidationErrorMessage(validationMessage, validation);
				}
			}
		}
	}
}

//TMP: comments - coding guides compliant
// full path - initially validated by dataDrivenValidations
function validateMasterCategory(rowData, partNumber, isNewItem, validation, lookups, lookupBuilder, dataloadMode) {
	var dataMasterCategory = rowData[constants.CSV_HEADER_FULLPATH];
	var masterCategoryLookup = lookupBuilder.getCatEntryMasterCategoriesLookup();
	var validationMessage;

	if (!genericUtil.isUndefined(dataMasterCategory)) {
		if (genericUtil.isTrimmedEmptyString(dataMasterCategory)) {
			if (dataloadMode == constants.DATALOAD_MODE_REPLACE) {
				validationMessage = ' @@@ WARNING : Full Path deletion is not allowed. ';
				logValidationWarningMessage(validationMessage, validation);
			}
		} else {
			if (genericUtil.isUndefined(lookups.mastercatcategorylookup[dataMasterCategory])) {
				validationMessage = ' @@@ ERROR : ' + dataMasterCategory + ' Full Path does not exist ';
				logValidationErrorMessage(validationMessage, validation);
			} else {
				if (!isNewItem && dataloadMode != constants.DATALOAD_MODE_REPLACE) {
					if (lookups.mastercataloglookup[partNumber] != dataMasterCategory.trim()) {
						validationMessage = ' @@@ ERROR : Product is already tagged in Different Master Catalog. ';
						logValidationErrorMessage(validationMessage, validation);
					}
				}

				var dataParent = rowData[constants.CSV_HEADER_PARENT];
				if (!genericUtil.isUndefined(dataParent) && !genericUtil.isTrimmedEmptyString(dataParent)) {
					dataParent = dataParent.trim();
					var parentCatEntryMasterCategory = masterCategoryLookup[dataParent];

					if (parentCatEntryMasterCategory != dataMasterCategory) {
						validationMessage = '@@@ ERROR : Master Category assigned to SKU is different to the Master Category of Parent Product. ';
						logValidationErrorMessage(validationMessage, validation);
					}
				}
			}
		}
	}
}

// Validate Category Identifier
function validateCategoryIdentifier(inputCategoryIdentifier, inputCategoryParentIdentifier, masterSalesCategoryLookup, validation, runRequest){
	var catIdentifierLookupEntryMap = masterSalesCategoryLookup[inputCategoryIdentifier];
	var catParentLookupEntryMap = masterSalesCategoryLookup[inputCategoryParentIdentifier];
	var validationMessage;

	if (runRequest == applicationProperties.path().managecategory.runrequestcode.categoryAddition) {

		validateRequiredField(constants.CSV_HEADER_CAT_IDENTIFIER, inputCategoryIdentifier, validation);

		if (genericUtil.isUndefined(catParentLookupEntryMap) || genericUtil.isTrimmedEmptyString(catParentLookupEntryMap)) {
			validationMessage = ' @@@ ERROR: Parent Identifier is invalid. ';
	 		logValidationErrorMessage(validationMessage, validation);
		} else {
			if (!genericUtil.isUndefined(catIdentifierLookupEntryMap) && !genericUtil.isTrimmedEmptyString(catIdentifierLookupEntryMap)){
	 			var categoryLookupEntry = catIdentifierLookupEntryMap[inputCategoryParentIdentifier];
	  			if (!genericUtil.isUndefined(categoryLookupEntry)) {
		  			validationMessage = ' @@@ ERROR: Relationship already exists. ';
		   			logValidationErrorMessage(validationMessage, validation);
	  			}
  			}
		} 
	} else {
		if (genericUtil.isUndefined(catIdentifierLookupEntryMap)){
			validationMessage = ' @@@ ERROR: Category Identifier is invalid. ';
	 		logValidationErrorMessage(validationMessage, validation);
		}else if (genericUtil.isUndefined(catParentLookupEntryMap)){
			validationMessage = ' @@@ ERROR: Parent Identifier is invalid. ';
			logValidationErrorMessage(validationMessage, validation);
		} else {
			var categoryLookupEntry = catIdentifierLookupEntryMap[inputCategoryParentIdentifier];
			if (genericUtil.isUndefined(categoryLookupEntry)){
				validationMessage = ' @@@ ERROR: Relationship is invalid. ';
				logValidationErrorMessage(validationMessage, validation);
			}
		}
	}

}

// validate category urlkeyword
function validateCategoryUrlkeyword(inputCategoryIdentifier, inputCategoryParentIdentifier, inputUrlKeyword, masterSalesCategoryLookup, validation, runRequest) {
	var catIdentifierLookupEntryMap = masterSalesCategoryLookup[inputCategoryIdentifier];
	var catParentLookupEntryMap = masterSalesCategoryLookup[inputCategoryParentIdentifier];
	var validationMessage;
	var urlKeywordAreadyExists = constants.BOOLEAN_STRING_FALSE;
	var urlkeywordHeader = constants.CSV_HEADER_CAT_URLKEYWORD;

	for (var categoryId in masterSalesCategoryLookup) {
		var categoryEntries = masterSalesCategoryLookup[categoryId];
		var parentIdsArray = Object.keys(categoryEntries);
		var anyCategoryEntry = categoryEntries[parentIdsArray[0]];

		if (anyCategoryEntry['URL keyword'] == inputUrlKeyword) {
			urlKeywordAreadyExists = constants.BOOLEAN_STRING_TRUE;
		}
	}

	if (runRequest == applicationProperties.path().managecategory.runrequestcode.categoryAddition) {
		var inputUrlKeyword = inputUrlKeyword.trim();

		validateRequiredField(constants.CSV_HEADER_CAT_URLKEYWORD, inputUrlKeyword, validation);

		if (genericUtil.isUndefined(inputUrlKeyword)) {
			validationMessage = ' @@@ ERROR: URL Keyword is invalid. ';
			logValidationErrorMessage(validationMessage, validation);
		} else {
			if (inputUrlKeyword.indexOf(' ') > 0){
				validationMessage = ' @@@ ERROR: URL Keyword is invalid. ';
				logValidationErrorMessage(validationMessage, validation);
			} else if (!genericUtil.isUndefined(catIdentifierLookupEntryMap) && !genericUtil.isUndefined(catParentLookupEntryMap)) {		
				if (urlKeywordAreadyExists == constants.BOOLEAN_STRING_FALSE) {
					validationMessage = ' @@@ ERROR: URL Keyword should be reused for multiparent category. ';
					logValidationErrorMessage(validationMessage, validation);
				}
			} else if (genericUtil.isUndefined(catIdentifierLookupEntryMap) && !genericUtil.isUndefined(catParentLookupEntryMap)) {		
				if (urlKeywordAreadyExists == constants.BOOLEAN_STRING_TRUE) {
					validationMessage = ' @@@ ERROR: URL Keyword is existing and still in use. ';
					logValidationErrorMessage(validationMessage, validation);
				}
				validateSpecialCharacter(constants.CSV_HEADER_CAT_URLKEYWORD, inputUrlKeyword, validation);	
			}
		} 
	} else if (runRequest == applicationProperties.path().managecategory.runrequestcode.categoryUpdate) {

		if (!genericUtil.isUndefined(inputUrlKeyword)) {
			if (inputUrlKeyword.indexOf(' ') > 0){
				validationMessage = ' @@@ ERROR: URL Keyword is invalid. ';
				logValidationErrorMessage(validationMessage, validation);
			} else if (!genericUtil.isUndefined(catIdentifierLookupEntryMap) && !genericUtil.isUndefined(catParentLookupEntryMap)) {
				var catRelationshipMap = catIdentifierLookupEntryMap[inputCategoryParentIdentifier];
				if (!genericUtil.isUndefined(catRelationshipMap)) {
					var urlkeywordLookupEntryMap = masterSalesCategoryLookup[inputCategoryIdentifier][inputCategoryParentIdentifier][urlkeywordHeader];
					if (genericUtil.isUndefined(urlkeywordLookupEntryMap)) {
						var inputUrlKeyword = inputUrlKeyword.trim();
						if (urlKeywordAreadyExists == constants.BOOLEAN_STRING_TRUE) {
							validationMessage = ' @@@ ERROR: URL Keyword is existing and still in use. ';
							logValidationErrorMessage(validationMessage, validation);
						}
					} else if (urlkeywordLookupEntryMap != inputUrlKeyword) {
						if (urlKeywordAreadyExists == constants.BOOLEAN_STRING_TRUE) {
							validationMessage = ' @@@ ERROR: URL Keyword is existing and still in use. ';
							logValidationErrorMessage(validationMessage, validation);
						}
					}
				}
				
			}				
			validateSpecialCharacter(constants.CSV_HEADER_CAT_URLKEYWORD, inputUrlKeyword, validation);	
		}
	}
}

// validate Master Category Identifier Format
function validateMasterCategoryIdentifierFormat(inputMasterCatalog, inputCategoryIdentifier, validation) {
	var masterCategoryFormat = 'M-'
	var validationMessage;

	if (inputMasterCatalog == constants.BOOLEAN_STRING_TRUE) {
		if (!inputCategoryIdentifier.includes(masterCategoryFormat)) {
			validationMessage = ' @@@ ERROR: Master Category has wrong identifier format. ';
			logValidationErrorMessage(validationMessage, validation);
		}

	}
}

// validate Category Type Master or Sales
function validateCategoryType(inputMasterCatalog, categoryIdentifier, validation, masterSalesCategoryLookup, runRequest){
	var categoryIdentifierLookupEntryMap = masterSalesCategoryLookup[categoryIdentifier];

	if (runRequest == applicationProperties.path().managecategory.runrequestcode.categoryAddition) {
		if (genericUtil.isUndefined(inputMasterCatalog) || genericUtil.isTrimmedEmptyString(inputMasterCatalog)) {
			validationMessage = ' @@@ ERROR: Invalid Category Type. ';
			logValidationErrorMessage(validationMessage, validation);
		} else {
			validateBooleanField(constants.CSV_HEADER_CAT_MASTERCATALOG, inputMasterCatalog, validation);
		}
	} else {
		if (!genericUtil.isUndefined(inputMasterCatalog)) {
		validateBooleanField(constants.CSV_HEADER_CAT_MASTERCATALOG, inputMasterCatalog, validation);
		}
	}			
}

//validate Category Published 
function validateCategoryPublished(inputCategoryPublished, validation){
	if (!genericUtil.isUndefined(inputCategoryPublished)) {
		validateBooleanField(constants.CSV_HEADER_CAT_PUBLISHED, inputCategoryPublished, validation);	
	}
}

//validate facet management
function valiadateCategoryFacet(inputFacet, attrDictionaryLookup, validation, ootbFacets){
	
	if (!genericUtil.isUndefined(inputFacet)) {
		var facetAttribute = inputFacet.split(constants.CHAR_PIPE);
		facetAttribute.forEach(function (eachFacet) {  
			var trimFacetAttribute = eachFacet.trim();
			var attrIdArray = Object.keys(attrDictionaryLookup);
			
			if (!genericUtil.isTrimmedEmptyString(trimFacetAttribute)){
				if (trimFacetAttribute != ootbFacets){
					if (!attrIdArray.includes(trimFacetAttribute)) {
						validationMessage = ' @@@ ERROR: Invalid Facet Attribute. ';
						logValidationErrorMessage(validationMessage, validation);
					}
				}
			}			
			
		});
	}
}

//validate special character
function validateSpecialCharacter(fieldName, value, validation){
    var validationMessage;
    var specialChars = "<>@!#$%^&*()_+[]{}?:;|'\"\\,./~`=";
    var specialCharacterFound = false;
    
    if (!genericUtil.isUndefined(value) && !genericUtil.isTrimmedEmptyString(value)) {
        value.split(constants.EMPTY_STRING).forEach(function (eachChar) {
            if (specialChars.includes(eachChar)) {
                specialCharacterFound = true;
            }
        });
    }
 
    if (specialCharacterFound) {
        validationMessage = ' @@@ ERROR: ' + fieldName + ' has special character. ';
        logValidationErrorMessage(validationMessage, validation);
    }
}

//TMP: comments - coding guides compliant
//TBD: code refactoring - to replace validateAttributeIdentifier()
function validateAttributeIdentifierTMP(inputAttributeIdentifier, attrDictionaryLookup, validation, runRequest) {
	var attrLookupEntry = attrDictionaryLookup[inputAttributeIdentifier];
	var validationMessage;

	if (runRequest == applicationProperties.path().manageattr.runrequestcode.attrSettingsChange 
		|| runRequest == applicationProperties.path().manageattr.runrequestcode.attrDeletion 
		|| runRequest == applicationProperties.path().manageattr.runrequestcode.attrvalChange 
		|| runRequest == applicationProperties.path().manageattr.runrequestcode.attrvalAddition 
		|| runRequest == applicationProperties.path().manageattr.runrequestcode.attrvalDeletion) {
		if (genericUtil.isUndefined(attrLookupEntry)) {
			validationMessage = ' @@@ ERROR: Attribute Identifier is invalid. ';
			logValidationErrorMessage(validationMessage, validation);
		}
	}

	if (runRequest == applicationProperties.path().manageattr.runrequestcode.attrAddition) {
		if (!genericUtil.isUndefined(attrLookupEntry)) {
			validationMessage = ' @@@ ERROR: Attribute Identifier already exists. ';
			logValidationErrorMessage(validationMessage, validation);
		}

		validateRequiredField(constants.CSV_HEADER_ATTRIDENTIFIER, inputAttributeIdentifier, validation);
		validateAlphaNumericField(constants.CSV_HEADER_ATTRIDENTIFIER, inputAttributeIdentifier, validation);
	}
}

// Attribute Value Identifier
function validateAttributeValue(inputAttrValue, attrValDictionaryLookup, validation, runRequest) {
	var validationMessage;
	var attrValLookupEntry = dataHelper.getFieldValueLookupEntry(inputAttrValue, 'Value', attrValDictionaryLookup);;

	if (runRequest == applicationProperties.path().manageattr.runrequestcode.attrvalChange 
		|| runRequest == applicationProperties.path().manageattr.runrequestcode.attrvalDeletion) {
		if (genericUtil.isUndefined(attrValLookupEntry)) {
			validationMessage = ' @@@ ERROR: Attribute Value cannot be found. ';
			logValidationErrorMessage(validationMessage, validation);
		}
	}

	if (runRequest == applicationProperties.path().manageattr.runrequestcode.attrvalAddition) {
		if (!genericUtil.isUndefined(attrValLookupEntry)) {
			validationMessage = ' @@@ ERROR: Attribute Value already exists. ';
			logValidationErrorMessage(validationMessage, validation);
		}
	}
}

//TMP: comments - coding guides compliant
//TBD: code refactoring - to replace validateSequence()
function validateSequenceTMP(inputValue, validation, runRequest) {
	validateIntegerField(constants.CSV_HEADER_SEQUENCE, inputValue, validation);

	if (runRequest == applicationProperties.path().manageattr.runrequestcode.attrAddition) {
		validateRequiredField(constants.CSV_HEADER_SEQUENCE, inputValue, validation);
	}
}

//TMP: comments - coding guides compliant
function validateName(inputValue, validation, runRequest) {
	if (runRequest == applicationProperties.path().manageattr.runrequestcode.attrAddition) {
		validateRequiredField(constants.CSV_HEADER_DISPLAYNAME, inputValue, validation);
	}
}

//TMP: comments - coding guides compliant
function validateHeaderName(inputValue, validation, runRequest) {
	validateAlphaNumericField(constants.CSV_HEADER_HEADERNAME, inputValue, validation);
}

//TMP: comments - coding guides compliant
function validateAttrDataType(rowData, validation, runRequest) {
	var validationMessage;
	var inputDataType = rowData[constants.CSV_HEADER_DATATYPE];
	
	if (!genericUtil.isUndefined(inputDataType) && !genericUtil.isTrimmedEmptyString(inputDataType)) {
		if (inputDataType == 'Lookup Table' || inputDataType == 'String Enumeration') {
			var inputAttrValues = rowData[constants.CSV_HEADER_ATTRVALUES];

			if (genericUtil.isUndefined(inputAttrValues) || genericUtil.isTrimmedEmptyString(inputAttrValues)) {
				validationMessage = ' @@@ ERROR: Datatype requires Attribute Values. ';
				logValidationErrorMessage(validationMessage, validation);
			}
		}
	}
}

//TMP: comments - coding guides compliant
function validateValueUsage(inputValue, validation, runRequest) {
	var validationMessage;

	if (inputValue != constants.USAGE_DESCRIPTIVE && inputValue != constants.USAGE_DEFINING) {
		validationMessage = ' @@@ ERROR: ' + constants.CSV_HEADER_VALUEUSAGE + ' is invalid. ';
		logValidationErrorMessage(validationMessage, validation);
	}

	if (runRequest == applicationProperties.path().manageattr.runrequestcode.attrAddition) {
		validateRequiredField(constants.CSV_HEADER_VALUEUSAGE, inputValue, validation);
	}
}

//TMP: comments - coding guides compliant
function validateValueScope(inputValue, validation, runRequest) {
	var validationMessage;

	if (inputValue != constants.LOOKUPREF_VALSCOPE_CORE && inputValue != constants.LOOKUPREF_VALSCOPE_EXTENDED) {
		validationMessage = ' @@@ ERROR: ' + constants.CSV_HEADER_VALUESCOPE + ' is invalid. ';
		logValidationErrorMessage(validationMessage, validation);
	}

	if (runRequest == applicationProperties.path().manageattr.runrequestcode.attrAddition) {
		validateRequiredField(constants.CSV_HEADER_VALUESCOPE, inputValue, validation);
	}
}

/*
 * Start of default field reusable validations
 */

//TMP: comments - coding guides compliant
//use this validation if the only thing to check for the field is if it should NOT include special characters
function validateAlphaNumericField(fieldName, value, validation) {
	var validationMessage;

	if (!genericUtil.isAlphanumeric(value)) {
		validationMessage = ' @@@ ERROR: ' + fieldName + ' contains special characters. ';
		logValidationErrorMessage(validationMessage, validation);
	}
}

//TMP: comments - coding guides compliant
// use this validation if the only thing to check for the field is if it is not blank or undefined (required)
function validateRequiredField(fieldName, value, validation) {
	var validationMessage;

	if (genericUtil.isUndefined(value) || genericUtil.isTrimmedEmptyString(value)) { 
		validationMessage = ' @@@ ERROR: ' + fieldName + ' field is required but empty. ';
		logValidationErrorMessage(validationMessage, validation);
	}
}

//TMP: comments - coding guides compliant
// use this validation if the only thing to check for the field is if it should be an integer
function validateIntegerField(fieldName, value, validation) {
	var validationMessage;
	var convertedValue = parseInt(value);

	if (genericUtil.isUndefined(convertedValue)) { 
		validationMessage = ' @@@ ERROR: ' + fieldName + ' should be a valid whole number. ';
		logValidationErrorMessage(validationMessage, validation);
	}
}

//TMP: comments - coding guides compliant
// use this validation if the only thing to check for the field is if it should be an integer
function validateBooleanField(fieldName, value, validation) {
	var validationMessage;

	if (value.toUpperCase() != constants.BOOLEAN_STRING_TRUE 
		&& value.toUpperCase() != constants.BOOLEAN_STRING_FALSE ) { 
		validationMessage = ' @@@ ERROR: ' + fieldName + ' field should only be either TRUE or FALSE. ';
		logValidationErrorMessage(validationMessage, validation);
	}
}

/*
 * Start of supporting functions
 */


//TMP: comments - coding guides compliant
function logValidationWarningMessage(warningMessage, validation) {
	if (validation.warningMessages.indexOf(warningMessage) == -1) {
		console.log(warningMessage);
		validation.warningMessages.push(warningMessage);
	}

	//TBD: code refactoring - reduce validation to only have the messages
	validation.isWarning = true;
}

//TMP: comments - coding guides compliant
function logValidationErrorMessage(errorMessage, validation) {
	if (validation.errorMessages.indexOf(errorMessage) == -1) {
		console.log(errorMessage);
		validation.errorMessages.push(errorMessage);
	}

	//TBD: code refactoring - reduce validation to only have the messages
	validation.isValid = false;
}

/************************************************************
 * start of old functions - needs review for code refactoring
 ************************************************************/

exports.validateComponent = function(data,lookups, jsonProperties, lookupBuilder) {

	var validation = {
		isValid: true,
		isWarning: false,
		errorMessages: [],
		warningMessages: []
	};

	//validate headers
	validateProductTransformDataloadHeaders(data, applicationProperties.path().catman.headermap.fullemrexportbasefields, lookupBuilder, validation);

	//validate component code existence
	validateComponentCode(data,lookups, validation);

	//validate child code existence
	validateChildCode(data,lookups, validation);

	//validations for component type support
	validateComponentType(data,lookups, validation, jsonProperties);

	//validate Quantity
	validateQuantity(data, validation);

    // check for illegal characters
//    illegalCharacters(data,validation);


 // validate URL Keyword and Page Title are available for new locales
 // validate no errors on save in the logs

 // TODO add Related Products
 // TODO add product name and line number to error & success messages
 // TODO character turn new row bug

    return validation;
};

//TBD: code refactoring - remove all reference to this function - the appropriate function is now in dataHelper
//Returns Product/Item code needed for logging purposes in emrcatalogmanager.js.
//Returns the code by using the correct header name depending on the store
exports.getProductCode = function(data) {
	var partnumber = '';
//Trimming the partnumber
	var dataPartNumber = data['Manufacturer part number'].trim();
	var manufacturer = data['Manufacturer'].trim();

//Set the trimed values
	data['Manufacturer part number'] = dataPartNumber;
	data['Manufacturer'] = manufacturer;
	//PartNumber column
	switch (data['Catalog Entry Type']) {
	case 'Product' :
		partnumber = manufacturer+ '-P-' + dataPartNumber;
		break;
	case 'SKU' :
		partnumber = manufacturer+ '-' + dataPartNumber;
		break;
	case 'Bundle' :
		partnumber = manufacturer + '-B-' + dataPartNumber;
		break;
	case 'Static Kit' :
		partnumber = manufacturer + '-K-' + dataPartNumber;
		break;
	case 'Dynamic Kit' :
		partnumber = manufacturer+ '-D-' + dataPartNumber;
		break;
	default :
		partnumber = manufacturer + '-???-' + dataPartNumber;
	}

	return partnumber;
};

// Validate if the row has the necessar data to proceed with processing
//Returns true/false
// CatalogEntryParentCatalogGroupRelationship
exports.validateSequenceRow = function(data) {
var partnumber, parentgroupuniqueid, parentstoreidentifier, sequence, deleteproduct;
	partnumber = data['Child ID'];
	parentgroupuniqueid = data['Parent ID'];
	parentstoreidentifier = data['Store'];
	sequence = data['Sequence'];
	deleteproduct = data['Delete'];

	if (partnumber !== undefined && parentgroupuniqueid !== undefined && parentstoreidentifier !== undefined) {
		if (partnumber !== '' && parentgroupuniqueid !== '' && parentstoreidentifier !== '') {
			return true;
		}
		else {
			console.log('Invalid row detected. Child ID, Parent ID, Store  is null.');
			return false;
		}
	}
	else {
		console.log('Invalid row detected. Child ID, Parent ID, Store  is null.');
		return false;
	}
};

// Validate if the row has the necessary data to proceed with processing for attribute deletion
//Returns true/false
// CatalogEntryAttributeRelationshipDeletion
exports.validateDeletionCode = function(data) {
	var partnumber;
		partnumber = data['Deletion Code'];

		if (partnumber !== undefined) {
			if (partnumber !== '') {
				return true;
			}
			else {
				console.log('Invalid row detected. Deletion Code is null.');
				return false;
			}
		}
		else {
			console.log('Invalid row detected. Deletion Code is null.');
			return false;
		}
	};

exports.validateAttributeDeletionData = function(data,lookups, jsonProperties, lookupBuilder) {

	var validation = {
		isValid: true,
		isWarning: false,
		errorMessages: [],
		warningMessages: []
	};

	// check headers
	validateProductTransformDataloadHeaders(data, applicationProperties.path().catman.headermap.fullemrexportbasefields, lookupBuilder, validation);

	//function to determine deletion type
	var deletionType = getDeletionType(data);
	switch (deletionType) {
		case "parentSkuDeletion":
			// validate parentSkuDeletion
			validateParentAssignmentData(data, lookups, validation);
			break;
		case "hideAttributeDeletion":
			validateHiddenAttributes(data,validation);
			validateAttributeIdentifier(data['Hide SKU List Attribute'], lookups, validation);
			break;
		case "catalogEntryDeletion":
			//validate PartNumber
			validateDeletionCodeInLookup(data, lookups, validation);
			break;
		default:
				validateDeletionCodeInLookup(data, lookups, validation);
	}
    return validation;
};



exports.validateSequenceComponent = function(data, lookups, jsonProperties, lookupBuilder) {

	var validation = {
		isValid: true,
		isWarning: false,
		errorMessages: [],
		warningMessages: []
	};

	//based on the Type value validate parent code or sales catalog identifier
	var vCatalogEntryType = data['Type'];
	var vChild = 'Child ID';
	var vParent = 'Parent ID';

	validateProductTransformDataloadHeaders(data, applicationProperties.path().catman.headermap.fullemrexportbasefields, lookupBuilder, validation);
	validateSequencingType(data, validation);
	validateSequence(data, validation);
	validateStores(data, validation);

	switch (vCatalogEntryType) {
		case "Product":
			// validate PartNumber in Child ID
			validateCodeSequence(data, lookups, validation, vChild);
			// validate Sales Category in Parent ID
			validateSalesCategoryIdentifier(data, lookups, validation);
			break;
		case "SKU List":
			// validate PartNumber in Child ID
			validateCodeSequence(data, lookups, validation, vChild);
			// validate PartNumber in Parent ID
			validateCodeSequence(data, lookups, validation, vParent);
			break;
		case "Attribute":
			// validate Attribute in Child ID
			validateAttributeSequencingEnabled(data, lookups, validation);
			// validate PartNumber in Parent ID
			validateCodeSequence(data, lookups, validation, vParent);
			// validate CatEntry if Parent
			validatePartNumberParentType(data['Parent ID'], lookups, validation);
			break;
		default:
			// do nothing
	}

    return validation;
};

/*
 * validates if a certain PartNumber
 * is of Parent Catalog Entry Type
 */
function validatePartNumberParentType(partNumber, lookups, validation) {

	if (lookups.mastercataloglookup[partNumber] !== undefined) {
		if (dataHelper.getCatEntryType(partNumber) !== constants.CATENTRYTYPE_PRODUCT) {

			validation.errorMessages.push(' @@@ ERROR: ' + partNumber + ' is not of Parent Catalog Entry Type. ');
			validation.isValid = false;
		}
	}

	return validation;
}

//validates if a certain AttributeIdentifier is enabled for Attribute Sequencing
function validateAttributeSequencingEnabled(data, lookups, validation) {
	var attrIdentifier = data["Child ID"];
	var attrValidationRequirements = lookups.attrIdentifier["EMR"][attrIdentifier];

	if (!genericUtil.isUndefined(attrValidationRequirements)) {
		if (attrValidationRequirements.SequencingEnabled == "FALSE") {
			validation.errorMessages.push(' @@@ERROR : ' + attrIdentifier + ' is not supported for sequencing. ');
			validation.isValid = false;
		}
	} else {
		validation.errorMessages.push(' @@@ERROR : ' + attrIdentifier + ' is not supported for sequencing. ');
		validation.isValid = false;
	}

	return validation;
}

//Returns Child code needed for logging purposes in emrcatalogmanager.js.
exports.getCodePartNumber = function(data) {
	var childCode = '';
	//Child Code Column
	if (data['Child ID'] !== ''){
		childCode = data['Child ID'];
	}

	return childCode;
};

function validateQuantity (data, validation){

	console.log("Start validating quatity");
	var quantity = data['Quantity'];

	if (genericUtil.isUndefined(quantity)) {
		return true;
	} else {
		quantity = quantity.trim();
	}

	if(!isNaN(quantity) && (quantity !== '')){
		return true;
	} else {
		validation.errorMessages.push(" @@@ ERROR :  Non-numerical value is listed for quantity.  quantity= " + quantity);
		validation.isValid = false;
	}
}

function validateSequence(data, validation){
	var sequence = data['Sequence'];
	var deleteproduct = data['Delete'];

	// validate sequence
	if( (deleteproduct === "" || deleteproduct === undefined ) && (sequence === "" || sequence === undefined)) {
			validation.errorMessages.push(' @@@ ERROR: '+data['Code']+' Sequence is null ');
			validation.isValid = false;
	} else if (sequence !== '' &&  (deleteproduct === "" || deleteproduct === undefined )) {
		if (Number.isNaN(parseInt(sequence))){
			validation.errorMessages.push(' @@@ ERROR: '+sequence+' Sequence is invalid value');
			validation.isValid = false;
		}
	}

	// validate delete
	if(deleteproduct !== undefined){
		if (!genericUtil.isTrimmedEmptyString(deleteproduct)) {
			if(deleteproduct !== "yes" && deleteproduct !== "Yes"){
				validation.errorMessages.push(' @@@ ERROR: '+data['Code']+' Delete is invalid value (Yes, yes)');
				validation.isValid = false;
			}
		}
	}
}


function validateSalesCategoryIdentifier(data, lookups, validation){
	var salescategoryidentifier = data['Parent ID'];

//--  validate sales category identifier / parent identifier
	if (lookups.mastercatcategorylookup[salescategoryidentifier] !== undefined) {
			console.log("Sales Category Identifier exists in the Master list")
	} else {
		console.log("Sales Category Identifier does not exists in the Master list")
		validation.errorMessages.push(' @@@ ERROR: '+salescategoryidentifier + ' Sales Category Identifier does not exists. ');
		validation.isValid = false;
	}
}


function validateCodeSequence(data, lookups, validation,vHeaderType){
	console.log('Start validateCode-PartNumber');
	var partNumber;
	if (vHeaderType==='Parent ID'){
		partNumber = data['Parent ID'];
	}
	else{
		partNumber = data['Child ID'];
	}


	var maxLength = 64;
	//partNumber length validation
	if (!(partNumber === undefined) && partNumber.length > maxLength) {
		console.log('ERROR : '+ vHeaderType +' maxLength=' + maxLength + ' data=[' + partNumber + '] data length=' + partNumber.length);
        validation.errorMessages.push(" @@@ ERROR : "+ vHeaderType +" Max Length is " + maxLength);
        validation.isValid = false;
	}

	//--  validate part number
	if (lookups.mastercataloglookup[partNumber] !== undefined) {
			console.log(vHeaderType +" exists in the Master list of PartNumber")
	} else {
		console.log(vHeaderType +" does not exists in the Master list")
		validation.errorMessages.push(' @@@ ERROR: '+partNumber + ' '+ vHeaderType +' does not exists. ');
		validation.isValid = false;
	}
}

function validateSourceSequence(data, lookups, validation){
	console.log('Start validateSource-PartNumber');
	var partNumber = data['Parent Code'];

	var maxLength = 64;
	//partNumber length validation
	if (!(partNumber === undefined) && partNumber.length > maxLength) {
		console.log('ERROR : Code maxLength=' + maxLength + ' data=[' + partNumber + '] data length=' + partNumber.length);
        validation.errorMessages.push(" @@@ ERROR : Code Max Length is " + maxLength);
        validation.isValid = false;
	}

	//--  validate part number
	if (lookups.mastercataloglookup[partNumber] !== undefined) {
			console.log("Code exists in the Master list of PartNumber")
	} else {
		console.log("Code does not exists in the Master list")
		validation.errorMessages.push(' @@@ ERROR: '+partNumber + ' Code does not exists. ');
		validation.isValid = false;
	}
}

function validateDeletionCodeInLookup(data, lookups, validation){
	console.log('Start validate Deletion Code in lookup');
	var partNumber = data['Deletion Code'];

	var maxLength = 64;
	//partNumber length validation
	if (!(partNumber === undefined) && partNumber.length > maxLength) {
		console.log('ERROR : Deletion Code maxLength=' + maxLength + ' data=[' + partNumber + '] data length=' + partNumber.length);
        validation.errorMessages.push(" @@@ ERROR : Deletion Code Max Length is " + maxLength);
        validation.isValid = false;
	}

	//--  validate part number
	if (lookups.mastercataloglookup[partNumber] !== undefined) {
			console.log("Deletion Code exists in the Master list of PartNumber")
	} else {
		console.log("Deletion Code does not exists in the Master list")
		validation.errorMessages.push(' @@@ ERROR: '+partNumber + ' Deletion Code does not exists. ');
		validation.isValid = false;
	}
}
function validateParentAssignmentData(data, lookups, validation){
    
	var skuPartNum = data['Deletion Code'];
    var currentParentPartNum = data['Parent'];
    var newParentPartNum = data['New Parent'];
    var rowIsValid = true;
    var message = '';
 
    if(!genericUtil.isUndefined(newParentPartNum) && !genericUtil.isTrimmedEmptyString(newParentPartNum)){
 
        if (genericUtil.isUndefined(lookups.mastercataloglookup[newParentPartNum])) {
            rowIsValid = false;
            message = "New Parent product " + newParentPartNum + " does not exist.";
		} 
		else {
            if (!genericUtil.isUndefined(currentParentPartNum) && !genericUtil.isTrimmedEmptyString(currentParentPartNum)) {
                if (currentParentPartNum != lookups.mastercatalogParent[skuPartNum]) {
                    rowIsValid = false;
                    message = "Parent product " + currentParentPartNum + " is not the current parent of " + skuPartNum;
				}
			} 
			else {
				rowIsValid = false;			
                message = "Deletion of old parent is required";
            }
        }
	} 
	else {
        if (!genericUtil.isUndefined(currentParentPartNum)) {
            if (currentParentPartNum != lookups.mastercatalogParent[skuPartNum]) {
                rowIsValid = false;
                message = "Parent product " + currentParentPartNum + " is not the current parent of " + skuPartNum;
            }
        }
    }
    if (!rowIsValid) {
        console.log(message);
        validation.errorMessages.push(" @@@ ERROR : " + message);
        validation.isValid = false;
    }
}

function validateHiddenAttributes(data, validation){
	if(data['Hide SKU List Attribute'] !== undefined && data['Hide SKU List Attribute'] !== ''){
			console.log('Attribute Identifier exists..');
	}
	else{
		console.log(' @@@ ERROR: Code and Attribute Identifier is required.');
		validation.errorMessages.push(' @@@ ERROR: Attribute Identifier is required.');
		validation.isValid = false;
	}
}

function getDeletionType(data){
	var deletionType = '';

	if(data['Parent'] !== undefined && data['Parent'] !== ''){
		deletionType = 'parentSkuDeletion';
	}
	else if(data['New Parent'] !== undefined && data['New Parent'] !== ''){
		deletionType = 'parentSkuDeletion';
	}
	else if(data['Hide SKU List Attribute'] !== undefined && data['Hide SKU List Attribute'] !== ''){
		deletionType = 'hideAttributeDeletion';
	}
	else if(data['Delete Catalog Entry'] !== undefined && data['Delete Catalog Entry'] !== ''){
		deletionType = 'catalogEntryDeletion';
	}
	else{
		deletionType = 'attributeDeletion';
	}

	return deletionType;
}
//Returns Child code needed for logging purposes in emrcatalogmanager.js.
exports.getPartNumber = function(data) {
	var childCode = '';
	//Child Code Column
	if (data['PartNumber'] !== ''){
		childCode = data['PartNumber'];
	}

	return childCode;
};



//Returns Child code needed for logging purposes in emrcatalogmanager.js.
exports.getChildCode = function(data) {
	var childCode = '';
	//Child Code Column
	if (data['Child Code'] !== ''){
		childCode = data['Child Code'];
	}

	return childCode;
};

//Returns deletion code needed for logging purposes in emrcatalogmanager.js.
exports.getDeletionCode = function(data) {
	var deletionCode = '';
	//Deletion Code Column
	if (data['Deletion Code'] !== '') {
		deletionCode = data['Deletion Code']
	}

	return deletionCode;
};

//Validate if the row has the necessary data to proceed with processing
//Returns true/false
exports.validateRow = function(data) {
	var manufacturer, partnumber, catentrytype;
	manufacturer = data['Manufacturer'];
	partnumber = data['Manufacturer part number'];
	catentrytype = data['Catalog Entry Type'];

	if (manufacturer !== undefined && partnumber !== undefined && catentrytype !== undefined) {
		if (manufacturer !== '' && partnumber !== '' && catentrytype !== '') {
			//console.log("Valid row");
			return true;
		}
		else {
			console.log('Invalid row detected. Manufacturer, Manufacturer Part Number and Catalog Entry Type is null.');
			return false;
		}
	}
	else {
		console.log('Invalid row detected. Manufacturer, Manufacturer Part Number and Catalog Entry Type is undefined.');
		return false;
	}
};

//Validate if the row has the necessary data to proceed with processing
//Returns true/false
exports.validateComponentRow = function(data) {
	var partnumber, bundletype, childpartnumber, sequence;
	partnumber = data['Component Code'];
	bundletype = data['Component Type'];
	childpartnumber = data['Child Code'];
	sequence = data['Sequence'];

	if (bundletype !== undefined && partnumber !== undefined && childpartnumber !== undefined && sequence !== undefined) {
		if (bundletype !== '' && partnumber !== '' && childpartnumber !== '' && sequence !== '') {
			//console.log("Valid row");
			return true;
		}
		else {
			console.log('Invalid row detected. Component Code, Component Type, Child Code and Sequence is null.');
			return false;
		}
	}
	else {
		console.log('Invalid row detected. Component Code, Component Type, Child Code and Sequence is undefined.');
		return false;
	}
};

//Checking for the existence of component code
function validateComponentCode(data,lookups, validation) {
	var mastercataloglookup = lookups.mastercataloglookup;
	if (data['Component Code'] !== ''){
		if(mastercataloglookup[data['Component Code']]  == undefined){

			console.log(data['Component Code'] + ' Component Code does not exist ');
			validation.errorMessages.push(data['Component Code'] + ' Component Code does not exist ');
			validation.isValid = false;
		}
	}
}

//Checking for the existence of Child code
function validateChildCode(data,lookups, validation) {
	var mastercataloglookup = lookups.mastercataloglookup;
	if (data['Child Code'] !== ''){
		if(mastercataloglookup[data['Child Code']]  == undefined){

			console.log(data['Child Code'] + ' Child Code does not exist ');
			validation.errorMessages.push(data['Child Code'] + ' Child Code does not exist ');
			validation.isValid = false;
		}
	}
}

//perform required validations for component type support
function validateComponentType(data,lookups, validation, jsonProperties) {
	var inputComponentType = data['Component Type'];

	//check if supported component type
	if (jsonProperties.supportedComponentTypes.indexOf(inputComponentType) == -1) {
		console.log(inputComponentType + ' ain\'t a supported component type');
      validation.errorMessages.push(" @@@ ERROR : " + inputComponentType + " is not an allowed value or Component Type");
      validation.isValid = false;
	}

}

//Checking for the Locale Value in the catalog file
function validateLocale(data,validation,jsonProperties, productCreate) {
	var locale = data.Locale;
	//EDS-5046: Set locale as a required Field
    if (locale == undefined || locale.trim() == '') {
        console.log(' @@@ ERROR : Locale is required and empty.');
        validation.errorMessages.push(' @@@ ERROR : Locale is required and empty.');
        validation.isValid = false;
    }
    else if (productCreate && locale !== "en_US") {
        console.log(' @@@ ERROR : Only locale en_US accepted for new products/items ' + data.Locale);
        validation.errorMessages.push(' @@@ ERROR : Only locale en_US accepted for new products/items');
        validation.isValid = false;
    }

	if ((locale  !== undefined) && (locale.trim() !== '')){
		if (locale == "en_US" || (locale in jsonProperties.validLocales))
		{
			//console.log("Valid locale");
		}
		else
		{
			console.log('Invalid locale detected: '+ data.Locale);
			validation.errorMessages.push('Invalid locale detected: '+ data.Locale);
			validation.isValid = false;
		}
	}

	//EDS-4640: For NEW items, Display to Customer attribute is required for en_US locale.
	var isPublished = data['Display to customers US'];
	if (isPublished == undefined)
		isPublished = data['Display to customers'];
	if (productCreate && ((locale == undefined || locale.trim() == '') || locale == "en_US") && (isPublished == undefined || isPublished.trim() == '')) {
		console.log(' @@@ ERROR : Display to customers US is required and empty.');
		validation.errorMessages.push(' @@@ ERROR : Display to customers US is required and empty.');
		validation.isValid = false;
	}
}

//Checking for the Master Catalog Category Exist in the Master list
function validateMasterCatalogCategory(data,lookups, validation) {
	var mastercatcategorylookup = lookups.mastercatcategorylookup;
	if (data['Full Path'] !== ''){
		if(mastercatcategorylookup[data['Full Path']]  == undefined){

			console.log(data['Full Path'] + ' Full Path does not exist ');
			validation.errorMessages.push(data['Full Path'] + ' Full Path does not exist ');
			validation.isValid = false;
		}
	}
}

//Checking for the Sales Catalog Category Exist in the Master list
function validateSalesCatalogCategory(data, lookups, validation) {
	var storesCategories = lookups.storesCategories;
	var storesInput = data['Store'];

	if (data['Sales Catalog(s) Path']  !== undefined && data['Sales Catalog(s) Path'].trim() !== '') {
		if (storesInput !== undefined && storesInput !=='') {
			var salesCatalogCategoryDataArray = data['Sales Catalog(s) Path'].split("|");
			var storeDataArray = data['Store'].split("|");
			var salesCategoryToCheck;
			var store;
			var stCategories;
			var category;

			for (var j = 0; j < salesCatalogCategoryDataArray.length; j++)
			{
				salesCategoryToCheck = salesCatalogCategoryDataArray[j].trim(' ');

				if(salesCategoryToCheck == '')
					continue;

				for (var k=0; k<storeDataArray.length; k++) {
					store = storeDataArray[k].trim();
					stCategories = storesCategories[store.toUpperCase()];

					if (stCategories == undefined) {
						console.log(data["Manufacturer part number"] + '** Error: Unable to fetch store-salescategory lookup for ' + store);
						validation.errorMessages.push(' @@@ ERROR : Unable to fetch store-salescategory lookup for ' + store + ' Sales Catalog(s) Path ' + salesCategoryToCheck);
						validation.isValid = false;
						continue;
					}

					//check if the sales category exists
					category = stCategories[salesCategoryToCheck];

					if (stCategories.indexOf(salesCategoryToCheck) == -1 )
					{
						console.log(data["Manufacturer part number"] + ' Sales Catalog(s) Path ' + salesCategoryToCheck + ' is not a valid sales catalog category for store ' + store);
						validation.errorMessages.push(' @@@ ERROR :  Sales Catalog(s) Path ' + salesCategoryToCheck + ' is not a valid sales catalog category for store ' + store);
						validation.isValid = false;
					}
				}
			}
		}
	}
}

// Checking for illegal characters
function illegalCharacters(data, validationObj) {

    var illegalCharsMfg = "";
    var illegalCharsMfgPartNum = "";

    var characters = ["~", "`", "!", "@", "#", "$", "%", "^", "&", "*", "+", "=", "{", "[", "}", "]", "|", "'\'", "\"", ":", ";", "<", ">", ".", "?", "/"];
    var charactersMfgPartNum = ["~", "`", "!", "@", "$", "^", "&", "=", "{", "[", "}", "]", "|", "'\'", "\"", ";", "<", ">", "?"];

    var manufacturer = data['Manufacturer'];
    var manufacturerPartNum = data['Manufacturer part number'];

    for (var j = 0; j < characters.length; j++) {

    	if (manufacturer.indexOf(characters[j]) >= 0) {
    		illegalCharsMfg = illegalCharsMfg + characters[j];
    	}
    }

    for (var k = 0; k < charactersMfgPartNum.length; k++) {

    	if (manufacturerPartNum.indexOf(charactersMfgPartNum[k]) >= 0) {
    		illegalCharsMfgPartNum = illegalCharsMfgPartNum + charactersMfgPartNum[k];
    	}
    }

    if (illegalCharsMfg !== "") {
		validationObj.errorMessages.push(" @@@ ERROR : Manufacturer contains illegal characters! " + illegalCharsMfg);
		console.log(" @@@ ERROR : Manufacturer contains illegal characters! " + illegalCharsMfg);
    	validationObj.isValid = false;
    }

    if (illegalCharsMfgPartNum !== "") {
		validationObj.errorMessages.push(" @@@ ERROR : Manufacturer Part Number contains illegal characters! " + illegalCharsMfgPartNum);
		console.log(" @@@ ERROR : Manufacturer Part Number contains illegal characters! " + illegalCharsMfgPartNum);
    	validationObj.isValid = false;
    }
}

//generic validations performed Commerce fields(i.e. fields which are not attributes in Commerce)
function dataDrivenValidations(data, lookups, validation, productCreate) {

    var inputfielddef = lookups.inputfielddef;
    var dataArray = Object.keys(inputfielddef);
    var requiredForUpdate = ['Full Path','Manufacturer','Manufacturer part number','Catalog Entry Type'];

    for (var k = 0; k < dataArray.length; k++) {

    	if (!dataArray[k].startsWith('EMR-'))
    		continue;

    	//console.log('in dataDrivenValidations for ' + dataArray[k]);
    	var fieldName = (dataArray[k]).substring(4);
    	var inputFieldReqs = inputfielddef['EMR' + '-' + fieldName];
    	//console.log('data driven validation for ' + fieldName + ' = ' + inputFieldReqs);

    	if (inputFieldReqs !== undefined) {
    		//if new product, MIN_OCCURRENCE determines if required or not
    		//if update product, only a subset of the fields are required.
    		if (productCreate || (requiredForUpdate.indexOf(fieldName) != -1)) {
    			//check if required field

    			//add condition for the Display to customers field
    			if(fieldName == 'Display to customers US'){
    				var published = data['Display to customers US'];
        			if (published == undefined) {
        				//per email from Ashley on 12/13 use either Display to customers or Display to customers US
        				published = data['Display to customers'];
        			}
        			//Removed additional if condition to avoid duplicate validation error messages for New items, the same is available in EDS-4640 change
    			}
    			else{
	        		var minOccurrence = inputFieldReqs['MIN_OCCURRENCE'];
		    		if (minOccurrence > 0 && (data[fieldName] === undefined || data[fieldName] === '')) {
		    			console.log(fieldName + ' min occurrence= ' + minOccurrence + ' data=' + data[fieldName]);
		                validation.errorMessages.push(" @@@ ERROR : " + fieldName + " is required and empty.");
		                validation.isValid = false;
		    		}
    			}
    		}

    		//check max length
    		var maxLength = inputFieldReqs['MAXLENGTH'];
    		if (!(data[fieldName] === undefined) && genericUtil.getCharByteCount(data[fieldName]) > maxLength) {
        		console.log(fieldName + ' maxLength = ' + maxLength + ' data length = ' + data[fieldName] + ' data length' + genericUtil.getCharByteCount(data[fieldName]));
                validation.errorMessages.push(" @@@ ERROR : " + fieldName + " max length is " + maxLength);
                validation.isValid = false;
    		}
    	}
    }
 }

function validateStores(rowData, validation) {
	var dataStores = rowData[constants.CSV_HEADER_STORE];
	var dataStoresArray;
	var supportedStores;

	if (genericUtil.isUndefined(dataStores)){
		dataStores = rowData[constants.CSV_HEADER_CAT_STORE];
	}
	if (genericUtil.isUndefined(dataStores) || genericUtil.isTrimmedEmptyString(dataStores)) {
		console.log('Store field is required but empty. Skipping remainder of validations for this record');
        validation.errorMessages.push(" @@@ ERROR : Store field is required but empty; Halting validation for this record");
        validation.isValid = false;
	} else {
		supportedStores = Array.from(dataHelper.getStoreMap(constants.SYSTEM_PLATFORM_CATMAN).keys());
		dataStoresArray = dataStores.split("|");

		dataStoresArray.forEach(function (eachDataStore) {
			if (genericUtil.isUndefined(dataHelper.getCommerceVersionStore(eachDataStore))) {
				console.log(eachDataStore + ' is not a supported store. Supported stores are ' + supportedStores);
				validation.errorMessages.push(" @@@ ERROR : " + eachDataStore + " is not a supported store. Supported stores are " + supportedStores);
				validation.isValid = false;
			}
		});
	}
}

// Attribute Dictionary > Utilities > get all attributes with minimum occurences > 0
function getAttrDictLookupWithMinimumOccurence(attrIdentifierRequirementDictionary) {
	var attributeRequirementsWithMinimumOccurence = [];

	if (!genericUtil.isUndefined(attrIdentifierRequirementDictionary)) {
		if (genericUtil.isArray(attrIdentifierRequirementDictionary)) {
			for (var key in attrIdentifierRequirementDictionary) {
				var attributeRequirement = attrIdentifierRequirementDictionary[key];
				var minOccurrence = attributeRequirement['MinOcurrences'];

				if (!genericUtil.isUndefined(minOccurrence) && !genericUtil.isTrimmedEmptyString(minOccurrence)) {
					minOccurrence = minOccurrence.valueOf();

					if (minOccurrence > 0) {
						attributeRequirementsWithMinimumOccurence.push(attributeRequirement);
					}
				}
			}
		}
	}

	return attributeRequirementsWithMinimumOccurence;
}

//validate attribute dictionary attributes and allowed values
function attributeDictionaryValidation(data,lookups,validation,productCreate) {
	//for each field in input record
	//  check if required field
	//  check maxlength
	//  if field is of type lookup table or string enumeration
	//    inputValues = data.split(|)
	//    for each inputValue
	//      check if in allowed values

    var attrdef = lookups.header['EMR'];
    var locale = data.Locale;
    var dataArray = Object.keys(data);
    var fieldName;
    var inputFieldValue;
    var inputFieldValueArray;
    var inputFieldReqs;
    var lkupType;
    var multiLang;
    var attrvalLookups;
	var attrIdentifier;

	// validate required fields for new item
	if (productCreate) {
		var attributeRequirementsWithMinimumOccurence = getAttrDictLookupWithMinimumOccurence(lookups.attrIdentifier['EMR']);

		if (attributeRequirementsWithMinimumOccurence.length > 0) {
			for (var key in attributeRequirementsWithMinimumOccurence) {
				var attributeRequirement = attributeRequirementsWithMinimumOccurence[key];

				if (attributeRequirement.Identifier !== 'EMR Locale') {
					var headerName = attributeRequirement.HeaderName;
					var dataInputValue = data[headerName];

					applyValidationForMinimumOccurence(productCreate, headerName, dataInputValue, attributeRequirement, validation);
				}
			}
		}
	}

    for (var k = 0; k < dataArray.length; k++) {
    	fieldName = dataArray[k];
    	inputFieldReqs = attrdef[fieldName];
    	inputFieldValue = data[fieldName];
    	//console.log('attribute dictionary validation for = ' + fieldName + ' inputFieldReqs=' + inputFieldReqs);
    	//Added additional validation condition for locale to avoid duplicate validation error messages for New items, the same is available in EDS-5046 change
    	if (inputFieldReqs !== undefined && fieldName !== 'Locale') {

    		if (inputFieldValue !== undefined && inputFieldValue.trim() !== '') {
    			inputFieldValue = inputFieldValue.trim();

				// apply maximum length validation
				applyValidationForMaximumLength(fieldName, inputFieldValue, inputFieldReqs, validation);

				// TODO create a reusable code for allowed values validation
	    		//check allowed values
	    		lkupType = inputFieldReqs['LkupType'];
	    		multiLang = inputFieldReqs['MultiLang'];
	    		if (locale !== "en_US" && (multiLang == "FALSE" || (lkupType != null && lkupType != ''))){
	    			console.log(" @@@ WARNING : " + fieldName + " is not supported for locale specific authoring");
	                validation.errorMessages.push(" @@@ WARNING : " + fieldName + " is not supported for locale specific authoring");
	                validation.isWarning = true;
	    		}
	    		if (lkupType == 'LOOKUP_TABLE' || lkupType == 'STRING_ENUMERATION') {
	    			attrIdentifier = inputFieldReqs['Identifier'];
	    			attrvalLookups = lookups.attrval;
					inputFieldValueArray = inputFieldValue.split('|');
					for (var i=0; i<inputFieldValueArray.length; i++) {

						if (inputFieldValueArray[i] == undefined || inputFieldValueArray[i].trim() ==='')
							continue;

						//console.log('checking if ' + inputFieldValueArray[i] + ' is an allowed value for ' + fieldName + ' whose attribute identifier is ' + attrIdentifier);

						if (attrvalLookups[attrIdentifier] == undefined || attrvalLookups[attrIdentifier][inputFieldValueArray[i].trim()] == undefined) {
							console.log(inputFieldValueArray[i] + ' is not an allowed value for ' + fieldName + ' whose attribute identifier is ' + attrIdentifier);
			                validation.errorMessages.push(" @@@ ERROR : " + inputFieldValueArray[i] + " is not an allowed value for " + fieldName);
			                validation.isValid = false;
						}
					}
	    		}
    		} else {
				// Full Replace Validation for Required Fields but blank
				//TODO
			}
    	} else if (requiresSpecialValidationHandling(fieldName)) {
			var specialValidationAttrKey = getSpecialValidationAttributeIdentifier(fieldName);

			if (specialValidationAttrKey === 'EMR Features') {
				applyFeaturesValidations(fieldName, data, lookups, validation);
			} else if (specialValidationAttrKey === 'EMR CallToActions') {
				applyCallToActionValidations(fieldName, data, lookups, validation);
			} else if (specialValidationAttrKey === 'EMR UtilityBelts') {
				applyUtilityBeltValidations(fieldName, data, lookups, validation);
			}
		}
    }
}

// Attribute Dictionary > Utilities > Check if Special Validation Handling is Applicable
function requiresSpecialValidationHandling(dataHeader) {
	var isSpecialValidationNeeded = false;
	var specialValidationAttrKey = getSpecialValidationAttributeIdentifier(dataHeader);

	if (!genericUtil.isEmptyString(specialValidationAttrKey)) {
		isSpecialValidationNeeded = true;
	}

	return isSpecialValidationNeeded;
}

// Attribute Dictionary > Utilities > Get Keyword for Attributes with Special Validation Handling
function getSpecialValidationAttributeIdentifier(dataHeader) {
	var specialValidationAttrKey = '';

	if (!genericUtil.isUndefined(dataHeader) && !genericUtil.isTrimmedEmptyString(dataHeader)) {
		var dataHeaderSplitBySpace = dataHeader.split(' ');

		if (dataHeaderSplitBySpace[0] === 'Feature') {
			specialValidationAttrKey = 'EMR Features';
		} else if (dataHeaderSplitBySpace[0] === 'CallToAction') {
			specialValidationAttrKey = 'EMR CallToActions';
		} else if (dataHeaderSplitBySpace[0] === 'Utility' && dataHeaderSplitBySpace[1] === 'Belt') {
			specialValidationAttrKey = 'EMR UtilityBelts';
		}
	}

	return specialValidationAttrKey;
}




// Attribute Dictionary > Utilities > Toggle Validation to Fail with Generic Error Logging
function toggleValidationToFail(referenceAttrName, errorMessage, validation) {
	var userFriendlyErrorMessage;

	if (genericUtil.isUndefined(referenceAttrName) || genericUtil.isTrimmedEmptyString(referenceAttrName)) {
		userFriendlyErrorMessage = ' @@@ ERROR : ' + errorMessage;
	} else {
		userFriendlyErrorMessage = ' @@@ ERROR : ' + errorMessage + ' : Reference Attribute Name: ' + referenceAttrName;
	}

	if (validation.errorMessages.indexOf(userFriendlyErrorMessage) == -1) {
		console.log(userFriendlyErrorMessage);
		validation.errorMessages.push(userFriendlyErrorMessage);
	}

	validation.isValid = false;
}

// Attribute Dictionary > Special Validation Handling > Call To Actions
function applyCallToActionValidations(dataHeader, data, lookups, validation) {
	var dataHeaderSplitBySpace = dataHeader.split(' ');
	// double check if header is for CTA
	if (dataHeaderSplitBySpace[0] === 'CallToAction') {
		var userErrorMessage;
		var unregisteredPartialMessage = ' call to action does not exist.';
		var invalidPartialMessage = ' call to action is not valid.';
		var ctaNumber = dataHeaderSplitBySpace[1];
		var expectedDataHeaderName = 'CallToAction ' + ctaNumber + ' Name';
		var expectedDataHeaderURL = 'CallToAction ' + ctaNumber + ' URL';
		var dataCtaName = data[expectedDataHeaderName];
		var dataCtaURL = data[expectedDataHeaderURL];
		var referenceAttrName = 'CallToAction - ' + dataCtaName;
		var applyGenericValidations = false;

		if (dataHeaderSplitBySpace[2] === 'Name') {
			if (!genericUtil.isUndefined(dataCtaName) && !genericUtil.isTrimmedEmptyString(dataCtaName)) {
				// if Name, start all CTA validations
				var ctaMasterListEntry = lookups.ctalookup[dataCtaName];
				var attrRequirements = lookups.attrIdentifier['EMR'][ctaMasterListEntry];

				// if attrRequirements is missing, check for other references
				// probably caused by out of sync rules and ctas lookup csvs
				if (genericUtil.isUndefined(attrRequirements)) {
					var expectedRequirementAttrIdentifier = 'EMR ' + dataCtaName + ' CTA';
					attrRequirements = lookups.attrIdentifier['EMR'][expectedRequirementAttrIdentifier];
				}

				// check if CTA name is accepted
				if (genericUtil.isUndefined(attrRequirements)) {
					userErrorMessage = dataCtaName + unregisteredPartialMessage;
					toggleValidationToFail('', userErrorMessage, validation);
				} else {
					applyGenericValidations = true;
				}

				// check if URL exists in the input data
				if (genericUtil.isUndefined(dataCtaURL)) {
					userErrorMessage = dataCtaName + invalidPartialMessage;
					toggleValidationToFail('', userErrorMessage, validation);
				}

				// generic validations
				if (applyGenericValidations) {
					applyValidationForMaximumLength(referenceAttrName, dataCtaURL, attrRequirements, validation);
				}
			}
		} else if (dataHeaderSplitBySpace[2] === 'URL') {
			if (!genericUtil.isUndefined(dataCtaURL) && !genericUtil.isTrimmedEmptyString(dataCtaURL)) {
				// if URL, check if Name exists in the input data
				if (genericUtil.isUndefined(dataCtaName)) {
					userErrorMessage = dataCtaURL + invalidPartialMessage;
					toggleValidationToFail('', userErrorMessage, validation);
				}
			}
		}
	}
}

// Attribute Dictionary > Special Validation Handling > Utility Belts
function applyUtilityBeltValidations(dataHeader, data, lookups, validation) {
	var dataHeaderSplitBySpace = dataHeader.split(' ');

	// double check if header is for Utility Belt
	if (dataHeaderSplitBySpace[0] === 'Utility' && dataHeaderSplitBySpace[1] === 'Belt') {
		var userErrorMessage;
		var uBeltNumber = dataHeaderSplitBySpace[2];
		var expectedDataHeaderTag = 'Utility Belt ' + uBeltNumber + ' Tag';
		var expectedDataHeaderText = 'Utility Belt ' + uBeltNumber + ' Text';
		var expectedDataHeaderURL = 'Utility Belt ' + uBeltNumber + ' URL';
		var dataUBeltTag = data[expectedDataHeaderTag];
		var dataUBeltText = data[expectedDataHeaderText];
		var dataUBeltURL = data[expectedDataHeaderURL];
		var referenceAttrName = 'Utility Belt - ' + dataUBeltTag;
		var applyGenericValidations = false;

		if (dataHeaderSplitBySpace[3] === 'Tag') {
			if (!genericUtil.isUndefined(dataUBeltTag) && !genericUtil.isTrimmedEmptyString(dataUBeltTag)) {
				// if Tag, start all UBelt validations
				var uBeltMasterListEntry = lookups.utilitybeltlookup[dataUBeltTag];
				var attrRequirements = lookups.attrIdentifier['EMR'][uBeltMasterListEntry];

				// if attrRequirements is missing, check for other references
				// probably caused by out of sync rules and ubelts lookup csvs
				if (genericUtil.isUndefined(attrRequirements)) {
					var expectedRequirementAttrIdentifier = 'EMR Utility Belt_' + dataUBeltTag;
					attrRequirements = lookups.attrIdentifier['EMR'][expectedRequirementAttrIdentifier];
				}

				// check if UBelt tag is accepted
				if (genericUtil.isUndefined(attrRequirements)) {
					userErrorMessage = dataUBeltTag + ' utility belt does not exist.';
					toggleValidationToFail('', userErrorMessage, validation);
				} else {
					applyGenericValidations = true;
				}

				// generic validations
				if (applyGenericValidations) {
					// for text
					applyValidationForMaximumLength(referenceAttrName, dataUBeltText, attrRequirements, validation);
					// for url
					applyValidationForMaximumLength(referenceAttrName, dataUBeltURL, attrRequirements, validation);
				}
			}
		} else if (dataHeaderSplitBySpace[3] === 'Text') {
			// do nothing
		} else if (dataHeaderSplitBySpace[3] === 'URL') {
			// do nothing
		}
	}
}

//TMP: comments - coding guides compliant
function applyFeaturesValidations(dataHeader, data, lookups, validation) {
	var dataHeaderSplitBySpace = dataHeader.split(' ');
	
	if (dataHeaderSplitBySpace[0] === 'Feature') {
		var attrRequirements = lookups.attrIdentifier['EMR']['EMR Features'];
		var inputValue = data[dataHeader];
		
		applyValidationForMaximumLength(dataHeader, inputValue, attrRequirements, validation);
	}
}

//TMP: comments - coding guides compliant
function applyValidationForAttrAllowedValues(headerName, dataAttr, attrAllowedValues, attrReq, validation) {
	var dataAttrArray = [];
	var isMultiVal = !genericUtil.isUndefined(attrReq.MultiValue) && parseInt(attrReq.MultiValue) > 1;
	var validationMessage;

	if (isMultiVal) {
		dataAttrArray = dataAttr.split(constants.CHAR_PIPE);
	} else {
		dataAttrArray.push(dataAttr);
	}
	
	if (attrReq.LkupType == constants.LOOKUPREF_LOOKUPTYPE_TABLE || attrReq.LkupType == constants.LOOKUPREF_LOOKUPTYPE_ENUM) {
		if (!genericUtil.isUndefined(attrAllowedValues)) {
			dataAttrArray.forEach(function (eachDataAttr) {
				eachDataAttr = eachDataAttr.trim();

				if (genericUtil.isUndefined(attrAllowedValues[eachDataAttr])) {
					validationMessage = ' @@@ ERROR : ' + eachDataAttr + ' is not an allowed value for ' 
						+ headerName + ' whose attribute identifier is ' + attrReq.Identifier;
					console.log(validationMessage);
					validation.errorMessages.push(validationMessage);
					validation.isValid = false;
				}
			});
		}
	}
}

// Attribute Dictionary > Set of Rules Validation > Minimum occurence validation
function applyValidationForMinimumOccurence(isNewProduct, referenceAttrName, dataInputValue, dataAttributeRequirements, validation) {
	var minOccurrence = dataAttributeRequirements['MinOcurrences'].valueOf();
	var multiValue = dataAttributeRequirements['MultiValue'].valueOf();
	var errorMessage;

	// logic assumption is that the product will not be created without minimum number of data
	if (isNewProduct && minOccurrence > 0) {
		if (minOccurrence == 1) {
			if (genericUtil.isUndefined(dataInputValue) || genericUtil.isTrimmedEmptyString(dataInputValue)) {
				errorMessage = referenceAttrName + '  is required and empty.';
				toggleValidationToFail('', errorMessage, validation);
			}
		} else {
			if (genericUtil.isUndefined(dataInputValue) || genericUtil.isTrimmedEmptyString(dataInputValue)) {
				errorMessage = minOccurrence + ' ' + referenceAttrName + ' is required and empty.';
				toggleValidationToFail('', errorMessage, validation);
			} else {
				if (multiValue > 1) {
					var dataSingleInputValueArray = dataInputValue.split('|');
					var validInputCount = 0;

					for (var i = 0; i < dataSingleInputValueArray.length; i++) {
						var dataSingleInputValue = dataSingleInputValueArray[i];

						if (!genericUtil.isUndefined(dataSingleInputValue) || !genericUtil.isTrimmedEmptyString(dataSingleInputValue)) {
							validInputCount++;
						}
					}

					if (validInputCount < minOccurrence) {
						errorMessage = minOccurrence + ' ' + referenceAttrName + ' is required but there is only ' + validInputCount;
						toggleValidationToFail('', errorMessage, validation);
					}
				} else {
					// this should never be possible because assumption is that multiValue is always > minOccurence
					console.log('APP ERROR : Invalid Attribute Dictionary Rule found - multiValue vs minOccurence');
				}
			}
		}
	}
}

// Attribute Dictionary > Set of Rules Validation > Maximum length validation
function applyValidationForMaximumLength(referenceAttrName, dataInputValue, dataAttributeRequirements, validation) {
	var maxLength = dataAttributeRequirements['MaxLength'].valueOf();
	var multiValue = dataAttributeRequirements['MultiValue'].valueOf();
	var errorMessage = referenceAttrName + ' max length is ' + maxLength;


	if (!genericUtil.isUndefined(dataInputValue) && !genericUtil.isTrimmedEmptyString(dataInputValue)) {
		if (maxLength > 0) {
			if (multiValue > 1) {
				var dataSingleInputValueArray = dataInputValue.split('|');

				for (var i = 0; i < dataSingleInputValueArray.length; i++) {
					var dataSingleInputValue = dataSingleInputValueArray[i];
					
					if (genericUtil.getCharByteCount(dataSingleInputValue) > maxLength) {
						toggleValidationToFail('', errorMessage, validation);
					}
				}
			} else {
				if (genericUtil.getCharByteCount(dataInputValue) > maxLength) {
					toggleValidationToFail('', errorMessage, validation);
				}
			}
		}
	}
}

//perform required validations for catalog entry type support
function validateCatalogEntryType(data, validation, jsonProperties) {
	var inputCatentType = data['Catalog Entry Type'];

	//check if supported catalog entry type
	if (jsonProperties.supportedCatalogEntryTypes.indexOf(inputCatentType) == -1) {
		console.log(inputCatentType + ' ain\'t a supported catenttype');
        validation.errorMessages.push(" @@@ ERROR : " + inputCatentType + " is not a supported value for Catalog Entry Type");
        validation.isValid = false;
	}
}

//perform required validations for type in sequencing support
function validateSequencingType(data, validation) {
	var inputSequencingType = data['Type'];
	var supportedSequencingTypes = dataHelper.splitStringToArray(applicationProperties.path().catman.transform.emr.supportedSequencingTypes, ',');

	//check if supported sequencing type
	if (supportedSequencingTypes.indexOf(inputSequencingType) === -1) {
		console.log(inputSequencingType + ' ain\'t a supported sequencing type');
        validation.errorMessages.push(" @@@ ERROR : " + inputSequencingType + " is not a supported value for Type for Sequencing.");
        validation.isValid = false;
	}
}

//validate Parent-Child relationship
function validateParent(data, lookups, validation, dataloadMode) {
	var parent = data[constants.CSV_HEADER_PARENT];

	if(!genericUtil.isUndefined(parent) && !genericUtil.isTrimmedEmptyString(parent)) {
		parent = parent.trim();
		console.log('parent=' + parent);

		//check if SKU is set as the parent
		if (!(
				parent.includes('-P-') ||
				parent.includes('-B-') ||
				parent.includes('-K-') ||
				parent.includes('-D-')
			)) {
			console.log('SKU cannot be set as the parent');
			validation.errorMessages.push(" @@@ ERROR : Invalid Parent-Child relationship");
			validation.isValid = false;
		}

		//bundle, Static Kit, Dynamic kit cannot have a parent
		if (data['Catalog Entry Type'] === 'Bundle' || data['Catalog Entry Type'] === 'Static Kit' || data['Catalog Entry Type'] === 'Dynamic Kit') {
			console.log(data['Catalog Entry Type'] + ' cannot have a parent');
			validation.errorMessages.push(" @@@ ERROR : Invalid Parent-Child relationship");
			validation.isValid = false;
		}

		//A product cannot have Static Kit or Dynamic kit as the  parent
		if (data['Catalog Entry Type'] === 'Product' && (parent.includes('-K-') || parent.includes('-D-') || parent.includes('-P-'))) {
			console.log(data['Catalog Entry Type'] + ' cannot have a static kit or dynamic kit or product as a parent');
			validation.errorMessages.push(" @@@ ERROR : Invalid Parent-Child relationship");
			validation.isValid = false;
		}

		//check if the parent exists
		if (lookups.mastercataloglookup[parent] === undefined) {
			console.log('Parent product ' + parent + ' does not exist');
			validation.errorMessages.push(" @@@ ERROR : Parent does not exist");
			validation.isValid = false;
		}

		if (dataloadMode != constants.DATALOAD_MODE_REPLACE) {
			//SKU cannot have more than one parent product. Failed if attempting to load a parent product that is different than what's listed on mastercatalogPartnumber.csv lookup file
			var partNumber = module.exports.getProductCode(data);
			if (lookups.mastercataloglookup[partNumber] !== undefined) {
				if(lookups.mastercatalogParent[partNumber] !== '' && lookups.mastercatalogParent[partNumber] !== undefined && lookups.mastercatalogParent[partNumber] !== parent){
					console.log('SKU cannot have more than one parent product');
					validation.errorMessages.push(" @@@ ERROR : Invalid Parent-Child relationship (SKU cannot have more than one parent product)");
					validation.isValid = false;
				}
			}
		}
	}
}

//validate Product Master Catalog
function validateProductMasterCatalog(data, lookups, validation, productCreate) {
	if(productCreate == false){
		var masterCatalog = data['Full Path'];
		var partNumber = module.exports.getProductCode(data);

		if(lookups.mastercataloglookup[partNumber] === masterCatalog) {
			console.log('Same MasterCatalog');
		} else {
			console.log('Product is already tagged in Different Master Catalog');
			validation.errorMessages.push(" @@@ ERROR : Product is already tagged in Different Master Catalog");
	        validation.isValid = false;
		}
	}

    var parent = data['Parent'];
    if(parent !== undefined && parent.trim() !== '') {
        parent = parent.trim();
        if (data['Full Path'] !== undefined && lookups.mastercataloglookup[parent] !== undefined) {
            if (data['Full Path'] != lookups.mastercataloglookup[parent]) {
                console.log('Master Category assigned to SKU is different to the Master Category of Parent Product');
                validation.errorMessages.push(" @@@ ERROR : Master Category assigned to SKU is different to the Master Category of Parent Product");
                validation.isValid = false;
            }
        }

    }
}

//get Locale
function getLocale(data,jsonProperties)
{
	var locale = data.Locale;
	//console.log('The current locale is ' + locale);

	var validLocales = jsonProperties.validLocales;

	if (locale in validLocales)
	{
		return validLocales[locale];
	}
	else (locale === 'en_US')
	{
		return -1;
	}
}

//check for special character
function isInvalidChar(character)
{
    var characters = ["~", "`", "!", "@", "#", "$", "%", "^", "&", "*", "+", "=", "{", "[", "}", "]", "|", "'\'", "\"", ":", ";", "<", ">", ".", "?", "/","_", ",","(",")"];
    for(var i = 0; i < characters.length; i++){
        if(characters[i]===character){
        	return true;
        }
    }
    return false;
}

//remove special characters from the URLKeyword
function removeSpecialCharcaters(urlkeyword){
	urlKeyword = urlkeyword;

	for (var k = 0; k < urlkeyword.length; k++) {
		var character = urlkeyword.substr(k, 1);
    	if (isInvalidChar(character)){
    		urlKeyword = urlKeyword.replace(character, '');
    	}
    }
	return urlKeyword;
}

//validate URL Keyword
function validateURLKeyword(data,lookups,validation,productCreate,jsonProperties){
	var locale = getLocale(data,jsonProperties);

	//Form the current URL Keyword
	var urlkeyword ='';
	switch (data['Catalog Entry Type']) {
		case 'Product':
			urlkeyword = data.Manufacturer.trim().replace(/ /g, '-').toLowerCase() + '-' + data['Manufacturer part number'].replace(/ /g, '-').toLowerCase();
		break;
		case 'SKU':
			urlkeyword = data.Manufacturer.trim().replace(/ /g, '-').toLowerCase() + '-sku-' + data['Manufacturer part number'].replace(/ /g, '-').toLowerCase();
		break;
		case 'Bundle':
			urlkeyword = data.Manufacturer.trim().replace(/ /g, '-').toLowerCase() + '-bnd-' + data['Manufacturer part number'].replace(/ /g, '-').toLowerCase();
		break;
		case 'Static Kit':
			urlkeyword = data.Manufacturer.trim().replace(/ /g, '-').toLowerCase() + '-pkg-' + data['Manufacturer part number'].replace(/ /g, '-').toLowerCase();
		break;
		case 'Dynamic Kit':
			urlkeyword = data.Manufacturer.trim().replace(/ /g, '-').toLowerCase() + '-cfg-' + data['Manufacturer part number'].replace(/ /g, '-').toLowerCase();
		break;
	}

	if (locale !== -1)
	{
		urlkeyword = urlkeyword + '-' + data.Locale.replace('_', '-').toLowerCase();
	}

	//Remove special characters from the URL Keyword
	urlkeyword = removeSpecialCharcaters(urlkeyword);

	var partNumber = module.exports.getProductCode(data);

	if (productCreate){
		if(lookups.urlkeyword_PartNumber[urlkeyword] === undefined){
			console.log('New URL Keyword, ' + urlkeyword);
		} else{
			console.log('URL Keyword is already in use, ' + urlkeyword);
			validation.errorMessages.push(" @@@ ERROR : URL Keyword is already in use " + urlkeyword);
			validation.isValid = false;
		}
	}
}


//checking for the UNSPSC
function validateUNSPSC(data, validation){
	var fieldName = 'UNSPSC';
	//check max length
	var maxLength = 16;
	if (!(data[fieldName] === undefined) && data[fieldName].length > maxLength) {
		console.log(fieldName + ' maxLength=' + maxLength + ' data=' + data[fieldName] + ' data length=' + data[fieldName].length);
        validation.errorMessages.push(" @@@ ERROR : " + fieldName + " max length is " + maxLength);
        validation.isValid = false;
	}
}

//checking for Hidden Product Family Category
function validateHiddenProductFamilyCategory(data, lookups, validation) {
	// check if data is a valid sales category identifier
	var isSalesCategory = false;
	//var fieldName = 'Hidden Category';
	var hiddenCategoryFieldValue = data['Hidden Category'];
	var masterCategoryRef = lookups.mastercatcategorylookup[hiddenCategoryFieldValue];

	if (hiddenCategoryFieldValue !== undefined){
		if(hiddenCategoryFieldValue == ''){
			isSalesCategory = true;
		}
		if(masterCategoryRef !== undefined && masterCategoryRef.toLowerCase() =='false'){
			isSalesCategory = true;
		}
		if (!isSalesCategory) {
			console.log(hiddenCategoryFieldValue + ' is not a valid Sales Category Identifier');
			validation.errorMessages.push(" @@@ ERROR : " + hiddenCategoryFieldValue + " is not a valid Sales Category Identifier");
			validation.isValid = false;
		}	
	}
}

/**
 * validatePartNumber
 *
 * @param data
 * @param validation
 * @returns
 */
function validatePartNumber(data, validation){
	console.log('Start validatePartNumber');
	var partNumber = module.exports.getProductCode(data);
	var maxLength = 64;

	//partNumber length validation
	if (!(partNumber === undefined) && partNumber.length > maxLength) {
		console.log('ERROR : Code maxLength=' + maxLength + ' data=[' + partNumber + '] data length=' + partNumber.length);
        validation.errorMessages.push(" @@@ ERROR : Code Max Length is " + maxLength);
        validation.isValid = false;
	}
}

function validateAttributeIdentifier(testAttributeIdentifier, lookups, validation ){

	var attrIdentifier = lookups.attrIdentifier["EMR"][testAttributeIdentifier];

	if (genericUtil.isUndefined(attrIdentifier)){
		console.log('Attribute Identifier is not existing in the lookup.');
		validation.errorMessages.push(' @@@ ERROR: Attribute Identifier is invalid.');
		validation.isValid = false;
	}
}

/**
 * perform required validation for locale if included in the list of deprecated locale.
 * return true => if parameter locale exist in the list of deprecated locale. else return false.
 *
 * @param data
 * @param jsonProperties
 * @returns
 */
function isDeprecatedLocale(data, jsonProperties) {
	var isDeprecated = false;
	var locale = data.Locale;

	if (locale !== undefined && locale.trim() !== '') {
		locale = locale.trim();
		// check if paramLocale is in list of deprecated locales
		if (jsonProperties.deprecatedLocales.indexOf(locale) !== -1) {
			// the locale value is deprecated. return true.
			isDeprecated = true;
		}
	}

	return isDeprecated;
}


/**
 * Validate attribute dictionary attributes and allowed values if locale is deprecated
 *
 * @param data
 * @param lookups
 * @param validation
 * @param jsonProperties
 */
function attributeDictionaryDeprecatedLocaleValidation(data,lookups,validation,jsonProperties) {
    var attrdef = lookups.header['EMR'];
    var locale = data.Locale;
    var dataArray = Object.keys(data);
    var fieldName;
    var inputFieldValue;
    var inputFieldReqs;
	var isDeprecated = false;

    for (var k = 0; k < dataArray.length; k++) {
    	fieldName = dataArray[k];
    	inputFieldReqs = attrdef[fieldName];
    	inputFieldValue = data[fieldName];

    	//Validate attribute except standard core fields
    	if (jsonProperties.standardCoreFields.indexOf(fieldName) === -1) {
    		if (inputFieldReqs !== undefined && fieldName !== 'Locale') {
        		//Validate deprecated locale for all attributes
        		isDeprecated = isDeprecatedLocaleField(locale, fieldName, inputFieldValue, validation, jsonProperties);

        	} else if (requiresSpecialValidationHandling(fieldName)) {
    			var specialValidationAttrKey = getSpecialValidationAttributeIdentifier(fieldName);

    			if ((specialValidationAttrKey === 'EMR Features')
    					&& (specialValidationAttrKey !== 'EMR CallToActions' || specialValidationAttrKey !== 'EMR UtilityBelts')) {
    				//deprecated locale verification.
    				isDeprecated = isDeprecatedLocaleField(locale, fieldName, inputFieldValue, validation, jsonProperties);
    			}
    		}
    	}
    }
}


/**
 * perform required validation for locale if included in the list of deprecated locale.
 * return true => if parameter locale exist in the list of deprecated locale. else return false.
 *
 * @param locale
 * @param fieldName
 * @param inputFieldValue
 * @param validation
 * @param jsonProperties
 *
 * @returns boolean isDeprecated
 */
function isDeprecatedLocaleField(locale, fieldName, inputFieldValue, validation, jsonProperties) {
	var isDeprecated = false;
	if (inputFieldValue !== undefined && inputFieldValue.trim() !== '') {
		inputFieldValue = inputFieldValue.trim();
		// check if paramLocale is in list of deprecated locales
		if ((jsonProperties.deprecatedLocales.indexOf(locale) !== -1)
				&& (jsonProperties.standardCoreFields.indexOf(fieldName) === -1)) {
			var errMessage = " @@@ WARNING : " + fieldName
					+ " is not supported for authoring on the target locale "
					+ locale + ".";
			console.log(errMessage);
			validation.errorMessages.push(errMessage);
			validation.isWarning = true;g
			validation.isValid = true;
			// set the return value
			isDeprecated = true;
		}
	}

	return isDeprecated;
}

// check headers typos for manage category
function validateManageCategoryHeaders(rowData, masterSalesCategoryHeaders, validation) {
	for (var requestHeader in rowData) {
		if (!masterSalesCategoryHeaders.includes(requestHeader)) {
			validationMessage = ' @@@ WARNING : ' + requestHeader + ' is not valid for authoring ';
			logValidationWarningMessage(validationMessage, validation);
		}
			
	}		
}

// check headers typos for manage attr
function validateManageAttrHeaders(rowData, attrDictionaryHeaders, validation) {
	var supportedCatalogHeaders = [];
	supportedCatalogHeaders.push(constants.CSV_HEADER_ATTRVALUES);

	for (var requestHeader in rowData) {
		if (!attrDictionaryHeaders.includes(requestHeader) && !supportedCatalogHeaders.includes(requestHeader)) {
			validationMessage = ' @@@ WARNING : ' + requestHeader + ' is not valid for authoring ';
			logValidationWarningMessage(validationMessage, validation);
		}
	}
}

// check headers typos for manage attr val
function validateManageAttrValHeaders(rowData, validation) {
	var supportedCatalogHeaders = [];
	supportedCatalogHeaders.push(constants.CSV_HEADER_CURRENTVALUE);
	supportedCatalogHeaders.push(constants.CSV_HEADER_NEWVALUE);
	supportedCatalogHeaders.push(constants.CSV_HEADER_ATTRVALUES);
	supportedCatalogHeaders.push(constants.CSV_HEADER_ATTRIDENTIFIER);
	supportedCatalogHeaders.push(constants.CSV_HEADER_VALUEUSAGE);

	for (var requestHeader in rowData) {
		if (!supportedCatalogHeaders.includes(requestHeader)) {
			validationMessage = ' @@@ WARNING : ' + requestHeader + ' is not valid for authoring ';
			logValidationWarningMessage(validationMessage, validation);
		}
	}
}

// check header typos for product transform
function validateProductTransformDataloadHeaders(rowData, productTransformHeaders, lookupsBuilder, validation) {
	var attrDictionaryLookup = lookupsBuilder.getAttributeDictionaryLookup();
	var supportedCatalogHeaders = [];
	var maxFeatures = constants.MAX_NO_FEATURES;
	var maxCtas = constants.MAX_NO_CTA;
	var maxUBelts = constants.MAX_NO_UTILITYBELT;
	var validationMessage;

	// normal product loading headers
	supportedCatalogHeaders.push(constants.CSV_HEADER_USNAME);
	supportedCatalogHeaders.push(constants.CSV_HEADER_KEYWORDUS);
	supportedCatalogHeaders.push(constants.CSV_HEADER_PAGETITLEUS);
	supportedCatalogHeaders.push(constants.CSV_HEADER_DISPLAYTOCUSTOMERUS);
	supportedCatalogHeaders.push(constants.CSV_HEADER_KEYWORDUS);
	supportedCatalogHeaders.push(constants.CSV_HEADER_METADESCUS);

	// product-attribute deletion headers
	supportedCatalogHeaders.push(constants.CSV_HEADER_HIDE_SKU_ATTRIBUTE);
	supportedCatalogHeaders.push(constants.CSV_HEADER_NEW_PARENT);
	supportedCatalogHeaders.push(constants.CSV_HEADER_PARENT);
	supportedCatalogHeaders.push(constants.CSV_HEADER_DELETE_CATALOG_ENTRY);

	supportedCatalogHeaders.push(constants.CSV_HEADER_CHILDID);
	supportedCatalogHeaders.push(constants.CSV_HEADER_PARENTID);

	//Component Assoc headers
	supportedCatalogHeaders.push(constants.CSV_HEADER_COMPONENTCODE);
	supportedCatalogHeaders.push(constants.CSV_HEADER_COMPONENTTYPE);
	supportedCatalogHeaders.push(constants.CSV_HEADER_CHILDCODE);
	supportedCatalogHeaders.push(constants.CSV_HEADER_DISPLAYSEQUENCE);
	supportedCatalogHeaders.push(constants.CSV_HEADER_QUANTITY);
	supportedCatalogHeaders.push(constants.CSV_HEADER_DELETE);

	// attributes
	for (var attrIdKey in attrDictionaryLookup){
		var attrHeader = attrDictionaryLookup[attrIdKey].HeaderName;
		supportedCatalogHeaders.push(attrHeader);
	}
	
	// features
	for (var i = 1; i <= maxFeatures; i++) {
		supportedCatalogHeaders.push("Feature " + i);
	}

	// CallToActions
	for (var i = 1; i <= maxCtas; i++) {
		supportedCatalogHeaders.push("CallToAction " + i + " Name");
		supportedCatalogHeaders.push("CallToAction " + i + " URL");
	}

	// Utility Belts
	for (var i = 1; i <= maxUBelts; i++) {
		supportedCatalogHeaders.push("Utility Belt " + i + " Tag");
		supportedCatalogHeaders.push("Utility Belt " + i + " Text");
		supportedCatalogHeaders.push("Utility Belt " + i + " URL");
	}

	// checking headers
	for (var requestHeader in rowData) {
		if (!productTransformHeaders.includes(requestHeader) && !supportedCatalogHeaders.includes(requestHeader)) {
			validationMessage = ' @@@ WARNING : ' + requestHeader + ' is not valid for authoring ';
			logValidationWarningMessage(validationMessage, validation);
		}
	}
}

