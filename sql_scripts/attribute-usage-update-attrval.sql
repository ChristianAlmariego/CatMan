SET DEFINE OFF;
SET AUTOCOMMIT OFF;
SET SQLBLANKLINES ON;
SET ECHO ON;

Update (Select CATENTRYATTR.ATTRVAL_ID 
  from CATENTRYATTR 
  inner join ATTRVALDESC on CATENTRYATTR.ATTRVAL_ID = ATTRVALDESC.ATTRVAL_ID 
  inner join ATTR on ATTR.ATTR_ID = CATENTRYATTR.ATTR_ID 
  inner join attrval on attrval.ATTRVAL_ID = CATENTRYATTR.ATTRVAL_ID
  where ATTRVALDESC.VALUE = '${value}' 
  and ATTR.IDENTIFIER = '${attribute}' 
  and LANGUAGE_ID = -1 
  and ATTRVAL.IDENTIFIER != '${value_identifier}') t
SET t.ATTRVAL_ID = (Select distinct(ATTRVAL.ATTRVAL_ID) from attrval inner join attrvaldesc on attrval.attr_ID = attrvaldesc.ATTR_ID 
where attrvaldesc.Value = '${value}' and ATTRVAL.IDENTIFIER = '${value_identifier}');
commit;