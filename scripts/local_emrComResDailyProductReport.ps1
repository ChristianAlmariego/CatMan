$CATMANDIR = "F:\catman\catalogmanager\"
$DATAEXTRACT_CMD = "F:\IBM\WCDE80\bin\dataextract.bat"

Clear-Host
Write-Host "START - PROCESSING"


$prmExtract = New-Object System.Collections.ArrayList
$prmExtract.Add($CATMANDIR + "dataextract\wc-dataextract-emr-comres-product.xml")
$prmExtract.Add("-DXmlValidation=false")
$prmExtract.Add("-DlogFilePath=" + $CATMANDIR  + "\dataextract\logs\wc-dataextract-ComRes-product.xml.log")
$prmExtract.Add("-DstoreIdentifier=EmersonCAS")
$prmExtract.Add("-DcatalogIdentifier=EmersonCAS")
$prmExtract.Add("-DlangId=-1")
$prmExtract.Add("-DenvPath=" + $CATMANDIR + "\dataextract\")
$prmExtract.Add("-DoutputLocation=" + $CATMANDIR  + "\dataextract\logs\ComRes_")

Start-Process "$DATAEXTRACT_CMD" -ArgumentList $prmExtract -NoNewWindow -Wait

Write-Host "END-PROCESSING"