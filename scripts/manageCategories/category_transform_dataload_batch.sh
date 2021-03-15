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

if [ "$3" = "" ] ; then
  echo "Manage Category Error: Build ID is Required"
  exit 1
else
  export build_id=$3
fi

#declare variable
export working_directory=`pwd`
working_directory="$working_directory/"
export property_reader=$working_directory"scripts/util/propertyReader.sh"

export catman_dir=$($property_reader $env sys_spec catman.rootDirectory)
export cmmodules_folder=$($property_reader $env sys catman.cmModulesDirectory)
export scripts_folder=$($property_reader $env sys catman.scriptsDirectory)
export managecategory_folder=$($property_reader $env sys catman.manageCategories)
export category_folder=$($property_reader $env sys catman.workspaceCategories)
export request_folder=$($property_reader $env sys catman.requestsDirectory)
export resource_folder=$($property_reader $env sys catman.wrkspcResource)

export category_transform_dataload=$catman_dir$scripts_folder"category_transform_dataload.sh"
export manage_resource=$catman_dir$request_folder$category_folder$resource_folder
export transformtype='category'

echo "Current Directory:  "$catman_dir
echo "Request Location: "$manage_resource

# Get the List of Store
if [ ! -f $manage_resource'cm-requests-category-store-'$build_tag'.txt' ]; then 
  echo "No files to process.."
else   
  echo "Reading stores to process.."
  while IFS= read -r store
  do    
    store=$(echo $store | sed -e 's/\r//g')

    echo "Category Store: $store"
    $category_transform_dataload "$env" "$store" "$transformtype" "$build_tag" "$build_id"
      
  done < $manage_resource'cm-requests-category-store-'$build_tag'.txt'
fi
