#!/usr/bin/bash
# Data extract Marketing and Promotional Data from the Database
#working directory in quickbuild =  /opt/websphere/catalogManager
#arg1 = storeIdentifier
#arg2 = export report type
#arg3 = export location
#arg4 = build version

if [ "$1" = "" ] ; then
  echo The syntax of the command is incorrect. Please provide Store Identifier . eg. ProTeam
  echo   $1 environment
  exit 1
fi

if [ "$2" = "" ] ; then
  echo The syntax of the command is incorrect. Please provide Report Type [CustomerSegment, MarketingContent, MarketingSpot, Promotion, CatalogFilter]
  echo   $2 store
  exit 1
fi

if [ "$3" = "" ] ; then
  echo The syntax of the command is incorrect. Please provide Report output location eg. [/websphere/spdata/Dev/CatMan/Export/MarketingAndPromotion]
echo   $3 environment store build-tag
  exit 1
fi

echo   =====================================================================================================
echo   Initializing export parameter
echo   Store Identifier : $1
echo   Report Type : $2
echo   Report output location: $3
echo   Build Version: $4
echo   =====================================================================================================

#declare variable
export CURRDIR=`pwd`
export DATAEXTRACTCMD=./dataextract.sh
export DATAEXTRACT_CONFIG_PATH=/opt/websphere/catalogManager/dataextract/
export WCBINDIR=/opt/websphere/CommerceServer/bin
export ENVPATH=/opt/websphere/CommerceServer/instances/dcx/properties/catalogManager/

# STORE_IDENTIFIER {FAN, ProTeam, WSV, Climate, InSinkErator, Sensi, EMR, EmersonNorthStarSAS}
export STORE_IDENTIFIER=$1

#FAN_SALES_CATALOG, PROTEAM_SALES_CATALOG, INSINKERATOR_SALES_CATALOG, CLIMATE_SALES_CATALOG, SENSI_SALES_CATALOG
export CATALOG_IDENTIFIER=""

#export REPORT_TYPE=CustomerSegment
#export REPORT_TYPE=MarketingContent
#export REPORT_TYPE=MarketingSpot
#export REPORT_TYPE=Promotion
#export REPORT_TYPE=CatalogFilter
export REPORT_TYPE=$2
export REPORT_TYPE_CONFIG=""

export DEXTRACTOUTPUTLOC=$3
export SYSDATE=`date '+%Y%m%d'`
export BUILD_DATE=$1"_"$SYSDATE

if [ "$4" = "" ] ; then
    export BUILD_DATE=_$SYSDATE
fi

#Product DataExtract
cd $WCBINDIR
#$DATAEXTRACTCMD $CURRDIR/dataextract/$REPORT_TYPE/wc-dataextract-customer-segment.xml -DstoreIdentifier=$STORE_IDENTIFIER -DcatalogIdentifier=$CATALOG_IDENTIFIER -DlogFilePath=$CURRDIR/wc-dataextract-$REPORT_TYPE.log -DlangId=-1 -DenvPath=$ENVPATH -DoutputLocation=$DEXTRACTOUTPUTLOC/ -Dbatchfile=$batchfile -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false

# STORE_IDENTIFIER {FAN, ProTeam, InSinkErator, Climate, Sensi}
# Select which CATALOG_IDENTIFIER should be used based on STORE_IDENTIFIER
#FAN_SALES_CATALOG, PROTEAM_SALES_CATALOG, INSINKERATOR_SALES_CATALOG, CLIMATE_SALES_CATALOG, SENSI_SALES_CATALOG
case $STORE_IDENTIFIER in
	FAN)
		export CATALOG_IDENTIFIER=FAN_SALES_CATALOG
		;;
	ProTeam)
		export CATALOG_IDENTIFIER=PROTEAM_SALES_CATALOG
		;;
	WSV)
		export CATALOG_IDENTIFIER=WSV_SALES_CATALOG
		;;
	Climate)
		export CATALOG_IDENTIFIER=CLIMATE_SALES_CATALOG
		;;
	InSinkErator)
		export CATALOG_IDENTIFIER=INSINKERATOR_SALES_CATALOG
		;;
	Sensi)
		export CATALOG_IDENTIFIER=SENSI_SALES_CATALOG
		;;
	EMR)
		export CATALOG_IDENTIFIER=EMR_SALES_CATALOG
		;;
	EmersonNorthstarSAS)
		export CATALOG_IDENTIFIER=EMR_SALES_CATALOG
		;;
	*)
	echo ERROR: STORE_IDENTIFIER [$STORE_IDENTIFIER] not supported.
	    exit 1
	;;
esac

# STORE_IDENTIFIER {FAN, ProTeam, WSV, Climate, InSinkErator, Sensi, EMR}  TODO: EmersonNorthStarSAS



#REPORT_TYPE = CustomerSegment, MarketingContent, MarketingSpot, Promotion, CatalogFilter
case $REPORT_TYPE in
	CustomerSegment)
		echo "CustomerSegment data extract"
		export REPORT_TYPE_CONFIG=wc-dataextract-customer-segment.xml
		;;
	MarketingContent)
		echo "MarketingContent data extract"
		export REPORT_TYPE_CONFIG=wc-dataextract-marketing-content.xml
		;;
	MarketingSpot)
		echo "MarketingSpot data extract"
		export REPORT_TYPE_CONFIG=wc-dataextract-marketing-espot.xml
		;;
	Promotion)
		echo "Promotion data extract"
		export REPORT_TYPE_CONFIG=wc-dataextract-promotion.xml
		;;
	CatalogFilter)
		echo "CatalogFilter data extract"
		export REPORT_TYPE_CONFIG=wc-dataextract-catalog-filter.xml
		;;
	*)
	echo ERROR: REPORT_TYPE [$REPORT_TYPE] not supported.
	    exit 1
	;;
esac

## EXECUTE DATA EXTRACT COMMAND
echo   =====================================================================================================
echo   STORE_IDENTIFIER: $STORE_IDENTIFIER
echo   CATALOG_IDENTIFIER: $CATALOG_IDENTIFIER
echo   REPORT_TYPE: $REPORT_TYPE
echo   REPORT_TYPE_CONFIG: $REPORT_TYPE_CONFIG
echo   =====================================================================================================
echo   $STORE_IDENTIFIER $REPORT_TYPE Data extract process start.
echo   =====================================================================================================
$DATAEXTRACTCMD $DATAEXTRACT_CONFIG_PATH/$REPORT_TYPE_CONFIG -DstoreIdentifier=$STORE_IDENTIFIER -DcatalogIdentifier=$CATALOG_IDENTIFIER -DlogFilePath=$CURRDIR/wc-dataextract-$REPORT_TYPE.log -DlangId=-1 -DenvPath=$ENVPATH -DoutputLocation=$DEXTRACTOUTPUTLOC/$STORE_IDENTIFIER/ -DbuildDate=$BUILD_DATE -Dbatchfile=$batchfile -Djava.security.egd=file:/dev/./urandom -DXmlValidation=false

echo   =====================================================================================================
echo   $STORE_IDENTIFIER $REPORT_TYPE Data extract execution completed.
echo   =====================================================================================================
