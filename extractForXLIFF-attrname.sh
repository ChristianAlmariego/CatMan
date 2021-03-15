#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Extract Attribute Names For Translation: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "Extract Attribute Names For Translation: Locale is Required"
  exit 1
else
  export locale=$2
fi

if [ "$3" = "" ] ; then
  echo "Extract Attribute Names For Translation: Build ID is Required"
  exit 1
else
  export build_id=$3
fi

echo "START - Extract Attribute Names For Translation"
echo "Initializing Variables"
echo "Environment: " $env
echo "Locale: " $locale
echo "Build ID: " $build_id

## setup extended properties
export working_directory=`pwd`
export working_directory="$working_directory/"
export property_reader=$working_directory"scripts/util/propertyReader.sh"

echo "Working Directory: $working_directory"

## Initialize variables
export sh_file_ext=$($property_reader $env app fileextensions.sh)

export catman_dir=$($property_reader $env sys_spec catman.rootDirectory)
export catman_container_dir=$($property_reader $env sys_spec catman.rootDirectoryContainer)
export catman_baseshared_dir=$($property_reader $env sys_spec catman.baseSharedDirectory)
export catman_baseshared_container_dir=$($property_reader $env sys_spec catman.baseSharedDirectoryContainer)
export wcbin_dir=$($property_reader $env sys_spec catman.wcsBinDirectory)
export wcenvpath_dir=$($property_reader $env sys_spec catman.envPathDirectory)
export DATAEXTRACTCMD=$wcbin_dir"dataextract.sh"

echo "CATMAN_ROOTDIR: $catman_dir"
echo "CONTAINER_ROOTDIR: $catman_container_dir"
echo "BASE_SHARED_DIR: $catman_baseshared_dir"
echo "CONTAINER_BASE_SHARED_DIR: $catman_baseshared_container_dir"
echo "WCBINDIR: $wcbin_dir"
echo "ENVPATH: $wcenvpath_dir"
echo "DATAEXTRACTCMD: $DATAEXTRACTCMD"

echo "Start Extraction"
docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD ${catman_container_dir}dataextract/wc-dataextract-master.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=AttributeDictionaryAttributeAndAllowedValues -DlogFilePath=${catman_baseshared_container_dir}TMS/CatMan/ExtractForXLIFF/wc-dataextract-master-attrname.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=$locale -DenvPath=$wcenvpath_dir -DoutputLocation=${catman_baseshared_container_dir}TMS/CatMan/ExtractForXLIFF/attrname"
echo "Complete Extraction"

echo "Processing CSV to XML Files"
node --max_old_space_size=4096 exporttranslation-attrname.js $* > ${catman_baseshared_dir}"Translation-WorkingFolder/archive/inbound/catman/attrname.log" 2>&1
echo "Completed - XML Files Generated"