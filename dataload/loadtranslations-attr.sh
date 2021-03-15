#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Promote Attributes Translation Publish: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "Promote Attributes Translation Publish: Store is Required"
  exit 1
else
  export store=$2
fi

if [ "$3" = "" ] ; then
  echo "Promote Attributes Translation Publish: Build Version is Required"
  exit 1
else
  export build_version=$3
fi

if [ "$4" = "" ] ; then
  echo "Promote Attributes Translation Publish: Build ID is Required"
  exit 1
else
  export build_id=$4
fi

echo "START -Promote Attributes Translation Publish"
echo "Initializing Variables"
echo "Environment: " $env
echo "Store: " $store
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
if [ `ls -1 ${translation_baseshared_dir}ExtractForPublish/tms-attrname-publish-control*.txt 2>/dev/null | wc -l` -gt 0 ] ; then
  coreExtracted=false
  for i in ${translation_baseshared_dir}ExtractForPublish/tms-attrname-publish-control*.txt
  do
    while IFS=\| read -r a b c d e f g
    do
      if ls ${translation_baseshared_dir}ExtractForPublish/attrname-$e-* 1> /dev/null 2>&1; then
        echo "Start Dataload for Attributes"
        docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD ${catman_container_dir}dataload/wc-dataload-translation.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=AttrDictAttr -DlogFilePath=${translation_baseshared_container_dir}ExtractForPublish/wc-dataload-translation-attrname$e.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=0 -DenvPath=$wcenvpath_dir -DinputLocation=${translation_baseshared_container_dir}ExtractForPublish/attrname-$e- > ${translation_baseshared_container_dir}ExtractForPublish/loadtranslationsattrname$e.log 2>&1"
      else
        echo "`date` - @@@INFO: attrname CSV file is not found for dataload"
      fi

      if [ "$coreExtracted" = false ] ; then
        #Load core attribute names to avoid translations overwriting values that should be constant
        if ls ${catman_dir}lookup_csv/core-* 1> /dev/null 2>&1; then
          echo "Start Dataload for Core Attributes"
          docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD ${catman_container_dir}dataload/wc-dataload-translation.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=AttrDictAttr -DlogFilePath=${translation_baseshared_container_dir}ExtractForPublish/wc-dataload-translation-core$e.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=0 -DenvPath=$wcenvpath_dir -DinputLocation=${catman_container_dir}lookup_csv/core- > ${translation_baseshared_container_dir}ExtractForPublish/loadtranslationscore$e.log 2>&1"
          coreExtracted=true
        else
          echo "`date` - @@@INFO: core attribute names lookup CSV file is not found for dataload"
        fi
      fi 

      if ls ${translation_baseshared_dir}ExtractForPublish/loadtranslationsattrname$e.log 1> /dev/null 2>&1; then
        if [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "dev" ] || [ "$1" = "local" ]; then
          exitCode=`grep -m 1 'exit code:' "${translation_baseshared_dir}ExtractForPublish/loadtranslationsattrname$e.log"`
          # Validate if dataload is successful and trigger the email alert
          if `echo "$exitCode" | grep -q "exit code: 0."` || `echo "$exitCode" | grep -q "exit code: 1."` ; then
            echo "Sending Email Alert - Attribute Translation Promotion"
            node --max_old_space_size=4096 ${catman_dir}cm_modules/sendAttrAndLookupImportEmailAlert.js $1 $2 $e 'Attribute' 'promoteTranslation'
          fi
        fi
        mv -f  ${translation_baseshared_dir}ExtractForPublish/*$e* ${catman_baseshared_dir}Translation-WorkingFolder/archive/outbound/catman >/dev/null 2>/dev/null
      fi
    done < "$i"
  done
elif [ `ls -1 ${translation_baseshared_dir}ExtractForPublish/tms-lkup-publish-control*.txt 2>/dev/null | wc -l` -gt 0 ] ; then
  coreExtracted=false
  for i in ${translation_baseshared_dir}ExtractForPublish/tms-lkup-publish-control*.txt
  do
    while IFS=\| read -r a b c d e f g
    do
      if ls ${translation_baseshared_dir}ExtractForPublish/lkup-$e-* 1> /dev/null 2>&1; then
        echo "Start Dataload for Attribute Lookups"
        docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD ${catman_container_dir}dataload/wc-dataload-translation.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=AttrDictAttrAllowedValues -DlogFilePath=${translation_baseshared_container_dir}ExtractForPublish/wc-dataload-translation-lkup$e.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=0 -DenvPath=$wcenvpath_dir -DinputLocation=${translation_baseshared_container_dir}ExtractForPublish/lkup-$e- > ${translation_baseshared_container_dir}ExtractForPublish/loadtranslationslkup$e.log 2>&1"
      else
        echo "`date` - @@@INFO: lkup CSV file is not found for dataload"
      fi

      if [ "$coreExtracted" = false ] ; then
        #Load core attribute values to avoid translations overwriting values that should be constant
        if ls ${catman_dir}lookup_csv/core-* 1> /dev/null 2>&1; then
          echo "Start Dataload for Core Attribute Lookups"
          docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD ${catman_container_dir}dataload/wc-dataload-translation.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=AttrDictAttrAllowedValues -DlogFilePath=${translation_baseshared_container_dir}ExtractForPublish/wc-dataload-translation-coreval$e.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=0 -DenvPath=$wcenvpath_dir -DinputLocation=${catman_container_dir}lookup_csv/core- > ${translation_baseshared_container_dir}ExtractForPublish/loadtranslationscoreval$e.log 2>&1"
          coreExtracted=true
        else
          echo "`date` - @@@INFO: core attribute values lookup CSV file is not found for dataload"
        fi
      fi

      if ls ${translation_baseshared_dir}ExtractForPublish/loadtranslationslkup$e.log 1> /dev/null 2>&1; then
        if [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "dev" ] || [ "$1" = "local" ]; then
          exitCode=`grep -m 1 'exit code:' "${translation_baseshared_dir}ExtractForPublish/loadtranslationslkup$e.log"`
          # Validate if dataload is successful and trigger the email alert
          if `echo "$exitCode" | grep -q "exit code: 0."` || `echo "$exitCode" | grep -q "exit code: 1."` ; then
            echo "Sending Email Alert - Lookup Translation Promotion"
            node --max_old_space_size=4096 ${catman_dir}/cm_modules/sendAttrAndLookupImportEmailAlert.js $1 $2 $e 'Lookup' 'promoteTranslation'
          fi
        fi
        mv -f ${translation_baseshared_dir}ExtractForPublish/*$e* ${catman_baseshared_dir}Translation-WorkingFolder/archive/outbound/catman >/dev/null 2>/dev/null
      fi
    done < "$i"
  done
else
  echo "Nothing found to process."
fi

echo "Promotion completed for Attribute / Lookup"
