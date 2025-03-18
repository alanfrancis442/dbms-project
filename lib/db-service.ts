"use server";

import { DatabaseConnection, DatabaseType, Database, Table, Column } from '@/lib/types';
import mysql from 'mysql2/promise';
import pg from 'pg';

export async function testConnection(connection: DatabaseConnection): Promise<boolean> {
  try {
    if (connection.type === 'mysql') {
      const conn = await mysql.createConnection({
        host: connection.host,
        port: connection.port,
        user: connection.user,
        password: connection.password,
      });
      await conn.end();
    } else if (connection.type === 'postgresql') {
      const client = new pg.Client({
        host: connection.host,
        port: connection.port,
        user: connection.user,
        password: connection.password,
      });
      await client.connect();
      await client.end();
    }
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

export async function getDatabases(connection: DatabaseConnection): Promise<Database[]> {
  try {
    if (connection.type === 'mysql') {
      const conn = await mysql.createConnection({
        host: connection.host,
        port: connection.port,
        user: connection.user,
        password: connection.password,
      });

      const [rows] = await conn.execute('SHOW DATABASES');
      await conn.end();

      return (rows as any[]).map(row => ({
        name: row.Database,
      }));
    } else if (connection.type === 'postgresql') {
      const client = new pg.Client({
        host: connection.host,
        port: connection.port,
        user: connection.user,
        password: connection.password,
      });

      await client.connect();
      const result = await client.query(
        "SELECT datname FROM pg_database WHERE datistemplate = false"
      );
      await client.end();

      return result.rows.map(row => ({
        name: row.datname,
      }));
    }

    return [];
  } catch (error) {
    console.error('Failed to get databases:', error);
    throw new Error('Failed to retrieve databases');
  }
}

export async function getTables(connection: DatabaseConnection, databaseName: string): Promise<Table[]> {
  try {
    if (connection.type === 'mysql') {
      const conn = await mysql.createConnection({
        host: connection.host,
        port: connection.port,
        user: connection.user,
        password: connection.password,
        database: databaseName,
      });

      // Get tables
      const [tables] = await conn.execute('SHOW TABLES');
      const tableNames = (tables as any[]).map(row => Object.values(row)[0] as string);

      const result: Table[] = [];

      // For each table, get columns and keys
      for (const tableName of tableNames) {
        const [columns] = await conn.execute(`DESCRIBE \`${tableName}\``);
        const [foreignKeys] = await conn.execute(`
          SELECT 
            COLUMN_NAME, 
            REFERENCED_TABLE_NAME, 
            REFERENCED_COLUMN_NAME 
          FROM 
            INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
          WHERE 
            TABLE_SCHEMA = ? AND 
            TABLE_NAME = ? AND 
            REFERENCED_TABLE_NAME IS NOT NULL
        `, [databaseName, tableName]);

        const tableColumns: Column[] = (columns as any[]).map(col => {
          const fk = (foreignKeys as any[]).find(fk => fk.COLUMN_NAME === col.Field);

          return {
            name: col.Field,
            type: col.Type,
            isPrimaryKey: col.Key === 'PRI',
            isForeignKey: !!fk,
            references: fk ? {
              table: fk.REFERENCED_TABLE_NAME,
              column: fk.REFERENCED_COLUMN_NAME,
            } : undefined,
          };
        });

        result.push({
          name: tableName,
          columns: tableColumns,
        });
      }

      await conn.end();
      return result;
    } else if (connection.type === 'postgresql') {
      const client = new pg.Client({
        host: connection.host,
        port: connection.port,
        user: connection.user,
        password: connection.password,
        database: databaseName,
      });

      await client.connect();

      // Get tables
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);

      const result: Table[] = [];

      // For each table, get columns and keys
      for (const table of tablesResult.rows) {
        const tableName = table.table_name;

        // Get columns
        const columnsResult = await client.query(`
          SELECT 
            c.column_name, 
            c.data_type,
            c.is_nullable,
            tc.constraint_type
          FROM 
            information_schema.columns c
          LEFT JOIN 
            information_schema.constraint_column_usage ccu 
            ON c.column_name = ccu.column_name AND c.table_name = ccu.table_name
          LEFT JOIN 
            information_schema.table_constraints tc 
            ON ccu.constraint_name = tc.constraint_name
          WHERE 
            c.table_name = $1
        `, [tableName]);

        // Get foreign keys
        const foreignKeysResult = await client.query(`
          SELECT
            kcu.column_name,
            ccu.table_name AS referenced_table,
            ccu.column_name AS referenced_column
          FROM
            information_schema.table_constraints tc
          JOIN
            information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN
            information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
          WHERE
            tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = $1
        `, [tableName]);

        const tableColumns: Column[] = columnsResult.rows.map(col => {
          const fk = foreignKeysResult.rows.find(fk => fk.column_name === col.column_name);

          return {
            name: col.column_name,
            type: col.data_type,
            isPrimaryKey: col.constraint_type === 'PRIMARY KEY',
            isForeignKey: !!fk,
            references: fk ? {
              table: fk.referenced_table,
              column: fk.referenced_column,
            } : undefined,
          };
        });

        result.push({
          name: tableName,
          columns: tableColumns,
        });
      }

      await client.end();
      return result;
    }

    return [];
  } catch (error) {
    console.error('Failed to get tables:', error);
    throw new Error('Failed to retrieve tables');
  }
}

interface CreateTableParams {
  connection: DatabaseConnection;
  databaseName: string;
  tableName: string;
  columns: {
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isNullable: boolean;
    isUnique: boolean;
    defaultValue?: string;
    isForeignKey?: boolean;
    references?: {
      table: string;
      column: string;
    };
  }[];
}

export async function createTable(params: CreateTableParams): Promise<void> {
  const { connection, databaseName, tableName, columns } = params;

  try {
    if (connection.type === 'mysql') {
      const conn = await mysql.createConnection({
        host: connection.host,
        port: connection.port,
        user: connection.user,
        password: connection.password,
        database: databaseName,
      });

      // Build MySQL create table SQL
      let sql = `CREATE TABLE \`${tableName}\` (\n`;

      // Add columns
      const columnDefs = columns.map(col => {
        let def = `\`${col.name}\` ${col.type}`;

        if (!col.isNullable) {
          def += ' NOT NULL';
        }

        if (col.isUnique && !col.isPrimaryKey) {
          def += ' UNIQUE';
        }

        if (col.defaultValue !== undefined && col.defaultValue !== '') {
          // Handle string types by adding quotes
          if (col.type.includes('char') || col.type.includes('text') ||
            col.type === 'date' || col.type === 'time' ||
            col.type === 'datetime' || col.type === 'timestamp') {
            def += ` DEFAULT '${col.defaultValue}'`;
          } else {
            def += ` DEFAULT ${col.defaultValue}`;
          }
        }

        return def;
      });
      sql += columnDefs.join(',\n');

      // Add primary keys
      const primaryKeys = columns.filter(col => col.isPrimaryKey).map(col => `\`${col.name}\``);
      if (primaryKeys.length > 0) {
        sql += ',\nPRIMARY KEY (' + primaryKeys.join(', ') + ')';
      }

      // Add foreign keys
      columns.filter(col => col.isForeignKey && col.references).forEach(col => {
        if (col.references) {
          sql += `,\nFOREIGN KEY (\`${col.name}\`) REFERENCES \`${col.references.table}\`(\`${col.references.column}\`)`;
        }
      });

      sql += '\n)';

      // Execute the query
      console.log('Executing SQL:', sql);
      await conn.execute(sql);
      await conn.end();
    }
    else if (connection.type === 'postgresql') {
      const client = new pg.Client({
        host: connection.host,
        port: connection.port,
        user: connection.user,
        password: connection.password,
        database: databaseName,
      });

      await client.connect();

      // Build PostgreSQL create table SQL
      let sql = `CREATE TABLE "${tableName}" (\n`;

      // Add columns
      const columnDefs = columns.map(col => {
        let def = `"${col.name}" ${col.type}`;

        if (!col.isNullable) {
          def += ' NOT NULL';
        }

        if (col.isUnique && !col.isPrimaryKey) {
          def += ' UNIQUE';
        }

        if (col.defaultValue) {
          def += ` DEFAULT ${col.defaultValue}`;
        }

        return def;
      });

      sql += columnDefs.join(',\n');

      // Add primary keys
      const primaryKeys = columns.filter(col => col.isPrimaryKey).map(col => `"${col.name}"`);
      if (primaryKeys.length > 0) {
        sql += ',\nPRIMARY KEY (' + primaryKeys.join(', ') + ')';
      }

      // Add foreign keys
      columns.filter(col => col.isForeignKey && col.references).forEach(col => {
        if (col.references) {
          sql += `,\nFOREIGN KEY ("${col.name}") REFERENCES "${col.references.table}"("${col.references.column}")`;
        }
      });

      sql += '\n)';

      // Execute the query
      await client.query(sql);
      await client.end();
    }
  } catch (error) {
    console.error('Failed to create table:', error);
    throw error;
  }
}

interface ExecuteQueryParams {
  connection: DatabaseConnection;
  databaseName: string;
  query: string;
}

interface QueryResult {
  columns: string[];
  rows: any[];
}

export async function executeQuery(params: ExecuteQueryParams): Promise<QueryResult> {
  const { connection, databaseName, query } = params;

  try {
    if (connection.type === 'mysql') {
      const conn = await mysql.createConnection({
        host: connection.host,
        port: connection.port,
        user: connection.user,
        password: connection.password,
        database: databaseName,
      });

      const [rows, fields] = await conn.execute(query);
      await conn.end();

      // Extract column names from fields
      const columns = fields ? (fields as mysql.FieldPacket[]).map(field => field.name) : [];

      return {
        columns,
        rows: rows as any[],
      };
    }
    else if (connection.type === 'postgresql') {
      const client = new pg.Client({
        host: connection.host,
        port: connection.port,
        user: connection.user,
        password: connection.password,
        database: databaseName,
      });

      await client.connect();
      const result = await client.query(query);
      await client.end();

      // Extract column names
      const columns = result.fields ? result.fields.map(field => field.name) : [];

      return {
        columns,
        rows: result.rows,
      };
    }

    throw new Error(`Unsupported database type: ${connection.type}`);
  } catch (error) {
    console.error('Query execution failed:', error);
    throw error;
  }
}