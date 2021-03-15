#!/bin/bash
#working directory in quickbuild =  /opt/websphere/catalogManager

# if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
#   export env=$1
# else
#   echo Please pass environment parameter
#   echo Example:  ./extract-catentryattr-attrdeletion.sh local output_location
#   exit 1
# fi

# if [ "$2" = "AttributeDeletion" ] || [ "$2" = "AttrUsage" ] || [ "$2" = "AttrValUsage" ] ; then
#   export REQUEST_REPORT=$2
# else
#   echo Please pass request report parameter
#   exit 1
# fi


if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Extraction of Products: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "Extraction of Products: Request Type (AttributeDeletion/AttrUsage/AttrValUsage"
  exit 1
else
  export REQUEST_REPORT=$2
fi

if [ "$3" = "" ] ; then
  echo "Extraction of Products: Build ID is Required"
  exit 1
else
  export build_id=$3
fi

# ## declare variable
# export CURRDIR=`pwd`
# export DATAEXTRACTCMD=./dataextract.sh
# export WCBINDIR=/opt/websphere/CommerceServer/bin
# export ENVPATH=/opt/websphere/CommerceServer/instances/dcx/properties/catalogManager/

# export CATMAN_BASESHARED_DIR=$3
# export DEXTRACTOUTPUTLOC=$CATMAN_BASESHARED_DIR"/CatMan/Export/EPICAutomation/$REQUEST_REPORT"
# export REQUESTLOC=$CATMAN_BASESHARED_DIR"/Requests/Reports"

# if [ "$1" = "local" ] ; then
#   export CURRDIR=F:\\newcatalogmanager
#   export DATAEXTRACTCMD=./dataextract.bat
#   export WCBINDIR=F:\\IBM\\WCDE80\\bin
#   export ENVPATH=F:\\newcatalogmanager\\dataextract\\
#   export REQUESTLOC=F:\\newcatalogmanager\\Requests\\Reports
#   export DEXTRACTOUTPUTLOC=F:\\newcatalogmanager\\CatMan\\Export\\EPICAutomation\\$REQUEST_REPORT
# fi

# ## printing parameters
# echo ":CURRDIR: $CURRDIR"
# echo ":ENVPATH: $ENVPATH"
# echo ":WCBINDIR: $WCBINDIR"
# echo ":REQUESTLOC: $REQUESTLOC"
# echo ":DEXTRACTOUTPUTLOC: $DEXTRACTOUTPUTLOC"

echo "START - Extract Products For Translation"
echo "Initializing Variables"
echo "Environment: " $env
echo "Request Type: "$REQUEST_REPORT
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


if [ $REQUEST_REPORT = "AttributeDeletion" ] ; then
  if [ ! -f ${catman_baseshared_dir}'Requests/Reports/cm-requests-attributedeletion.txt' ]; then 
    echo "No files to process.."
  else   
    echo "Processing Attribute Deletion Report.."
    while IFS='|' read -r attribute || [[ -n "$attribute" ]];
    do
      attribute=$(echo $attribute | sed -e 's/\r//g')
      if [[ "$attribute" = *"EMR"* ]]; then
        attrFormat=$attrFormat"'$attribute',"
      fi
    done < ${catman_baseshared_dir}Requests/Reports/cm-requests-attributedeletion.txt

    ## cut the last character ","
    attribute_identifiers=${attrFormat::-1}
    echo "Attributes to extract:" $attribute_identifiers
    ## dataextract
    sed "s/\${attribute_identifiers}/$attribute_identifiers/g" "${catman_dir}/dataextract/wc-extract-catentryattr-attrdeletion.xml" > "${catman_dir}/dataextract/wc-extract-catentryattr-attrdeletion-runnable.xml"

    docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD ${catman_container_dir}/dataextract/wc-dataextract-reports.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DenvPath=$wcenvpath_dir -DlogFilePath=${catman_container_dir}wc-extract-catentryattr-attrdeletion.xml.log -DoutputLocation=${catman_baseshared_container_dir}CatMan/Export/EPICAutomation/${REQUEST_REPORT}/Report-AttrDeletion- -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=-1 -DLoadOrder=ProductAttributeRelationship"
  fi
fi

if [ $REQUEST_REPORT = "AttrUsage" ] ; then
  if [ ! -f ${catman_baseshared_dir}'Requests/Reports/cm-requests-attrusage.txt' ]; then 
    echo "No files to process.."
  else   
    echo "Processing AttrUsage Report.."
    while IFS='|' read -r attribute || [[ -n "$attribute" ]];
    do
      attribute=$(echo $attribute | sed -e 's/\r//g')
      if [[ "$attribute" = *"EMR"* ]]; then
      attrFormat=$attrFormat"'$attribute',"
      fi
    done < ${catman_baseshared_dir}Requests/Reports/cm-requests-attrusage.txt

    ## cut the last character ","
    attribute_identifiers=${attrFormat::-1}
    echo "Attributes to extract:" $attribute_identifiers
    ## dataextract
    sed "s/\${attribute_identifiers}/$attribute_identifiers/g" "${catman_dir}/dataextract/wc-extract-catentryattr-attrdeletion.xml" > "${catman_dir}/dataextract/wc-extract-catentryattr-attrdeletion-runnable.xml"

    docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD ${catman_container_dir}/dataextract/wc-dataextract-reports.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DenvPath=$wcenvpath_dir -DlogFilePath=${catman_container_dir}wc-extract-catentryattr-attrdeletion.xml.log -DoutputLocation=${catman_baseshared_container_dir}CatMan/Export/EPICAutomation/${REQUEST_REPORT}/Report-AttrUsage- -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=-1 -DLoadOrder=ProductAttributeRelationship"
  fi
fi

if [ $REQUEST_REPORT = "AttrValUsage" ] ; then
  if [ ! -f ${catman_baseshared_dir}'Requests/Reports/cm-requests-valusage.txt' ]; then 
    echo "No files to process.."
  else   
    echo "Processing AttrUsage Report.."
    while IFS='|' read -r attribute value_usage || [[ -n "$value_usage" ]];
    do
      value_usage=$(echo $value_usage | sed -e 's/\r//g')
      echo "Attributes to extract: " $attribute
      echo "Value Usage: "$value_usage
      ## dataextract
      sed "s/\${attribute}/$attribute/g; s/\${value_usage}/$value_usage/g" "${catman_dir}/dataextract/wc-extract-catentryattr-attrvalusage.xml" > "${catman_dir}/dataextract/wc-extract-catentryattr-attrvalusage-runnable.xml"

      attr_filename="$(echo -e "${attribute}" | tr -d '[:space:]')"
      docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD ${catman_container_dir}/dataextract/wc-dataextract-reports.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DenvPath=$wcenvpath_dir -DlogFilePath=${catman_container_dir}/wc-extract-catentryattr-attrvalusage.xml.log -DoutputLocation=${catman_baseshared_container_dir}CatMan/Export/EPICAutomation/${REQUEST_REPORT}/Report-AttrValUsage-$attr_filename- -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=-1 -DLoadOrder=AttrValueUsageRelationship"
    done < ${catman_baseshared_dir}Requests/Reports/cm-requests-valusage.txt   
  fi
fi