var env = process.argv[2];
var sourceLocale = process.argv[3];
var destinationLocale = process.argv[4];
//process.chdir('..');
var jsonReader = require("./jsonReader");
var jsonObject = jsonReader.getJsonProperties(env, 'emr');
var extractionsPath = 'LoadAttrNames';
var validLocales = jsonObject.validLocales;//{fr_FR:-2,de_DE:-3,it_IT:-4,es_ES:-5,pt_BR:-6,zh_CN:-7,zh_TW:-8,ko_KR:-9,ja_JP:-10,ru_RU:-20,pl_PL:-22,en_CN:-1000,en_GB:-1001,en_SG:-1002};
var sourceLangId = sourceLocale == 'en_US' ? -1 : validLocales[sourceLocale];
var destinationLangId = validLocales[destinationLocale];
var currtime = new Date();
var batchid = '-'+currtime.getFullYear() + ("0"+(currtime.getMonth()+1)).slice(-2) +
	("0"+currtime.getDate()).slice(-2) + ("0"+currtime.getHours()).slice(-2) +
	("0"+currtime.getMinutes()).slice(-2) + ("0"+currtime.getSeconds()).slice(-2) +
	("00"+currtime.getMilliseconds()).slice(-3);
var fs = require('fs'),
	os = require('os');
var fsWriteStream = fs.createWriteStream(extractionsPath +'/language-id-' + sourceLocale + '-' + destinationLocale + ".txt");
fsWriteStream.write(sourceLangId +'|'+ destinationLangId + '|' + batchid + os.EOL);
fsWriteStream.end();