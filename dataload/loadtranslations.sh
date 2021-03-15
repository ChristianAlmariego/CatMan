#!/bin/bash
# if [ "$2" = "" ] ; then
#   echo The syntax of the command is incorrect.
#   echo   $0 environment store
#   exit 1
# fi
# if [ "$1" = "dev" ] ; then
#   export baseDir=/websphere/spdata/Dev/TMS/CatMan/
# fi
# if [ "$1" = "stage" ] ; then
#   export baseDir=/websphere/spdata/Staging/TMS/CatMan/
# fi
# if [ "$1" = "prod" ] ; then
#   export baseDir=/websphere/spdata/Prod/TMS/CatMan/
# fi
# export baseDirWC=$baseDir
# export CURRDIR=`pwd`
# export CURRDIRWC=$CURRDIR
# export DATALOADCMD=./dataload.sh
# export WCBINDIR=/opt/websphere/CommerceServer/bin
# export ENVPATH=/opt/websphere/CommerceServer/instances/dcx/properties/catalogManager/
# if [ "$1" = "local" ] ; then
#   export CURRDIR=`pwd`
#   export CURRDIRWC=`cmd /c "cd"`
#   export baseDir=`pwd`/../TMS/CatMan/
#   export baseDirWC=`cmd /c "cd"`\\..\\TMS\\CatMan\\
#   export DATALOADCMD=./dataload.bat
#   export WCBINDIR=F:\\IBM\\WCDE80\\bin
#   export ENVPATH=`cmd /c "cd"`\\
# fi

# export env=$1

#TBD: for code refactoring - hardcode catman directory for now and change working dir
# export CATMANDIR=/opt/websphere/catalogManager
# cd $CATMANDIR
#TBD: end



# export property_reader=$CATMANDIR/scripts/util/propertyReader.sh
# export scripts_dir=$($property_reader $env sys catman.scriptsDirectory)
# export dataload_log_reader_file_name=$($property_reader $env sys catman.dataloadLogReader)
# export dataload_log_reader=$CATMANDIR/$scripts_dir$dataload_log_reader_file_name

# declare -a log_files_array=()
# process_name="Promote Translation Publish Dataload"


if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Promote Translation Publish: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "Promote Translation Publish: Store is Required"
  exit 1
else
  export store=$2
fi

if [ "$3" = "" ] ; then
  echo "Promote Translation Publish: Build Version is Required"
  exit 1
else
  export build_version=$3
fi

if [ "$4" = "" ] ; then
  echo "Promote Translation Publish: Build ID is Required"
  exit 1
else
  export build_id=$4
fi

echo "START - Promote Translation Publish"
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
export wcs_dir=$($property_reader $env sys_spec catman.wcsDirectory)
export wcbin_dir=$($property_reader $env sys_spec catman.wcsBinDirectory)
export wcenvpath_dir=$($property_reader $env sys_spec catman.envPathDirectory)

export logs_folder=$($property_reader $env sys catman.logsFolder)
export translation_folder=$($property_reader $env sys catman.translation)

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

export dataload_log_reader_file_name=$($property_reader $env sys catman.dataloadLogReader)
export dataload_log_reader=${catman_dir}scripts/$dataload_log_reader_file_name

declare -a log_files_array=()
process_name="Promote Translation Publish Dataload"


#a = control file name, b = data file name, c = email, d = name, e = batchid, f = langid, g = categories
if ls ${translation_baseshared_dir}ExtractForPublish/tms-publish-control*.txt 1> /dev/null 2>&1; then
  for i in ${translation_baseshared_dir}ExtractForPublish/tms-publish-control*.txt
  do
    while IFS=\| read -r a b c d e f g
    do
      log_files_array=()
      build_reference=$e

      if [ -e ${translation_baseshared_dir}$a ] ; then
        mv -f ${translation_baseshared_dir}$a ${translation_baseshared_dir}Processing >/dev/null 2>/dev/null
      fi
      if [ -e ${translation_baseshared_dir}$b ] ; then
        mv -f ${translation_baseshared_dir}$b ${translation_baseshared_dir}Processing >/dev/null 2>/dev/null
      fi
      mv -f ${translation_baseshared_dir}ExtractForPublish/*$e*.csv ${translation_baseshared_dir}Processing >/dev/null 2>/dev/null
      
      if ls ${translation_baseshared_dir}Processing/catentry$e*.csv 1> /dev/null 2>&1; then
        
        echo "Start - Product Dataloads"
        docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD ${catman_container_dir}dataload/wc-dataload-translation.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=CatalogEntryPublished,CatalogEntryName,CatalogEntryLongDesc,CatalogEntryKeyword,AttrDictAttrAllowedValues -DlogFilePath=${translation_baseshared_container_dir}Processing/wc-dataload-translation$e.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=$f -DenvPath=$wcenvpath_dir -DinputLocation=${translation_baseshared_container_dir}Processing/catentry$e > ${translation_baseshared_container_dir}Processing/loadtranslations$e.log 2>&1"
        docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD ${catman_container_dir}dataload/wc-dataload-translation-seo.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=${translation_baseshared_container_dir}Processing/wc-dataload-translation-seo$e.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=$f -DenvPath=$wcenvpath_dir -DinputLocation=${translation_baseshared_container_dir}Processing/catentry$e >> ${translation_baseshared_container_dir}Processing/loadtranslations$e.log 2>&1"
        
        log_files_array+=("${translation_baseshared_dir}Processing/wc-dataload-translation$e.log")
        log_files_array+=("${translation_baseshared_dir}Processing/wc-dataload-translation-seo$e.log")

        echo "Start - SEO and Metadata Dataloads"
        # FOR CLEANUP: Block of code for review if still needed - it also exists in loadtranslationsfromxliff.sh
        for k in -1 -2 -3 -4 -5 -6 -7 -9 -10 -20 -22 -1000 -1001 -1002 -1003 -1004 -1005 -1006 -1007 -1008 -1009 -1010 -1011 -1012 -1013 -1014 -1015 -1016 -1017 -1018 -1019 -1020 -1021 -1022 -1023
        do
          if [ -e ${translation_baseshared_dir}Processing/catentry${e}metadesc$k-output.csv ] ; then
            docker exec ts-utils-job-$build_id /bin/bash -c "$DATALOADCMD ${catman_container_dir}dataload/wc-dataload-translation-seo.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=CatalogEntryPageTitle,CatalogEntryMetaDesc -DlogFilePath=${translation_baseshared_container_dir}Processing/wc-dataload-translation-metadata$k-$e.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=$k -DenvPath=$wcenvpath_dir -DinputLocation=${translation_baseshared_container_dir}Processing/catentry$e >> ${translation_baseshared_container_dir}Processing/loadtranslations$e.log 2>&1"
            log_files_array+=("${translation_baseshared_dir}Processing/wc-dataload-translation-metadata$k-$e.log")
          fi
        done
        
        # EDS-4922: Trigger Email alert if product translations import is successful in Prod.
        if [ -e ${translation_baseshared_dir}Processing/loadtranslations$e.log ] ; then
          if [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "dev" ] || [ "$1" = "local" ]; then
            exitCode=`grep -m 1 'exit code:' "${translation_baseshared_dir}Processing/loadtranslations$e.log"`
            # Validate if dataload is successful and trigger the email alert
            if `echo "$exitCode" | grep -q "exit code: 0."` || `echo "$exitCode" | grep -q "exit code: 1."` ; then
              # cd ..
              if [ "$d" = "AutoPublish" ] ; then
                echo "Sending Email Alert - Auto Publish"
            		node --max_old_space_size=4096 ${catman_dir}cm_modules/sendEmailAlert.js $1 $2 $e 'promoteTranslation' 'AutoPublish'
				      else
                echo "Sending Email Alert - Manual Publish"
					      node --max_old_space_size=4096 ${catman_dir}cm_modules/sendEmailAlert.js $1 $2 $e 'promoteTranslation'
			        fi
            fi
	        fi
        fi
        # EDS-4922 changes end

        # copy logs folder to mount location
        docker exec ts-utils-job-$build_id /bin/bash -c "cp $wcs_dir$logs_folder*.log $catman_dir$logs_folder$translation_folder"
    
        # dataload errors reporting
        echo "Read Dataload Logs for Reporting"
        # Disabled for now
        # for log_file_path in "${log_files_array[@]}"
        # do
        #   $dataload_log_reader $env "$process_name" "$build_reference" "$log_file_path"
        # done

        if [ `grep "Error Count:" ${translation_baseshared_dir}Processing/loadtranslations$e.log | grep -v "Error Count: 0." | wc -l` -ne 0 ] ; then
          mv -f ${translation_baseshared_dir}Processing/*$e* ${translation_baseshared_dir}ErrorProcessing >/dev/null 2>/dev/null
          if [ -e ${translation_baseshared_dir}Processing/$a ] ; then
            mv -f ${translation_baseshared_dir}Processing/$a ${translation_baseshared_dir}ErrorProcessing >/dev/null 2>/dev/null
          fi
          if [ -e ${translation_baseshared_dir}Processing/$b ] ; then
            mv -f ${translation_baseshared_dir}Processing/$b ${translation_baseshared_dir}ErrorProcessing >/dev/null 2>/dev/null
          fi
        fi
        if [ -e ${translation_baseshared_dir}Processing/loadtranslations$e.log ] ; then
          mv -f ${translation_baseshared_dir}Processing/*$e* ${translation_baseshared_dir}Archive >/dev/null 2>/dev/null
        fi
      else
        echo "`date` - @@@ERROR: No Valid CSV files are found for dataload" >> ${translation_baseshared_dir}Processing/loadtranslations$e.log 2>&1
        mv -f ${translation_baseshared_dir}Processing/*$e* ${translation_baseshared_dir}ErrorProcessing >/dev/null 2>/dev/null
        if [ -e ${translation_baseshared_dir}Processing/$a ] ; then
          mv -f ${translation_baseshared_dir}Processing/$a ${translation_baseshared_dir}ErrorProcessing >/dev/null 2>/dev/null
        fi
        if [ -e ${translation_baseshared_dir}Processing/$b ] ; then
          mv -f ${translation_baseshared_dir}Processing/$b ${translation_baseshared_dir}ErrorProcessing >/dev/null 2>/dev/null
        fi
        mv -f $i ${translation_baseshared_dir}ErrorProcessing >/dev/null 2>/dev/null
      fi
    done < "$i"

    if [ -e ${translation_baseshared_dir}Processing/*.csv ] ; then
      mv -f ${translation_baseshared_dir}Processing/*.csv ${translation_baseshared_dir}Archive >/dev/null 2>/dev/null
    fi
    if [ -e $i ] ; then
      mv -f $i ${translation_baseshared_dir}Archive >/dev/null 2>/dev/null
    fi
  done

  if `echo "$exitCode" | grep -q "exit code: 0."` || `echo "$exitCode" | grep -q "exit code: 1."` ; then
	  if [ -e ${catman_baseshared_dir}CatMan/Export/TranslationDashboard/PartNumbersTranslatedP1.csv ] ; then
	    echo "Updating Translation Status - Translation Dashboard"
	    node --max_old_space_size=4096 ${catman_dir}updatetranslationstatus.js $1 $2 'Translated-P1'
	    echo "Update Complete - Translation Dashboard"
	  fi
  fi
else
  echo "`date` - @@@ERROR: No Catalog files present to Promote Translation" >> ${baseDir}ErrorProcessing/loadtranslations$e.log 2>&1
fi

echo "Promotion completed for Products"