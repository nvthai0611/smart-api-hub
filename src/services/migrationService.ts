import fs from 'fs';
import path from 'path';
import db from '../config/database';

export const runMigrations = async () => {
  const schemaPath = path.join(__dirname, '../../schema.json');
  if (!fs.existsSync(schemaPath)) {
    console.error('schema.json not found');
    return;
  }

  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

  for (const tableName of Object.keys(schema)) {
    const hasTable = await db.schema.hasTable(tableName);
    if (!hasTable) {
      console.log(`Creating table: ${tableName}`);
      await db.schema.createTable(tableName, (table) => {
        const columns = schema[tableName].columns;
        for (const [colName, colType] of Object.entries(columns)) {
          applyColumnType(table, colName, colType as string);
        }
      });
    }
  }
  console.log('Migrations completed successfully');
};

const applyColumnType = (table: any, colName: string, type: string) => {
  if (type === 'uuid_primary') {
    table.uuid(colName).primary().defaultTo(db.raw('gen_random_uuid()'));
  } else if (type === 'string') {
    table.string(colName);
  } else if (type === 'string_unique') {
    table.string(colName).unique();
  } else if (type === 'string_nullable') {
    table.string(colName).nullable();
  } else if (type.startsWith('string_default_')) {
    const defaultValue = type.replace('string_default_', '');
    table.string(colName).defaultTo(defaultValue);
  } else if (type === 'text_nullable') {
    table.text(colName).nullable();
  } else if (type === 'decimal') {
    table.decimal(colName);
  } else if (type.startsWith('integer_default_')) {
    const defaultValue = parseInt(type.replace('integer_default_', ''));
    table.integer(colName).defaultTo(defaultValue);
  } else if (type === 'timestamp_now') {
    table.timestamp(colName).defaultTo(db.fn.now());
  } else if (type.startsWith('uuid_references_')) {
    const parts = type.split('_');
    const refTable = parts[2];
    const refCol = parts[3];
    table.uuid(colName).references(refCol).inTable(refTable).onDelete('CASCADE');
  } else if (type === 'uuid_nullable') {
    table.uuid(colName).nullable();
  } else {
    table.string(colName);
  }
};
