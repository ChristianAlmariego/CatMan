$CATMANDIR = "F:\catman\catalogmanager\"
$DATALOAD_CMD = "F:\IBM\WCDE80\bin\dataload.bat"

Clear-Host

Write-Host "START - PROCESSING ATTRIBUTES"

$prmLoad = New-Object System.Collections.ArrayList
$prmLoad.Add($CATMANDIR + "dataload\wc-dataload-attributes.xml") > $null
$prmLoad.Add("-DXmlValidation=false") > $null
$prmLoad.Add("-DenvPath=" + $CATMANDIR + "dataload\") > $null
$prmLoad.Add("-DlogFilePath=" + $CATMANDIR + "dataload\logs\wc-dataload-attributes.log") > $null
$prmLoad.Add("-DstoreIdentifier=EmersonCAS") > $null
$prmLoad.Add("-DcatalogIdentifier=EmersonCAS") > $null
$prmLoad.Add("-DlangId=$f") > $null
$prmLoad.Add("-DoutputLocation=" + $CATMANDIR + "lookup_csv\") > $null


Start-Process "$DATALOAD_CMD" -ArgumentList $prmLoad -NoNewWindow -Wait

Write-Host "END - PROCESSING ATTRIBUTES"