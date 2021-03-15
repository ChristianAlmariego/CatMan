#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Extract Partnumbers Error: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "Extract Partnumbers Error: Build ID is Required"
  exit 1
else
  export build_id=$2
fi

## setup extended properties
export working_directory=`pwd`
working_directory="$working_directory/"
export property_reader=$working_directory"scripts/util/propertyReader.sh"

## Initialize variables
export sh_file_ext=$($property_reader $env app fileextensions.sh)

export catman_dir=$($property_reader $env sys_spec catman.rootDirectory)
export catman_container_dir=$($property_reader $env sys_spec catman.rootDirectoryContainer)
export catman_baseshared_dir=$($property_reader $env sys_spec catman.baseSharedDirectory)
export wcbin_dir=$($property_reader $env sys_spec catman.wcsBinDirectory)
export wcenvpath_dir=$($property_reader $env sys_spec catman.envPathDirectory)
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

docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD ${catman_container_dir}/dataextract/wc-dataextract-partnumber.xml -Djava.security.egd=file:/dev/./urandom -DlangId=-1 -DXmlValidation=false -DlogFilePath=$dlocoutputloc_container_dir/wc-dataextract-partnumber.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$wcenvpath_dir -DoutputLocation=$dlocoutputloc_container_dir"
docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD ${catman_container_dir}/dataextract/wc-dataextract-partnumberdesc.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$dlocoutputloc_container_dir/wc-dataextract-partnumberdesc.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=-1 -DenvPath=$wcenvpath_dir -DoutputLocation=$dlocoutputloc_container_dir"
