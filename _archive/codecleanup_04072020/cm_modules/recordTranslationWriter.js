var validLocales;// = {fr_FR:-2,de_DE:-3,it_IT:-4,es_ES:-5,pt_BR:-6,zh_CN:-7,zh_TW:-8,ko_KR:-9,ja_JP:-10,ru_RU:-20,pl_PL:-22,en_CN:-1000,en_GB:-1001,en_SG:-1002};

function getPartnumber(data)
{
	var partnumber = '';
	//PartNumber column
	if (data['Catalog Entry Type'] === 'Product')
	{
		partnumber = data.Manufacturer.trim() + '-P-' + data['Manufacturer part number'].trim();
	}
	else {
		partnumber = data.Manufacturer.trim() + '-' + data['Manufacturer part number'].trim();
	}
	return partnumber;
}

function getLocale(data)
{
	var locale = data.Locale;
	//TODO move to validator
	if (locale in validLocales)
	{
		return validLocales[locale];
	}
	else
	{
		return -1;
	}
}

function writeBaseFields(data,outputStreams) {
	var output = [];
	// outputs an object containing a set of key/value pair representing a line found in the csv file. 
	
	var partnumber = getPartnumber(data);

	//Name
	if (data['US Name']  !== undefined && data['US Name'].trim() !== '')
	{
		output[0] = partnumber;
		output[1] = getLocale(data);
		output[2] = data['US Name'];
		output[3] = '';

		outputStreams.csvCatEntDescNameStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}
	
	//LongDescription
	if (data['Long Description']  !== undefined && data['Long Description'].trim() !== '')
	{
		output[0] = partnumber;
		output[1] = getLocale(data);
		output[2] = data['Long Description'].trim();
		output[3] = '';

		outputStreams.csvCatEntDescLongDescStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}
	
	//Published
	if (data['Display to customers US']  !== undefined && data['Display to customers US'].trim() !== '')
	{
		output[0] = partnumber;
		output[1] = getLocale(data);
		if ('TRUE' === data['Display to customers US'])
		{
			output[2] = '1';
		}
		else
		{
			output[2] = '0';
		}
		output[3] = '';

		outputStreams.csvCatEntDescPublishedStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}
	
	//Keyword
	if (data['Keyword US']  !== undefined && data['Keyword US'].trim() !== '')
	{
		output[0] = partnumber;
		output[1] = getLocale(data);
		output[2] = data['Keyword US'].trim();
		output[3] = '';

		outputStreams.csvCatEntDescKeywordStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}
	
	//URLKeyword
	if (data['URL Keyword US']  !== undefined)
	{
		output[0] = partnumber;
		output[1] = getLocale(data);
		var urlkeyword = data['URL Keyword US'];
		if (urlkeyword.trim() === '')
		{
			urlkeyword = data.Manufacturer.trim().replace(' ', '-').toLowerCase() + '-' + data['Manufacturer part number'].replace(' ', '-').toLowerCase(); 
		}
		output[2] = urlkeyword + '-' + data.Locale.replace('_', '-').toLowerCase();
		output[3] = '';

		outputStreams.csvCatEntSEOUrlKeywordStream.write(output);
		
		//reset output array for next file
		output.splice(0);
	}
	
	//PageTitle
	if (data['Page title US']  !== undefined && data['Page title US'].trim() !== '')
	{
		output[0] = partnumber;
		output[1] = data['Page title US'].trim();
		output[2] = '';

		outputStreams['csvCatEntSEOPageTitleStream' + data.Locale].write(output);
		
		//reset output array for next file
		output.splice(0);
	}
	
	//MetaDescription
	if (data['Meta description US']  !== undefined && data['Meta description US'].trim() !== '')
	{
		output[0] = partnumber;
		output[1] = data['Meta description US'].trim();
		output[2] = '';

		outputStreams['csvCatEntSEOMetaDescStream' + data.Locale].write(output);
		
		//reset output array for next file
		output.splice(0);
	}
}

function writeAttributes(data,outputStreams,lookups) {
	var output = [];
	var partnumber = getPartnumber(data);
	//retrieve all the keys from the header lookup table (ie. column headers)
	var headercols = [];
	var headerlookup = lookups.header['EMR'];
	var attrlookup = lookups.attrval;
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
			for (var j = 0; j < dataarray.length; j++)
			{
				var attrIdentifier = headerlookup[headercols[i]].Identifier;
				output[0] = partnumber;
				output[1] = attrIdentifier;
				output[2] = getLocale(data);
				
				//if attribute uses a lookup table, then use that
				if (headerlookup[headercols[i]].LkupType === 'LOOKUP_TABLE')
				{
					output[3] = 'Lookup_Value_Identifier';
					if (attrlookup[attrIdentifier] !== undefined &&
						attrlookup[attrIdentifier][dataarray[j].trim()] !== undefined)
					{
						output[3] = attrlookup[attrIdentifier][dataarray[j].trim()].ValueIdentifier;
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
					attroutput[1] = getLocale(data); //LanguageId
					attroutput[2] = output[3]; //ValueIdentifier
					attroutput[3] = ''; //Sequence
					attroutput[4] = dataarray[j].trim(); //Value
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
				output[4] = dataarray[j].trim();
				output[5] = 'Descriptive';
				output[6] = seq++;
				output[7] = 'EmersonCAS';
				output[8] = '';
				output[9] = '';
				output[10] = '';
				output[11] = '';
				//outputStreams.csvCatEntAttrDictAttrRelStream.write(output);

				//reset output array for next row
				output.splice(0);
			}
			dataarray.splice(0);
		}

	}
	headercols.splice(0);
}

//CTA
function writeCTAs(data,outputStreams,lookups) {
	var ctalookup = lookups.ctalookup;
	var output = [];
	var partnumber = getPartnumber(data);
	var seq = 0;
	for (var i = 1; i < 5; i++) {
		if (data['CallToAction ' + i + ' Name']  !== undefined && data['CallToAction ' + i + ' Name']  !== '' && 
			data['CallToAction ' + i + ' URL']  !== undefined && data['CallToAction ' + i + ' URL']  !== '' &&
			ctalookup[data['CallToAction ' + i + ' Name']] !== undefined && ctalookup[data['CallToAction ' + i + ' Name']] !== '')
		{
			var attrName = ctalookup[data['CallToAction ' + i + ' Name']];
			output[0] = partnumber; // PartNumber
			output[1] = attrName;
			output[2] = getLocale(data);
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
			//outputStreams.csvCatEntAttrDictAttrRelStream.write(output);

			//this is not in a lookup table so the value needs to be in the catalog entry specific allowed values
			var attroutput = [];
			attroutput[0] = attrName; //Identifier
			attroutput[1] = getLocale(data); //LanguageId
			attroutput[2] = output[3]; //ValueIdentifier
			attroutput[3] = ''; //Sequence
			attroutput[4] = output[4]; //Value
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
			if (attrName === undefined || attrName.trim() === '')
			{
				console.log("Utility Belt Tag: " + data['Utility Belt ' + i + ' Tag'] + " is invalid for PartNumber: " + partnumber);
				continue;
			}
			output[0] = partnumber; // PartNumber
			output[1] = attrName;
			output[2] = getLocale(data);
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
			//outputStreams.csvCatEntAttrDictAttrRelStream.write(output);

			//this is not in a lookup table so the value needs to be in the catalog entry specific allowed values
			var attroutput = [];
			attroutput[0] = attrName; //Identifier
			attroutput[1] = getLocale(data); //LanguageId
			attroutput[2] = output[3]; //ValueIdentifier
			attroutput[3] = ''; //Sequence
			attroutput[4] = output[4]; //Value
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

			output[3] = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes' + '_' + output[1].replace(/\W/g,'_') + '_' + 
						partnumber.replace(/\W/g,'_') + '_ValueID_1';
			output[4] = data['Utility Belt ' + i + ' URL'].trim();
			output[6] = 1;
			//outputStreams.csvCatEntAttrDictAttrRelStream.write(output);

			attroutput[2] = output[3]; //ValueIdentifier
			attroutput[4] = output[4]; //Value
			outputStreams.csvAttrDictAttrAllowValsStream.write(attroutput);

			output[3] = 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes' + '_' + output[1].replace(/\W/g,'_') + '_' + 
						partnumber.replace(/\W/g,'_') + '_ValueID_2';
			output[4] = data['Utility Belt ' + i + ' Tag'].trim();
			output[6] = 2;
			//outputStreams.csvCatEntAttrDictAttrRelStream.write(output);

			attroutput[2] = output[3]; //ValueIdentifier
			attroutput[4] = output[4]; //Value
			outputStreams.csvAttrDictAttrAllowValsStream.write(attroutput);

			//reset output array for next row
			attroutput.splice(0);

			//reset output array for next row
			output.splice(0);
		}
	}
}

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
			output[2] = getLocale(data);
			output[3] = attrvalID + String(i - 1);
			attrval = data['Feature ' + i].trim();
			output[4] = attrval;
			output[5] = 'Descriptive';
			output[6] = i - 1;
			output[7] = 'EmersonCAS';
			output[8] = '';
			output[9] = '';
			output[10] = '';
			output[11] = '';
			//outputStreams.csvCatEntAttrDictAttrRelStream.write(output);
	
			//this is not in a lookup table so the value needs to be in the catalog entry specific allowed values
			var attroutput = [];
			attroutput[0] = 'EMR Features'; //Identifier
			attroutput[1] = getLocale(data); //LanguageId
			attroutput[2] = output[3]; //ValueIdentifier
			attroutput[3] = ''; //Sequence
			attroutput[4] = output[4]; //Value
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
			output.splice(0);
		}
	}
}

exports.write = function(data,outputStreams,lookups,validLocalesParam) {
	var output;
	validLocales = validLocalesParam;
	writeBaseFields(data,outputStreams);
	writeCTAs(data,outputStreams,lookups);
	writeUtilityBelt(data, outputStreams, lookups);
	writeFeatures(data, outputStreams, lookups);
	writeAttributes(data, outputStreams, lookups);
};

