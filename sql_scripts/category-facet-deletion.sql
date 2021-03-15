SET DEFINE OFF;
SET AUTOCOMMIT OFF;
SET SQLBLANKLINES ON;
SET ECHO ON;

delete from facet where facet_id 
IN (select facet.facet_id from facet
left join FACETCATGRP on FACET.FACET_ID = FACETCATGRP.FACET_ID
left join CATGROUP on FACETCATGRP.CATGROUP_ID = CATGROUP.CATGROUP_ID
left join ATTR on FACET.ATTR_ID = ATTR.ATTR_ID
where CATGROUP.IDENTIFIER = '${category_identifier}'
and ATTR.IDENTIFIER IN (${facet_values}));
commit;