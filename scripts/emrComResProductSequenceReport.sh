#!/usr/bin/bash
if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "PLP Sequence Export: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "PLP Sequence Export: Build ID is Required"
  exit 1
else
  export build_id=$2
fi

echo "START - PLP Sequence Export for ComRes"
echo "Initializing Variables"
echo "Environment: " $env
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
export dlocoutputloc_dir=$catman_baseshared_dir"CatMan/Export/"
export dlocoutputloc_container_dir=$catman_baseshared_container_dir"CatMan/Export/"
export wcbin_dir=$($property_reader $env sys_spec catman.wcsBinDirectory)
export wcenvpath_dir=$($property_reader $env sys_spec catman.envPathDirectory)
export DATAEXTRACTCMD=$wcbin_dir"dataextract.sh"

echo "CATMAN_ROOTDIR: $catman_dir"
echo "CONTAINER_ROOTDIR: $catman_container_dir"
echo "BASE_SHARED_DIR: $catman_baseshared_dir"
echo "CONTAINER_BASE_SHARED_DIR: $catman_baseshared_container_dir"
echo "DLOCOUTPUT: $dlocoutputloc_dir"
echo "DLOCOUTPUT_CONTAINER: $dlocoutputloc_container_dir"
echo "WCBINDIR: $wcbin_dir"
echo "ENVPATH: $wcenvpath_dir"
echo "DATAEXTRACTCMD: $DATAEXTRACTCMD"

echo "Start Dataextract"
docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD ${catman_container_dir}dataextract/wc-dataextract-salescat-sequencing.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=CatalogEntryParentCatalogGroupRelationshipComRes -DlogFilePath=${catman_container_dir}wc-dataextract-ComRes-sequence.xml.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=-1 -DenvPath=$wcenvpath_dir -DoutputLocation=${dlocoutputloc_container_dir}SalesCategorySequencing/"
echo "Dataextract Completed"