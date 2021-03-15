#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "TransformPreProcess Error: Invalid Environment"
  exit 1
fi

if [ "$2" = "emr" ] || [ "$2" = "wsv" ] ; then
  export store=$2
else
  echo "TransformPreProcess Error: Invalid Store"
  exit 1
fi

if [ "$3" = "" ] ; then
  echo "TransformPreProcess Error: Build Tag is Required"
  exit 1
else
  export build_tag=$3
fi

#Build ID
if [ "$4" = "" ] ; then
  echo "Product Transform Error: Build ID is Required"
  exit 1
else
  export build_id=$4
fi

echo "START - TRANSFORM PREPROCESS"
echo "Initializing Variables"
echo "Environment: " $env
echo "Store: " $store
echo "Build Tag: " $build_tag
echo "Build ID: " $build_id

## setup extended properties
export working_directory=`pwd`
working_directory="$working_directory/"
export property_reader=$working_directory"scripts/util/propertyReader.sh"

## Initialize variables
export need_preprocess=false

export js_file_ext=$($property_reader $env app fileextensions.js)
export txt_file_ext=$($property_reader $env app fileextensions.txt)
export log_file_ext=$($property_reader $env app fileextensions.log)
export sh_file_ext=$($property_reader $env app fileextensions.sh)

export catman_dir=$($property_reader $env sys_spec catman.rootDirectory)
export catman_container_dir=$($property_reader $env sys_spec catman.rootDirectoryContainer)
export catman_baseshared_dir=$($property_reader $env sys_spec catman.baseSharedDirectory)
export wcbin_dir=$($property_reader $env sys_spec catman.wcsBinDirectory)
export wcenvpath_dir=$($property_reader $env sys_spec catman.envPathDirectory)
export cmmodules_folder=$($property_reader $env sys catman.cmModulesDirectory)
export transform_workspace_folder=$($property_reader $env sys catman.workspaceDefault)
export resources_folder=$($property_reader $env sys catman.wrkspcResource)
export tmp_folder=$($property_reader $env sys catman.wrkspctmp)
export attrextract_folder=$($property_reader $env sys catman.wrkspcAttrExtract)
export defaultdataextract_folder=$($property_reader $env sys catman.wrkspcDefaultDataExtract)
export dataextract_folder=$($property_reader $env sys catman.dataextractDirectory)

export request_compiler_script=$($property_reader $env sys catman.requestCompiler)
export csv_trimmer_script=$($property_reader $env sys catman.csvTrimmer)
export csv_clipper_script=$($property_reader $env sys catman.csvClipper)
export preprocessor_script=$($property_reader $env sys catman.preprocessor)
export dataextract_script=$($property_reader $env sys wcsutil.dataextract)

export run_request_full_replace=$($property_reader $env app transform.runrequestcode.catentryFullReplace)
export transform_process_code=$($property_reader $env app catman.productTransform)
export transform_valid_requests_filename=$($property_reader $env app file.name.validRequests)
export preprocess_extraction_filename=$($property_reader $env app file.name.dataExtractPreProcess)

export dxdl_keywords_catentryattributes=$($property_reader $env app dxdl.iokey.catentryattributes)
export dxdl_keywords_catentrysalescategories=$($property_reader $env app dxdl.iokey.catentrysalescategories)

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

## start process
export request_compiler="$catman_dir$cmmodules_folder$request_compiler_script$js_file_ext"
export csv_trimmer="$catman_dir$cmmodules_folder$csv_trimmer_script$js_file_ext"
export csv_clipper="$catman_dir$cmmodules_folder$csv_clipper_script$js_file_ext"
export preprocessor="$catman_dir$cmmodules_folder$preprocessor_script$js_file_ext"
export dataextract="$wcbin_dir$dataextract_script$sh_file_ext"
export eol_converter=$catman_dir$cmmodules_folder"eolConverter.js"

export resources_tmp_path="$catman_dir$transform_workspace_folder$resources_folder$tmp_folder"
export transform_valid_requests="$catman_dir$transform_workspace_folder$resources_folder$transform_valid_requests_filename-$build_tag$txt_file_ext"
export preprocess_extraction="$catman_dir$transform_workspace_folder$resources_folder$preprocess_extraction_filename-$build_tag$txt_file_ext"

export loadorder_catentryattrrelfull="CatalogEntryAttributeDictionaryAttributeRelationshipFull"
export loadorder_catentrysalescategories="CatalogEntrySalesCategories"
export extract_config_master=$catman_container_dir$dataextract_folder"wc-dataextract-master.xml"
export extract_boconfig_catentryattrrelfull=$catman_dir$dataextract_folder"wc-extract-attrdictcatalogentryrel-full.xml"
export extract_boconfig_catentryattrrelfull_runnable=$catman_dir$dataextract_folder"wc-extract-attrdictcatalogentryrel-full-runnable.xml"
export extract_boconfig_salescategory=$catman_dir$dataextract_folder"wc-extract-default-salescategory-partnum.xml"
export extract_boconfig_salescategory_runnable=$catman_dir$dataextract_folder"wc-extract-default-salescategory-partnum-runnable.xml"

# convert request files with unsupported eol
echo "Converting Request Files with Unsupported EOL"
ls $catman_baseshared_dir$transform_workspace_folder*.csv | xargs -d '\n' -n 1 basename | while IFS=\| read -r filename
do
  if awk  '/\r$/{exit 0;} 1{exit 1;}' "$catman_baseshared_dir$transform_workspace_folder$filename" ; then
    node --max_old_space_size=4096 $eol_converter "$env" "$filename" "$catman_baseshared_dir$transform_workspace_folder" "$catman_baseshared_dir$tmp_folder"
    echo "file: $filename status: converted"
  else
    echo "file: $filename status: not converted"
  fi
done

# compile catalog and control files
echo "Request Compiler - "$transform_process_code
node --max_old_space_size=4096 $request_compiler "$env" "$transform_process_code" "$build_tag"

# trim catalog files for full replace
if [ -e $transform_valid_requests ] ; then
    echo "CSV Trimmer - Trim Catalog Files for PreProcessing"

    # read compiled requests file
    while IFS=\| read -r control_file_name catalog_file_name contact_email contact_name run_request
    do
      # run request checking that needs preprocessing
      if [ "$run_request" = "$run_request_full_replace" ] ; then
        retained_headers="Code,Full Path,Catalog Entry Type,Manufacturer,Manufacturer part number,Locale"
        export catalog_file_for_trimming="$catman_baseshared_dir$transform_workspace_folder$catalog_file_name"

        if [ -e "$catalog_file_for_trimming" ] ; then
          node --max_old_space_size=4096 $csv_trimmer "$build_tag" "$catalog_file_for_trimming" "$resources_tmp_path" "$retained_headers"
          echo $catalog_file_name" - done"

          # toggle trigger for preprocessing
          if [ ! $need_preprocess ] ; then
            need_preprocess=true
          fi
        fi
      fi
    done < "$transform_valid_requests"
fi

if [ $need_preprocess ] ; then
  # start preprocessing
  echo "PreProcessor - "$transform_process_code
  node --max_old_space_size=4096 $preprocessor "$env" "$transform_process_code" "$build_tag"

  # preprocess extractions
  if [ -e $preprocess_extraction ] ; then
    echo "DataExtract - Preprocessing"

    # read preprocess file file
    while IFS=\| read -r language_id batch_number partnumbers
    do
      echo "Batch Number: "$batch_number
      echo "Language ID: "$language_id

      # local variables
      output_location="$working_directory$transform_workspace_folder$resources_folder$attrextract_folder"
      output_location_container="$catman_container_dir$transform_workspace_folder$resources_folder$attrextract_folder"
      filenaming_reference="$build_tag$language_id-$batch_number"

      echo "Attribute and Attribute Values Extraction..."
      
      sed "s~\${partNumber}~$partnumbers~g" "$extract_boconfig_catentryattrrelfull" > "$extract_boconfig_catentryattrrelfull_runnable"
      
      wcs_params_loadorder_tmp="$wcs_params_loadorder$loadorder_catentryattrrelfull"
      wcs_params_logfilepath_tmp="$wcs_params_logfilepath$catman_container_dir$transform_workspace_folder$resources_folder""wc-dataextract-attr-$build_tag$language_id-$batch_number$log_file_ext"
      wcs_params_langId_tmp="$wcs_params_langId$language_id"
      wcs_params_envPath_tmp="$wcs_params_envPath$wcenvpath_dir"
      wcs_params_outputLocation_tmp="$wcs_params_outputLocation$output_location_container$filenaming_reference-catentry"

      docker exec ts-utils-job-$build_id /bin/bash -c "$dataextract $extract_config_master $wcs_params_javasec $wcs_params_xmlvalidation $wcs_params_loadorder_tmp $wcs_params_logfilepath_tmp $wcs_params_storeId $wcs_params_catalogId $wcs_params_langId_tmp $wcs_params_envPath_tmp $wcs_params_outputLocation_tmp"
      
      # clip extract output per partnum
      extract_csv_for_clipping="$output_location$filenaming_reference-catentryattrrel-output.csv"
      node --max_old_space_size=4096 $csv_clipper "$extract_csv_for_clipping" "$output_location" "$dxdl_keywords_catentryattributes" 2 2 1 1 TRUE TRUE TRUE

      # cleanup temp config file
      rm -f $extract_boconfig_catentryattrrelfull_runnable
      rm -f $extract_csv_for_clipping

      if [ $language_id = -1 ] ; then
        # local variables
        output_location="$working_directory$transform_workspace_folder$resources_folder$defaultdataextract_folder"
        output_location_container="$catman_container_dir$transform_workspace_folder$resources_folder$defaultdataextract_folder"
        filenaming_reference="$build_tag-$batch_number"

        # for default data extraction (only considers default locale "en_US")
        echo "Default Data Extraction..."

        sed "s~\${partNumber}~$partnumbers~g" "$extract_boconfig_salescategory" > "$extract_boconfig_salescategory_runnable"

        wcs_params_loadorder_tmp="$wcs_params_loadorder$loadorder_catentrysalescategories"
        wcs_params_logfilepath_tmp="$wcs_params_logfilepath$catman_container_dir$transform_workspace_folder$resources_folder""wc-dataextract-defaultdata-$build_tag$language_id-$batch_number$log_file_ext"
        wcs_params_langId_tmp="$wcs_params_langId$language_id"
        wcs_params_envPath_tmp="$wcs_params_envPath$wcenvpath_dir"
        wcs_params_outputLocation_tmp="$wcs_params_outputLocation$output_location_container$filenaming_reference-catentry"

        echo $wcs_params_outputLocation_tmp
        echo $wcs_params_loadorder_tmp
        docker exec ts-utils-job-$build_id /bin/bash -c "$dataextract $extract_config_master $wcs_params_javasec $wcs_params_xmlvalidation $wcs_params_loadorder_tmp $wcs_params_logfilepath_tmp $wcs_params_storeId $wcs_params_catalogId $wcs_params_langId_tmp $wcs_params_envPath_tmp $wcs_params_outputLocation_tmp"
      
        # clip extract output per partnum
        extract_csv_for_clipping="$output_location$filenaming_reference-catentrysalescategories-output.csv"
        node --max_old_space_size=4096 $csv_clipper "$extract_csv_for_clipping" "$output_location" "$dxdl_keywords_catentrysalescategories" 2 2 1 1 TRUE TRUE TRUE

        # cleanup temp config file
        rm -f $extract_boconfig_salescategory_runnable
        rm -f $extract_csv_for_clipping
      fi
    done < "$preprocess_extraction"
  fi
fi

echo "END - TRANSFORM PREPROCESS"