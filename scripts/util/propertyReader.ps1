########################################################
#   Emerson Property c2020
#   Definition:     PowerShell Property File Reader
#   Author:         Jerome Canete
#   Revisions:
#          02/01/2020   -   Created
########################################################


If ($args[0] -eq "dev" -Or $args[0] -eq "stage" -Or $args[0] -eq "prod" -Or $args[0] -eq "local") {
    $env = $args[0]
}
Else {
    Write-Host "PropertyReader Error: Invalid Environment"
    Exit 1
}

If ($args[1] -eq "app" -Or $args[1] -eq "sys" -Or $args[1] -eq "sys_spec") {
    $property_type = $args[1]
}
Else {
    Write-Host "PropertyReader Error: Invalid Property Type"
    Exit 1
}

If ($args[2] -eq "") {
    Write-Host "PropertyReader Error: Property Key is Required"
    Exit 1
}
Else {
    $property_key = $args[2]
}

$working_directory = (Get-Location).Path
$application_property_file = $working_directory + "/properties/application.properties"
$system_property_file = $working_directory + "/properties/system.properties"
$env_system_property_file = $working_directory + "/properties/system-$env.properties"

If ($property_type -eq "app") {
    $property_file = $application_property_file
}
ElseIf ($property_type -eq "sys") {
    $property_file = $system_property_file
} Else {
    $property_file = $env_system_property_file
}

$key_pattern = $property_key + "="
$property_line = Select-String -Path "$property_file" -Pattern "$key_pattern"
$property_value = "$property_line".Split("=")[1]


Write-Host "$property_value"