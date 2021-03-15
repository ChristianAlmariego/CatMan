#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "ManageCategoryPreProcess Error: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "ManageCategoryPreProcess Error: Build Tag is Required"
  exit 1
else
  export build_tag=$2
fi

export checker_mode=$3
export store="emr"

echo "START - MANAGE CATEGORY PREPROCESS"
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
export catwrkspc_folder=$($property_reader $env sys catman.workspaceCategories)
export resources_folder=$($property_reader $env sys catman.wrkspcResource)
export sqlscripts_folder=$($property_reader $env sys catman.sqlScriptsDirectory)

export manage_category_process_code=$($property_reader $env app catman.manageCategory)

export request_compiler=$catman_dir$cmmodules_folder"requestCompiler.js"
export preprocessor=$catman_dir$cmmodules_folder"preprocessor.js"

# compile catalog and control files
echo "Request Compiler - "$manage_category_process_code
node --max_old_space_size=4096 $request_compiler "$env" "$manage_category_process_code" "$build_tag" "$checker_mode"

# preprocessing
echo "Preprocessing - "$manage_category_process_code
#node --max_old_space_size=4096 $preprocessor "$env" "$manage_category_process_code" "$build_tag"
