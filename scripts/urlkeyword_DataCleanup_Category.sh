#!/bin/bash

export dbUser=$1
export dbPassword=$2
export dbHost=$3
export dbPort=$4
export dbName=$5
export DBCONNECTION=$dbUser/$dbPassword@$dbHost:$dbPort/$dbName

echo "DBCONNECTION: $DBCONNECTION"

export URLKEYWORD_CATEGORY_SQL='/opt/websphere/catalogManager/sql_scripts/urlkeyword-category-datacleanup.sql'

# run sql file
echo "Start Running SQL"
sqlplus -s $DBCONNECTION <<EOF
 @${URLKEYWORD_CATEGORY_SQL}

EOF