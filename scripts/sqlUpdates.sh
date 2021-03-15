#!/usr/bin/bash

export sqlUpdateRequest=$1
export dbName=$2
export dbUser=$3
export dbPassword=$4

# create sql file
~/node.sh --max_old_space_size=4096 cm_modules/sqlUpdates.js $sqlUpdateRequest

# run sql file
sqlplus $dbUser/$dbPassword@$dbName <<EOF
SET DEFINE OFF;
SET AUTOCOMMIT OFF;
SET SQLBLANKLINES ON;
SET ECHO ON;
@sql_scripts/sales-category-deletion.sql


commit;
EXIT;
EOF
 
