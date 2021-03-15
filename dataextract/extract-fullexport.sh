#!/bin/bash

if [ "$1" = "" ] ; then
  echo "Full EMR Raw Data Extraction: Build ID is Required"
  exit 1
else
  export build_id=$1
fi

if [ "$2" = "dev" ] || [ "$2" = "stage" ] || [ "$2" = "prod" ] || [ "$2" = "local" ] ; then
  export env=$2
else
  echo "Full EMR Raw Data Extraction: Invalid Environment"
  exit 1
fi

if [ "$3" = "" ] ; then
  echo "Full EMR Raw Data Extraction: Extraction Type is Required"
  exit 1
else
  export extractionType=$3
fi

if [ "$4" = "" ] ; then
  echo "Full EMR Raw Data Extraction: Platform is Required"
  exit 1
else
  export inputPlatform=$4
fi

if [ "$5" = "" ] ; then
  echo "Full EMR Raw Data Extraction: Language ID is Required"
  exit 1
else
  export langid=$5
fi

if [ "$6" = "" ] ; then
  echo "Full EMR Raw Data Extraction: Output Location is Required"
  exit 1
else
  export outputLocation=$6
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

export dataextract_folder=$($property_reader $env sys catman.dataextractDirectory)

export DATAEXTRACTCMD=$wcbin_dir"dataextract.sh"

export platform=""
export salescatalog=""

## Start Process
if  [ "$inputPlatform" = "AUTOSOL" ] ; then
    export platform="'M-Automation-Solutions'"
    export salescatalog="'EMR_SALES_CATALOG'"
fi
if  [ "$inputPlatform" = "COMRES" ] ; then
    export platform="'M-Commercial-Residential-Solutions','ETC'"
    export salescatalog="'CLIMATE_SALES_CATALOG','INSINKERATOR_SALES_CATALOG','SENSI_SALES_CATALOG','PROTEAM_SALES_CATALOG','FAN_SALES_CATALOG','WSV_SALES_CATALOG'"
fi

echo "Environment: $env"
echo "Platform: $platform"
echo "Language: $langid"
echo "Output Location: $outputLocation"
echo "CatMan Directory: $catman_dir"
echo "ENV Path: $wcenvpath_dir"

## create runnable dataextract configurations
sed "s/\${platform}/$platform/g" "$catman_dir$dataextract_folder/wc-extract-fullexport-attr-others.xml" > "$catman_dir$dataextract_folder/wc-extract-fullexport-attr-others-runnable.xml"
sed "s/\${platform}/$platform/g" "$catman_dir$dataextract_folder/wc-extract-fullexport-attr-special.xml" > "$catman_dir$dataextract_folder/wc-extract-fullexport-attr-special-runnable.xml"
sed "s/\${platform}/$platform/g" "$catman_dir$dataextract_folder/wc-extract-fullexport-base.xml" > "$catman_dir$dataextract_folder/wc-extract-fullexport-base-runnabletemp.xml"
sed "s/\${salescatalog}/$salescatalog/g" "$catman_dir$dataextract_folder/wc-extract-fullexport-base-runnabletemp.xml" > "$catman_dir$dataextract_folder/wc-extract-fullexport-base-runnable.xml"


if [ "$extractionType" = "BASE" ] ; then
  echo "Start Base Fields Dataextract"
  docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD $catman_container_dir$dataextract_folder'wc-dataextract-fullexport.xml' -DLoadOrder=FullExportBase -Djava.security.egd=file:/dev/./urandom -DlangId=$langid -DXmlValidation=false -DlogFilePath=$outputLocation/wc-dataextract-fullexport-base$inputPlatform$langid.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$wcenvpath_dir -DoutputLocation=$outputLocation$inputPlatform$langid"
fi

if [ "$extractionType" = "SPECIAL" ] ; then
  echo "Start Special Attributes Dataextract"
  docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD $catman_container_dir$dataextract_folder'wc-dataextract-fullexport.xml' -DLoadOrder=FullExportAttrSpecial -Djava.security.egd=file:/dev/./urandom -DlangId=$langid -DXmlValidation=false -DlogFilePath=$outputLocation/wc-dataextract-fullexport-special$inputPlatform$langid.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$wcenvpath_dir -DoutputLocation=$outputLocation$inputPlatform$langid"
fi

if [ "$extractionType" = "OTHERS" ] ; then
  echo "Start Other Attributes Dataextract"
  docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD $catman_container_dir$dataextract_folder'wc-dataextract-fullexport.xml' -DLoadOrder=FullExportAttrOthers -Djava.security.egd=file:/dev/./urandom -DlangId=$langid -DXmlValidation=false -DlogFilePath=$outputLocation/wc-dataextract-fullexport-others$inputPlatform$langid.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$wcenvpath_dir -DoutputLocation=$outputLocation$inputPlatform$langid"
fi
