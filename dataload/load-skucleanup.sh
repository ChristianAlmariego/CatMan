#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "SKU Inheritance Cleanup Deletion: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "SKU Inheritance Cleanup Deletion: Platform is Required"
  exit 1
fi

if [ "$3" = "" ] ; then
  echo "SKU Inheritance Cleanup Deletion: Locale is Required"
  exit 1
else
  export locale=$3
fi

if [ "$4" = "" ] ; then
  echo "SKU Inheritance Cleanup Deletion: Locale is Required"
  exit 1
else
  export batch_number=$4
fi

if [ "$5" = "" ] ; then
  echo "SKU Inheritance Cleanup Deletion: Build ID is Required"
  exit 1
else
  export build_id=$5
fi

export platform=""
if  [ "$2" = "AUTOSOL" ] ; then
    export platform="M-Automation-Solutions"
fi
if  [ "$2" = "COMRES" ] ; then
    export platform="M-Commercial-Residential-Solutions"
fi
if  [ "$2" = "ETC" ] ; then
    export platform="ETC"
fi

echo "START - SKU Inheritance Cleanup Deletion"
echo "Initializing Variables"
echo "Environment: " $env
echo "Platform: "$platform
echo "Locale: "$locale
echo "Batch Number: "$batch_number
echo "Build ID: " $build_id

export working_directory=`pwd`
working_directory="$working_directory/"
export property_reader=$working_directory"scripts/util/propertyReader.sh"

export catman_dir=$($property_reader $env sys_spec catman.rootDirectory)
export catman_container_dir=$($property_reader $env sys_spec catman.rootDirectoryContainer)
export catman_baseshared_dir=$($property_reader $env sys_spec catman.baseSharedDirectory)
export catman_baseshared_container_dir=$($property_reader $env sys_spec catman.baseSharedDirectoryContainer)
export wcbin_dir=$($property_reader $env sys_spec catman.wcsBinDirectory)
export wcenvpath_dir=$($property_reader $env sys_spec catman.envPathDirectory)
export DATALOADCMD=$wcbin_dir"dataload.sh"

echo "CATMAN_ROOTDIR: $catman_dir"
echo "CONTAINER_ROOTDIR: $catman_container_dir"
echo "BASE_SHARED_DIR: $catman_baseshared_dir"
echo "CONTAINER_BASE_SHARED_DIR: $catman_baseshared_container_dir"
echo "WCBINDIR: $wcbin_dir"
echo "ENVPATH: $wcenvpath_dir"
echo "DATALOADCMD: $DATALOADCMD"

echo "Start Dataload"
docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD ${catman_container_dir}dataload/wc-dataload-sku-inheritance-cleanup.xml -Djava.security.egd=file:/dev/./urandom -DlangId=$locale -DXmlValidation=false -DlogFilePath=${catman_baseshared_container_dir}CatMan/Export/SkuCleanup/wc-dataload-sku-inheritance-cleanup-$2${locale}-batch${batch_number}.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$wcenvpath_dir -DinputLocation=${catman_baseshared_container_dir}CatMan/Export/SkuCleanup/$2${locale} -DbatchId=${batch_number}"
echo "Dataload Completed"

