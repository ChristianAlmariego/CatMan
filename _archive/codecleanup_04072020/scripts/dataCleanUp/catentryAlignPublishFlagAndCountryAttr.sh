#!/usr/bin/bash
#working directory in quickbuild =  /opt/websphere/catalogManager
if [ "$2" = "" ] ; then
  echo The syntax of the command is incorrect.
  echo $0 store
  exit 1
fi
if [ "$1" = "" ] ; then
  echo The syntax of the command is incorrect.
  echo $0 environment
  exit 1
fi

#declare variables
export CURRDIR=`pwd`
export DATAEXTRACTCMD=./dataextract.sh
export DATALOADCMD=./dataload.sh
export WCBINDIR=/opt/websphere/CommerceServer/bin
export ENVPATH=/opt/websphere/CommerceServer/instances/dcx/properties/catalogManager/

export DATACLEANUPDIR=$CURRDIR/scripts/dataCleanUp
export DATACLEANUPPROCESSDIR=$DATACLEANUPDIR/catentryCountryPublishFlagAligning
export DATACLEANUPPROCESSLOGSDIR=$DATACLEANUPPROCESSDIR/logs
export DATACLEANUPRESOURCESDIR=$DATACLEANUPDIR/resources
export DATACLEANUPEXTRACTDIR=$DATACLEANUPDIR/dataextract
export DATACLEANUPEXTRACTTMPDIR=$DATACLEANUPEXTRACTDIR/tmp
export DATACLEANUPEXTRACTLOGSDIR=$DATACLEANUPEXTRACTDIR/logs
export DATACLEANUPLOADDIR=$DATACLEANUPDIR/dataload
export DATACLEANUPLOADTMPDIR=$DATACLEANUPLOADDIR/tmp
export DATACLEANUPLOADLOGSDIR=$DATACLEANUPLOADDIR/logs
export DATACLEANUPLOADPROCESSINGDIR=$DATACLEANUPLOADDIR/processing

export deleteCountryAttributeJs=$DATACLEANUPPROCESSDIR/deleteCountryAttribute.js
export updatePublishFlagJs=$DATACLEANUPPROCESSDIR/updatePublishFlag.js

export environment=$1
export store_name=$2

for country_code_entry in FR DE IT ES BR CN TW KR JP RU RO PL EG CN GB SG MX AE NL IN SE NO FI DK HU CZ SK TR AU CA CA CH AT BE CH BE US
do
  export country_code=$country_code_entry

  #logs
  echo 'START COUNTRY-PUBLISH FLAG ALIGNMENT PROCESS'
  echo 'Country Code: '$country_code

  export process_id=""
  export output_filename=""

  export dataextract_config_file=""
  export dataextract_config_filename=""
  export runnable_dataextract_config_file=""
  export runnable_dataextract_config_filename=""

  export extract_config_file=""
  export extract_config_filename=""
  export runnable_extract_config_file=""
  export runnable_extract_config_filename=""

  export dataload_config_file=""
  export dataload_config_filename=""
  export runnable_dataload_config_file=""
  export runnable_dataload_config_filename=""

  export loader_config_file=""
  export loader_config_filename=""
  export runnable_loader_config_file=""
  export runnable_loader_config_filename=""

  #extract catentries which country attribute exists but publish flag is missing
  cd $WCBINDIR

  process_id="CatEntCountryExistMissingFlag_"$country_code
  output_filename=$process_id".csv"

  echo 'STEP: DATAEXTRACT - '$process_id

  dataextract_config_file="wc-dataextract-catentry-countryexist-missingpublishflag.xml"
  dataextract_config_filename=`echo $dataextract_config_file | sed "s/.xml//g"`
  runnable_dataextract_config_filename=$dataextract_config_filename"_"$process_id
  runnable_dataextract_config_file=$runnable_dataextract_config_filename".xml"

  extract_config_file="wc-extract-catentry-countryexist-missingpublishflag.xml"
  extract_config_filename=`echo $extract_config_file | sed "s/.xml//g"`
  runnable_extract_config_filename=$extract_config_filename"_"$process_id
  runnable_extract_config_file=$runnable_extract_config_filename".xml"

  sed "s/\${runnableExtractConfigFile}/$runnable_extract_config_file/g" $DATACLEANUPEXTRACTDIR'/'$dataextract_config_file > $DATACLEANUPEXTRACTTMPDIR'/'$runnable_dataextract_config_file
  sed "s/\${countryCode}/$country_code/g" $DATACLEANUPEXTRACTDIR'/'$extract_config_file > $DATACLEANUPEXTRACTTMPDIR'/'$runnable_extract_config_file

  $DATAEXTRACTCMD $DATACLEANUPEXTRACTTMPDIR/$runnable_dataextract_config_file -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$DATACLEANUPEXTRACTLOGSDIR/$process_id.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=-1 -DenvPath=$ENVPATH -DoutputLocation=$DATACLEANUPRESOURCESDIR/$output_filename

  #delete country attibute of products previously extracted
  echo 'STEP: DATALOAD - '$process_id
  cd $CURRDIR

  dataload_config_file="wc-dataload-catentry-attributes.xml"

  ~/node.sh $deleteCountryAttributeJs $environment $store_name $CURRDIR $process_id $country_code $output_filename> $DATACLEANUPPROCESSLOGSDIR/$process_id.log

  cd $WCBINDIR
  $DATALOADCMD $DATACLEANUPLOADDIR/$dataload_config_file -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$DATACLEANUPLOADLOGSDIR/$process_id.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$ENVPATH -DoutputLocation=$DATACLEANUPLOADPROCESSINGDIR/ -DprocessId=$process_id

  #extract catentries which country attribute exists but publish flag is missing
  cd $WCBINDIR

  process_id="CatEntCountryExistLocalesNotPublished_"$country_code
  output_filename=$process_id".csv"

  echo 'STEP: DATAEXTRACT - '$process_id

  dataextract_config_file="wc-dataextract-catentry-countryexist-localesnotpublished.xml"
  dataextract_config_filename=`echo $dataextract_config_file | sed "s/.xml//g"`
  runnable_dataextract_config_filename=$dataextract_config_filename"_"$process_id
  runnable_dataextract_config_file=$runnable_dataextract_config_filename".xml"

  extract_config_file="wc-extract-catentry-countryexist-localesnotpublished.xml"
  extract_config_filename=`echo $extract_config_file | sed "s/.xml//g"`
  runnable_extract_config_filename=$extract_config_filename"_"$process_id
  runnable_extract_config_file=$runnable_extract_config_filename".xml"

  sed "s/\${runnableExtractConfigFile}/$runnable_extract_config_file/g" $DATACLEANUPEXTRACTDIR'/'$dataextract_config_file > $DATACLEANUPEXTRACTTMPDIR'/'$runnable_dataextract_config_file
  sed "s/\${countryCode}/$country_code/g" $DATACLEANUPEXTRACTDIR'/'$extract_config_file > $DATACLEANUPEXTRACTTMPDIR'/'$runnable_extract_config_file

  $DATAEXTRACTCMD $DATACLEANUPEXTRACTTMPDIR/$runnable_dataextract_config_file -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$DATACLEANUPEXTRACTLOGSDIR/$process_id.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=-1 -DenvPath=$ENVPATH -DoutputLocation=$DATACLEANUPRESOURCESDIR/$output_filename

  #delete country attibute of products previously extracted
  echo 'STEP: DATALOAD - '$process_id
  cd $CURRDIR

  dataload_config_file="wc-dataload-catentry-attributes.xml"

  ~/node.sh $deleteCountryAttributeJs $environment $store_name $CURRDIR $process_id $country_code $output_filename> $DATACLEANUPPROCESSLOGSDIR/$process_id.log

  cd $WCBINDIR
  $DATALOADCMD $DATACLEANUPLOADDIR/$dataload_config_file -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$DATACLEANUPLOADLOGSDIR/$process_id.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$ENVPATH -DoutputLocation=$DATACLEANUPLOADPROCESSINGDIR/ -DprocessId=$process_id

  #extract catentries which country attribute is missing but published to any language under that country
  cd $WCBINDIR

  process_id="CatEntMissingCountryLocalesPublished_"$country_code
  output_filename=$process_id".csv"

  echo 'STEP: DATAEXTRACT - '$process_id

  dataextract_config_file="wc-dataextract-catentry-missingcountry-localespublished.xml"
  dataextract_config_filename=`echo $dataextract_config_file | sed "s/.xml//g"`
  runnable_dataextract_config_filename=$dataextract_config_filename"_"$process_id
  runnable_dataextract_config_file=$runnable_dataextract_config_filename".xml"

  extract_config_file="wc-extract-catentry-missingcountry-localespublished.xml"
  extract_config_filename=`echo $extract_config_file | sed "s/.xml//g"`
  runnable_extract_config_filename=$extract_config_filename"_"$process_id
  runnable_extract_config_file=$runnable_extract_config_filename".xml"

  sed "s/\${runnableExtractConfigFile}/$runnable_extract_config_file/g" $DATACLEANUPEXTRACTDIR'/'$dataextract_config_file > $DATACLEANUPEXTRACTTMPDIR'/'$runnable_dataextract_config_file
  sed "s/\${countryCode}/$country_code/g" $DATACLEANUPEXTRACTDIR'/'$extract_config_file > $DATACLEANUPEXTRACTTMPDIR'/'$runnable_extract_config_file

  $DATAEXTRACTCMD $DATACLEANUPEXTRACTTMPDIR/$runnable_dataextract_config_file -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$DATACLEANUPEXTRACTLOGSDIR/$process_id.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DlangId=-1 -DenvPath=$ENVPATH -DoutputLocation=$DATACLEANUPRESOURCESDIR/$output_filename

  #update publish flag of the previously extracted list to 0
  echo 'STEP: DATALOAD - '$process_id
  cd $CURRDIR

  dataload_config_file="wc-dataload-catentry-published.xml"

  ~/node.sh $updatePublishFlagJs $environment $store_name $CURRDIR $process_id $country_code $output_filename> $DATACLEANUPPROCESSLOGSDIR/$process_id.log

  cd $WCBINDIR
  $DATALOADCMD $DATACLEANUPLOADDIR/$dataload_config_file -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$DATACLEANUPLOADLOGSDIR/$process_id.log -DstoreIdentifier=EmersonCAS -DcatalogIdentifier=EmersonCAS -DenvPath=$ENVPATH -DoutputLocation=$DATACLEANUPLOADPROCESSINGDIR/ -DprocessId=$process_id

  #cleanup tmp files
  rm -f ${DATACLEANUPEXTRACTTMPDIR}/*.*
  rm -f ${DATACLEANUPLOADTMPDIR}/*.*

done

if [ $? -eq 0 ]; then
    echo OK
else
    echo FAIL
    exit 1
fi
