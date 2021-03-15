SET UNDERLINE OFF
SET COLSEP ,
SET TRIMSPOOL ON
SET LINESIZE 32767
SET PAGESIZE 0 EMBEDDED ON
SET FEEDBACK OFF
SET HEADING ON
SET NEWPAGE 0
SET TERMOUT OFF
col catentry_id_parent format 99999999999999999999999
col catentry_id format 99999999999999999999999

select catentrel.catentry_id_parent, catentry.catentry_id
    from catentry
        left join catgpenrel on catentry.catentry_id = catgpenrel.catentry_id
        left join catentrel on catentry.catentry_id = catentrel.catentry_id_child
    where catentry.markfordelete = 0
    AND catenttype_id = 'ItemBean'
    AND catentrel.catreltype_id = 'PRODUCT_ITEM'
    AND catgpenrel.catgroup_id
        IN
        (
            select cattree.catgroup_id_child as catgroup_id from 
            ( 
                select catgroup_id_child, catgroup_id_parent, LEVEL AS parentlevel from catgrprel start with 
                catgroup_id_parent IN (select catgroup_id from catgroup where identifier IN ('ETC')) connect by prior 
                catgroup_id_child = catgroup_id_parent 
            ) cattree 
                left join catgroup catgroupchild on (cattree.catgroup_id_child = catgroupchild.catgroup_id and catgroupchild.markfordelete = 0)
            UNION 
                select catgroup.catgroup_id from catgroup 
                    where catgroup_id IN (select catgroup_id from catgroup where identifier IN ('ETC'))
        )
    order by catentry.catentry_id;