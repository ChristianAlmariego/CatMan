#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Manage Category Error: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "Manage Category Error: Build Tag is Required"
  exit 1
else
  export build_tag=$2
fi

export checker_mode=$3
export store="emr"

#declare variable
export working_directory=`pwd`
working_directory="$working_directory/"
export property_reader=$working_directory"scripts/util/propertyReader.sh"

# Initialize variables
export need_preprocess=false

export catman_dir=$($property_reader $env sys_spec catman.rootDirectory)
export cmmodules_folder=$($property_reader $env sys catman.cmModulesDirectory)
export scripts_folder=$($property_reader $env sys catman.scriptsDirectory)
export managecategory_folder=$($property_reader $env sys catman.manageCategories)

export managecat_preprocessor=$catman_dir$scripts_folder$managecategory_folder"manageCategoryPreProcess.sh"
export emrcategorymanager=$catman_dir$scripts_folder$managecategory_folder"emrcategorymanager.js"

export sh_file_ext=$($property_reader $env app fileextensions.sh)

echo "START - MANAGE CATEGORY"
echo "Initializing Variables"
echo "Environment: " $env
echo "Build Tag: " $build_tag
echo "CATMAN_ROOTDIR: $catman_dir"

## execute preprocess
$managecat_preprocessor $env $build_tag $checker_mode

# process categorycatalog and categorycontrol file
echo "Process Category Updates"
node --max_old_space_size=4096 $emrcategorymanager "$env" "$store" "$build_tag" "$checker_mode"
