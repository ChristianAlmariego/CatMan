#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Manage Attributes Error: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "Manage Attributes Error: Build Tag is Required"
  exit 1
else
  export build_tag=$2
fi

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
export manageattr_folder=$($property_reader $env sys catman.manageAttributes)

export manageattr_preprocessor=$catman_dir$scripts_folder$manageattr_folder"manageAttrPreProcess.sh"
export emrattributesmanager=$catman_dir$scripts_folder$manageattr_folder"emrattributesmanager.js"

export sh_file_ext=$($property_reader $env app fileextensions.sh)

echo "START - MANAGE ATTRIBUTE"
echo "Initializing Variables"
echo "Environment: " $env
echo "Build Tag: " $build_tag
echo "CATMAN_ROOTDIR: $catman_dir"

## execute preprocess
$manageattr_preprocessor $env $build_tag $build_id

# process attrcatalog and attrcontrol file
echo "Process Attribute Updates"
node --max_old_space_size=4096 $emrattributesmanager "$env" "$store" "$build_tag"
