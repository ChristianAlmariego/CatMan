
$CATMANDIR = "F:\catman\catalogmanager\"
$DATAEXTRACT_CMD = "F:\IBM\WCDE80\bin\dataextract.bat"

Clear-Host
Write-Host "START - PROCESSING"


$prmExtract = New-Object System.Collections.ArrayList
$prmExtract.Add($CATMANDIR + "dataextract\wc-dataextract-autosol-sequence.xml")
$prmExtract.Add("-DXmlValidation=false")
$prmExtract.Add("-DlogFilePath=" + $CATMANDIR  + "\dataextract\logs\wc-dataextract-AutoSol-sequence.xml.log")
$prmExtract.Add("-DstoreIdentifier=EmersonCAS")
$prmExtract.Add("-DcatalogIdentifier=EMR_SALES_CATALOG")
$prmExtract.Add("-DlangId=-1")
$prmExtract.Add("-DenvPath=" + $CATMANDIR + "\dataextract\")
$prmExtract.Add("-DoutputLocation=" + $CATMANDIR  + "\CatMan\Export\SalesCategorySequencing\")


$prmExtract = New-Object System.Collections.ArrayList
$prmExtract.Add($CATMANDIR + "dataextract\wc-dataextract-comres-sequence.xml")
$prmExtract.Add("-DXmlValidation=false")
$prmExtract.Add("-DlogFilePath=" + $CATMANDIR  + "\dataextract\logs\wc-dataextract-ComRes-sequence.xml.log")
$prmExtract.Add("-DstoreIdentifier=EmersonCAS")
$prmExtract.Add("-DcatalogIdentifier=EMR_SALES_CATALOG")
$prmExtract.Add("-DlangId=-1")
$prmExtract.Add("-DenvPath=" + $CATMANDIR + "\dataextract\")
$prmExtract.Add("-DoutputLocation=" + $CATMANDIR  + "\CatMan\Export\SalesCategorySequencing\")



Start-Process "$DATAEXTRACT_CMD" -ArgumentList $prmExtract -NoNewWindow -Wait

Write-Host "END-PROCESSING"
