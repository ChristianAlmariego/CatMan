# Retrieve Process Parameters
If ($args[0] -eq "dev" -Or $args[0] -eq "stage" -Or $args[0] -eq "prod" -Or $args[0] -eq "local") {
    $env = $args[0]
} Else {
    Write-Host "TransformPreProcess Error: Invalid Environment"
    Exit 1
}

If ($args[1] -eq "emr" -Or $args[1] -eq "wsv") {
    $store = $args[1]
} Else {
    Write-Host "TransformPreProcess Error: Invalid Store"
    Exit 1
}

If ($args[2] -eq "") {
    Write-Host "TransformPreProcess Error: Build Tag is Required"
    Exit 1
} Else {
    $build_tag = $args[2]
}

Write-Host "START - TRANSFORM PREPROCESS"
Write-Host "Initializing Variables"
Write-Host "Environment: " $env
Write-Host "Store: " $store
Write-Host "Build Tag: " $build_tag

## setup extended properties
$working_directory = (Get-Location).Path + "\"
$property_reader = $working_directory + "scripts\util\propertyReader.ps1"

## Initialize variables
$need_preprocess = $false

$js_file_ext = powershell $property_reader $env "app" "fileextensions.js"
$txt_file_ext = powershell $property_reader $env "app" "fileextensions.txt"
$log_file_ext = powershell $property_reader $env "app" "fileextensions.log"
$bat_file_ext = powershell $property_reader $env "app" "fileextensions.bat"

$catman_dir = powershell $property_reader $env "sys_spec" "catman.rootDirectory"
$catman_baseshared_dir = powershell $property_reader $env "sys_spec" "catman.baseSharedDirectory"
$wcbin_dir = powershell $property_reader $env "sys_spec" "catman.wcsBinDirectory"
$cmmodules_folder = powershell $property_reader $env "sys" "catman.cmModulesDirectory"
$transform_workspace_folder = powershell $property_reader $env "sys" "catman.workspaceDefault"
$resources_folder = powershell $property_reader $env "sys" "catman.wrkspcResource"
$tmp_folder = powershell $property_reader $env "sys" "catman.wrkspctmp"
$defaultdataextract_folder = powershell $property_reader $env "sys" "catman.wrkspcDefaultDataExtract"
$attrextract_folder = powershell $property_reader $env "sys" "catman.wrkspcAttrExtract"
$dataextract_folder = powershell $property_reader $env "sys" "catman.dataextractDirectory"

$request_compiler_script = powershell $property_reader $env "sys" "catman.requestCompiler"
$csv_trimmer_script = powershell $property_reader $env "sys" "catman.csvTrimmer"
$csv_clipper_script = powershell $property_reader $env "sys" "catman.csvClipper"
$preprocessor_script = powershell $property_reader $env "sys" "catman.preprocessor"
$dataextract_script = powershell $property_reader $env "sys" "wcsutil.dataextract"

$run_request_full_replace = powershell $property_reader $env "app" "transform.runrequestcode.catentryFullReplace"
$transform_process_code = powershell $property_reader $env "app" "catman.productTransform"
$transform_valid_requests_filename = powershell $property_reader $env "app" "file.name.validRequests"
$preprocess_extraction_filename = powershell $property_reader $env "app" "file.name.dataExtractPreProcess"

$dxdl_keywords_catentryattributes = powershell $property_reader $env "app" "dxdl.iokey.catentryattributes"
$dxdl_keywords_catentrysalescategories = powershell $property_reader $env "app" "dxdl.iokey.catentrysalescategories"

## start process
$request_compiler = $catman_dir + $cmmodules_folder + $request_compiler_script + $js_file_ext
$csv_trimmer = $catman_dir + $cmmodules_folder + $csv_trimmer_script + $js_file_ext
$csv_clipper = $catman_dir + $cmmodules_folder + $csv_clipper_script + $js_file_ext
$preprocessor = $catman_dir + $cmmodules_folder + $preprocessor_script + $js_file_ext
$dataextract = $wcbin_dir + $dataextract_script + $bat_file_ext

$resources_tmp_path = $catman_dir + $transform_workspace_folder + $resources_folder + $tmp_folder
$transform_valid_requests = $catman_dir + $transform_workspace_folder + $resources_folder + $transform_valid_requests_filename + "-" + $build_tag + $txt_file_ext
$preprocess_extraction = $catman_dir + $transform_workspace_folder + $resources_folder + $preprocess_extraction_filename + "-" + $build_tag + $txt_file_ext

$loadorder_catentryattrrelfull = "CatalogEntryAttributeDictionaryAttributeRelationshipFull"
$loadorder_catentrysalescategories = "CatalogEntrySalesCategories"
$extract_config_master = $working_directory + $dataextract_folder + "wc-dataextract-master.xml"
$extract_boconfig_catentryattrrelfull = $catman_dir + $dataextract_folder + "wc-extract-attrdictcatalogentryrel-full.xml"
$extract_boconfig_catentryattrrelfull_runnable = $catman_dir + $dataextract_folder + "wc-extract-attrdictcatalogentryrel-full-runnable.xml"
$extract_boconfig_salescategory = $catman_dir + $dataextract_folder + "wc-extract-default-salescategory-partnum.xml"
$extract_boconfig_salescategory_runnable = $catman_dir + $dataextract_folder + "wc-extract-default-salescategory-partnum-runnable.xml"

# compile catalog and control files
Write-Host "Request Compiler - "$transform_process_code
node $request_compiler "$env" "$transform_process_code" "$build_tag"

# trim catalog files for full replace
If (Test-Path $transform_valid_requests -PathType Leaf) {
    Write-Host "CSV Trimmer - Trim Catalog Files for PreProcessing"

    # read compiled requests file
    $file_content = Get-Content $transform_valid_requests

    Foreach ($content_line In $file_content) {
        $content_line_array = $content_line.Split('|', [System.StringSplitOptions]::None)

        # read the content
        #$control_file_name = $content_line_array[0]
        $catalog_file_name = $content_line_array[1]
        #$contact_email = $content_line_array[2]
        #$contact_name = $content_line_array[3]
        $run_request = $content_line_array[4]

        # run request checking that needs preprocessing
        If ($run_request -eq $run_request_full_replace) {
            $retained_headers = "Code,Full Path,Catalog Entry Type,Manufacturer,Manufacturer part number,Locale"
            $catalog_file_for_trimming = $catman_baseshared_dir + $transform_workspace_folder + $catalog_file_name

            If (Test-Path $catalog_file_for_trimming -PathType Leaf) {
                node $csv_trimmer "$build_tag" "$catalog_file_for_trimming" "$resources_tmp_path" "$retained_headers"
                Write-Host $catalog_file_name" - done"

                # toggle trigger for preprocessing
                If (-not $need_preprocess) {
                    $need_preprocess = $true
                }
            }
        }
    }
}

If ($need_preprocess) {
    # start preprocessing
    Write-Host "PreProcessor - "$transform_process_code
    node $preprocessor "$env" "$transform_process_code" "$build_tag"

    # preprocess extractions
    If (Test-Path $preprocess_extraction -PathType Leaf) {
        Write-Host "DataExtract - Preprocessing"

        # read preprocess file file
        $file_content = Get-Content $preprocess_extraction
        
        Foreach ($content_line In $file_content) {
            $content_line_array = $content_line.Split('|', [System.StringSplitOptions]::None)

            # read the content
            $language_id = $content_line_array[0]
            $batch_number = $content_line_array[1]
            $partnumbers = $content_line_array[2]

            Write-Host "Batch Number: "$batch_number
            Write-Host "Language ID: "$language_id

            # local variables
            $output_location = $working_directory + $transform_workspace_folder + $resources_folder + $attrextract_folder
            $filenaming_reference = $build_tag + $language_id + "-" + $batch_number

            Write-Host "Attribute and Attribute Values Extraction..."
            
            Get-Content "$extract_boconfig_catentryattrrelfull" | ForEach-Object{$_ -replace  "\$\{partNumber\}", "$partnumbers"} | Out-File "$extract_boconfig_catentryattrrelfull_runnable" -Encoding utf8
            #TBD: for code refactoring - dynamic params
            $extractParams = New-Object System.Collections.ArrayList
            $extractParams.Add("$extract_config_master") > $null
            $extractParams.Add("-DXmlValidation=false") > $null
            $extractParams.Add("-DenvPath=" + $working_directory + $dataextract_folder) > $null
            $extractParams.Add("-DLoadOrder=" + $loadorder_catentryattrrelfull) > $null
            $extractParams.Add("-DlogFilePath=" + $working_directory + $transform_workspace_folder + $resources_folder + "wc-dataextract-attr-" + $build_tag + $language_id + "-" + $batch_number + $log_file_ext) > $null
            $extractParams.Add("-DstoreIdentifier=EmersonCAS") > $null
            $extractParams.Add("-DcatalogIdentifier=EmersonCAS") > $null
            $extractParams.Add("-DlangId=" + $language_id) > $null
            $extractParams.Add("-DoutputLocation=" + $output_location + $filenaming_reference + "-catentry") > $null
            #TBD: end

            Start-Process $dataextract -ArgumentList $extractParams -NoNewWindow -Wait

            # clip extract output per partnum
            $extract_csv_for_clipping = $output_location + $filenaming_reference + "-catentryattrrel-output.csv"
            node $csv_clipper $extract_csv_for_clipping $output_location $dxdl_keywords_catentryattributes 2 2 1 1 TRUE TRUE TRUE

            # cleanup temp files
            Remove-Item $extract_boconfig_catentryattrrelfull_runnable
            Remove-Item $extract_csv_for_clipping

            If ($language_id -eq -1) {
                # local variables
                $output_location = $working_directory + $transform_workspace_folder + $resources_folder + $defaultdataextract_folder
                $filenaming_reference = $build_tag + "-" + $batch_number

                # for default data extraction (only considers default locale "en_US")
                Write-Host "Default Data Extraction..."
    
                Get-Content "$extract_boconfig_salescategory" | ForEach-Object{$_ -replace  "\$\{partNumber\}", "$partnumbers"} | Out-File "$extract_boconfig_salescategory_runnable" -Encoding utf8
                #TBD: for code refactoring - dynamic params
                $extractParams = New-Object System.Collections.ArrayList
                $extractParams.Add("$extract_config_master") > $null
                $extractParams.Add("-DXmlValidation=false") > $null
                $extractParams.Add("-DenvPath=" + $working_directory + $dataextract_folder) > $null
                $extractParams.Add("-DLoadOrder=" + $loadorder_catentrysalescategories) > $null
                $extractParams.Add("-DlogFilePath=" + $working_directory + $transform_workspace_folder + $resources_folder + "wc-dataextract-defaultdata-" + $build_tag + $language_id + "-" + $batch_number + $log_file_ext) > $null
                $extractParams.Add("-DstoreIdentifier=EmersonCAS") > $null
                $extractParams.Add("-DcatalogIdentifier=EmersonCAS") > $null
                $extractParams.Add("-DlangId=" + $language_id) > $null
                $extractParams.Add("-DoutputLocation=" + $output_location + $filenaming_reference + "-catentry") > $null
                #TBD: end
    
                Start-Process $dataextract -ArgumentList $extractParams -NoNewWindow -Wait

                # clip extract output per partnum
                $extract_csv_for_clipping = $output_location + $filenaming_reference + "-catentrysalescategories-output.csv"
                node $csv_clipper $extract_csv_for_clipping $output_location $dxdl_keywords_catentrysalescategories 2 2 1 1 TRUE TRUE TRUE

                # cleanup temp files
                Remove-Item $extract_boconfig_salescategory_runnable
                Remove-Item $extract_csv_for_clipping
            }
        }
    }
}

Write-Host "END - TRANSFORM PREPROCESS"