#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Product Transform Error: Invalid Environment"
  exit 1
fi

if [ "$2" = "emr" ] || [ "$2" = "wsv" ] ; then
  export store=$2
else
  echo "Product Transform Error: Invalid Store"
  exit 1
fi

if [ "$3" = "" ] ; then
  echo "Product Transform Error: Build Tag is Required"
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

## setup extended properties
#export working_directory=`pwd`
export working_directory=`pwd`
working_directory="$working_directory/"
export property_reader=$working_directory"scripts/util/propertyReader.sh"

## Initialize variables
export sh_file_ext=$($property_reader $env app fileextensions.sh)

export catman_dir=$($property_reader $env sys_spec catman.rootDirectory)
export catman_container_dir=$($property_reader $env sys_spec catman.rootDirectoryContainer)
export catman_baseshared_dir=$($property_reader $env sys_spec catman.baseSharedDirectory)
export wcs_dir=$($property_reader $env sys_spec catman.wcsDirectory)
export wcbin_dir=$($property_reader $env sys_spec catman.wcsBinDirectory)
export wcenvpath_dir=$($property_reader $env sys_spec catman.envPathDirectory)
export dlocoutputloc_dir=$catman_dir"dataload/EMR/"
export dlocoutputloc_container_dir=$catman_container_dir"dataload/EMR/"
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

export cmmodules_folder=$($property_reader $env sys catman.cmModulesDirectory)
export transform_workspace_folder=$($property_reader $env sys catman.workspaceDefault)
export resources_folder=$($property_reader $env sys catman.wrkspcResource)
export tmp_folder=$($property_reader $env sys catman.wrkspctmp)
export logs_folder=$($property_reader $env sys catman.logsFolder)
export defaultdataextract_folder=$($property_reader $env sys catman.wrkspcDefaultDataExtract)
export attrextract_folder=$($property_reader $env sys catman.wrkspcAttrExtract)
export scripts_dir=$($property_reader $env sys catman.scriptsDirectory)
export transform_dir=$($property_reader $env sys catman.productTransform)

export dataload_log_reader_file_name=$($property_reader $env sys catman.dataloadLogReader)
export transform_preprocess_filename=$($property_reader $env sys catman.transformPreProcess)

export dataload_log_reader="$working_directory$scripts_dir$dataload_log_reader_file_name"
export transform_preprocessor="$working_directory$scripts_dir$transform_dir$transform_preprocess_filename$sh_file_ext"

declare -a log_files_array=()
process_name="Product Transform Dataload"

# execute preprocess
$transform_preprocessor $env $store $build_tag $build_id

## execute emrcatalogmanager transform script
echo 'START TRANSFORM PROCESS'
node --max_old_space_size=4096 $catman_dir/emrcatalogmanager.js $*

## execute postprocess - temp files removal
echo "START - TRANSFORM POSTPROCESS"
echo "Removing temporary files..."
rm -f $working_directory$transform_workspace_folder$resources_folder*$build_tag*
rm -f $working_directory$transform_workspace_folder$resources_folder$tmp_folder*$build_tag*
rm -f $working_directory$transform_workspace_folder$resources_folder$defaultdataextract_folder*$build_tag*
rm -f $working_directory$transform_workspace_folder$resources_folder$attrextract_folder*$build_tag*

if [ $? -eq 0 ]; then
    echo OK
else
    echo FAIL
    exit 1
fi

if [ -e ${dlocoutputloc_dir}dataload_csv_$3*.txt ] ; then
  export FILE="${dlocoutputloc_dir}/dataload_csv_$3*.txt"
  export batchfile=`cat $FILE`
  echo "$batchfile"

  docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD $catman_container_dir/dataload/wc-dataload-master-delete.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$catman_container_dir/wc-dataload-master-delete-$batchfile.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$wcenvpath_dir  -DoutputLocation=$dlocoutputloc_container_dir -Dbatchfile=$batchfile"
  docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD $catman_container_dir/dataload/wc-dataload-master.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$catman_container_dir/wc-dataload-master-$batchfile.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$wcenvpath_dir  -DoutputLocation=$dlocoutputloc_container_dir -Dbatchfile=$batchfile"
  docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD $catman_container_dir/dataload/wc-dataload-master-seo.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$catman_container_dir/wc-dataload-master-seo-$batchfile.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$wcenvpath_dir  -DoutputLocation=$dlocoutputloc_container_dir -Dbatchfile=$batchfile"

  log_files_array+=("${catman_dir}wc-dataload-master-delete-$batchfile.log")
  log_files_array+=("${catman_dir}wc-dataload-master-$batchfile.log")
  log_files_array+=("${catman_dir}wc-dataload-master-seo-$batchfile.log")

  #multi store support
  #TODO: loop through stores and invoke dataload
  #TBD: code refactoring - sales category lookup was separated because of -DstoreIdentifier and -DcatalogIdentifier
  docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD $catman_container_dir/dataload/wc-dataload-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$catman_container_dir/wc-dataload-sales-$batchfile.log -DstoreIdentifier=EMR -DcatalogIdentifier=EMR_SALES_CATALOG -DenvPath=$wcenvpath_dir -DoutputLocation=$dlocoutputloc_container_dir -Dbatchfile=$batchfile"
  docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD $catman_container_dir/dataload/wc-dataload-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$catman_container_dir/wc-dataload-sales-emr-old-$batchfile.log -DstoreIdentifier=EMR-OLD -DcatalogIdentifier=TEST_SALES_CATALOG -DenvPath=$wcenvpath_dir -DoutputLocation=$dlocoutputloc_container_dir -Dbatchfile=$batchfile"
  docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD $catman_container_dir/dataload/wc-dataload-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$catman_container_dir/wc-dataload-sales-climate-$batchfile.log -DstoreIdentifier=Climate -DcatalogIdentifier=CLIMATE_SALES_CATALOG -DenvPath=$wcenvpath_dir -DoutputLocation=$dlocoutputloc_container_dir -Dbatchfile=$batchfile"
  docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD $catman_container_dir/dataload/wc-dataload-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$catman_container_dir/wc-dataload-sales-ise-$batchfile.log -DstoreIdentifier=InSinkErator -DcatalogIdentifier=INSINKERATOR_SALES_CATALOG -DenvPath=$wcenvpath_dir -DoutputLocation=$dlocoutputloc_container_dir -Dbatchfile=$batchfile"
  docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD $catman_container_dir/dataload/wc-dataload-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$catman_container_dir/wc-dataload-sales-sensi-$batchfile.log -DstoreIdentifier=Sensi -DcatalogIdentifier=SENSI_SALES_CATALOG -DenvPath=$wcenvpath_dir -DoutputLocation=$dlocoutputloc_container_dir -Dbatchfile=$batchfile"
  docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD $catman_container_dir/dataload/wc-dataload-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$catman_container_dir/wc-dataload-sales-proteam-$batchfile.log -DstoreIdentifier=ProTeam -DcatalogIdentifier=PROTEAM_SALES_CATALOG -DenvPath=$wcenvpath_dir -DoutputLocation=$dlocoutputloc_container_dir -Dbatchfile=$batchfile"
  docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD $catman_container_dir/dataload/wc-dataload-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$catman_container_dir/wc-dataload-sales-wsv-$batchfile.log -DstoreIdentifier=WSV -DcatalogIdentifier=WSV_SALES_CATALOG -DenvPath=$wcenvpath_dir -DoutputLocation=$dlocoutputloc_container_dir -Dbatchfile=$batchfile"
  docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD $catman_container_dir/dataload/wc-dataload-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$catman_container_dir/wc-dataload-sales-fan-$batchfile.log -DstoreIdentifier=FAN -DcatalogIdentifier=FAN_SALES_CATALOG -DenvPath=$wcenvpath_dir -DoutputLocation=$dlocoutputloc_container_dir -Dbatchfile=$batchfile"

  log_files_array+=("${catman_dir}wc-dataload-sales-emr-old-$batchfile.log")
  log_files_array+=("${catman_dir}wc-dataload-sales-$batchfile.log")
  log_files_array+=("${catman_dir}wc-dataload-sales-climate-$batchfile.log")
  log_files_array+=("${catman_dir}wc-dataload-sales-ise-$batchfile.log")
  log_files_array+=("${catman_dir}wc-dataload-sales-sensi-$batchfile.log")
  log_files_array+=("${catman_dir}wc-dataload-sales-proteam-$batchfile.log")
  log_files_array+=("${catman_dir}wc-dataload-sales-wsv-$batchfile.log")
  log_files_array+=("${catman_dir}wc-dataload-sales-fan-$batchfile.log")

  #multi language support for metadata
  for k in -1 -2 -3 -4 -5 -6 -7 -9 -10 -20 -22 -1000 -1001 -1002 -1003 -1004 -1005 -1006 -1007 -1008 -1009 -1010 -1011 -1012 -1013 -1014 -1015 -1016 -1017 -1018 -1019 -1020 -1021 -1022
  do
    if [ -e ${dlocoutputloc_dir}catentry${batchfile}pagetitle$k-output.csv ] ; then
      docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD $catman_container_dir/dataload/wc-dataload-translation-seo.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=CatalogEntryPageTitle -DlogFilePath=$catman_container_dir/wc-dataload-translation-pagetitle$k-$batchfile.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=$k -DenvPath=$wcenvpath_dir -DinputLocation=${dlocoutputloc_container_dir}catentry$batchfile >> $catman_container_dir/loadtranslations$batchfile.log 2>&1"
      log_files_array+=("${catman_dir}/wc-dataload-translation-pagetitle$k-$batchfile.log")
    fi
    if [ -e ${dlocoutputloc_dir}catentry${batchfile}metadesc$k-output.csv ] ; then
      docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD $catman_container_dir/dataload/wc-dataload-translation-seo.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=CatalogEntryMetaDesc -DlogFilePath=$catman_container_dir/wc-dataload-translation-metadesc$k-$batchfile.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=$k -DenvPath=$wcenvpath_dir -DinputLocation=${dlocoutputloc_container_dir}catentry$batchfile >> $catman_container_dir/loadtranslations$batchfile.log 2>&1"
      log_files_array+=("${catman_dir}/wc-dataload-translation-metadesc$k-$batchfile.log")
    fi
  done

  # copy logs folder to mount location
  docker exec ts-utils-job-$build_id /bin/bash -c "cp $wcs_dir$logs_folder*.log $catman_dir$logs_folder$transform_dir"

  # dataload errors reporting
  cd $working_directory
  echo "Read Dataload Logs for Reporting"
  for log_file_path in "${log_files_array[@]}"
  do
    $dataload_log_reader $env "$process_name" "$batchfile" "$log_file_path"
  done

else
  echo Nothing found to process.
fi  