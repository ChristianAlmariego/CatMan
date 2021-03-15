SET DEFINE OFF;
SET AUTOCOMMIT OFF;
SET SQLBLANKLINES ON;
SET ECHO ON;
delete from attrval where attr_id in (select attr_id from attr where identifier in('${attribute}')) and identifier like '%${value_usage}%';
commit;