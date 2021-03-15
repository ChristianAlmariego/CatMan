exports.validate = function(data,lookups) {

	// validate if record type is 'SKU' since entitled literature has only SKU's and no products
	// validate parent category is specified
	// validate Master Catalog Category is correct
	// validate Sales Catalog Category is correct

	// Add any errors to validationErrors
	//validationErrors.push('Error message');

	var validation = {
	        isValid: true,
	        errorMessages: []
    };

	// Checking for the Master Catalog Category Exist in the Master list
	validateMasterCatalogCategory(data,lookups,validation);

	//Checking for the Sales Catalog Category Exist in the Master list
	validateSalesCatalogCategory(data,lookups, validation)

    //generic validations performed on all fields
    dataDrivenValidations(data,lookups,validation);

    //validate attribute dictionary attributes and allowed values
    attributeDictionaryValidation(data,lookups,validation);

	//validate PartNumber
	validatePartNumber(data, validation);

    return validation;
};


// Validate if the row has the necessar data to proceed with processing
//Returns true/false
// CatalogEntryParentCatalogGroupRelationship
exports.validateSequenceRow = function(data) {
	var partnumber, parentgroupuniqueid, parentstoreidentifier, sequence;
	partnumber = data['Code'];
	parentgroupuniqueid = data['Sales Category Identifier'];
	parentstoreidentifier = data['Store'];
	sequence = data['Sequence'];
	deleteproduct = data['Delete'];

	if (partnumber !== undefined && parentgroupuniqueid !== undefined && parentstoreidentifier !== undefined && sequence !== undefined) {
		if (partnumber !== '' && parentgroupuniqueid !== '' && parentstoreidentifier !== '' && sequence !== '') {
			//console.log("Valid row");
			return true;
		}
		else {
			console.log('Invalid row detected. Code, Sales Category Identifier, Store and Sequence is null.');
			return false;
		}
	}
	else {
		console.log('Invalid row detected. Code, Sales Category Identifier, Store and Sequence is null.');
		return false;
	}
};

exports.validateSequenceComponent = function(data,lookups, jsonProperties) {

	var validation = {
	        isValid: true,
	        errorMessages: []
    };

	//validate PartNumber
	validatePartNumberSequence(data, validation);
	validateCatalogEntryType(data, lookups, validation, jsonProperties);
 
    return validation;
};

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

//Returns Child code needed for logging purposes in emrcatalogmanager.js.
exports.getPartNumber = function(data) {
	var childCode = '';
	//Child Code Column
	if (data['PartNumber'] !== ''){
		childCode = data['PartNumber'];
	}

	return childCode;
};


//Returns Product/Item code needed for logging purposes in emrcatalogmanager.js.
//Returns the code by using the correct header name depending on the store
exports.getProductCode = function(data) {
	var partnumber = data['Document'];
	return partnumber;
};

//Validate if the row has the necessary data to proceed with processing
//Returns true/false
exports.validateRow = function(data) {
	var documentname, document;
	documentname = data['US Name'];
	document = data['Document'];

	if (documentname !== undefined && document !== undefined) {
		if (documentname !== '' && document !== '') {
			//console.log("Valid row");
			return true;
		}
		else {
			console.log('Invalid row detected. US Name, Document is null.');
			return false;
		}
	}
	else {
		console.log('Invalid row detected. US Name, Document is undefined.');
		return false;
	}
};


//Checking for the Master Catalog Category Exist in the Master list
function validateMasterCatalogCategory(data,lookups, validation) {
	var mastercatcategorylookup = lookups.mastercatcategorylookup;
	if (data['Master Catalog'] !== ''){
		if(mastercatcategorylookup[data['Master Catalog']]  == undefined){

			console.log(data['Master Catalog'] + ' Full Path does not exist ');
			validation.errorMessages.push(data['Master Catalog'] + ' Full Path does not exist ');
			validation.isValid = false;
		}
	}
}

//Checking for the Sales Catalog Category Exist in the Master list
function validateSalesCatalogCategory(data,lookups, validation) {
	var storesCategories = lookups.storesCategories;

	if (data['Sales Catalog']  !== undefined && data['Sales Catalog'].trim() !== ''){
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
				console.log(data["Document"] + ' Sales Path ' + salesCategoryToCheck + ' is not a valid sales catalog category');
				validation.errorMessages.push(' Sales Path ' + salesCategoryToCheck + ' is not a valid sales catalog category');
				validation.isValid = false;
			}
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


function dataDrivenValidations(data, lookups, validation) {

    var inputfielddef = lookups.inputfielddef;
    var dataArray = Object.keys(inputfielddef);

    //console.log(inputfielddef['Name']);
    for (var k = 0; k < dataArray.length; k++) {

    	if (!dataArray[k].startsWith('Literature-'))
    		continue;

    	var fieldName = (dataArray[k]).substring(11);
    	//console.log(dataArray[k] + ' == ' + inputfielddef[dataArray[k]]);
    	//var inputFieldReqs = inputfielddef[fieldName];
    	var inputFieldReqs = inputfielddef['Literature' + '-' + fieldName];

    	if (inputFieldReqs !== undefined) {
    		//check if required field
    		var minOccurrence = inputFieldReqs['MIN_OCCURRENCE'];
    		if (minOccurrence > 0 && (data[fieldName] === undefined || data[fieldName] === '')) {
    			console.log(fieldName + ' min occurrence= ' + minOccurrence + ' data=' + data[fieldName]);
                validation.errorMessages.push(" @@@ ERROR : " + fieldName + " is required and empty.");
                validation.isValid = false;
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

    var attrdef = lookups.header['Literature'];
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
	
	// TODO currently there is no need for implementation of basic rules validation for
	// required fields for Literature since it has no attributes with minOccurence

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