if [ "$1" = "" ] ; then
  echo The syntax of the command is incorrect.
  echo   $1 extract output location
  exit 1
fi

#declare variable
export CURRDIR=`pwd`
export DATAEXTRACTCMD=./dataextract.sh
export WCBINDIR=/opt/websphere/CommerceServer/bin
export ENVPATH=/opt/websphere/CommerceServer/instances/dcx/properties/catalogManager/
export DEXTRACTOUTPUTLOC=$1

#Product DataExtract
cd $WCBINDIR
$DATAEXTRACTCMD $CURRDIR/dataextract/wc-dataextract-comres-sequence.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$CURRDIR/wc-dataextract-ComRes-sequence.xml.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=-1 -DenvPath=$ENVPATH -DoutputLocation=$DEXTRACTOUTPUTLOC/

echo "done"