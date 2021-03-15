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
fi

#declare variable
export CURRDIR=`pwd`
export DATAEXTRACTCMD=./dataextract.sh
export DATALOADCMD=./dataload.sh
export WCBINDIR=/opt/websphere/CommerceServer/bin
export ENVPATH=/opt/websphere/CommerceServer/instances/dcx/properties/catalogManager/
export DLOADOUTPUTLOC=/opt/websphere/catalogManager/dataload/PROTEAM/

#execute emrcatalogmanager transform script
cd $CURRDIR
~/node.sh $CURRDIR/emrcatalogmanager.js $*

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
$DATALOADCMD $CURRDIR/dataload/wc-dataload-master-proteam.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$CURRDIR/wc-dataload-master-proteam-$batchfile.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$ENVPATH  -DoutputLocation=$DLOADOUTPUTLOC -Dbatchfile=$batchfile
$DATALOADCMD $CURRDIR/dataload/wc-dataload-master-seo.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$CURRDIR/wc-dataload-master-seo-$batchfile.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$ENVPATH  -DoutputLocation=$DLOADOUTPUTLOC -Dbatchfile=$batchfile
$DATALOADCMD $CURRDIR/dataload/wc-dataload-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$CURRDIR/wc-dataload-sales-proteam-$batchfile.log -DstoreIdentifier=EMR -DcatalogIdentifier=PROTEAM_SALES_CATALOG -DenvPath=$ENVPATH -DoutputLocation=$DLOADOUTPUTLOC -Dbatchfile=$batchfile


echo "done"

else
  echo Nothing found to process.
fi