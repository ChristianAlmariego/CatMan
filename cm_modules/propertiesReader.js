// setup default properties
var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();

var propertiesReader = require(process.env.NODE_MODULE_PROPERTIES_READER);
var properties;

var propertiesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_PROPERTIES_PATH;
var systemPropertiesFileName = 'system.properties';
var applicationPropertiesFileName = 'application.properties';
var messagesPropertiesFileName = 'messages.properties';

exports.getEnvironmentProperties = function(env) {
	var envPropertiesPath = propertiesPath + 'system-' + env.toLowerCase() + '.properties';
	var properties = propertiesReader(envPropertiesPath);
	return properties;
}

exports.getApplicationProperties = function() {
	var appPropertiesPath = propertiesPath + applicationPropertiesFileName;
	properties = propertiesReader(appPropertiesPath);
	return properties;
}

exports.getSystemProperties = function() {
	var sysPropertiesPath = propertiesPath + systemPropertiesFileName;
	properties = propertiesReader(sysPropertiesPath);
	return properties;
}

exports.getMessagesProperties = function(env) {
	var msgPropertiesPath = propertiesPath + messagesPropertiesFileName;
	var properties = propertiesReader(msgPropertiesPath);
	return properties;
}