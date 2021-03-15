#!/bin/bash
#working directory in quickbuild =  /opt/websphere/catalogManager
# if [ "$1" = "" ] ; then
#   echo The syntax of the command is incorrect.
#   echo   $0 environment
#   exit 1
# fi
# if [ "$2" = "" ] ; then
#   echo The syntax of the command is incorrect.
#   echo   $0 environment source locale
#   exit 1
# fi
# if [ "$3" = "" ] ; then
#   echo The syntax of the command is incorrect.
#   echo   $0 environment destination locale
#   exit 1
# fi
# export baseDir=/opt/websphere/catalogManager/LoadAttrNames
# export DATALOADDIR=/opt/websphere/catalogManager/dataload
# export baseDirWC=$baseDir
# cd dataextract
# export CURRDIR=`pwd`
# export CURRDIRWC=$CURRDIR
# export DATAEXTRACTCMD=./dataextract.sh
# export DATALOADCMD=./dataload.sh
# export WCBINDIR=/opt/websphere/CommerceServer/bin
# export ENVPATH=/opt/websphere/CommerceServer/instances/dcx/properties/catalogManager/
# export LOADENVPATH=$ENVPATH
# if [ "$1" = "local" ] ; then
#   export CURRDIR=`pwd`
#   export CURRDIRWC=`cmd /c "cd"`
#   export DATALOADDIR=`cmd /c "cd"`\\..\\dataload\\
#   export baseDir=`pwd`/../LoadAttrNames/
#   export baseDirWC=`cmd /c "cd"`\\..\\LoadAttrNames\\
#   export DATAEXTRACTCMD=./dataextract.bat
#   export DATALOADCMD=./dataload.bat
#   export WCBINDIR=F:\\IBM\\WCDE80\\bin
#   export ENVPATH=`cmd /c "cd"`\\
#   export LOADENVPATH=`cmd /c "cd"`\\..\\dataload\\
# fi

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Translate Attribute Display Names: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "Translate Attribute Display Names: Source Locale is Required"
  exit 1
else
  export source_locale=$2
fi

if [ "$3" = "" ] ; then
  echo "Translate Attribute Display Names: Destination Locale is Required"
  exit 1
else
  export destination_locale=$3
fi

if [ "$4" = "" ] ; then
  echo "Translate Attribute Display Names: Build ID is Required"
  exit 1
else
  export build_id=$4
fi

echo "START - Translate Attribute Display Names"
echo "Initializing Variables"
echo "Environment: " $env
echo "Source Locale: " $source_locale
echo "Destination Locale: " $destination_locale
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
export DATALOADCMD=$wcbin_dir"dataload.sh"

echo "CATMAN_ROOTDIR: $catman_dir"
echo "CONTAINER_ROOTDIR: $catman_container_dir"
echo "BASE_SHARED_DIR: $catman_baseshared_dir"
echo "CONTAINER_BASE_SHARED_DIR: $catman_baseshared_container_dir"
echo "DLOCOUTPUT: $dlocoutputloc_dir"
echo "DLOCOUTPUT_CONTAINER: $dlocoutputloc_container_dir"
echo "WCBINDIR: $wcbin_dir"
echo "ENVPATH: $wcenvpath_dir"
echo "DATAEXTRACTCMD: $DATAEXTRACTCMD"
echo "DATALOADCMD: $DATALOADCMD"

#a = source language_id, b = destination language_id, c = batch_id
echo "Processing Locales"
node --max_old_space_size=4096 ${catman_dir}cm_modules/localelanguageid.js $*

for i in ${catman_dir}LoadAttrNames/language-id-${source_locale}-${destination_locale}.txt
do
while IFS=\| read -r a b c
 do
  echo "Start Dataextract"
  docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD ${catman_container_dir}dataextract/wc-dataextract-attrname.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=${catman_container_dir}LoadAttrNames/wc-dataextract-attrname$c.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=$a -DenvPath=$wcenvpath_dir -DoutputLocation=${catman_container_dir}LoadAttrNames/attrnames$c-"
  echo "Start Dataload"
  docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD ${catman_container_dir}dataload/wc-dataload-attrname.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=${catman_container_dir}LoadAttrNames/wc-dataload-attrname$c.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=$b -DenvPath=$wcenvpath_dir -DinputLocation=${catman_container_dir}LoadAttrNames/attrnames$c-"
 done < "$i"
done

echo "Translation Completed."