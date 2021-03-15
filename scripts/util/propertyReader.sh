#!/bin/bash

########################################################
#   Emerson Property c2020
#   Definition:     Bash Property File Reader
#   Author:         Jerome Canete
#   Revisions:
#          12/23/2020   -   Created
########################################################

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "PropertyReader Error: Invalid Environment"
  exit 1
fi

if [ "$2" = "app" ] || [ "$2" = "sys" ] || [ "$2" = "sys_spec" ] ; then
  export property_type=$2
else
  echo "PropertyReader Error: Invalid Property Type"
  exit 1
fi

if [ "$3" = "" ] ; then
  echo "PropertyReader Error: Property Key is Required"
  exit 1
else
  export property_key=$3
fi

export working_directory=`pwd`
export application_property_file=$working_directory/properties/application.properties
export system_property_file=$working_directory/properties/system.properties
export env_system_property_file=$working_directory/properties/system-$env.properties

if [ "$property_type" = "app" ] ; then
  export property_file=$application_property_file
else
  if [ "$property_type" = "sys" ] ; then
    export property_file=$system_property_file
  else
    export property_file=$env_system_property_file
  fi
fi

export key_pattern=$property_key"="
export property_value=`cat $property_file | grep "$key_pattern" | cut -d'=' -f2 | rev | cut -c 2- | rev`

echo "$property_value"