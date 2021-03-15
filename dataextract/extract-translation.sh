#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "Publish Translation: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "Publish Translation: Store is Required"
  exit 1
else
  export store=$2
  export store=${store^^}
fi

if [ "$3" = "" ] ; then
  echo "Publish Translation: Build Version is Required"
  exit 1
else
  export build_version=$3
fi

if [ "$4" = "" ] ; then
  echo "Publish Translation: Build ID is Required"
  exit 1
else
  export build_id=$4
fi

export autoPublish=$5

echo "START - Publish Translation"
echo "Initializing Variables"
echo "Environment: " $env
echo "Store: "$store
echo "Build Version: "$build_version
echo "Build ID: " $build_id
echo "AutoPublish: " $autoPublish

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
if [ "$autoPublish" = "AutoPublish" ] ; then
  echo "Start Processing - AutoPublish"
	node --max_old_space_size=4096 ${catman_dir}/cm_modules/readPublishTranslationControlfile.js $*
else
  echo "Start Processing"
	#a = control file name, b = data file name, c = email, d = name, e = batchid, f = langid, g = categories
	node --max_old_space_size=4096 ${catman_dir}/cm_modules/util-tms-readcontrolfile.js "Publish" $*
fi
cd ..

#for category level translation
if ls ${translation_baseshared_dir}ExtractForPublish/tms-publish-control-category*.txt 1> /dev/null 2>&1; then
  for i in ${translation_baseshared_dir}ExtractForPublish/tms-publish-control-category*.txt
  do
    while IFS=\| read -r a b c d e f g
    do
      #echo "$a $b $c $d $e $f $g"
      echo "START EXTRACTION FOR PUBLISH - CATEGORY LEVEL"
      echo "LANGAUGE ID: $f"
      echo "BATCH ID: $e"
      export g=`echo $g | sed "s/''/'/g"`
      sed "s/\${catGroupId}/$g/g" "${catman_dir}dataextract/wc-extract-attrdictattrval.xml" > "${catman_dir}dataextract/wc-extract-attrdictattrval-runnable.xml"
      sed "s/\${catGroupId}/$g/g" "${catman_dir}dataextract/wc-extract-catalogentrydescname.xml" > "${catman_dir}dataextract/wc-extract-catalogentrydescname-runnable.xml"
      sed "s/\${catGroupId}/$g/g" "${catman_dir}dataextract/wc-extract-catalogentrydescshortdesc.xml" > "${catman_dir}dataextract/wc-extract-catalogentrydescshortdesc-runnable.xml"
      sed "s/\${catGroupId}/$g/g" "${catman_dir}dataextract/wc-extract-catalogentrydesclongdesc.xml" > "${catman_dir}dataextract/wc-extract-catalogentrydesclongdesc-runnable.xml"
      sed "s/\${catGroupId}/$g/g" "${catman_dir}dataextract/wc-extract-catalogentrydescpublished.xml" > "${catman_dir}dataextract/wc-extract-catalogentrydescpublished-runnable.xml"
      sed "s/\${catGroupId}/$g/g" "${catman_dir}dataextract/wc-extract-catalogentrydesckeyword.xml" > "${catman_dir}dataextract/wc-extract-catalogentrydesckeyword-runnable.xml"
      sed "s/\${catGroupId}/$g/g" "${catman_dir}dataextract/wc-extract-catalogentryurlkeyword.xml" > "${catman_dir}dataextract/wc-extract-catalogentryurlkeyword-runnable.xml"
      sed "s/\${catGroupId}/$g/g" "${catman_dir}dataextract/wc-extract-catalogentrypagetitle.xml" > "${catman_dir}dataextract/wc-extract-catalogentrypagetitle-runnable.xml"
      sed "s/\${catGroupId}/$g/g" "${catman_dir}dataextract/wc-extract-catalogentrymetadesc.xml" > "${catman_dir}dataextract/wc-extract-catalogentrymetadesc-runnable.xml"

      echo "Start DataExtract - Categories"
      docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD ${catman_container_dir}dataextract/wc-dataextract-master.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=AttributeDictionaryAttributeAllowedValues,CatalogEntryDescriptionName,CatalogEntryDescriptionShortDesc,CatalogEntryDescriptionLongDesc,CatalogEntryDescriptionPublished,CatalogEntryDescriptionKeyword,CatalogEntrySEO -DlogFilePath=${translation_baseshared_container_dir}ExtractForPublish/wc-dataextract-master$e.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=$f -DenvPath=$wcenvpath_dir -DoutputLocation=${translation_baseshared_container_dir}ExtractForPublish/catentry$e"
      docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD ${catman_container_dir}dataextract/wc-dataextract-master-metadata.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=CatalogEntrySEOPageTitle,CatalogEntrySEOMetaDesc -DlogFilePath=${translation_baseshared_container_dir}ExtractForPublish/wc-dataextract-master-metadata$e-$f.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=$f -DenvPath=$wcenvpath_dir -DoutputLocation=${translation_baseshared_container_dir}ExtractForPublish/catentry$e"

      rm -f ${catman_dir}dataextract/*-runnable.xml
      sed "s/CatalogEntryDescriptionKeyword/CatalogEntryDescription/" "${translation_baseshared_dir}/ExtractForPublish/catentry${e}keyword-output-raw.csv" > "${translation_baseshared_dir}/ExtractForPublish/catentry${e}keyword-output.csv"
      sed "s/CatalogEntryDescriptionLongDesc/CatalogEntryDescription/" "${translation_baseshared_dir}/ExtractForPublish/catentry${e}longdesc-output-raw.csv" > "${translation_baseshared_dir}/ExtractForPublish/catentry${e}longdesc-output.csv"
      sed "s/CatalogEntryDescriptionName/CatalogEntryDescription/" "${translation_baseshared_dir}/ExtractForPublish/catentry${e}name-output-raw.csv" > "${translation_baseshared_dir}/ExtractForPublish/catentry${e}name-output.csv"
      sed "s/CatalogEntryDescriptionPublished/CatalogEntryDescription/" "${translation_baseshared_dir}/ExtractForPublish/catentry${e}published-output-raw.csv" > "${translation_baseshared_dir}/ExtractForPublish/catentry${e}published-output.csv"
      sed "s/CatalogEntryDescriptionShortDesc/CatalogEntryDescription/" "${translation_baseshared_dir}/ExtractForPublish/catentry${e}shortdesc-output-raw.csv" > "${translation_baseshared_dir}/ExtractForPublish/catentry${e}shortdesc-output.csv"
      sed "s/CatalogEntrySEOMetaDesc/CatalogEntrySEO/" "${translation_baseshared_dir}/ExtractForPublish/catentry${e}metadesc$f-output-raw.csv" > "${translation_baseshared_dir}/ExtractForPublish/catentry${e}metadesc$f-output.csv"
      sed "s/CatalogEntrySEOPageTitle/CatalogEntrySEO/" "${translation_baseshared_dir}/ExtractForPublish/catentry${e}pagetitle$f-output-raw.csv" > "${translation_baseshared_dir}/ExtractForPublish/catentry${e}pagetitle$f-output.csv"
      rm -f ${translation_baseshared_dir}/ExtractForPublish/catentry$e*-output-raw.csv

      echo "END EXTRACTION FOR PUBLISH - CATEGORY LEVEL"

      echo "Publish - Translation Report for Categories"
	    if [ "$4" != "AutoPublish" ] ; then
    	  node --max_old_space_size=4096 ${catman_dir}/cm_modules/publishTranslationReport.js $env $store $e
      fi
    done < "$i"
  done
else
  echo "${translation_baseshared_dir}ExtractForPublish/tms-publish-control-category*.txt: No such file or directory"
fi

#for item level translation
if ls ${translation_baseshared_dir}ExtractForPublish/tms-publish-control-item*.txt 1> /dev/null 2>&1; then
  for i in ${translation_baseshared_dir}ExtractForPublish/tms-publish-control-item*.txt
  do
   while IFS=\| read -r a b c d e f g
   do
    #echo "$a $b $c $d $e $f $g"
    echo "START EXTRACTION FOR PUBLISH - ITEM LEVEL"
    echo "LANGAUGE ID: $f"
    echo "BATCH ID: $e"
    export g=`echo $g | sed "s/''/'/g"`
    sed "s~\${partNumber}~$g~g" "${catman_dir}dataextract/wc-extract-attrdictattrval-item.xml" > "${catman_dir}dataextract/wc-extract-attrdictattrval-item-runnable.xml"
    sed "s~\${partNumber}~$g~g" "${catman_dir}dataextract/wc-extract-catalogentrydescname-item.xml" > "${catman_dir}dataextract/wc-extract-catalogentrydescname-item-runnable.xml"
    sed "s~\${partNumber}~$g~g" "${catman_dir}dataextract/wc-extract-catalogentrydescshortdesc-item.xml" > "${catman_dir}dataextract/wc-extract-catalogentrydescshortdesc-item-runnable.xml"
    sed "s~\${partNumber}~$g~g" "${catman_dir}dataextract/wc-extract-catalogentrydesclongdesc-item.xml" > "${catman_dir}dataextract/wc-extract-catalogentrydesclongdesc-item-runnable.xml"
    sed "s~\${partNumber}~$g~g" "${catman_dir}dataextract/wc-extract-catalogentrydescpublished-item.xml" > "${catman_dir}dataextract/wc-extract-catalogentrydescpublished-item-runnable.xml"
    sed "s~\${partNumber}~$g~g" "${catman_dir}dataextract/wc-extract-catalogentrydesckeyword-item.xml" > "${catman_dir}dataextract/wc-extract-catalogentrydesckeyword-item-runnable.xml"
    sed "s~\${partNumber}~$g~g" "${catman_dir}dataextract/wc-extract-catalogentryurlkeyword-item.xml" > "${catman_dir}dataextract/wc-extract-catalogentryurlkeyword-item-runnable.xml"
    sed "s~\${partNumber}~$g~g" "${catman_dir}dataextract/wc-extract-catalogentrypagetitle-item.xml" > "${catman_dir}dataextract/wc-extract-catalogentrypagetitle-item-runnable.xml"
    sed "s~\${partNumber}~$g~g" "${catman_dir}dataextract/wc-extract-catalogentrymetadesc-item.xml" > "${catman_dir}dataextract/wc-extract-catalogentrymetadesc-item-runnable.xml"

    echo "Start Data Extract - Items"
   	docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD ${catman_container_dir}dataextract/wc-dataextract-master.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=AttributeDictionaryAttributeAllowedValuesItemLevel,CatalogEntryDescriptionNameItemLevel,CatalogEntryDescriptionShortDescItemLevel,CatalogEntryDescriptionLongDescItemLevel,CatalogEntryDescriptionPublishedItemLevel,CatalogEntryDescriptionKeywordItemLevel,CatalogEntrySEOItemLevel -DlogFilePath=${translation_baseshared_container_dir}ExtractForPublish/wc-dataextract-master$e.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=$f -DenvPath=$wcenvpath_dir -DoutputLocation=${translation_baseshared_container_dir}ExtractForPublish/catentry$e"
   	docker exec ts-utils-job-$build_id /bin/bash -c "$DATAEXTRACTCMD ${catman_container_dir}dataextract/wc-dataextract-master-metadata.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=CatalogEntrySEOPageTitleItemLevel,CatalogEntrySEOMetaDescItemLevel -DlogFilePath=${translation_baseshared_container_dir}ExtractForPublish/wc-dataextract-master-metadata$e-$f.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=$f -DenvPath=$wcenvpath_dir -DoutputLocation=${translation_baseshared_container_dir}ExtractForPublish/catentry$e"
	  

    rm -f ${catman_dir}dataextract/*-runnable.xml
    sed "s/CatalogEntryDescriptionKeywordItemlevel/CatalogEntryDescription/" "${translation_baseshared_dir}ExtractForPublish/catentry${e}keyword-output-raw.csv" > "${translation_baseshared_dir}/ExtractForPublish/catentry${e}keyword-output.csv"
    sed "s/CatalogEntryDescriptionLongDescItemlevel/CatalogEntryDescription/" "${translation_baseshared_dir}ExtractForPublish/catentry${e}longdesc-output-raw.csv" > "${translation_baseshared_dir}/ExtractForPublish/catentry${e}longdesc-output.csv"
    sed "s/CatalogEntryDescriptionNameItemlevel/CatalogEntryDescription/" "${translation_baseshared_dir}ExtractForPublish/catentry${e}name-output-raw.csv" > "${translation_baseshared_dir}/ExtractForPublish/catentry${e}name-output.csv"
    sed "s/CatalogEntryDescriptionPublishedItemlevel/CatalogEntryDescription/" "${translation_baseshared_dir}ExtractForPublish/catentry${e}published-output-raw.csv" > "${translation_baseshared_dir}/ExtractForPublish/catentry${e}published-output.csv"
    sed "s/CatalogEntryDescriptionShortDescItemlevel/CatalogEntryDescription/" "${translation_baseshared_dir}ExtractForPublish/catentry${e}shortdesc-output-raw.csv" > "${translation_baseshared_dir}/ExtractForPublish/catentry${e}shortdesc-output.csv"
    sed "s/CatalogEntrySEOMetaDescItemlevel/CatalogEntrySEO/" "${translation_baseshared_dir}ExtractForPublish/catentry${e}metadesc$f-output-raw.csv" > "${translation_baseshared_dir}/ExtractForPublish/catentry${e}metadesc$f-output.csv"
    sed "s/CatalogEntrySEOPageTitleItemlevel/CatalogEntrySEO/" "${translation_baseshared_dir}ExtractForPublish/catentry${e}pagetitle$f-output-raw.csv" > "${translation_baseshared_dir}/ExtractForPublish/catentry${e}pagetitle$f-output.csv"
    rm -f ${translation_baseshared_dir}/ExtractForPublish/catentry$e*-output-raw.csv

    echo "END EXTRACTION FOR PUBLISH - ITEM LEVEL"

    echo "Publish - Translation Report for Items"
    if [ "$autoPublish" != "AutoPublish" ] ; then
    	node --max_old_space_size=4096 ${catman_dir}/cm_modules/publishTranslationReport.js $env $store $e
    fi
   done < "$i"
  done
else
  echo "${translation_baseshared_dir}ExtractForPublish/tms-publish-control-item*.txt: No such file or directory"
fi 