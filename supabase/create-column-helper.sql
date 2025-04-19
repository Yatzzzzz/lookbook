-- Create a helper function to check table columns
CREATE OR REPLACE FUNCTION get_columns_for_table(target_table text)
RETURNS TABLE (
    column_name text,
    data_type text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::text,
        c.data_type::text
    FROM 
        information_schema.columns c
    WHERE 
        c.table_schema = 'public' AND
        c.table_name = target_table;
END;
$$;

-- Grant access to the function for authenticated users
GRANT EXECUTE ON FUNCTION get_columns_for_table TO authenticated;
GRANT EXECUTE ON FUNCTION get_columns_for_table TO anon; 