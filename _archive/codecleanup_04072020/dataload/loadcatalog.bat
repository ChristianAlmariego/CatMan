@echo off
rem #!/bin/bash
rem export CURRDIR=`pwd`
rem cd /opt/websphere/CommerceServer/bin
rem ./dataextract.sh $CURRDIR/wc-dataextract-cataloggroup.xml -DlogFilePath=$CURRDIR/wc-dataextract.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DoutputLocation=mastercategories
rem ./dataextract.sh $CURRDIR/wc-dataextract-attrdict.xml -DlogFilePath=$CURRDIR/wc-dataextract.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DoutputLocation=mastercatalog
rem ./dataextract.sh $CURRDIR/wc-dataextract-salescataloggroup.xml -DlogFilePath=$CURRDIR/wc-dataextract.log -DstoreIdentifier=EMR -DcatalogIdentifier=EMR_SALES_CATALOG -DoutputLocation=salescategories

set CURRDIR=%cd%
rem call F:\IBM\WCDE80\bin\dataload %CURRDIR%/wc-dataload-master.xml -DlogFilePath=%CURRDIR%/wc-dataload-master.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DoutputLocation=mastercatalog
rem call F:\IBM\WCDE80\bin\dataload %CURRDIR%/wc-dataload-master-seo.xml -DlogFilePath=%CURRDIR%/wc-dataload-master-seo.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DoutputLocation=mastercatalog-seo
rem call F:\IBM\WCDE80\bin\dataload %CURRDIR%/wc-dataload-sales.xml -DlogFilePath=%CURRDIR%/wc-dataload-sales.log -DstoreIdentifier=EMR -DcatalogIdentifier=EMR_SALES_CATALOG -DoutputLocation=salescatalog


call F:\IBM\WCDE80\bin\dataload %CURRDIR%/wc-dataload-category-sales.xml -DlogFilePath=%CURRDIR%/wc-dataload-emr-category$batchfile.log -DstoreIdentifier=EMR -DcatalogIdentifier=EMR_SALES_CATALOG -DenvPath=$ENVPATH -DoutputLocation=$DLOADOUTPUTLOC -Dbatchfile=$batchfile