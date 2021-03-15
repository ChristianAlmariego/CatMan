export dbName=$1
export dbUser=$2
export dbPassword=$3

# run sql file
sqlplus -s $dbUser/$dbPassword@$dbName <<EOF
SET UNDERLINE OFF
SET COLSEP ,
SET TRIMSPOOL ON
SET LINESIZE 32767
SET PAGESIZE 0 EMBEDDED ON
SET FEEDBACK OFF
SET HEADING ON
SET NEWPAGE 0
SET TERMOUT OFF

spool /websphere/spdata/Dev/CatMan/Export/Duplicate_SKU_AttributeValues.csv

@sql_scripts/duplicate-sku-attribute-values.sql

spool off