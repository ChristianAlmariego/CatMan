@echo off
rem #!/bin/bash
rem export CURRDIR=`pwd`
rem cd /opt/websphere/CommerceServer/bin
rem ./dataextract.sh $CURRDIR/wc-dataextract-cataloggroup.xml -DlogFilePath=$CURRDIR/wc-dataextract.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DoutputLocation=mastercategories
rem ./dataextract.sh $CURRDIR/wc-dataextract-attrdict.xml -DlogFilePath=$CURRDIR/wc-dataextract.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DoutputLocation=mastercatalog
rem ./dataextract.sh $CURRDIR/wc-dataextract-salescataloggroup.xml -DlogFilePath=$CURRDIR/wc-dataextract.log -DstoreIdentifier=EMR -DcatalogIdentifier=EMR_SALES_CATALOG -DoutputLocation=salescategories

set CURRDIR=%cd%
call F:\IBM\WCDE80\bin\dataload %CURRDIR%/wc-dataload-entitledliterature-master.xml -DlogFilePath=%CURRDIR%/wc-dataload-entitledliterature.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DoutputLocation=entitledliterature
call F:\IBM\WCDE80\bin\dataload %CURRDIR%/wc-dataload-entitledliterature-sales.xml -DlogFilePath=%CURRDIR%/wc-dataload-entitledliterature.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=PROTEAM_LITERATURE_CATALOG -DoutputLocation=entitledliterature
