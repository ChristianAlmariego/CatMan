#!/bin/sh

inTempDirectory=/websphere/spdata/P5/Translation-WorkingFolder/inbound/temp/catman
inLogDirectory=/websphere/spdata/P5/Translation-WorkingFolder/inbound/auditlog/catman
inFileDirectory=/websphere/spdata/P5/Translation-WorkingFolder/inbound/catman
inTranslationDir=/ulg/infile/home/inbound/catman
inArchDirectory=/websphere/spdata/P5/Translation-WorkingFolder/archive/inbound/catman

##### Remove the old files in the temp folder
echo "Removing files from the CatMan Translation Temp Directory"
if [ -d "$inTempDirectory" ]; then
  rm -rf $inTempDirectory/* 
fi

cd $inTempDirectory

##### Copy the files from CatMan Translation inbound  Folder to temp directory
echo "Transferring files from CatMan Translation inbound directory to CatMan Translation temp directory"
cd $inFileDirectory
cp * $inTempDirectory

##### list all files in the temp direcory
echo "Creating a log file for the downloaded files"
cd $inTempDirectory
DATE=`date +%m%d%y.%H%M`
ls >$inLogDirectory/catmanInbound$DATE.log

##### copy all files in the temp directory to the CatMan Translation output folder
echo "Moving the CatMan files to Translation Server inbound catman folder"
sftp   eulgp0@icoeftp.emerson.com <<EOF
 cd $inTranslationDir
 lcd $inTempDirectory
lpwd 
mput $inTempDirectory/*
 quit
EOF

##### Archiving the from the CatMan Server
echo "Archiving CatMan Transfered files from the CatMan Server"
while read line 
do 
  rm -f  "/websphere/spdata/P5/Translation-WorkingFolder/inbound/catman/$line"
done < $inLogDirectory/catmanInbound$DATE.log

zip -r  $inArchDirectory/$DATE.zip   $inTempDirectory
