-- SQL Script to show database structure in CSV format
-- This will help understand the current tables and their structure

-- List all tables with their schemas
SELECT 
  schemaname as schema,
  tablename as table,
  'table' as object_type
FROM 
  pg_tables
WHERE 
  schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND schemaname != 'auth'
  AND tablename NOT LIKE 'pg_%'
ORDER BY 
  schemaname, 
  tablename;

-- List all columns with their data types
SELECT 
  table_schema as schema,
  table_name as table,
  column_name as column,
  data_type as type,
  character_maximum_length as max_length,
  column_default as default_value,
  is_nullable as nullable
FROM 
  information_schema.columns
WHERE 
  table_schema NOT IN ('pg_catalog', 'information_schema')
  AND table_schema != 'auth'
  AND table_name NOT LIKE 'pg_%'
ORDER BY 
  table_schema, 
  table_name, 
  ordinal_position;

-- List all foreign key relationships
SELECT
  tc.table_schema as schema,
  tc.table_name as table,
  kcu.column_name as column,
  ccu.table_schema as foreign_schema,
  ccu.table_name as foreign_table,
  ccu.column_name as foreign_column
FROM 
  information_schema.table_constraints tc
JOIN 
  information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN 
  information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE 
  tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
  AND tc.table_schema != 'auth'
ORDER BY 
  tc.table_schema,
  tc.table_name;

-- List all indexes (excluding primary keys)
SELECT
  schemaname as schema,
  tablename as table,
  indexname as index,
  indexdef as definition
FROM
  pg_indexes
WHERE
  schemaname NOT IN ('pg_catalog', 'information_schema')
  AND schemaname != 'auth'
  AND indexname NOT LIKE '%_pkey'
ORDER BY
  schemaname,
  tablename;

-- List all primary keys
SELECT
  tc.table_schema as schema,
  tc.table_name as table,
  kcu.column_name as primary_key_column
FROM
  information_schema.table_constraints tc
JOIN
  information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE
  tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
  AND tc.table_schema != 'auth'
ORDER BY
  tc.table_schema,
  tc.table_name;

-- List all RLS policies
SELECT
  n.nspname as schema,
  c.relname as table,
  pol.polname as policy_name,
  CASE WHEN pol.polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as type,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM
  pg_policy pol
JOIN
  pg_class c ON pol.polrelid = c.oid
JOIN
  pg_namespace n ON c.relnamespace = n.oid
WHERE
  n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND n.nspname != 'auth'
ORDER BY
  n.nspname,
  c.relname,
  pol.polname; 