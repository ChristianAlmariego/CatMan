@echo off
rem #!/bin/bash
rem export CURRDIR=`pwd`
rem cd /opt/websphere/CommerceServer/bin
rem ./dataextract.sh $CURRDIR/wc-dataextract-cataloggroup.xml -DlogFilePath=$CURRDIR/wc-dataextract.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DoutputLocation=mastercategories
rem ./dataextract.sh $CURRDIR/wc-dataextract-attrdict.xml -DlogFilePath=$CURRDIR/wc-dataextract.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DoutputLocation=mastercatalog
rem ./dataextract.sh $CURRDIR/wc-dataextract-salescataloggroup.xml -DlogFilePath=$CURRDIR/wc-dataextract.log -DstoreIdentifier=EMR -DcatalogIdentifier=EMR_SALES_CATALOG -DoutputLocation=salescategories

set CURRDIR=%cd%
rem call F:\IBM\WCDE80\bin\dataextract %CURRDIR%/wc-dataextract-master.xml -DlogFilePath=%CURRDIR%/wc-dataextract-master.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DoutputLocation=mastercatalog
call F:\IBM\WCDE80\bin\dataextract %CURRDIR%/wc-dataextract-master.xml -DLoadOrder=CatalogEntryDescription,CatalogEntrySEO -DlogFilePath=%CURRDIR%/wc-dataextract-master.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DoutputLocation=mastercatalog
for %%k in (-1,-2,-3,-4,-5,-6,-7,-8,-9,-10,-20,-22,-1000) do (
  call F:\IBM\WCDE80\bin\dataextract %CURRDIR%/wc-dataextract-master-metadata.xml -DXmlValidation=false -DlogFilePath=%CURRDIR%/wc-dataextract-master-metadata-%%k.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DoutputLocation=mastercatalog -Dlangid=%%k
)
rem call F:\IBM\WCDE80\bin\dataextract %CURRDIR%/wc-dataextract-sales.xml -DlogFilePath=%CURRDIR%/wc-dataextract-sales-emr.log -DstoreIdentifier=EMR -DcatalogIdentifier=EMR_SALES_CATALOG -DoutputLocation=salescatalog-emr
rem call F:\IBM\WCDE80\bin\dataextract %CURRDIR%/wc-dataextract-sales.xml -DlogFilePath=%CURRDIR%/wc-dataextract-sales-fan.log -DstoreIdentifier=FAN -DcatalogIdentifier=FAN_SALES_CATALOG -DoutputLocation=salescatalog-fan
rem call F:\IBM\WCDE80\bin\dataextract %CURRDIR%/wc-dataextract-sales.xml -DlogFilePath=%CURRDIR%/wc-dataextract-sales-wsv.log -DstoreIdentifier=WSV -DcatalogIdentifier=WSV_SALES_CATALOG -DoutputLocation=salescatalog-wsv
rem call F:\IBM\WCDE80\bin\dataextract %CURRDIR%/wc-dataextract-sales.xml -DlogFilePath=%CURRDIR%/wc-dataextract-sales-proteam.log -DstoreIdentifier=ProTeam -DcatalogIdentifier=PROTEAM_SALES_CATALOG -DoutputLocation=salescatalog-proteam
rem call F:\IBM\WCDE80\bin\dataextract %CURRDIR%/wc-dataextract-sales.xml -DlogFilePath=%CURRDIR%/wc-dataextract-sales-proteam-lit.log -DstoreIdentifier=ProTeam -DcatalogIdentifier=PROTEAM_LITERATURE_CATALOG -DoutputLocation=salescatalog-proteam-lit
