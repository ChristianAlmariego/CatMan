//declare all variables before functions
var lookups,fsReadStream,csvReadStream,outputStreams;

// Load all required packages
var csv = require('csv-parse'),
	csvsync = require('csv-parse/lib/sync'),
    fs = require('fs'),
	loadLookups = require('./cm_modules/loadLookups'),
	loadOutputStreams = require('./cm_modules/loadOutputStreams'),
	recordValidator = require('./cm_modules/recordValidator'),
	recordWriter = require('./cm_modules/recordWriter');

// csv-parse options for asynchronous reading of the input file.  All of these arguments are optional.
var options = {
    delimiter : ',', // default is , 
    endLine : '\n', // default is \n, 
	columns : true, // default is null
    escapeChar : '"', // default is an empty string 
    enclosedChar : '"' // default is an empty string 
};

// parse lookup tables synchronously so that all lookup tables are available prior to asynchronous processing of the input csv
lookups = loadLookups.getLookups();
//console.log(lookups);

// parse the input csv asynchronously to increase performance and limit memory consumption
csvReadStream = csv(options);

outputStreams = loadOutputStreams.getOutputStreams();

fsReadStream = fs.createReadStream(__dirname+'/test/catalog-bulk-unittest.csv');
fsReadStream.pipe(csvReadStream)
    .on('error',function(err){
        console.error(err);
    })
    .on('data',function(data){
    	//pause the input while we process the row
		fsReadStream.pause();
		var isvalid = recordValidator.validate(data);
		if (isvalid)
		{
			recordWriter.write(data,outputStreams,lookups);
		}
		//resume the input on the next i/o operation
		process.nextTick(function(){
			fsReadStream.resume();
		});
    });

