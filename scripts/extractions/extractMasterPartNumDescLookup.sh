#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Extract Master PartNumber Descriptions Lookup Error: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "Extract Master PartNumber Descriptions Lookup Errorr: Build ID is Required"
  exit 1
else
  export build_id=$2
fi

## setup extended properties
export working_directory=`pwd`
working_directory="$working_directory/"
export property_reader=$working_directory"scripts/util/propertyReader.sh"

## Initialize variables
export catman_dir=$($property_reader $env sys_spec catman.rootDirectory)
export catman_container_dir=$($property_reader $env sys_spec catman.rootDirectoryContainer)
export wcbin_dir=$($property_reader $env sys_spec catman.wcsBinDirectory)
export wcenvpath_dir=$($property_reader $env sys_spec catman.envPathDirectory)

export lookupcsv_folder=$($property_reader $env sys catman.lookupDirectory)
export tmp_folder=$($property_reader $env sys catman.wrkspctmp)
export dataextract_folder=$($property_reader $env sys catman.dataextractDirectory)
export output_filename=$($property_reader $env sys lookups.masterPartNumDescs)

export DATAEXTRACT=$wcbin_dir"dataextract.sh"

echo "Starting Process - Extract Master PartNumber Descriptions Lookup"
echo "CATMAN_ROOTDIR: $catman_dir"
echo "CONTAINER_ROOTDIR: $catman_container_dir"
echo "WCBINDIR: $wcbin_dir"
echo "ENVPATH: $wcenvpath_dir"

## Start Extraction Process
echo "START - DataExtract Process"

echo "Trigger datatextract utility..."
docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACT ${catman_container_dir}${dataextract_folder}wc-dataextract-partnumberdesc.xml -Djava.security.egd=file:/dev/./urandom -DlangId=-1 -DXmlValidation=false -DlogFilePath=${catman_container_dir}${lookupcsv_folder}${tmp_folder}wc-dataextract-partnumberdesc-${build_id}.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS  -DenvPath=$wcenvpath_dir -DoutputLocation=${catman_container_dir}${lookupcsv_folder}${tmp_folder}"

echo "Move extraction file from tmp folder to lookupcsv locaion..."
mv -f ${catman_container_dir}${lookupcsv_folder}${tmp_folder}${output_filename} ${catman_container_dir}${lookupcsv_folder} >/dev/null 2>/dev/null

echo "END - DataExtract Process"
