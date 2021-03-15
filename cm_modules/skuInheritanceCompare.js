console.log("Start - SKU Inheritancee Comparison")

//var platform = "AUTOSOL";
//var languageId = "-1";
//var csvPath = "F:\\catman\\cmupgrade\\CatMan\\Export\\SkuCleanup\\";

var platform = process.argv[2];
var languageId = process.argv[3];
var csvPath = process.argv[4];

console.log("Platform: " + platform);
console.log("Language: " + languageId);
console.log("CSV Path: " + csvPath);

var dataExtractFilePath = csvPath + platform + languageId + "-parent-sku-values.csv";
var deletionCSVPath = csvPath + platform + languageId + "-parent-sku-deletion";
var reportCSVPath = csvPath + platform + languageId + "-parent-sku-duplicatereport";


var fs = require('fs'),
    csv = require('csv-parse'),
    os = require('os'),
    es = require('event-stream'),
    stringify = require('csv-stringify');


var end, start;
start = new Date();

var writeoptions = {
    delimiter : ',', // default is ,
    endLine : '\n', // default is \n,
    columns : false, // default is null
    escapeChar : '"', // default is an empty string
    enclosedChar : '"', // default is an empty string
    encoding : 'utf8',
    highWaterMark: Math.pow(2,14)
};

var batchNumber = 1;
var attributeStoreIdentifier = "EmersonCAS";

deletionCSVPath = deletionCSVPath + "-batch" + batchNumber + ".csv";
var deletionStream = fs.createWriteStream(deletionCSVPath);
initializeOutputStream(deletionStream, deletionCSVPath, "DELETION");

reportCSVPath = reportCSVPath + "-batch" + batchNumber + ".csv";
var reportStream = fs.createWriteStream(reportCSVPath);
initializeOutputStream(reportStream, reportCSVPath, "REPORT");

var totalLines = 0;
var totalDuplicates = 0;
var currentID = ''
var currentValues = [];
var newDuplicates = false;
fs.createReadStream(dataExtractFilePath)
    .pipe(es.split())
    .pipe(
        es
            .mapSync(function(line){
                totalLines++;
                if (totalLines > 1) {
                    var cRecord = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                    newDuplicates = false;

                    if (cRecord[2] === 'ProductBean') {
                        if (cRecord[0] === currentID) {
                            currentValues.push(cRecord);
                        }
                        else {
                            currentID = cRecord[0];
                            currentValues = [];
                            currentValues.push(cRecord);
                        }
                    }
                    //ItemBean
                    else {
                        if (cRecord[3] === currentID) {

                            for (let i=0; i < currentValues.length; i++) {
                                var currentAttr = currentValues[i];
                                if (cRecord[5] === currentAttr[5] ) {
                                    if (cRecord[9] === currentAttr[9]) {
                                        var forDeletion = cRecord[1] + "," + cRecord[8] + "," + cRecord[4] + "," + cRecord[6] + "," + cRecord[9] + "," + cRecord[10] + ",," + attributeStoreIdentifier + ",,,,1," + cRecord[0] + "," + cRecord[3];
                                        deletionStream.write(forDeletion + os.EOL);
                                        reportStream.write(line + os.EOL);
                                        totalDuplicates++;
                                        newDuplicates = true;
                                        break;
                                    }
                                }                               
                            }
                        }
                    }
                    if (totalLines%100000 === 0) {
                        console.log("Processing Records: " + totalLines)
                    }

                    if (totalDuplicates >= 500000) {
                        if (totalDuplicates%500000 === 0 && newDuplicates === true) {
                            batchNumber = batchNumber + 1;

                            deletionCSVPath = csvPath + platform + languageId + "-parent-sku-deletion";
                            deletionCSVPath = deletionCSVPath + "-batch" + batchNumber + ".csv";
                            deletionStream = fs.createWriteStream(deletionCSVPath);
                            initializeOutputStream(deletionStream, deletionCSVPath, "DELETION");

                            reportCSVPath = csvPath + platform + languageId + "-parent-sku-duplicatereport";
                            reportCSVPath = reportCSVPath + "-batch" + batchNumber + ".csv";
                            reportStream = fs.createWriteStream(reportCSVPath);
                            initializeOutputStream(reportStream, reportCSVPath, "REPORT");
                        }
                    }
                }
            })
    )
    .on('error',function(err) {
        console.log('Error while reading the CSV file.',err);
    })
    .on('end', function() {
        console.log('SKU Inheritance Comparison Completed: ' + totalLines);
        console.log('SKU Inheritance Comparison Duplicates: ' + totalDuplicates);
        var end = new Date();
        console.log('Operation took ' + ((end.getTime() - start.getTime()) / 1000) + ' sec');

    })


function initializeOutputStream(targetStream,csvPath,streamType) {
 
    targetStream.on('error', function(err){
        console.log(err.message);
    });
    targetStream.on('finish', function(){
        targetStream.end();
        console.log('Completed writing file... \nValid File:\t' + csvPath);
    });

    if (streamType == "REPORT") {
        console.log("Report Path: " + reportCSVPath);
        targetStream.write('CATENTRY_ID,PARTNUMBER,CATENTTYPE_ID,LANGUAGE_ID,ATTR_ID,ATTRIBUTE_IDENTIFIER,ATTRVAL_ID,VALUE_IDENTIFIER,VALUE' + os.EOL);
    }
    else {
        console.log("Deletion CSV Path: " + deletionCSVPath);
        targetStream.write('CatalogEntryAttributeDictionaryAttributeRelationship' + os.EOL);
        targetStream.write('PartNumber,ValueIdentifier,LanguageId,AttributeIdentifier,Value,Usage,Sequence,AttributeStoreIdentifier,Field1,Field2,Field3,Delete,CatEntryId,ParentId' + os.EOL);    
    }

}
