#!/usr/bin/bash
#working directory in quickbuild =  /opt/websphere/catalogManager

if [ "$4" = "" ] ; then
	echo The syntax of the command is incorrect.
	echo   $3 build-tag
	exit 1
fi
if [ "$3" = "" ] ; then
  echo The syntax of the command is incorrect.
  echo   $2 transformtype
  exit 1
fi
if [ "$2" = "" ] ; then
  echo The syntax of the command is incorrect.
  echo   $1 store
  exit 1
fi
if [ "$1" = "" ] ; then
  echo The syntax of the command is incorrect.
  echo   $0 environment
  exit 1
else
  export env=$1
fi

#declare variable
export CURRDIR=`pwd`
export DATALOADCMD=./dataload.sh
export WCBINDIR=/opt/websphere/CommerceServer/bin
export ENVPATH=/opt/websphere/CommerceServer/instances/dcx/properties/catalogManager/
export DLOADOUTPUTLOC=/opt/websphere/catalogManager/dataload/MASTER/

export property_reader=$CURRDIR/scripts/util/propertyReader.sh
export scripts_dir=$($property_reader $env sys catman.scriptsDirectory)
export dataload_log_reader_file_name=$($property_reader $env sys catman.dataloadLogReader)
export dataload_log_reader=$CURRDIR/$scripts_dir$dataload_log_reader_file_name

process_name="Category Transform Dataload - MASTER"

#execute cmcatgroup transform script
cd $CURRDIR
~/node.sh --max_old_space_size=4096 $CURRDIR/cmcatgroup.js $*

if [ -e ${DLOADOUTPUTLOC}/catgrp_dataload_csv_$4*.txt ] ; then
export FILE="${DLOADOUTPUTLOC}/catgrp_dataload_csv_$4*.txt"
export batchfile=`cat $FILE`
echo "$batchfile"

#execute dataload
cd $WCBINDIR
$DATALOADCMD $CURRDIR/dataload/wc-dataload-category-master.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$CURRDIR/wc-dataload-master-category$batchfile.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$ENVPATH -DoutputLocation=$DLOADOUTPUTLOC -Dbatchfile=$batchfile

# dataload errors reporting
cd $CURRDIR
echo "Read Dataload Logs for Reporting"
$dataload_log_reader $env "$process_name" "$batchfile" "$CURRDIR/wc-dataload-master-category$batchfile.log"

echo "done"

else
  echo Nothing found to process.
fi