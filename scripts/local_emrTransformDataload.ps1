## Retrieve Process Parameters
If ($args.Contains("DisableLoad")) { $load_disabled = $true } Else { $load_disabled = $false }
If ($args.Contains("DisableExtract")) { $extract_disabled = $true } Else { $extract_disabled = $false }
If ($args.Contains("EnableInspect")) { $inspect_enabled = $true } Else { $inspect_enabled = $false }

## setup extended properties
$working_directory = (Get-Location).Path + "\"
$property_reader = $working_directory + "scripts\util\propertyReader.ps1"

## Initialize variables
$env = "local"
$store = "emr"
$build_tag = "1.0.0001"

$bat_file_ext = powershell $property_reader $env "app" "fileextensions.bat"

$transform_workspace_folder = powershell $property_reader $env "sys" "catman.workspaceDefault"
$resources_folder = powershell $property_reader $env "sys" "catman.wrkspcResource"
$tmp_folder = powershell $property_reader $env "sys" "catman.wrkspctmp"
$defaultdataextract_folder = powershell $property_reader $env "sys" "catman.wrkspcDefaultDataExtract"
$attrextract_folder = powershell $property_reader $env "sys" "catman.wrkspcAttrExtract"
$scripts_dir = powershell $property_reader $env "sys" "catman.scriptsDirectory"
$transform_dir = powershell $property_reader $env "sys" "catman.productTransform"

$transform_preprocess_filename = powershell $property_reader $env "sys" "catman.transformPreProcess"

$transform_preprocessor = $working_directory + $scripts_dir + $transform_dir + $transform_preprocess_filename + $sh_file_ext

$WCBINDIR = powershell $property_reader $env "sys_spec" "catman.wcsBinDirectory"
$DATALOAD_SCRIPT = powershell $property_reader $env "sys" "wcsutil.dataload"
$DATAEXTRACT_SCRIPT = powershell $property_reader $env "sys" "wcsutil.dataextract"
$DATALOAD_CMD = $WCBINDIR + $DATALOAD_SCRIPT + $bat_file_ext
$DATAEXTRACT_CMD = $WCBINDIR + $DATAEXTRACT_SCRIPT + $bat_file_ext

#TBD: for code refactoring - arrange variables
$CATMANDIR = $working_directory
$LANGUAGEID = -1
$TARGETSTORE = $store
$TARGETENV = $env
$BATCHFILE = ""
#TBD: end

## start process
Clear-Host

Write-Host "START - TRANSFORM PROCESS"
Write-Host "Initializing Variables"
Write-Host "CatMan Directory:" $CATMANDIR

If ($extract_disabled) {
    Write-Host "WARNING - Master Partnumber Lookup CSV Extaction is disabled"
    Write-Host "Lookup CSV File - mastercatalogPartNumber.csv will not be updated."
} 
Else {
    #partnumber dataeextract
    Write-Host "Start Extract - PartNumber"
    $prmExtractPartNumber = New-Object System.Collections.ArrayList
    $prmExtractPartNumber.Add($CATMANDIR + "dataextract\wc-dataextract-partnumber.xml") > $null
    $prmExtractPartNumber.Add("-DXmlValidation=false") > $null
    $prmExtractPartNumber.Add("-DenvPath=" + $CATMANDIR + "\dataextract\") > $null
    $prmExtractPartNumber.Add("-DlogFilePath=" + $CATMANDIR  + "\dataextract\logs\wc-dataextract-partnumber-xml.log") > $null
    $prmExtractPartNumber.Add("-DoutputLocation=" + $CATMANDIR + "lookup_csv\") > $null
    $prmExtractPartNumber.Add("-DstoreIdentifier=EmersonCAS") > $null
    $prmExtractPartNumber.Add("-DcatalogIdentifier=EmersonCAS") > $null
    $prmExtractPartNumber.Add("-DlangId=" + $LANGUAGEID) > $null

    #comment the next line if you don't want to extract a new copy of part number
    Start-Process "$DATAEXTRACT_CMD" -ArgumentList $prmExtractPartNumber -NoNewWindow -Wait
    Write-Host "End Extract - PartNumber"
}

## execute preprocess
powershell $transform_preprocessor $env $store $build_tag

## execute - transformation
Write-Host "Start - Transformation"
#run transform
$emrcatalogmanager = $CATMANDIR + 'emrcatalogmanager.js'

if ($inspect_enabled) {
    node --inspect --inspect-brk $emrcatalogmanager $TARGETENV $TARGETSTORE $build_tag
}
Else {
    node $emrcatalogmanager $TARGETENV $TARGETSTORE $build_tag
}

## execute postprocess - temp files removal
Remove-Item "$CATMANDIR$transform_workspace_folder$resources_folder*$build_tag*"
Remove-Item "$CATMANDIR$transform_workspace_folder$resources_folder$tmp_folder*$build_tag*"
Remove-Item "$CATMANDIR$transform_workspace_folder$resources_folder$defaultdataextract_folder*$build_tag*"
Remove-Item "$CATMANDIR$transform_workspace_folder$resources_folder$attrextract_folder*$build_tag*"

Write-Host "End - Transformation"

if ($load_disabled) {
    Write-Host "WARNING - Dataload Utility is disabled"
    Write-Host "There will be no dataload process to be triggered."
}
Else {
    #execute - data load
    $OUTPUTPATH = $CATMANDIR + "dataload\EMR\"
    Get-ChildItem $outputPath -Filter "dataload_csv_*.txt" |
    Foreach-Object {
        $exportControlName = $_.Name
        $BATCHFILE = Get-Content $_.FullName
        Write-Host "Processing: " $exportControlName
        Write-Host "Batch ID: " $BATCHFILE
        }

    Write-Host "Batch for Processing: " $BATCHFILE

    
    Write-Host "START Dataload - Master Deletion"
    $prmLoadSeo = New-Object System.Collections.ArrayList
    $prmLoadSeo.Add($CATMANDIR + "dataload\wc-dataload-master-delete.xml") > $null
    $prmLoadSeo.Add("-DXmlValidation=false") > $null
    $prmLoadSeo.Add("-DenvPath=" + $CATMANDIR + "dataload\") > $null
    $prmLoadSeo.Add("-DlogFilePath=" + $CATMANDIR + "dataload\logs\wc-dataload-master-delete-xml-" + $BATCHFILE + ".log") > $null
    $prmLoadSeo.Add("-DstoreIdentifier=EmersonCAS") > $null
    $prmLoadSeo.Add("-DcatalogIdentifier=EmersonCAS") > $null
    $prmLoadSeo.Add("-DlangId=$LANGUAGEID") > $null
    $prmLoadSeo.Add("-DoutputLocation=" + $OUTPUTPATH) > $null
    $prmLoadSeo.Add("-Dbatchfile=" + $BATCHFILE) > $null

    Start-Process "$DATALOAD_CMD" -ArgumentList $prmLoadSeo -NoNewWindow -Wait
    Write-Host "END Dataload - Master Deletion"


    Write-Host "START Dataload - Master"
    $prmLoadMaster = New-Object System.Collections.ArrayList
    $prmLoadMaster.Add($CATMANDIR + "dataload\wc-dataload-master.xml") > $null
    $prmLoadMaster.Add("-DXmlValidation=false") > $null
    $prmLoadMaster.Add("-DenvPath=" + $CATMANDIR + "dataload\") > $null
    $prmLoadMaster.Add("-DlogFilePath=" + $CATMANDIR + "dataload\logs\wc-dataload-master-xml-" + $BATCHFILE + ".log") > $null
    $prmLoadMaster.Add("-DstoreIdentifier=EmersonCAS") > $null
    $prmLoadMaster.Add("-DcatalogIdentifier=EmersonCAS") > $null
    $prmLoadMaster.Add("-DlangId=$LANGUAGEID") > $null
    $prmLoadMaster.Add("-DoutputLocation=" + $OUTPUTPATH) > $null
    $prmLoadMaster.Add("-Dbatchfile=" + $BATCHFILE) > $null

    Start-Process "$DATALOAD_CMD" -ArgumentList $prmLoadMaster -NoNewWindow -Wait
    Write-Host "END Dataload - Master"


    Write-Host "START Dataload - SEO"
    $prmLoadSeo = New-Object System.Collections.ArrayList
    $prmLoadSeo.Add($CATMANDIR + "dataload\wc-dataload-master-seo.xml") > $null
    $prmLoadSeo.Add("-DXmlValidation=false") > $null
    $prmLoadSeo.Add("-DenvPath=" + $CATMANDIR + "dataload\") > $null
    $prmLoadSeo.Add("-DlogFilePath=" + $CATMANDIR + "dataload\logs\wc-dataload-master-seo-xml-" + $BATCHFILE + ".log") > $null
    $prmLoadSeo.Add("-DstoreIdentifier=EmersonCAS") > $null
    $prmLoadSeo.Add("-DcatalogIdentifier=EmersonCAS") > $null
    $prmLoadSeo.Add("-DlangId=$LANGUAGEID") > $null
    $prmLoadSeo.Add("-DoutputLocation=" + $OUTPUTPATH) > $null
    $prmLoadSeo.Add("-Dbatchfile=" + $BATCHFILE) > $null

    Start-Process "$DATALOAD_CMD" -ArgumentList $prmLoadSeo -NoNewWindow -Wait
    Write-Host "END Dataload - SEO"
    


    #TBD: Update local script to include Sales Category Dataload and SEO (PageTitle and Metadesc) Dataload
}