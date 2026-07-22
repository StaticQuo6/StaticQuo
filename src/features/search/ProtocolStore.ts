import { getVaultDb } from '../../shared/db/DatabaseService'

let protocolDb: any = null

export async function getProtocolDb() {
  if (protocolDb) return protocolDb
  const db = await getVaultDb()
  protocolDb = db
  return db
}

export async function queryProtocols(searchQuery: string) {
  const db = await getProtocolDb()
  if (!db) return []

  try {
    const result = await db.query(
      `SELECT heading, body, category, rank FROM protocols WHERE protocols MATCH ? ORDER BY rank LIMIT 20`,
      [searchQuery]
    )
    return result.values || []
  } catch {
    return []
  }
}

export async function seedProtocols() {
  const db = await getProtocolDb()
  if (!db) return

  const tableCheck = await db.isTable('protocols')
  if (!tableCheck.result) return

  const rowCheck = await db.query('SELECT COUNT(*) as cnt FROM protocols')
  if (rowCheck.values && rowCheck.values[0].cnt > 0) return

  const protocols = [
    { heading: 'Right to Remain Silent', body: 'You have the right to remain silent under the Fifth Amendment. Do not sign anything without a lawyer present.', category: 'legal', tags: 'rights, arrest, fifth amendment' },
    { heading: 'Right to an Attorney', body: 'If you are arrested, you have the right to an attorney. If you cannot afford one, one will be provided.', category: 'legal', tags: 'rights, lawyer, sixth amendment' },
    { heading: 'First Aid: Bleeding Control', body: 'Apply direct pressure to the wound using a clean cloth. Elevate the wound above the heart. If bleeding continues, apply a tourniquet.', category: 'medical', tags: 'emergency, first aid, bleed' },
    { heading: 'First Aid: CPR', body: 'Check responsiveness. Call for help. Begin chest compressions at 100-120 per minute. Push hard and fast in the center of the chest.', category: 'medical', tags: 'emergency, first aid, cpr, resuscitation' },
    { heading: 'De-escalation Protocol', body: 'Stay calm. Speak in a low, even voice. Keep hands visible. Do not run. Follow officer instructions but do not consent to searches.', category: 'safety', tags: 'protest, police, de-escalation' },
    { heading: 'Chemical Irritant Exposure', body: 'Do not rub eyes or skin. Flush affected areas with water or saline for 15 minutes. Remove contaminated clothing. Seek fresh air.', category: 'medical', tags: 'chemical, tear gas, pepper spray, first aid' },
    { heading: 'Legal Observer Guidelines', body: 'Document officer badge numbers and patrol car numbers. Record all interactions on video if safe. Do not intervene physically.', category: 'legal', tags: 'observer, documentation, protest' },
    { heading: 'Mass Arrest Contingency', body: 'If multiple people are arrested, establish a legal hotline. Track location of detained individuals. Designate a legal coordinator.', category: 'safety', tags: 'arrest, mass, detention, coordinator' },
    { heading: 'Water Supply Protocol', body: 'Each person needs 1 gallon of water per day. Rotate supplies every 6 months. Store in cool, dark place. Use purification tablets for untreated sources.', category: 'logistics', tags: 'water, supply, storage' },
    { heading: 'Communications Blackout Plan', body: 'Pre-agreed meeting points. Use mesh relay for local coordination. Designate runners between groups. Use pre-arranged signals.', category: 'safety', tags: 'communication, blackout, mesh, runner' },
  ]

  for (const p of protocols) {
    await db.run(
      `INSERT INTO protocols (heading, body, category, tags) VALUES (?, ?, ?, ?)`,
      [p.heading, p.body, p.category, p.tags]
    )
  }
}
