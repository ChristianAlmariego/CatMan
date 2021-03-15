

//CTA Lookup
function writeCTALoookup(data, outputStreams) {
	var output = [];	
	output[0] = data['key'];
	output[1] = data['value'];
	outputStreams.csvCTALookup.write(output);

	//reset output array for next file
	output.splice(0);

}

//Utility Belts
function writeUtilityBeltsLoookup(data, outputStreams) {
	var output = [];	
	output[0] =data['key'];
	output[1] = data['value'];
	outputStreams.csvUtilityBeltLookup.write(output);
	//reset output array for next file
	output.splice(0);

}

//Master Sales Category
function writeMasterSalesCategory(data, outputStreams) {
	var output = [];	
	output[0] = data['Master Catalog'];
	output[1] = data['Identifier'];
	output[2] = data['Parent Identifier'];
	output[3] = data['Name US'];
	output[4] = data['URLkeyword'];
	output[5] = data['Page title'];
	output[6] = data['Meta description'];
	output[7] = data['Facet Management'];
	output[8] = data['STORE'];
	output[9] = data['Short Description'];
	output[10] = data['Published'];
	outputStreams.csvMasterSalesCategory.write(output);
	//reset output array for next file
	output.splice(0);

}

//AttrDictAttrval 
function writeAttrDictAttrval(data, outputStreams) {
	var output = [];	
	output[0] = data['Attribute'];
	output[1] = data['Sequence'];
	output[2] = data['Value'];
	outputStreams.csvAttrDictAttrVal.write(output);
	//reset output array for next file
	output.splice(0);

}

//AttrDictAttrval 
function writeAttrDictAttr(data, outputStreams) {
	var output = [];	
	output[0] = data['Identifier'];
	output[1] = data['Sequence'];
	output[2] = data['Displayable'];
	output[3] = data['Searchable'];
	output[4] = data['Comparable'];
	output[5] = data['Facetable'];
	output[6] = data['Merchandisable'];
	output[7] = data['Name'];
	output[8] = data['HeaderName'];
	output[9] = data['MultiLang'];
	output[10] = data['MaxOccurrence'];
	output[11] = data['MinOcurrences'];
	output[12] = data['MaxLength'];
	output[13] = data['Datatype'];
	output[14] = data['Defining'];
	output[15] = data['Attribute Type'];
	output[16] = data['FacetableMultiSelect'];
	
	outputStreams.csvAttrDictAttr.write(output);
	//reset output array for next file
	output.splice(0);

}

exports.write = function(report,data,outputStreams) {
	var output;
	if(report === 'ctalookup'){
		writeCTALoookup(data,outputStreams);	
	}else if(report === 'utilitybelts'){
		writeUtilityBeltsLoookup(data,outputStreams);	
	}else if(report === 'mastersalescategory'){
		writeMasterSalesCategory(data,outputStreams);	
	}else if(report === 'attrdictattrval'){
		writeAttrDictAttrval(data,outputStreams);	
	}else if(report === 'attrdictattr'){
		writeAttrDictAttr(data,outputStreams);	
	}
	

};
