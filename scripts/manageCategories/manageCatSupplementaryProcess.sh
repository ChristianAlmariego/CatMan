#!/usr/bin/bash

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
export REQUESTLOC='/opt/websphere/catalogManager/Requests/Categories/Resource'
export CATEGORYURLKEYWORDDELETION='/opt/websphere/catalogManager/sql_scripts/category-urlkeyword-deletion-runnable.sql'
export CATEGORYFACETDELETION='/opt/websphere/catalogManager/sql_scripts/category-facet-deletion-runnable.sql'
export CATEGORYDELETION='/opt/websphere/catalogManager/sql_scripts/category-deletion-runnable.sql'


if [ $6 = "local" ] ; then
 export CURRDIR=F:\\newCatManager
 export REQUESTLOC=F:\\newCatManager\\Requests\\Categories\\Resource
 export CATEGORYURLKEYWORDDELETION=F:\\newCatManager\\sql_scripts\\category-urlkeyword-deletion-runnable.sql
 export CATEGORYFACETDELETION=F:\\newCatManager\\sql_scripts\\category-facet-deletion-runnable.sql
 export CATEGORYDELETION=F:\\newCatManager\\sql_scripts\\category-deletion-runnable.sql
 export DBCONNECTION='WCSAD2/w6XJ4cV3TeaSw4xM@usazrecdwcdb08.emrsn.org:32501/emrwcd4'
fi

echo "Current Directory:  "$CURRDIR
echo "Request Location: "$REQUESTLOC
echo "Database Connection:  "$DBCONNECTION

if [ $processtype = "PREPROCESS" ] ; then
  # Deletion of Category
  if [ ! -f $REQUESTLOC'/cm-requests-category-delete-'$build_tag'.txt' ]; then 
    echo "No files to process.."
  else   
    echo "Deleting of Category.."
    while IFS= read -r identifier
    do
      identifier=$(echo $identifier | sed -e 's/\r//g')
      echo ${identifier}

      echo "Category : $identifier"
      sed "s/\${identifier}/$identifier/g" "$CURRDIR/sql_scripts/category-deletion.sql" > "$CURRDIR/sql_scripts/category-deletion-runnable.sql"
      
      echo "Start Running SQL"
      sqlplus -s $DBCONNECTION <<EOF
      @${CATEGORYDELETION}
      exit  
EOF
      echo "End Running SQL"
    done < $REQUESTLOC/cm-requests-category-delete-$build_tag.txt
  fi
fi

if [ $processtype = "POSTPROCESS" ] ; then
  # Deletion of Category UrlKeyword
  if [ ! -f $REQUESTLOC'/cm-requests-urlkeyword-delete-'$build_tag'.txt' ]; then 
    echo "No files to process.."
  else   
    echo "Deleting of Category UrlKeyword.."
    while IFS= read -r urlkeyword
    do
      urlkeyword=$(echo $urlkeyword | sed -e 's/\r//g')
      echo ${urlkeyword}

      echo "Category UrlKeyword: $urlkeyword"
      sed "s/\${urlkeyword}/$urlkeyword/g" "$CURRDIR/sql_scripts/category-urlkeyword-deletion.sql" > "$CURRDIR/sql_scripts/category-urlkeyword-deletion-runnable.sql"
      
      echo "Start Running SQL"
      sqlplus -s $DBCONNECTION <<EOF
      @${CATEGORYURLKEYWORDDELETION}
      exit  
EOF
      echo "End Running SQL"
    done < $REQUESTLOC/cm-requests-urlkeyword-delete-$build_tag.txt
  fi

  # Deletion of Category Facets
  if [ ! -f $REQUESTLOC'/cm-requests-facet-delete-'$build_tag'.txt' ]; then 
    echo "No files to process.."
  else   
    echo "Deleting Category Facets.."
    while IFS='|' read -r category_identifier facet_values
    do
      urlkeyword=$(echo $facet_values | sed -e 's/\r//g')
      echo ${facet_values}

      echo "Category Identifier: $category_identifier"
      echo "Facet Management:  $facet_values"
      sed "s/\${category_identifier}/$category_identifier/g; s/\${facet_values}/$facet_values/g" "$CURRDIR/sql_scripts/category-facet-deletion.sql" > "$CURRDIR/sql_scripts/category-facet-deletion-runnable.sql"
          
      echo "Start Running SQL"
      sqlplus -s $DBCONNECTION <<EOF
      @${CATEGORYFACETDELETION}
      exit
EOF
      echo "End Running SQL"
    done < $REQUESTLOC/cm-requests-facet-delete-$build_tag.txt
  fi
fi