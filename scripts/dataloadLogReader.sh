#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "DataloadLogReader Error: Invalid Environment"
  exit 1
fi

if [ "$4" = "" ] ; then
  echo "DataloadLogReader Error: Dataload Log File Full Path is Required"
  exit 1
else
  export dataload_log_file_fullpath=$4
fi

# internal variables
process_name=$2
build_reference=$3
read_dataload_log_key="dataloadLog"
error_log_keyword="Error log location:"
keyword_count=0

export working_directory=`pwd`

#export cm_modules_dir=$($working_directory/scripts/util/propertyReader.sh $env sys catman.cmModulesDirectory)
#export logs_reader_file_name=$($working_directory/scripts/util/propertyReader.sh $env sys catman.logsReader)
export logs_reader=$working_directory/cm_modules/logsReader.js

keyword_count=$(cat $dataload_log_file_fullpath | grep -c "$error_log_keyword")

IFS='/'
error_log_fullpath_split_array=($dataload_log_file_fullpath)
unset IFS
error_log_fullpath_split_array_length=$(echo ${#error_log_fullpath_split_array[@]})

dataload_log_filename=$(echo $dataload_log_file_fullpath| cut -d'/' -f $error_log_fullpath_split_array_length)
error_log_file_count=$((keyword_count/2))

echo "Dataload Log File: "$dataload_log_filename
echo "Dataload Error Log File/s Count: "$error_log_file_count

if [ $keyword_count -gt 0 ] ; then
  node --max_old_space_size=4096 $logs_reader $env "$process_name" "$build_reference" $read_dataload_log_key "$dataload_log_file_fullpath"
fi
