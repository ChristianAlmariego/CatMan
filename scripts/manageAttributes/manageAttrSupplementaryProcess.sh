#!/bin/bash

export dbUser=$1
export dbPassword=$2
export dbHost=$3
export dbPort=$4
export dbName=$5
export DBCONNECTION=$dbUser/$dbPassword@$dbHost:$dbPort/$dbName

if [ "$6" = "dev" ] || [ "$6" = "stage" ] || [ "$6" = "prod" ] || [ "$6" = "local" ] ; then
  export env=$6
else
  echo "Manage Attributes Error: Invalid Environment"
  exit 1
fi

if [ "$7" = "" ] ; then
  echo "Manage Attributes Error: Build Tag is Required"
  exit 1
else
  export build_tag=$7
fi

export processtype=$8

export CURRDIR=`pwd`
export REQUESTLOC='/opt/websphere/catalogManager/Requests/AttributesAndAttrValues/Resource'
export COMPILEDLOC='/opt/websphere/catalogManager/Requests/AttributesAndAttrValues/Resource/compiled/'
export SEARCHSQLSCRIPTLOC='/opt/websphere/catalogManager/sql_scripts/update-attribute-searchable-runnable.sql'
export VALUSAGESQLSCRIPTLOC='/opt/websphere/catalogManager/sql_scripts/delete-attribute-value-usage-runnable.sql'
export DELETEATTRSQLSCRIPTLOC='/opt/websphere/catalogManager/sql_scripts/attribute-deletion-runnable.sql'
export DELETEATTRVALSQLSCRIPTLOC='/opt/websphere/catalogManager/sql_scripts/attribute-value-deletion-runnable.sql'
export ATTRUSAGE_UPDATE_ATTR='/opt/websphere/catalogManager/sql_scripts/attribute-usage-update-attr-runnable.sql'
export ATTRUSAGE_UPDATE_ATTRVAL='/opt/websphere/catalogManager/sql_scripts/attribute-usage-update-attrval-runnable.sql'
export ATTRUSAGE_DELETE_ATTRVAL='/opt/websphere/catalogManager/sql_scripts/attribute-usage-delete-old-attrval-runnable.sql'
export reference_compiler='/opt/websphere/catalogManager/cm_modules/referenceCompiler.js'

if [ $6 = "local" ] ; then
 export CURRDIR=F:\\catalogmanager
 export REQUESTLOC=F:\\catalogmanager\\Requests\\AttributesAndAttrValues\\Resource
 export COMPILEDLOC=F:\\catalogmanager\\Requests\\AttributesAndAttrValues\\Resource\\compiled\\
 export SEARCHSQLSCRIPTLOC=F:\\catalogmanager\\sql_scripts\\update-attribute-searchable-runnable.sql
 export VALUSAGESQLSCRIPTLOC=F:\\catalogmanager\\sql_scripts\\delete-attribute-value-usage-runnable.sql
 export DELETEATTRSQLSCRIPTLOC=F:\\catalogmanager\\sql_scripts\\attribute-deletion-runnable.sql
 export DELETEATTRVALSQLSCRIPTLOC=F:\\catalogmanager\\sql_scripts\\attribute-value-deletion-runnable.sql
 export ATTRUSAGE_UPDATE_ATTR=F:\\catalogmanager\\sql_scripts\\attribute-usage-update-attr-runnable.sql
 export ATTRUSAGE_UPDATE_ATTRVAL=F:\\catalogmanager\\sql_scripts\\attribute-usage-update-attrval-runnable.sql
 export ATTRUSAGE_DELETE_ATTRVAL=F:\\catalogmanager\\sql_scripts\\attribute-usage-delete-old-attrval-runnable.sql
 export DBCONNECTION='wcuser/w6XJ4cV3TeaSw4xM@usazrecdwcdb02.emrsn.org:34002/emrwcd1'
 export reference_compiler=F:\\catalogmanager\\cm_modules\\referenceCompiler.js
fi

echo "Current Directory:  "$CURRDIR
echo "Request Location: "$REQUESTLOC
echo "Database Connection:  "$DBCONNECTION

# TBD - PROMOTION NEEDS ADJUSTMENTS TO CONSIDER MULTIPLE DEV MANAGE ATTRIBUTE RUNS

if [ $processtype = "PREPROCESS" ] ; then
  # updating attr table for attrusage update
  if [ ! -f $REQUESTLOC'/cm-requests-attrusage-'$build_tag'.txt' ]; then 
    echo "No files to process.."
  else   
    echo "Updating Attribute Usage.."
    while IFS='|' read -r attribute attr_usage
    do
      if [ $(echo "$attr_usage" | wc -l) -gt 1 ]; then
        attr_usage=$(echo $attr_usage | rev | cut -c 2- | rev)
      else
        attr_usage=$attr_usage
      fi

      echo "name of attribute: $attribute"
      sed "s/\${attr_usage}/$attr_usage/g; s/\${attribute}/$attribute/g" "$CURRDIR/sql_scripts/attribute-usage-update-attr.sql" > "$CURRDIR/sql_scripts/attribute-usage-update-attr-runnable.sql"
      echo "Start Running SQL"
      sqlplus -s $DBCONNECTION <<EOF
      @${ATTRUSAGE_UPDATE_ATTR}
      exit  
EOF
      echo "End Running SQL"
    done < $REQUESTLOC/cm-requests-attrusage-$build_tag.txt
  fi
fi

if [ $processtype = "POSTPROCESS" ] ; then
  # updating searchable
  if [ ! -f $REQUESTLOC'/cm-requests-searchable-'$build_tag'.txt' ]; then 
    echo "No files to process.."
  else   
    echo "Updating Searchable Attributes.."
    while IFS= read -r attribute
    do
      if [ $(echo "$attribute" | wc -l) -gt 1 ]; then
        attribute=$(echo $attribute | rev | cut -c 2- | rev)
      else
        attribute=$attribute
      fi

      echo "name of attribute: $attribute"
      sed "s/\${attribute}/$attribute/g" "$CURRDIR/sql_scripts/update-attribute-searchable.sql" > "$CURRDIR/sql_scripts/update-attribute-searchable-runnable.sql"
      
      echo "Start Running SQL"
      sqlplus -s $DBCONNECTION <<EOF
      @${SEARCHSQLSCRIPTLOC}
      exit  
EOF
      echo "End Running SQL"
    done < $REQUESTLOC/cm-requests-searchable-$build_tag.txt
  fi

  # updating value usage
  if [ ! -f $REQUESTLOC/cm-requests-valusage-$build_tag.txt ]; then
    echo "No files to process.."
  else
    echo "Updating Value Usage.."
    while IFS='|' read -r attribute value_usage
    do
      if [ $(echo "$value_usage" | wc -l) -gt 1 ]; then
        value_usage=$(echo $value_usage | rev | cut -c 2- | rev)
      else
        value_usage=$value_usage
      fi

      echo "name of attribute: $attribute"
      echo "name of value usage: $value_usage"
      sed "s/\${attribute}/$attribute/g; s/\${value_usage}/$value_usage/g" "$CURRDIR/sql_scripts/delete-attribute-value-usage.sql" > "$CURRDIR/sql_scripts/delete-attribute-value-usage-runnable.sql"

      sqlplus -s $DBCONNECTION <<EOF
      @${VALUSAGESQLSCRIPTLOC}
      exit
EOF
      echo $attribute : $value_usage
      echo "End Running SQL"
    done < $REQUESTLOC/cm-requests-valusage-$build_tag.txt
  fi

  # attribute deletion
  if [ ! -f $REQUESTLOC'/cm-requests-attributedeletion-'$build_tag'.txt' ]; then 
    echo "No files to process.."
  else   
    echo "Deleting Attributes.."
    while IFS= read -r attribute
    do
      if [ $(echo "$attribute" | wc -l) -gt 1 ]; then
        attribute=$(echo $attribute | rev | cut -c 2- | rev)
      else
        attribute=$attribute
      fi

      echo "name of attribute: $attribute"
      sed "s/\${attribute}/$attribute/g" "$CURRDIR/sql_scripts/attribute-deletion.sql" > "$CURRDIR/sql_scripts/attribute-deletion-runnable.sql"
      
      echo "Start Running SQL"
      sqlplus -s $DBCONNECTION <<EOF
      @${DELETEATTRSQLSCRIPTLOC}
      exit  
EOF
      echo "End Running SQL"
    done < $REQUESTLOC/cm-requests-attributedeletion-$build_tag.txt
  fi

  # attribute values deletion
  if [ ! -f $REQUESTLOC'/cm-requests-attributevaluesdeletion-'$build_tag'.txt' ]; then 
    echo "No files to process.."
  else   
    echo "Deleting Attribute Value.."
    while IFS= read -r value_identifier
    do
      if [ $(echo "$value_identifier" | wc -l) -gt 1 ]; then
        value_identifier=$(echo $value_identifier | rev | cut -c 2- | rev)
      else
        value_identifier=$value_identifier
      fi

      echo "Value Identfier: $value_identifier"
      sed "s/\${value_identifier}/$value_identifier/g" "$CURRDIR/sql_scripts/attribute-value-deletion.sql" > "$CURRDIR/sql_scripts/attribute-value-deletion-runnable.sql"
      
      echo "Start Running SQL"
      sqlplus -s $DBCONNECTION <<EOF
      @${DELETEATTRVALSQLSCRIPTLOC}
      exit
EOF
      echo "End Running SQL"
    done < $REQUESTLOC/cm-requests-attributevaluesdeletion-$build_tag.txt
  fi

  # updating attrval table for attrusage update
  if [ ! -f $REQUESTLOC'/cm-requests-attrvalusage-update-'$build_tag'.txt' ]; then 
    echo "No files to process.."
  else   
    echo "Updating Old Value Identifier.."
    while IFS='|' read -r attribute value_identifier value
    do
      if [ $(echo "$value" | wc -l) -gt 1 ]; then
        value=$(echo $value | rev | cut -c 2- | rev)
      else
        value=$value
      fi

      echo "Name of attribute: $attribute"
      echo "Value Identifier:  $value_identifier"
      echo "Value: $value"
      sed "s/\${value}/$value/g; s/\${attribute}/$attribute/g; s/\${value_identifier}/$value_identifier/g" "$CURRDIR/sql_scripts/attribute-usage-update-attrval.sql" > "$CURRDIR/sql_scripts/attribute-usage-update-attrval-runnable.sql"
          
      echo "Start Running SQL"
      sqlplus -s $DBCONNECTION <<EOF
      @${ATTRUSAGE_UPDATE_ATTRVAL}
      exit 
EOF
      echo "End Running SQL"
    done < $REQUESTLOC/cm-requests-attrvalusage-update-$build_tag.txt
  fi

  # updating attrval table for attrusage delete
  if [ ! -f $REQUESTLOC'/cm-requests-attrvalusage-delete-'$build_tag'.txt' ]; then 
    echo "No files to process.."
  else   
    echo "Deleting Old Value Identifier.."
    while IFS='|' read -r attribute value_identifier
    do
      if [ $(echo "$value_identifier" | wc -l) -gt 1 ]; then
        value_identifier=$(echo $value_identifier | rev | cut -c 2- | rev)
      else
        value_identifier=$value_identifier
      fi

      echo "Name of attribute: $attribute"
      echo "Value Identifier:  $value_identifier"
      sed "s/\${attribute}/$attribute/g; s/\${value_identifier}/$value_identifier/g" "$CURRDIR/sql_scripts/attribute-usage-delete-old-attrval.sql" > "$CURRDIR/sql_scripts/attribute-usage-delete-old-attrval-runnable.sql"
          
      echo "Start Running SQL"
      sqlplus -s $DBCONNECTION <<EOF
      @${ATTRUSAGE_DELETE_ATTRVAL}
      exit
EOF
      echo "End Running SQL"
    done < $REQUESTLOC/cm-requests-attrvalusage-delete-$build_tag.txt
  fi

  # compile supplementary reference files for promotion 
  echo "Compiling Supplementary Reference Files"
  ls $REQUESTLOC/*$build_tag'.txt' | xargs -d '\n' -n 1 basename | while IFS=\| read -r filename
  do
    echo "compiling: $filename"
    node --max_old_space_size=4096 $reference_compiler "$REQUESTLOC/$filename" "$COMPILEDLOC"
  done
fi


