import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite'

let sqlite: SQLiteConnection | null = null
let vaultDb: SQLiteDBConnection | null = null
let searchDb: SQLiteDBConnection | null = null

export function getSqlite(): SQLiteConnection {
  if (!sqlite) sqlite = new CapacitorSQLite()
  return sqlite
}

export async function initVaultDb(password: string): Promise<SQLiteDBConnection> {
  const conn = getSqlite()

  const ret = await conn.checkConnectionsConsistency()
  const isConn = await conn.isConnection('vault.db', false)
  if (ret.result && isConn.result) {
    vaultDb = await conn.retrieveConnection('vault.db', false)
  } else {
    vaultDb = await conn.createConnection('vault.db', false, 'no-encryption', 1, false)
  }

  if (password) {
    await vaultDb.open(password)
  } else {
    await vaultDb.open()
  }

  await vaultDb.execute(`
    CREATE TABLE IF NOT EXISTS vault_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)

  await vaultDb.execute(`
    CREATE TABLE IF NOT EXISTS vault_records (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      encrypted_data TEXT NOT NULL,
      iv TEXT NOT NULL,
      auth_tag TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      shard_status TEXT NOT NULL DEFAULT 'local',
      tags TEXT DEFAULT '[]'
    );
  `)

  await vaultDb.execute(`
    CREATE TABLE IF NOT EXISTS shard_registry (
      shard_id TEXT PRIMARY KEY,
      record_id TEXT NOT NULL,
      peer_fingerprint TEXT NOT NULL,
      shard_index INTEGER NOT NULL,
      total_shards INTEGER NOT NULL,
      distributed_at INTEGER NOT NULL,
      FOREIGN KEY (record_id) REFERENCES vault_records(id) ON DELETE CASCADE
    );
  `)

  return vaultDb
}

export async function initSearchDb(): Promise<SQLiteDBConnection> {
  const conn = getSqlite()

  const ret = await conn.checkConnectionsConsistency()
  const isConn = await conn.isConnection('search.db', false)
  if (ret.result && isConn.result) {
    searchDb = await conn.retrieveConnection('search.db', false)
  } else {
    searchDb = await conn.createConnection('search.db', false, 'no-encryption', 1, false)
  }

  await searchDb.open()

  await searchDb.execute(`
    CREATE VIRTUAL TABLE IF NOT EXISTS protocols USING fts5(
      heading,
      body,
      category,
      tags,
      tokenize='porter unicode61'
    );
  `)

  return searchDb
}

export async function openMbtilesDb(name: string): Promise<SQLiteDBConnection> {
  const conn = getSqlite()
  const dbPath = `${name}.mbtiles`
  return await conn.createConnection(dbPath, true, 'no-encryption', 1, true)
}

export function getVaultDb(): SQLiteDBConnection | null {
  return vaultDb
}

export function getSearchDb(): SQLiteDBConnection | null {
  return searchDb
}

export async function closeVaultDb(): Promise<void> {
  if (vaultDb) {
    await vaultDb.close()
    vaultDb = null
  }
}
