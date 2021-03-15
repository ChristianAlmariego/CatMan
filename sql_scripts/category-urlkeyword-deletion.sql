SET DEFINE OFF;
SET AUTOCOMMIT OFF;
SET SQLBLANKLINES ON;
SET ECHO ON;
DELETE FROM seourlkeyword WHERE urlkeyword IN ('${urlkeyword}');
commit;