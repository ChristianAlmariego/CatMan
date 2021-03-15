SELECT catentry.partnumber,
  attrval.identifier,
  attrvaldesc.language_id,
  attr.identifier      AS ATTR_IDENTIFIER,
  attrvaldesc.value    AS ATTR_ATTRVALUE,
  attrvaldesc.sequence AS value_sequence
FROM catentryattr
INNER JOIN catentrel
ON catentrel.catentry_id_child = catentryattr.catentry_id
LEFT JOIN catentry
ON catentryattr.catentry_id = catentry.catentry_id
LEFT JOIN catentdesc
ON catentry.catentry_id = catentdesc.catentry_id
LEFT JOIN attr
ON catentryattr.attr_id = attr.attr_id
LEFT JOIN attrdesc
ON attr.attr_id = attrdesc.attr_id
LEFT JOIN attrval
ON catentryattr.attrval_id = attrval.attrval_id
LEFT JOIN
  ( SELECT * FROM attrvaldesc WHERE attrvaldesc.language_id = - 1
  ) attrvaldesc
ON attrvaldesc.attrval_id    = attrval.attrval_id
WHERE catentry.markfordelete = 0
AND catentdesc.language_id   = - 1
AND attrdesc.language_id     = - 1
AND catentryattr.catentry_id = catentrel.catentry_id_child
AND attr.identifier
  || '-'
  || attrvaldesc.value IN
  (SELECT ATTR_IDENTIFIER_VAL
  FROM
    ( SELECT DISTINCT attr_identifier
      || '-'
      || attr_attrvalue AS ATTR_IDENTIFIER_VAL
    FROM
      (SELECT attr.identifier AS ATTR_IDENTIFIER,
        attrdesc.name         AS attr_name,
        attrvaldesc.value     AS ATTR_ATTRVALUE,
        CASE
          WHEN attr.identifier LIKE '%Descriptive%'
          THEN 'Descriptive'
          ELSE 'Defining'
        END AS usage
      FROM catentryattr
      LEFT JOIN catentry
      ON catentryattr.catentry_id = catentry.catentry_id
      LEFT JOIN catentdesc
      ON catentry.catentry_id = catentdesc.catentry_id
      LEFT JOIN attr
      ON catentryattr.attr_id = attr.attr_id
      LEFT JOIN attrdesc
      ON attr.attr_id = attrdesc.attr_id
      LEFT JOIN attrval
      ON catentryattr.attrval_id = attrval.attrval_id
      LEFT JOIN
        ( SELECT * FROM attrvaldesc WHERE attrvaldesc.language_id = - 1
        ) attrvaldesc
      ON attrvaldesc.attrval_id    = attrval.attrval_id
      WHERE catentry.markfordelete = 0
      AND catentdesc.language_id   = - 1
      AND attrdesc.language_id     = - 1
      AND catentryattr.catentry_id = catentrel.catentry_id_parent
      ) tbl_attr_parent
    UNION ALL
    SELECT DISTINCT attr_identifier
      || '-'
      || attr_attrvalue AS ATTR_IDENTIFIER_VAL
    FROM
      (SELECT attr.identifier AS ATTR_IDENTIFIER,
        attrdesc.name         AS attr_name,
        attrvaldesc.value     AS ATTR_ATTRVALUE,
        CASE
          WHEN attr.identifier LIKE '%Descriptive%'
          THEN 'Descriptive'
          ELSE 'Defining'
        END AS usage
      FROM catentryattr
      LEFT JOIN catentry
      ON catentryattr.catentry_id = catentry.catentry_id
      LEFT JOIN catentdesc
      ON catentry.catentry_id = catentdesc.catentry_id
      LEFT JOIN attr
      ON catentryattr.attr_id = attr.attr_id
      LEFT JOIN attrdesc
      ON attr.attr_id = attrdesc.attr_id
      LEFT JOIN attrval
      ON catentryattr.attrval_id = attrval.attrval_id
      LEFT JOIN
        ( SELECT * FROM attrvaldesc WHERE attrvaldesc.language_id = - 1
        ) attrvaldesc
      ON attrvaldesc.attrval_id    = attrval.attrval_id
      WHERE catentry.markfordelete = 0
      AND catentdesc.language_id   = - 1
      AND attrdesc.language_id     = - 1
      AND catentryattr.catentry_id = catentrel.catentry_id_child
      ) tbl_attr_child
    ) TBL_UNION
  GROUP BY ATTR_IDENTIFIER_VAL
  HAVING COUNT(*) > 1
  );