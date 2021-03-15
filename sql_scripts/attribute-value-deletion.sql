SET DEFINE OFF;
SET AUTOCOMMIT OFF;
SET SQLBLANKLINES ON;
SET ECHO ON;
delete from attrval where identifier in ('${value_identifier}');
commit;