exports.validate = function(data,lookups, jsonProperties, productCreate) {

	var validation = {
	        isValid: true,
	        errorMessages: []
    };

    // check for illegal characters
    illegalCharacters(data,validation);

    // check if new or existing product
    //var isNewProd = isNewProduct(data,lookups,validation);
    //console.log('New Product? ' + isNewProd);

    //generic validations performed on all fields
    dataDrivenValidations(data,lookups,validation, productCreate);

    //validate attribute dictionary attributes and allowed values
    attributeDictionaryValidation(data,lookups,validation);

 // Checking for the Master Catalog Category Exist in the Master list
	validateMasterCatalogCategory(data,lookups,validation);

	//Checking for the Sales Catalog Category Exist in the Master list
	validateSalesCatalogCategory(data,lookups, validation, jsonProperties)

	//Checking for the Product then Parent Category is Specified
	validateProductParentCat(data, validation);

	//SKU is not singleton
	//SKU is singleton
	validateSKU(data, validation);

	//validate PartNumber
	validatePartNumber(data, validation);

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

	//validations for component type support
	validateComponentType(data,lookups, validation, jsonProperties);

    // check for illegal characters
//    illegalCharacters(data,validation);


 // validate URL Keyword and Page Title are available for new locales
 // validate no errors on save in the logs

 // TODO add Related Products
 // TODO add product name and line number to error & success messages
 // TODO character turn new row bug

    return validation;
};


exports.validateSequenceComponent = function(data,lookups, jsonProperties) {

	var validation = {
	        isValid: true,
	        errorMessages: []
    };

	//validate PartNumber
    validateCodeSequence(data, lookups, validation);
 	validateSalesCategoryIdentifier(data, lookups, validation);
	validateSequence(data,validation);
	isValidStore(data,validation,jsonProperties);

    return validation;
};

//Returns Child code needed for logging purposes in emrcatalogmanager.js.
exports.getCodePartNumber = function(data) {
	var childCode = '';
	//Child Code Column
	if (data['Code'] !== ''){
		childCode = data['Code'];
	}
	return childCode;
};

function validateSequence(data, validation){
	var sequence = data['Sequence'];
	var deleteproduct = data['Delete'];

	if( (deleteproduct === "" || deleteproduct === undefined ) && (sequence === "" || sequence === undefined)){
			validation.errorMessages.push(' @@@ ERROR: '+data['Code']+' Sequence is null ');
			validation.isValid = false;	
	}else if(deleteproduct.length > 0){
		console.log('deleteproduct:'+deleteproduct+' length: '+deleteproduct.length);
		if(deleteproduct !== "yes" && deleteproduct !== "Yes"){
			validation.errorMessages.push(' @@@ ERROR: '+data['Code']+' Delete is invalid value (Yes, yes)');
			validation.isValid = false;	
		}
	}else if (sequence !== '' &&  (deleteproduct === "" || deleteproduct === undefined )){
		if (Number.isNaN(parseInt(sequence))){
			validation.errorMessages.push(' @@@ ERROR: '+sequence+' Sequence is invalid value');
			validation.isValid = false;	
		}
	}

}


function validateSalesCategoryIdentifier(data, lookups, validation){
	var salescategoryidentifier = data['Sales Category Identifier'];

//--  validate sales category identifier / parent identifier
	if (lookups.mastercatcategorylookup[salescategoryidentifier] !== undefined) {
			console.log("Sales Category Identifier exists in the Master list")
	} else {
		console.log("Sales Category Identifier does not exists in the Master list")
		validation.errorMessages.push(' @@@ ERROR: '+salescategoryidentifier + ' Sales Category Identifier does not exists. ');
		validation.isValid = false;	
	}
}


function validateCodeSequence(data, lookups, validation){
	console.log('Start validateCode-PartNumber');
	var partNumber = data['Code'];
	
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


//Returns Child code needed for logging purposes in emrcatalogmanager.js.
exports.getChildCode = function(data) {
	var childCode = '';
	//Child Code Column
	if (data['Child Code'] !== ''){
		childCode = data['Child Code'];
	}

	return childCode;
};

//Returns Child code needed for logging purposes in emrcatalogmanager.js.
exports.getPartNumber = function(data) {
	var childCode = '';
	//Child Code Column
	if (data['PartNumber'] !== ''){
		childCode = data['PartNumber'];
	}

	return childCode;
};


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
//Returns Product/Item code needed for logging purposes in emrcatalogmanager.js.
//Returns the code by using the correct header name depending on the store
exports.getProductCode = function(data) {
	var partNumber = data['Item PK'];
	return partNumber;
};

//Validate if the row has the necessary data to proceed with processing
//Returns true/false
exports.validateRow = function(data) {
	var manufacturer, partnumber, catentrytype;
	manufacturer = data['Manufacturer'];
	partnumber = data['Manufacturer Part Number'];
	catentrytype = data['Type Product and SKU'];

	if (manufacturer !== undefined && partnumber !== undefined && catentrytype !== undefined) {
		if (manufacturer !== '' && partnumber !== '' && catentrytype !== '') {
			//console.log("Valid row");
			return true;
		}
		else {
			console.log('Invalid row detected. Manufacturer, Manufacturer Part Number and Type Product and SKU is null.');
			return false;
		}
	}
	else {
		console.log('Invalid row detected. Manufacturer, Manufacturer Part Number and Type Product and SKU is undefined.');
		return false;
	}
};


// Validate if the row has the necessar data to proceed with processing
//Returns true/false
// CatalogEntryParentCatalogGroupRelationship
exports.validateSequenceRow = function(data) {
var partnumber, parentgroupuniqueid, parentstoreidentifier;
	partnumber = data['Code'];
	parentgroupuniqueid = data['Sales Category Identifier'];
	parentstoreidentifier = data['Store'];

	if (partnumber !== undefined && parentgroupuniqueid !== undefined && parentstoreidentifier !== undefined) {
		if (partnumber !== '' && parentgroupuniqueid !== '' && parentstoreidentifier !== '') {
			return true;
		}
		else {
			console.log('Invalid row detected. Code, Sales Category Identifier, Store  is null.');
			return false;
		}
	}
	else {
		console.log('Invalid row detected. Code, Sales Category Identifier, Store  is null.');
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


//Checking for the Master Catalog Category Exist in the Master list
function validateMasterCatalogCategory(data,lookups, validation) {
	var mastercatcategorylookup = lookups.mastercatcategorylookup;
	if(data['Master Catalog'] !== ''){
	if(mastercatcategorylookup[data['Master Catalog']]  == undefined){

			validation.errorMessages.push(data['Master Catalog'] + ' does not exist ');
			validation.isValid = false;
		}
	}
}

//Checking for the Sales Catalog Category Exist in the Master list
function validateSalesCatalogCategory(data,lookups, validation, jsonProperties) {
	var storesCategories = lookups.storesCategories;

	if (data['Sales Catalog']  !== undefined && data['Sales Catalog'].trim() !== '' ){
		var salesCatalogDatAarray = data['Sales Catalog'].split("|");
		var salesCategoryToCheck;
		var stCategories;
		var category;

		for (var j = 0; j < salesCatalogDatAarray.length; j++)
		{
			salesCategoryToCheck = salesCatalogDatAarray[j].trim(' ');
			//console.log('checking Sales Catalog(s) Path ' + salesCategoryToCheck);

			if(salesCategoryToCheck == '')
				continue;

			console.log('checking Sales Path ' + salesCategoryToCheck);
			stCategories = storesCategories['PROTEAM'];

			//check if the sales category exists
			category = stCategories[salesCategoryToCheck];

			if (stCategories.indexOf(salesCategoryToCheck) == -1 )
			{
				console.log(data["Manufacturer Part Number"] + ' Sales Path ' + salesCategoryToCheck + ' is not a valid sales catalog category');
				validation.errorMessages.push(' Sales Path ' + salesCategoryToCheck + ' is not a valid sales catalog category');
				validation.isValid = false;
			}
		}
	}
}

//Checking for the Product then Parent Category is Specified
function validateProductParentCat(data, validation) {
	if (data['Type Product and SKU'] ==='Product') {
		if (data['Master Catalog'] === '')
			{
			validation.errorMessages.push(' Master Catalog should not be Empty ');
			validation.isValid = false;
			}
	}
}


//SKU is singleton
function validateSKU(data, validation){
	if(data['Type Product and SKU'] ==='SKU' && data['Parent ID'] ===''){
		if(data['Master Catalog'] === '')
		{
			validation.errorMessages.push(' Master Catalog should not be Empty ');
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
		console.log('ERROR : Part Number maxLength=' + maxLength + ' data=[' + partNumber + '] data length=' + partNumber.length);
        validation.errorMessages.push(" @@@ ERROR : Part Number Max Length is " + maxLength);
        validation.isValid = false;
	}
}


/**
 * validatePartNumber Sequence
 *
 * @param data
 * @param validation
 * @returns
 */
function validatePartNumberSequence(data, validation){
	console.log('Start validatePartNumber Sequence');
	var partNumber = data['PartNumber'];
	var maxLength = 64;

	//partNumber length validation
	if (!(partNumber === undefined) && partNumber.length > maxLength) {
		console.log('ERROR : Code maxLength=' + maxLength + ' data=[' + partNumber + '] data length=' + partNumber.length);
        validation.errorMessages.push(" @@@ ERROR : Code Max Length is " + maxLength);
        validation.isValid = false;
	}
}






// Checking for illegal characters
function illegalCharacters(data, validationObj) {

    var illegalCharsMfg = "";
    var illegalCharsMfgPartNum = "";

    var characters = ["~", "`", "!", "@", "#", "$", "%", "^", "&", "*", "+", "=", "{", "[", "}", "]", "|", "'\'", "\"", ":", ";", "<", ">", ".", "?"];

    var manufacturer = data['Manufacturer'];
    var manufacturerPartNum = data['Manufacturer Part Number'];
    console.log('in illegalChars');
    for (var j = 0; j < characters.length; j++) {

    	if (manufacturer.indexOf(characters[j]) >= 0) {
    		illegalCharsMfg = illegalCharsMfg + characters[j];
    	}

    	if (manufacturerPartNum.indexOf(characters[j]) >= 0) {
    		illegalCharsMfgPartNum = illegalCharsMfgPartNum + characters[j];
    	}
    }

    if (illegalCharsMfg !== "") {
		validationObj.errorMessages.push(" @@@ ERROR : Manufacturer contains illegal characters!" + characters[j]);
		console.log(" @@@ ERROR : Manufacturer contains illegal characters!" + illegalCharsMfg);
    	validationObj.isValid = false;
    }

    if (illegalCharsMfgPartNum !== "") {
		validationObj.errorMessages.push(" @@@ ERROR : Manufacturer contains illegal characters!" + characters[j]);
		console.log(" @@@ ERROR : Manufacturer Part Number contains illegal characters!" + illegalCharsMfgPartNum);
    	validationObj.isValid = false;
    }
}

function dataDrivenValidations(data, lookups, validation, productCreate) {

    var inputfielddef = lookups.inputfielddef;
    var dataArray = Object.keys(inputfielddef);
    var requiredForUpdate = ['Master Catalog','Manufacturer','Manufacturer Part Number','Type Product and SKU'];

    //console.log(inputfielddef['Name']);
    for (var k = 0; k < dataArray.length; k++) {

    	if (!dataArray[k].startsWith('ProTeam-'))
    		continue;

    	var fieldName = (dataArray[k]).substring(8);
    	//console.log(dataArray[k] + ' == ' + inputfielddef[dataArray[k]]);
    	//var inputFieldReqs = inputfielddef[fieldName];
    	var inputFieldReqs = inputfielddef['ProTeam' + '-' + fieldName];

    	if (inputFieldReqs !== undefined) {
    		//check if required field
    		if (productCreate || (requiredForUpdate.indexOf(fieldName) != -1)) {
	    		var minOccurrence = inputFieldReqs['MIN_OCCURRENCE'];
	    		if (minOccurrence > 0 && (data[fieldName] === undefined || data[fieldName] === '')) {
	    			console.log(fieldName + ' min occurrence= ' + minOccurrence + ' data=' + data[fieldName]);
	                validation.errorMessages.push(" @@@ ERROR : " + fieldName + " is required and empty.");
	                validation.isValid = false;
	    		}
    		}

    		//check max length
    		var maxLength = inputFieldReqs['MAXLENGTH'];
    		if (!(data[fieldName] === undefined) && data[fieldName].length > maxLength) {
        		console.log(fieldName + ' maxLength=' + maxLength + ' data length=' + data[fieldName] + 'data length' + data[fieldName].length);
                validation.errorMessages.push(" @@@ ERROR : " + fieldName + " max length is " + maxLength);
                validation.isValid = false;
    		}
    	}
    }
 }

//validate attribute dictionary attributes and allowed values
function attributeDictionaryValidation(data,lookups,validation) {
	//for each field in input record
	//  check if required field
	//  check maxlength
	//  if field is of type lookup table or string enumeration
	//    inputValues = data.split(|)
	//    for each inputValue
	//      check if in allowed values
	//

    var attrdef = lookups.header['ProTeam'];
    var dataArray = Object.keys(data);
    var fieldName;
    var inputFieldValue;
    var inputFieldValueArray;
    var inputFieldReqs;
    var minOccurrence;
    var maxLength;
    var lkupType;
    var attrvalLookups;
    var attrIdentifier;

    for (var k = 0; k < dataArray.length; k++) {
    	fieldName = dataArray[k];
    	inputFieldReqs = attrdef[fieldName];
    	inputFieldValue = data[fieldName];
    	//console.log('attribute dictionary validation for = ' + fieldName + ' inputFieldReqs=' + inputFieldReqs);

    	if (inputFieldReqs !== undefined) {
    		//check if required field
    		minOccurrence = inputFieldReqs['MinOcurrences'];
    		//console.log(fieldName + ' minOccurrence=' + minOccurrence);
    		if (minOccurrence > 0 && (inputFieldValue === undefined || inputFieldValue.trim() === '')) {
    			console.log(' @@@ ERROR : ' + fieldName + ' min occurrence= ' + minOccurrence + ' data=' + inputFieldValue);
                validation.errorMessages.push(" @@@ ERROR : " + fieldName + " is required and empty.");
                validation.isValid = false;
                continue; //stop further validation of this field and move on to the next
    		}

    		if (inputFieldValue !== undefined && inputFieldValue.trim() !== '') {
    			inputFieldValue = inputFieldValue.trim();

	    		//check max length
	    		maxLength = inputFieldReqs['MaxLength'];
	    		maxLength = maxLength.valueOf();
	    		//console.log(fieldName + ' maxLength =' + maxLength + ' data length=' + inputFieldValue.length + ' Number.isNaN(maxLength)=');
	    		if (maxLength > 0 && inputFieldValue.length > maxLength) {
	        		console.log(' @@@ ERROR : ' + fieldName + ' maxLength=' + maxLength + ' data length=' + inputFieldValue + 'data length' + inputFieldValue.length);
	                validation.errorMessages.push(" @@@ ERROR : " + fieldName + " max length is " + maxLength);
	                validation.isValid = false;
	                continue; //stop further validation of this field and move on to the next
	    		}

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
    	}
    }
}