#!/bin/bash

if [ "$1" = "dev" ] || [ "$1" = "stage" ] || [ "$1" = "prod" ] || [ "$1" = "local" ] ; then
  export env=$1
else
  echo "SVN Commit Error: Invalid Environment"
  exit 1
fi

if [ "$2" = "" ] ; then
  echo "SVN Commit Error: Build Tag is Required"
  exit 1
else
  export build_tag=$2
fi

if [ "$5" = "" ] ; then
  echo "SVN Commit Warning: Process Code is Missing"
else
  export process_code=$5
fi

export svn_username=$3
export svn_password=$4
export store="emr"

echo "START - SVN COMMIT"
echo "Initializing Variables"
echo "Environment: "$env
echo "Build Tag: "$build_tag
echo "Process Code: "$process_code

## setup extended properties
export working_directory=`pwd`
working_directory="$working_directory/"
export property_reader=$working_directory"scripts/util/propertyReader.sh"

## Initialize variables
export catman_dir=$($property_reader $env sys_spec catman.rootDirectory)
export lookupcsv_folder=$($property_reader $env sys catman.lookupDirectory)
export requests_folder=$($property_reader $env sys catman.requestsDirectory)
export resources_folder=$($property_reader $env sys catman.wrkspcResource)
export svn_folder=$($property_reader $env sys catman.svnFolder)
export manageattr_folder=$($property_reader $env sys catman.workspaceAttributesAndAttrValues)
export managecategory_folder=$($property_reader $env sys catman.workspaceCategories)

export svnurl_lookupcsv=$($property_reader $env sys svnurl.lookupcsv)

export manageattr_processcode=$($property_reader $env app catman.manageAttributes)
export managecategory_processcode=$($property_reader $env app catman.manageCategory)


## Start Processing
if [ $process_code = $manageattr_processcode ] ; then
  echo "Start Processing - "$process_code
  commit_comment="Commit Thru QB - Manage Attributes and Attribute Values build no. "$build_tag

  # checkout lookup_csv folder from svn
  echo "Checking out lookup csv folder..."
  svn checkout "$svnurl_lookupcsv" "$catman_dir$requests_folder$manageattr_folder$resources_folder$svn_folder$lookupcsv_folder" --username $svn_username --password $svn_password --non-interactive --trust-server-cert
  
  attrdictfile=$catman_dir$requests_folder$manageattr_folder$resources_folder$svn_folder$lookupcsv_folder"attrdictattr-dataload.csv"
  attrvaldictfile=$catman_dir$requests_folder$manageattr_folder$resources_folder$svn_folder$lookupcsv_folder"attrdictattrval-dataload.csv"
  ctalookupfile=$catman_dir$requests_folder$manageattr_folder$resources_folder$svn_folder$lookupcsv_folder"control-cta-lookup.csv"
  ubeltlookupfile=$catman_dir$requests_folder$manageattr_folder$resources_folder$svn_folder$lookupcsv_folder"control-utility-belt-lookup.csv"

  # overwrite with updated lookup csvs
  echo "Updating lookup csv files..."
  # delete
  rm -f $attrdictfile
  rm -f $attrvaldictfile
  rm -f $ctalookupfile
  rm -f $ubeltlookupfile
  # copy
  cp $catman_dir$lookupcsv_folder"attrdictattr-dataload.csv" $catman_dir$requests_folder$manageattr_folder$resources_folder$svn_folder$lookupcsv_folder
  cp $catman_dir$lookupcsv_folder"attrdictattrval-dataload.csv" $catman_dir$requests_folder$manageattr_folder$resources_folder$svn_folder$lookupcsv_folder
  cp $catman_dir$lookupcsv_folder"control-cta-lookup.csv" $catman_dir$requests_folder$manageattr_folder$resources_folder$svn_folder$lookupcsv_folder
  cp $catman_dir$lookupcsv_folder"control-utility-belt-lookup.csv" $catman_dir$requests_folder$manageattr_folder$resources_folder$svn_folder$lookupcsv_folder

  # commit
  echo "Commit update lookup csv files..."
  svn commit $attrdictfile $attrvaldictfile $ctalookupfile $ubeltlookupfile -m "$commit_comment" --username $svn_username --password $svn_password --non-interactive --trust-server-cert

  echo "SVN Commit done!"
fi

# Category Lookup Check-in
if [ $process_code = $managecategory_processcode ] ; then
  echo "Start Processing - "$process_code
  commit_comment="Commit Thru QB - Manage Category build no. "$build_tag

  # checkout lookup_csv folder from svn
  echo "Checking out lookup csv folder..."
  svn checkout "$svnurl_lookupcsv" "$catman_dir$requests_folder$managecategory_folder$resources_folder$svn_folder$lookupcsv_folder" --username $svn_username --password $svn_password --non-interactive --trust-server-cert
  
  mastersalesacategoryfile=$catman_dir$requests_folder$managecategory_folder$resources_folder$svn_folder$lookupcsv_folder"mastersalescategory_lookup.csv"

  # overwrite with updated lookup csvs
  echo "Updating lookup csv file..."
  # delete
  rm -f $mastersalesacategoryfile

  # copy
  cp $catman_dir$lookupcsv_folder"mastersalescategory_lookup.csv" $catman_dir$requests_folder$managecategory_folder$resources_folder$svn_folder$lookupcsv_folder

  # commit
  echo "Commit update lookup csv files..."
  svn commit $mastersalesacategoryfile -m "$commit_comment" --username $svn_username --password $svn_password --non-interactive --trust-server-cert

  echo "SVN Commit done!"
fi
