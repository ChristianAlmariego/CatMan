#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Publish Translated Category Names: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "Publish Translated Category Names: Platform is Required"
  exit 1
else
  export platform=$2
fi

if [ "$3" = "" ] ; then
  echo "Publish Translated Category Names: Locale is Required"
  exit 1
else
  export locale=$3
fi

if [ "$4" = "" ] ; then
  echo "Publish Translated Category Names: Build Version is required"
  exit 1
else
  export build_version=$4
fi

if [ "$5" = "" ] ; then
  echo "Publish Translated Category Names: Build ID is Required"
  exit 1
else
  export build_id=$5
fi

echo "Initialize Parameters:"
echo "Environment : $env"
echo "Platform: $platform"
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
if [ "$platform" = "ComRes" ] ; then
	sed "s/\${catGroupId}/'Automation-Solutions','Commercial-and-Residential-Solutions'/g" "${catman_dir}dataextract/wc-extract-cataloggroupdesc-comres.xml" > "${catman_dir}dataextract/wc-extract-cataloggroupdesc-comres-runnable.xml"
	docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD ${catman_container_dir}dataextract/wc-dataextract-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=CatalogGroupDescriptionComres -DlogFilePath=${catman_baseshared_container_dir}TMS/CatMan/ExtractForPublish/wc-dataextract-sales-emr-comres$build_version-${TIMESTAMP}.log -DstoreIdentifier=EMR -DcatalogIdentifier=EMR_SALES_CATALOG -DlangId=$locale -DenvPath=$wcenvpath_dir -DoutputLocation=${catman_baseshared_container_dir}TMS/CatMan/ExtractForPublish/salescatalog-comres-emr$build_version-${TIMESTAMP}"
elif [ "$platform" = "AutoSol" ] ; then
	sed "s/\${catGroupId}/'Automation-Solutions','Commercial-and-Residential-Solutions'/g" "${catman_dir}dataextract/wc-extract-cataloggroupdesc-autosol.xml" > "${catman_dir}dataextract/wc-extract-cataloggroupdesc-autosol-runnable.xml"
	docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD ${catman_container_dir}dataextract/wc-dataextract-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=CatalogGroupDescriptionAutosol -DlogFilePath=${catman_baseshared_container_dir}TMS/CatMan/ExtractForPublish/wc-dataextract-sales-emr-autosol$build_version-${TIMESTAMP}.log -DstoreIdentifier=EMR -DcatalogIdentifier=EMR_SALES_CATALOG -DlangId=$locale -DenvPath=$wcenvpath_dir -DoutputLocation=${catman_baseshared_container_dir}TMS/CatMan/ExtractForPublish/salescatalog-autosol-emr$build_version-${TIMESTAMP}"
else 
	sed "s/\${catGroupId}/'Automation-Solutions','Commercial-and-Residential-Solutions'/g" "${catman_dir}dataextract/wc-extract-cataloggroupdesc.xml" > "${catman_dir}dataextract/wc-extract-cataloggroupdesc-runnable.xml"
	docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD ${catman_container_dir}dataextract/wc-dataextract-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=CatalogGroupDescription -DlogFilePath=${catman_baseshared_container_dir}TMS/CatMan/ExtractForPublish/wc-dataextract-sales-emr$build_version-${TIMESTAMP}.log -DstoreIdentifier=EMR -DcatalogIdentifier=EMR_SALES_CATALOG -DlangId=$locale -DenvPath=$wcenvpath_dir -DoutputLocation=${catman_baseshared_container_dir}TMS/CatMan/ExtractForPublish/salescatalog-emr$build_version-${TIMESTAMP}"
fi

rm -f ${catman_dir}dataextract/*-runnable.xml

echo "Start Publishing Category Translation Report"
node --max_old_space_size=4096 ${catman_dir}cm_modules/publishCategoryTranslationReport.js $env $platform $build_version-${TIMESTAMP}
echo "null|null|null|null|$build_version-${TIMESTAMP}|$locale|null" > ${catman_baseshared_dir}TMS/CatMan/ExtractForPublish/tms-category-publish-control$build_version-${TIMESTAMP}.txt
echo "Publish Completed."