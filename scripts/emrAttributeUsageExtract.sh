#!/usr/bin/bash

if [ "$1" = "dev" ] ; then
  export baseDir=/websphere/spdata/Dev/AttributeUsageCleanup/
fi
if [ "$1" = "stage" ] ; then
  export baseDir=/websphere/spdata/Staging/AttributeUsageCleanup/
fi
if [ "$1" = "prod" ] ; then
  export baseDir=/websphere/spdata/Prod/AttributeUsageCleanup/
fi
echo $baseDir

export baseDirWC=$baseDir
export DATAEXTRACTPATH=/opt/websphere/catalogManager/dataextract
cd $DATAEXTRACTPATH

export CURRDIR=`pwd`
export CURRDIRWC=$CURRDIR
export DATAEXTRACTCMD=./dataextract.sh
export WCBINDIR=/opt/websphere/CommerceServer/bin
export ENVPATH=/opt/websphere/CommerceServer/instances/dcx/properties/catalogManager/

for i in ${baseDir}settings/wc-dataextract-emr-attribute-usage-cleanup*.txt
do
  while IFS=\| read -r identifier header
  do
    export identifierFile=`echo "${identifier// /}"`
    export identifier="${identifier}"
    echo $identifier
    echo $identifierFile
    echo $header
    sed "s/\${attributeIdentifier}/$identifierFile/g" "$CURRDIR/wc-dataextract-attributeusage-cleanup.xml" > "$CURRDIR/wc-dataextract-attributeusage-cleanup-${identifierFile}.xml"
    sed "s/\${attributeIdentifier}/$identifier/g" "$CURRDIR/wc-extract-attributeusage-cleanup.xml" > "$CURRDIR/wc-extract-attributeusage-cleanup-temp-${identifierFile}.xml"
    sed "s/\${TargetAttributeHeader}/$header/g" "$CURRDIR/wc-extract-attributeusage-cleanup-temp-${identifierFile}.xml" > "$CURRDIR/wc-extract-attributeusage-cleanup-${identifierFile}.xml"

    cd $WCBINDIR
    $DATAEXTRACTCMD $CURRDIRWC/wc-dataextract-attributeusage-cleanup-${identifierFile}.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=${baseDirWC}logs/wc-dataextract-attributeusage-cleanup-${identifierFile}.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=-1 -DenvPath=$ENVPATH -DoutputLocation=${baseDirWC}logs/

    rm -f $CURRDIR/wc-extract-attributeusage-cleanup-*.xml
    rm -f $CURRDIR/wc-dataextract-attributeusage-cleanup-*.xml

  done < "$i"
done

echo 'Processing Completed'