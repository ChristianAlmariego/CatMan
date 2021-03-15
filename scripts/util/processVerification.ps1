# Retrieve Process Parameters
If ($args[0] -eq "dev" -Or $args[0] -eq "stage" -Or $args[0] -eq "prod" -Or $args[0] -eq "local") {
  $env = $args[0]
} Else {
  Write-Host "Process verification Error: Invalid Environment"
  Exit 1
}

If ($args[1] -eq "") {
  Write-Host "Process verification Error: Build Tag is Required"
  Exit 1
} Else {
  $build_tag = $args[1]
}

$process_code=$args[2]
$store="emr"

Write-Host "START - PROCESS VERIFICATION"
Write-Host "Initializing Variables"
Write-Host "Environment: " $env
Write-Host "Build Tag: " $build_tag
Write-Host "Process Code: " $process_code

## setup extended properties
$working_directory = (Get-Location).Path + "\"
$property_reader = $working_directory + "scripts\util\propertyReader.ps1"

## Initialize variables
$wcbin_dir = powershell $property_reader $env "sys_spec" "catman.wcsBinDirectory"
$catman_dir = powershell $property_reader $env "sys_spec" "catman.rootDirectory"

$scripts_folder = powershell $property_reader $env "sys" "catman.scriptsDirectory"
$util_folder = powershell $property_reader $env "sys" "catman.utilFolder"
$attrwrkspc_folder = powershell $property_reader $env "sys" "catman.workspaceAttributesAndAttrValues"
$dataextract_folder = powershell $property_reader $env "sys" "catman.dataextractDirectory"
$requests_folder = powershell $property_reader $env "sys" "catman.requestsDirectory"
$resources_folder = powershell $property_reader $env "sys" "catman.wrkspcResource"

$transform_processcode = powershell $property_reader $env "app" "catman.productTransform"
$manageattr_processCode = powershell $property_reader $env "app" "catman.manageAttributes"

$attrvalupdate_ref = powershell $property_reader $env "app" "file.name.attrValUpdates"

$attrvalupdate_reffile = $catman_dir + $requests_folder + $attrwrkspc_folder + $resources_folder + $attrvalupdate_ref + "-" + $build_tag + ".txt"
$processVerification = $catman_dir + $scripts_folder + $util_folder + "processVerification.js"
$extract_config_master = $working_directory + $dataextract_folder + "wc-dataextract-master.xml"
$extract_boconfig_attrvallkup = $catman_dir + $dataextract_folder + "wc-extract-attrdictattrval-lkup.xml"
$extract_boconfig_attrvallkup_runnable = $catman_dir + $dataextract_folder + "wc-extract-attrdictattrval-lkup-runnable.xml"
$dataextract = $wcbin_dir + "dataextract.bat"

# wcs utility params
$extractParams = New-Object System.Collections.ArrayList

$wcs_params_javasec="-Djava.security.egd=file:/dev/./urandom"
$wcs_params_xmlvalidation="-DXmlValidation=false"
$wcs_params_storeId="-DstoreIdentifier=EmersonCAS"
$wcs_params_catalogId="-DcatalogIdentifier=EmersonCAS"

$wcs_params_loadorder="-DLoadOrder="
$wcs_params_logfilepath="-DlogFilePath="
$wcs_params_langId="-DlangId="
$wcs_params_envPath="-DenvPath="
$wcs_params_outputLocation="-DoutputLocation="

## check for process code
If ($process_code -eq $transform_processcode) {
  ## TBD - transform
}

If ($process_code -eq $manageattr_processCode) {
  ## dataextract of attr lookup csv 
  Write-Host "Execute Verification Process - Manage Attributes"
  Write-Host "Start Attribute Data Extract..."

  $extractParams.Add($extract_config_master) > $null
  $extractParams.Add($wcs_params_xmlvalidation) > $null
  $extractParams.Add($wcs_params_envPath + $working_directory + $dataextract_folder) > $null
  $extractParams.Add($wcs_params_loadorder + "AttributeDictionaryAttributeAndAllowedValues") > $null
  $extractParams.Add($wcs_params_logfilepath + $working_directory + $requests_folder + $attrwrkspc_folder + $resources_folder + "wc-dataextract-attr-" + $build_tag + ".log") > $null
  $extractParams.Add($wcs_params_storeId) > $null
  $extractParams.Add($wcs_params_catalogId) > $null
  $extractParams.Add($wcs_params_langId + "-1") > $null
  $extractParams.Add($wcs_params_outputLocation + $working_directory + $requests_folder + $attrwrkspc_folder + $resources_folder) > $null

  Start-Process $dataextract -ArgumentList $extractParams -NoNewWindow -Wait

  # remove 1st line header for lookup compatibility
  $extractattrdict = $working_directory + $requests_folder + $attrwrkspc_folder + $resources_folder + "attrdictattr-output.csv"
  (Get-Content $extractattrdict | Select-Object -Skip 1) | Set-Content $extractattrdict

  If (Test-Path $attrvalupdate_reffile -PathType Leaf) {
    ## dataextract of attr val lookup csv (attr identifier specific)
    Write-Host "Start Attribute Values Data Extract (Attribute Identifier Specific)..."

    # read attrvalupdate reference file
    $file_content = Get-Content $attrvalupdate_reffile
    $attributeidentifiers = ""
    $lastAttrIdentifier = $file_content | Select-Object -Last 1
    
    Foreach ($content_line In $file_content) {
      $attributeidentifiers = $attributeidentifiers + "'" + $content_line + "'"

      If ($content_line -ne $lastAttrIdentifier) {
        $attributeidentifiers = $attributeidentifiers + ","
      }
    }

    Get-Content "$extract_boconfig_attrvallkup" | ForEach-Object{$_ -replace  "\$\{AttrIdentifier\}", "$attributeidentifiers"} | Out-File "$extract_boconfig_attrvallkup_runnable" -Encoding utf8

    $extractParams.Add($wcs_params_loadorder + "AttributeDictionaryAttributeAllowedValuesLkup") > $null
    $extractParams.Add($wcs_params_logfilepath + $working_directory + $requests_folder + $attrwrkspc_folder + $resources_folder + "wc-dataextract-attrval-" + $build_tag + ".log") > $null
    
    Start-Process $dataextract -ArgumentList $extractParams -NoNewWindow -Wait
    
    # remove 1st line header for lookup compatibility
    $extractattrvaldict = $working_directory + $requests_folder + $attrwrkspc_folder + $resources_folder + "attrdictattrallowvals-lkup-output.csv"
    (Get-Content $extractattrvaldict | Select-Object -Skip 1) | Set-Content $extractattrvaldict

    # cleanup temp files
    Remove-Item $extract_boconfig_attrvallkup_runnable
  }

  # start verification process
  node $processVerification $env $build_tag $manageattr_processCode
}

