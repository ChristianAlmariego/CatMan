#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "SKU Inheritance Cleanup Extraction: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "SKU Inheritance Cleanup Extraction: Platform is Required"
  exit 1
fi

if [ "$3" = "" ] ; then
  echo "SKU Inheritance Cleanup Extraction: Locale is Required"
  exit 1
else
  export locale=$3
fi

if [ "$4" = "" ] ; then
  echo "SKU Inheritance Cleanup Extraction: Build ID is Required"
  exit 1
else
  export build_id=$4
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

echo "START - SKU Inheritance Cleanup Extraction"
echo "Initializing Variables"
echo "Environment: " $env
echo "Platform: "$platform
echo "Locale: "$locale
echo "Build ID: " $build_id

## setup extended properties
export working_directory=`pwd`
working_directory="$working_directory/"
export property_reader=$working_directory"scripts/util/propertyReader.sh"

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


echo "Start DataExtract"
sed "s/\${platform}/$platform/g" "${catman_dir}dataextract/wc-extract-sku-inheritance-cleanup.xml" > "${catman_dir}dataextract/wc-extract-sku-inheritance-cleanup-runnable.xml"
docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD ${catman_container_dir}dataextract//wc-dataextract-sku-inheritance-cleanup.xml -Djava.security.egd=file:/dev/./urandom -DlangId=$locale -DXmlValidation=false -DlogFilePath=${catman_baseshared_container_dir}CatMan/Export/SkuCleanup/wc-dataextract-sku-inheritance-cleanup-$2${locale}.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$wcenvpath_dir -DoutputLocation=${catman_baseshared_container_dir}CatMan/Export/SkuCleanup/$2${locale}"

echo "Extraction Completed"