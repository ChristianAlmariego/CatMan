$CATMANDIR = "F:\catman\catalogmanager\"
$DATAEXTRACT_CMD = "F:\IBM\WCDE80\bin\dataextract.bat"

Clear-Host
Write-Host "START - PROCESSING"


$paramPath = $CATMANDIR + "dataextract\"
Get-ChildItem $paramPath -Filter "wc-dataextract-emr-attribute-usage-*.txt" |
Foreach-Object {
    $exportControlName = $_.Name
    $content = Get-Content $_.FullName
    Write-Host "Processing: " $exportControlName
    foreach ($lineContent in $content) {
        Write-Host $lineContent
        $contentList = $lineContent.Split('|', [System.StringSplitOptions]::None) 
        $identifier = $contentList[0]
        $headerName = $contentList[1]

        $identifierFile = $identifier.Replace(" ", "")
        $identifierFile = $identifierFile.Replace("&", "")

        Write-Host 'IDENTIFIER: '$identifier
        Write-Host 'IDENTIFIER FILE: '$identifierFile
        Write-Host 'HEADER NAME: '$headerName

        cat $CATMANDIR"dataextract\wc-dataextract-attributeusage-cleanup.xml" | %{$_ -replace  "\$\{attributeIdentifier\}", "$identifierFile"} | Out-File $CATMANDIR"dataextract\wc-dataextract-attributeusage-cleanup-$identifierFile.xml" -Encoding utf8
        cat $CATMANDIR"dataextract\wc-extract-attributeusage-cleanup.xml" | %{$_ -replace  "\$\{attributeIdentifier\}", "$identifier"} | Out-File $CATMANDIR"dataextract\wc-extract-attributeusage-cleanup-temp-$identifierFile.xml" -Encoding utf8
        cat $CATMANDIR"dataextract\wc-extract-attributeusage-cleanup-temp-$identifierFile.xml" | %{$_ -replace  "\$\{TargetAttributeHeader\}", "$headerName"} | Out-File $CATMANDIR"dataextract\wc-extract-attributeusage-cleanup-$identifierFile.xml" -Encoding utf8

        $prmExtract = New-Object System.Collections.ArrayList
        $prmExtract.Add($CATMANDIR + "dataextract\wc-dataextract-attributeusage-cleanup-$identifierFile.xml") > $null
        $prmExtract.Add("-DXmlValidation=false") > $null
        $prmExtract.Add("-DlogFilePath=" + $CATMANDIR  + "\dataextract\logs\wc-dataextract-attributeusage-cleanup-xml-$identifierFile.log") > $null
        $prmExtract.Add("-DstoreIdentifier=EmersonCAS") > $null
        $prmExtract.Add("-DcatalogIdentifier=EmersonCAS") > $null
        $prmExtract.Add("-DlangId=-1") > $null
        $prmExtract.Add("-DenvPath=" + $CATMANDIR + "\dataextract\") > $null
        $prmExtract.Add("-DoutputLocation=" + $CATMANDIR  + "\dataextract\logs\") > $null

        Start-Process "$DATAEXTRACT_CMD" -ArgumentList $prmExtract -NoNewWindow -Wait


        }
    }

$fordeletion = $CATMANDIR + "dataextract\wc-dataextract-attributeusage-cleanup-*.xml"
$fordeletion2 = $CATMANDIR + "dataextract\wc-extract-attributeusage-cleanup-*.xml"
Remove-Item $fordeletion
Remove-Item $fordeletion2


Write-Host "END-PROCESSING"