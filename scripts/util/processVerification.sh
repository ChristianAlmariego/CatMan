#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Process verification: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "Process verification: Build Tag is Required"
  exit 1
else
  export build_tag=$2
fi

if [ "$3" = "" ] ; then
  echo "Process verification: Process Code is Required"
  exit 1
else
  export process_code=$3
fi

if [ "$4" = "" ] ; then
  echo "Process verification: Build ID is Required"
  exit 1
else
  export build_id=$4
fi

export store="emr"

echo "START - PROCESS VERIFICATION"
echo "Initializing Variables"
echo "Environment: "$env
echo "Build Tag: "$build_tag
echo "Process Code: "$process_code

## setup extended properties
export working_directory=`pwd`
working_directory="$working_directory/"
export property_reader=$working_directory"scripts/util/propertyReader.sh"

## Initialize variables
export wcbin_dir=$($property_reader $env sys_spec catman.wcsBinDirectory)
export catman_dir=$($property_reader $env sys_spec catman.rootDirectory)
export catman_container_dir=$($property_reader $env sys_spec catman.rootDirectoryContainer)
export wcenvpath_dir=$($property_reader $env sys_spec catman.envPathDirectory)

export scripts_folder=$($property_reader $env sys catman.scriptsDirectory)
export util_folder=$($property_reader $env sys catman.utilFolder)
export attrwrkspc_folder=$($property_reader $env sys catman.workspaceAttributesAndAttrValues)
export category_wrkspc_folder=$($property_reader $env sys catman.workspaceCategories)
export dataextract_folder=$($property_reader $env sys catman.dataextractDirectory)
export requests_folder=$($property_reader $env sys catman.requestsDirectory)
export resources_folder=$($property_reader $env sys catman.wrkspcResource)

export transform_processcode=$($property_reader $env app catman.productTransform)
export manageattr_processcode=$($property_reader $env app catman.manageAttributes)
export managecat_processcode=$($property_reader $env app catman.manageCategory)

export attrvalupdate_ref=$($property_reader $env app file.name.attrValUpdates)

export attrvalupdate_reffile=$catman_dir$requests_folder$attrwrkspc_folder$resources_folder$attrvalupdate_ref"-"$build_tag".txt"
export processVerification=$catman_dir$scripts_folder$util_folder"processVerification.js"
export extract_config_master=$catman_container_dir$dataextract_folder"wc-dataextract-master.xml"
export extract_boconfig_attrvallkup=$catman_dir$dataextract_folder"wc-extract-attrdictattrval-lkup.xml"
export extract_boconfig_attrvallkup_runnable=$catman_dir$dataextract_folder"wc-extract-attrdictattrval-lkup-runnable.xml"
export dataextract=$wcbin_dir"dataextract.sh"

export extract_mastersales_category=$catman_dir$dataextract_folder"wc-extract-master-sales-category.xml" 

# wcs utility params
export wcs_params_javasec="-Djava.security.egd=file:/dev/./urandom"
export wcs_params_xmlvalidation="-DXmlValidation=false"
export wcs_params_storeId="-DstoreIdentifier=EmersonCAS"
export wcs_params_catalogId="-DcatalogIdentifier=EmersonCAS"

export wcs_params_loadorder="-DLoadOrder="
export wcs_params_logfilepath="-DlogFilePath="
export wcs_params_langId="-DlangId="
export wcs_params_envPath="-DenvPath="
export wcs_params_outputLocation="-DoutputLocation="

## Start Processing

# for manage attribute
if [ "$process_code" = "$manageattr_processcode" ] ; then
    ## dataextract of attr lookup csv 
    echo "Execute Verification Process - Manage Attributes"
    echo "Start Attribute Data Extract..."

    wcs_params_loadorder_tmp=$wcs_params_loadorder"AttributeDictionaryAttributeAndAllowedValues"
    wcs_params_logfilepath_tmp=$wcs_params_logfilepath$catman_container_dir$requests_folder$attrwrkspc_folder$resources_folder"wc-dataextract-attr-"$build_tag".log"
    wcs_params_langId_tmp=$wcs_params_langId"-1"
    wcs_params_envPath_tmp=$wcs_params_envPath$wcenvpath_dir
    wcs_params_outputLocation_tmp=$wcs_params_outputLocation$catman_container_dir$requests_folder$attrwrkspc_folder$resources_folder

    docker exec ts-utils-job-$build_id /bin/bash -c "$dataextract $extract_config_master $wcs_params_javasec $wcs_params_xmlvalidation $wcs_params_loadorder_tmp $wcs_params_logfilepath_tmp $wcs_params_storeId $wcs_params_catalogId $wcs_params_langId_tmp $wcs_params_envPath_tmp $wcs_params_outputLocation_tmp"

    # remove 1st line header for lookup compatibility
    echo "Converting extracted file to be lookup compatible..."
    extractattrdict=$catman_dir$requests_folder$attrwrkspc_folder$resources_folder"attrdictattr-output.csv"
    sed -i '1d' $extractattrdict

    if [ -e $attrvalupdate_reffile ] ; then 
      ## dataextract of attr val lookup csv (attr identifier specific)
      echo "Start Attribute Values Data Extract (Attribute Identifier Specific)..."

      # read attrvalupdate reference file
      attribute_identifiers=""
      last_attr_identifier=$(tail -n 1 $attrvalupdate_reffile)

      while IFS= read -r attr_identifier
      do
        attribute_identifiers+="'"
	      attribute_identifiers+="$attr_identifier"
	      attribute_identifiers+="'"

        if [ "$attr_identifier" != "$last_attr_identifier" ] ; then
          attribute_identifiers+=","
        fi
      done < "$attrvalupdate_reffile"

      echo "Attribute Identifiers: "$attribute_identifiers

      sed "s~\${AttrIdentifier}~$attribute_identifiers~g" "$extract_boconfig_attrvallkup" > "$extract_boconfig_attrvallkup_runnable"
      
      wcs_params_loadorder_tmp=$wcs_params_loadorder"AttributeDictionaryAttributeAllowedValuesLkup"
      wcs_params_logfilepath_tmp=$wcs_params_logfilepath$catman_dir$requests_folder$attrwrkspc_folder$resources_folder"wc-dataextract-attrval-"$build_tag".log"

      docker exec ts-utils-job-$build_id /bin/bash -c "$dataextract $extract_config_master $wcs_params_javasec $wcs_params_xmlvalidation $wcs_params_loadorder_tmp $wcs_params_logfilepath_tmp $wcs_params_storeId $wcs_params_catalogId $wcs_params_langId_tmp $wcs_params_envPath_tmp $wcs_params_outputLocation_tmp"
      
      # remove 1st line header for lookup compatibility
      echo "Converting extracted file to be lookup compatible..."
      extractattrvaldict=$catman_dir$requests_folder$attrwrkspc_folder$resources_folder"attrdictattrallowvals-lkup-output.csv"
      sed -i '1d' $extractattrvaldict

      # cleanup temp config file
      rm -f $extract_boconfig_attrvallkup_runnable
    fi

    # start verification process
    echo "Processing verification..."
    node --max_old_space_size=4096 $processVerification $env $build_tag $manageattr_processcode
fi

# for manage attribute
if [ "$process_code" = "$managecat_processcode" ] ; then
    ## dataextract of attr lookup csv 
    echo "Execute Verification Process - Manage Category"
    echo "Start Category Data Extract..."

    wcs_params_loadorder_tmp=$wcs_params_loadorder"MasterSalesCategory"
    wcs_params_logfilepath_tmp=$wcs_params_logfilepath$catman_container_dir$requests_folder$category_wrkspc_folder$resources_folder"wc-dataextract-category-"$build_tag".log"
    wcs_params_langId_tmp=$wcs_params_langId"-1"
    wcs_params_outputLocation_tmp=$wcs_params_outputLocation$catman_container_dir$requests_folder$category_wrkspc_folder$resources_folder
    wcs_params_envPath_tmp=$wcs_params_envPath$wcenvpath_dir
    echo $wcs_params_outputLocation_tmp

    echo "Extracting Categories.."
    docker exec ts-utils-job-$build_id /bin/bash -c "$dataextract $extract_config_master $wcs_params_javasec $wcs_params_xmlvalidation $wcs_params_loadorder_tmp $wcs_params_logfilepath_tmp $wcs_params_storeId $wcs_params_catalogId $wcs_params_langId_tmp $wcs_params_envPath_tmp $wcs_params_outputLocation_tmp"
    echo "End of Extraction.."

    # remove 1st line header for lookup compatibility
    echo "Converting extracted file to be lookup compatible..."
    extractattrdict=$catman_dir$requests_folder$category_wrkspc_folder$resources_folder"mastersalescategory-output.csv"
    sed -i '1d' $extractattrdict

    # start verification process
    echo "Processing verification..."
    node --max_old_space_size=4096 $processVerification $env $build_tag $managecat_processcode
fi