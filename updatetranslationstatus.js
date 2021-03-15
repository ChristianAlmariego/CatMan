var env = process.argv[2]; // Environment argument
var storeName = process.argv[3]; // Store argument
var status = process.argv[4];

//setup node modules
var csv = require('csv-parse/lib/sync');
var readline = require('readline'); // use line reader to handle 1st non-csv row
var fs = require('fs');
var os = require('os');
var currtime = new Date();
//setup default properties
var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;

//setup extended properties
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var envProperties = propertiesReader.getEnvironmentProperties(env);
var systemProperties = propertiesReader.getSystemProperties();

var jsonReader = require(envProperties.path().catman.rootDirectory + systemProperties.path().catman.cmModulesDirectory + systemProperties.path().catman.jsonReader);
var jsonObject = jsonReader.getJsonProperties(env, storeName);
if(env == 'prod'){
	var jsonObjectStage = jsonReader.getJsonProperties("stage", storeName)
}
var fs = require('fs');
var os = require('os');
var translationDashboardContentsNotTranslated = [];
var translationDashboardContentsInTranslation = [];
var translationDashboardContentsTranslatedS1 = [];
var translationDashboardContentsTranslatedP1 = [];
var content;
var filePath = jsonObject.baseSharedDirectory + "CatMan/Export/TranslationDashboard/TranslationDashboardContentsNotTranslated.csv";
var fsReadStream = fs.readFileSync(filePath, 'utf8');
var rows=(fsReadStream.split(/\r\n|\r|\n/)).filter(function(v){return v!==''});
rows.forEach(function (row){
	if(row.startsWith('"'))
		content=row.split(/,(?![^"]*"(?:(?:[^"]*"))*[^"]*$)/);
	else
		content=row.split(",");
	translationDashboardContentsNotTranslated[content[0]] = row;
});

filePath = jsonObject.baseSharedDirectory + "CatMan/Export/TranslationDashboard/TranslationDashboardContentsInTranslation.csv";
fsReadStream = fs.readFileSync(filePath, 'utf8');
rows=(fsReadStream.split(/\r\n|\r|\n/)).filter(function(v){return v!==''});
rows.forEach(function (row){
	if(row.startsWith('"'))
		content=row.split(/,(?![^"]*"(?:(?:[^"]*"))*[^"]*$)/);
	else
		content=row.split(",");
	translationDashboardContentsInTranslation[content[0]] = row;
});

filePath = jsonObject.baseSharedDirectory + "CatMan/Export/TranslationDashboard/TranslationDashboardContentsTranslatedS1.csv";
fsReadStream = fs.readFileSync(filePath, 'utf8');
rows=(fsReadStream.split(/\r\n|\r|\n/)).filter(function(v){return v!==''});
rows.forEach(function (row){
	if(row.startsWith('"'))
		content=row.split(/,(?![^"]*"(?:(?:[^"]*"))*[^"]*$)/);
	else
		content=row.split(",");
	translationDashboardContentsTranslatedS1[content[0]] = row;
});

filePath = jsonObject.baseSharedDirectory + "CatMan/Export/TranslationDashboard/TranslationDashboardContentsTranslatedP1.csv";
fsReadStream = fs.readFileSync(filePath, 'utf8');
rows=(fsReadStream.split(/\r\n|\r|\n/)).filter(function(v){return v!==''});
rows.forEach(function (row){
	if(row.startsWith('"'))
		content=row.split(/,(?![^"]*"(?:(?:[^"]*"))*[^"]*$)/);
	else
		content=row.split(",");
	translationDashboardContentsTranslatedP1[content[0]] = row;
});

if(status=="In-Translation")
	filePath = jsonObject.baseSharedDirectory + "CatMan/Export/TranslationDashboard/PartNumbersInTranslation.csv";
else if(status=="Translated-S1")
	filePath = jsonObject.baseSharedDirectory + "CatMan/Export/TranslationDashboard/PartNumbersTranslatedS1.csv";
else if(status=="Translated-P1")
	filePath = jsonObject.baseSharedDirectory + "CatMan/Export/TranslationDashboard/PartNumbersTranslatedP1.csv";
var fileExists = fs.existsSync(filePath);
if(fileExists){
	var fsPartNumbersReadStream = fs.readFileSync(filePath, 'utf8');
	rows=(fsPartNumbersReadStream.split(/\r\n|\r|\n/)).filter(function(v){return v!==''});
	rows.forEach(function (row){
		if(row.startsWith('"'))
			content=row.split(/,(?![^"]*"(?:(?:[^"]*"))*[^"]*$)/);
		else
			content=row.split(",");
		if(translationDashboardContentsNotTranslated[content[0]]!=undefined){
			if(translationDashboardContentsNotTranslated[content[0]].includes(content[1]+"-")){
				translationDashboardContentsNotTranslated[content[0]] = translationDashboardContentsNotTranslated[content[0]].replace(content[1]+"-","");
			}else if(translationDashboardContentsNotTranslated[content[0]].includes("-"+content[1])){
				translationDashboardContentsNotTranslated[content[0]] = translationDashboardContentsNotTranslated[content[0]].replace("-"+content[1],"");
			}else if(translationDashboardContentsNotTranslated[content[0]].includes(content[1])){
				delete translationDashboardContentsNotTranslated[content[0]];
			}
		}
		if(translationDashboardContentsInTranslation[content[0]]!=undefined){
			if(translationDashboardContentsInTranslation[content[0]].includes(content[1]+"-")){
				translationDashboardContentsInTranslation[content[0]] = translationDashboardContentsInTranslation[content[0]].replace(content[1]+"-","");
			}else if(translationDashboardContentsInTranslation[content[0]].includes("-"+content[1])){
				translationDashboardContentsInTranslation[content[0]] = translationDashboardContentsInTranslation[content[0]].replace("-"+content[1],"");
			}else if(translationDashboardContentsInTranslation[content[0]].includes(content[1])){
				delete translationDashboardContentsInTranslation[content[0]];
			}
		}
		if(translationDashboardContentsTranslatedS1[content[0]]!=undefined){
			if(translationDashboardContentsTranslatedS1[content[0]].includes(content[1]+"-")){
				translationDashboardContentsTranslatedS1[content[0]] = translationDashboardContentsTranslatedS1[content[0]].replace(content[1]+"-","");
			}else if(translationDashboardContentsTranslatedS1[content[0]].includes("-"+content[1])){
				translationDashboardContentsTranslatedS1[content[0]] = translationDashboardContentsTranslatedS1[content[0]].replace("-"+content[1],"");
			}else if(translationDashboardContentsTranslatedS1[content[0]].includes(content[1])){
				delete translationDashboardContentsTranslatedS1[content[0]];
			}
		}
		if(translationDashboardContentsTranslatedP1[content[0]]!=undefined){
			if(translationDashboardContentsTranslatedP1[content[0]].includes(content[1]+"-")){
				translationDashboardContentsTranslatedP1[content[0]] = translationDashboardContentsTranslatedP1[content[0]].replace(content[1]+"-","");
			}else if(translationDashboardContentsTranslatedP1[content[0]].includes("-"+content[1])){
				translationDashboardContentsTranslatedP1[content[0]] = translationDashboardContentsTranslatedP1[content[0]].replace("-"+content[1],"");
			}else if(translationDashboardContentsTranslatedP1[content[0]].includes(content[1])){
				delete translationDashboardContentsTranslatedP1[content[0]];
			}
		}
	});
}

var fsExportStream = fs.createWriteStream(jsonObject.baseSharedDirectory + "CatMan/Export/TranslationDashboard/TranslationDashboardContentsNotTranslated.csv", {highWaterMark: Math.pow(2,14)});
if(env.toLowerCase() == 'prod'){
	var fsExportStreamStage = fs.createWriteStream(jsonObjectStage.baseSharedDirectory + "CatMan/Export/TranslationDashboard/TranslationDashboardContentsNotTranslated.csv", {highWaterMark: Math.pow(2,14)});
	for(var partNumber in translationDashboardContentsNotTranslated){
		fsExportStream.write(translationDashboardContentsNotTranslated[partNumber]+os.EOL);
		fsExportStreamStage.write(translationDashboardContentsNotTranslated[partNumber]+os.EOL);
	}
} else{
	for(var partNumber in translationDashboardContentsNotTranslated){
		fsExportStream.write(translationDashboardContentsNotTranslated[partNumber]+os.EOL);
	}
}

fsExportStream = fs.createWriteStream(jsonObject.baseSharedDirectory + "CatMan/Export/TranslationDashboard/TranslationDashboardContentsInTranslation.csv", {highWaterMark: Math.pow(2,14)});
if(status=="In-Translation" && fileExists){
	rows.forEach(function (row){
		if(row.startsWith('"'))
			content=row.split(/,(?![^"]*"(?:(?:[^"]*"))*[^"]*$)/);
		else
			content=row.split(",");
		var rowContent = translationDashboardContentsInTranslation[content[0]];
		if(rowContent!=undefined){
			if(rowContent.startsWith('"'))
				var contentSplit=rowContent.split(/,(?![^"]*"(?:(?:[^"]*"))*[^"]*$)/);
			else
				var contentSplit=rowContent.split(",");
			contentSplit[2]+="-"+content[1];
			translationDashboardContentsInTranslation[content[0]] = contentSplit[0]+','+contentSplit[1]+','+contentSplit[2]+','+contentSplit[3];
		}else{
			translationDashboardContentsInTranslation[content[0]] = content[0]+','+"In Translation"+','+content[1]+',';
		}
	});
}
if(env.toLowerCase() == 'prod'){
	fsExportStreamStage = fs.createWriteStream(jsonObjectStage.baseSharedDirectory + "CatMan/Export/TranslationDashboard/TranslationDashboardContentsInTranslation.csv", {highWaterMark: Math.pow(2,14)});
	for(var partNumber in translationDashboardContentsInTranslation){
		fsExportStream.write(translationDashboardContentsInTranslation[partNumber]+os.EOL);
		fsExportStreamStage.write(translationDashboardContentsInTranslation[partNumber]+os.EOL);
	}
} else{
	for(var partNumber in translationDashboardContentsInTranslation){
		fsExportStream.write(translationDashboardContentsInTranslation[partNumber]+os.EOL);
	}
}
fsExportStream = fs.createWriteStream(jsonObject.baseSharedDirectory + "CatMan/Export/TranslationDashboard/TranslationDashboardContentsTranslatedS1.csv", {highWaterMark: Math.pow(2,14)});
if(status=="Translated-S1" && fileExists){
	rows.forEach(function (row){
		if(row.startsWith('"'))
			content=row.split(/,(?![^"]*"(?:(?:[^"]*"))*[^"]*$)/);
		else
			content=row.split(",");
		var rowContent = translationDashboardContentsTranslatedS1[content[0]];
		if(rowContent!=undefined){
			if(rowContent.startsWith('"'))
				var contentSplit=rowContent.split(/,(?![^"]*"(?:(?:[^"]*"))*[^"]*$)/);
			else
				var contentSplit=rowContent.split(",");
			contentSplit[2]+="-"+content[1];
			translationDashboardContentsTranslatedS1[content[0]] = contentSplit[0]+','+contentSplit[1]+','+contentSplit[2]+','+contentSplit[3];
		}else{
			translationDashboardContentsTranslatedS1[content[0]] = content[0]+','+"Translated in S1"+','+content[1]+','+("0"+(currtime.getMonth()+1)).slice(-2) + "/" + ("0"+currtime.getDate()).slice(-2) + "/" + currtime.getFullYear();
		}
	});
}
if(env.toLowerCase() == 'prod'){
	fsExportStreamStage = fs.createWriteStream(jsonObjectStage.baseSharedDirectory + "CatMan/Export/TranslationDashboard/TranslationDashboardContentsTranslatedS1.csv", {highWaterMark: Math.pow(2,14)});
	for(var partNumber in translationDashboardContentsTranslatedS1){
		fsExportStream.write(translationDashboardContentsTranslatedS1[partNumber]+os.EOL);
		fsExportStreamStage.write(translationDashboardContentsTranslatedS1[partNumber]+os.EOL);
	}
} else{
	for(var partNumber in translationDashboardContentsTranslatedS1){
		fsExportStream.write(translationDashboardContentsTranslatedS1[partNumber]+os.EOL);
	}
}
fsExportStream = fs.createWriteStream(jsonObject.baseSharedDirectory + "CatMan/Export/TranslationDashboard/TranslationDashboardContentsTranslatedP1.csv", {highWaterMark: Math.pow(2,14)});
if(status=="Translated-P1" && fileExists){
	rows.forEach(function (row){
		if(row.startsWith('"'))
			content=row.split(/,(?![^"]*"(?:(?:[^"]*"))*[^"]*$)/);
		else
			content=row.split(",");
		var rowContent = translationDashboardContentsTranslatedP1[content[0]];
		if(rowContent!=undefined){
			if(rowContent.startsWith('"'))
				var contentSplit=rowContent.split(/,(?![^"]*"(?:(?:[^"]*"))*[^"]*$)/);
			else
				var contentSplit=rowContent.split(",");
			contentSplit[2]+="-"+content[1];
			translationDashboardContentsTranslatedP1[content[0]] = contentSplit[0]+','+contentSplit[1]+','+contentSplit[2]+','+contentSplit[3];
		}else{
			translationDashboardContentsTranslatedP1[content[0]] = content[0]+','+"Translated in P1"+','+content[1]+','+("0"+(currtime.getMonth()+1)).slice(-2) + "/" + ("0"+currtime.getDate()).slice(-2) + "/" + currtime.getFullYear();
		}
	});
}
if(env.toLowerCase() == 'prod'){
	fsExportStreamStage = fs.createWriteStream(jsonObjectStage.baseSharedDirectory + "CatMan/Export/TranslationDashboard/TranslationDashboardContentsTranslatedP1.csv", {highWaterMark: Math.pow(2,14)});
	for(var partNumber in translationDashboardContentsTranslatedP1){
		fsExportStream.write(translationDashboardContentsTranslatedP1[partNumber]+os.EOL);
		fsExportStreamStage.write(translationDashboardContentsTranslatedP1[partNumber]+os.EOL);
	}
} else{
	for(var partNumber in translationDashboardContentsTranslatedP1){
		fsExportStream.write(translationDashboardContentsTranslatedP1[partNumber]+os.EOL);
	}
}
if(fileExists)
	fs.unlinkSync(filePath);