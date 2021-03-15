#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Extract Products For Translation: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "Extract Products For Translation: Store is Required"
  exit 1
else
  export store=$2
  export store=${store^^}
fi

if [ "$3" = "" ] ; then
  echo "Extract Products For Translation: Locale is Required"
  exit 1
else
  export locale=$3
fi

if [ "$4" = "" ] ; then
  echo "Extract Products For Translation: Build ID is Required"
  exit 1
else
  export build_id=$4
fi

# export CURRDIR=`pwd`
# export CURRDIRWC=$CURRDIR
# export DATAEXTRACTCMD=./dataextract.sh
# export WCBINDIR=/opt/websphere/CommerceServer/bin
# export ENVPATH=/opt/websphere/CommerceServer/instances/dcx/properties/catalogManager/

# if [ "$1" = "local" ] ; then
#   export CURRDIR=`pwd`
#   export CURRDIRWC=`cmd /c "cd"`
#   export baseDir=`pwd`/../TMS/CatMan/
#   export baseDirWC=`cmd /c "cd"`\\..\\TMS\\CatMan\\
#   export DATAEXTRACTCMD=./dataextract.bat
#   export WCBINDIR=F:\\IBM\\WCDE80\\bin
#   export ENVPATH=`cmd /c "cd"`\\
# fi

echo "START - Extract Products For Translation"
echo "Initializing Variables"
echo "Environment: " $env
echo "Store: "$store
echo "Locale: " $locale
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

export tmp_folder=$($property_reader $env sys catman.wrkspctmp)
export cmmodules_folder=$($property_reader $env sys catman.cmModulesDirectory)
export eol_converter=$catman_dir$cmmodules_folder"eolConverter.js"

echo "CATMAN_ROOTDIR: $catman_dir"
echo "CONTAINER_ROOTDIR: $catman_container_dir"
echo "BASE_SHARED_DIR: $catman_baseshared_dir"
echo "CONTAINER_BASE_SHARED_DIR: $catman_baseshared_container_dir"
echo "TRANSLATION_BASESHARED_DIR: $translation_baseshared_dir"
echo "TRANSLATION_BASESHARED_CONTAINER_DIR: $translation_baseshared_container_dir"
echo "WCBINDIR: $wcbin_dir"
echo "ENVPATH: $wcenvpath_dir"
echo "DATAEXTRACTCMD: $DATAEXTRACTCMD"

echo "$*"

# convert request files with unsupported eol
echo "Converting Request Files with Unsupported EOL"
ls $translation_baseshared_dir*.csv | xargs -d '\n' -n 1 basename | while IFS=\| read -r filename
do
  if awk  '/\r$/{exit 0;} 1{exit 1;}' "$translation_baseshared_dir$filename" ; then
    node --max_old_space_size=4096 $eol_converter "$env" "$filename" "$translation_baseshared_dir" "$catman_baseshared_dir$tmp_folder"
    echo "file: $filename status: converted"
  else
    echo "file: $filename status: not converted"
  fi
done

cd dataextract
#a = control file name, b = data file name, c = email, d = name, e = batchid, f = langid, g = categories, h= comments
echo "Processing translation catalog files"
node --max_old_space_size=4096 ${catman_dir}cm_modules/util-tms-readcontrolfile.js "Translation" $*
echo "Processing completed"

#For CATEGORY level translation
for i in ${translation_baseshared_dir}ExtractForXLIFF/tms-export-control-category*.txt
do
while IFS=\| read -r a b c d e f g h
  do
    export g=`echo $g | sed "s/''/'/g"`

    sed "s/\${catGroupId}/$g/g" "${catman_dir}dataextract/wc-extract-attrdictattrval.xml" > "${catman_dir}dataextract/wc-extract-attrdictattrval-runnable.xml"
    sed "s/\${catGroupId}/$g/g" "${catman_dir}dataextract/wc-extract-attrdictcatalogentryrel.xml" > "${catman_dir}dataextract/wc-extract-attrdictcatalogentryrel-runnable.xml"
    sed "s/\${catGroupId}/$g/g" "${catman_dir}dataextract/wc-extract-catalogentrydesc.xml" > "${catman_dir}dataextract/wc-extract-catalogentrydesc-runnable.xml"
    sed "s/\${catGroupId}/'Automation-Solutions','Commercial-and-Residential-Solutions'/g" "${catman_dir}dataextract/wc-extract-cataloggroupdesc.xml" > "${catman_dir}dataextract/wc-extract-cataloggroupdesc-runnable.xml"
    
    docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD ${catman_container_dir}dataextract/wc-dataextract-master.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=CatalogEntryAttributeDictionaryAttributeRelationship,CatalogEntryDescription -DlogFilePath=${translation_baseshared_container_dir}ExtractForXLIFF/wc-dataextract-master$e.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=$f -DenvPath=$wcenvpath_dir -DoutputLocation=${translation_baseshared_container_dir}ExtractForXLIFF/catentry$e"
    
    rm -f ${catman_dir}dataextract/*-runnable.xml

    # Create batch files for processing
    export batch_processing_output_location=${translation_baseshared_dir}"ExtractForXLIFF/batchProcessing/"
    export catdesc_batching_filename="catDesc"
    export attrVal_batching_filename="attrVal"
    export catdesc_export_file=${translation_baseshared_dir}"ExtractForXLIFF/catentry"$e"desc-output.csv"
    export attrval_export_file=${translation_baseshared_dir}"ExtractForXLIFF/catentry"$e"attrrel-output.csv"

    cd ..

    node --max_old_space_size=4096 ${catman_dir}cm_modules/csvClipper.js $catdesc_export_file $batch_processing_output_location $catdesc_batching_filename 2 2 1 300
    node --max_old_space_size=4096 ${catman_dir}cm_modules/csvClipper.js $attrval_export_file $batch_processing_output_location $attrVal_batching_filename 2 2 1 300

    # Process batch files
    export batching_file_count=0
    catdesc_batching_logfile=${translation_baseshared_dir}"ExtractForXLIFF/batchProcessing/"$catdesc_batching_filename"_batching.log"
    while IFS=\: read -r x y
    do
      if [ "$x" = "Number of Batches" ] ; then
        batching_file_count=$y
      fi
    done < "$catdesc_batching_logfile"
    
    export batchCount=$batching_file_count
    export batchCounter=0;

    while [ $batchCounter -lt $batchCount ]
    do
        batchCounter=`expr $batchCounter + 1`
        export catdesc_single_batch_file="$batch_processing_output_location$catdesc_batching_filename$batchCounter.csv"
        export attrval_single_batch_file="$batch_processing_output_location$attrVal_batching_filename$batchCounter.csv"

        echo "Processing batch file: "
        echo "catdesc file: $catdesc_single_batch_file"
        echo "attrval file: $attrval_single_batch_file"

        node --max_old_space_size=4096 ${catman_dir}exporttranslation.js $env $store $b "$c" "$d" $e $f "$g" "$h" 'category' 'N' "$catdesc_single_batch_file" "$attrval_single_batch_file"> ${catman_baseshared_dir}Translation-WorkingFolder/archive/inbound/catman/extractForXLIFF$e.out

        echo "End of Processing Batch $batchCounter"
    done

    # Remove batch files for processing
    rm -f ${translation_baseshared_dir}ExtractForXLIFF/batchProcessing/*.*
    
    cd dataextract
  done < "$i"
  mv -f $i ${translation_baseshared_dir}ExtractForXLIFF >/dev/null 2>/dev/null
done

# For ITEM level translation
for i in ${translation_baseshared_dir}ExtractForXLIFF/tms-export-control-item*.txt
do
while IFS=\| read -r a b c d e f g h
  do
    export g=`echo $g | sed "s/''/'/g"`

    sed "s~\${partNumber}~$g~g" "${catman_dir}dataextract/wc-extract-attrdictcatalogentryrel-item.xml" > "${catman_dir}dataextract/wc-extract-attrdictcatalogentryrel-item-runnable.xml"
    sed "s~\${partNumber}~$g~g" "${catman_dir}dataextract/wc-extract-catalogentrydesc-item.xml" > "${catman_dir}dataextract/wc-extract-catalogentrydesc-item-runnable.xml"
    
    docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD ${catman_container_dir}dataextract/wc-dataextract-master.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=CatalogEntryAttributeDictionaryAttributeRelationshipItemLevel,CatalogEntryDescriptionItemLevel -DlogFilePath=${translation_baseshared_container_dir}ExtractForXLIFF/wc-dataextract-master$e.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=$f -DenvPath=$wcenvpath_dir -DoutputLocation=${translation_baseshared_container_dir}ExtractForXLIFF/catentry$e"
    
    rm -f ${catman_dir}dataextract/*-runnable.xml
    
    cd ..
    node --max_old_space_size=4096 ${catman_dir}exporttranslation.js $env $store $b "$c" "$d" $e $f "$g" "$h" 'item'> ${catman_baseshared_dir}Translation-WorkingFolder/archive/inbound/catman/extractForXLIFF$e.out
    
    cd dataextract
  done < "$i"
  mv -f $i ${translation_baseshared_dir}ExtractForXLIFF >/dev/null 2>/dev/null
done

cd ..
echo "Sending Email - Product Export"
node --max_old_space_size=4096 ${catman_dir}cm_modules/sendProductExportEmailAlert.js $env $store

echo "Updating Translation Dashboard CSV"
if [ -e ${catman_dir}CatMan/Export/TranslationDashboard/PartNumbersInTranslation.csv ] ; then
	node --max_old_space_size=4096 ${catman_dir}updatetranslationstatus.js $env $store 'In-Translation'
fi
echo "Translation Dashboard Update Completed"