#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Attribute Group Dataload Error: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "Attribute Group Dataload Error: Empty Store"
  exit 1
else
    export store=$2
fi

if [ "$3" = "" ] ; then
  echo "Attribute Group Dataload Error: Build ID is Required"
  exit 1
else
  export build_id=$3
fi

echo "START - Attribute Group Dataload"
echo "Initializing Variables"
echo "Environment: " $env
echo "Store: "$store

## setup extended properties
export working_directory=`pwd`
export working_directory="$working_directory/"
export property_reader=$working_directory"scripts/util/propertyReader.sh"

echo "Working Directory: $working_directory"

## Initialize variables
export sh_file_ext=$($property_reader $env app fileextensions.sh)

export catman_dir=$($property_reader $env sys_spec catman.rootDirectory)
export catman_container_dir=$($property_reader $env sys_spec catman.rootDirectoryContainer)
export dlocoutputloc_dir=$catman_dir"lookup_csv/attributegroup/$store/"
export dlocoutputloc_container_dir=$catman_container_dir"lookup_csv/attributegroup/$store/"
export wcbin_dir=$($property_reader $env sys_spec catman.wcsBinDirectory)
export wcenvpath_dir=$($property_reader $env sys_spec catman.envPathDirectory)
export DATAEXTRACTCMD=$wcbin_dir"dataextract.sh"
export DATALOADCMD=$wcbin_dir"dataload.sh"


echo "CATMAN_ROOTDIR: $catman_dir"
echo "CONTAINER_ROOTDIR: $catman_container_dir"
echo "WCBINDIR: $wcbin_dir"
echo "ENVPATH: $wcenvpath_dir"
echo "DLOCOUTPUT: $dlocoutputloc_dir"
echo "DLOCOUTPUT_CONTAINER: $dlocoutputloc_container_dir"
echo "DATAEXTRACTCMD: $DATAEXTRACTCMD"
echo "DATALOADCMD: $DATALOADCMD"

echo "Starting dataload"

docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD ${catman_container_dir}/dataload/wc-dataload-attribute-group.xml -DXmlValidation=false -DstoreIdentifier=$store -DlogFilePath=${catman_container_dir}wc-dataload-attribute-group-$build_id.log -DenvPath=$wcenvpath_dir -DoutputLocation=$dlocoutputloc_container_dir -DcatalogIdentifier=EmersonCAS"

echo "Dataload Completed"