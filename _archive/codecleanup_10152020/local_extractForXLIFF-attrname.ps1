$CATMANDIR = "F:\catman\catalogmanager\"
$BASEDIR = "F:\catman\catalogmanager\TMS\CatMan\"
$DATAEXTRACT_CMD = "F:\IBM\WCDE80\bin\dataextract.bat"

$LANGUAGEID = -7
$STORE = "emr"

Write-Host "Data Extract - START"
$prmExtract = New-Object System.Collections.ArrayList
$prmExtract.Add($CATMANDIR + "dataextract\wc-dataextract-master.xml") > $null
$prmExtract.Add("-DXmlValidation=false") > $null
$prmExtract.Add("-DenvPath=" + $CATMANDIR + "\dataextract\") > $null
$prmExtract.Add("-DLoadOrder=AttributeDictionaryAttributeAndAllowedValues") > $null
$prmExtract.Add("-DlogFilePath=$BASEDIR/ExtractForXLIFF/wc-dataextract-master-attrname.log") > $null
$prmExtract.Add("-DstoreIdentifier=EmersonCAS") > $null
$prmExtract.Add("-DcatalogIdentifier=EmersonCAS") > $null
$prmExtract.Add("-DlangId=$LANGUAGEID") > $null
$prmExtract.Add("-DoutputLocation=" + $BASEDIR + "ExtractForXLIFF/attrname" + $e) > $null


Start-Process "$DATAEXTRACT_CMD" -ArgumentList $prmExtract -NoNewWindow -Wait
Write-Host "Data Extract - END"


Write-Host "Export Translation - START"
$export_translation = $CATMANDIR + 'exporttranslation-attrname.js'
node $export_translation 'local' $STORE $LANGUAGEID
Write-Host "Export Translation - END"
