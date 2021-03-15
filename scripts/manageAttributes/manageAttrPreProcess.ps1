# Retrieve Process Parameters
If ($args[0] -eq "dev" -Or $args[0] -eq "stage" -Or $args[0] -eq "prod" -Or $args[0] -eq "local") {
  $env = $args[0]
} Else {
  Write-Host "ManageAttrPreProcess Error: Invalid Environment"
  Exit 1
}

If ($args[1] -eq "") {
  Write-Host "ManageAttrPreProcess Error: Build Tag is Required"
  Exit 1
} Else {
  $build_tag = $args[1]
}

$store="emr"

Write-Host "START - MANAGE ATTRIBUTE PREPROCESS"
Write-Host "Initializing Variables"
Write-Host "Environment: " $env
Write-Host "Store: " $store
Write-Host "Build Tag: " $build_tag

## setup extended properties
$working_directory = (Get-Location).Path + "\"
$property_reader = $working_directory + "scripts\util\propertyReader.ps1"

## Initialize variables
$need_preprocess = $false

$catman_dir = powershell $property_reader $env "sys_spec" "catman.rootDirectory"
$cmmodules_folder = powershell $property_reader $env "sys" "catman.cmModulesDirectory"

$manageattr_process_code = powershell $property_reader $env "app" "catman.manageAttributes"

$request_compiler = $catman_dir + $cmmodules_folder + "requestCompiler.js"
$preprocessor = $catman_dir + $cmmodules_folder + "preprocessor.js"

# compile catalog and control files
Write-Host "Request Compiler - "$manageattr_process_code
node $request_compiler "$env" "$manageattr_process_code" "$build_tag"

# preprocessing
Write-Host "Preprocessing - "$manageattr_process_code
node $preprocessor "$env" "$manageattr_process_code" "$build_tag"

## preprocessing SQL Scripts
# TBD: copy sh impl
