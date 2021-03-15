
module.exports = Object.freeze({

    // generic constants
    EMPTY_STRING: '',
    CHAR_SPACE: ' ',
    CHAR_DOT: '.',
    CHAR_HYPHEN: '-',
    CHAR_PIPE: '|',
    CHAR_CR: '\n',
    CHAR_TAB: '\t',
    CHAR_SQUOTE: "'",
    CHAR_QUOTE: '"',
    CHAR_SLASH: '/',
    CHAR_BACKSLASH: '\\',
    CHAR_COLON: ':',
    CHAR_ASTERISK: '*',
    CHAR_QUESTIONMARK: '?',
    CHAR_ISGREATER: '>',
    CHAR_ISLESSER: '<',

    BOOLEAN_STRING_TRUE: 'TRUE',
    BOOLEAN_STRING_FALSE: 'FALSE',
    BOOLEAN_DB_TRUE: '1',
    BOOLEAN_DB_FALSE: '0',

    STATUS_SUCCESS: 'SUCCESS',
    STATUS_FAILED: 'FAILED',

    DEFAULT_ID_SEPARATOR: '_',
    DEFAULT_DELIMITER: ',',
    DEFAULT_LOCALE_NAME: 'en_US',
    DEFAULT_LANGUAGE_ID: '-1',
    DEFAULT_CURRENCY: 'USD',
    DEFAULT_STOREID: 'EmersonCAS',

    CATENTRYTYPE_PRODUCT: 'Product',
    CATENTRYTYPE_SKU: 'SKU',
    CATENTRYTYPE_BUNDLE: 'Bundle',
    CATENTRYTYPE_STATICKIT: 'Static Kit',
    CATENTRYTYPE_DYNAMICKIT: 'Dynamic Kit',

    CATENTRYTYPE_INFIX_PRODUCT: '-P-',
    CATENTRYTYPE_INFIX_SKU: '-',
    CATENTRYTYPE_INFIX_BUNDLE: '-B-',
    CATENTRYTYPE_INFIX_STATICKIT: '-K-',
    CATENTRYTYPE_INFIX_DYNAMICKIT: '-D-',
    CATENTRYTYPE_INFIX_UKNOWN: '-???-',

    // dataload modes
    //TBD: for code refactoring - use processCode or runRequest directly
    DATALOAD_MODE_UPDATE: 'DLUPDATE',
    DATALOAD_MODE_DELETE: 'DLDELETE',
    DATALOAD_MODE_REPLACE: 'DLREPLACE',

    // keywords
    VALUE_ID: 'ValueID',
    USAGE_DESCRIPTIVE: 'Descriptive',
    USAGE_DEFINING: 'Defining',
    EMR_ATTR_STORE_ID: 'EmersonCAS',
    STORE_EMR: 'EMR',
    STORE_WSV: 'WSV',
    UTF: 'utf8',
    COMPILED: 'COMPILED',

    LOCALES_MAPREF_LOCALENAME: 'LocaleName',
    LOCALES_MAPREF_LANGUAGEID: 'LanguageId',
    SYSTEM_PLATFORM_CATMAN: 'CATMAN',
    SYSTEM_PLATFORM_COMMERCE: 'COMMERCE',
    
    // node module management
    NODE_KEY_LINE: 'line',
    NODE_KEY_DATA: 'data',
    NODE_KEY_CLOSE: 'close',
    NODE_KEY_END: 'end',
    NODE_KEY_ERROR: 'error',
    NODE_KEY_READABLE: 'readable',
    NODE_KEY_FINISH: 'finish',

    //TBD: for code refactoring - move to property files
    // file extensions
    FILE_EXT_CSV: '.csv',
    FILE_EXT_TXT: '.txt',
    //TBD: end

    // file names
    DELTA_PREPROCESS_CONTROL: 'delta-preprocess-control.txt',
    	
    // flag keys
    CM_DELTA_PREPROCESS: 'SOLRpreprocessAndBuildRequest',
    //...
    //all other constants

    BASEFIELD_VALUES_NONE: 'NONE',
    BASEFIELD_VALUES_TIMEEVENTBASED: 'TIME-EVENT-BASED',

    LOOKUPREF_LOOKUPTYPE_TABLE: 'LOOKUP_TABLE',
    LOOKUPREF_LOOKUPTYPE_ENUM: 'STRING_ENUMERATION',
    LOOKUPREF_VALSCOPE_CORE: 'Core',
    LOOKUPREF_VALSCOPE_EXTENDED: 'Extended',

    //TBD: for review - deprecated locale supported attributes for authoring,
    //TMP: comments - constants for now, if need to be configurable in future - move to properties
    DEPRECATED_LOCALE_SUPPORTED_ATTRS: 'EMR Locale|EMR Country',

    //TBD: code refactoring - use the lookup instead
    // csv headers
    CSV_HEADER_CODE: 'Code',
    CSV_HEADER_MFTR_PART_NUM: 'Manufacturer part number',
    CSV_HEADER_MFTR: 'Manufacturer',
    CSV_HEADER_CATENTRY_TYPE: 'Catalog Entry Type',
    CSV_HEADER_LOCALE: 'Locale',
    CSV_HEADER_PARENT: 'Parent',
    CSV_HEADER_FULLPATH: 'Full Path',
    CSV_HEADER_SALESCTGRP: 'Sales Catalog(s) Path',
    CSV_HEADER_STORE: 'Store',
    CSV_HEADER_ONSPECIAL: 'On Special',
    CSV_HEADER_FORPURCHASE: 'For Purchase',
    CSV_HEADER_PRICE: 'Price',
    CSV_HEADER_URL: 'URL',
    CSV_HEADER_SUBSITEM: 'Subscription item',
    CSV_HEADER_RECURORDERITEM: 'Recurring order item',
    CSV_HEADER_USNAME: 'US Name',
    CSV_HEADER_NAME: 'Name',
    CSV_HEADER_LONGDESC: 'Long Description',
    CSV_HEADER_DISPLAYTOCUSTOMERUS: 'Display to customers US',
    CSV_HEADER_DISPLAYTOCUSTOMER: 'Display to customers',
    CSV_HEADER_KEYWORDUS: 'Keyword US',
    CSV_HEADER_KEYWORD: 'Keyword',
    CSV_HEADER_PAGETITLEUS: 'Page title US',
    CSV_HEADER_PAGETITLE: 'Page title',
    CSV_HEADER_METADESCUS: 'Meta description US',
    CSV_HEADER_METADESC: 'Meta description',
    CSV_HEADER_UNSPSC: 'UNSPSC',
    CSV_HEADER_HIDDENFAMILYCATEGORY: 'Hidden Category',
    CSV_HEADER_FEATURE: 'Feature',
    CSV_HEADER_CTA: 'CallToAction',
    CSV_HEADER_UBELT: 'Utility Belt',
    CSV_HEADER_ANNOUNCEMENTDATE: 'Announcement Date',
    CSV_HEADER_WITHDRAWALDATE: 'Withdrawal Date',
    CSV_HEADER_DATECREATED: 'Date Created',

    CSV_HEADER_ATTRIDENTIFIER: 'Attribute Identifier',
    CSV_HEADER_SEQUENCE: 'Sequence',
    CSV_HEADER_DISPLAYABLE: 'Displayable',
    CSV_HEADER_DISPLAYNAME: 'Display Name',
    CSV_HEADER_SEARCHABLE: 'Searchable',
    CSV_HEADER_COMPARABLE: 'Comparable',
    CSV_HEADER_FACETABLE: 'Facetable',
    CSV_HEADER_MERCHANDISABLE: 'Merchandisable',
    CSV_HEADER_PRIMARYDESC: 'Primary Description',
    CSV_HEADER_HEADERNAME: 'HeaderName',
    CSV_HEADER_MULTILANG: 'MultiLang',
    CSV_HEADER_MAXOCCURENCE: 'MaxOccurence',
    CSV_HEADER_MINOCCURENCE: 'MinOccurence',
    CSV_HEADER_MAXLENGHT: 'MaxLength',
    CSV_HEADER_DATATYPE: 'Datatype',
    CSV_HEADER_VALUEUSAGE: 'Value Usage',
    CSV_HEADER_VALUESCOPE: 'Value Scope',
    CSV_HEADER_LOOKUPTABLENAME: 'Lookup Table Name',
    CSV_HEADER_SEQUENCINGENABLED: 'SequencingEnabled',
    CSV_HEADER_FACETABLEMULTISELECT: 'FacetableMultiSelect',

    CSV_HEADER_CURRENTVALUE: 'Current Value',
    CSV_HEADER_NEWVALUE: 'New Value',
    CSV_HEADER_ATTRVALUES: 'Attribute Values',

    CSV_HEADER_CAT_MASTERCATALOG: 'Master Catalog',
    CSV_HEADER_CAT_IDENTIFIER: 'Identifier',
    CSV_HEADER_CAT_PARENTIDENTIFIER: 'Parent Identifier',
    CSV_HEADER_CAT_NAMEUS: 'Name US',
    CSV_HEADER_CAT_URLKEYWORD: 'URL keyword',
    CSV_HEADER_CAT_PAGETITLE: 'Page title',
    CSV_HEADER_CAT_METADESC: 'Meta description',
    CSV_HEADER_CAT_FACETMANAGEMENT: 'Facet Management',
    CSV_HEADER_CAT_STORE: 'STORE',
    CSV_HEADER_CAT_SHORTDESC: 'Short Description',
    CSV_HEADER_CAT_PUBLISHED: 'Published',

    CSV_HEADER_SOURCELOCALE: 'Source Locale',
    CSV_HEADER_TRANSLATIONLOCALE: 'Translation Locale',
    CSV_HEADER_TRANSLATIONSTATUS: 'Translation Status',
    CSV_HEADER_CAT_MASTERCATALOGPATH: 'Master Catalog Path',

    CSV_HEADER_HIDE_SKU_ATTRIBUTE: 'Hide SKU List Attribute',
    CSV_HEADER_NEW_PARENT: 'New Parent',
    CSV_HEADER_PARENT:'Parent',
    CSV_HEADER_DELETE_CATALOG_ENTRY: 'Delete Catalog Entry',
 
    CSV_HEADER_COMPONENTCODE: 'Component Code',
    CSV_HEADER_COMPONENTTYPE: 'Component Type',
    CSV_HEADER_CHILDCODE: 'Child Code',
    CSV_HEADER_DISPLAYSEQUENCE: 'Display Sequence',
    CSV_HEADER_QUANTITY: 'Quantity',
    CSV_HEADER_DELETE: 'Delete',

    CSV_HEADER_CHILDID: 'Child ID',
    CSV_HEADER_PARENTID: 'Parent ID',

    MAX_NO_FEATURES: 12,
    MAX_NO_CTA: 7,
    MAX_NO_UTILITYBELT: 10


});
