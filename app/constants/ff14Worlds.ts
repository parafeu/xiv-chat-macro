/**
 * FFXIV worlds (servers), grouped by data center and physical region.
 * Source: https://ffxiv.consolegameswiki.com/wiki/World
 */

export interface DataCenter {
  /** Data center name (e.g. "Chaos", "Aether"). */
  name: string
  /** Physical region this data center belongs to. */
  region: 'North America' | 'Europe' | 'Japan' | 'Oceania'
  /** World names hosted on this data center. */
  worlds: readonly string[]
}

export const FF14_DATA_CENTERS: readonly DataCenter[] = [
  // North America
  { name: 'Aether',   region: 'North America', worlds: ['Adamantoise', 'Cactuar', 'Faerie', 'Gilgamesh', 'Jenova', 'Midgardsormr', 'Sargatanas', 'Siren'] },
  { name: 'Crystal',  region: 'North America', worlds: ['Balmung', 'Brynhildr', 'Coeurl', 'Diabolos', 'Goblin', 'Malboro', 'Mateus', 'Zalera'] },
  { name: 'Primal',   region: 'North America', worlds: ['Behemoth', 'Excalibur', 'Exodus', 'Famfrit', 'Hyperion', 'Lamia', 'Leviathan', 'Ultros'] },
  { name: 'Dynamis',  region: 'North America', worlds: ['Halicarnassus', 'Maduin', 'Marilith', 'Seraph', 'Cuchulainn', 'Golem', 'Kraken', 'Rafflesia'] },

  // Europe
  { name: 'Chaos',    region: 'Europe',        worlds: ['Cerberus', 'Louisoix', 'Moogle', 'Omega', 'Phantom', 'Ragnarok', 'Sagittarius', 'Spriggan'] },
  { name: 'Light',    region: 'Europe',        worlds: ['Alpha', 'Lich', 'Odin', 'Phoenix', 'Raiden', 'Shiva', 'Twintania', 'Zodiark'] },

  // Japan
  { name: 'Elemental', region: 'Japan',        worlds: ['Aegis', 'Atomos', 'Carbuncle', 'Garuda', 'Gungnir', 'Kujata', 'Tonberry', 'Typhon'] },
  { name: 'Gaia',     region: 'Japan',         worlds: ['Alexander', 'Bahamut', 'Durandal', 'Fenrir', 'Ifrit', 'Ridill', 'Tiamat', 'Ultima'] },
  { name: 'Mana',     region: 'Japan',         worlds: ['Anima', 'Asura', 'Chocobo', 'Hades', 'Ixion', 'Masamune', 'Pandaemonium', 'Titan'] },
  { name: 'Meteor',   region: 'Japan',         worlds: ['Belias', 'Mandragora', 'Ramuh', 'Shinryu', 'Unicorn', 'Valefor', 'Yojimbo', 'Zeromus'] },

  // Oceania
  { name: 'Materia',  region: 'Oceania',       worlds: ['Bismarck', 'Ravana', 'Sephirot', 'Sophia', 'Zurvan'] },
] as const

/** All world names, flat (useful for validation). */
export const FF14_WORLDS: readonly string[] = FF14_DATA_CENTERS.flatMap(dc => dc.worlds)

/**
 * Items shape consumed by `<USelectMenu>` — one group per data center,
 * each group opens with a non-selectable label row showing the DC name.
 */
export const FF14_WORLD_SELECT_ITEMS = FF14_DATA_CENTERS.map(dc => [
  { type: 'label' as const, label: `${dc.name} · ${dc.region}` },
  ...dc.worlds.map(w => ({ label: w, value: w })),
])
