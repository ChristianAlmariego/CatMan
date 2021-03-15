//// setup default properties
var dotenvNodeModuleName = 'dotenv';
require(dotenvNodeModuleName).config();
var cmModulesPath = process.env.CATMAN_INTALLATION_FOLDER + process.env.CATMAN_MODULES_PATH;

//// fetch params
var environment = process.argv[2];
var processCode = process.argv[3];
var buildReference = process.argv[4];
var isCheckerMode = false;

if (process.argv[5] == "CHECKONLY")  {
	isCheckerMode = true;
}

//// setup extended properties
var propertiesReader = require(cmModulesPath + process.env.CATMAN_PROPERTIESREADER);
var applicationProperties = propertiesReader.getApplicationProperties();
var environmentProperties = propertiesReader.getEnvironmentProperties(environment);
var systemProperties = propertiesReader.getSystemProperties();
var messagesProperties = propertiesReader.getMessagesProperties();

//// setup cm_modules
var constants = require(cmModulesPath + systemProperties.path().catman.constants);
var genericUtil = require(cmModulesPath + systemProperties.path().catman.genericUtilities);

//// setup node modules
var fs = require(systemProperties.path().node.fileSystem);
var os = require(systemProperties.path().node.operatingSystem);

//// initialize variables
var queueLocation;
var resourcesDir;
var inputFiles = [];
var validRequestsFileName;
var invalidRequestsFileName;
var validRequestsFileWriteStream;
var invalidRequestsFileWriteStream;

//// start process
validRequestsFileName = applicationProperties.path().file.name.validRequests 
    + constants.CHAR_HYPHEN + buildReference + constants.FILE_EXT_TXT;
invalidRequestsFileName = applicationProperties.path().file.name.invalidRequests 
    + constants.CHAR_HYPHEN + buildReference + constants.FILE_EXT_TXT;

switch (processCode) {
    case applicationProperties.path().catman.productTransform:
        queueLocation = environmentProperties.path().catman.baseSharedDirectory + systemProperties.path().catman.workspaceDefault;
        resourcesDir = environmentProperties.path().catman.rootDirectory 
            + systemProperties.path().catman.workspaceDefault
            + systemProperties.path().catman.wrkspcResource;
        compileDefaultRequestsFilePair();
        break;
    case applicationProperties.path().catman.extractProductForTranslation:
        // TBD
        break;
    case applicationProperties.path().catman.extractProductForPublish:
        // TBD
        break;
    case applicationProperties.path().catman.manageAttributes:
        queueLocation = environmentProperties.path().catman.baseSharedDirectory 
            + systemProperties.path().catman.requestsDirectory 
            + systemProperties.path().catman.workspaceAttributesAndAttrValues;
        resourcesDir = environmentProperties.path().catman.rootDirectory 
            + systemProperties.path().catman.requestsDirectory
            + systemProperties.path().catman.workspaceAttributesAndAttrValues
            + systemProperties.path().catman.wrkspcResource;
        compileDefaultRequestsFilePair();
        break;
    case applicationProperties.path().catman.manageCategory:
        var categoryWrkspaceDirectory = environmentProperties.path().catman.rootDirectory 
	        + systemProperties.path().catman.requestsDirectory 
	        + systemProperties.path().catman.workspaceCategories;
        var resourcesDir;
        var queueLocation = environmentProperties.path().catman.baseSharedDirectory 
	        + systemProperties.path().catman.requestsDirectory 
	        + systemProperties.path().catman.workspaceCategories;
        if (isCheckerMode) {
            queueLocation = queueLocation + systemProperties.path().catman.workspaceChecker;
            resourcesDir = categoryWrkspaceDirectory + systemProperties.path().catman.workspaceChecker + systemProperties.path().catman.wrkspcResource;
        } else {
	        resourcesDir = categoryWrkspaceDirectory + systemProperties.path().catman.wrkspcResource;
        }
        compileDefaultRequestsFilePair();
        break;
    default:
        // do nothing
}

//// methods
function compileDefaultRequestsFilePair() {
    var allItems;
    var catalogFiles = [];
    var controlFiles = [];
    var processedControlFiles = [];
    var processedCatalogFiles = [];

    var validRequestsFileNamePath = resourcesDir + validRequestsFileName;
    var invalidRequestsFileNamePath = resourcesDir + invalidRequestsFileName;
    validRequestsFileWriteStream = fs.createWriteStream(validRequestsFileNamePath, {highWaterMark: Math.pow(2,14)});
    invalidRequestsFileWriteStream = fs.createWriteStream(invalidRequestsFileNamePath, {highWaterMark: Math.pow(2,14)});

    allItems = fs.readdirSync(queueLocation);
	allItems.forEach(function (item) {
        if (item.includes(constants.FILE_EXT_CSV)) {
            inputFiles.push(item);

            if (processCode == applicationProperties.path().catman.manageAttributes) {
                if (item.substring(0, 11) == applicationProperties.path().file.keyword.attrcontrol) {
                    controlFiles.push(item);
                } else if (item.substring(0, 11) == applicationProperties.path().file.keyword.attrcatalog) {
                    catalogFiles.push(item);
                }
            } else if (processCode == applicationProperties.path().catman.manageCategory){
                if (item.substring(0, 15) == applicationProperties.path().file.keyword.categorycontrol) {
                    controlFiles.push(item);
                } else if (item.substring(0, 15) == applicationProperties.path().file.keyword.categorycatalog) {
                    catalogFiles.push(item);
                }
            } else {
                if (item.substring(0, 7) == applicationProperties.path().file.keyword.control) {
                    controlFiles.push(item);
                } else if (item.substring(0, 7) == applicationProperties.path().file.keyword.catalog) {
                    catalogFiles.push(item);
                }
            }
        }
    });
    
    if (genericUtil.isNotEmptyArray(inputFiles) 
        && genericUtil.isNotEmptyArray(controlFiles) 
        && genericUtil.isNotEmptyArray(catalogFiles)) {
        
        controlFiles.forEach(function (eachControlFile) {
            var controlFilePath = queueLocation + eachControlFile;
            var controlFileData = fs.readFileSync(controlFilePath, constants.UTF).split(/\r?\n/);

            if (controlFileData.length > 1 && !genericUtil.isTrimmedEmptyString(controlFileData[0])) {
                var inputCatalogFileName = genericUtil.getTrimmed(controlFileData[0]);
                var inputContactEmail = genericUtil.getTrimmed(controlFileData[1]);
                var inputContactName = genericUtil.getTrimmed(controlFileData[2]);
                var inputRunRequest = genericUtil.getTrimmed(controlFileData[3]);

                if (!genericUtil.isUndefined(inputContactEmail) && !genericUtil.isUndefined(inputContactName)
                    && !genericUtil.isTrimmedEmptyString(inputContactEmail) && !genericUtil.isTrimmedEmptyString(inputContactName)) {
                    if (catalogFiles.includes(inputCatalogFileName)) {
                        if (!processedCatalogFiles.includes(inputCatalogFileName)) {
                            validRequestsFileWriteStream.write(eachControlFile + constants.CHAR_PIPE
                                + inputCatalogFileName + constants.CHAR_PIPE
                                + inputContactEmail + constants.CHAR_PIPE
                                + inputContactName + constants.CHAR_PIPE
                                + inputRunRequest + os.EOL);
                            
                            processedCatalogFiles.push(inputCatalogFileName);
                        } else {
                            invalidRequestsFileWriteStream.write(eachControlFile + constants.CHAR_PIPE 
                                + messagesProperties.path().input.ctrlFile.repetitiveRefCtlgFile + os.EOL);
                        }
                    } else {
                        invalidRequestsFileWriteStream.write(eachControlFile + constants.CHAR_PIPE 
                            + messagesProperties.path().input.ctrlFile.missingRefCtlgFile + os.EOL);
                    }
                } else {
                    invalidRequestsFileWriteStream.write(eachControlFile + constants.CHAR_PIPE 
                        + messagesProperties.path().input.ctrlFile.missingContactDetails + os.EOL);
                }
            } else {
                invalidRequestsFileWriteStream.write(eachControlFile + constants.CHAR_PIPE 
                    + messagesProperties.path().input.blankFile + os.EOL);
            }

            processedControlFiles.push(eachControlFile);
        });
    }

    if (genericUtil.isNotEmptyArray(inputFiles)) {
        inputFiles.forEach(function (eachFile) {
            if (!processedControlFiles.includes(eachFile) && !processedCatalogFiles.includes(eachFile)) {
                invalidRequestsFileWriteStream.write(eachFile + constants.CHAR_PIPE 
                    + messagesProperties.path().input.invalidFile + os.EOL);
            }
        });
    }

    genericUtil.endFsNodeResource(validRequestsFileWriteStream);
    genericUtil.endFsNodeResource(invalidRequestsFileWriteStream);
}
