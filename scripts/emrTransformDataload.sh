#!/usr/bin/bash

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

#declare variable
export CURRDIR=`pwd`
export DATAEXTRACTCMD=./dataextract.sh
export DATALOADCMD=./dataload.sh
export WCBINDIR=/opt/websphere/CommerceServer/bin
export ENVPATH=/opt/websphere/CommerceServer/instances/dcx/properties/catalogManager/
export DLOADOUTPUTLOC=/opt/websphere/catalogManager/dataload/EMR/

## setup extended properties
#export working_directory=`pwd`
export working_directory="$CURRDIR/"
export property_reader=$working_directory"scripts/util/propertyReader.sh"

## Initialize variables
export sh_file_ext=$($property_reader $env app fileextensions.sh)

export transform_workspace_folder=$($property_reader $env sys catman.workspaceDefault)
export resources_folder=$($property_reader $env sys catman.wrkspcResource)
export tmp_folder=$($property_reader $env sys catman.wrkspctmp)
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

cd $CURRDIR

## execute preprocess
$transform_preprocessor $env $store $build_tag

## execute emrcatalogmanager transform script
echo 'START TRANSFORM PROCESS'
~/node.sh --max_old_space_size=4096 $CURRDIR/emrcatalogmanager.js $*

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

if [ -e ${DLOADOUTPUTLOC}/dataload_csv_$3*.txt ] ; then
export FILE="${DLOADOUTPUTLOC}/dataload_csv_$3*.txt"
export batchfile=`cat $FILE`
echo "$batchfile"
#execute dataload
cd $WCBINDIR
$DATALOADCMD $CURRDIR/dataload/wc-dataload-master-delete.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$CURRDIR/wc-dataload-master-delete-$batchfile.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$ENVPATH  -DoutputLocation=$DLOADOUTPUTLOC -Dbatchfile=$batchfile
$DATALOADCMD $CURRDIR/dataload/wc-dataload-master.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$CURRDIR/wc-dataload-master-$batchfile.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$ENVPATH  -DoutputLocation=$DLOADOUTPUTLOC -Dbatchfile=$batchfile
$DATALOADCMD $CURRDIR/dataload/wc-dataload-master-seo.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$CURRDIR/wc-dataload-master-seo-$batchfile.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$ENVPATH  -DoutputLocation=$DLOADOUTPUTLOC -Dbatchfile=$batchfile

log_files_array+=("$CURRDIR/wc-dataload-master-delete-$batchfile.log")
log_files_array+=("$CURRDIR/wc-dataload-master-$batchfile.log")
log_files_array+=("$CURRDIR/wc-dataload-master-seo-$batchfile.log")

#multi store support
#TODO: loop through stores and invoke dataload
#TBD: code refactoring - sales category lookup was separated because of -DstoreIdentifier and -DcatalogIdentifier
$DATALOADCMD $CURRDIR/dataload/wc-dataload-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$CURRDIR/wc-dataload-sales-$batchfile.log -DstoreIdentifier=EMR -DcatalogIdentifier=EMR_SALES_CATALOG -DenvPath=$ENVPATH -DoutputLocation=$DLOADOUTPUTLOC -Dbatchfile=$batchfile
$DATALOADCMD $CURRDIR/dataload/wc-dataload-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$CURRDIR/wc-dataload-sales-emr-old-$batchfile.log -DstoreIdentifier=EMR-OLD -DcatalogIdentifier=TEST_SALES_CATALOG -DenvPath=$ENVPATH -DoutputLocation=$DLOADOUTPUTLOC -Dbatchfile=$batchfile
$DATALOADCMD $CURRDIR/dataload/wc-dataload-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$CURRDIR/wc-dataload-sales-climate-$batchfile.log -DstoreIdentifier=Climate -DcatalogIdentifier=CLIMATE_SALES_CATALOG -DenvPath=$ENVPATH -DoutputLocation=$DLOADOUTPUTLOC -Dbatchfile=$batchfile
$DATALOADCMD $CURRDIR/dataload/wc-dataload-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$CURRDIR/wc-dataload-sales-ise-$batchfile.log -DstoreIdentifier=InSinkErator -DcatalogIdentifier=INSINKERATOR_SALES_CATALOG -DenvPath=$ENVPATH -DoutputLocation=$DLOADOUTPUTLOC -Dbatchfile=$batchfile
$DATALOADCMD $CURRDIR/dataload/wc-dataload-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$CURRDIR/wc-dataload-sales-sensi-$batchfile.log -DstoreIdentifier=Sensi -DcatalogIdentifier=SENSI_SALES_CATALOG -DenvPath=$ENVPATH -DoutputLocation=$DLOADOUTPUTLOC -Dbatchfile=$batchfile
$DATALOADCMD $CURRDIR/dataload/wc-dataload-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$CURRDIR/wc-dataload-sales-proteam-$batchfile.log -DstoreIdentifier=ProTeam -DcatalogIdentifier=PROTEAM_SALES_CATALOG -DenvPath=$ENVPATH -DoutputLocation=$DLOADOUTPUTLOC -Dbatchfile=$batchfile
$DATALOADCMD $CURRDIR/dataload/wc-dataload-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$CURRDIR/wc-dataload-sales-wsv-$batchfile.log -DstoreIdentifier=WSV -DcatalogIdentifier=WSV_SALES_CATALOG -DenvPath=$ENVPATH -DoutputLocation=$DLOADOUTPUTLOC -Dbatchfile=$batchfile
$DATALOADCMD $CURRDIR/dataload/wc-dataload-sales.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$CURRDIR/wc-dataload-sales-fan-$batchfile.log -DstoreIdentifier=FAN -DcatalogIdentifier=FAN_SALES_CATALOG -DenvPath=$ENVPATH -DoutputLocation=$DLOADOUTPUTLOC -Dbatchfile=$batchfile

log_files_array+=("$CURRDIR/wc-dataload-sales-emr-old-$batchfile.log")
log_files_array+=("$CURRDIR/wc-dataload-sales-$batchfile.log")
log_files_array+=("$CURRDIR/wc-dataload-sales-climate-$batchfile.log")
log_files_array+=("$CURRDIR/wc-dataload-sales-ise-$batchfile.log")
log_files_array+=("$CURRDIR/wc-dataload-sales-sensi-$batchfile.log")
log_files_array+=("$CURRDIR/wc-dataload-sales-proteam-$batchfile.log")
log_files_array+=("$CURRDIR/wc-dataload-sales-wsv-$batchfile.log")
log_files_array+=("$CURRDIR/wc-dataload-sales-fan-$batchfile.log")

#multi language support for metadata
for k in -1 -2 -3 -4 -5 -6 -7 -9 -10 -20 -22 -1000 -1001 -1002 -1003 -1004 -1005 -1006 -1007 -1008 -1009 -1010 -1011 -1012 -1013 -1014 -1015 -1016 -1017 -1018 -1019 -1020 -1021 -1022
do
	if [ -e ${DLOADOUTPUTLOC}catentry${batchfile}pagetitle$k-output.csv ] ; then
		$DATALOADCMD $CURRDIR/dataload/wc-dataload-translation-seo.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=CatalogEntryPageTitle -DlogFilePath=$CURRDIR/wc-dataload-translation-pagetitle$k-$batchfile.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=$k -DenvPath=$ENVPATH -DinputLocation=${DLOADOUTPUTLOC}catentry$batchfile >> $CURRDIR/loadtranslations$batchfile.log 2>&1
    log_files_array+=("$CURRDIR/wc-dataload-translation-pagetitle$k-$batchfile.log")
  fi
	if [ -e ${DLOADOUTPUTLOC}catentry${batchfile}metadesc$k-output.csv ] ; then
		$DATALOADCMD $CURRDIR/dataload/wc-dataload-translation-seo.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DLoadOrder=CatalogEntryMetaDesc -DlogFilePath=$CURRDIR/wc-dataload-translation-metadesc$k-$batchfile.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=$k -DenvPath=$ENVPATH -DinputLocation=${DLOADOUTPUTLOC}catentry$batchfile >> $CURRDIR/loadtranslations$batchfile.log 2>&1
    log_files_array+=("$CURRDIR/wc-dataload-translation-metadesc$k-$batchfile.log")
  fi
done

# dataload errors reporting
cd $CURRDIR
echo "Read Dataload Logs for Reporting"
for log_file_path in "${log_files_array[@]}"
do
  $dataload_log_reader $env "$process_name" "$batchfile" "$log_file_path"
done

echo "done"

else
  echo Nothing found to process.
fi