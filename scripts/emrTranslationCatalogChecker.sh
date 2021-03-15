#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Translation Catalog Checker: Invalid Environment"
  exit 1
fi

if [ "$2" = "emr" ] || [ "$2" = "wsv" ] ; then
  export store=$2
else
  echo "Translation Catalog Checker: Invalid Store"
  exit 1
fi

export working_directory=`pwd`
working_directory="$working_directory/"
export property_reader=$working_directory"scripts/util/propertyReader.sh"
export catman_dir=$($property_reader $env sys_spec catman.rootDirectory)
echo "CATMAN_ROOTDIR: $catman_dir"


node --max_old_space_size=4096 ${catman_dir}translationcatalogchecker.js $*

if [ $? -eq 0 ]; then
    echo "Translation Catalog Checker Completed"
else
    echo "Translation Catalog Checker Failed"
    exit 1
fi
