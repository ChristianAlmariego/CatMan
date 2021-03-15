#!/bin/sh

outTempDirectory=/websphere/spdata/S5/Translation-WorkingFolder/outbound/temp/catman
outLogDirectory=/websphere/spdata/S5/Translation-WorkingFolder/outbound/auditlog/catman
outFileDirectory=/websphere/spdata/S5/Translation-WorkingFolder/outbound/catman
outTranslationDir=/ulg/outfile/home/outbound/catman

##### Remove the old files in the temp folder
echo "Removing Files from the CatMan Translation Temp Directory"
if [ -d "$outTempDirectory" ]; then
  rm -rf $outTempDirectory/* 
fi

cd $outTempDirectory

##### Copy the files for Translation Folder to temp directory
echo "Transferring files from Translation Server to CatMan Server Temp Directory"
sftp   eulgs0@icoeftp.stage.emerson.com <<EOF
 cd $outTranslationDir
 lcd $outTempDirectory
 mget * 
 quit
EOF


##### list all files in the temp direcory
echo "Creating a log file for the downloaded files"
cd $outTempDirectory
DATE=`date +%m%d%y.%H%M`
ls >$outLogDirectory/catmanOutbound$DATE.log

##### copy all files in the temp directory to the CatMan output folder
echo "Moving the downloaded files to CatMan outbound folder"
cp $outTempDirectory/* $outFileDirectory


##### removing the files from the Coremedia Server
echo "Deleting transferred files in the Translation Server"
while read line 
do 
 echo "rm \"$outTranslationDir/$line\"" | sftp eulgs0@icoeftp.stage.emerson.com
done < $outLogDirectory/catmanOutbound$DATE.log


