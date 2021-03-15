//Load the default JSON file and return into a JSON Object
var fs = require("fs");

exports.getJsonProperties = function(env, storeName) {

//Declare the variables
var envContent;
var envJsonContent;
var storeContent;
var storeJsonContent;

//Get the generic JSON content for environment
var genericContent = fs.readFileSync('./jsonproperties/generic.json');
var genericJsonContent = JSON.parse(genericContent);
	

//Get the JSON content for specific for the different environment
envContent = fs.readFileSync('./jsonproperties/env-properties-'+env.toLowerCase()+'.json');
envJsonContent = JSON.parse(envContent);

//Get the JSON content for the Stores
storeContent = fs.readFileSync('./jsonproperties/store-properties-'+storeName.toLowerCase()+'.json');	
storeJsonContent = JSON.parse(storeContent);


	//Add the 2nd JSON object to the main JSON object
	for(var xkey in storeJsonContent){
		genericJsonContent[xkey] = storeJsonContent[xkey];
	}

	//Add the 3rd JSON object to the main JSON object
	for(var xkey in envJsonContent){
		genericJsonContent[xkey] = envJsonContent[xkey];
	}
	
return genericJsonContent;

}

