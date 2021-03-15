#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Attribute and Attribute Value Dataload Error: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "Attribute and Attribute Value Dataload: Build ID is Required"
  exit 1
else
  export build_id=$2
fi

export store="emr"

echo "START - Attribute and Attribute Value Dataload"
echo "Initializing Variables"
echo "Environment: " $env
echo "Build ID: " $build_id

## setup extended properties
export working_directory=`pwd`
working_directory="$working_directory/"
export property_reader=$working_directory"scripts/util/propertyReader.sh"
echo "Working Directory: $working_directory"

## Initialize variables
export sh_file_ext=$($property_reader $env app fileextensions.sh)

export catman_dir=$($property_reader $env sys_spec catman.rootDirectory)
export catman_container_dir=$($property_reader $env sys_spec catman.rootDirectoryContainer)
export catman_baseshared_dir=$($property_reader $env sys_spec catman.baseSharedDirectory)
export wcs_dir=$($property_reader $env sys_spec catman.wcsDirectory)
export wcbin_dir=$($property_reader $env sys_spec catman.wcsBinDirectory)
export wcenvpath_dir=$($property_reader $env sys_spec catman.envPathDirectory)

export logs_folder=$($property_reader $env sys catman.logsFolder)
export mngattr_folder=$($property_reader $env sys catman.manageAttributes)

export dlocoutputloc_dir=$catman_dir"lookup_csv/"
export dlocoutputloc_container_dir=$catman_container_dir"lookup_csv/"
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

docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD ${catman_container_dir}dataload/wc-dataload-attributes.xml -DXmlValidation=false -DlogFilePath=${catman_container_dir}wc-dataload-attribute.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$wcenvpath_dir -DoutputLocation=$dlocoutputloc_container_dir"

# copy logs folder to mount location
docker exec ts-utils-job-$build_id /bin/bash -c "cp $wcs_dir$logs_folder*.log $catman_dir$logs_folder$mngattr_folder"

echo "COMPLETED - Attribute and Attribute Value Dataload"