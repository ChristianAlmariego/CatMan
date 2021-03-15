# Retrieve Process Parameters
If ($args[0] -eq "dev" -Or $args[0] -eq "stage" -Or $args[0] -eq "prod" -Or $args[0] -eq "local") {
  $env = $args[0]
} Else {
  Write-Host "Manage Attributes Error: Invalid Environment"
  Exit 1
}

If ($args[1] -eq "") {
  Write-Host "Manage Attributes Error: Build Tag is Required"
  Exit 1
} Else {
  $build_tag = $args[1]
}

$store="emr"

## setup extended properties
$working_directory = (Get-Location).Path + "\"
$property_reader = $working_directory + "scripts\util\propertyReader.ps1"

## Initialize variables
$need_preprocess = $false

$catman_dir = powershell $property_reader $env "sys_spec" "catman.rootDirectory"
$cmmodules_folder = powershell $property_reader $env "sys" "catman.cmModulesDirectory"
$scripts_folder = powershell $property_reader $env "sys" "catman.scriptsDirectory"
$manageattr_folder = powershell $property_reader $env "sys" "catman.manageAttributes"

$manageattr_preprocessor = $catman_dir + $scripts_folder + $manageattr_folder + "manageAttrPreProcess.ps1"
$emrattributesmanager = $catman_dir + $scripts_folder + $manageattr_folder + "emrattributesmanager.js"

## execute preprocess
powershell $manageattr_preprocessor $env $build_tag

# process attrcatalog and attrcontrol file
Write-Host "Process Attribute Updates"
node $emrattributesmanager "$env" "$store" "$build_tag"
