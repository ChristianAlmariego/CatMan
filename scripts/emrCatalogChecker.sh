#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Catalog Checker Error: Invalid Environment"
  exit 1
fi

if [ "$2" = "emr" ] ; then
  export store=$2
else
  echo "Catalog Checker Error: Invalid Store"
  exit 1
fi

if [ "$3" = "" ] ; then
  echo "Catalog Checker Error: Build Tag is Required"
  exit 1
else
  export build_tag=$3
fi

## setup extended properties
#export working_directory=`pwd`
export working_directory=`pwd`
export working_directory="$working_directory/"
export property_reader=$working_directory"scripts/util/propertyReader.sh"

export catman_dir=$($property_reader $env sys_spec catman.rootDirectory)

#execute emrcatalogmanager transform script
node --max_old_space_size=4096 $catman_dir/catalogchecker.js $*

if [ $? -eq 0 ]; then
    echo OK
else
    echo FAIL
    exit 1
fi
