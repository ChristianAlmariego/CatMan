// setup default properties
var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;

// setup extended properties
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var systemProperties = propertiesReader.getSystemProperties();

// setup cm_modules
var dataHelper = require(cmModulesPath + systemProperties.path().catman.dataHelper);


function getCatalogEntryType(data)
{
	var catalogEntryType = '';
	if (data['Product Type'] === 'Product')
	{
		catalogEntryType = data['Product Type'];
	}
	else if (data['Product Type'] === 'SKU')
	{
		catalogEntryType = 'Item';
	}
	return catalogEntryType;
}

//handle input type for sequencing request
function getCatalogEntryTypeSequence(data)
{
	var catalogEntryType = '';
	if (data['Type'] === 'Product')
	{
		catalogEntryType = data['Type'];
	}
	else if (data['Type'] === 'SKU')
	{
		catalogEntryType = 'Item';
	}
	return catalogEntryType;
}

function writeBaseFields(data,outputStreams) {
	var output = [];
	// outputs an object containing a set of key/value pair representing a line found in the csv file. 
	
	//PartNumber column
	var partnumber = data['PK'];
	output[0] = partnumber;
	
	//Type column
	output[1] = getCatalogEntryType(data);
	
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
		output[1] = getCatalogEntryType(data);;
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

	//URL
	if (data.URL  !== undefined && data.URL.trim() !== '')
	{
		output[0] = partnumber;
		output[1] = getCatalogEntryType(data);
		output[2] = data.URL;
		output[3] = '';

		outputStreams.csvCatEntURLStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}

	//Subscription
	if (data['Subscription']  !== undefined && data['Subscription'].trim() !== '')
	{
		output[0] = partnumber;
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
	if (data['Recurring Order']  !== undefined && data['Recurring Order'].trim() !== '')
	{
		output[0] = partnumber;
		output[1] = getCatalogEntryType(data);
		if ('TRUE' === data['Recurring Order'])
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
	if (data['Display Name']  !== undefined && data['Display Name'].trim() !== '')
	{
		output[0] = partnumber;
		output[1] = getCatalogEntryType(data);
		output[2] = -1;
		output[3] = data['Display Name'];
		output[4] = '';

		outputStreams.csvCatEntDescNameStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}
	
	//LongDescription
	if (data['Long Description']  !== undefined && data['Long Description'].trim() !== '')
	{
		var longDesc = data['Long Description'].replace(/(\r\n|\n|\r)/g,"");
		output[0] = partnumber;
		output[1] = getCatalogEntryType(data);
		output[2] = -1;
		output[3] = longDesc;
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
	
	//Full Image
	if (data['Full Image']  !== undefined && data['Full Image'].trim() !== '')
	{
		output[0] = partnumber;
		output[1] = getCatalogEntryType(data);
		output[2] = -1;
		output[3] = data['Full Image'];
		output[4] = '';

		outputStreams.csvCatEntDescFullImageStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}
	
	//Thumbnail
	if (data['Thumbnail']  !== undefined && data['Thumbnail'].trim() !== '')
	{
		output[0] = partnumber;
		output[1] = getCatalogEntryType(data);
		output[2] = -1;
		output[3] = data['Thumbnail'];
		output[4] = '';

		outputStreams.csvCatEntDescThumbnailImageStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}
	
	
	//Published
	if (data['Display To Customer']  !== undefined && data['Display To Customer'].trim() !== '')
	{
		output[0] = partnumber;
		output[1] = getCatalogEntryType(data);
		output[2] = -1;
		if ('TRUE' === data['Display To Customer'])
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
		output[1] = getCatalogEntryType(data);
		output[2] = -1;
		output[3] = data['Keyword'];
		output[4] = '';

		outputStreams.csvCatEntDescKeywordStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}
	
	//URLKeyword
	if (data['URL Keyword']  !== undefined && data['URL Keyword'].trim() !== '')
	{
		output[0] = partnumber;
		output[1] = getCatalogEntryType(data);
		output[2] = -1;
		var urlkeyword = data['URL Keyword'];
		if (urlkeyword.trim() === '')
		{
			urlkeyword = data.Name.trim().replace(/ /g, '-').toLowerCase() + '-' + data['Primary Key'].replace(/ /g, '-').toLowerCase(); 
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
		output[1] = getCatalogEntryType(data);
		output[2] = -1;
		output[3] = data['Meta Description'];
		output[4] = '';

		outputStreams.csvCatEntSEOMetaDescStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}
	
	//ImageAltText
	if (data['Image alt Text']  !== undefined && data['Image alt Text'].trim() !== '')
	{
		output[0] = partnumber;
		output[1] = getCatalogEntryType(data);
		output[2] = -1;
		output[3] = data['Image alt Text'];
		output[4] = '';

		outputStreams.csvCatEntSEOImgAltDescStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}
}

function writeAttributes(data,outputStreams,lookups) {
	var output = [];
	var partnumber = data['PK'];
	//retrieve all the keys from the header lookup table (ie. column headers)
	var headercols = [];
	var headerlookup = lookups.header['WSV'];
	var attrlookup = lookups.attrval;
	for (var k in headerlookup)
	{
		if (k !== undefined && k !== '')
		{
			headercols.push(k);
		}
	}

	if(lookups.mastercataloglookup[partnumber] !== undefined){ // check if existing or new item
			var now = new Date();	
			var dateCreated = now.getFullYear()+'-'+(now.getMonth()+1)+'-'+now.getDay()+' '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds()+'.'+now.getMilliseconds();
			data = Object.assign({'Date Created':dateCreated} , data);
		}

	//write each header value
	for (var i = 0; i < headercols.length; i++)
	{
		if (data[headercols[i]] !== undefined && data[headercols[i]] !== '')
		{
			var seq = 0.0;
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
				output[2] = -1;			
				
				//Update the Attribute Usage if Defining or Descriptive
				if((headerlookup[headercols[i]].AttrValPrefix).includes("Attribute_Dictionary_Descriptive_Attributes"))
					{
					var attributeUsage = "Descriptive";					
					}
				else{
					var attributeUsage = "Defining";
				}
				//if attribute uses a lookup table, then use that
				if (headerlookup[headercols[i]].LkupType == 'LOOKUP_TABLE'|| headerlookup[headercols[i]].LkupType === 'STRING_ENUMERATION')
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
					
					output[3] = headerlookup[headercols[i]].AttrValPrefix + '_' + output[1].replace(/\W/g, "_") + '_' + 
									partnumber.replace(/\W/g,'_') + '_ValueID' + suffix;
					
					attroutput[0] = attrIdentifier; //Identifier
					attroutput[1] = -1; //LanguageId
					attroutput[2] = output[3]; //ValueIdentifier
					attroutput[3] = 0; //Sequence
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
				output[4] = dataElement; //Value							
				output[5] = attributeUsage;
				output[6] = "0.000" + seq++;
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
function writeSalesCatalogPath(data,outputStreams,lookups) {
	var output = [];
	var partnumber = data['PK'];
	if ((data['Sales Catalog']  !== undefined) && (data['Sales Catalog'].trim() !== '')){
		var dataarray = data['Sales Catalog'].split("|");
		for (var j = 0; j < dataarray.length; j++)
		{
			if (dataarray[j] !== undefined && dataarray[j].trim() !== '')
			{
				output[0] = partnumber; // PartNumber
				output[1] = getCatalogEntryType(data); // Type
				output[2] = dataarray[j].trim(); //ParentGroupIdentifier
				output[3] ='WSV'; //ParentStoreIdentifier
				output[4] = ''; //Sequence output[3] = j;
				output[5] = ''; //Delete
				
				outputStreams.csvCatEntParentCatGrpRelStream.write(output);
			}
	
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

function writeAttributeSequence(data, outputStreams){
	output = [];	
	output[0] = data['Child ID'];
	output[1] = getCatalogEntryTypeSequence(data);
	output[2] = data['Parent ID'];
	output[3] = data['Store'];
	output[4] = data['Sequence'];
	output[5] = (data['Delete'] !== undefined && data['Delete'].toLowerCase() == 'yes') ? '1'  : '0';

    outputStreams.csvCatEntParentCatGrpRelStreamSeq.write(output);

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

exports.write = function(data,outputStreams,lookups,jsonProperties,rRequest) {
	var output;

	// preprocess data from the users
	data = dataHelper.removeDataElementsUnacceptableCharacters(data);

	if (rRequest === 'CatalogEntryComponent') {
		writeComponentAssociations(data,outputStreams);
	}else if (rRequest === 'CatalogEntryParentCatalogGroupRelationship') {
		if (data['Type'] === 'SKU List') {
			writeSkuAttributeSequence(data,outputStreams);
		} else {
			writeAttributeSequence(data,outputStreams);
		}
	} else {
		writeBaseFields(data,outputStreams);
		writeAttributes(data,outputStreams,lookups);
		writeSalesCatalogPath(data,outputStreams,lookups);
	}
};

