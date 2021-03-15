#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Category Transform Dataload: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "Category Transform Dataload Error: Store is Required"
  exit 1
else
  export store=$2
fi

if [ "$3" = "" ] ; then
  echo "Category Transform Dataload Error: Transform Type (category/literature) is Required"
  exit 1
else
  export transform_type=$3
fi

if [ "$4" = "" ] ; then
  echo "Category Transform Dataload Error: Build Tag is Required"
  exit 1
else
  export build_tag=$4
fi

if [ "$5" = "" ] ; then
  echo "Category Transform Dataload Error: Build ID is Required"
  exit 1
else
  export build_id=$5
fi

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

export logs_folder=$($property_reader $env sys catman.logsFolder)
export mngcategories_folder=$($property_reader $env sys catman.manageCategories)

export DATAEXTRACTCMD=$wcbin_dir"dataextract.sh"
export DATALOADCMD=$wcbin_dir"dataload.sh"

echo "CATMAN_ROOTDIR: $catman_dir"
echo "CONTAINER_ROOTDIR: $catman_container_dir"
echo "WCBINDIR: $wcbin_dir"
echo "ENVPATH: $wcenvpath_dir"
echo "DATAEXTRACTCMD: $DATAEXTRACTCMD"
echo "DATALOADCMD: $DATALOADCMD"
echo "Environment: $env"
echo "Store: $store"
echo "Transform Type: $transform_type"
echo "Build Tag: $build_tag"
echo "Build ID: $build_id"

export storeIdentifier="EMR"
export catalogIdentifier="EMR_SALES_CATALOG"
export dataloadXML="wc-dataload-category-sales.xml"
export dataloadstorefolder="EMR"
if [ "$store" = "emr" ] ; then
  export storeIdentifier="EMR"
  export catalogIdentifier="EMR_SALES_CATALOG"
  export dataloadstorefolder="EMR"
elif [ "$store" = "master" ] ; then
  export storeIdentifier="EmersonCAS"
  export catalogIdentifier="EmersonCAS"
  export dataloadXML="wc-dataload-category-master.xml"
  export dataloadstorefolder="MASTER"
elif [ "$store" = "climate" ] ; then
  export storeIdentifier="Climate"
  export catalogIdentifier="CLIMATE_SALES_CATALOG"
  export dataloadstorefolder="CLIMATE"
elif [ "$store" = "fan" ] ; then
  export storeIdentifier="FAN"
  export catalogIdentifier="FAN_SALES_CATALOG"
  export dataloadstorefolder="FAN"
elif [ "$store" = "ise" ] ; then
  export storeIdentifier="InSinkErator"
  export catalogIdentifier="INSINKERATOR_SALES_CATALOG"
  export dataloadstorefolder="ISE"
elif [ "$store" = "sensi" ] ; then
  export storeIdentifier="Sensi"
  export catalogIdentifier="SENSI_SALES_CATALOG"
  export dataloadstorefolder="SENSI"
elif [ "$store" = "test" ] ; then
  export storeIdentifier="EMR-OLD"
  export catalogIdentifier="TEST_SALES_CATALOG"
  export dataloadstorefolder="EMR-OLD"
elif [ "$store" = "proteam" ] ; then
  export storeIdentifier="ProTeam"
  export catalogIdentifier="PROTEAM_SALES_CATALOG"
  if [ "$transform_type" = "literature" ] ; then
    export dataloadXML="wc-dataload-category-literature-sales.xml"
	export storeOutputFolder="LITERATURE"
  fi
  export dataloadstorefolder="PROTEAM"
fi

export dlocoutputloc_dir=$catman_dir"dataload/${dataloadstorefolder}/"
export dlocoutputloc_container_dir=$catman_container_dir"dataload/${dataloadstorefolder}/"
echo "DLOCOUTPUT: $dlocoutputloc_dir"
echo "DLOCOUTPUT_CONTAINER: $dlocoutputloc_container_dir"

echo "Store Identifier: $storeIdentifier"
echo "Catalog Identifier: $catalogIdentifier"
echo "Datalod XML: $dataloadXML"

export dataload_log_reader_file_name=$($property_reader $env sys catman.dataloadLogReader)
export dataload_log_reader=$catman_dir"scripts/"$dataload_log_reader_file_name

process_name="Category Transform Dataload - $store"

#execute cmcatgroup transform script
echo "Execute cmcatgroup transform script"
node --max_old_space_size=4096 $catman_dir/cmcatgroup.js $*

if [ -e ${dlocoutputloc_dir}catgrp_dataload_csv_$4*.txt ] ; then
	export FILE="${dlocoutputloc_dir}catgrp_dataload_csv_$4*.txt"
	export batchfile=`cat $FILE`
	echo "Batch File: $batchfile"

	#execute dataload
	docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD ${catman_container_dir}dataload/$dataloadXML -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=${catman_container_dir}wc-dataload-$store-category$batchfile.log -DstoreIdentifier=$storeIdentifier -DcatalogIdentifier=$catalogIdentifier -DenvPath=$wcenvpath_dir -DoutputLocation=$dlocoutputloc_container_dir -Dbatchfile=$batchfile"

  # copy logs folder to mount location
  docker exec ts-utils-job-$build_id /bin/bash -c "cp $wcs_dir$logs_folder*.log $catman_dir$logs_folder$mngcategories_folder"

	#dataload errors reporting
	echo "Read Dataload Logs for Reporting"
  echo "$dataload_log_reader"
	$dataload_log_reader $env "$process_name" "$batchfile" "$catman_dir/wc-dataload-$store-category$batchfile.log"

	echo "Process Completed"	
else
   echo "Nothing found to process."
fi