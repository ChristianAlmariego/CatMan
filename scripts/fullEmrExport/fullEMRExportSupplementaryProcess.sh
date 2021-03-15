#!/usr/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "FullEMRExportSupplementaryProcess Error: Invalid Environment"
  exit 1
fi

if [ "$2" = "COMRES" ] || [ "$2" = "AUTOSOL" ] ; then
  export platform=$2
else
  echo "FullEMRExportSupplementaryProcess Error: Invalid Platform"
  exit 1
fi

export languageId=$3
export processType=$4

echo "START - FullEMRExport Supplementary Process"
echo "Initializing Variables"
echo "Environment: " $env
echo "Platform: " $platform
echo "languageId: " $languageId

## setup extended properties
export working_directory=`pwd`
working_directory="$working_directory/"
export property_reader=$working_directory"scripts/util/propertyReader.sh"

## Initialize variables
export locales_map=$($property_reader $env app catman.validLocales)
export catman_dir=$($property_reader $env sys_spec catman.rootDirectory)
export catman_baseshared_dir=$($property_reader $env sys_spec catman.baseSharedDirectory)

export fullemrexportwrkspc_folder=$($property_reader $env sys catman.workspaceFullEmrExport)
export catman_workspace_folder=$($property_reader $env sys catman.workspaceDefault)
export export_folder=$($property_reader $env sys catman.wrkspcExport)
export processing_folder=$($property_reader $env sys catman.wrkspcProcessing)

if [ "$platform" = "COMRES" ] ; then
  output_folder="M-Commercial-Residential-Solutions/"
else
  output_folder="M-Automation-Solutions/"
fi

IFS=',' read -r -a locales_array <<< "$locales_map"

if [ "$languageId" = "-1" ] ; then
  locale_name="en_US"
else
  for locale_entry in "${locales_array[@]}"
  do
    if [[ $locale_entry == *":$languageId" ]]; then
      locale_name=$(echo $locale_entry | cut -d':' -f 1)
    fi
  done
fi

## PREPROCESS
if [ "$processType" = "PREPROCESS" ] ; then
  echo "deleting current output files in CIF share..."
  rm -f $catman_baseshared_dir$catman_workspace_folder$export_folder$fullemrexportwrkspc_folder$output_folder$platform-$locale_name*
fi

## POSTPROCESS
if [ "$processType" = "POSTPROCESS" ] ; then
  echo "copying export files to CIF share..."
  cp $catman_dir$fullemrexportwrkspc_folder$export_folder$platform-$locale_name* $catman_baseshared_dir$catman_workspace_folder$export_folder$fullemrexportwrkspc_folder$output_folder
  echo "deleting temporary process files..."
  rm -f $catman_dir$fullemrexportwrkspc_folder*$platform$languageId*
  rm -f $catman_dir$fullemrexportwrkspc_folder$processing_folder$locale_name/$platform*
  rm -f $catman_dir$fullemrexportwrkspc_folder$export_folder$platform-$locale_name*
fi
