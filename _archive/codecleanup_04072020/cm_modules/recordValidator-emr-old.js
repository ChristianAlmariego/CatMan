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


exports.validate = function(data,lookups, jsonProperties, productCreate) {
	
	var validation = {
	        isValid: true,
	        errorMessages: []
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

	var validStore = isValidStore(data,validation,jsonProperties);
	if (!validStore) {
		//skip remainder of validation for this record as it is required for lookups
		return validation;
	}
	
    // check for illegal characters
    illegalCharacters(data,validation);

    // check if new or existing product
    //var isNewProd = isNewProduct(data,lookups,validation);
    //console.log('New Product? ' + isNewProd);

    //validations performed Commerce fields(i.e. fields which are not attributes in Commerce)
    dataDrivenValidations(data,lookups,validation,productCreate);
	
    //validate attribute dictionary attributes and allowed values
    attributeDictionaryValidation(data,lookups,validation,productCreate);
	
    // validate if record type is 'Product' then parent category must be specified
    // validate if record type is 'SKU' and parent category is specified, then parent product must be empty -- SKU is singleton
    // validate if record type is 'SKU' and parent product is specified, then parent cateogry must be empty -- SKU is not a singleton
    // validate Master Catalog Category is correct
    // validate Sales Catalog Category is correct
    
    //Locale validation()
    validateLocale(data,validation,jsonProperties, productCreate);
    
	// Checking for the Master Catalog Category Exist in the Master list
	validateMasterCatalogCategory(data,lookups,validation);
	
	//Checking for the Sales Catalog Category Exist in the Master list
	validateSalesCatalogCategory(data,lookups, validation, jsonProperties);
	
	//perform required validations for catalog entry type support
	validateCatalogEntryType(data,lookups, validation, jsonProperties);
	
	//validate Parent-Child relationship
	validateParent(data,lookups, validation);
	
	//validate Master Catalog for the Product
	validateProductMasterCatalog(data,lookups,validation,productCreate);

	//checking for the Related Product existence
	validateRelatedProduct(data, lookups, validation);

	//checking for the Up-Sell existence
	validateUpSellProduct(data, lookups, validation);

	//checking for the Accessories existence
	validateAccessoriesProduct(data, lookups, validation);

	//for code cleanup - replaced with applyUtilityBeltValidations
	//checking for Utility Belt existence
	//validateUtilityBelt(data, lookups, validation);

	//for code cleanup - replaced with applyCallToActionValidations
	//checking for CTAs existence
	//validateCTAs(data, lookups, validation);


 // validate URL Keyword and Page Title are available for new locales
 // validate no errors on save in the logs

 // TODO add Related Products
 // TODO add product name and line number to error & success messages
 // TODO character turn new row bug

    return validation;
};

exports.validateComponent = function(data,lookups, jsonProperties) {
	
	var validation = {
	        isValid: true,
	        errorMessages: []
    };
	
	//validate component code existence
	validateComponentCode(data,lookups, validation);
	
	//validate child code existence
	validateChildCode(data,lookups, validation);
	
    // check for illegal characters
//    illegalCharacters(data,validation);


 // validate URL Keyword and Page Title are available for new locales
 // validate no errors on save in the logs

 // TODO add Related Products
 // TODO add product name and line number to error & success messages
 // TODO character turn new row bug

    return validation;
};

//Returns Product/Item code needed for logging purposes in emrcatalogmanager.js.
//Returns the code by using the correct header name depending on the store
exports.getProductCode = function(data) {
	var partnumber = '';
	//PartNumber column
	switch (data['Catalog Entry Type']) {
	case 'Product' :
		partnumber = data.Manufacturer + '-P-' + data['Manufacturer part number'];
		break;
	case 'SKU' :
		partnumber = data.Manufacturer + '-' + data['Manufacturer part number'];
		break;
	case 'Bundle' :
		partnumber = data.Manufacturer + '-B-' + data['Manufacturer part number'];
		break;
	case 'Static Kit' :
		partnumber = data.Manufacturer + '-K-' + data['Manufacturer part number'];
		break;
	case 'Dynamic Kit' :
		partnumber = data.Manufacturer + '-D-' + data['Manufacturer part number'];
		break;
	default :
		partnumber = data.Manufacturer + '-???-' + data['Manufacturer part number'];
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

exports.validateSequenceComponent = function(data, lookups, jsonProperties) {

	var validation = {
	        isValid: true,
	        errorMessages: []
    };

	//based on the Type value validate parent code or sales catalog identifier
	var vCatalogEntryType = data['Type'];
	var vChild = 'Child ID';
	var vParent = 'Parent ID';
	
	validateSequencingType(data, validation);
	validateSequence(data, validation);
	isValidStore(data, validation, jsonProperties);

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


//Returns Child code needed for logging purposes in emrcatalogmanager.js.
exports.getPartNumber = function(data) {
	var childCode = '';
	//Child Code Column
	if (data['PartNumber'] !== ''){
		childCode = data['PartNumber'];
	}

	return childCode;
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

//Checking for the Locale Value in the catalog file
function validateLocale(data,validation,jsonProperties, productCreate) {	
	var locale = data.Locale;
	
	if (productCreate && (locale == undefined || locale.trim() == '' || locale !== "en_US")) {
		console.log('For new item, only locale en_US accepted'+ data.Locale);
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
	
	//CATMAN-57: set Display to customers as required for locales other than en_US
	var isPublished = data['Display to customers US'];
	if (isPublished == undefined)
		isPublished = data['Display to customers'];
	if (!productCreate && locale !== undefined && locale !== "en_US" && (isPublished == undefined || isPublished.trim() == '')) {
		console.log('Display to customers US is a required for locales other than en_US. Locale='+ locale + ' Display to customers US=' + isPublished);
		validation.errorMessages.push('Display to customers US is a required for locales other than en_US. Locale='+ locale + ' Display to customers US=' + isPublished);
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
function validateSalesCatalogCategory(data,lookups, validation, jsonProperties) {	
	
	var storesCategories = lookups.storesCategories;
	var storesInput = data['Store'];
	
	if (data['Sales Catalog(s) Path']  !== undefined && data['Sales Catalog(s) Path'].trim() !== ''){
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
				//console.log('checking Sales Catalog(s) Path ' + salesCategoryToCheck);
				
				if(salesCategoryToCheck == '')
					continue;
			
				for (var k=0; k<storeDataArray.length; k++) {
					store = storeDataArray[k].trim();
					//console.log('checking Sales Catalog(s) Path ' + salesCategoryToCheck + ' for store ' + store);
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

//checking for the Related Product existence
function validateRelatedProduct(data, lookups, validation){
	if(data['Related Products'] != ''){
		var brandMfrNoList = data['Related Products'];
		
		if (brandMfrNoList === undefined || brandMfrNoList === '')
		{
			return;
		}

		var brandMfrNoValues = brandMfrNoList.split("|");
		var seqCounter = 0;
		for (var m = 0; m < brandMfrNoValues.length ; m++) {
			var brandMfrNoArray = brandMfrNoValues[m].split(',');
			if (brandMfrNoArray.length === 2)
			{
				var relatedProductPartNumber = brandMfrNoArray[0].trim() + '-P-' + brandMfrNoArray[1].trim();
				
				if (lookups.mastercataloglookup[relatedProductPartNumber] !== undefined) {
			         console.log("Related Products exists in the Master list of PartNumber")
			    } else {
			        console.log("Related Products does not exists in the Master list of PartNumber")
			        validation.errorMessages.push(relatedProductPartNumber + ' Related Products does not exists. ');
			        validation.isValid = false;
			    }
				
			}
		}
	}
	
}


//checking for the Up-Sell existence
function validateUpSellProduct(data, lookups, validation){
	if(data['Up-Sell'] != ''){
		var brandUpSellList = data['Up-Sell'];
		
		if (brandUpSellList === undefined || brandUpSellList === '')
		{
			return;
		}

		var brandUpSellNoValues = brandUpSellList.split("|");
		var seqCounter = 0;
		for (var m = 0; m < brandUpSellNoValues.length ; m++) {
			var brandUpSellNoArray = brandUpSellNoValues[m].split(',');
			if (brandUpSellNoArray.length === 2)
			{
				var upSellProductPartNumber = brandUpSellNoArray[0].trim() + '-P-' + brandUpSellNoArray[1].trim();
				
				if (lookups.mastercataloglookup[upSellProductPartNumber] !== undefined) {
			         console.log("Up-Sell exists in the Master list of PartNumber")
			    } else {
			        console.log("Up-Sell does not exists in the Master list of PartNumber")
			        validation.errorMessages.push(upSellProductPartNumber + ' Up-Sell does not exists ');
			        validation.isValid = false;
			    }
				
			}
		}
	}
	
}

//checking for the Accessories existence
function validateAccessoriesProduct(data, lookups, validation){
	if(data['Accessories'] != ''){
		var brandAccessoriesList = data['Accessories'];
		
		if (brandAccessoriesList === undefined || brandAccessoriesList === '')
		{
			
			return;
		}

		var brandAccessoriesNoValues = brandAccessoriesList.split("|");
		var seqCounter = 0;
		for (var m = 0; m < brandAccessoriesNoValues.length ; m++) {
			var brandAccessoriesNoArray = brandAccessoriesNoValues[m].split(',');
			if (brandAccessoriesNoArray.length === 2)
			{
				var accessoriesProductPartNumber = brandAccessoriesNoArray[0].trim() + '-P-' + brandAccessoriesNoArray[1].trim();
				
				if (lookups.mastercataloglookup[accessoriesProductPartNumber] !== undefined) {
			         console.log("Accessories exists in the Master list of PartNumber")
			    } else {
			        console.log("Accessories does not exists in the Master list of PartNumber")
			        validation.errorMessages.push(accessoriesProductPartNumber + ' Accessories does not exists ');
			        validation.isValid = false;
			    }
				
			}
		}
	}
}


//for code cleanup - replaced with applyCallToActionValidations
//checking for the CTAs existence
// function validateCTAs(data, lookups, validation){
// 	var ctalookup = lookups.ctalookup;
	
// 	for (var i = 1; i < 5; i++) {
// 		if (data['CallToAction ' + i + ' Name']  !== undefined && data['CallToAction ' + i + ' Name']  !== '' && 
// 			data['CallToAction ' + i + ' URL']  !== undefined && data['CallToAction ' + i + ' URL']  !== '') {
			
// 			var ctaName = data['CallToAction ' + i + ' Name'];
// 			if (ctalookup[ctaName] !== undefined && ctalookup[ctaName] !== '') {
// 				console.log("Call To Action exists in the master list of CTAs.");
// 			} else {
// 				console.log("Call To Action does not exist in the master list of CTAs.");
// 				validation.errorMessages.push(ctaName + ' call to action does not exist.');
// 				validation.isValid = false;
// 			}
// 		}
// 		else { continue; }
// 	}
// }

//for code cleanup - replaced with applyUtilityBeltValidations
//checking for the Utility Belt existence
// function validateUtilityBelt(data, lookups, validation){
// 	var utilitylookup = lookups.utilitybeltlookup;
	
// 	for (var i = 1; i < 4; i++) {
// 		if (data['Utility Belt ' + i + ' Tag']  !== undefined && data['Utility Belt ' + i + ' Tag']  !== '' && 
// 			data['Utility Belt ' + i + ' URL']  !== undefined && data['Utility Belt ' + i + ' URL']  !== '') {
			
// 			var utilityBeltTag = data['Utility Belt ' + i + ' Tag'];
// 			if (utilitylookup[utilityBeltTag] !== undefined && utilitylookup[utilityBeltTag] !== '') {
// 				console.log("Utility Belt exists in the master list of Utility Belt.");
// 			} else {
// 				console.log("Utility Belt does not exist in the master list of Utility Belt.");
// 				validation.errorMessages.push(utilityBeltTag + ' utility belt does not exist.');
// 				validation.isValid = false;
// 			}
// 		}
// 		else { continue; }
// 	}
// }


// Checking for illegal characters
function illegalCharacters(data, validationObj) {

    var illegalCharsMfg = "";
    var illegalCharsMfgPartNum = "";

    var characters = ["~", "`", "!", "@", "#", "$", "%", "^", "&", "*", "+", "=", "{", "[", "}", "]", "|", "'\'", "\"", ":", ";", "<", ">", ".", "?", "/"];

    var manufacturer = data['Manufacturer'];
    var manufacturerPartNum = data['Manufacturer part number'];
    
    for (var j = 0; j < characters.length; j++) {

    	if (manufacturer.indexOf(characters[j]) >= 0) {
    		illegalCharsMfg = illegalCharsMfg + characters[j];
    	}
    	
    	if (manufacturerPartNum.indexOf(characters[j]) >= 0) {
    		illegalCharsMfgPartNum = illegalCharsMfgPartNum + characters[j];
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
        			if (published == undefined || published.trim() == '')
        			{
        				console.log('Display to customers US is required and empty');
    	                validation.errorMessages.push(" @@@ ERROR : Display to customers US is required and empty.");
    	                validation.isValid = false;
        			}
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
        		console.log(fieldName + ' maxLength=' + maxLength + ' data length=' + data[fieldName] + 'data length' + genericUtil.getCharByteCount(data[fieldName]));
                validation.errorMessages.push(" @@@ ERROR : " + fieldName + " max length is " + maxLength);
                validation.isValid = false;
    		}
    	}
    }
 }

function isValidStore(data, validation, jsonProperties) {
	var storesInput = data['Store'];
	var supportedStores = [];
	var validStore = true;
	
	if (storesInput == undefined || storesInput =='') {
		console.log('Store field is required but empty. Skipping remainder of validations for this record');
        validation.errorMessages.push(" @@@ ERROR : Store field is required but empty; Halting validation for this record");
        validation.isValid = false;
        
        //returning false to halt remainder of validation for this record as it is required for lookups
		return false;
	}
	var storeDataArray = storesInput.split("|");
	
	//build populate lookup to minimize loops
	for (var k=0; k<jsonProperties.supportedStores.length; k++) {
		//console.log('building wcStoreIdentifierLookup for ' + jsonProperties.supportedStores[k]['name'] + ' = ' + jsonProperties.supportedStores[k]['wcStoreIdentifier']);
		supportedStores.push(jsonProperties.supportedStores[k]['name']);
	}

	for (var i=0; i<storeDataArray.length; i++) {
		//console.log('checking if ' + storeDataArray[i] + ' is a supported store');
		if (supportedStores.indexOf(storeDataArray[i].trim(' ')) == -1 ) {
			console.log(storeDataArray[i] + ' is not a supported store. Supported stores are ' + supportedStores);
	        validation.errorMessages.push(" @@@ ERROR : " + storeDataArray[i] + " is not a supported store. Supported stores are " + supportedStores);
	        validation.isValid = false;
	        validStore = false;
		}
	}
	return validStore;
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
    var dataArray = Object.keys(data);
    var fieldName;
    var inputFieldValue;
    var inputFieldValueArray;
    var inputFieldReqs;
    var lkupType;
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
    	
    	if (inputFieldReqs !== undefined && fieldName !== 'Locale') {

    		if (inputFieldValue !== undefined && inputFieldValue.trim() !== '') {
    			inputFieldValue = inputFieldValue.trim();
    			
	    		// apply maximum length validation
				applyValidationForMaximumLength(fieldName, inputFieldValue, inputFieldReqs, validation);
				
				// TODO create a reusable code for allowed values validation
	    		//check allowed values
	    		lkupType = inputFieldReqs['LkupType'];
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
    		}
    	} else if (requiresSpecialValidationHandling(fieldName, inputFieldValue)) {
			var specialValidationAttrKey = getSpecialValidationAttributeIdentifier(fieldName);

			if (specialValidationAttrKey === 'EMR Features') {
				applyFeaturesValidations(productCreate, fieldName, data, lookups, validation);
			} else if (specialValidationAttrKey === 'EMR CallToActions') {
				applyCallToActionValidations(productCreate, fieldName, data, lookups, validation);
			} else if (specialValidationAttrKey === 'EMR UtilityBelts') {
				applyUtilityBeltValidations(productCreate, fieldName, data, lookups, validation);
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
function applyCallToActionValidations(isNewProduct, dataHeader, data, lookups, validation) {
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
				
				if (applyGenericValidations) {
					// generic validations
					applyValidationForMinimumOccurence(isNewProduct, referenceAttrName, dataCtaURL, attrRequirements, validation);
					applyValidationForMaximumLength(referenceAttrName, dataCtaURL, attrRequirements, validation);
					// TODO: further enhancement, CTAs as LookupTable or StringENUM
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
function applyUtilityBeltValidations(isNewProduct, dataHeader, data, lookups, validation) {
	var dataHeaderSplitBySpace = dataHeader.split(' ');
	// double check if header is for Utility Belt
	if (dataHeaderSplitBySpace[0] === 'Utility' && dataHeaderSplitBySpace[1] === 'Belt') {
		// var missingTagMessage = 'UtilityBelt with a missing Tag was found';
		// var missingTextMessage = 'UtilityBelt with a missing Text was found';
		// var missingURLMessage = 'UtilityBelt with a missing URL was found';
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
				
				// check if Text exists in the input data
				// TODO to discuss if should be implemented
				// if (genericUtil.isUndefined(dataUBeltText)) {
				// 	toggleValidationToFail(utilityBeltSetReference, missingTextMessage, validation);
				// }

				// check if URL exists in the input data
				// TODO to discuss if should be implemented
				// if (genericUtil.isUndefined(dataUBeltURL)) {
				// 	toggleValidationToFail(utilityBeltSetReference, missingURLMessage, validation);
				// }
				
				if (applyGenericValidations) {
					// generic validations
					applyValidationForMinimumOccurence(isNewProduct, referenceAttrName, dataUBeltText, attrRequirements, validation);
					applyValidationForMaximumLength(referenceAttrName, dataUBeltText, attrRequirements, validation);
					// TODO: further enhancement, UBelts as LookupTable or StringENUM
					applyValidationForMinimumOccurence(isNewProduct, referenceAttrName, dataUBeltURL, attrRequirements, validation);
					applyValidationForMaximumLength(referenceAttrName, dataUBeltURL, attrRequirements, validation);
					// TODO: further enhancement, UBelts as LookupTable or StringENUM
				}
			}
		} else if (dataHeaderSplitBySpace[3] === 'Text') {
			//if (!genericUtil.isUndefined(dataUBeltText) && !genericUtil.isTrimmedEmptyString(dataUBeltText)) {
				// if Text, check if both Tag and URL exist in the input data
				// TODO to discuss if should be implemented
				// if (genericUtil.isUndefined(dataUBeltTag)) {
				// 	toggleValidationToFail(utilityBeltSetReference, missingTagMessage, validation);
				// }
				// if (genericUtil.isUndefined(dataUBeltURL)) {
				// 	toggleValidationToFail(utilityBeltSetReference, missingURLMessage, validation);
				// }
			//}
		} else if (dataHeaderSplitBySpace[3] === 'URL') {
			//if (!genericUtil.isUndefined(dataUBeltURL) && !genericUtil.isTrimmedEmptyString(dataUBeltURL)) {
				// if URL, check if both Tag and Text exist in the input data
				// TODO to discuss if should be implemented
				// if (genericUtil.isUndefined(dataUBeltTag)) {
				// 	toggleValidationToFail(utilityBeltSetReference, missingTagMessage, validation);
				// }
				// if (genericUtil.isUndefined(dataUBeltText)) {
				// 	toggleValidationToFail(utilityBeltSetReference, missingTextMessage, validation);
				// }
			//}
		}
	}
}

// Attribute Dictionary > Special Validation Handling > Features
function applyFeaturesValidations(isNewProduct, dataHeader, data, lookups, validation) {
	var dataHeaderSplitBySpace = dataHeader.split(' ');
	// double check if header is for features
	if (dataHeaderSplitBySpace[0] === 'Feature') {
		var attrRequirements = lookups.attrIdentifier['EMR']['EMR Features'];
		var inputValue = data[dataHeader];
		
		applyValidationForMinimumOccurence(isNewProduct, dataHeader, inputValue, attrRequirements, validation);
		applyValidationForMaximumLength(dataHeader, inputValue, attrRequirements, validation);
		// TODO: further enhancement, Features as LookupTable or StringENUM
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

					if (genericUtil.getCharByteCount(data[fieldName]) > maxLength) {
						toggleValidationToFail('', errorMessage, validation);
					}
				}
			} else {
				if (genericUtil.getCharByteCount(data[fieldName])> maxLength) {
					toggleValidationToFail('', errorMessage, validation);
				}
			}
		}
	}
}

//perform required validations for catalog entry type support
function validateCatalogEntryType(data,lookups, validation, jsonProperties) {
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
function validateParent(data,lookups, validation) {
	var parent = data['Parent'];
	if(parent !== undefined && parent.trim() !== '')
		{
			parent = parent.trim();
			console.log('parent=' + parent);
			
			if (parent !== undefined && parent.trim() !== '') {
		
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
				if (data['Catalog Entry Type'] === 'Product' && (parent.includes('-K-') || parent.includes('-D-'))) {
					console.log(data['Catalog Entry Type'] + ' cannot have a static kit or dynamic kit as a parent');
			        validation.errorMessages.push(" @@@ ERROR : Invalid Parent-Child relationship");
			        validation.isValid = false;
				}
				
				//check if the parent exists
				if (lookups.mastercataloglookup[parent] === undefined) {
					console.log('Parent product ' + parent + ' does not exist');
			        validation.errorMessages.push(" @@@ ERROR : Parent does not exist");
			        validation.isValid = false;
			    }
				
					//SKU cannot have more than one parent product. Failed if attempting to load a parent product that is different than what's listed on mastercatalogPartnumber.csv lookup file
				var partNumber = module.exports.getProductCode(data);
				if (lookups.mastercataloglookup[partNumber] !== undefined) {
					if(lookups.mastercatalogParent[partNumber] !== '' && lookups.mastercatalogParent[partNumber] !== parent){
					console.log('SKU cannot have more than one parent product');
					validation.errorMessages.push(" @@@ ERROR : Invalid Parent-Child relationship (SKU cannot have more than one parent product)");
					validation.isValid = false;
					}
				}
				

			}
		}
}

//validate Product Master Catalog
function validateProductMasterCatalog(data,lookups,validation,productCreate) {
	if(productCreate == false){
		var masterCatalog = data['Full Path'];	
		var partNumber = module.exports.getProductCode(data);
				
		if(lookups.mastercataloglookup[partNumber] === masterCatalog)
			{
			console.log('Same MasterCatalog');			
			}
		else
			{
			console.log('Product is already tagged in Different Master Catalog');
			validation.errorMessages.push(" @@@ ERROR : Product is already tagged in Different Master Catalog");
	        validation.isValid = false;
			}	
	}	
}