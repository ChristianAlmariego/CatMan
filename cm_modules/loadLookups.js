// Load all required packages
var csvsync = require('csv-parse/lib/sync'),
    fs = require('fs');

exports.getLookups = function() {
	// parse lookup tables synchronously so that all lookup tables are available prior to asynchronous processing of the input csv
	var lookups = [];

	// Load master catalog category identifier lookup csv (Identifier)
	csv = csvsync(fs.readFileSync('./lookup_csv/mastersalescategory_lookup.csv').toString(), {delimiter: ',', columns: true});
	var mastercatcategorylookup = [];
	for (i = 0; i < csv.length; i++)
	{
		mastercatcategorylookup[csv[i].Identifier] = csv[i]['Master Catalog'];
	}
	lookups.mastercatcategorylookup = mastercatcategorylookup;
	
	var mastercategorylookup = [];
	for (i = 0; i < csv.length; i++)
	{
		mastercategorylookup[csv[i].Identifier] = csv[i]['Parent Identifier'];
	}
	lookups.mastercategorylookup = mastercategorylookup;

	csv.splice(0); //free up for garbage collection


	// Load sales catalog category identifier lookup csv (Identifier)
	csv = csvsync(fs.readFileSync('./lookup_csv/mastersalescategory_lookup.csv').toString(), {delimiter: ',', columns: true});
	var storesCategories = [];
	var salescategorynamelookup = [];
	var salescategorymainlookup = [];
	var salescatcategorylookup;
 	for (i = 0; i < csv.length; i++)
 	{
 		salescatcategorylookup = storesCategories[csv[i]['STORE']];
		if (salescatcategorylookup === undefined)
			salescatcategorylookup = [];

		if (csv[i]['Master Catalog'] != "TRUE") {
			salescatcategorylookup.push(csv[i].Identifier);
			storesCategories[csv[i]['STORE']] = salescatcategorylookup;

			salescategorynamelookup[csv[i].Identifier] = csv[i]['Name US'];
			salescategorymainlookup[csv[i].Identifier] = {
				Identifier: csv[i].Identifier,
				Name: csv[i]['Name US'],
				Store: csv[i]['STORE'],
				ParentIdentifier: csv[i]['Parent Identifier']
			};
		}
	}

 	lookups.storesCategories = storesCategories; //sales category list group by store
 	lookups.salescategorynamelookup = salescategorynamelookup; //will be used in sales category extraction to generate XML for translation
 	lookups.salescategorymainlookup = salescategorymainlookup; //will be used in sales category extraction to generate XML for translation
 	csv.splice(0); //free up for garbage collection


	 //----- master sales category dictionary 
	csv = csvsync(fs.readFileSync('./lookup_csv/mastersalescategory_lookup.csv').toString(), {delimiter: ',', columns: true});
		var salescatcategorylookup_dict = [];
		for (i = 0; i < csv.length; i++)
		{
			salescatcategorylookup_dict['Master Catalog_'+i] = csv[i]['Master Catalog'];
			salescatcategorylookup_dict['Identifier_'+i] = csv[i]['Identifier'];
			salescatcategorylookup_dict['Parent Identifier_'+i] = csv[i]['Parent Identifier'];
			salescatcategorylookup_dict['Name US_'+i] = csv[i]['Name US'];
			salescatcategorylookup_dict['URL keyword_'+i] = csv[i]['URL keyword'];
			salescatcategorylookup_dict['Page title_'+i] = csv[i]['Page title'];
			salescatcategorylookup_dict['Meta description_'+i] = csv[i]['Meta description'];
			salescatcategorylookup_dict['Facet Management_'+i] = csv[i]['Facet Management'];
			salescatcategorylookup_dict['STORE_'+i] = csv[i]['STORE'];
			salescatcategorylookup_dict['Short Description_'+i] = csv[i]['Short Description'];
			salescatcategorylookup_dict['Published_'+i] = csv[i]['Published'];
			
		}
		lookups.salescatcategorylookup_dict = salescatcategorylookup_dict;
		lookups.total_salescatcategorylookup_dict = csv.length;
	
		csv.splice(0); //free up for garbage collection


	// Load attribute dictionary identifier lookup csv
	var csv = csvsync(fs.readFileSync('./lookup_csv/attrdictattr-dataload.csv').toString(), {delimiter: ',', columns: true});
	var attrdictattr_dict = [];
	var countAttrDict = 0;
	for (i = 0; i < csv.length; i++)
	{
			if(csv[i]['Store'].includes('EMR')){
				//console.log(csv[i]['HeaderName'].toString()+' value: '+(csv[i]['HeaderName'].toString() !== ""));
			
				if(csv[i]['HeaderName'].toString() !== ""){
					attrdictattr_dict['Identifier_'+countAttrDict] = csv[i]['Identifier'];
					attrdictattr_dict['Sequence_'+countAttrDict] = csv[i]['Sequence'];
					attrdictattr_dict['Displayable_'+countAttrDict] = csv[i]['Displayable'];
					attrdictattr_dict['Searchable_'+countAttrDict] = csv[i]['Searchable'];
					attrdictattr_dict['Comparable_'+countAttrDict] = csv[i]['Comparable'];
					attrdictattr_dict['Facetable_'+countAttrDict] = csv[i]['Facetable'];
					attrdictattr_dict['Merchandisable_'+countAttrDict] = csv[i]['Merchandisable'];
					attrdictattr_dict['Name_'+countAttrDict] = csv[i]['Name'];
					attrdictattr_dict['HeaderName_'+countAttrDict] = csv[i]['HeaderName'];
					attrdictattr_dict['MultiLang_'+countAttrDict] = csv[i]['MultiLang'];
					attrdictattr_dict['MaxOccurrence_'+countAttrDict] = csv[i]['MultiValue'];
					attrdictattr_dict['MinOcurrences_'+countAttrDict] = csv[i]['MinOcurrences'];
					attrdictattr_dict['MaxLength_'+countAttrDict] = csv[i]['MaxLength'];
					attrdictattr_dict['Datatype_'+countAttrDict] = (csv[i]['LkupType'] !==  "") ? 'String Enumeration' : 'String';
		
					attrdictattr_dict['Defining_'+countAttrDict] = (csv[i]['AttrValPrefix'] === 'Attribute_Dictionary_Defining_Attributes_All_EMR_Extended_Attributes') ? 'TRUE': 'FALSE';

					var attributeType = '';
					if(csv[i]['AttrValPrefix'] === 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Core_Attributes') {
						attributeType = 'Core Attribute';
					}else if(csv[i]['AttrValPrefix'] === 'Attribute_Dictionary_Defining_Attributes_All_EMR_Extended_Attributes' || 
						csv[i]['AttrValPrefix'] === 'Attribute_Dictionary_Descriptive_Attributes_All_EMR_Extended_Attributes' ) {
						attributeType = 'Extended Attribute';
					}

					attrdictattr_dict['Attribute Type_'+countAttrDict] = attributeType;
					attrdictattr_dict['FacetableMultiSelect_'+countAttrDict] = csv[i]['FacetableMultiSelect'];
					countAttrDict++;

				}

			}

	}
	lookups.attrdictattr_dict = attrdictattr_dict;
	lookups.total_attrdictattr_dict = countAttrDict;
	csv.splice(0); //free up for garbage collection

	// Load attribute dictionary identifier lookup csv
	var csv = csvsync(fs.readFileSync('./lookup_csv/attrdictattr-dataload.csv').toString(), {delimiter: ',', columns: true});
	var storesHeader = [];
	//var headerlookup = [];
	var i;
	for (i = 0; i < csv.length; i++)
	{
		var headerName = csv[i].HeaderName;
		if (headerName === undefined || headerName === '')
		{
			headerName = 'undefined'+i;
		}
		var headerlookup = storesHeader[csv[i].Store];
		if (headerlookup === undefined)
			headerlookup = [];
		//if (csv[i].Store === storeName)
		//{
			headerlookup[headerName] = { 	Identifier: csv[i].Identifier,
					Type: csv[i].Type,
					AttributeType: csv[i].AttributeType,
					Sequence: csv[i].Sequence,
					Displayable: csv[i].Displayable,
					Searchable: csv[i].Searchable,
					Comparable: csv[i].Comparable,
					Facetable: csv[i].Facetable,
					STOREDISPLAY: csv[i].STOREDISPLAY,
					Merchandisable: csv[i].Merchandisable,
					Name: csv[i].Name,
					MultiLang: csv[i].MultiLang,
					MultiValue: csv[i].MultiValue,
					MinOcurrences: csv[i].MinOcurrences,
					MaxLength: csv[i].MaxLength,
					LkupType: csv[i].LkupType,
					AttrValPrefix: csv[i].AttrValPrefix,
					LkupTableName: csv[i].LkupTableName,
					SequencingEnabled: csv[i].SequencingEnabled};
		//}
			storesHeader[csv[i].Store] = headerlookup;
	}
	//lookups.header = headerlookup;
	lookups.header = storesHeader;
	csv.splice(0); //free up for garbage collection

		// Load attribute dictionary identifier lookup csv by Identifier
		var csv = csvsync(fs.readFileSync('./lookup_csv/attrdictattr-dataload.csv').toString(), {delimiter: ',', columns: true});
		var storesHeader = [];
		//var headerlookup = [];
		var i;
		for (i = 0; i < csv.length; i++)
		{
			var attrIdentifier = csv[i].Identifier;
			if (attrIdentifier === undefined || attrIdentifier === '')
			{
				attrIdentifier = 'undefined'+i;
			}
			var identifierlookup = storesHeader[csv[i].Store];
			if (identifierlookup === undefined)
			identifierlookup = [];
			identifierlookup[attrIdentifier] = { 	Identifier: csv[i].Identifier,
						Type: csv[i].Type,
						AttributeType: csv[i].AttributeType,
						Sequence: csv[i].Sequence,
						Displayable: csv[i].Displayable,
						Searchable: csv[i].Searchable,
						Comparable: csv[i].Comparable,
						Facetable: csv[i].Facetable,
						STOREDISPLAY: csv[i].STOREDISPLAY,
						Merchandisable: csv[i].Merchandisable,
						Name: csv[i].Name,
						HeaderName: csv[i].HeaderName,
						MultiLang: csv[i].MultiLang,
						MultiValue: csv[i].MultiValue,
						MinOcurrences: csv[i].MinOcurrences,
						MaxLength: csv[i].MaxLength,
						LkupType: csv[i].LkupType,
						AttrValPrefix: csv[i].AttrValPrefix,
						LkupTableName: csv[i].LkupTableName,
						SequencingEnabled: csv[i].SequencingEnabled};
				storesHeader[csv[i].Store] = identifierlookup;
		}
		lookups.attrIdentifier = storesHeader;
		csv.splice(0); //free up for garbage collection

	// Load predefined attr val lookup for validations
	csv = csvsync(fs.readFileSync('./lookup_csv/attrdictattrval-dataload.csv').toString(), {delimiter: ',', columns: true});
	var attrvallookup = [];
	for (i = 0; i < csv.length; i++)
	{
		if (attrvallookup[csv[i].Identifier] === undefined)
		{
			attrvallookup[csv[i].Identifier] = [];
		}
		attrvallookup[csv[i].Identifier][csv[i].Value] = {	ValueIdentifier: csv[i].ValueIdentifier,
																	Sequence: csv[i].Sequence};
	}
	lookups.attrval = attrvallookup;
	csv.splice(0); //free up for garbage collection


	csv = csvsync(fs.readFileSync('./lookup_csv/attrdictattrval-dataload.csv').toString(), {delimiter: ',', columns: true});
	var attrvallookup_dict = [];
	var countValue = 0;
	for (i = 0; i < csv.length; i++)
	{
		if(csv[i]['Identifier'].includes('EMR')){
			attrvallookup_dict['Identifier_'+countValue] = csv[i]['Identifier'];
			attrvallookup_dict['Sequence_'+countValue] = csv[i]['Sequence'];
			attrvallookup_dict['Value_'+countValue] = csv[i]['Value'];
				countValue ++;
		}
	}
	lookups.attrvallookup_dict = attrvallookup_dict;
	lookups.total_attrvallookup_dict = countValue;
	csv.splice(0); //free up for garbage collection



    // Load attribute value identifier lookup csv (Identifier,LanguageId,ValueIdentifier,Sequence,Value,ValueUsage)
	/*
    csv = csvsync(fs.readFileSync('./lookup_csv/attrdictattrval-dataload.csv').toString(), {delimiter: ',', columns: true});
    var predefinedlookup = [];
    for (i = 0; i < csv.length; i++)
    {
        predefinedlookup.push(csv[i]);

    }
    lookups.predefinedlookup = predefinedlookup;
    csv.splice(0); //free up for garbage collection
    */

	// Load CTA control lookup csv (key, value)
	csv = csvsync(fs.readFileSync('./lookup_csv/control-cta-lookup.csv').toString(), {delimiter: ',', columns: true});
	var ctalookup = [];
	for (i = 0; i < csv.length; i++)
	{
		ctalookup[csv[i].key] = csv[i].value;
	}
	lookups.ctalookup = ctalookup;
	csv.splice(0); //free up for garbage collection

	// Load Utility Belt control lookup csv (key, value)
	csv = csvsync(fs.readFileSync('./lookup_csv/control-utility-belt-lookup.csv').toString(), {delimiter: ',', columns: true});
	var utilitybeltlookup = [];
	for (i = 0; i < csv.length; i++)
	{
		utilitybeltlookup[csv[i].key] = csv[i].value;
	}
	lookups.utilitybeltlookup = utilitybeltlookup;
	csv.splice(0); //free up for garbage collection

	// Load Sales Catalog lookup csv (Master Catalog,Identifier,Parent Identifier,Name US,URL keyword,Page title,Meta description,Facet Ordered List,Delete)
	csv = csvsync(fs.readFileSync('./lookup_csv/salescatalog-emrcataloggroup-facet.csv').toString(), {delimiter: ',', columns: true});
	var salescatlookup = [];
	for (i = 0; i < csv.length; i++)
	{
		salescatlookup[csv[i].Identifier] = csv[i]['Name US'];
	}
	lookups.salescatlookup = salescatlookup;
	
	var salescategorylookup = [];
	for (i = 0; i < csv.length; i++)
	{
		salescategorylookup[csv[i].Identifier] = csv[i]['Parent Identifier'];
	}
	lookups.salescategorylookup = salescategorylookup;
	
	csv.splice(0); 

	//Load Attribute Sequence Lookup from Attribute Master File
	csv = csvsync(fs.readFileSync('./lookup_csv/emr-facet-seq.csv').toString(), {delimiter: ',', columns: true});
	var attrsequencelookup = [];
	for (i = 0; i < csv.length; i++)
	{
		attrsequencelookup[csv[i]['Attribute Identifier']] = csv[i].Sequence;
	}
	lookups.attrsequence = attrsequencelookup;

	csv.splice(0); //free up for garbage collection

	//Load NULL Name & Long Description Master Catalog Part Number items
    csv = csvsync(fs.readFileSync('./lookup_csv/mastercatalogPartNumberDesc.csv').toString(), {delimiter: ',', columns: null});
    var mastercatalognullnamelongdesc = [];
    for (i = 0; i < csv.length; i++)
    {   
    	if(csv[i][1]=='' && csv[i][3]=='')
    		mastercatalognullnamelongdesc.push(csv[i][0]);
    }
    lookups.mastercatalognullnamelongdesc = mastercatalognullnamelongdesc;
    csv.splice(0); //free up for garbage collection
    
    //Load Master Catalog Part Number File
    csv = csvsync(fs.readFileSync('./lookup_csv/mastercatalogPartNumber.csv').toString(), {delimiter: ',', columns: null});
    var mastercataloglookup = [];
    for (i = 0; i < csv.length; i++)
    {
        mastercataloglookup[csv[i][0]] = csv[i][1];
    }
    lookups.mastercataloglookup = mastercataloglookup;
    csv.splice(0); //free up for garbage collection

//Load Master Catalog Part Number File
    csv = csvsync(fs.readFileSync('./lookup_csv/mastercatalogPartNumber.csv').toString(), {delimiter: ',', columns: null});
    var mastercatalogParent = [];
    for (i = 0; i < csv.length; i++)
    {
        mastercatalogParent[csv[i][0]] = csv[i][3];
    }
    lookups.mastercatalogParent = mastercatalogParent;
    csv.splice(0); //free up for garbage collection


    //Load Master Catalog URL Keyword
    csv = csvsync(fs.readFileSync('./lookup_csv/mastercatalogPartNumber.csv').toString(), {delimiter: ',', columns: null});
    var urlkeyword = [];
    var urlkeyword_PartNumber = [];
    for (i = 0; i < csv.length; i++)
    {
    	urlkeyword[csv[i][0]] = csv[i][2];
    	urlkeyword_PartNumber [csv[i][2]] = csv[i][0];
    	//console.log('The current URL Keyword in the Loop is ' + csv[i][2]);
    }
    lookups.urlkeyword = urlkeyword;
    lookups.urlkeyword_PartNumber = urlkeyword_PartNumber;
    csv.splice(0); //free up for garbage collection

    // Load Attribute Dictionary File
	// TODO Change attribute-dictionary to inputfielddef.csv
    csv = csvsync(fs.readFileSync('./lookup_csv/inputfielddef.csv').toString(), {delimiter: ',', columns: true});
    var inputfielddef = [];
    for (i = 0; i < csv.length; i++)
    {
        inputfielddef[csv[i]['Store'] + '-' + csv[i]['Attribute Name']] = csv[i];
    }
    lookups.inputfielddef = inputfielddef;
    // console.log(inputfielddef)
    csv.splice(0); //free up for garbage collection

	//Example: How to get the keys for a given array
	//var keys = [];
	//for (var k in attrvallookup['EMR Amperage']) keys.push(k);
	//console.log(keys);

 csv = csvsync(fs.readFileSync('./lookup_csv/inputfielddef.csv').toString(), {delimiter: ',', columns: true});
var inputfielddef_dict = [];
var countInputFieldDict = 0;
for (i = 0; i < csv.length; i++)
{
	 if(csv[i]['Store'] ==='EMR' && csv[i]['Attribute Name'].toLowerCase() !== 'Short Description'.toLowerCase()
	 && csv[i]['Attribute Name'].toLowerCase() !== 'Keyword US'.toLowerCase()  && csv[i]['Attribute Name'].toLowerCase() !== 'Display Name'.toLowerCase()
	  && csv[i]['Attribute Name'].toLowerCase() !== 'Item Type'.toLowerCase()  && csv[i]['Attribute Name'].toLowerCase() !== 'Image alt text'.toLowerCase()
	   && csv[i]['Attribute Name'].toLowerCase() !== 'Thumbnail'.toLowerCase()  && csv[i]['Attribute Name'].toLowerCase() !== 'Full image'.toLowerCase()
	 ){

			if(csv[i]['Type'].toLowerCase() === 'string' || csv[i]['Type'].toLowerCase() === 'rich_text' || csv[i]['Type'].toLowerCase() === 'url')
				inputfielddef_dict['Datatype_'+countInputFieldDict] = 'String';
			else if(csv[i]['Type'].toLowerCase() === 'flag' || csv[i]['Type'].toLowerCase() === 'string_enumeration' ||
					csv[i]['Attribute Name'].toLowerCase() === 'full path' || csv[i]['Attribute Name'].toLowerCase() === 'catalog entry type' || csv[i]['Attribute Name'].toLowerCase() === 'store' )
					inputfielddef_dict['Datatype_'+countInputFieldDict] = 'String Enumeration';
			else
				inputfielddef_dict['Datatype_'+countInputFieldDict] = csv[i]['Type'];
		
					inputfielddef_dict['Identifier_'+countInputFieldDict] =  csv[i]['Identifier'];
					inputfielddef_dict['Sequence_'+countInputFieldDict] = csv[i]['Sequence']; 
					inputfielddef_dict['Displayable_'+countInputFieldDict] = csv[i]['Displayable'];  
					inputfielddef_dict['Searchable_'+countInputFieldDict] = csv[i]['Searchable'];  
					inputfielddef_dict['Comparable_'+countInputFieldDict] = csv[i]['Comparable']; 
					inputfielddef_dict['Facetable_'+countInputFieldDict] = csv[i]['Facetable'];  
					inputfielddef_dict['Merchandisable_'+countInputFieldDict] = csv[i]['Merchandisable'];  
					inputfielddef_dict['Name_'+countInputFieldDict] = csv[i]['Attribute Name'];
					inputfielddef_dict['HeaderName_'+countInputFieldDict] = csv[i]['Attribute Name'];
					inputfielddef_dict['MultiLang_'+countInputFieldDict] =  csv[i]['MultiLang'];  
					inputfielddef_dict['MaxOccurrence_'+countInputFieldDict] = csv[i]['MAX_OCCURRENCE'];
					inputfielddef_dict['MinOcurrences_'+countInputFieldDict] = csv[i]['MIN_OCCURRENCE'];
					inputfielddef_dict['MaxLength_'+countInputFieldDict] = csv[i]['MAXLENGTH'];
					inputfielddef_dict['Defining_'+countInputFieldDict] = 'FALSE';
					inputfielddef_dict['Attribute Type_'+countInputFieldDict] =  'Core Attribute'; 

					countInputFieldDict++;




	 }else{
		 //console.log(csv[i]['Attribute Name'] +' '+ csv[i]['Type']+' '+csv[i]['MAXLENGTH']+' '+csv[i]['MAX_OCCURRENCE']+' '+csv[i]['MIN_OCCURRENCE']);
	 }
}

	 lookups.inputfielddef_dict = inputfielddef_dict;
	 lookups.total_inputfielddef_dict = countInputFieldDict;
	csv.splice(0); //free up for garbage collection




 // Load FAN Image URL lookup csv (key, value)
	csv = csvsync(fs.readFileSync('./lookup_csv/fan-imgurl-lookup.csv').toString(), {delimiter: ',', columns: true});
	var fanimgurllookup = [];
	for (i = 0; i < csv.length; i++)
	{
		fanimgurllookup[csv[i].key] = csv[i].value;
	}
	lookups.fanimgurllookup = fanimgurllookup;
	csv.splice(0); //free up for garbage collection


	// Load OOTB Facets (NAME, DESCRIPTION)
	csv = csvsync(fs.readFileSync('./lookup_csv/ootb-facet-lookup.csv').toString(), {delimiter: ',', columns: true});
	var ootbfacetlookup = [];
	for (i = 0; i < csv.length; i++)
	   {
		ootbfacetlookup[csv[i].NAME] = csv[i].DESCRIPTION;
    }
    lookups.ootbfacetlookup = ootbfacetlookup;
	csv.splice(0); //free up for garbage collection

	// Load OOTB Facets (NAME, DESCRIPTION)
	csv = csvsync(fs.readFileSync('./lookup_csv/tms-approvers.csv').toString(), {delimiter: ',', columns: true});
	var tmsapproverlookup = [];
	for (i = 0; i < csv.length; i++)
	{
		tmsapproverlookup[csv[i].Store + csv[i].Locale] = csv[i];
    }
    lookups.tmsapproverlookup = tmsapproverlookup;
	csv.splice(0); //free up for garbage collection

	return lookups;
};
