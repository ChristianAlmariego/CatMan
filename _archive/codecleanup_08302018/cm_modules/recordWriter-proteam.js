// load dataHelper
var dataHelper = require("../cm_modules/dataHelper");

function getPartnumber(data)
{
	var partnumber = '';
	//console.log('datatype=' + data['Type Product and SKU'] === 'Product');
	//PartNumber column
	
		partnumber = data['Item PK'];
	
	
	return partnumber;
}

function getCatalogEntryType(data)
{
	var catalogEntryType = '';
	if (data['Type Product and SKU'] === 'Product')
	{
		catalogEntryType = data['Type Product and SKU'];
	}
	else if (data['Type Product and SKU'] === 'SKU')
	{
		catalogEntryType = 'Item';
	}
		else if (data['Type Product and SKU'] === 'Bundle')
	{
		catalogEntryType = 'Bundle';
	}
	return catalogEntryType;
}

function writeAttributeSequence(data, outputStreams){
	var output = [];	
	output[0] = data['Code'];
    output[1] = data['Sales Category Identifier'];
	output[2] = data['Store'];
	output[3] = data['Sequence'];
	output[4] = (data['Delete'] !== undefined && data['Delete'].toLowerCase() == 'yes') ? '1'  : '0';

   outputStreams.csvCatEntParentCatGrpRelStreamSeq.write(output);

	//reset output array for next file
	output.splice(0);
}


function writeBaseFields(data,outputStreams) {
	var output = [];
	// outputs an object containing a set of key/value pair representing a line found in the csv file. 
	
	//PartNumber column
	var partnumber = getPartnumber(data);
	output[0] = partnumber;
	
	//Type column
	//output[1] = data['Type Product and SKU'];
	output[1] = getCatalogEntryType(data);
	
	//ParentPartNumber column
	if (data['Parent ID'] !== undefined)
	{
		output[2] = data['Parent ID'];
	}
	else
	{
		output[2] = '';
	}
	
	//Manufacturer
	output[3] = data.Manufacturer;
	
	//ManufacturerPartNumber
	output[4] = data['Manufacturer Part Number'];
	
	//Sequence column (empty)
	output[5] = '';
	
	//ParentGroupIdentifier
	output[6] = data['Master Catalog'];
	
	//Delete (empty)
	output[7] = '';
	
	outputStreams.csvCatEntStream.write(output);

	//reset output array for next file
	output.splice(0);

	//On Special
	if (data['On Special']  !== undefined && data['On Special'].trim() !== '')
	{
		output[0] = partnumber;
		//output[1] = data['Catalog Entry Type'];
		output[1] = getCatalogEntryType(data);
		
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
		//output[1] = data['Catalog Entry Type'];
		output[1] = getCatalogEntryType(data);
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
	/*
	//Price
	if (data.Price  !== undefined && data.Price.trim() !== '')
	{
		output[0] = partnumber;
		output[1] = data['Catalog Entry Type'];
		output[2] = 'USD';
		output[3] = data.Price;
		output[4] = data.Price;
		output[5] = '';

		outputStreams.csvCatEntPriceStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}
	*/

	//URL
	if (data.URL  !== undefined && data.URL.trim() !== '')
	{
		output[0] = partnumber;
		//output[1] = data['Catalog Entry Type']
		output[1] = getCatalogEntryType(data);
		output[2] = data.URL;
		output[3] = '';

		outputStreams.csvCatEntURLStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}

	//Subscription item
	if (data['Subscription']  !== undefined && data['Subscription'].trim() !== '')
	{
		output[0] = partnumber;
		//output[1] = data['Catalog Entry Type'];
		output[1] = getCatalogEntryType(data);
		if ('TRUE' === data['Subscription'])
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
	if (data['Recurring order']  !== undefined && data['Recurring order'].trim() !== '')
	{
		output[0] = partnumber;
		//output[1] = data['Catalog Entry Type'];
		output[1] = getCatalogEntryType(data);
		if ('TRUE' === data['Recurring order'])
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

	//Name
	if (data['US Name']  !== undefined && data['US Name'].trim() !== '')
	{
		output[0] = partnumber;
		//output[1] = data['Catalog Entry Type'];
		output[1] = getCatalogEntryType(data);
		output[2] = -1;
		output[3] = data['US Name'];
		output[4] = '';

		outputStreams.csvCatEntDescNameStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}
	
	//LongDescription
	if (data['Long Description']  !== undefined && data['Long Description'].trim() !== '')
	{
		output[0] = partnumber;
		//output[1] = data['Catalog Entry Type'];
		output[1] = getCatalogEntryType(data);
		output[2] = -1;
		output[3] = data['Long Description'];
		output[4] = '';

		outputStreams.csvCatEntDescLongDescStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}
	
	//ShortDescription
	if (data['Short Description']  !== undefined && data['Short Description'].trim() !== '')
	{
		output[0] = partnumber;
		output[1] = getCatalogEntryType(data);
		output[2] = -1;
		output[3] = data['Short Description'];
		output[4] = '';

		outputStreams.csvCatEntDescShortDescStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}

	// FullImage
	if (data['Full Image']  !== undefined && data['Full Image'].trim() !== '')
	{
		output[0] = partnumber;
		//output[1] = data['Catalog Entry Type'];
		output[1] = getCatalogEntryType(data);
		output[2] = -1;
		output[3] = data['Full Image'];
		output[4] = '';

		outputStreams.csvCatEntDescFullImageStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}
	
	// Thumbnail
	if (data['Thumbnail']  !== undefined && data['Thumbnail'].trim() !== '')
	{
		output[0] = partnumber;
		//output[1] = data['Catalog Entry Type'];
		output[1] = getCatalogEntryType(data);
		output[2] = -1;
		output[3] = data['Thumbnail'];
		output[4] = '';

		outputStreams.csvCatEntDescThumbnailStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}
	
	//Published
	if (data['Display to Customer']  !== undefined && data['Display to Customer'].trim() !== '')
	{
		output[0] = partnumber;
		//output[1] = data['Catalog Entry Type'];
		output[1] = getCatalogEntryType(data);
		output[2] = -1;
		if ('TRUE' === data['Display to Customer'])
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
	if (data['Keyword']  !== undefined && data['Keyword'].trim() !== '')
	{
		output[0] = partnumber;
		//output[1] = data['Catalog Entry Type'];
		output[1] = getCatalogEntryType(data);
		output[2] = -1;
		output[3] = data['Keyword'];
		output[4] = '';

		outputStreams.csvCatEntDescKeywordStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}
	
	//URLKeyword
	if (data['URL Keyword']  !== undefined)
	{
		output[0] = partnumber;
		//output[1] = data['Catalog Entry Type'];
		output[1] = getCatalogEntryType(data);
		output[2] = -1;
		var urlkeyword = data['URL Keyword'];
		if (urlkeyword.trim() === '')
		{
			urlkeyword = data.Manufacturer.trim().replace(/ /g, '-').toLowerCase() + '-' + data['Manufacturer Part Number'].replace(/ /g, '-').toLowerCase(); 
		}
		output[3] = urlkeyword;
		output[4] = '';

		outputStreams.csvCatEntSEOUrlKeywordStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}
	
	//PageTitle
	if (data['Page Title']  !== undefined && data['Page Title'].trim() !== '')
	{
		output[0] = partnumber;
		//output[1] = data['Catalog Entry Type'];
		output[1] = getCatalogEntryType(data);
		output[2] = -1;
		output[3] = data['Page Title'];
		output[4] = '';

		outputStreams.csvCatEntSEOPageTitleStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}
	
	//MetaDescription
	if (data['Meta Description']  !== undefined && data['Meta Description'].trim() !== '')
	{
		output[0] = partnumber;
		//output[1] = data['Catalog Entry Type'];
		output[1] = getCatalogEntryType(data);
		output[2] = -1;
		output[3] = data['Meta Description'];
		output[4] = '';

		outputStreams.csvCatEntSEOMetaDescStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}
	
}

function writeAttributes(data,outputStreams,lookups) {
	var output = [];
	var partnumber = getPartnumber(data);
	//retrieve all the keys from the header lookup table (ie. column headers)
	var headercols = [];
	var headerlookup = lookups.header['ProTeam'];
	var attrvallookup = lookups.attrval;
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
				
				// TODO: move this vaidation to validation module
				if (dataarray.length > headerlookup[headercols[i]].MultiValue) {
					//number of values for the multi-value attribute is greater than the max allowed.
					console.log('Input file contains ' + dataarray.length + ' for the ' + headercols[i] + ' attrubyte where as the max number of values allowed is ' + headerlookup[headercols[i]].MultiValue);
					// TODO: report error
				}

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
				output[2] = -1;
				
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

				
				//if attribute uses a lookup table, then use that
				if (headerlookup[headercols[i]].LkupType === 'LOOKUP_TABLE' || headerlookup[headercols[i]].LkupType === 'STRING_ENUMERATION')
				{
					output[3] = 'Lookup_Value_Identifier';
					if (attrvallookup[attrIdentifier] !== undefined &&
							attrvallookup[attrIdentifier][dataElement] !== undefined)
					{
						output[3] = attrvallookup[attrIdentifier][dataElement].ValueIdentifier;
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
					attroutput[1] = -1; //LanguageId
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
				output[5] = attributeUsage;
				output[6] = seq++;
				output[7] = 'EmersonCAS';
				output[8] = '';
				output[9] = '';
				output[10] = '';
				output[11] = '';
				if (headerlookup[headercols[i]].MultiValue !== undefined && headerlookup[headercols[i]].MultiValue > 1) {
					outputStreams.csvCatEntAttrDictAttrRelStream.write(output);
				} else {
					outputStreams.csvCatEntAttrDictAttrRelSingleStream.write(output);
				}

				//reset output array for next row
				output.splice(0);
			}
			dataarray.splice(0);
		}

	}
	headercols.splice(0);
}

//Sales Catalog(s) Path
function writeSalesCatalogPath(data,outputStreams,lookups, jsonProperties) {
	var output = [];
	var partnumber = getPartnumber(data);
	if ((data['Sales Catalog']  !== undefined) && (data['Sales Catalog'].trim() !== '')){
		var dataarray = data['Sales Catalog'].split("|");
		for (var j = 0; j < dataarray.length; j++)
		{
			if (dataarray[j] !== undefined && dataarray[j].trim() !== '')
			{
				output[0] = partnumber; // PartNumber
				output[1] = dataarray[j].trim(); //ParentGroupIdentifier
				output[2] = 'ProTeam'; //ParentStoreIdentifier
				output[3] = ''; //Sequence output[3] = j;
				output[4] = ''; //Delete
				
				outputStreams.csvCatEntParentCatGrpRelStream.write(output);
			}
	
			//reset output array for next row
			output.splice(0);
		}
	}
}

//CTA
function writeCTAs(data,outputStreams,lookups) {
	var ctalookup = lookups.ctalookup;
	var output = [];
	var partnumber = getPartnumber(data);
	for (var i = 1; i < 5; i++) {
		if (data['CallToAction ' + i + ' Name']  !== undefined && data['CallToAction ' + i + ' Name']  !== '' && 
			data['CallToAction ' + i + ' URL']  !== undefined && data['CallToAction ' + i + ' URL']  !== '')
		{
			var attrName = ctalookup[data['CallToAction ' + i + ' Name']];
			output[0] = partnumber; // PartNumber
			output[1] = attrName;
			output[2] = -1;
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
			outputStreams.csvCatEntAttrDictAttrRelStream.write(output);

			//reset output array for next row
			output.splice(0);
		}
	}
}

//Load Utility Belt
function writeUtilityBelt(data,outputStreams,lookups) {
	var utilitybeltlookup = lookups.utilitybeltlookup;
	var output = [];
	var partnumber = getPartnumber(data);
	for (var i = 1; i < 4; i++) {
		if (data['Utility Belt ' + i + ' Tag']  !== undefined && data['Utility Belt ' + i + ' Tag']  !== '' && 
			data['Utility Belt ' + i + ' URL']  !== undefined && data['Utility Belt ' + i + ' URL']  !== '')
		{
			var attrName = utilitybeltlookup[data['Utility Belt ' + i + ' Tag']];
			output[0] = partnumber; // PartNumber
			output[1] = attrName;
			output[2] = -1;
			output[3] = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes' + '_' + output[1].replace(/\W/g,'_') + '_' + 
						partnumber.replace(/\W/g,'_') + '_ValueID_0';
			output[4] = data['Utility Belt ' + i + ' Text'].trim();
			output[5] = 'Descriptive';
			output[6] = 0;
			output[7] = 'EmersonCAS';
			output[8] = '';
			output[9] = '';
			output[10] = '';
			output[11] = '';
			outputStreams.csvCatEntAttrDictAttrRelStream.write(output);

			output[3] = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes' + '_' + output[1].replace(/\W/g,'_') + '_' + 
						partnumber.replace(/\W/g,'_') + '_ValueID_1';
			output[4] = data['Utility Belt ' + i + ' URL'].trim();
			output[6] = 1;
			outputStreams.csvCatEntAttrDictAttrRelStream.write(output);

			output[3] = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes' + '_' + output[1].replace(/\W/g,'_') + '_' + 
						partnumber.replace(/\W/g,'_') + '_ValueID_2';
			output[4] = data['Utility Belt ' + i + ' Tag'].trim();
			output[6] = 2;
			outputStreams.csvCatEntAttrDictAttrRelStream.write(output);

			//reset output array for next row
			output.splice(0);
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
	var partnumber = getPartnumber(data);
	var attrval = '';
	var attrvalID = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes_EMR_Features_' + 
					partnumber.replace(/\W/g,'_') + '_ValueID_';
	for (var i = 1; i < 13; i++) {
		if (data["Feature " + i]  !== undefined && data["Feature " + i].trim() !== '')
		{
			//item.setCtgItemAttrib(specName + "/en_US#" + (i - 1), catentryRow[header.keyForValue("Feature " + i)]);
			output[0] = partnumber; // PartNumber
			output[1] = 'EMR Features';
			output[2] = '-1';
			output[3] = attrvalID + String(i - 1);
			attrval = data['Feature ' + i];
			output[4] = attrval;
			output[5] = 'Descriptive';
			output[6] = i - 1;
			output[7] = 'EmersonCAS';
			output[8] = '';
			output[9] = '';
			output[10] = '';
			output[11] = '';
			outputStreams.csvCatEntAttrDictAttrRelStream.write(output);
	
			//reset output array for next row
			output.splice(0);
		}
	}
}

//Load Related Products (cross-sell relationships between Products)
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
	}

	return componentType;
}

function writeComponentAssociations(data,outputStreams) {
	var output = [];
	var componentTypeMap = getComponentTypeMapping(data);

	//['PartNumber','Type','ChildPartNumber','ChildStoreIdentifier','Sequence','Delete']
	output[0] = data['Component Code']; // Parent Part Number
	output[1] = componentTypeMap;
	output[2] = data['Child Code'];
	output[3] = 'EmersonCAS';
	output[4] = data['Sequence'];
	output[6] = '1'; //Quantity
	
	if (data['Delete'] !== undefined && data['Delete'].toLowerCase() == 'yes') {
		output[8] = '1';
	} else {
		output[8] = '';
	}
	
	if (componentTypeMap === 'PARTS_LIST') {
		output[5] = 'NONE';
		output[7] = data['Display Sequence']; //Display Sequence for Parts List, Field1
		outputStreams.csvCatEntryComponentPartsListStream.write(output);
	} else {
		output[3] = ''; //null store for component association
		output[5] = '';
		output[7] = '';
		outputStreams.csvCatEntryComponentStream.write(output);
	}
	
	//reset output array for next file
	output.splice(0);
}



exports.write = function(data,outputStreams,lookups,jsonProperties,rRequest) {
	var output;

	// preprocess data from the users
	data = dataHelper.removeDataElementsUnacceptableCharacters(data);

	if (rRequest === "CatalogEntryComponent") {
		writeComponentAssociations(data,outputStreams);
	}else if (rRequest === "CatalogEntryParentCatalogGroupRelationship") {
		writeAttributeSequence(data,outputStreams);
	}
	else {
		writeBaseFields(data,outputStreams);
		writeAttributes(data,outputStreams,lookups);
		writeSalesCatalogPath(data,outputStreams,lookups,jsonProperties);
	}
	//writeCTAs(data,outputStreams,lookups);
	//writeUtilityBelt(data, outputStreams, lookups);
	//writeFeatures(data, outputStreams, lookups);
	//writeRelatedProducts(data,outputStreams,lookups);
};

