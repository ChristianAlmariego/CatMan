
//Category Group
function writeCategoryGroup(data,outputStreams,paramStoreID) {
	var output = [];

	if ('TRUE' !== data['Master Catalog'])
	{
		if (data['Identifier']  !== undefined && data['Identifier'].trim() !== '')
		{
			output[0] = data['Identifier']; // GroupIdentifier
			if (salesCatalogToNull(data['Parent Identifier']) == '') {
				output[1] = 'true';
			}
			else {
				output[1] = 'false';
			}
			output[2] = salesCatalogToNull(data['Parent Identifier']); // ParentGroupIdentifier
			output[3] = data['Name US']; //Name US
			output[4] = ''; //Delete

			outputStreams.csvCatGrpStream.write(output);

			//reset output array for next row
			output.splice(0);
		}
	}
	else //'TRUE' === data['Master Catalog']
	{
		if (data['Identifier']  !== undefined && data['Identifier'].trim() !== '')
		{
			output[0] = data['Identifier']; // GroupIdentifier
			if (salesCatalogToNull(data['Parent Identifier']) == '') {
				output[1] = 'true';
			}
			else {
				output[1] = 'false';
			}
			output[2] = salesCatalogToNull(data['Parent Identifier']); // ParentGroupIdentifier
			output[3] = data['Name US']; //Name US
			output[4] = ''; //Delete

			outputStreams.csvCatGrpMasterStream.write(output);

			//reset output array for next row
			output.splice(0);
		}
	}
}

function writeCategoryGroupName(data,outputStreams) {
	var output = [];

	//Name
	if (data['Name US']  !== undefined && data['Name US'].trim() !== '')
	{
		output[0] = data['Identifier']; // GroupIdentifier
		output[1] = -1;
		output[2] = data['Name US'];
		output[3] = '';

		outputStreams.csvCatGrpNameStream.write(output);

		//reset output array for next file
		output.splice(0);
	}
}

function writeCategoryGroupUrlKeyword(data,outputStreams) {
	var output = [];

	//SEOURLKeyword
	if (data['URL keyword']  !== undefined && data['URL keyword'].trim() !== '')
	{
		output[0] = data['Identifier']; // GroupIdentifier
		output[1] = -1;
		output[2] = data['URL keyword'];
		output[3] = data['Name US'];
		output[4] = '';

		outputStreams.csvCatGrpSEOUrlKeywordStream.write(output);

		//reset output array for next file
		output.splice(0);
	}
}

function writeCategoryGroupPageTitle(data,outputStreams) {
	var output = [];

	//SEOPageTitle
	if (data['Page title']  !== undefined && data['Page title'].trim() !== '')
	{
		output[0] = data['Identifier']; // GroupIdentifier
		output[1] = -1;
		output[2] = data['Page title'].trim();
		output[3] = data['Name US'];
		output[4] = '';

		outputStreams.csvCatGrpSEOPageTitleStream.write(output);

		//reset output array for next file
		output.splice(0);
	}
}

function writeCategoryGroupMetaDesc(data,outputStreams) {
	var output = [];

	//SEOMetaDescription
	if (data['Meta description']  !== undefined && data['Meta description'].trim() !== '')
	{
		output[0] = data['Identifier']; // GroupIdentifier
		output[1] = -1;
		output[2] = data['Meta description'].trim();
		output[3] = data['Name US'];
		output[4] = '';

		outputStreams.csvCatGrpSEOMetaDescStream.write(output);

		//reset output array for next file
		output.splice(0);
	}
}


function writeCategoryGroupShortDesc(data,outputStreams) {
	var output = [];

	//SEOMetaDescription
	if (data['Meta description']  !== undefined && data['Short Description'].trim() !== '')
	{
		output[0] = data['Identifier']; // GroupIdentifier
		output[1] = -1;
		output[2] = data['Short Description'].trim();
		output[3] = data['Name US'];
		output[4] = '';

		outputStreams.csvCatGrpShortDescStream.write(output);

		//reset output array for next file
		output.splice(0);
	}
}


function writeCategoryGroupPublished(data,outputStreams) {
	var output = [];

	//Published
	if (data['Published']  !== undefined && data['Published'].trim() !== '') {
		output[0] = data['Identifier'];
		output[1] = -1;
		//Indicates whether this catalog group should be displayed for the language indicated by LANGUAGE_ID: 0=no, 1=yes.
		var isPublished = data['Published'].trim();
		if ('TRUE' === isPublished) {
			output[2] = '1';
		} else {
			output[2] = '0';
		}

		output[3] = data['Name US'];
		output[4] = '';

		outputStreams.csvCatGrpPublishedStream.write(output);
		//reset output array for next file
		output.splice(0);
	}
}



//CategoryGroupFacetOrderedList
function writeCategoryGroupFacetOrderedList(data,outputStreams,paramStoreID,lookups,storeName) {
	if (storeName !== 'master') {
		var ootbfacetlookup = lookups.ootbfacetlookup;
		var hiddenAttributes = lookups.facetableAttributes.slice(0);
		var output = [];
		var catidentifier = data['Identifier'];

		//Part 1:
		//write the facets which need to be set to be displayed(DISPLAYABLE=1)
		if ((data['Facet Management'].trim() !== undefined) && (data['Facet Management']  !== '')){
			var dataarray = data['Facet Management'].split("|");

			var sequenceIndex = 0;
			for (var j = 0; j < dataarray.length; j++)
			{
				if (dataarray[j] !== undefined && dataarray[j].trim() !== '')
				{
					var facetidentifier = dataarray[j].trim();

					//re-assign OOB Name for Manufacturer to Brand
					if (facetidentifier === "Manufacturer") {
						facetidentifier = "Brand";
					}

					var isOOBFacet = false;
					if (ootbfacetlookup[facetidentifier] !== undefined && ootbfacetlookup[facetidentifier] !== '') {
						isOOBFacet = true;
					}


					if (isOOBFacet === false) {
						var isExists = hiddenAttributes.indexOf(facetidentifier);
						if (isExists === -1) {
							continue;
						}
					}

					output[0] = facetidentifier; //Facet IDENTIFIER
					output[1] = sequenceIndex; //ssequenceIndex; //Sequence
					output[2] = catidentifier; // CATGROUP_IDENTIFIER
					output[3] = paramStoreID; // STORE Identifier
					output[4] = 1; //DISPLAYABLE
					output[5] = ''; //Delete
					sequenceIndex++;

					if (isOOBFacet === false) {

						outputStreams.csvCatGrpFacetListStream.write(output);
					}
					else {
						outputStreams.csvCatGrpFacetOOBListStream.write(output);
					}


					//remove displayable facet from the list of facets to hide
					var facetIndex = hiddenAttributes.indexOf(facetidentifier);
					if (facetIndex !== -1 ) {
						//console.log('removing ' + facetidentifier);
						hiddenAttributes.splice(facetIndex,1);
					}

				}

				//reset output array for next row
				output.splice(0);
			}
		}

		//Part 2:
		//write the facets which need to be hidden(displayable=0)
		for (var k =0; k < hiddenAttributes.length; k++) {
			//for each attribute, set displayable=0
			var facetidentifier = hiddenAttributes[k].trim();
			output[0] = facetidentifier; //Facet IDENTIFIER
			output[1] = 0; //Sequence
			output[2] = catidentifier; // CATGROUP_IDENTIFIER
			output[3] = paramStoreID; // STORE Identifier
			output[4] = 0; //DISPLAYABLE
			output[5] = ''; //Delete

			outputStreams.csvCatGrpFacetListStream.write(output);
		}

		output.splice(0);
	}
}

function salesCatalogToNull(parentID) {

	switch (parentID) {
	case "EMR_SALES_CATALOG":
		return '';
		break;
	case "FAN_SALES_CATALOG":
		return '';
		break;
	case "WSV_SALES_CATALOG":
		return '';
		break;
	case "PROTEAM_SALES_CATALOG":
		return '';
		break;
	case "PROTEAM_LITERATURE_CATALOG":
		return '';
		break;
	case "CLIMATE_SALES_CATALOG":
		return '';
		break;
	case "INSINKERATOR_SALES_CATALOG":
		return '';
		break;
	case "SENSI_SALES_CATALOG":
		return '';
		break;
	case "TEST_SALES_CATALOG":
		return '';
		break;
	default:
		return parentID;
	}
}


exports.write = function(data,outputStreams,paramStoreID,lookups,storeName) {
	var output;
	writeCategoryGroup(data,outputStreams,paramStoreID);
	writeCategoryGroupName(data,outputStreams,paramStoreID);
	writeCategoryGroupUrlKeyword(data,outputStreams,paramStoreID);
	writeCategoryGroupPageTitle(data,outputStreams,paramStoreID);
	writeCategoryGroupMetaDesc(data,outputStreams,paramStoreID);
	writeCategoryGroupShortDesc(data,outputStreams,paramStoreID);
	writeCategoryGroupPublished(data,outputStreams,paramStoreID);
	writeCategoryGroupFacetOrderedList(data,outputStreams,paramStoreID,lookups,storeName);
};
