
#ASSIGN NEW
$dataloadparamdeletion = New-Object System.Collections.ArrayList

$dataloadparamdeletion.Add("C:\mrjc\workspaces\catman\vscode\cmupgrade\dataload\wc-dataload-master.xml") > $null
$dataloadparamdeletion.Add("-DXmlValidation=false") > $null
$dataloadparamdeletion.Add("-DenvPath=C:\mrjc\workspaces\catman\vscode\cmupgrade\dataload\") > $null
$dataloadparamdeletion.Add("-DLoadOrder=CatalogEntryMasterCategory") > $null
$dataloadparamdeletion.Add("-DlogFilePath=C:\mrjc\workspaces\catman\vscode\cmupgrade\") > $null
$dataloadparamdeletion.Add("-DstoreIdentifier=EmersonCAS") > $null
$dataloadparamdeletion.Add("-DcatalogIdentifier=EmersonCAS") > $null
$dataloadparamdeletion.Add("-DlangId=-1") > $null
$dataloadparamdeletion.Add("-DoutputLocation=C:\mrjc\workspaces\catman\vscode\cmupgrade\dataload\EMR\") > $null
$dataloadparamdeletion.Add("-Dbatchfile=1.0.10001") > $null

Start-Process F:/IBM/WCDE80/bin/dataload.bat -ArgumentList $dataloadparamdeletion -NoNewWindow -Wait
