#!/usr/bin/bash
#working directory in quickbuild =  /opt/websphere/catalogManager
if [ "$3" = "" ] ; then
  echo The syntax of the command is incorrect.
echo   $0 environment store build-tag
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
export DATAEXTRACTCMD=./dataextract.sh
export DATALOADCMD=./dataload.sh
export WCBINDIR=/opt/websphere/CommerceServer/bin
export ENVPATH=/opt/websphere/CommerceServer/instances/dcx/properties/catalogManager/
export DLOADOUTPUTLOC=/opt/websphere/catalogManager/dataload/WSV/

export property_reader=$CURRDIR/scripts/util/propertyReader.sh
export scripts_dir=$($property_reader $env sys catman.scriptsDirectory)
export dataload_log_reader_file_name=$($property_reader $env sys catman.dataloadLogReader)
export dataload_log_reader=$CURRDIR/$scripts_dir$dataload_log_reader_file_name

declare -a log_files_array=()
process_name="Product Transform Dataload"

cd $CURRDIR

#execute emrcatalogmanager transform script
echo 'START TRANSFORM PROCESS'
~/node.sh --max_old_space_size=4096 $CURRDIR/emrcatalogmanager.js $*


if [ $? -eq 0 ]; then
    echo OK
else
    echo FAIL
    exit 1
fi

if [ -e ${DLOADOUTPUTLOC}/dataload_csv_$3*.txt ] ; then
export FILE="${DLOADOUTPUTLOC}/dataload_csv_$3*.txt"
export batchfile=`cat $FILE`
echo "$batchfile"

#execute dataload
cd $WCBINDIR
$DATALOADCMD $CURRDIR/dataload/wc-dataload-master-wsv.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$CURRDIR/wc-dataload-master-wsv-$batchfile.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$ENVPATH  -DoutputLocation=$DLOADOUTPUTLOC -Dbatchfile=$batchfile
$DATALOADCMD $CURRDIR/dataload/wc-dataload-master-seo.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$CURRDIR/wc-dataload-master-seo-$batchfile.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$ENVPATH  -DoutputLocation=$DLOADOUTPUTLOC -Dbatchfile=$batchfile
$DATALOADCMD $CURRDIR/dataload/wc-dataload-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$CURRDIR/wc-dataload-sales-wsv-$batchfile.log -DstoreIdentifier=EMR -DcatalogIdentifier=WSV_SALES_CATALOG -DenvPath=$ENVPATH -DoutputLocation=$DLOADOUTPUTLOC -Dbatchfile=$batchfile

log_files_array+=("$CURRDIR/wc-dataload-master-wsv-$batchfile.log")
log_files_array+=("$CURRDIR/wc-dataload-master-seo-$batchfile.log")
log_files_array+=("$CURRDIR/wc-dataload-sales-wsv-$batchfile.log")

# dataload errors reporting
cd $CURRDIR
echo "Read Dataload Logs for Reporting"
for log_file_path in "${log_files_array[@]}"
do
  $dataload_log_reader $env "$process_name" "$batchfile" "$log_file_path"
done

echo "done"

else
  echo Nothing found to process.
fi