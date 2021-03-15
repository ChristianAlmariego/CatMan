#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Import XLIFF Back from Translations Error: Invalid Environment"
  exit 1
fi

if [ "$2" = "emr" ] || [ "$2" = "wsv" ] ; then
  export store=$2
else
  echo "Import XLIFF Back from Translations Error: Invalid Store"
  exit 1
fi

#Build ID
if [ "$3" = "" ] ; then
  echo "Import XLIFF Back from Translations Error: Build ID is Required"
  exit 1
else
  export build_id=$3
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
export catman_shared_root=$($property_reader $env sys_spec catman.baseSharedDirectory)
export catman_baseshared_dir=$($property_reader $env sys_spec catman.baseSharedDirectory)
  export catman_baseshared_dir=${catman_baseshared_dir}Translation-WorkingFolder/outbound/catman/processing/  #path contains dataload CSV
export catman_baseshared_container_dir=$($property_reader $env sys_spec catman.baseSharedDirectoryContainer)
  export catman_baseshared_container_dir=${catman_baseshared_container_dir}Translation-WorkingFolder/outbound/catman/processing/  # path contains dataload CSV
export wcs_dir=$($property_reader $env sys_spec catman.wcsDirectory)
export wcbin_dir=$($property_reader $env sys_spec catman.wcsBinDirectory)
export wcenvpath_dir=$($property_reader $env sys_spec catman.envPathDirectory)

export logs_folder=$($property_reader $env sys catman.logsFolder)
export translation_folder=$($property_reader $env sys catman.translation)

export dlocoutputloc_dir=$catman_dir"dataload/EMR/"
export dlocoutputloc_container_dir=$catman_container_dir"dataload/EMR/"
export DATAEXTRACTCMD=$wcbin_dir"dataextract.sh"
export DATALOADCMD=$wcbin_dir"dataload.sh"

echo "WORKING DIRECTORY: $working_directory"
echo "CATMAN_ROOTDIR: $catman_dir"
echo "CONTAINER_ROOTDIR: $catman_container_dir"
echo "WCBINDIR: $wcbin_dir"
echo "ENVPATH: $wcenvpath_dir"
echo "DLOCOUTPUT: $dlocoutputloc_dir"
echo "DLOCOUTPUT_CONTAINER: $dlocoutputloc_container_dir"
echo "DATAEXTRACTCMD: $DATAEXTRACTCMD"
echo "DATALOADCMD: $DATALOADCMD"

export scripts_dir=$($property_reader $env sys catman.scriptsDirectory)
export dataload_log_reader_file_name=$($property_reader $env sys catman.dataloadLogReader)
export dataload_log_reader=${catman_dir}$scripts_dir$dataload_log_reader_file_name

declare -a log_files_array=()
process_name="Load Translations from XLIFF"

# #a = control file name, b = data file name, c = email, d = name, e = batchid, f = langid, g = categories, h = processed product flag
if [ -e ${catman_baseshared_dir}tms-publish-control*.txt ] ; then
  for i in ${catman_baseshared_dir}tms-publish-control*.txt
  do
    while IFS=\| read -r a b c d e f g h l
    do
      log_files_array=()
      build_reference=$e

      echo "Start Processing dataloads"
      docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD ${catman_container_dir}dataload/wc-dataload-translation.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=CatalogEntryPublished,CatalogEntryName,CatalogEntryLongDesc,CatalogEntryKeyword,AttrDictAttr,AttrDictAttrAllowedValues -DlogFilePath=${catman_baseshared_container_dir}wc-dataload-translation$e.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=0 -DenvPath=$wcenvpath_dir -DinputLocation=${catman_baseshared_container_dir}catentry$e >> ${catman_baseshared_container_dir}loadtranslations$e.log 2>&1"
      docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD ${catman_container_dir}dataload/wc-dataload-translation-seo.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=CatalogEntryURLKeyword -DlogFilePath=${catman_baseshared_container_dir}wc-dataload-translation-seo$e.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=0 -DenvPath=$wcenvpath_dir -DinputLocation=${catman_baseshared_container_dir}catentry$e >> ${catman_baseshared_container_dir}loadtranslations$e.log 2>&1"
    
      log_files_array+=("${catman_baseshared_dir}wc-dataload-translation$e.log")
      log_files_array+=("${catman_baseshared_dir}wc-dataload-translation-seo$e.log")
    
      echo "Start Processing Locale dataloads"
      for k in -1 -2 -3 -4 -5 -6 -7 -9 -10 -20 -22 -1000 -1001 -1002 -1003 -1004 -1005 -1006 -1007 -1008 -1009 -1010 -1011 -1012 -1013 -1014 -1015 -1016 -1017 -1018 -1019 -1020 -1021 -1022 -1023
      do
        if [ -e ${catman_baseshared_dir}catentry${e}pagetitle${k}-output.csv ] ; then
          echo "Translate Page Title for file ${catman_baseshared_dir}catentry${e}pagetitle${k}-output.csv"
          docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD ${catman_container_dir}dataload/wc-dataload-translation-seo.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=CatalogEntryPageTitle -DlogFilePath=${catman_baseshared_container_dir}wc-dataload-translation-pagetitle$k-$e.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$wcenvpath_dir -DinputLocation=${catman_baseshared_container_dir}catentry$e -DlangId=$k >> ${catman_baseshared_container_dir}loadtranslations$e.log 2>&1"
          log_files_array+=("${catman_baseshared_dir}wc-dataload-translation-pagetitle$k-$e.log")
        fi
        if [ -e ${catman_baseshared_dir}catentry${e}metadesc${k}-output.csv ] ; then
          echo "Translate Meta Description for file ${catman_baseshared_dir}catentry${e}metadesc${k}-output.csv"
          docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD ${catman_container_dir}dataload/wc-dataload-translation-seo.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=CatalogEntryMetaDesc -DlogFilePath=${catman_baseshared_container_dir}wc-dataload-translation-metadesc$k-$e.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$wcenvpath_dir -DinputLocation=${catman_baseshared_container_dir}catentry$e -DlangId=$k >> ${catman_baseshared_container_dir}loadtranslations$e.log 2>&1"
          log_files_array+=("${catman_baseshared_dir}wc-dataload-translation-metadesc$k-$e.log")
        fi
      done

      echo "Start Processing Sales Dataloads"
      docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD ${catman_container_dir}dataload/wc-dataload-translation-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=${catman_baseshared_container_dir}wc-dataload-sales$e.log -DstoreIdentifier=EMR -DcatalogIdentifier=EMR_SALES_CATALOG -DlangId=0 -DenvPath=$wcenvpath_dir -DinputLocation=${catman_baseshared_container_dir}salescatalog$e-emr >> ${catman_baseshared_container_dir}loadtranslations$e.log 2>&1"
      log_files_array+=("${catman_baseshared_dir}wc-dataload-sales$e.log")
      echo "Dataloads Completed..."

      echo "Sending Email Alert"
      echo ${catman_baseshared_dir}loadtranslations$e.log
      if [ -e ${catman_baseshared_dir}loadtranslations$e.log ] ; then
    	  # EDS-4289, EDS-4922: Trigger Email alert if product translations import is successful in stage/prod.
		    IFS=', ' read -r -a processEmail <<< "$h"
		    if `echo "$h" | grep -q "true"` ; then
			    if [ "$env" = "stage" ] || [ "$env" = "prod" ] || [ "$env" = "dev" ] || [ "$env" = "local" ]; then
				    exitCode=`grep -m 1 'exit code:' "${catman_baseshared_dir}loadtranslations$e.log"`
				    # Validate if dataload is successful and trigger the email alert
				    if `echo "$exitCode" | grep -q "exit code: 0."` || `echo "$exitCode" | grep -q "exit code: 1."` ; then
					    cd ${catman_dir}
					    if `echo "${processEmail[0]}" | grep -q "true"` ; then
						    echo "Send Product Import Email Alert"
                node --max_old_space_size=4096 ${catman_dir}/cm_modules/sendProductImportEmailAlert.js $1 $2 $e $c
					    fi
					    if `echo "${processEmail[1]}" | grep -q "true"` ; then
						    echo "Send Category Import Email Alert"
                node --max_old_space_size=4096 ${catman_dir}/cm_modules/sendCategoryImportEmailAlert.js $1 $2 $e 'importTranslation'
					    fi
					    if `echo "${processEmail[2]}" | grep -q "true"` ; then
						    echo "Send Attribute Import Email Alert"
                node --max_old_space_size=4096 ${catman_dir}/cm_modules/sendAttrAndLookupImportEmailAlert.js $1 $2 $e 'Attribute' 'importTranslation'
					    fi
					    if `echo "${processEmail[3]}" | grep -q "true"` ; then
						    echo "Send Lookup Import Email Alert"
                node --max_old_space_size=4096 ${catman_dir}/cm_modules/sendAttrAndLookupImportEmailAlert.js $1 $2 $e 'Lookup' 'importTranslation'
					    fi
				    fi
			    fi
		    fi

        # copy logs folder to mount location
        docker exec ts-utils-job-$build_id /bin/bash -c "cp $wcs_dir$logs_folder*.log $catman_dir$logs_folder$translation_folder"

        # dataload errors reporting
        echo "Read Dataload Logs for Reporting"
        for log_file_path in "${log_files_array[@]}"
        do
          $dataload_log_reader $env "$process_name" "$build_reference" "$log_file_path"
        done
    
		    #EDS-4289, EDS-4922 changes end
        echo "Cleaning up tms-publish-control files"
        echo ${catman_baseshared_dir}../
        mv -f ${catman_baseshared_dir}tms-publish-control$e* ${catman_baseshared_dir}../
        echo ${catman_baseshared_dir}../../../archive/outbound/catman
        mv -f ${catman_baseshared_dir}*$e* ${catman_baseshared_dir}../../../archive/outbound/catman
        echo ${catman_baseshared_dir}../tms-publish-control$e*
        mv -f ${catman_baseshared_dir}../tms-publish-control$e* ${catman_baseshared_dir}
      fi
    done < "$i"
  done

  if `echo "$exitCode" | grep -q "exit code: 0."` || `echo "$exitCode" | grep -q "exit code: 1."` ; then
    if [ -e ${catman_shared_root}CatMan/Export/TranslationDashboard/PartNumbersTranslatedS1.csv ] ; then
      cd ${catman_dir}
      echo "Updating Translation Status."
      pwd
      if [ "$env" = "stage" ] ; then
        node --max_old_space_size=4096 ${catman_dir}/updatetranslationstatus.js 'prod' $store 'Translated-S1'
      else
        node --max_old_space_size=4096 ${catman_dir}/updatetranslationstatus.js $env $store 'Translated-S1'
      fi
      echo "Translation Status Update Completed."
    fi
  fi
else
  echo "Nothing found to process."
fi
