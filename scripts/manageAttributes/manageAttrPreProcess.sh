#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "ManageAttrPreProcess Error: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "ManageAttrPreProcess Error: Build Tag is Required"
  exit 1
else
  export build_tag=$2
fi

export store="emr"

echo "START - MANAGE ATTRIBUTE PREPROCESS"
echo "Initializing Variables"
echo "Environment: " $env
echo "Build Tag: " $build_tag

## setup extended properties
export working_directory=`pwd`
working_directory="$working_directory/"
export property_reader=$working_directory"scripts/util/propertyReader.sh"

## Initialize variables
export need_preprocess=false

export catman_dir=$($property_reader $env sys_spec catman.rootDirectory)
export cmmodules_folder=$($property_reader $env sys catman.cmModulesDirectory)
export requests_folder=$($property_reader $env sys catman.requestsDirectory)
export attrwrkspc_folder=$($property_reader $env sys catman.workspaceAttributesAndAttrValues)
export resources_folder=$($property_reader $env sys catman.wrkspcResource)
export sqlscripts_folder=$($property_reader $env sys catman.sqlScriptsDirectory)

export manageattr_process_code=$($property_reader $env app catman.manageAttributes)

export request_compiler=$catman_dir$cmmodules_folder"requestCompiler.js"
export preprocessor=$catman_dir$cmmodules_folder"preprocessor.js"
export attrusageupdate_sqlref=$catman_dir$sqlscripts_folder"attribute-usage-update-attr.sql"
export attrusageupdate_sqlrunnable=$catman_dir$sqlscripts_folder"attribute-usage-update-attr-runnable.sql"

# compile catalog and control files
echo "Request Compiler - "$manageattr_process_code
node --max_old_space_size=4096 $request_compiler "$env" "$manageattr_process_code" "$build_tag"

# preprocessing
echo "Preprocessing - "$manageattr_process_code
node --max_old_space_size=4096 $preprocessor "$env" "$manageattr_process_code" "$build_tag"
