
$CATMANDIR = "F:\CatalogManager\catalogmanager\"
$BASEDIR = "F:\CatalogManager\catalogmanager\TMS\CatMan\"

$LANGUAGEID = -1
$STORE = "emr"
$CURRENTDIR = (Get-Location).Path
$DATAEXTRACTXMLDIR = $CATMANDIR + "dataextract"
$DATALOAD_CMD = "F:\IBM\WCDE80\bin\dataload.bat"
$DATAEXTRACT_CMD = "F:\IBM\WCDE80\bin\dataextract.bat"

Clear-Host

Write-Host "START - PROCESSING"
Write-Host "Initializing Variables"
Write-Host "Store:" $STORE
Write-Host "CatMan Directory:" $CATMANDIR
Write-Host "Current Directory:" $CURRENTDIR
Write-Host "Base Directory: " $BASEDIR
Write-Host 

cd $CATMANDIR"dataextract"
$read_controlfile = $CATMANDIR + 'cm_modules\util-tms-readcontrolfile.js'
node $read_controlfile "Translation" 'local' $STORE $LANGUAGEID
 
Get-ChildItem $BASEDIR"ExtractForXLIFF" -Filter "tms-export-control-*.txt" |
Foreach-Object {
    $content = Get-Content $_.FullName
    $exportControlName = $_.Name
    Write-Host "Processing: " $exportControlName
    foreach ($lineContent in $content) {
        $contentList = $lineContent.Split('|', [System.StringSplitOptions]::None) 
        Write-Host $lineContent

        #read the content
        $a = $contentList[0]; Write-Host 'a: '$a
        $b = $contentList[1]; Write-Host 'b: '$b
        $c = $contentList[2]; Write-Host 'c: '$c
        $d = $contentList[3]; Write-Host 'd: '$d
        $e = $contentList[4]; Write-Host 'e: '$e
        $f = $contentList[5]; Write-Host 'f: '$f
        $g = $contentList[6]; Write-Host 'g: '$g
        $h = $contentList[7]; Write-Host 'h: '$h
        
        #generate the runnable files
        $g = $g -replace "''", "'"
        Write-Host 'g: '$g
               
        if ($exportControlName -like '*category*') {
            # batching of how many categories per process implemented inside util-tms-readcontrolfile.js
            
            Write-Host "Processing category"
            cat $CATMANDIR"dataextract\wc-extract-attrdictattrval.xml" | %{$_ -replace  "\$\{catGroupId\}", "$g"} | Out-File $CATMANDIR"dataextract\wc-extract-attrdictattrval-runnable.xml" -Encoding utf8
            cat $CATMANDIR"dataextract\wc-extract-attrdictcatalogentryrel.xml" | %{$_ -replace  "\$\{catGroupId\}", "$g"} | Out-File $CATMANDIR"dataextract\wc-extract-attrdictcatalogentryrel-runnable.xml" -Encoding utf8
            cat $CATMANDIR"dataextract\wc-extract-catalogentrydesc.xml" | %{$_ -replace  "\$\{catGroupId\}", "$g"} | Out-File $CATMANDIR"dataextract\wc-extract-catalogentrydesc-runnable.xml" -Encoding utf8
            cat $CATMANDIR"dataextract\wc-extract-cataloggroupdesc.xml" | %{$_ -replace  "\$\{catGroupId\}", "'Automation-Solutions','Commercial-and-Residential-Solutions'"} | Out-File $CATMANDIR"dataextract\wc-extract-cataloggroupdesc-runnable.xml" -Encoding utf8
    
            $prmExtract = New-Object System.Collections.ArrayList
            $prmExtract.Add($CATMANDIR + "dataextract\wc-dataextract-master.xml") > $null
            $prmExtract.Add("-DXmlValidation=false") > $null
            $prmExtract.Add("-DenvPath=" + $CATMANDIR + "\dataextract\") > $null
            $prmExtract.Add("-DLoadOrder=CatalogEntryAttributeDictionaryAttributeRelationship,CatalogEntryDescription") > $null
            $prmExtract.Add("-DlogFilePath=$BASEDIR/ExtractForXLIFF/wc-dataextract-master.log") > $null
            $prmExtract.Add("-DstoreIdentifier=EmersonCAS") > $null
            $prmExtract.Add("-DcatalogIdentifier=EmersonCAS") > $null
            $prmExtract.Add("-DlangId=$f") > $null
            $prmExtract.Add("-DoutputLocation=" + $BASEDIR + "ExtractForXLIFF/catentry" + $e) > $null

            cd $DATAEXTRACTXMLDIR
            Start-Process "$DATAEXTRACT_CMD" -ArgumentList $prmExtract -NoNewWindow -Wait

            cd ..

            # Create batch files for processing
            $csv_clipper = $CATMANDIR + 'cm_modules\csvClipper.js'
            $batch_processing_output_location = $CATMANDIR + 'TMS/CatMan/ExtractForXLIFF/batchProcessing/'
            $catdesc_batching_filename = 'catDesc'
            $attrVal_batching_filename = 'attrVal'
            $catdesc_export_file = $CATMANDIR + "TMS/CatMan/ExtractForXLIFF/catentry" + $e + "desc-output.csv"
            $attrval_export_file = $CATMANDIR + "TMS/CatMan/ExtractForXLIFF/catentry" + $e + "attrrel-output.csv"

            node $csv_clipper $catdesc_export_file $batch_processing_output_location $catdesc_batching_filename 2 2 1 300
            node $csv_clipper $attrval_export_file $batch_processing_output_location $attrVal_batching_filename 2 2 1 300

            # Process batch files
            $export_translation = $CATMANDIR + 'exporttranslation.js'
            
            $batching_file_count = Get-ChildItem $batch_processing_output_location | Measure-Object | %{$_.Count}
            $batchCount = $batching_file_count / 2
            #TODO: refer to log file instead of counting files
            $batchCount = $batchCount - 1
            $batchCounter = 0;

            while ($batchCounter -lt $batchCount) {
                $batchCounter++
                $catdesc_single_batch_file = $batch_processing_output_location + $catdesc_batching_filename + $batchCounter + '.csv'
                $attrval_single_batch_file = $batch_processing_output_location + $attrVal_batching_filename + $batchCounter + '.csv'

                node $export_translation 'local' $STORE $b $c `"$($d)`" $e $f $g `"$($h)`" 'category' 'N' $catdesc_single_batch_file $attrval_single_batch_file | Out-File  $BASEDIR"ExtractForXLIFF\extractForXLIFF.out"
            }

            # Remove batch files for processing
            Remove-Item -path 'TMS/CatMan/ExtractForXLIFF/batchProcessing/' -include *.* -recurse
        }

        if ($exportControlName -like '*item*') {
            # batching of how many partnumbers per process implemented inside util-tms-readcontrolfile.js

            Write-Host "Processing item"
            cat $CATMANDIR"dataextract\wc-extract-attrdictcatalogentryrel-item.xml" | %{$_ -replace  "\$\{partNumber\}", "$g"} | Out-File $CATMANDIR"dataextract\wc-extract-attrdictcatalogentryrel-item-runnable.xml" -Encoding utf8
            cat $CATMANDIR"dataextract\wc-extract-catalogentrydesc-item.xml" | %{$_ -replace  "\$\{partNumber\}", "$g"} | Out-File $CATMANDIR"dataextract\wc-extract-catalogentrydesc-item-runnable.xml" -Encoding utf8
    
            $prmExtract = New-Object System.Collections.ArrayList
            $prmExtract.Add($CATMANDIR + "dataextract\wc-dataextract-master.xml") > $null
            $prmExtract.Add("-DXmlValidation=false") > $null
            $prmExtract.Add("-DenvPath=" + $CATMANDIR + "\dataextract\") > $null
            $prmExtract.Add("-DLoadOrder=CatalogEntryAttributeDictionaryAttributeRelationshipItemLevel,CatalogEntryDescriptionItemLevel") > $null
            $prmExtract.Add("-DlogFilePath=$BASEDIR/ExtractForXLIFF/wc-dataextract-master.log") > $null
            $prmExtract.Add("-DstoreIdentifier=EmersonCAS") > $null
            $prmExtract.Add("-DcatalogIdentifier=EmersonCAS") > $null
            $prmExtract.Add("-DlangId=$f") > $null
            $prmExtract.Add("-DoutputLocation=" + $BASEDIR + "ExtractForXLIFF/catentry" + $e) > $null

            cd $DATAEXTRACTXMLDIR
            Start-Process "$DATAEXTRACT_CMD" -ArgumentList $prmExtract -NoNewWindow -Wait

            cd ..
            $export_translation = $CATMANDIR + 'exporttranslation.js'
            node $export_translation 'local' $STORE $b $c '$d' $e $f $g $h 'item' | Out-File  $BASEDIR"ExtractForXLIFF\extractForXLIFF.out"
        }

    }

    Write-Host "END - PROCESSING" $_.Name

   
}

