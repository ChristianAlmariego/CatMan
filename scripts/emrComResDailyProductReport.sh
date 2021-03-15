#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Daily Report Error: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "Daily Report Error: Extract Output Location is Required"
  exit 1
else
  export output_location=$2
fi

if [ "$3" = "" ] ; then
  echo "Daily Report Error: Business Output Location is Required"
  exit 1
else
  export business_output_location=$3
fi

#Build ID
if [ "$4" = "" ] ; then
  echo "Daily Report Error: Build ID is Required"
  exit 1
else
  export build_id=$4
fi

echo "Initialize Parameters"
echo "output location: $output_location"
echo "business output location: $business_output_location"
echo "Build ID: $build_id"

## setup extended properties
#export working_directory=`pwd`
export working_directory=`pwd`
working_directory="$working_directory/"
export property_reader=$working_directory"scripts/util/propertyReader.sh"

## Initialize variables
export sh_file_ext=$($property_reader $env app fileextensions.sh)

export catman_dir=$($property_reader $env sys_spec catman.rootDirectory)
export catman_container_dir=$($property_reader $env sys_spec catman.rootDirectoryContainer)
export catman_baseshared_dir=$($property_reader $env sys_spec catman.baseSharedDirectory)
export catman_baseshared_container_dir=$($property_reader $env sys_spec catman.baseSharedDirectoryContainer)
export wcbin_dir=$($property_reader $env sys_spec catman.wcsBinDirectory)
export wcenvpath_dir=$($property_reader $env sys_spec catman.envPathDirectory)
export DATAEXTRACTCMD=$wcbin_dir"dataextract.sh"
export DATALOADCMD=$wcbin_dir"dataload.sh"

echo "CATMAN_ROOTDIR: $catman_dir"
echo "CONTAINER_ROOTDIR: $catman_container_dir"
echo "BASESHARED_ROOTDIR: $catman_baseshared_dir"
echo "BASESHARED_CONTAINER_ROOTDIR: $catman_baseshared_container_dir"
echo "WCBINDIR: $wcbin_dir"
echo "ENVPATH: $wcenvpath_dir"
echo "DATAEXTRACTCMD: $DATAEXTRACTCMD"
echo "DATALOADCMD: $DATALOADCMD"

echo "Starting Dataextract"
docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD ${catman_container_dir}/dataextract/wc-dataextract-emr-comres-product.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=${catman_container_dir}/wc-dataextract-ComRes-product.xml.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=-1 -DenvPath=$wcenvpath_dir -DoutputLocation=$output_location/ComRes_"

#need to be disabled when local testing
cp $output_location/ComRes_catalog.csv $business_output_location/ComRes_catalog.csv

echo "Report Procesing Completed"