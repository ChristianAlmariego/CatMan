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


var validLocales;
function getPartnumber(data)
{
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
}

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

function writeBaseFields(data,outputStreams) {
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

//URLKeyword
function writeURLKeyword(data,outputStreams){
	var output = [];
	var locale = getLocale(data);
	output[0] = getPartnumber(data);
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
	output[3] = urlkeyword;
	output[4] = '';

	outputStreams.csvCatEntSEOUrlKeywordStream.write(output);
	
	//reset output array for next file
	output.splice(0);
	
}

function writeAttributes(data,outputStreams,lookups) {
	var output = [];
	var locale = getLocale(data);
	var partnumber = getPartnumber(data);
	//retrieve all the keys from the header lookup table (ie. column headers)
	var headercols = [];
	var headerlookup = lookups.header['EMR'];
	var attrlookup = lookups.attrval;
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
				output[0] = partnumber;
				output[1] = attrIdentifier;
				output[2] = locale;
				
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
					attroutput[0] = attrIdentifier; //Identifier
					attroutput[1] = locale; //LanguageId
					attroutput[2] = output[3]; //ValueIdentifier
					attroutput[3] = sequence; //Sequence
					attroutput[4] = dataElement; //Value
					attroutput[5] = '1'; //ValueUsage
					attroutput[6] = ''; //AttributeValueField1
					attroutput[7] = ''; //AttributeValueField2
					attroutput[8] = ''; //AttributeValueField3
					attroutput[9] = ''; //Image1
					attroutput[10] = ''; //Image2
					attroutput[11] = ''; //Field1
					attroutput[12] = ''; //Field2
					attroutput[13] = ''; //Field3
					outputStreams.csvAttrDictAttrAllowValsStream.write(attroutput);

					//reset output array for next row
					attroutput.splice(0);
				}
				output[4] = dataElement;
				output[5] = 'Descriptive';
				output[6] = sequence;
				output[7] = 'EmersonCAS';
				output[8] = '';
				output[9] = '';
				output[10] = '';
				output[11] = '';
				if (locale === -1)
				{
					if (headerlookup[headercols[i]].MultiValue !== undefined && headerlookup[headercols[i]].MultiValue > 1) {
						outputStreams.csvCatEntAttrDictAttrRelStream.write(output);
					} else {
						outputStreams.csvCatEntAttrDictAttrRelSingleStream.write(output);
					}
				}

				//reset output array for next row
				output.splice(0);
				seq++;
			}
			dataarray.splice(0);
		}

	}
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
						output[4] = j; //Sequence
						output[5] = ''; //Delete
						
						//outputStreams.csvCatEntParentCatGrpRelStream.write(output);
						outputStreams.storesCatEntParentCatGrpRelStreams[currentStore].write(output);
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
			if (locale === -1)
			{
				outputStreams.csvCatEntAttrDictAttrRelStream.write(output);
			}

			//reset output array for next row
			output.splice(0);
			
			var attroutput = [];										
			attroutput[0] = attrName; //Identifier
			attroutput[1] = locale; //LanguageId
			attroutput[2] = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes' + '_' + attroutput[0].replace(/\W/g,'_') + '_' + 
			partnumber.replace(/\W/g,'_') + '_ValueID'; //ValueIdentifier
			attroutput[3] = i - 1;		
	        attroutput[4] = data['CallToAction ' + i + ' URL'].trim();
			attroutput[5] = '1'; //ValueUsage
			attroutput[6] = ''; //AttributeValueField1
			attroutput[7] = ''; //AttributeValueField2
			attroutput[8] = ''; //AttributeValueField3
			attroutput[9] = ''; //Image1
			attroutput[10] = ''; //Image2
			attroutput[11] = ''; //Field1
			attroutput[12] = ''; //Field2
			attroutput[13] = ''; //Field3
			outputStreams.csvAttrDictAttrAllowValsStream.write(attroutput);

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
			if (locale === -1)
			{
				outputStreams.csvCatEntAttrDictAttrRelStream.write(output);
			}

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
			if (locale === -1)
			{
				outputStreams.csvCatEntAttrDictAttrRelStream.write(output);
			}

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
			if (locale === -1)
			{
				outputStreams.csvCatEntAttrDictAttrRelStream.write(output);
			}

			//reset output array for next row
			output.splice(0);
			
			var attroutput = [];
			attroutput[0] = attrName; //Identifier
			attroutput[1] = locale; //LanguageId
			attroutput[2] = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes' + '_' + attroutput[0].replace(/\W/g,'_') + '_' + 
			partnumber.replace(/\W/g,'_') + '_ValueID_0';; //ValueIdentifier
			if(i == 1){
				attroutput[3] = 0;
			    }
			else
				{
				attroutput[3] = (i - 1) + ".0";
				}
			attroutput[4] = data['Utility Belt ' + i + ' Text'].trim();
			attroutput[5] = '1'; //ValueUsage
			attroutput[6] = ''; //AttributeValueField1
			attroutput[7] = ''; //AttributeValueField2
			attroutput[8] = ''; //AttributeValueField3
			attroutput[9] = ''; //Image1
			attroutput[10] = ''; //Image2
			attroutput[11] = ''; //Field1
			attroutput[12] = ''; //Field2
			attroutput[13] = ''; //Field3
			outputStreams.csvAttrDictAttrAllowValsStream.write(attroutput);
			
			
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
			
			outputStreams.csvAttrDictAttrAllowValsStream.write(attroutput);
			
			
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
			
			outputStreams.csvAttrDictAttrAllowValsStream.write(attroutput);
			
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
			outputStreams.csvAttrDictAttrAllowValsStream.write(attroutput);

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

function writeComponentAssociations(data,outputStreams) {
	var output = [];

	//['PartNumber','Type','ChildPartNumber','ChildStoreIdentifier','Sequence','Delete']
	output[0] = data['Component Code']; // Parent Part Number
	output[1] = data['Component Type'];
	output[2] = data['Child Code'];
	output[3] = 'EmersonCAS';
	output[4] = data['Sequence'];
	output[5] = '1'; //Quantity
	if (data['Delete'] !== undefined && data['Delete'].toLowerCase() == 'yes') {
		output[6] = '1';
	} else {
		output[6] = '';
	}
	outputStreams.csvCatEntryComponentStream.write(output);
	
	//reset output array for next file
	output.splice(0);
}


function writeAttributeSequence(data, outputStreams, jsonProperties){
	var output = [];	
	var wcStoreIdentifier;
	var wcStoreIdentifierLookup = [];

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
	//console.log('output:'+output +wcStoreIdentifier)
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

exports.write = function(data,outputStreams,lookups,jsonProperties,rRequest) {
	var output;
	
	// preprocess data from the users
	data = dataHelper.removeDataElementsUnacceptableCharacters(data);

	if (rRequest === 'CatalogEntryComponent') {
		writeComponentAssociations(data,outputStreams);
	} else if (rRequest === 'CatalogEntryParentCatalogGroupRelationship') {
		if (data['Type'] === 'SKU List') {
			writeSkuAttributeSequence(data,outputStreams);
		} else if (data['Type'] === 'Attribute') {
			writeCatEntryAttrRelSequence(data, outputStreams, lookups);
		} else {
			writeAttributeSequence(data,outputStreams, jsonProperties);
		}
	}else {
		validLocales = jsonProperties.validLocales;
		writeBaseFields(data,outputStreams);
		writeURLKeyword(data,outputStreams);
		writeAttributes(data,outputStreams,lookups);
		if (getLocale(data) === -1)
		{
			writeDefaultAttributeValues(data,outputStreams,lookups);
			writeSalesCatalogPath(data,outputStreams,lookups,jsonProperties);
		}
		writeCTAs(data,outputStreams,lookups);
		writeUtilityBelt(data, outputStreams, lookups);
		writeFeatures(data, outputStreams, lookups);
		if (getLocale(data) === -1)
		{
			writeRelatedProducts(data,outputStreams,lookups);
			writeUpSellProducts(data,outputStreams,lookups);
			writeAccessoriesProducts(data,outputStreams,lookups);
		}
	}
	
	
};

