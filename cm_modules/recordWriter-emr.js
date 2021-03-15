// setup default properties
var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;

// setup extended properties
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var systemProperties = propertiesReader.getSystemProperties();

// setup cm_modules
var constants = require(cmModulesPath + systemProperties.path().catman.constants);
var dataHelper = require(cmModulesPath + systemProperties.path().catman.dataHelper);
var genericUtil = require(cmModulesPath + systemProperties.path().catman.genericUtilities);

var validLocales;

//TBD: code refactoring - move to dataHelper
function getPartnumber(data)
{
	var partnumber = '';
//Trimming the partnumber
	var dataPartNumber = data['Manufacturer part number'].trim();
	var manufacturer = data['Manufacturer'].trim();

	//PartNumber column
	switch (data['Catalog Entry Type']) {
	case 'Product' :
		partnumber = manufacturer + '-P-' + dataPartNumber;
		break;
	case 'SKU' :
		partnumber = manufacturer + '-' + dataPartNumber;
		break;
	case 'Bundle' :
		partnumber = manufacturer + '-B-' +dataPartNumber;
		break;
	case 'Static Kit' :
		partnumber = manufacturer + '-K-' + dataPartNumber;
		break;
	case 'Dynamic Kit' :
		partnumber = manufacturer + '-D-' + dataPartNumber;
		break;
	default :
		partnumber = manufacturer + '-???-' + dataPartNumber;
	}
	return partnumber;
}

//TBS: code refactoring - no need for this function? upon entering writer, locale is surely in data because it is required
function getLocale(data)
{
	var locale = data.Locale;
	if (locale in validLocales)
	{
		return validLocales[locale];
	}
	else (locale === 'en_US')
	{
		return -1;
	}
}

function writeBaseFields(data, outputStreams) {
	var output = [];
	// outputs an object containing a set of key/value pair representing a line found in the csv file.

	//PartNumber column
	var partnumber = getPartnumber(data);
	var locale = getLocale(data);
	if (locale === -1)
	{
		output[0] = partnumber;

		//Type column
		output[1] = getCatalogEntryTypeMapping(data);

		//ParentPartNumber column
		if (data['Parent'] !== undefined)
		{
			output[2] = data['Parent'];
		}
		else
		{
			output[2] = '';
		}

		//Manufacturer
		output[3] = data.Manufacturer;

		//ManufacturerPartNumber
		output[4] = data['Manufacturer part number'];

		//Sequence column (empty)
		output[5] = '';

		//ParentGroupIdentifier
		output[6] = data['Full Path'];

		//Delete (empty)
		output[7] = '';

		outputStreams.csvCatEntStream.write(output);

		//reset output array for next file
		output.splice(0);

		//On Special
		if (data['On Special']  !== undefined && data['On Special'].trim() !== '')
		{
			output[0] = partnumber;
			output[1] = getCatalogEntryTypeMapping(data);
			if ('TRUE' === data['On Special'])
			{
				output[2] = '1';
			}
			else
			{
				output[2] = '0';
			}
			output[3] = '';

			outputStreams.csvCatEntOnSpecialStream.write(output);

			//reset output array for next file
			output.splice(0);
		}

		//For Purchase
		if (data['For Purchase']  !== undefined && data['For Purchase'].trim() !== '')
		{
			output[0] = partnumber;
			output[1] = getCatalogEntryTypeMapping(data);
			if ('TRUE' === data['For Purchase'])
			{
				output[2] = '1';
			}
			else
			{
				output[2] = '0';
			}
			output[3] = '';

			outputStreams.csvCatEntForPurchaseStream.write(output);

			//reset output array for next file
			output.splice(0);
		}

		//Price
		if (data.Price  !== undefined && data.Price.trim() !== '')
		{
			output[0] = partnumber;
			output[1] = getCatalogEntryTypeMapping(data);
			output[2] = 'USD';
			output[3] = data.Price;
			output[4] = data.Price;
			output[5] = '';

			outputStreams.csvCatEntPriceStream.write(output);

			//reset output array for next file
			output.splice(0);
		}

		//URL
		if (data.URL  !== undefined && data.URL.trim() !== '')
		{
			output[0] = partnumber;
			output[1] = getCatalogEntryTypeMapping(data);
			output[2] = data.URL;
			output[3] = '';

			outputStreams.csvCatEntURLStream.write(output);

			//reset output array for next file
			output.splice(0);
		}

		//Subscription item
		if (data['Subscription item']  !== undefined && data['Subscription item'].trim() !== '')
		{
			output[0] = partnumber;
			output[1] = getCatalogEntryTypeMapping(data);
			if ('TRUE' === data['Subscription item'])
			{
				output[2] = 'TIME-EVENT-BASED';
			}
			else
			{
				output[2] = 'NONE';
			}
			output[3] = '';

			outputStreams.csvCatEntSubsStream.write(output);

			//reset output array for next file
			output.splice(0);
		}

		//Recurring order item
		if (data['Recurring order item']  !== undefined && data['Recurring order item'].trim() !== '')
		{
			output[0] = partnumber;
			output[1] = getCatalogEntryTypeMapping(data);
			if ('TRUE' === data['Recurring order item'])
			{
				output[2] = '0'; // database column is disallow so logical 'not'
			}
			else
			{
				output[2] = '1';
			}
			output[3] = '';

			outputStreams.csvCatEntRecOrderStream.write(output);

			//reset output array for next file
			output.splice(0);
		}
	}

	//Name
	var catName = data['US Name'];
	if (catName == undefined || catName.trim() == ''){
		catName = data['Name']
	}
	if (catName  !== undefined && catName.trim() !== '')
	{
		output[0] = partnumber;
		output[1] = getCatalogEntryTypeMapping(data);
		output[2] = locale;
		output[3] = catName;
		output[4] = '';

		outputStreams.csvCatEntDescNameStream.write(output);

		//reset output array for next file
		output.splice(0);
	}

	//LongDescription
	if (data['Long Description']  !== undefined && data['Long Description'].trim() !== '')
	{
		output[0] = partnumber;
		output[1] = getCatalogEntryTypeMapping(data);
		output[2] = locale;
		output[3] = data['Long Description'];
		output[4] = '';

		outputStreams.csvCatEntDescLongDescStream.write(output);

		//reset output array for next file
		output.splice(0);
	}

	//Published
	var published = data['Display to customers US'];
	if (published == undefined || published.trim == '') {
		//per email from Ashley on 12/13 use either Display to customers or Display to customers US
		published = data['Display to customers'];
	}
	if (published  !== undefined && published.trim() !== '')
	{
		output[0] = partnumber;
		output[1] = getCatalogEntryTypeMapping(data);
		output[2] = locale;
		if ('TRUE' === published)
		{
			output[3] = '1';
		}
		else
		{
			output[3] = '0';
		}
		output[4] = '';

		outputStreams.csvCatEntDescPublishedStream.write(output);

		//reset output array for next file
		output.splice(0);
	}

	//Keyword
	var kyword = data['Keyword US'];
	if(kyword == undefined || kyword.trim == ''){
		kyword = data['Keyword'];
	}
	if (kyword  !== undefined && kyword.trim() !== '')
	{
		output[0] = partnumber;
		output[1] = getCatalogEntryTypeMapping(data);
		output[2] = locale;
		output[3] = kyword;
		output[4] = '';

		outputStreams.csvCatEntDescKeywordStream.write(output);

		//reset output array for next file
		output.splice(0);
	}

	//en-US metadata can be handled normally, all other locales must be handled differently
	if (locale === -1)
	{
		//PageTitle
		var pageTitle = data['Page title US'];
		if(pageTitle == undefined || pageTitle == ''){
			pageTitle = data['Page title'];
		}
		if (pageTitle  !== undefined && pageTitle.trim() !== '')
		{
			output[0] = partnumber;
			output[1] = getCatalogEntryTypeMapping(data);
			output[2] = -1;
			output[3] = pageTitle;
			output[4] = '';

			outputStreams.csvCatEntSEOPageTitleStream.write(output);

			//reset output array for next file
			output.splice(0);
		}

		//MetaDescription
		var metaDesc = data['Meta description US'];
		if(metaDesc == undefined || metaDesc == ''){
			metaDesc = data['Meta description'];
		}
		if (metaDesc  !== undefined && metaDesc.trim() !== '')
		{
			output[0] = partnumber;
			output[1] = getCatalogEntryTypeMapping(data);
			output[2] = -1;
			output[3] = metaDesc;
			output[4] = '';

			outputStreams.csvCatEntSEOMetaDescStream.write(output);

			//reset output array for next file
			output.splice(0);
		}
	}
	else
	{
		//PageTitle
		var pageTitle = data['Page title US'];
		if(pageTitle == undefined || pageTitle == ''){
			pageTitle = data['Page title'];
		}
		if (pageTitle  !== undefined && pageTitle.trim() !== '')
		{
			output[0] = partnumber;
			output[1] = pageTitle.trim();
			output[2] = '';

			outputStreams['csvCatEntSEOPageTitleStream' + data.Locale].write(output);

			//reset output array for next file
			output.splice(0);
		}

		//MetaDescription
		var metaDesc = data['Meta description US'];
		if(metaDesc == undefined || metaDesc == ''){
			metaDesc = data['Meta description'];
		}
		if (metaDesc  !== undefined && metaDesc.trim() !== '')
		{
			output[0] = partnumber;
			output[1] = metaDesc.trim();
			output[2] = '';

			outputStreams['csvCatEntSEOMetaDescStream' + data.Locale].write(output);

			//reset output array for next file
			output.splice(0);
		}
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
//URLKeyword


function writeURLKeyword(data, outputStreams, lookups) {
	var output = [];
	var locale = getLocale(data);
	var partNumber = getPartnumber(data);

	output[0] = partNumber;
	output[1] = getCatalogEntryTypeMapping(data);
	output[2] = locale;

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

	urlkeyword = removeSpecialCharcaters(urlkeyword);
	output[3] = urlkeyword;
	output[4] = '';

	//Add to lookup
	lookups.urlkeyword_PartNumber[urlkeyword] = partNumber;
	lookups.urlkeyword[partNumber] = urlkeyword;

	outputStreams.csvCatEntSEOUrlKeywordStream.write(output);

	//reset output array for next file
	output.splice(0);

}

function writeAttributes(data,outputStreams,lookups,jsonProperties,isDeprecated) {
	var output = [];
	var locale = getLocale(data);
	var partnumber = getPartnumber(data);
	//retrieve all the keys from the header lookup table (ie. column headers)
	var headercols = [];
	var headerlookup = lookups.header['EMR'];
	var attrlookup = lookups.attrval;
	var attrsequencelookup = lookups.attrsequence;

	for (var k in headerlookup) {
		if (k !== undefined && k !== '') {
			headercols.push(k);
		}
	}

	//write each header value
	for (var i = 0; i < headercols.length; i++) {
		if (data[headercols[i]] !== undefined && data[headercols[i]] !== '') {
			var seq = 0;
			var dataarray = [];

			if (headerlookup[headercols[i]].MultiValue !== undefined && headerlookup[headercols[i]].MultiValue > 1) {
				dataarray = data[headercols[i]].split("|");
			} else {
				dataarray[0] = data[headercols[i]];
			}

			dataarray = dataHelper.removeInvalidElements(dataarray);

			for (var j = 0; j < dataarray.length; j++) {
				var dataElement = dataHelper.removeNewLine(dataarray[j].trim());
				var attrIdentifier = headerlookup[headercols[i]].Identifier;
				var attrUsage = headerlookup[headercols[i]].AttributeType;
				var attrFieldName = headercols[i];
				var attributeUsage = '';

				//deprecated locale verification.
				var isDeprecatedField = isDeprecatedLocaleField(isDeprecated, attrFieldName, jsonProperties);

				if (isDeprecatedField) {
					//console.log(" @@@ Deprecated Attribute! Will SKIP WRITING This Attribute to FILE : " + attrFieldName);
					continue;
				}

				output[0] = partnumber;
				output[1] = attrIdentifier;
				output[2] = locale;

				//Update the Attribute Usage if Defining or Descriptive
				if((headerlookup[headercols[i]].AttrValPrefix).includes("Attribute_Dictionary_Descriptive_Attributes")) {
					attributeUsage = "Descriptive";
				} else {
					attributeUsage = "Defining";
				}

				//Update the Attribute Level Sequence
				var sequence = attrsequencelookup[attrIdentifier];
				if(sequence === undefined) {
					sequence = 0;
				}

				//if attribute uses is a MultiValue, update the sequence
				if (attrIdentifier == 'EMR AttrSequencing') {
					sequence = j + 1;
				} else {
					if (headerlookup[headercols[i]].MultiValue !== undefined && headerlookup[headercols[i]].MultiValue > 1) {
						var threeZero = ".000";
						var twoZero = ".00";
						var zeros;

						if (j < 11) { 
							zeros = threeZero;
						} else {
							zeros = twoZero;
						}

						if (j == 0) {
							sequence = sequence;
						} else {
							sequence = sequence + zeros + j;
						}
					}
				}

				//if attribute uses a lookup table, then use that
				if (headerlookup[headercols[i]].LkupType === 'LOOKUP_TABLE' || headerlookup[headercols[i]].LkupType === 'STRING_ENUMERATION') {
					output[3] = 'Lookup_Value_Identifier';

					if (attrlookup[attrIdentifier] !== undefined &&
						attrlookup[attrIdentifier][dataElement] !== undefined) {
						output[3] = attrlookup[attrIdentifier][dataElement].ValueIdentifier;
					}
				} else {
					//this is not in a lookup table so the value needs to be in the catalog entry specific allowed values
					var attroutput = [];
					var suffix = '';

					if (attrIdentifier == 'EMR AttrSequencing') {
						suffix = '_' + dataElement.replace(/\W/g, constants.DEFAULT_ID_SEPARATOR);
					} else {
						if (dataarray.length > 1) {
							suffix = '_' + seq;
						}
					}

					output[3] = headerlookup[headercols[i]].AttrValPrefix + '_' + output[1].replace(/\W/g,'_') + '_' +
									partnumber.replace(/\W/g,'_') + '_ValueID' + suffix;
					attroutput[0] = attrIdentifier; //Identifier
					attroutput[1] = locale; //LanguageId
					attroutput[2] = output[3]; //ValueIdentifier
					attroutput[3] = sequence; //Sequence
					attroutput[4] = dataElement; //Value

					if (attrUsage == '1') {
						attroutput[5] = '1';
					}
					else if (attrUsage == '2') {
						attroutput[5] = '';
					}
					
					//ValueUsage
					attroutput[6] = ''; //AttributeValueField1
					attroutput[7] = ''; //AttributeValueField2
					attroutput[8] = ''; //AttributeValueField3
					attroutput[9] = ''; //Image1
					attroutput[10] = ''; //Image2
					attroutput[11] = ''; //Field1
					attroutput[12] = ''; //Field2
					attroutput[13] = ''; //Field3

					if (attrUsage == '1') {
						outputStreams.csvAttrDictAttrAllowValsStream.write(attroutput);
					}

					//reset output array for next row
					attroutput.splice(0);
				}

				output[4] = dataElement;
				output[5] = attributeUsage;
				output[6] = sequence;
				output[7] = 'EmersonCAS';
				output[8] = '';
				output[9] = '';
				output[10] = '';
				output[11] = '';

				//Removed for EDS-4658, Catalog:  Issue with usage 2 attributes & locale specific imports
//				if (locale === -1)
//				{

					if (headerlookup[headercols[i]].MultiValue !== undefined && headerlookup[headercols[i]].MultiValue > 1) {
						outputStreams.csvCatEntAttrDictAttrRelStream.write(output);
					} else {
						outputStreams.csvCatEntAttrDictAttrRelSingleStream.write(output);
					}
//				}

				//reset output array for next row
				output.splice(0);
				seq++;
			}
			dataarray.splice(0);
		}

	}// end of forloop

	headercols.splice(0);
}

//Attribute values which need to be added regardless of whether it comes in the
//business catalog file can be added to this function
//ex: Attr: TabSequence AttrVal: UtilityBelt(CATMAN-34)
function writeDefaultAttributeValues(data,outputStreams,lookups) {
	var output = [];
	var partnumber = getPartnumber(data);
	var headerlookup = lookups.header['EMR'];
	var attrlookup = lookups.attrval;
	var attrsequencelookup = lookups.attrsequence;

	if (data['TabSequence'] !== undefined && data['TabSequence'].trim() !== '')
	{
		var seq = 0;
		var dataarray = data['TabSequence'].split("|").map(function (item) {
			return item.trim();
		});

		if (dataarray.indexOf('UtilityBelt') == -1) {
			//console.log('there ain\'t no UtilityBelt specified in TabSequence');
			var attrIdentifier = headerlookup['TabSequence'].Identifier;
			output[0] = partnumber;
			output[1] = attrIdentifier;
			output[2] = -1;

			//Update the Attribute Level Sequence
			var sequence = attrsequencelookup[attrIdentifier];
			if(sequence === undefined) {
				sequence = 0;
			}

			//if attribute uses is a MultiValue, update the sequence
			if (headerlookup['TabSequence'].MultiValue !== undefined && headerlookup['TabSequence'].MultiValue > 1)
			{
				var threeZero = ".000";
				var twoZero = ".00";
				var zeros;
				var tempArray = [];
				for (var q in attrlookup[attrIdentifier]) {
					tempArray.push(q);
				}
				if (tempArray.length < 11) { zeros = threeZero; } else { zeros = twoZero; }

				sequence = sequence + zeros;
			}

			//if attribute uses a lookup table, then use that
			if (headerlookup['TabSequence'].LkupType === 'LOOKUP_TABLE' || headerlookup['TabSequence'].LkupType === 'STRING_ENUMERATION')
			{
				//console.log(attrlookup[attrIdentifier].length + 'length of attr values array=' + attrlookup[attrIdentifier]['UtilityBelt'].Sequence);
				sequence = sequence + attrlookup[attrIdentifier]['UtilityBelt'].Sequence;
				output[3] = attrlookup[attrIdentifier]['UtilityBelt'].ValueIdentifier;
			}

			output[4] = 'UtilityBelt';
			output[5] = 'Descriptive';
			output[6] = sequence;
			output[7] = 'EmersonCAS';
			output[8] = '';
			output[9] = '';
			output[10] = '';
			output[11] = '';
			outputStreams.csvCatEntAttrDictAttrRelStream.write(output);

			//reset output array for next row
			output.splice(0);
		}
		dataarray.splice(0);
	}

}


//Sales Catalog(s) Path
function writeSalesCatalogPath(data,outputStreams,lookups, jsonProperties) {
	var output = [];
	var wcStoreIdentifier;
	var wcStoreIdentifierLookup = [];
	var partnumber = getPartnumber(data);
	var storesInput = data['Store'];

	if ((data['Sales Catalog(s) Path']  !== undefined) && (data['Sales Catalog(s) Path'].trim() !== '')){
		if (storesInput !== undefined && storesInput !=='') {
			var dataarray = data['Sales Catalog(s) Path'].split("|");
			var storeArray = data['Store'].split("|");
			var currentStore;

			//console.log('inside writeSalesCatalogPath');
			//build populate lookup to minimize loops
			for (var k=0; k<jsonProperties.supportedStores.length; k++) {
				//console.log('building wcStoreIdentifierLookup for ' + jsonProperties.supportedStores[k]['name'] + ' = ' + jsonProperties.supportedStores[k]['wcStoreIdentifier']);
				wcStoreIdentifierLookup[jsonProperties.supportedStores[k]['name']] = jsonProperties.supportedStores[k]['wcStoreIdentifier'];
			}

			//for each store, write the records into catentrycatgrprel-<store>.csv
			for (var i=0; i<storeArray.length; i++) {
				currentStore = storeArray[i];
				//console.log('working on store ' + currentStore);
				//lookup the wcStoreIdentifier from JSON properties
				wcStoreIdentifier = wcStoreIdentifierLookup[currentStore];
				//console.log('wcStoreIdentifier = ' + wcStoreIdentifier);

				//write rows for each sales category
				for (var j = 0; j < dataarray.length; j++)
				{
					if (dataarray[j] !== undefined && dataarray[j].trim() !== '')
					{
						output[0] = partnumber; // PartNumber
						output[1] = getCatalogEntryTypeMapping(data); // Type
						output[2] = dataarray[j].trim(); //ParentGroupIdentifier
						output[3] = wcStoreIdentifier; //ParentStoreIdentifier
						output[4] = ''; //Sequence output[3] = j;
						output[5] = ''; //Delete

						//outputStreams.csvCatEntParentCatGrpRelStream.write(output);
						outputStreams.storesCatEntParentCatGrpRelStreams[wcStoreIdentifier].write(output);
					}

					//reset output array for next row
					output.splice(0);
				}
			}
		}
	}
}

//CTA
function writeCTAs(data,outputStreams,lookups) {
	var ctalookup = lookups.ctalookup;
	var output = [];
	var locale = getLocale(data);
	var partnumber = getPartnumber(data);
	for (var i = 1; i < 5; i++) {
		if (data['CallToAction ' + i + ' Name']  !== undefined && data['CallToAction ' + i + ' Name']  !== '' &&
			data['CallToAction ' + i + ' URL']  !== undefined && data['CallToAction ' + i + ' URL']  !== '')
		{
			var attrName = ctalookup[data['CallToAction ' + i + ' Name']];
			console.log(data['CallToAction ' + i + ' Name']);
			output[0] = partnumber; // PartNumber
			output[1] = attrName;
			output[2] = locale;
			output[3] = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes' + '_' + output[1].replace(/\W/g,'_') + '_' +
						partnumber.replace(/\W/g,'_') + '_ValueID';
			output[4] = data['CallToAction ' + i + ' URL'].trim();
			output[5] = 'Descriptive';
			output[6] = i - 1;
			output[7] = 'EmersonCAS';
			output[8] = '';
			output[9] = '';
			output[10] = '';
			output[11] = '';


			//Apply Locale Support for CTA (remove test for -1)
			//if (locale === -1)
			//{
			outputStreams.csvCatEntAttrDictAttrRelStream.write(output);
			//}

			//reset output array for next row
			output.splice(0);

			var attroutput = [];
			attroutput[0] = attrName; //Identifier
			attroutput[1] = locale; //LanguageId
			attroutput[2] = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes' + '_' + attroutput[0].replace(/\W/g,'_') + '_' +
			partnumber.replace(/\W/g,'_') + '_ValueID'; //ValueIdentifier
			attroutput[3] = i - 1;
	        attroutput[4] = data['CallToAction ' + i + ' URL'].trim();
			attroutput[5] = ''; //ValueUsage
			attroutput[6] = ''; //AttributeValueField1
			attroutput[7] = ''; //AttributeValueField2
			attroutput[8] = ''; //AttributeValueField3
			attroutput[9] = ''; //Image1
			attroutput[10] = ''; //Image2
			attroutput[11] = ''; //Field1
			attroutput[12] = ''; //Field2
			attroutput[13] = ''; //Field3

            if (lookups.attrIdentifier["EMR"][attrName].AttributeType === '1') {
                outputStreams.csvAttrDictAttrAllowValsStream.write(attroutput);
            }

			//reset output array for next row
			attroutput.splice(0);
		}
	}
}

//Load Utility Belt
function writeUtilityBelt(data,outputStreams,lookups) {
	var utilitybeltlookup = lookups.utilitybeltlookup;
	var output = [];
	var locale = getLocale(data);
	var partnumber = getPartnumber(data);
	for (var i = 1; i < 4; i++) {
		if (data['Utility Belt ' + i + ' Tag']  !== undefined && data['Utility Belt ' + i + ' Tag']  !== '' &&
			data['Utility Belt ' + i + ' URL']  !== undefined && data['Utility Belt ' + i + ' URL']  !== '')
		{
			var attrName = utilitybeltlookup[data['Utility Belt ' + i + ' Tag']];
			output[0] = partnumber; // PartNumber
			output[1] = attrName;
			output[2] = locale;
			output[3] = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes' + '_' + output[1].replace(/\W/g,'_') + '_' +
						partnumber.replace(/\W/g,'_') + '_ValueID_0';
			output[4] = data['Utility Belt ' + i + ' Text'].trim();
			output[5] = 'Descriptive';
			if(i == 1){
			    output[6] = 0;
			    }
			else
				{
				output[6] = (i - 1) + ".0";
				}
			output[7] = 'EmersonCAS';
			output[8] = '';
			output[9] = '';
			output[10] = '';
			output[11] = '';

            //Apply Locale Support for Utility Belt (remove test for -1)
    		outputStreams.csvCatEntAttrDictAttrRelStream.write(output);

			output[3] = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes' + '_' + output[1].replace(/\W/g,'_') + '_' +
						partnumber.replace(/\W/g,'_') + '_ValueID_1';
			output[4] = data['Utility Belt ' + i + ' URL'].trim();
			if(i == 1){
			    output[6] = "0.0001";
			    }
			else
				{
				output[6] = (i - 1) + ".0001";
				}

			//Apply Locale Support for Utility Belt (remove test for -1)
    		outputStreams.csvCatEntAttrDictAttrRelStream.write(output);

			output[3] = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes' + '_' + output[1].replace(/\W/g,'_') + '_' +
						partnumber.replace(/\W/g,'_') + '_ValueID_2';
			output[4] = data['Utility Belt ' + i + ' Tag'].trim();
			if(i == 1){
			    output[6] = "0.0002";
			    }
			else
				{
				output[6] = (i - 1) + ".0002";
				}

            //Apply Locale Support for Utility Belt (remove test for -1)
            outputStreams.csvCatEntAttrDictAttrRelStream.write(output);

			//reset output array for next row
			output.splice(0);

			var attroutput = [];
			attroutput[0] = attrName; //Identifier
			attroutput[1] = locale; //LanguageId
			attroutput[2] = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes' + '_' + attroutput[0].replace(/\W/g,'_') + '_' +
			partnumber.replace(/\W/g,'_') + '_ValueID_0'; //ValueIdentifier
			if(i == 1){
				attroutput[3] = 0;
			    }
			else
				{
				attroutput[3] = (i - 1) + ".0";
				}
			attroutput[4] = data['Utility Belt ' + i + ' Text'].trim();
			attroutput[5] = ''; //ValueUsage
			attroutput[6] = ''; //AttributeValueField1
			attroutput[7] = ''; //AttributeValueField2
			attroutput[8] = ''; //AttributeValueField3
			attroutput[9] = ''; //Image1
			attroutput[10] = ''; //Image2
			attroutput[11] = ''; //Field1
			attroutput[12] = ''; //Field2
			attroutput[13] = ''; //Field3
            if (lookups.attrIdentifier["EMR"][attrName].AttributeType === '1') {
                outputStreams.csvAttrDictAttrAllowValsStream.write(attroutput);
            }


			attroutput[2] = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes' + '_' + attroutput[0].replace(/\W/g,'_') + '_' +
			partnumber.replace(/\W/g,'_') + '_ValueID_1';
			if(i == 1){
				attroutput[3] = "0.0001";
			    }
			else
				{
				attroutput[3] = (i - 1) + ".0001";
				}
			attroutput[4] = data['Utility Belt ' + i + ' URL'].trim();

            if (lookups.attrIdentifier["EMR"][attrName].AttributeType === '1') {
                outputStreams.csvAttrDictAttrAllowValsStream.write(attroutput);
            }


			attroutput[2] = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes' + '_' + attroutput[0].replace(/\W/g,'_') + '_' +
			partnumber.replace(/\W/g,'_') + '_ValueID_2';
			if(i == 1){
				attroutput[3] = "0.0002";
			}
			else
			{
				attroutput[3] = (i - 1) + ".0002";
			}
			attroutput[4] = data['Utility Belt ' + i + ' Tag'].trim();

            if (lookups.attrIdentifier["EMR"][attrName].AttributeType === '1') {
                outputStreams.csvAttrDictAttrAllowValsStream.write(attroutput);
            }

			//reset output array for next row
			attroutput.splice(0);
		}
	}
}

//Product Family
//function loadProductFamily(item, header, catentryRow)
//{
//	//var lkpEMRProductFamily = getLkpByName("Enter lookup name here");
//	for (var e = 1; e <=32; e++)
//	{
//		var ImgUrlVal = checkForNullValue(catentryRow[header.keyForValue("Product Family Image URL " + e)]);
//		var FamNameVal = checkForNullValue(catentryRow[header.keyForValue("Product Family Name " + e)]);
//		var LinkUrlVal =   checkForNullValue(catentryRow[header.keyForValue("Product Family Name " + e)]);
//
//		if (header.containsValue("Product Family Image URL " + e) && (ImgUrlVal !== null) &&
//		header.containsValue("Product Family Name " + e) && (FamNameVal !== null) &&
//		header.containsValue("Product Family Link URL " + e) && (LinkUrlVal !== null))
//		{
//			var specName = "EMR Core Attributes/EMR Product Family " + e;
//          item.setCtgItemAttrib(specName + "/en_US#0", ImgUrlVal);
//          item.setCtgItemAttrib(specName + "/en_US#1", FamNameVal);
//          item.setCtgItemAttrib(specName + "/en_US#2", LinkUrlVal);
//          var descAttrSeqIndex = item.getEntryAttribValues("Catalog Entry Spec/Descriptive Attribute Sequences/Name").keyForValue(specName.parseDelim("/")[1]);
//          item.setCtgItemAttrib(strCtgSpecName + "/Descriptive Attribute Sequences#" + descAttrSeqIndex + "/Sequence", e - 1);
//		}
//	}
//}

//Features
function writeFeatures(data,outputStreams,lookups) {
	var output = [];
	var locale = getLocale(data);
	var partnumber = getPartnumber(data);
	var attrsequencelookup = lookups.attrsequence;

	//Update the Attribute Level Sequence
	var sequence = attrsequencelookup['EMR Features'];
	if(sequence === undefined)
		{
		sequence = 0;
		}
	else
		{
		sequence = sequence;
		}

	var attrval = '';
	var attrvalID = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes_EMR_Features_' +
					partnumber.replace(/\W/g,'_') + '_ValueID_';
	for (var i = 1; i < 13; i++) {
		if (data["Feature " + i]  !== undefined && data["Feature " + i].trim() !== '')
		{
			var threeZero = ".000";
			var twoZero = ".00";
			var zeros;
			if (i < 11) { zeros = threeZero; } else { zeros = twoZero; }

			//item.setCtgItemAttrib(specName + "/en_US#" + (i - 1), catentryRow[header.keyForValue("Feature " + i)]);
			output[0] = partnumber; // PartNumber
			output[1] = 'EMR Features';
			output[2] = locale;
			output[3] = attrvalID + String(i - 1);
			attrval = data['Feature ' + i];
			output[4] = attrval;
			output[5] = 'Descriptive';

			if((i - 1) == 0){
				output[6] = sequence;
			}
			else{
				output[6] = sequence + zeros + (i - 1);
			}

			output[7] = 'EmersonCAS';
			output[8] = '';
			output[9] = '';
			output[10] = '';
			output[11] = '';

			//if (locale === -1)
			//{
				outputStreams.csvCatEntAttrDictAttrRelStream.write(output);
			//}

			//reset output array for next row
			output.splice(0);

			var attroutput = [];
			attroutput[0] = 'EMR Features'; //Identifier
			attroutput[1] = locale; //LanguageId
			attroutput[2] = attrvalID + String(i - 1); //ValueIdentifier
			if((i - 1) == 0){
					attroutput[3] = sequence;
				}
			else{
					attroutput[3] = sequence + zeros + (i - 1);
			}
			attrval = data['Feature ' + i];
	        attroutput[4] = attrval;
			attroutput[5] = '1'; //ValueUsage
			attroutput[6] = ''; //AttributeValueField1
			attroutput[7] = ''; //AttributeValueField2
			attroutput[8] = ''; //AttributeValueField3
			attroutput[9] = ''; //Image1
			attroutput[10] = ''; //Image2
			attroutput[11] = ''; //Field1
			attroutput[12] = ''; //Field2
			attroutput[13] = ''; //Field3

			if (lookups.attrIdentifier["EMR"]['EMR Features'].AttributeType === '1') {
				outputStreams.csvAttrDictAttrAllowValsStream.write(attroutput);
			}
			//reset output array for next row
			attroutput.splice(0);

		}
	}
}

//Load  (cross-sell relationships between Products)
function writeRelatedProducts(data,outputStreams,lookups) {
	var output = [];
	var partnumber = getPartnumber(data);

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
			output[0] = partnumber;
			output[1] = 'CrossSell';
			output[2] = brandMfrNoArray[0].trim() + '-P-' + brandMfrNoArray[1].trim();
			output[3] = 'EmersonCAS';
			output[4] = seqCounter++;
			output[5] = 'NONE';
			output[6] = '1';
			output[7] = '';
			outputStreams.csvCatEntAssocStream.write(output);

			//reset output array for next row
			output.splice(0);
		}
	}
}

//EDS-8100: Function added to Write Announcement Date and Withdrawal Date entries
function writeAnnouncementDate(data,outputStreams) {
	var output = [];
	var partnumber = getPartnumber(data);
	var time = "00:00:00.000000000";
	var typeFieldName = dataHelper.getCommerceVersionCatEntryType(data['Catalog Entry Type']);
	var deleteFieldName = data['Delete'];
	if (data['Announcement Date'] === undefined || data['Announcement Date'] === '')
	{
		return;
	}
	var announcementDate = data['Announcement Date'].split("/");
	// ['PartNumber','Type','StartDate','Delete']
	output[0] = partnumber;
	output[1] = typeFieldName
	output[2] = announcementDate[2]+'-'+announcementDate[0]+'-'+announcementDate[1]+' '+time;
	if (deleteFieldName !== undefined
			&& deleteFieldName.toLowerCase() == 'yes') {
		output[3] = '1';
	} else {
		output[3] = '';
	}
	outputStreams.csvCatEntAnnouncementDateStream.write(output);
	// reset output array for next file
	output.splice(0);
}

function writeWithdrawDate(data,outputStreams) {
	var output = [];
	var partnumber = getPartnumber(data);
	var time = "00:00:00.000000000";
	var typeFieldName = dataHelper.getCommerceVersionCatEntryType(data['Catalog Entry Type']);
	var deleteFieldName = data['Delete'];
	if (data['Withdrawal Date'] === undefined || data['Withdrawal Date'] === '')
	{
		return;
	}
	var withdrawalDate = data['Withdrawal Date'].split("/");
	// ['PartNumber','Type','EndDate','Delete']
	output[0] = partnumber;
	output[1] = typeFieldName
	output[2] = withdrawalDate[2]+'-'+withdrawalDate[0]+'-'+withdrawalDate[1]+' '+time;
	if (deleteFieldName !== undefined
			&& deleteFieldName.toLowerCase() == 'yes') {
		output[3] = '1';
	} else {
		output[3] = '';
	}
	outputStreams.csvCatEntWithdrawDateStream.write(output);
	// reset output array for next file
	output.splice(0);
}

//Load  (Up-Sell relationships between Products)
function writeUpSellProducts(data,outputStreams,lookups) {
	var output = [];
	var partnumber = getPartnumber(data);

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
			output[0] = partnumber;
			output[1] = 'UpSell';
			output[2] = brandUpSellNoArray[0].trim() + '-P-' + brandUpSellNoArray[1].trim();
			output[3] = 'EmersonCAS';
			output[4] = seqCounter++;
			output[5] = 'NONE';
			output[6] = '1';
			output[7] = '';
			outputStreams.csvCatEntAssocStream.write(output);

			//reset output array for next row
			output.splice(0);
		}
	}
}

//Load  (Accessories relationships between Products)
function writeAccessoriesProducts(data,outputStreams,lookups) {
	var output = [];
	var partnumber = getPartnumber(data);

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
			output[0] = partnumber;
			output[1] = 'Accessory';
			output[2] = brandAccessoriesNoArray[0].trim() + '-P-' + brandAccessoriesNoArray[1].trim();
			output[3] = 'EmersonCAS';
			output[4] = seqCounter++;
			output[5] = 'NONE';
			output[6] = '1';
			output[7] = '';
			outputStreams.csvCatEntAssocStream.write(output);

			//reset output array for next row
			output.splice(0);
		}
	}
}

//handle input type for sequencing request
function getCatalogEntryTypeMappingSequence(data)
{
	var catalogEntryType = '';
	switch (data['Type'].trim()) {
	case 'SKU':
		catalogEntryType = 'Item';
		break;
	case 'Product':
		catalogEntryType = 'Product';
		break;
	case 'Bundle':
		catalogEntryType = 'Bundle';
		break;
	case 'Static Kit':
		catalogEntryType = 'Package';
		break;
	case 'Dynamic Kit':
		catalogEntryType = 'DynamicKit';
		break;
	}

	return catalogEntryType;
}

//TBD: code refactoring - move to dataHelper
function getCatalogEntryTypeMapping(data)
{
	var catalogEntryType = '';
	switch (data['Catalog Entry Type'].trim()) {
	case 'SKU':
		catalogEntryType = 'Item';
		break;
	case 'Product':
		catalogEntryType = 'Product';
		break;
	case 'Bundle':
		catalogEntryType = 'Bundle';
		break;
	case 'Static Kit':
		catalogEntryType = 'Package';
		break;
	case 'Dynamic Kit':
		catalogEntryType = 'DynamicKit';
		break;
	}

	return catalogEntryType;
}

function getComponentTypeMapping(data)
{
	var componentType = '';
	switch (data['Component Type'].trim()) {
	case 'Bundle Type':
		componentType = 'BundleComponent';
		break;
	case 'Dynamic Type':
		componentType = 'DynamicKitComponent';
		break;
	case 'Static Type':
		componentType = 'PackageComponent';
		break;
	case 'Parts List':
		componentType = 'PARTS_LIST';
		break;
	case 'Replacement':
		componentType = 'REPLACEMENT';
		break;
	case 'Related Products':
		componentType = 'X-SELL';
		break;
	case 'Up-Sell':
		componentType = 'UPSELL';
		break;
	case 'Accessories':
		componentType = 'ACCESSORY';
		break;
	case 'Training':
		componentType = 'TRAINING';
		break;
	case 'Services':
		componentType = 'SERVICES';
		break;
	}

	return componentType;
}



function writeComponentAssociations(data,outputStreams) {
	var output = [];
	var parentPartNumber = data['Component Code'];
	var componentTypeMap = getComponentTypeMapping(data);
	var catEntryType = dataHelper.getCommerceVersionCatEntryType(dataHelper.getCatEntryType(parentPartNumber));

	output[0] = parentPartNumber;
	output[1] = catEntryType;
	output[2] = componentTypeMap;
	output[3] = data['Child Code'];
	output[4] = 'EmersonCAS';
	output[5] = data['Sequence'];
	output[7] = data['Quantity'];
	

	if (data['Quantity'] !== undefined) {
		output[7] = data['Quantity'];
	} else {
		output[7] = '1';
	}

	if (data['Delete'] !== undefined && data['Delete'].toLowerCase() == 'yes') {
		output[9] = '1';
	} else {
		output[9] = '';
	}

	switch (componentTypeMap) {
		case 'X-SELL':
			output[6] = 'NONE';
			output[8] = data['Display Sequence'];
			outputStreams.csvCatEntryComponentMerchAssocStream.write(output);
			break;
		case 'UPSELL':
			output[6] = 'NONE';
			output[8] = data['Display Sequence'];
			outputStreams.csvCatEntryComponentMerchAssocStream.write(output);
			break;
		case 'ACCESSORY':
			output[6] = 'NONE';
			output[8] = data['Display Sequence'];
			outputStreams.csvCatEntryComponentMerchAssocStream.write(output);
			break;
		case 'PARTS_LIST':
			output[6] = 'NONE';
			output[8] = data['Display Sequence'];
			outputStreams.csvCatEntryComponentMerchAssocStream.write(output);
			break;
		case 'REPLACEMENT':
			output[6] = 'NONE';
			output[8] = '';
			outputStreams.csvCatEntryComponentMerchAssocStream.write(output);
		case 'TRAINING':
			output[6] = 'NONE';
			output[8] = data['Display Sequence'];
			outputStreams.csvCatEntryComponentMerchAssocStream.write(output);
			break;
		case 'SERVICES':
			output[6] = 'NONE';
			output[8] = data['Display Sequence'];
			outputStreams.csvCatEntryComponentMerchAssocStream.write(output);
			break;
		default:
			output[4] = ''; //null store for component association
			output[6] = '';
			output[8] = '';
			outputStreams.csvCatEntryComponentStream.write(output);
	}

	output.splice(0);
}

function writeAttributeSequence(data, outputStreams, jsonProperties){
	var output = [];
	var wcStoreIdentifierLookup = [];
	var wcStoreIdentifier;
	for (var k=0; k<jsonProperties.supportedStores.length; k++) {
		//console.log('building wcStoreIdentifierLookup for ' + jsonProperties.supportedStores[k]['name'] + ' = ' + jsonProperties.supportedStores[k]['wcStoreIdentifier']);
		wcStoreIdentifierLookup[jsonProperties.supportedStores[k]['name']] = jsonProperties.supportedStores[k]['wcStoreIdentifier'];
	}

	wcStoreIdentifier = wcStoreIdentifierLookup[data['Store']];

	output[0] = data['Child ID'];
	output[1] = getCatalogEntryTypeMappingSequence(data);
	output[2] = data['Parent ID'];
	output[3] = wcStoreIdentifier;
	output[4] = data['Sequence'];
	output[5] = (data['Delete'] !== undefined && data['Delete'].toLowerCase() == 'yes') ? '1'  : '0';
	outputStreams.storesCatEntParentCatGrpRelStreamsSeq[wcStoreIdentifier].write(output);
	//reset output array for next file
	output.splice(0);
}

function writeSkuAttributeSequence(data, outputStreams){
	var output = [];

	output[0] = data['Child ID'];
	output[1] = data['Sequence'];
	output[2] = data['Parent ID'];
	output[3] = (data['Delete'] !== undefined && data['Delete'].toLowerCase() == 'yes') ? '1'  : '0';
	outputStreams.csvCatEntParentProductRelStreamSeq.write(output);
	//reset output array for next file
	output.splice(0);
}

function writeCatEntryAttrRelSequence(data, outputStreams, lookups) {
	var output = [];

	var attrIdentifierLookups = lookups.attrIdentifier[constants.STORE_EMR];
	var partnumber = data['Parent ID'];
	var attrIdentifier = 'EMR AttrSequencing';
	var attrValue = data['Child ID'];
	var newSequence = data['Sequence'];

	var valueIdentifier = attrIdentifierLookups[attrIdentifier].AttrValPrefix
				+ constants.DEFAULT_ID_SEPARATOR + attrIdentifier.replace(/\W/g, constants.DEFAULT_ID_SEPARATOR)
				+ constants.DEFAULT_ID_SEPARATOR + partnumber.replace(/\W/g, constants.DEFAULT_ID_SEPARATOR)
				+ constants.DEFAULT_ID_SEPARATOR + constants.VALUE_ID
				+ constants.DEFAULT_ID_SEPARATOR + attrValue.replace(/\W/g, constants.DEFAULT_ID_SEPARATOR);

	output[0] = partnumber;
	output[1] = attrIdentifier;
	output[2] = constants.DEFAULT_LANGUAGE_ID;
	output[3] = valueIdentifier;
	output[4] = attrValue;
	output[5] = constants.USAGE_DESCRIPTIVE;
	output[6] = newSequence;
	output[7] = constants.EMR_ATTR_STORE_ID;
	output[8] = constants.EMPTY_STRING;
	output[9] = constants.EMPTY_STRING;
	output[10] = constants.EMPTY_STRING;
	output[11] = constants.EMPTY_STRING;

	outputStreams.csvCatEntAttrDictAttrRelStream.write(output);
}

function writeAttributesDelete(data,outputStreams,lookups) {
	//retrieve all the keys from the header lookup table (ie. column headers)
	var headercols = [];
	var headerlookup = lookups.header['EMR'];
	var attrlookup = lookups.attrval;
	var partnumber = data['Deletion Code'];

	var output = [];
	var attrsequencelookup = lookups.attrsequence;
	for (var k in headerlookup)
	{
		if (k !== undefined && k !== '')
		{
			headercols.push(k);
		}
	}

	//write each header value
	for (var i = 0; i < headercols.length; i++)
	{
		if (data[headercols[i]] !== undefined && data[headercols[i]] !== '')
		{
			var seq = 0;
			var dataarray = [];
			if (headerlookup[headercols[i]].MultiValue !== undefined && headerlookup[headercols[i]].MultiValue > 1)
			{
				dataarray = data[headercols[i]].split("|");
			}
			else
			{
				dataarray[0] = data[headercols[i]];
			}
			dataarray = dataHelper.removeInvalidElements(dataarray);
			for (var j = 0; j < dataarray.length; j++)
			{
				var dataElement = dataHelper.removeNewLine(dataarray[j].trim());
				var attrIdentifier = headerlookup[headercols[i]].Identifier;
				var attrUsage = headerlookup[headercols[i]].AttributeType;
				output[0] = partnumber;
				output[1] = attrIdentifier;
				// output[2]; - attr deletion in catman should not be locale specific

				//Update the Attribute Usage if Defining or Descriptive
				if((headerlookup[headercols[i]].AttrValPrefix).includes("Attribute_Dictionary_Descriptive_Attributes"))
					{
					var attributeUsage = "Descriptive";
					}
				else{
					var attributeUsage = "Defining";
				}

				//Update the Attribute Level Sequence
				var sequence = attrsequencelookup[attrIdentifier];
				if(sequence === undefined)
					{
					sequence = 0;
					}
				else
					{
					sequence = sequence;
					}


				//if attribute uses is a MultiValue, update the sequence
				if (headerlookup[headercols[i]].MultiValue !== undefined && headerlookup[headercols[i]].MultiValue > 1)
				{
					var threeZero = ".000";
					var twoZero = ".00";
					var zeros;
					if (j < 11) { zeros = threeZero; } else { zeros = twoZero; }

					if (j == 0){
						sequence = sequence;
					}
					else{
						sequence = sequence + zeros + j;
					}
				}

				//if attribute uses a lookup table, then use that
				if (headerlookup[headercols[i]].LkupType === 'LOOKUP_TABLE' || headerlookup[headercols[i]].LkupType === 'STRING_ENUMERATION')
				{
					output[3] = 'Lookup_Value_Identifier';
					if (attrlookup[attrIdentifier] !== undefined &&
						attrlookup[attrIdentifier][dataElement] !== undefined)
					{
						output[3] = attrlookup[attrIdentifier][dataElement].ValueIdentifier;
					}
				}
				else
				{
					//this is not in a lookup table so the value needs to be in the catalog entry specific allowed values
					var attroutput = [];
					var suffix = '';
					if (dataarray.length > 1)
					{
						suffix = '_' + seq;
					}
					output[3] = headerlookup[headercols[i]].AttrValPrefix + '_' + output[1].replace(/\W/g,'_') + '_' +
									partnumber.replace(/\W/g,'_') + '_ValueID' + suffix;
				}
				output[4] = dataElement;
				output[5] = attributeUsage;
				output[6] = sequence;
				//['PartNumber','AttributeIdentifier','LanguageId','ValueIdentifier','Value','Usage','Sequence','AttributeStoreIdentifier','Field1','Field2','Field3','Delete']

				output[7] = 'EmersonCAS'; //AttributeStoreIdentifier
				output[8] = ''; //Field1
				output[9] = ''; //Field2
				output[10] = ''; //Field3
				output[11] = 1; //Delete

				outputStreams.csvCatEntAttrDictAttrRelDeleteStream.write(output);

				//reset output array for next row
				output.splice(0);
				seq++;
			}
			dataarray.splice(0);
		}

	}
	headercols.splice(0);
}

//Features
function writeFeaturesDelete(data,outputStreams,lookups) {
	var partnumber = data['Deletion Code'];
	var output = [];
	var attrsequencelookup = lookups.attrsequence;

	//Update the Attribute Level Sequence
	var sequence = attrsequencelookup['EMR Features'];
	if(sequence === undefined)
		{
		sequence = 0;
		}
	else
		{
		sequence = sequence;
		}

	var attrval = '';
	var attrvalID = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes_EMR_Features_' +
					partnumber.replace(/\W/g,'_') + '_ValueID_';
	for (var i = 1; i < 13; i++) {
		if (data["Feature " + i]  !== undefined && data["Feature " + i].trim() !== '')
		{
			var threeZero = ".000";
			var twoZero = ".00";
			var zeros;
			if (i < 11) { zeros = threeZero; } else { zeros = twoZero; }

			//item.setCtgItemAttrib(specName + "/en_US#" + (i - 1), catentryRow[header.keyForValue("Feature " + i)]);
			output[0] = partnumber; // PartNumber
			output[1] = 'EMR Features';
			// output[2]; - attr deletion in catman should not be locale specific
			output[3] = attrvalID + String(i - 1);
			attrval = data['Feature ' + i];
			output[4] = attrval;
			output[5] = 'Descriptive';

			if((i - 1) == 0){
				output[6] = sequence;
			}
			else{
				output[6] = sequence + zeros + (i - 1);
			}

			output[7] = 'EmersonCAS';
			output[8] = '';
			output[9] = '';
			output[10] = '';
			output[11] = '1';

			outputStreams.csvCatEntAttrDictAttrRelDeleteStream.write(output);

			//reset output array for next row
			output.splice(0);
		}
	}
}

//CTA
function writeCTAsDelete(data,outputStreams,lookups) {
	var ctalookup = lookups.ctalookup;
	var output = [];
	var partnumber = data['Deletion Code'];
	for (var i = 1; i < 5; i++) {
		if (data['CallToAction ' + i + ' Name']  !== undefined && data['CallToAction ' + i + ' Name']  !== '' &&
			data['CallToAction ' + i + ' URL']  !== undefined && data['CallToAction ' + i + ' URL']  !== '')
		{
			var attrName = ctalookup[data['CallToAction ' + i + ' Name']];
			console.log(data['CallToAction ' + i + ' Name']);
			output[0] = partnumber; // PartNumber
			output[1] = attrName;
			// output[2]; - attr deletion in catman should not be locale specific
			output[3] = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes' + '_' + output[1].replace(/\W/g,'_') + '_' +
						partnumber.replace(/\W/g,'_') + '_ValueID';
			output[4] = data['CallToAction ' + i + ' URL'].trim();
			output[5] = 'Descriptive';
			output[6] = i - 1;
			output[7] = 'EmersonCAS';
			output[8] = '';
			output[9] = '';
			output[10] = '';
			output[11] = '1';
			outputStreams.csvCatEntAttrDictAttrRelDeleteStream.write(output);

			//reset output array for next row
			output.splice(0);
		}
	}
}

//Utility Belt
function writeUtilityBeltDelete(data,outputStreams,lookups) {
	var partnumber = data['Deletion Code'];
	var utilitybeltlookup = lookups.utilitybeltlookup;
	var output = [];

	for (var i = 1; i < 4; i++) {
		if (data['Utility Belt ' + i + ' Tag']  !== undefined && data['Utility Belt ' + i + ' Tag']  !== '' &&
			data['Utility Belt ' + i + ' URL']  !== undefined && data['Utility Belt ' + i + ' URL']  !== '')
		{
			var attrName = utilitybeltlookup[data['Utility Belt ' + i + ' Tag']];
			output[0] = partnumber; // PartNumber
			output[1] = attrName;
			// output[2]; - attr deletion in catman should not be locale specific
			output[3] = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes' + '_' + output[1].replace(/\W/g,'_') + '_' +
						partnumber.replace(/\W/g,'_') + '_ValueID_0';
			output[4] = data['Utility Belt ' + i + ' Text'].trim();
			output[5] = 'Descriptive';
			if(i == 1){
			    output[6] = 0;
			    }
			else
				{
				output[6] = (i - 1) + ".0";
				}
			output[7] = 'EmersonCAS';
			output[8] = '';
			output[9] = '';
			output[10] = '';
			output[11] = '1';
			outputStreams.csvCatEntAttrDictAttrRelDeleteStream.write(output);

			output[3] = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes' + '_' + output[1].replace(/\W/g,'_') + '_' +
						partnumber.replace(/\W/g,'_') + '_ValueID_1';
			output[4] = data['Utility Belt ' + i + ' URL'].trim();
			if(i == 1){
			    output[6] = "0.0001";
			    }
			else
				{
				output[6] = (i - 1) + ".0001";
				}
			outputStreams.csvCatEntAttrDictAttrRelDeleteStream.write(output);

			output[3] = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes' + '_' + output[1].replace(/\W/g,'_') + '_' +
						partnumber.replace(/\W/g,'_') + '_ValueID_2';
			output[4] = data['Utility Belt ' + i + ' Tag'].trim();
			if(i == 1){
			    output[6] = "0.0002";
			    }
			else
				{
				output[6] = (i - 1) + ".0002";
				}
			outputStreams.csvCatEntAttrDictAttrRelDeleteStream.write(output);

			//reset output array for next row
			output.splice(0);
		}
	}
}
function writeCatalogEntryDelete(data, outputStreams, lookups){
	var output = [];
	var partnumber = data['Deletion Code'];

	if (data['Delete Catalog Entry'] !== undefined
			&& data['Delete Catalog Entry'] !== ''
				&& data['Delete Catalog Entry'].toLowerCase() === 'yes'){

	output[0] = partnumber; //partnumber
	output[1] = '';//getCatalogEntryTypeMapping(data);//Type column
	output[2] = data['ParentPartNumber'];//ParentPartNumber column
	output[3] = data['Manufacturer'];//Manufacturer
	output[4] = data['ManufacturerPartNumber'];//ManufacturerPartNumber
	output[5] = '';//Sequence column
	output[6] = data['ParentGroupIdentifier'];
	output[7] = '1';
	}
	outputStreams.csvCatalogEntryDeleteStream.write(output);
	// reset output array for next file
	output.splice(0);
	//writeCatalogEntryURLKeywordDelete(data, outputStreams, lookups);
}
function writeCatalogParentSkuDelete(data, outputStreams, lookups){
	var output = [];

	output[0] = data['Deletion Code']; //partnumber
	output[1] = data['Parent'];
	output[2] = 'PRODUCT_ITEM';//Type
	output[3] = '0';
	output[4] = '1';

	outputStreams.csvCatalogParentSkuDeleteStream.write(output);
	// reset output array for next file
	output.splice(0);
}

function writeCatalogParentSkuUpdate(data, outputStreams, lookups){
	var output = [];

	output[0] = data['Deletion Code']; //partnumber
	output[1] = '0';//sequence
	output[2] = data['New Parent'];
	output[3] = 'PRODUCT_ITEM';//Type
	output[4] = '';

	outputStreams.csvCatalogParentSkuUpdateStream.write(output);
	output.splice(0);
}

function writeCatalogEntryHideAttributes(data, outputStreams, lookups){
	var output = [];
	var suffix = '';
	var partnumber = data['Deletion Code'];
	var value = data['Hide SKU List Attribute'];

	var valueIdentifier = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Extended_Attributes_EMR_HideCatEntAttr_' + value.replace(/\W/g,'_') + '_' + partnumber.replace(/\W/g,'_') + '_ValueID';

	output[0] =  partnumber; //partnumber
	output[1] = 'EMR HideCatEntAttr';  //attribute identifiers
	output[2] = '-1' //languageid
	output[3] = valueIdentifier; //value identifier
	output[4] = value; //value
	output[5] = 'Descriptive' //usage
	output[6] = '0'; //sequence
	output[7] = 'EmersonCAS'; //attributeStoreIdentifier
	output[8] = ''; //field1
	output[9] = ''; //field2
	output[10] = '';  //field3

	if(data['Unhide SKU List Attribute'].toLowerCase() === 'yes'){
		output[11] = '1';
	}
	else{
	output[11] = ''; //delete
	}

	outputStreams.csvCatalogEntryHideAttributesStream.write(output);
	output.splice(0);
}


/*************************************************
 * Code Refacoring In Progress -------------------
 * start writing specific use functions here -----
 *************************************************/

// partnumber, catentry type, parent, manufacturer, manufacturer partnumber, master category
// TBD: for enhancement - flexible rowData headers (different functionalities/runrequests)
function writeDefaultData(rowData, partNumber, catEntryType, outputStreams, lookups, lookupBuilder, dataloadMode) {
	var output = [];
	var dataMftrPartNumber = rowData[constants.CSV_HEADER_MFTR_PART_NUM];
	var dataMftr = rowData[constants.CSV_HEADER_MFTR];
	var dataParent = rowData[constants.CSV_HEADER_PARENT];
	var dataFullPath = rowData[constants.CSV_HEADER_FULLPATH];
	
	// TMP: comments - if replace, master category and parent is already updated by separate function
	if (dataloadMode == constants.DATALOAD_MODE_REPLACE) {
		dataParent = lookupBuilder.getCatEntryParentsLookup()[partNumber];
		dataFullPath = lookupBuilder.getCatEntryMasterCategoriesLookup()[partNumber];
	}

	output[0] = partNumber;
	output[1] = catEntryType;
	output[2] = dataParent;
	output[3] = dataMftr;
	output[4] = dataMftrPartNumber;
	output[5] = constants.EMPTY_STRING;
	output[6] = dataFullPath;

	if (dataloadMode == constants.DATALOAD_MODE_DELETE) {
		// delete mode
		output[7] = constants.BOOLEAN_DB_TRUE;
		outputStreams.csvCatalogEntryDeleteStream.write(output);
	} else {
		// update or replace mode
		//TBD enhancement - replace mode reparenting and master category replace
		output[7] = constants.BOOLEAN_DB_FALSE;
		outputStreams.csvCatEntStream.write(output);
	}
}

// parent
function writeParent(rowData, partNumber, outputStreams, lookupBuilder, dataloadMode) {
	var output = [];
	var relType = 'PRODUCT_ITEM';
	var defaultSequence = '0';
	var parentLookup = lookupBuilder.getCatEntryParentsLookup();
	var currentParentPartNum = parentLookup[partNumber];
	var newParentPartNum = rowData[constants.CSV_HEADER_PARENT];
	var proceedCurrentParentDeletion = false;
	var proceedNewParentUpdate = false;

	if (!genericUtil.isUndefined(newParentPartNum)) {
		newParentPartNum = newParentPartNum.trim();

		if (currentParentPartNum != newParentPartNum) {
			if (dataloadMode == constants.DATALOAD_MODE_REPLACE) {
				proceedNewParentUpdate = true;
				proceedCurrentParentDeletion = true;
			} else {
				proceedNewParentUpdate = true;
			}
		} else {
			if (dataloadMode == constants.DATALOAD_MODE_DELETE) {
				proceedCurrentParentDeletion = true;
			}
		}

		if (genericUtil.isTrimmedEmptyString(currentParentPartNum)) {
			proceedCurrentParentDeletion = false;
		}

		if (genericUtil.isTrimmedEmptyString(newParentPartNum)) {
			proceedNewParentUpdate = false;
		}
	} 
	
	output[0] = partNumber;

	if (proceedCurrentParentDeletion) {
		output[1] = currentParentPartNum;
		output[2] = relType;
		output[3] = defaultSequence;
		output[4] = constants.BOOLEAN_DB_TRUE;
		outputStreams.csvCatalogParentSkuDeleteStream.write(output);
		// update parent lookup
		delete parentLookup[partNumber];
	}
	
	if (proceedNewParentUpdate) {
		output[1] = defaultSequence;
		output[2] = newParentPartNum;
		output[3] = relType;
		output[4] = constants.BOOLEAN_DB_FALSE;
		outputStreams.csvCatalogParentSkuUpdateStream.write(output);
		// update parent lookup
		parentLookup[partNumber] = newParentPartNum;
	}
}

// on special
// TBD: for enhancement - flexible rowData headers (different functionalities/runrequests)
function writeOnSpecial(rowData, partNumber, catEntryType, outputStreams, dataloadMode) {
	var output = [];
	var dataOnSpecial = rowData[constants.CSV_HEADER_ONSPECIAL];
	var onSpecial = constants.BOOLEAN_DB_FALSE; // default value
	var toProceed = false;

	if (!genericUtil.isUndefined(dataOnSpecial)) {
		if (!genericUtil.isEmptyString(dataOnSpecial)) {
			if (dataloadMode != constants.DATALOAD_MODE_DELETE) {
				// update or replace mode
				if (dataOnSpecial == constants.BOOLEAN_STRING_TRUE) {
					onSpecial = constants.BOOLEAN_DB_TRUE;
				}
			}
			// delete mode will proceed with the default value
			toProceed = true;
		} else {
			if (dataloadMode != constants.DATALOAD_MODE_UPDATE) {
				// delete or replace mode will proceed with the default value
				toProceed = true;
			}
		}

		if (toProceed) {
			output[0] = partNumber;
			output[1] = catEntryType;
			output[2] = onSpecial;
			output[3] = constants.EMPTY_STRING;

			outputStreams.csvCatEntOnSpecialStream.write(output);
		}
	}
}

// buyable
// TBD: for enhancement - flexible rowData headers (different functionalities/runrequests)
function writeForPurchase(rowData, partNumber, catEntryType, outputStreams, dataloadMode) {
	var output = [];
	var dataForPurchase = rowData[constants.CSV_HEADER_FORPURCHASE];
	var forPurchase = constants.BOOLEAN_DB_FALSE; // default value
	var toProceed = false;

	if (!genericUtil.isUndefined(dataForPurchase)) {
		if (!genericUtil.isEmptyString(dataForPurchase)) {
			if (dataloadMode != constants.DATALOAD_MODE_DELETE) {
				// update or replace mode
				if (dataForPurchase == constants.BOOLEAN_STRING_TRUE) {
					forPurchase = constants.BOOLEAN_DB_TRUE;
				}
			}
			// delete mode will proceed with the default value
			toProceed = true;
		} else {
			if (dataloadMode != constants.DATALOAD_MODE_UPDATE) {
				// delete or replace mode will proceed with the default value
				toProceed = true;
			}
		}

		if (toProceed) {
			output[0] = partNumber;
			output[1] = catEntryType;
			output[2] = forPurchase;
			output[3] = constants.EMPTY_STRING;

			outputStreams.csvCatEntForPurchaseStream.write(output);
		}
	}
}

// price
// TBD: for enhancement - flexible rowData headers (different functionalities/runrequests)
function writePrice(rowData, partNumber, catEntryType, outputStreams, dataloadMode) {
	var output = [];
	var dataPrice = rowData[constants.CSV_HEADER_PRICE];

	if (!genericUtil.isUndefined(dataPrice)) {
		output[0] = partNumber;
		output[1] = catEntryType;
		output[2] = constants.DEFAULT_CURRENCY;
		output[3] = dataPrice;
		output[4] = dataPrice;

		if (dataloadMode == constants.DATALOAD_MODE_REPLACE) {
			// replace mode
			output[5] = constants.BOOLEAN_DB_TRUE;
			//TBD: for enhancement - currently no support for price deletion

			if (!genericUtil.isTrimmedEmptyString(dataPrice)) {
				output[5] = constants.BOOLEAN_DB_FALSE;
				outputStreams.csvCatEntPriceStream.write(output);
			}
		} else if (dataloadMode == constants.DATALOAD_MODE_DELETE) {
			// delete mode
			output[5] = constants.BOOLEAN_DB_TRUE;
			//TBD: for enhancement - currently no support for price deletion
		} else {
			// update mode
			if (!genericUtil.isTrimmedEmptyString(dataPrice)) {
				output[5] = constants.BOOLEAN_DB_FALSE;
				outputStreams.csvCatEntPriceStream.write(output);
			}
		}
	}
}

// url
// TBD: for enhancement - flexible rowData headers (different functionalities/runrequests)
function writeUrl(rowData, partNumber, catEntryType, outputStreams, dataloadMode) {
	var output = [];
	var dataUrl = rowData[constants.CSV_HEADER_URL];

	if (!genericUtil.isUndefined(dataUrl)) {
		output[0] = partNumber;
		output[1] = catEntryType;
		
		if (dataloadMode == constants.DATALOAD_MODE_REPLACE) {
			output[2] = dataUrl;
			output[3] = constants.EMPTY_STRING;
			outputStreams.csvCatEntURLStream.write(output);
		} else if (dataloadMode == constants.DATALOAD_MODE_DELETE) {
			output[2] = constants.EMPTY_STRING;
			output[3] = constants.EMPTY_STRING;
			outputStreams.csvCatEntURLStream.write(output);
		} else {
			if (!genericUtil.isTrimmedEmptyString(dataUrl)) {
				output[2] = dataUrl;
				output[3] = constants.EMPTY_STRING;
				outputStreams.csvCatEntURLStream.write(output);
			}
		}
	}
}

// subscription item
// TBD: for enhancement - flexible rowData headers (different functionalities/runrequests)
function writeSubscriptionItem(rowData, partNumber, catEntryType, outputStreams, dataloadMode) {
	var output = [];
	var dataSubscriptionItem = rowData[constants.CSV_HEADER_SUBSITEM];
	var subscriptionItem = constants.BASEFIELD_VALUES_NONE; // default value
	var toProceed = false;

	if (!genericUtil.isUndefined(dataSubscriptionItem)) {
		if (!genericUtil.isEmptyString(dataSubscriptionItem)) {
			if (dataloadMode != constants.DATALOAD_MODE_DELETE) {
				// update or replace mode
				if (dataSubscriptionItem == constants.BOOLEAN_STRING_TRUE) {
					subscriptionItem = constants.BASEFIELD_VALUES_TIMEEVENTBASED;
				}
			}
			// delete mode will proceed with the default value
			toProceed = true;
		} else {
			if (dataloadMode != constants.DATALOAD_MODE_UPDATE) {
				// delete or replace mode will proceed with the default value
				toProceed = true;
			}
		}

		if (toProceed) {
			output[0] = partNumber;
			output[1] = catEntryType;
			output[2] = subscriptionItem;
			output[3] = constants.EMPTY_STRING;

			outputStreams.csvCatEntSubsStream.write(output);
		}
	}
}

// recurring order
// TBD: for enhancement - flexible rowData headers (different functionalities/runrequests)
function writeRecurringOrderItem(rowData, partNumber, catEntryType, outputStreams, dataloadMode) {
	var output = [];
	var dataRecurringOrderItem = rowData[constants.CSV_HEADER_RECURORDERITEM];
	var disallowRecurringOrder = constants.BOOLEAN_DB_TRUE; // default value
	var toProceed = false;

	if (!genericUtil.isUndefined(dataRecurringOrderItem)) {
		if (!genericUtil.isEmptyString(dataRecurringOrderItem)) {
			if (dataloadMode != constants.DATALOAD_MODE_DELETE) {
				// update or replace mode
				if (dataRecurringOrderItem == constants.BOOLEAN_STRING_TRUE) {
					disallowRecurringOrder = constants.BOOLEAN_DB_FALSE;
				}
			}
			// delete mode will proceed with the default value
			toProceed = true;
		} else {
			if (dataloadMode != constants.DATALOAD_MODE_UPDATE) {
				// delete or replace mode will proceed with the default value
				toProceed = true;
			}
		}

		if (toProceed) {
			output[0] = partNumber;
			output[1] = catEntryType;
			output[2] = disallowRecurringOrder;
			output[3] = constants.EMPTY_STRING;

			outputStreams.csvCatEntRecOrderStream.write(output);
		}
	}
}

// name
// TBD: for enhancement - flexible rowData headers (different functionalities/runrequests)
function writeName(rowData, partNumber, catEntryType, languageId, outputStreams, dataloadMode) {
	var output = [];
	var dataName = rowData[constants.CSV_HEADER_USNAME];

	if (genericUtil.isUndefined(dataName)) {
		dataName = rowData[constants.CSV_HEADER_NAME];
	}

	if (!genericUtil.isUndefined(dataName)) {
		output[0] = partNumber;
		output[1] = catEntryType;
		output[2] = languageId;

		if (dataloadMode == constants.DATALOAD_MODE_REPLACE) {
			output[3] = dataName;
			output[4] = constants.EMPTY_STRING;
			outputStreams.csvCatEntDescNameStream.write(output);
		} else if (dataloadMode == constants.DATALOAD_MODE_DELETE) {
			output[3] = constants.EMPTY_STRING;
			output[4] = constants.EMPTY_STRING;
			outputStreams.csvCatEntDescNameStream.write(output);
		} else {
			if (!genericUtil.isTrimmedEmptyString(dataName)) {
				output[3] = dataName;
				output[4] = constants.EMPTY_STRING;
				outputStreams.csvCatEntDescNameStream.write(output);
			}
		}
	}
}

// long description
// TBD: for enhancement - flexible rowData headers (different functionalities/runrequests)
function writeLongDescription(rowData, partNumber, catEntryType, languageId, outputStreams, dataloadMode) {
	var output = [];
	var dataLongDescription = rowData[constants.CSV_HEADER_LONGDESC];

	if (!genericUtil.isUndefined(dataLongDescription)) {
		output[0] = partNumber;
		output[1] = catEntryType;
		output[2] = languageId;
		
		if (dataloadMode == constants.DATALOAD_MODE_REPLACE) {
			output[3] = dataLongDescription;
			output[4] = constants.EMPTY_STRING;
			outputStreams.csvCatEntDescLongDescStream.write(output);
		} else if (dataloadMode == constants.DATALOAD_MODE_DELETE) {
			output[3] = constants.EMPTY_STRING;
			output[4] = constants.EMPTY_STRING;
			outputStreams.csvCatEntDescLongDescStream.write(output);
		} else {
			if (!genericUtil.isTrimmedEmptyString(dataLongDescription)) {
				output[3] = dataLongDescription;
				output[4] = constants.EMPTY_STRING;
				outputStreams.csvCatEntDescLongDescStream.write(output);
			}
		}
	}
}

// published
// TBD: for enhancement - flexible rowData headers (different functionalities/runrequests)
function writeDisplayToCustomer(rowData, partNumber, catEntryType, languageId, outputStreams, dataloadMode) {
	var output = [];
	var dataDisplayToCustomer = rowData[constants.CSV_HEADER_DISPLAYTOCUSTOMERUS];
	var published = constants.BOOLEAN_DB_FALSE; // default value
	var toProceed = false;

	if (genericUtil.isUndefined(dataDisplayToCustomer)) {
		dataDisplayToCustomer = rowData[constants.CSV_HEADER_DISPLAYTOCUSTOMER];
	}
	
	if (!genericUtil.isUndefined(dataDisplayToCustomer)) {
		if (!genericUtil.isEmptyString(dataDisplayToCustomer)) {
			if (dataloadMode != constants.DATALOAD_MODE_DELETE) {
				// update or replace mode
				if (dataDisplayToCustomer == constants.BOOLEAN_STRING_TRUE) {
					published = constants.BOOLEAN_DB_TRUE;
				}
			}
			// delete mode will proceed with the default value
			toProceed = true;
		} else {
			if (dataloadMode != constants.DATALOAD_MODE_UPDATE) {
				// delete or replace mode will proceed with the default value
				toProceed = true;
			}
		}

		if (toProceed) {
			output[0] = partNumber;
			output[1] = catEntryType;
			output[2] = languageId;
			output[3] = published;
			output[4] = constants.EMPTY_STRING;

			outputStreams.csvCatEntDescPublishedStream.write(output);
		}
	}
}

// keyword
// TBD: for enhancement - flexible rowData headers (different functionalities/runrequests)
function writeKeyword(rowData, partNumber, catEntryType, languageId, outputStreams, dataloadMode) {
	var output = [];
	var dataKeyword = rowData[constants.CSV_HEADER_KEYWORDUS];

	if (genericUtil.isUndefined(dataKeyword)) {
		dataKeyword = rowData[constants.CSV_HEADER_KEYWORD];
	}

	if (!genericUtil.isUndefined(dataKeyword)) {
		output[0] = partNumber;
		output[1] = catEntryType;
		output[2] = languageId;

		if (dataloadMode == constants.DATALOAD_MODE_REPLACE) {
			output[3] = dataKeyword;
			output[4] = constants.EMPTY_STRING;
			outputStreams.csvCatEntDescKeywordStream.write(output);
		} else if (dataloadMode == constants.DATALOAD_MODE_DELETE) {
			output[3] = constants.EMPTY_STRING;
			output[4] = constants.EMPTY_STRING;
			outputStreams.csvCatEntDescKeywordStream.write(output);
		} else {
			if (!genericUtil.isTrimmedEmptyString(dataKeyword)) {
				output[3] = dataKeyword;
				output[4] = constants.EMPTY_STRING;
				outputStreams.csvCatEntDescKeywordStream.write(output);
			}
		}
	}
}

// page title
// TBD: for enhancement - flexible rowData headers (different functionalities/runrequests)
function writePageTitle(rowData, partNumber, catEntryType, languageId, outputStreams, dataloadMode) {
	var output = [];
	var dataPageTitle = rowData[constants.CSV_HEADER_PAGETITLEUS];
	//TBD code refactoring: review implementation - why need separate xml file per locale?
	var outputStreamKey = 'csvCatEntSEOPageTitleStream';

	if (genericUtil.isUndefined(dataPageTitle)) {
		dataPageTitle = rowData[constants.CSV_HEADER_PAGETITLE];
	}

	if (languageId != constants.DEFAULT_LANGUAGE_ID) {
		outputStreamKey = outputStreamKey + dataHelper.getLocaleName(languageId);
	}

	if (!genericUtil.isUndefined(dataPageTitle)) {
		output[0] = partNumber;
		output[1] = catEntryType;
		output[2] = languageId;
		output[3] = dataPageTitle;

		if (dataloadMode == constants.DATALOAD_MODE_REPLACE) {
			// replace mode
			if (genericUtil.isTrimmedEmptyString(dataPageTitle)) {
				output[3] = constants.CHAR_SPACE;
			}

			outputStreams[outputStreamKey].write(output);
		} else if (dataloadMode == constants.DATALOAD_MODE_DELETE) {
			// delete mode
			output[4] = constants.BOOLEAN_DB_TRUE;
			outputtreams[outputStreamKey].write(output);
			//TBD: for enhancement - currently no support for keyword deletion
		}
	}
}

// metadescription
// TBD: for enhancement - flexible rowData headers (different functionalities/runrequests)
function writeMetaDescription(rowData, partNumber, catEntryType, languageId, outputStreams, dataloadMode) {
	var output = [];
	var dataMetaDescription = rowData[constants.CSV_HEADER_METADESCUS];
	//TBD code refactoring: review implementation - why need separate xml file per locale?
	var outputStreamKey = 'csvCatEntSEOMetaDescStream';

	if (genericUtil.isUndefined(dataMetaDescription)) {
		dataMetaDescription = rowData[constants.CSV_HEADER_METADESC];
	}
	
	if (languageId != constants.DEFAULT_LANGUAGE_ID) {
		outputStreamKey = outputStreamKey + dataHelper.getLocaleName(languageId);
	}

	if (!genericUtil.isUndefined(dataMetaDescription)) {
		output[0] = partNumber;
		output[1] = catEntryType;
		output[2] = languageId;
		output[3] = dataMetaDescription;

		if (dataloadMode == constants.DATALOAD_MODE_REPLACE) {
			// replace mode
			if (genericUtil.isTrimmedEmptyString(dataMetaDescription)) {
				output[3] = constants.CHAR_SPACE;
			}

			outputStreams[outputStreamKey].write(output);
		} else if (dataloadMode == constants.DATALOAD_MODE_DELETE) {
			// delete mode
			output[4] = constants.BOOLEAN_DB_TRUE;
			//TBD: for enhancement - currently no support for keyword deletion
		} else {
			// update mode
			if (!genericUtil.isTrimmedEmptyString(dataMetaDescription)) {
				output[4] = constants.BOOLEAN_DB_FALSE;
				outputStreams[outputStreamKey].write(output);
			}
		}
	}
}

// classification code (UNSPSC)
// TBD: for enhancement - flexible rowData headers (different functionalities/runrequests)
function writeClassificationCodeTMP(rowData, partNumber, outputStreams, dataloadMode) {
	var output = [];
	var dataUnspsc = rowData[constants.CSV_HEADER_UNSPSC];

	if (!genericUtil.isUndefined(dataUnspsc)) {
		output[0] = partNumber;
		output[1] = constants.CSV_HEADER_UNSPSC;
		output[2] = dataUnspsc;
		
		if (dataloadMode == constants.DATALOAD_MODE_REPLACE) {
			// replace mode
			if (genericUtil.isTrimmedEmptyString(dataUnspsc)) {
				output[2] = 'ForDeletion';
				output[3] = constants.BOOLEAN_DB_TRUE;
			}
			outputStreams.csvCatEntryClassificationCodeStream.write(output);

		} else if (dataloadMode == constants.DATALOAD_MODE_DELETE) {
			// delete mode
			output[3] = constants.BOOLEAN_DB_TRUE;
			//TBD: for enhancement - currently no support for classification code deletion
		} else {
			// update mode
			if (!genericUtil.isTrimmedEmptyString(dataUnspsc)) {
				output[3] = constants.BOOLEAN_DB_FALSE;
				outputStreams.csvCatEntryClassificationCodeStream.write(output);
			}
		}
	}
}

// hidden family category
// TBD: for enhancement - flexible rowData headers (different functionalities/runrequests)
function writeHiddenFamilyCategoryTMP(rowData, partNumber, catEntryType, outputStreams, dataloadMode) {
	var output = [];
	var dataHiddenFamilyCategory = rowData[constants.CSV_HEADER_HIDDENFAMILYCATEGORY];

	if (!genericUtil.isUndefined(dataHiddenFamilyCategory)) {
		output[0] = partNumber;
		output[1] = catEntryType;
		output[2] = dataHiddenFamilyCategory;
		
		if (dataloadMode == constants.DATALOAD_MODE_REPLACE) {
			// replace mode
			if (!genericUtil.isTrimmedEmptyString(dataHiddenFamilyCategory)) {
				output[3] = constants.BOOLEAN_DB_FALSE;
				outputStreams.csvCatEntryHiddenFamilyCategoryStream.write(output);
			} else {
				output[3] = constants.BOOLEAN_DB_TRUE;
				outputStreams.csvCatEntryHiddenFamilyCategoryStream.write(output);
			}
		} else if (dataloadMode == constants.DATALOAD_MODE_DELETE) {
			// delete mode
			output[3] = constants.BOOLEAN_DB_TRUE;
			outputStreams.csvCatEntryHiddenFamilyCategoryStream.write(output);
		} else {
			// update mode
			if (!genericUtil.isTrimmedEmptyString(dataHiddenFamilyCategory)) {
				output[3] = constants.BOOLEAN_DB_FALSE;
				outputStreams.csvCatEntryHiddenFamilyCategoryStream.write(output);
			}
		}
	}
}

// announcement dates
// TBD: for enhancement - flexible rowData headers (different functionalities/runrequests)
// TBD: for review - maybe this will be better separated
function writeAnnouncementDateTMP(rowData, partNumber, catEntryType, outputStreams, dataloadMode) {
	var output = [];
	var dataAnnouncementDate = rowData[constants.CSV_HEADER_ANNOUNCEMENTDATE];
	var defaultTime = "00:00:00.000000000";
	var defaultValue = "1900-01-01 " + defaultTime;
	var toProceed = false;

	if (!genericUtil.isUndefined(dataAnnouncementDate)) {
		var announcementDateArray = dataAnnouncementDate.split(constants.CHAR_SLASH);

		output[0] = partNumber;
		output[1] = catEntryType;

		if (announcementDateArray.length >= 3) {
			output[2] = announcementDateArray[2] + constants.CHAR_HYPHEN
				+ announcementDateArray[0] + constants.CHAR_HYPHEN
				+ announcementDateArray[1] + constants.CHAR_SPACE 
				+ defaultTime;
			toProceed = true;
		}

		output[3] = constants.EMPTY_STRING;
		
		if (dataloadMode == constants.DATALOAD_MODE_DELETE) {
			// delete mode
			output[2] = constants.EMPTY_STRING;
			output[3] = constants.EMPTY_STRING;
			outputStreams.csvCatEntAnnouncementDateStream.write(output);
		} else {
			// replace or update mode
			//empty value
			if (genericUtil.isTrimmedEmptyString(dataAnnouncementDate)) {
				output[2] = constants.EMPTY_STRING;
				output[3] = constants.EMPTY_STRING;
				outputStreams.csvCatEntAnnouncementDateStream.write(output);
			} 
			else {
				if (toProceed) {
					output[3] = constants.EMPTY_STRING;
					outputStreams.csvCatEntAnnouncementDateStream.write(output);
				}
			}
		}
	}
}

// withdrawal dates
// TBD: for enhancement - flexible rowData headers (different functionalities/runrequests)
// TBD: for review - maybe this will be better separated
function writeWithdrawDateTMP(rowData, partNumber, catEntryType, outputStreams, dataloadMode) {
	var output = [];
	var dataWithdrawalDate = rowData[constants.CSV_HEADER_WITHDRAWALDATE];
	var defaultTime = "00:00:00.000000000";
	var defaultValue = "1900-01-01 " + defaultTime;
	var toProceed = false;

	if (!genericUtil.isUndefined(dataWithdrawalDate)) {
		var withdrawalDateArray = dataWithdrawalDate.split(constants.CHAR_SLASH);

		output[0] = partNumber;
		output[1] = catEntryType;

		if (withdrawalDateArray.length >= 3) {
			output[2] = withdrawalDateArray[2] + constants.CHAR_HYPHEN
				+ withdrawalDateArray[0] + constants.CHAR_HYPHEN
				+ withdrawalDateArray[1] + constants.CHAR_SPACE 
				+ defaultTime;
			toProceed = true;
		}

		output[3] = constants.EMPTY_STRING;
		
		if (dataloadMode == constants.DATALOAD_MODE_DELETE) {
			// delete mode
			output[2] = constants.EMPTY_STRING;
			output[3] = constants.EMPTY_STRING;
			outputStreams.csvCatEntWithdrawDateStream.write(output);
		} else {
			// replace or update mode
			//empty value
			if (genericUtil.isTrimmedEmptyString(dataWithdrawalDate)) {
				output[2] = constants.EMPTY_STRING;
				output[3] = constants.EMPTY_STRING;
				outputStreams.csvCatEntWithdrawDateStream.write(output);			
			}
			else {
				if (toProceed) {
					output[3] = constants.EMPTY_STRING;
					outputStreams.csvCatEntWithdrawDateStream.write(output);
				}	
			}
		}
	}
}

// master category
function writeMasterCategory(rowData, partNumber, catEntryType, outputStreams, lookupBuilder, dataloadMode) {
	var output = [];
	var dataParent = rowData[constants.CSV_HEADER_PARENT];
	var dataMasterCategory = rowData[constants.CSV_HEADER_FULLPATH];
	var masterCategoryLookup = lookupBuilder.getCatEntryMasterCategoriesLookup();

	if (!genericUtil.isUndefined(dataMasterCategory) && !genericUtil.isTrimmedEmptyString(dataMasterCategory)) {
	dataMasterCategory = dataMasterCategory.trim();
	var currentMasterCategory = masterCategoryLookup[partNumber];
	var proceedUpdate = false;

	// check if we can proceed with the update
	if (currentMasterCategory != dataMasterCategory)
		if (!genericUtil.isUndefined(dataParent) && !genericUtil.isTrimmedEmptyString(dataParent)) {
			dataParent = dataParent.trim();
			var parentCatEntryMasterCategory = masterCategoryLookup[dataParent];
			
			if (parentCatEntryMasterCategory == dataMasterCategory) {
				proceedUpdate = true;
			}
		} else {
			proceedUpdate = true;
		}
	}

	// populate data if can proceed
	if (proceedUpdate) {
		output[0] = partNumber;
		output[1] = catEntryType;
		output[3] = constants.DEFAULT_STOREID;
		output[4] = constants.EMPTY_STRING;

		// check update mode (note: deletion is not allowed)
		if (dataloadMode == constants.DATALOAD_MODE_REPLACE) {
			output[2] = currentMasterCategory;
			output[5] = constants.BOOLEAN_DB_TRUE;
			outputStreams.catEntCatGrpRelDeleteStream.write(output);
		}

		output[2] = dataMasterCategory;
		output[5] = constants.BOOLEAN_DB_FALSE;
		outputStreams.catEntCatGrpRelStream.write(output);

		// update master category lookup
		masterCategoryLookup[partNumber] = dataMasterCategory;

		// for replace mode, if catentrytype is product, replace master category of its sku
		if (dataloadMode == constants.DATALOAD_MODE_REPLACE 
			&& catEntryType == dataHelper.getCommerceVersionCatEntryType(constants.CATENTRYTYPE_PRODUCT)) {
			var childs = lookupBuilder.getCatEntryChildsLookup()[partNumber];
			
			if (!genericUtil.isUndefined(childs)) {
				childs.forEach(function (eachSku) {
					var currentSkuMasterCategory = masterCategoryLookup[eachSku];

					output[0] = eachSku;
					output[1] = dataHelper.getCommerceVersionCatEntryType(constants.CATENTRYTYPE_SKU);
					output[3] = constants.DEFAULT_STOREID;
					output[4] = constants.EMPTY_STRING;

					output[2] = currentSkuMasterCategory;
					output[5] = constants.BOOLEAN_DB_TRUE;
					outputStreams.catEntCatGrpRelDeleteStream.write(output);

					output[2] = dataMasterCategory;
					output[5] = constants.BOOLEAN_DB_FALSE;
					outputStreams.catEntCatGrpRelStream.write(output);

					// update master category lookup
					masterCategoryLookup[eachSku] = dataMasterCategory;
				});
			}
		}
	}
}

// sales categories
// TBD: for enhancement - flexible rowData headers (different functionalities/runrequests)
function writeSalesCategories(rowData, partNumber, catEntryType, outputStreams, lookups, lookupBuilder, dataloadMode) {
	var output = [];
	var storesArray;
	var salesCategoriesArray;
	var dataSalesCategories = rowData[constants.CSV_HEADER_SALESCTGRP];

	if (!genericUtil.isUndefined(dataSalesCategories)) {
		var currentSalesCategories = [];
		var indexesToSave = [];

		// retrieval of current value/s for replace mode
		if (dataloadMode == constants.DATALOAD_MODE_REPLACE) {
			currentSalesCategories = lookupBuilder.getSingleCatEntrySalesCategoriesLookup(partNumber);
		}

		// start of updates
		storesArray = rowData[constants.CSV_HEADER_STORE].split(constants.CHAR_PIPE);
		salesCategoriesArray = dataSalesCategories.split(constants.CHAR_PIPE);
		
		storesArray.forEach(function (eachStore) {
			var store = eachStore.trim();
			//TBD: code refactoring - use lookupBuilder instead
			var storeCategories = lookups.storesCategories[store.toUpperCase()];

			salesCategoriesArray.forEach(function (eachSalesCategory) {
				var salesCategory = eachSalesCategory.trim();

				if (!genericUtil.isEmptyString(salesCategory)) {
					if (storeCategories.includes(salesCategory)) {
						var storeIdentifier = dataHelper.getCommerceVersionStore(store);

						if (!genericUtil.isUndefined(storeIdentifier)) {
							output[0] = partNumber;
							output[1] = catEntryType;
							output[2] = salesCategory;
							output[3] = storeIdentifier;
							output[4] = constants.EMPTY_STRING;
							
							if (dataloadMode == constants.DATALOAD_MODE_REPLACE) {
								var salesCategoryExists = false;

								for (var index in currentSalesCategories) {
									if (salesCategory == currentSalesCategories[index].ParentGroupIdentifier
										&& storeIdentifier == currentSalesCategories[index].ParentStoreIdentifier) {
										salesCategoryExists = true;
										indexesToSave.push(index);
									}
								}

								if (!salesCategoryExists) {
									// write new categories to add
									output[5] = constants.BOOLEAN_DB_FALSE;
									outputStreams.storesCatEntParentCatGrpRelStreams[storeIdentifier].write(output);
								}
							} else if (dataloadMode == constants.DATALOAD_MODE_DELETE) {
								output[5] = constants.BOOLEAN_DB_TRUE;
								outputStreams.storesCatEntParentCatGrpRelStreams[storeIdentifier].write(output);
							} else {
								output[5] = constants.BOOLEAN_DB_FALSE;
								outputStreams.storesCatEntParentCatGrpRelStreams[storeIdentifier].write(output);
							}
						}
					}
				}
			});
		});

		// deletion of current value/s for replace mode
		if (dataloadMode == constants.DATALOAD_MODE_REPLACE) {
			for (var index in currentSalesCategories) {
				if (!indexesToSave.includes(index)) {
					var salesCategory = currentSalesCategories[index].ParentGroupIdentifier;
					var storeIdentifier = currentSalesCategories[index].ParentStoreIdentifier;

					output[0] = partNumber;
					output[1] = catEntryType;
					output[2] = salesCategory;
					output[3] = storeIdentifier;
					output[4] = constants.EMPTY_STRING;
					output[5] = constants.BOOLEAN_DB_TRUE;

					outputStreams.storesCatEntParentCatGrpRelStreams[storeIdentifier].write(output);
				}
			}
		}
	}
}

// extended and core attributes
// TBD: for enhancement - flexible rowData headers (different functionalities/runrequests)
function writeAttributesTMP(rowData, partNumber, languageId, outputStreams, lookups, lookupBuilder, dataloadMode) {
	var deprecatedLocaleSupportedAttrs = constants.DEPRECATED_LOCALE_SUPPORTED_ATTRS.split(constants.CHAR_PIPE);
	var attrReqs= {};
	
	// write only Locale and Country for deprecated locales
	if (dataHelper.isDeprecatedLocale(languageId, constants.LOCALES_MAPREF_LANGUAGEID)) {
		deprecatedLocaleSupportedAttrs.forEach(function (eachAttr) {
			attrReqs[eachAttr] = lookups.attrIdentifier['EMR'][eachAttr];
		});
	} else {
		attrReqs = lookups.attrIdentifier['EMR'];
	}

	//TBD: for code refactoring - restructure lookup "attrReqs.forEach(function (eachAttrReq) {"
	for (var key in attrReqs) {
		var attrReq = attrReqs[key];
		var attrIdentifier = attrReq.Identifier;
		var headerName = attrReq.HeaderName;
		var isRequired = false;

		if (!genericUtil.isTrimmedEmptyString(attrReq.MinOcurrences)) {
			if (parseInt(attrReq.MinOcurrences) > 0) {
				isRequired = true;
			}
		}

		// this line of code will remove Features, CTAs and UBelts
		if (!genericUtil.isUndefined(headerName) && !genericUtil.isTrimmedEmptyString(headerName)) {
			var dataAttr = rowData[headerName];

			if (!genericUtil.isUndefined(dataAttr)) {
				var dataAttrValues = [];
				var attrUsage;
				var valueIndex = 0;
				var attrValueIdentifiersMap = lookups.attrval[attrIdentifier];
				var attrSequence = lookups.attrsequence[attrIdentifier];
				var isMultiVal = !genericUtil.isUndefined(attrReq.MultiValue) && parseInt(attrReq.MultiValue) > 1;
				var forDeletion = dataloadMode == constants.DATALOAD_MODE_DELETE;

				// deletion of current value/s for replace mode
				// will only write deletion for multival unless the the mode it full replace deletion
				if (dataloadMode == constants.DATALOAD_MODE_REPLACE 
					&& headerName != constants.CSV_HEADER_LOCALE
					&& (isMultiVal || genericUtil.isTrimmedEmptyString(dataAttr))) {
					var currentAttributes = lookupBuilder.getSingleCatEntryAttributesLookup(partNumber);

					currentAttributes.forEach(function (eachAttribute) {
						if (attrIdentifier == eachAttribute.AttributeIdentifier
							&& (!isRequired || !genericUtil.isTrimmedEmptyString(dataAttr))) {

							populateAttributeStream(partNumber, attrIdentifier, languageId, eachAttribute.ValueIdentifier,
								eachAttribute.Value, eachAttribute.Usage, eachAttribute.Sequence, eachAttribute.AttributeStoreIdentifier,
								eachAttribute.Field1, eachAttribute.Field2, eachAttribute.Field3, constants.BOOLEAN_DB_TRUE,
								outputStreams, true, isMultiVal);
						}
					});
				}

				// start of updates
				if (!genericUtil.isUndefined(attrReq.MultiValue) && parseInt(attrReq.MultiValue) > 1) {
					dataAttrValues = dataAttr.split(constants.CHAR_PIPE);
				} else {
					dataAttrValues.push(dataAttr);
				}

				dataAttrValues = dataHelper.removeInvalidElements(dataAttrValues);

				if (attrReq.AttrValPrefix.includes("Attribute_Dictionary_Descriptive_Attributes")) {
					attrUsage = "Descriptive";
				} else {
					attrUsage = "Defining";
				}

				if (genericUtil.isUndefined(attrSequence)) {
					attrSequence = "0";
				}

				// attribute specific processing
				// always add 'UtilityBelt' to values of EMR TabSequence
				if (attrIdentifier == 'EMR TabSequence' && !dataAttrValues.includes('UtilityBelt') && !genericUtil.isTrimmedEmptyString(dataAttr)) {
						dataAttrValues.push('UtilityBelt');
				}
				
				// start writing attribute values
				dataAttrValues.forEach(function (eachDataAttrValue) {
					var valueIdentifier;
					var valueSequence = 0;
					var dataAttrValue = eachDataAttrValue.trim();
					var dbDelete = constants.BOOLEAN_DB_FALSE;

					if (forDeletion) {
						dbDelete = constants.BOOLEAN_DB_TRUE;
					}

					// special handling for attr sequencing
					if (attrIdentifier == 'EMR AttrSequencing') {
						valueSequence = valueIndex + 1;
					} else {
						valueSequence = attrSequence + dataHelper.getSequencingDecimal(valueIndex);
					}

					if (attrReq.LkupType == "LOOKUP_TABLE" || attrReq.LkupType == "STRING_ENUMERATION") {
						if (!genericUtil.isUndefined(attrValueIdentifiersMap)) {
							valueIdentifier = attrValueIdentifiersMap[dataAttrValue].ValueIdentifier;
						}
						if (genericUtil.isUndefined(valueIdentifier)) {
							valueIdentifier = 'Lookup_Value_Identifier';
						}
					} else {
						var valueIdentifierSuffix = constants.EMPTY_STRING;

						// special handling for attr sequencing
						if (attrIdentifier == 'EMR AttrSequencing') {
							valueIdentifierSuffix = constants.DEFAULT_ID_SEPARATOR + dataAttrValue.replace(/\W/g, constants.DEFAULT_ID_SEPARATOR);
						} else {
							if (dataAttrValues.length > 1) {
								valueIdentifierSuffix = constants.DEFAULT_ID_SEPARATOR + valueIndex;
							}
						}

						valueIdentifier = attrReq.AttrValPrefix + constants.DEFAULT_ID_SEPARATOR
							+ attrIdentifier.replace(/\W/g, constants.DEFAULT_ID_SEPARATOR) + constants.DEFAULT_ID_SEPARATOR
							+ partNumber.replace(/\W/g, constants.DEFAULT_ID_SEPARATOR) + constants.DEFAULT_ID_SEPARATOR
							+ constants.VALUE_ID + valueIdentifierSuffix;


						if (attrReq.AttributeType == '1') {
							var valueUsage = attrReq.AttributeType;
							// loading of predefined attr values
							//TBD: for review - why there is no deletion equivalent for this?
							populateAttrValuesStreams(attrIdentifier, languageId, valueIdentifier, valueSequence, dataAttrValue,
								valueUsage, constants.EMPTY_STRING, constants.EMPTY_STRING, constants.EMPTY_STRING,
								constants.EMPTY_STRING, constants.EMPTY_STRING, constants.EMPTY_STRING, 
								constants.EMPTY_STRING, constants.EMPTY_STRING, outputStreams)
						}
					}

					populateAttributeStream(partNumber, attrIdentifier, languageId, valueIdentifier, dataAttrValue,
						attrUsage, valueSequence, constants.DEFAULT_STOREID, constants.EMPTY_STRING, constants.EMPTY_STRING,
						constants.EMPTY_STRING, dbDelete, outputStreams, forDeletion, isMultiVal);

					valueIndex++;
				});
			}
		}
	}
}

// special attributes - features
// TBD: for enhancement - flexible rowData headers (different functionalities/runrequests)
function writeFeaturesTMP(rowData, partNumber, languageId, outputStreams, lookups, lookupBuilder, dataloadMode) {
	var attrReq = lookups.attrIdentifier['EMR']['EMR Features'];
	var attrIdentifier = attrReq.Identifier;
	var attrSequence = lookups.attrsequence[attrIdentifier];
	var maxNumOfFeatures = 12;
	var isMultiVal = !genericUtil.isUndefined(attrReq.MultiValue) && parseInt(attrReq.MultiValue) > 1;
	var forDeletion = dataloadMode == constants.DATALOAD_MODE_DELETE;

	for (var valueIndex = 0; valueIndex < maxNumOfFeatures; valueIndex++) {
		var csvHeader = constants.CSV_HEADER_FEATURE + constants.CHAR_SPACE + (valueIndex + 1).toString();
		var dataFeature = rowData[csvHeader];

		if (!genericUtil.isUndefined(dataFeature)) {
			var attrUsage = 'Descriptive';

			// deletion of current value/s for replace mode
			if (dataloadMode == constants.DATALOAD_MODE_REPLACE) {
				var currentAttributes = lookupBuilder.getSingleCatEntryAttributesLookup(partNumber);

				currentAttributes.forEach(function (eachAttribute) {
					var lookupValueIdentifier = eachAttribute.ValueIdentifier;
					var lookupValueIndex = lookupValueIdentifier.substring(lookupValueIdentifier.length - 1, lookupValueIdentifier.length);
					
					if (attrIdentifier == eachAttribute.AttributeIdentifier && valueIndex.toString() == lookupValueIndex) {

						populateAttributeStream(partNumber, attrIdentifier, languageId, eachAttribute.ValueIdentifier,
							eachAttribute.Value, eachAttribute.Usage, eachAttribute.Sequence, eachAttribute.AttributeStoreIdentifier,
							eachAttribute.Field1, eachAttribute.Field2, eachAttribute.Field3, constants.BOOLEAN_DB_TRUE,
							outputStreams, true, isMultiVal);
					}
				});
			}

			// start of updates
			if (!genericUtil.isTrimmedEmptyString(dataFeature)) {
				var valueIdentifier = attrReq.AttrValPrefix + constants.DEFAULT_ID_SEPARATOR
					+ attrIdentifier.replace(/\W/g, constants.DEFAULT_ID_SEPARATOR) + constants.DEFAULT_ID_SEPARATOR
					+ partNumber.replace(/\W/g, constants.DEFAULT_ID_SEPARATOR) + constants.DEFAULT_ID_SEPARATOR
					+ constants.VALUE_ID + constants.DEFAULT_ID_SEPARATOR + valueIndex;
				var valueSequence = attrSequence + dataHelper.getSequencingDecimal(valueIndex);
				var dbDelete = constants.BOOLEAN_DB_FALSE;

				if (forDeletion) {
					dbDelete = constants.BOOLEAN_DB_TRUE;
				}

				if (attrReq.AttributeType == '1') {
					var valueUsage = attrReq.AttributeType;
					// loading of predefined attr values
					//TBD: for review - why there is no deletion equivalent for this?
					populateAttrValuesStreams(attrIdentifier, languageId, valueIdentifier, valueSequence, dataFeature,
						valueUsage, constants.EMPTY_STRING, constants.EMPTY_STRING, constants.EMPTY_STRING,
						constants.EMPTY_STRING, constants.EMPTY_STRING, constants.EMPTY_STRING, 
						constants.EMPTY_STRING, constants.EMPTY_STRING, outputStreams)
				}

				populateAttributeStream(partNumber, attrIdentifier, languageId, valueIdentifier, dataFeature,
					attrUsage, valueSequence, constants.DEFAULT_STOREID, constants.EMPTY_STRING, constants.EMPTY_STRING,
					constants.EMPTY_STRING, dbDelete, outputStreams, forDeletion, isMultiVal);
			}
		}
	}
}

// special attributes - cta
// TBD: for enhancement - flexible rowData headers (different functionalities/runrequests)
function writeCTAsTMP(rowData, partNumber, languageId, outputStreams, lookups, lookupBuilder, dataloadMode) {
	var maxNumOfCTAs = 4;
	var csvHeaderPrefix = constants.CSV_HEADER_CTA;
	var csvHeaderSuffixName = 'Name';
	var csvHeaderSuffixUrl = 'URL';
	var isMultiVal = true;
	var forDeletion = dataloadMode == constants.DATALOAD_MODE_DELETE;
	var currentAttributes = lookupBuilder.getSingleCatEntryAttributesLookup(partNumber);

	for (var valueIndex = 0; valueIndex < maxNumOfCTAs; valueIndex++) {
		var csvHeaderName = csvHeaderPrefix + constants.CHAR_SPACE + (valueIndex + 1).toString() + constants.CHAR_SPACE + csvHeaderSuffixName;
		var csvHeaderUrl = csvHeaderPrefix + constants.CHAR_SPACE + (valueIndex + 1).toString() + constants.CHAR_SPACE + csvHeaderSuffixUrl;
		var dataCtaName = rowData[csvHeaderName];
		var dataCtaUrl = rowData[csvHeaderUrl];

		var inputCtaIdentifier = undefined;
		var inputCtaAttrReq = undefined;

		if (!genericUtil.isUndefined(dataCtaName) && !genericUtil.isTrimmedEmptyString(dataCtaName)) {
			inputCtaIdentifier = lookups.ctalookup[dataCtaName];
			inputCtaAttrReq = lookups.attrIdentifier['EMR'][inputCtaIdentifier];

			if (genericUtil.isUndefined(inputCtaAttrReq)) {
				inputCtaIdentifier = 'EMR ' + dataCtaName + ' CTA';
				inputCtaAttrReq = lookups.attrIdentifier['EMR'][inputCtaIdentifier];
			}
		}

		if (!genericUtil.isUndefined(dataCtaName)) {
			// deletion logic
			currentAttributes.forEach(function (eachAttribute) {
				// check existence of any CTA on current position
				if (eachAttribute.AttributeIdentifier.includes("CTA") && parseInt(eachAttribute.Sequence) == valueIndex) {
					// proceed deletion either:
					// if input CTA doesn't match with current position CTA
					// if for deletion (blank CTA Name)
					if ((!genericUtil.isUndefined(inputCtaAttrReq) && inputCtaIdentifier != eachAttribute.AttributeIdentifier)
						|| genericUtil.isTrimmedEmptyString(dataCtaName)) {
						// actual deletion
						populateAttributeStream(partNumber, eachAttribute.AttributeIdentifier, languageId, eachAttribute.ValueIdentifier,
							eachAttribute.Value, eachAttribute.Usage, eachAttribute.Sequence, eachAttribute.AttributeStoreIdentifier,
							eachAttribute.Field1, eachAttribute.Field2, eachAttribute.Field3, constants.BOOLEAN_DB_TRUE,
							outputStreams, true, isMultiVal);
					}
				}
			});

			// update logic
			if (!genericUtil.isUndefined(inputCtaAttrReq)) {
				if (!genericUtil.isUndefined(dataCtaUrl) && !genericUtil.isTrimmedEmptyString(dataCtaUrl)) {
					var valueIdentifier = inputCtaAttrReq.AttrValPrefix + constants.DEFAULT_ID_SEPARATOR
						+ inputCtaIdentifier.replace(/\W/g, constants.DEFAULT_ID_SEPARATOR) + constants.DEFAULT_ID_SEPARATOR
						+ partNumber.replace(/\W/g, constants.DEFAULT_ID_SEPARATOR) + constants.DEFAULT_ID_SEPARATOR
						+ constants.VALUE_ID;
					var valueSequence = valueIndex;
					var valueUsage = constants.EMPTY_STRING;
					var dbDelete = constants.BOOLEAN_DB_FALSE;
					var attrUsage = 'Descriptive';

					if (forDeletion) {
						dbDelete = constants.BOOLEAN_DB_TRUE;
					}

					if (inputCtaAttrReq.AttributeType == '1') {
						valueUsage = inputCtaAttrReq.AttributeType;
						// loading of predefined attr values
						//TBD: for review - why there is no deletion equivalent for this?
						populateAttrValuesStreams(inputCtaIdentifier, languageId, valueIdentifier, valueSequence, dataCtaUrl.trim(),
							valueUsage, constants.EMPTY_STRING, constants.EMPTY_STRING, constants.EMPTY_STRING,
							constants.EMPTY_STRING, constants.EMPTY_STRING, constants.EMPTY_STRING, 
							constants.EMPTY_STRING, constants.EMPTY_STRING, outputStreams);
					}
					// actual update
					populateAttributeStream(partNumber, inputCtaIdentifier, languageId, valueIdentifier, dataCtaUrl.trim(),
						attrUsage, valueSequence, constants.DEFAULT_STOREID, constants.EMPTY_STRING, constants.EMPTY_STRING,
						constants.EMPTY_STRING, dbDelete, outputStreams, forDeletion, isMultiVal);
				}
			}
		}
	}
}

// special attributes - utility belts
// TBD: for enhancement - flexible rowData headers (different functionalities/runrequests)
function writeUtilityBelts(rowData, partNumber, languageId, outputStreams, lookups, lookupBuilder, dataloadMode) {
	var maxNumOfUBelts = 3;
	var csvHeaderPrefix = constants.CSV_HEADER_UBELT;
	var csvHeaderSuffixTag = 'Tag';
	var csvHeaderSuffixText = 'Text';
	var csvHeaderSuffixUrl = 'URL';
	var isMultiVal = true;
	var forDeletion = dataloadMode == constants.DATALOAD_MODE_DELETE;
	var currentAttributes = lookupBuilder.getSingleCatEntryAttributesLookup(partNumber);

	for (var valueIndex = 0; valueIndex < maxNumOfUBelts; valueIndex++) {
		var csvHeaderTag = csvHeaderPrefix + constants.CHAR_SPACE + (valueIndex + 1).toString() + constants.CHAR_SPACE + csvHeaderSuffixTag;
		var csvHeaderText = csvHeaderPrefix + constants.CHAR_SPACE + (valueIndex + 1).toString() + constants.CHAR_SPACE + csvHeaderSuffixText;
		var csvHeaderUrl = csvHeaderPrefix + constants.CHAR_SPACE + (valueIndex + 1).toString() + constants.CHAR_SPACE + csvHeaderSuffixUrl;
		var dataUBeltTag = rowData[csvHeaderTag];
		var dataUBeltText = rowData[csvHeaderText];
		var dataUBeltUrl = rowData[csvHeaderUrl];

		var inputUBeltIdentifier = undefined;
		var inputUBeltAttrReq = undefined;;

		if (!genericUtil.isUndefined(dataUBeltTag) && !genericUtil.isTrimmedEmptyString(dataUBeltTag)) {
			inputUBeltIdentifier = lookups.utilitybeltlookup[dataUBeltTag];
			inputUBeltAttrReq = lookups.attrIdentifier['EMR'][inputUBeltIdentifier];

			if (genericUtil.isUndefined(inputUBeltAttrReq)) {
				inputUBeltIdentifier = 'EMR Utility Belt_' + dataUBeltTag;
				inputUBeltAttrReq = lookups.attrIdentifier['EMR'][inputUBeltIdentifier];
			}
		}

		if (!genericUtil.isUndefined(dataUBeltTag)) {
			// deletion logic
			currentAttributes.forEach(function (eachAttribute) {
				// check existence of any UBelt on current position
				if (eachAttribute.AttributeIdentifier.includes("Utility Belt") && parseInt(eachAttribute.Sequence) == valueIndex) {
					// proceed deletion either:
					// if input UBelt doesn't match with current position UBelt
					// if for deletion (blank UBelt Name)
					if ((!genericUtil.isUndefined(inputUBeltAttrReq) && inputUBeltIdentifier != eachAttribute.AttributeIdentifier)
						|| genericUtil.isTrimmedEmptyString(dataUBeltTag)) {
						// actual deletion
						populateAttributeStream(partNumber, eachAttribute.AttributeIdentifier, languageId, eachAttribute.ValueIdentifier,
							eachAttribute.Value, eachAttribute.Usage, eachAttribute.Sequence, eachAttribute.AttributeStoreIdentifier,
							eachAttribute.Field1, eachAttribute.Field2, eachAttribute.Field3, constants.BOOLEAN_DB_TRUE,
							outputStreams, true, isMultiVal);
					}
				}
			});

			// update logic
			if (!genericUtil.isUndefined(inputUBeltAttrReq)) {
				if (!genericUtil.isUndefined(dataUBeltUrl) && !genericUtil.isTrimmedEmptyString(dataUBeltUrl)) {
					var ubeltEntries = [dataUBeltText.trim(), dataUBeltUrl.trim(), dataUBeltTag.trim()];
					var noOfUbeltEntries = 3;
					var attrSequence = valueIndex;
					var valueUsage = constants.EMPTY_STRING;
					var dbDelete = constants.BOOLEAN_DB_FALSE;
					var attrUsage = 'Descriptive';

					if (forDeletion) {
						dbDelete = constants.BOOLEAN_DB_TRUE;
					}

					for (var ubeltEntryIndex = 0; ubeltEntryIndex < noOfUbeltEntries; ubeltEntryIndex++) {
						var valueIdentifier = inputUBeltAttrReq.AttrValPrefix + constants.DEFAULT_ID_SEPARATOR
							+ inputUBeltIdentifier.replace(/\W/g, constants.DEFAULT_ID_SEPARATOR) + constants.DEFAULT_ID_SEPARATOR
							+ partNumber.replace(/\W/g, constants.DEFAULT_ID_SEPARATOR) + constants.DEFAULT_ID_SEPARATOR
							+ constants.VALUE_ID + constants.DEFAULT_ID_SEPARATOR + ubeltEntryIndex;
						var valueSequence = attrSequence + dataHelper.getSequencingDecimal(ubeltEntryIndex);

						if (inputUBeltAttrReq.AttributeType == '1') {
							valueUsage = inputUBeltAttrReq.AttributeType;
							// loading of predefined attr values
							//TBD: for review - why there is no deletion equivalent for this?
							populateAttrValuesStreams(inputUBeltIdentifier, languageId, valueIdentifier, valueSequence, ubeltEntries[ubeltEntryIndex],
								valueUsage, constants.EMPTY_STRING, constants.EMPTY_STRING, constants.EMPTY_STRING,
								constants.EMPTY_STRING, constants.EMPTY_STRING, constants.EMPTY_STRING, 
								constants.EMPTY_STRING, constants.EMPTY_STRING, outputStreams)
						}

						populateAttributeStream(partNumber, inputUBeltIdentifier, languageId, valueIdentifier, ubeltEntries[ubeltEntryIndex],
							attrUsage, valueSequence, constants.DEFAULT_STOREID, constants.EMPTY_STRING, constants.EMPTY_STRING,
							constants.EMPTY_STRING, dbDelete, outputStreams, forDeletion, isMultiVal);
					}
				}
			}
		}
	}
}

// populate stream - attribute values (core/extended/special)
function populateAttributeStream(partNumber, attrIdentifier, languageId, valueIdentifier, value, usage, sequence, 
	storeIdentifier, field1, field2, field3, dbDelete, outputStreams, forDeletion, isMultival) {

	var output = [];
	output[0] = partNumber;
	output[1] = attrIdentifier;
	output[2] = languageId;
	output[3] = valueIdentifier;
	output[4] = value;
	output[5] = usage;
	output[6] = sequence;
	output[7] = storeIdentifier;
	output[8] = field1;
	output[9] = field2;
	output[10] = field3;
	output[11] = dbDelete;

	if (forDeletion) {
		outputStreams.csvCatEntAttrDictAttrRelDeleteStream.write(output);
	} else {
		if (isMultival) {
			outputStreams.csvCatEntAttrDictAttrRelStream.write(output);
		} else {
			outputStreams.csvCatEntAttrDictAttrRelSingleStream.write(output);
		}
	}
}

// populate stream - predefined allowed attribute values (core/extended/special)
function populateAttrValuesStreams(attrIdentifier, languageId, valueIdentifier, sequence, value, valueUsage,
	attrValField1, attrValField2, attrValField3, image1, image2, field1, field2, field3, outputStreams) {

	var output = [];
	output[0] = attrIdentifier;
	output[1] = languageId;
	output[2] = valueIdentifier;
	output[3] = sequence;
	output[4] = value;
	output[5] = valueUsage;
	output[6] = attrValField1;
	output[7] = attrValField2;
	output[8] = attrValField3;
	output[9] = image1;
	output[10] = image2;
	output[11] = field1;
	output[12] = field2;
	output[13] = field3;

	outputStreams.csvAttrDictAttrAllowValsStream.write(output);
}

// main writer - full replace
exports.writeRowDataForFullReplace = function(rowData, outputStreams, lookups, lookupBuilder) {
	var dataLocaleName = rowData[constants.CSV_HEADER_LOCALE];
	var dataCode = rowData[constants.CSV_HEADER_CODE];
	var dataCatEntryType = rowData[constants.CSV_HEADER_CATENTRY_TYPE];
	var dataMftrPartNumber = rowData[constants.CSV_HEADER_MFTR_PART_NUM];
	var dataMftr = rowData[constants.CSV_HEADER_MFTR];

	var partNumber = dataHelper.getPartNumber(dataCode, dataCatEntryType, dataMftrPartNumber, dataMftr);
	var catEntryType = dataHelper.getCommerceVersionCatEntryType(dataCatEntryType);
	var languageId = dataHelper.getLanguageId(dataLocaleName);
	
	// for default locale
	if (dataLocaleName == constants.DEFAULT_LOCALE_NAME) {
		// base fields (specific data first before all default data)
		writeParent(rowData, partNumber, outputStreams, lookupBuilder, constants.DATALOAD_MODE_REPLACE);
		writeMasterCategory(rowData, partNumber, catEntryType, outputStreams, lookupBuilder, constants.DATALOAD_MODE_REPLACE);
		writeDefaultData(rowData, partNumber, catEntryType, outputStreams, lookups, lookupBuilder, constants.DATALOAD_MODE_REPLACE);

		writeOnSpecial(rowData, partNumber, catEntryType, outputStreams, constants.DATALOAD_MODE_REPLACE);
		writeForPurchase(rowData, partNumber, catEntryType, outputStreams, constants.DATALOAD_MODE_REPLACE);
		writePrice(rowData, partNumber, catEntryType, outputStreams, constants.DATALOAD_MODE_REPLACE);
		writeUrl(rowData, partNumber, catEntryType, outputStreams, constants.DATALOAD_MODE_REPLACE);
		writeSubscriptionItem(rowData, partNumber, catEntryType, outputStreams, constants.DATALOAD_MODE_REPLACE);
		writeRecurringOrderItem(rowData, partNumber, catEntryType, outputStreams, constants.DATALOAD_MODE_REPLACE);
		writeClassificationCodeTMP(rowData, partNumber, outputStreams, constants.DATALOAD_MODE_REPLACE);
		writeHiddenFamilyCategoryTMP(rowData, partNumber, catEntryType, outputStreams, constants.DATALOAD_MODE_REPLACE);

		// sales categories
		writeSalesCategories(rowData, partNumber, catEntryType, outputStreams, lookups, lookupBuilder, constants.DATALOAD_MODE_REPLACE);
	}

	// for non-deprecated and default locale
	if (!dataHelper.isDeprecatedLocale(dataLocaleName, constants.LOCALES_MAPREF_LOCALENAME)) {
		// special attributes
		writeFeaturesTMP(rowData, partNumber, languageId, outputStreams, lookups, lookupBuilder, constants.DATALOAD_MODE_REPLACE);
	}

	// for all valid locale
	//writeURLKeyword - no need for full replace, this is autogenerated upon product authoring for specific locale

	// base fields
	writeName(rowData, partNumber, catEntryType, languageId, outputStreams, constants.DATALOAD_MODE_REPLACE);
	writeLongDescription(rowData, partNumber, catEntryType, languageId, outputStreams, constants.DATALOAD_MODE_REPLACE);
	writeDisplayToCustomer(rowData, partNumber, catEntryType, languageId, outputStreams, constants.DATALOAD_MODE_REPLACE);
	writeKeyword(rowData, partNumber, catEntryType, languageId, outputStreams, constants.DATALOAD_MODE_REPLACE);
	writePageTitle(rowData, partNumber, catEntryType, languageId, outputStreams, constants.DATALOAD_MODE_REPLACE);
	writeMetaDescription(rowData, partNumber, catEntryType, languageId, outputStreams, constants.DATALOAD_MODE_REPLACE);
	writeAnnouncementDateTMP(rowData, partNumber, catEntryType, outputStreams, constants.DATALOAD_MODE_REPLACE);
	writeWithdrawDateTMP(rowData, partNumber, catEntryType, outputStreams, constants.DATALOAD_MODE_REPLACE);

	// extended and core attributes except special attributes (features, CTAs and UBelts)
	// has own checking of deprecated locales
	writeAttributesTMP(rowData, partNumber, languageId, outputStreams, lookups, lookupBuilder, constants.DATALOAD_MODE_REPLACE);

	// special attributes
	writeCTAsTMP(rowData, partNumber, languageId, outputStreams, lookups, lookupBuilder, constants.DATALOAD_MODE_REPLACE);
	writeUtilityBelts(rowData, partNumber, languageId, outputStreams, lookups, lookupBuilder, constants.DATALOAD_MODE_REPLACE);
}

// writes attribute dictionary lookup object into a csv file
exports.writeAttributeDictionary = function(attributeDictionaryLookup, attrDictionaryOutputStream) {
	if (!genericUtil.isUndefined(attributeDictionaryLookup)) {
		for (var attrIdentifier in attributeDictionaryLookup) {
			var attrData = attributeDictionaryLookup[attrIdentifier];
			attrDictionaryOutputStream.write(attrData);
		}
	}
}

// writes attribute values dictionary lookup object into a csv file
exports.writeAttributeValuesDictionary = function(attributeValuesDictionaryLookup, attrValDictionaryOutputStream) {
	if (!genericUtil.isUndefined(attributeValuesDictionaryLookup)) {
		for (var attrIdentifier in attributeValuesDictionaryLookup) {
			var attrDictionaryEntry = attributeValuesDictionaryLookup[attrIdentifier];

			for (var attrValIdentifier in attrDictionaryEntry) {
				var attrValData = attrDictionaryEntry[attrValIdentifier];
				attrValDictionaryOutputStream.write(attrValData);
			}
		}
	}
}

// writes cta map lookup object into a csv file
exports.writeCallToActionsMap = function(ctaMapLookup, ctaMapOutputStream) {
	if (!genericUtil.isUndefined(ctaMapLookup)) {
		for (var ctaAttrIdentifier in ctaMapLookup) {
			var ctaMapData = ctaMapLookup[ctaAttrIdentifier];
			ctaMapOutputStream.write(ctaMapData);
		}
	}
}

// writes ubelt map lookup object into a csv file
exports.writeUtilityBeltsMap = function(ubeltMapLookup, ubeltMapOutputStream) {
	if (!genericUtil.isUndefined(ubeltMapLookup)) {
		for (var ubeltAttrIdentifier in ubeltMapLookup) {
			var ubeltMapData = ubeltMapLookup[ubeltAttrIdentifier];
			ubeltMapOutputStream.write(ubeltMapData);
		}
	}
}

// writes master sales category lookup object into a csv file
exports.writeMasterSalesCategory = function(masterSalesCategoryLookup, masterSalesCategoryOutputStream) {
	if (!genericUtil.isUndefined(masterSalesCategoryLookup)) {
		for (var categoryIdentifier in masterSalesCategoryLookup) {
			for (var parentIdentifier in masterSalesCategoryLookup[categoryIdentifier]){
				var categoryData = masterSalesCategoryLookup[categoryIdentifier][parentIdentifier];
				masterSalesCategoryOutputStream.write(categoryData);
			}
		}
	}
}

/************************************************
 * End of Coding Guidance Compliant Functions----
 ************************************************/



//TBD: code refactoring - split this function to pattern like validator, no need to pass run request
exports.write = function(data,outputStreams,lookups,jsonProperties,rRequest) {
	var output;

	// preprocess data from the users
	data = dataHelper.removeDataElementsUnacceptableCharacters(data);

	if (rRequest === 'CatalogEntryComponent') {
		writeComponentAssociations(data,outputStreams);
	} else if (rRequest === 'CatalogEntryParentCatalogGroupRelationship') {
		if (data['Type'] === 'SKU List') {
			// Sku sequencing
			writeSkuAttributeSequence(data,outputStreams);
		} else if (data['Type'] === 'Attribute') {
			// Attribute sequencing
			writeCatEntryAttrRelSequence(data, outputStreams, lookups);
		} else {
			// Sales catalog sequencing
			writeAttributeSequence(data,outputStreams, jsonProperties);
		}
	} else if (rRequest === 'CatalogEntryAttributeRelationshipDeletion') {
		if ((data['Parent'] !== undefined && data['Parent'] !== '') || (data['New Parent'] !== undefined && data['New Parent'] !== '')){
			if (data['Parent'] !== undefined && data['Parent'] !== ''){
				writeCatalogParentSkuDelete(data, outputStreams, lookups);
			}
			if (data['New Parent'] !== undefined && data['New Parent'] !== ''){
				writeCatalogParentSkuUpdate(data, outputStreams, lookups);
			}
		} else if (data['Hide SKU List Attribute'] !== undefined && data['Hide SKU List Attribute'] !== ''){
			writeCatalogEntryHideAttributes(data, outputStreams, lookups);
		}
		else {
			writeAttributesDelete(data,outputStreams,lookups);
			writeCTAsDelete(data,outputStreams,lookups);
			writeUtilityBeltDelete(data, outputStreams, lookups);
			writeFeaturesDelete(data,outputStreams,lookups);
			writeCatalogEntryDelete(data, outputStreams, lookups);
		}
	} else {

		//verify if current record locale is deprecated
		var isDeprecated = isDeprecatedLocale(data, jsonProperties);

		validLocales = jsonProperties.validLocales;
		writeBaseFields(data, outputStreams);
		writeURLKeyword(data, outputStreams, lookups);

		if (getLocale(data) === -1) {
			writeDefaultAttributeValues(data,outputStreams,lookups);
			writeSalesCatalogPath(data,outputStreams,lookups,jsonProperties);
		}

		//if not a deprecated locale write data in csv
		if(!isDeprecated) {
			writeFeatures(data, outputStreams, lookups);
			writeClassificationCode(data,outputStreams);
			writeHiddenFamilyCategory(data,outputStreams);
		}

		writeCTAs(data,outputStreams,lookups);
		writeUtilityBelt(data, outputStreams, lookups);
		writeAttributes(data,outputStreams,lookups,jsonProperties,isDeprecated);
		writeAnnouncementDate(data,outputStreams);
		writeWithdrawDate(data,outputStreams);
	}
};

function writeClassificationCode(data,outputStreams) {
	var output = [];

	if (data["UNSPSC"] !== undefined && data["UNSPSC"].trim() !== '') {
		// ['PartNumber','Domain','Code','Delete']
		output[0] = getPartnumber(data);
		output[1] = 'UNSPSC';
		output[2] = data['UNSPSC'];

		if (data['Delete'] !== undefined
				&& data['Delete'].toLowerCase() == 'yes') {
			output[3] = '1';
		} else {
			output[3] = '';
		}

		outputStreams.csvCatEntryClassificationCodeStream.write(output);
		// reset output array for next file
		output.splice(0);
	}
}

function writeHiddenFamilyCategory(data,outputStreams) {
	var output = [];
	var hiddenCategoryFieldValue = data['Hidden Category'];
	var deleteFieldName = data['Delete'];

	if (hiddenCategoryFieldValue !== undefined && hiddenCategoryFieldValue.trim() !== '') {
		// ['PartNumber','Type','Category','Delete']
		output[0] = getPartnumber(data);
		output[1] = getCatalogEntryTypeMapping(data);
		output[2] = hiddenCategoryFieldValue;

		if (deleteFieldName !== undefined
				&& deleteFieldName.toLowerCase() == 'yes') {
			output[3] = '1';
		} else {
			output[3] = '';
		}

		outputStreams.csvCatEntryHiddenFamilyCategoryStream.write(output);
		// reset output array for next file
		output.splice(0);
	}
}


/**
 * perform required validation for locale if included in the list of deprecated locale.
 * return true => if parameter locale exist in the list of deprecated locale. else return false.
 *
 * @param data
 * @param jsonProperties
 * @returns boolean isDeprecated
 */
function isDeprecatedLocale(data, jsonProperties) {
	var isDeprecated = false;
	var locale = data.Locale;

	if (locale !== undefined && locale.trim() !== '') {
		locale = locale.trim();
		// check if paramLocale is in list of deprecated locales
		if (jsonProperties.deprecatedLocales.indexOf(locale) !== -1) {
			// set the return value
			isDeprecated = true;
		}
	}

	return isDeprecated;
}

/**
 * Return true, if "isDeprecatedParam" is true and if the parameter "attrFieldName" is not exist on list of standardCoreFields.
 * Otherwise false
 *
 * @param isDeprecatedParam
 * @param attrFieldName
 * @param jsonProperties
 * @returns boolean isDeprecated
 */
function isDeprecatedLocaleField(isDeprecatedParam, attrFieldName, jsonProperties) {
	var isDeprecated = false;
	// check if isDeprecatedParam is true and attrFieldName is in list of standardCoreFields
	if (isDeprecatedParam && jsonProperties.standardCoreFields.indexOf(attrFieldName) === -1) {
		// set the return value
		isDeprecated = true;
	}
	return isDeprecated;
}
