#!/usr/bin/bash
# Data extract Marketing and Promotional Data from the Database
#working directory in quickbuild =  /opt/websphere/catalogManager
#arg1 = environment
#arg2 = storeIdentifier

if [ "$1" = "" ] ; then
  echo The syntax of the command is incorrect. Please provide Environment . eg. local/dev/stage/prod
  echo  $1 environment
  exit 1
fi

if [ "$2" = "" ] ; then
  echo The syntax of the command is incorrect. Please provide Store Identifier . eg. ProTeam
  echo   $2 storeIdentifier
  exit 1
fi

if [ "$1" = "dev" ] ; then
  export BASEDIR=/websphere/spdata/Dev/Marketing/process/$2/
  export ARCHIVEDIR=/websphere/spdata/Dev/Marketing/
fi
if [ "$1" = "stage" ] ; then
  export BASEDIR=/websphere/spdata/Staging/Marketing/process/$2/
  export ARCHIVEDIR=/websphere/spdata/Staging/Marketing/
fi
if [ "$1" = "prod" ] ; then
  export BASEDIR=/websphere/spdata/Prod/Marketing/process/$2/
  export ARCHIVEDIR=/websphere/spdata/Prod/Marketing/
fi


#declare variable
export CURRDIR=`pwd`
export DATALOADCMD=./dataload.sh
export WCBINDIR=/opt/websphere/CommerceServer/bin
export ENVPATH=/opt/websphere/CommerceServer/instances/dcx/properties/catalogManager/

export batchfile=$3

cd ..

if [ "$1" = "local" ] ; then
  export CURRDIR='F:\catman\catalogmanager'
  export DATALOADCMD=./dataload.bat
  export WCBINDIR=F:\\IBM\\WCDE80\\bin  
  export ENVPATH='F:\catman\catalogmanager\dataload\'
  export BASEDIR='F:\catman\catalogmanager\Marketing\process\ProTeam\'
  export ARCHIVEDIR='F:\catman\catalogmanager\Marketing\'
fi

echo   "====================================================================================================="
echo   "Initializing market data load parameter"
echo   "Environment : $1"
echo   "Store Identifier : $2"
echo   "Base Directory : $BASEDIR"
echo   "Environment Path: $ENVPATH"
echo   "WC bin Directory: $WCBINDIR"
echo   "Current Directory: $CURRDIR"
echo   "====================================================================================================="

# STORE_IDENTIFIER {FAN, ProTeam, WSV, Climate, InSinkErator, Sensi, EMR, EmersonNorthStarSAS}
export STORE_IDENTIFIER=$2

#FAN_SALES_CATALOG, PROTEAM_SALES_CATALOG, INSINKERATOR_SALES_CATALOG, CLIMATE_SALES_CATALOG, SENSI_SALES_CATALOG
export CATALOG_IDENTIFIER="EmersonCAS"

cd $WCBINDIR
$DATALOADCMD $CURRDIR/dataload/wc-dataload-marketing.xml -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false -DlogFilePath=$CURRDIR/Marketing/logs/wc-dataload-marketing-$batchfile.log -DstoreIdentifier=$STORE_IDENTIFIER -DcatalogIdentifier=EmersonCAS -DenvPath=$ENVPATH  -DoutputLocation=$BASEDIR -Dbatchfile=$batchfile


export sourceFile=$BASEDIR'MarketingContentDescription.csv'
export destinationFile=$ARCHIVEDIR'archive/MarketingContentDescription-'$STORE_IDENTIFIER'-'$batchfile.csv
mv $sourceFile $destinationFile