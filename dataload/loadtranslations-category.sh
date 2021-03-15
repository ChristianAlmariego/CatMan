#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Promote Translation Publish - Category: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "Promote Translation Publish - Category: Store is Required"
  exit 1
else
  export store=$2
fi

if [ "$3" = "" ] ; then
  echo "Promote Translation Publish - Category: Platform is Required"
  exit 1
else
  export platform=$3
fi

if [ "$4" = "" ] ; then
  echo "Promote Translation Publish - Category: Build Version is Required"
  exit 1
else
  export build_version=$4
fi

if [ "$5" = "" ] ; then
  echo "Promote Translation Publish - Category: Build ID is Required"
  exit 1
else
  export build_id=$5
fi

echo "START - Promote Attributes Translation Publish - Category"
echo "Initializing Variables"
echo "Environment: " $env
echo "Store: " $store
echo "Platform: " $platform
echo "Build Version: " $build_version
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
export translation_baseshared_dir=${catman_baseshared_dir}TMS/CatMan/
export translation_baseshared_container_dir=${catman_baseshared_container_dir}TMS/CatMan/
export wcbin_dir=$($property_reader $env sys_spec catman.wcsBinDirectory)
export wcenvpath_dir=$($property_reader $env sys_spec catman.envPathDirectory)
export DATAEXTRACTCMD=$wcbin_dir"dataextract.sh"
export DATALOADCMD=$wcbin_dir"dataload.sh"

echo "CATMAN_ROOTDIR: $catman_dir"
echo "CONTAINER_ROOTDIR: $catman_container_dir"
echo "BASE_SHARED_DIR: $catman_baseshared_dir"
echo "CONTAINER_BASE_SHARED_DIR: $catman_baseshared_container_dir"
echo "TRANSLATION_BASESHARED_DIR: $translation_baseshared_dir"
echo "TRANSLATION_BASESHARED_CONTAINER_DIR: $translation_baseshared_container_dir"
echo "WCBINDIR: $wcbin_dir"
echo "ENVPATH: $wcenvpath_dir"
echo "DATAEXTRACTCMD: $DATAEXTRACTCMD"
echo "DATALOADCMD: $DATALOADCMD"


#a = control file name, b = data file name, c = email, d = name, e = batchid, f = langid, g = categories
for i in ${translation_baseshared_dir}ExtractForPublish/tms-category-publish-control*.txt
do
  while IFS=\| read -r a b c d e f g
  do
    if [ "$platform" = "ComRes" ] ; then
      if ls ${translation_baseshared_dir}ExtractForPublish/salescatalog-comres-$2$e* 1> /dev/null 2>&1; then
        echo "Start Dataload for Categories - COMRES"
        docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD ${catman_container_dir}dataload/wc-dataload-translation-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=${translation_baseshared_container_dir}ExtractForPublish/wc-dataload-sales-comres$e.log -DstoreIdentifier=EMR -DcatalogIdentifier=EMR_SALES_CATALOG -DlangId=$f -DenvPath=$wcenvpath_dir -DinputLocation=${translation_baseshared_container_dir}ExtractForPublish/salescatalog-comres-$2$e >> ${translation_baseshared_container_dir}ExtractForPublish/loadtranslations-category$e.log 2>&1"
      else
        echo "`date` - @@@INFO: salescatalog CSV file for COMRES is not found for dataload"
      fi
    elif [ "$platform" = "AutoSol" ] ; then
      if ls ${translation_baseshared_dir}ExtractForPublish/salescatalog-autosol-$2$e* 1> /dev/null 2>&1; then
        echo "Start Dataload for Categories - AUTOSOL"
        docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD ${catman_container_dir}dataload/wc-dataload-translation-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=${translation_baseshared_container_dir}ExtractForPublish/wc-dataload-sales-autosol$e.log -DstoreIdentifier=EMR -DcatalogIdentifier=EMR_SALES_CATALOG -DlangId=$f -DenvPath=$wcenvpath_dir -DinputLocation=${translation_baseshared_container_dir}ExtractForPublish/salescatalog-autosol-$2$e >> ${translation_baseshared_container_dir}ExtractForPublish/loadtranslations-category$e.log 2>&1"
      else
      echo "`date` - @@@INFO: salescatalog CSV file for AUTOSOL is not found for dataload"
      fi
	  else 
      if ls ${translation_baseshared_dir}ExtractForPublish/salescatalog-$2$e* 1> /dev/null 2>&1; then
        echo "Start Dataload for Categories - BOTH PLATFORM"
        docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD ${catman_container_dir}dataload/wc-dataload-translation-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=${translation_baseshared_container_dir}ExtractForPublish/wc-dataload-sales$e.log -DstoreIdentifier=EMR -DcatalogIdentifier=EMR_SALES_CATALOG -DlangId=$f -DenvPath=$wcenvpath_dir -DinputLocation=${translation_baseshared_container_dir}ExtractForPublish/salescatalog-$2$e >> ${translation_baseshared_container_dir}ExtractForPublish/loadtranslations-category$e.log 2>&1"
      else
        echo "`date` - @@@INFO: salescatalog CSV file is not found for dataload"
      fi	
	  fi

    if [ `grep "Error Count:" ${translation_baseshared_dir}ExtractForPublish/loadtranslations-category$e.log | grep -v "Error Count: 0." | wc -l` -ne 0 ] ; then
        mv -f ${translation_baseshared_dir}ExtractForPublish/*$e* ${translation_baseshared_dir}ErrorProcessing >/dev/null 2>/dev/null
    fi
    
    if ls ${translation_baseshared_dir}ExtractForPublish/loadtranslations-category$e.log 1> /dev/null 2>&1; then
    	if [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "dev" ] || [ "$1" = "local" ]; then
        exitCode=`grep -m 1 'exit code:' "${translation_baseshared_dir}ExtractForPublish/loadtranslations-category$e.log"`
        # Validate if dataload is successful and trigger the email alert
        if `echo "$exitCode" | grep -q "exit code: 0."` || `echo "$exitCode" | grep -q "exit code: 1."` ; then
          echo "Sending Email Alert - Category Promote Translation"
          node --max_old_space_size=4096 ${catman_dir}cm_modules/sendCategoryImportEmailAlert.js $1 $2 $e 'promoteTranslation'
        fi
		  fi
      echo "Transfer to Archive"
      mv -f ${translation_baseshared_dir}ExtractForPublish/*$e* ${translation_baseshared_dir}Archive >/dev/null 2>/dev/null
    fi

    echo "Transfer to Archive - CSV"
    if ls ${translation_baseshared_dir}ExtractForPublish/*$e*.csv 1> /dev/null 2>&1; then
  		mv -f ${translation_baseshared_dir}ExtractForPublish/*$e*.csv ${translation_baseshared_dir}Archive >/dev/null 2>/dev/null
	  fi
  done < "$i"
done

echo "Cleanup - Moving to Archive"
mv -f $i ${translation_baseshared_dir}Archive >/dev/null 2>/dev/null

echo "Promotion completed for Category"