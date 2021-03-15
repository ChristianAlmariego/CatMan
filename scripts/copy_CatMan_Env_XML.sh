#!/bin/bash
echo 1

if [ "$2" = "" ] ; then
  echo The syntax of the command is incorrect.
  exit 1
fi
if [ "$1" = "" ] ; then
  echo The syntax of the command is incorrect.
  exit 1
fi

echo 2
#declare variable
export CURRDIR=`pwd`

cd $CURRDIR

if [ -e "wc-dataload-env.xml" ]; then
    echo Environment xml exist
 else
    cp /opt/websphere/catalogManager/dataload/wc-dataload-env-$1-$2.xml /opt/websphere/CommerceServer/instances/dcx/properties/catalogManager/wc-dataload-env.xml
    cp /opt/websphere/catalogManager/dataextract/wc-dataextract-env-$1-$2.xml /opt/websphere/CommerceServer/instances/dcx/properties/catalogManager/wc-dataextract-env.xml
fi

if [ -e "wc-dataload-env.xml" ]; then
    echo Environment xml exist
 else
    cp /opt/websphere/catalogManager/dataload/wc-dataload-env-$1-$2.xml /opt/websphere/CommerceServer/instances/dcx/properties/catalogManager/wc-dataload-env.xml
    cp /opt/websphere/catalogManager/dataextract/wc-dataextract-env-$1-$2.xml /opt/websphere/CommerceServer/instances/dcx/properties/catalogManager/wc-dataextract-env.xml
fi