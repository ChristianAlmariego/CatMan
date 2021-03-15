#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Publish Translated Attribute Names: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "Publish Translated Attribute Names: Store is Required"
  exit 1
else
  export store=$2
fi

if [ "$3" = "" ] ; then
  echo "Publish Translated Attribute Names: Locale is Required"
  exit 1
else
  export locale=$3
fi

if [ "$4" = "" ] ; then
  echo "Publish Translated Attribute Names: Build Version is required"
  exit 1
else
  export build_version=$4
fi

if [ "$5" = "" ] ; then
  echo "Publish Translated Attribute Names: Build ID is Required"
  exit 1
else
  export build_id=$5
fi

echo "Initialize Parameters:"
echo "Environment : $env"
echo "Store: $store"
echo "Locale: $locale"
echo "Build Version: $build_version"
echo "Build ID: $build_id"
export TIMESTAMP=`date +"%4Y%2m%2d%2H%2M%2S%3N"`
echo "TIMESTAMP: $TIMESTAMP"

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

echo "Start - DataExtract"
sed "s/\${langId}/$locale/g" "${catman_dir}dataextract/wc-extract-publishattr.xml" > "${catman_dir}dataextract/wc-extract-publishattr-runnable.xml"
docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD ${catman_container_dir}dataextract/wc-dataextract-master.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=PublishAttributeDictionaryAttributeAndAllowedValues -DlogFilePath=${catman_baseshared_container_dir}TMS/CatMan/ExtractForPublish/wc-dataextract-master-attrname$build_version-${TIMESTAMP}.log -DstoreIdentifier=EmersonCAS -DlangId=0 -DcatalogIdentifier=EmersonCAS -DenvPath=$wcenvpath_dir -DoutputLocation=${catman_baseshared_container_dir}TMS/CatMan/ExtractForPublish/attrname-$build_version-${TIMESTAMP}-"
rm -f ${catman_dir}dataextract/*-runnable.xml

echo "Start Publishing Attribute Translation Report"
node --max_old_space_size=4096 ${catman_dir}cm_modules/publishAttrAndLookupTranslationReport.js $env $store $build_version-${TIMESTAMP} 'Attribute'
echo "null|null|null|null|$build_version-${TIMESTAMP}|-1|null" > ${catman_baseshared_dir}TMS/CatMan/ExtractForPublish/tms-attrname-publish-control$build_version-${TIMESTAMP}.txt
echo "Publish Completed."
