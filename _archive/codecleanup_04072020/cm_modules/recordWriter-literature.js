// load dataHelper
var dataHelper = require("../cm_modules/dataHelper");

function writeBaseFields(data,outputStreams) {
	var output = [];
	// outputs an object containing a set of key/value pair representing a line found in the csv file. 
	
	//PartNumber column
	var partnumber = data['Document'];
	output[0] = partnumber;
	
	//Type column
	output[1] = 'Item';
	
	//ParentGroupIdentifier
	output[2] = data['Master Catalog'];
	
	//Delete (empty)
	output[3] = '';
	
	outputStreams.csvCatEntStream.write(output);

	//reset output array for next file
	output.splice(0);

	//Name
	if (data['US Name']  !== undefined && data['US Name'].trim() !== '')
	{
		output[0] = partnumber;
		output[1] = 'Item';
		output[2] = -1;
		output[3] = data['US Name'];
		output[4] = '';

		outputStreams.csvCatEntDescNameStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}
	
	//Published
	//For Entitled Literature, assume all documents(items) are published
	output[0] = partnumber;
	output[1] = 'Item';
	output[2] = -1;
	output[3] = '1';
	output[4] = '';

	outputStreams.csvCatEntDescPublishedStream.write(output);
	
	//reset output array for next file
	output.splice(0);
	
	
}

function writeAttributes(data,outputStreams,lookups) {
	var output = [];
	var partnumber = data['Document'];
	//retrieve all the keys from the header lookup table (ie. column headers)
	var headercols = [];
	var headerlookup = lookups.header;
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
				if (headerlookup[headercols[i]].LkupType === 'LOOKUP_TABLE')
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
				output[5] = 'Descriptive';
				output[6] = seq++;
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
	headercols.splice(0);
}

//Sales Catalog(s) Path
function writeSalesCatalogPath(data,outputStreams,lookups, jsonProperties) {
	var output = [];
	var partnumber = data['Document'];
	if ((data['Sales Catalog']  !== undefined) && (data['Sales Catalog'].trim() !== '')){
		var dataarray = data['Sales Catalog'].split("|");
		for (var j = 0; j < dataarray.length; j++)
		{
			if (dataarray[j] !== undefined && dataarray[j].trim() !== '')
			{
				output[0] = partnumber; // PartNumber
				output[1] = dataarray[j].trim(); //ParentGroupIdentifier
				output[2] = jsonProperties.wcStoreIdentifier; //ParentStoreIdentifier
				output[3] = ''; //Sequence output[3] = j;
				output[4] = ''; //Delete
				
				outputStreams.csvCatEntParentCatGrpRelStream.write(output);
			}
	
			//reset output array for next row
			output.splice(0);
		}
	}
}



exports.write = function(data,outputStreams,lookups, jsonProperties) {
	var output;

	// preprocess data from the users
	data = dataHelper.removeDataElementsUnacceptableCharacters(data);

	writeBaseFields(data,outputStreams);
	writeAttributes(data,outputStreams,lookups);
	writeSalesCatalogPath(data,outputStreams,lookups,jsonProperties);
	


};

