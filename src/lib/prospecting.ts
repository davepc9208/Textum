export type ProspectStatus =
  | 'nuevo'
  | 'investigado'
  | 'aprobado'
  | 'contactado'
  | 'respondio'
  | 'reunion'
  | 'propuesta'
  | 'cliente'
  | 'no_interesado'
  | 'baja';

export type Prospect = {
  id: string;
  name: string;
  email: string;
  institution: string | null;
  department: string | null;
  programme: string | null;
  role: string | null;
  country: string | null;
  language: 'es' | 'en';
  source_url: string | null;
  contact_basis: string | null;
  tags: string[];
  status: ProspectStatus;
  approved: boolean;
  do_not_contact: boolean;
  notes: string | null;
  last_contact_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OutreachCampaign = {
  id: string;
  name: string;
  description: string | null;
  language: 'es' | 'en';
  offer: string;
  status: 'borrador' | 'activa' | 'pausada' | 'finalizada';
  daily_limit: number;
  send_hour: number;
  from_email: string | null;
  created_at: string;
  updated_at: string;
};

export type OutreachStep = {
  id: string;
  campaign_id: string;
  step_number: number;
  delay_days: number;
  subject: string;
  body: string;
};

export const PROSPECT_STATUSES: ProspectStatus[] = [
  'nuevo', 'investigado', 'aprobado', 'contactado', 'respondio',
  'reunion', 'propuesta', 'cliente', 'no_interesado', 'baja',
];

export const CAMPAIGN_STATUSES = ['borrador', 'activa', 'pausada', 'finalizada'] as const;

const HEADER_ALIASES: Record<string, string> = {
  nombre: 'name', name: 'name', contacto: 'name',
  email: 'email', correo: 'email', 'correo electrónico': 'email',
  universidad: 'institution', institucion: 'institution', institución: 'institution',
  departamento: 'department', department: 'department',
  programa: 'programme', 'programa doctoral': 'programme', programme: 'programme',
  cargo: 'role', rol: 'role', role: 'role',
  pais: 'country', país: 'country', country: 'country',
  idioma: 'language', language: 'language',
  fuente: 'source_url', 'fuente url': 'source_url', source_url: 'source_url',
  base: 'contact_basis', 'base de contacto': 'contact_basis', contact_basis: 'contact_basis',
  etiquetas: 'tags', tags: 'tags', notas: 'notes', notes: 'notes',
};

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/^\uFEFF/, '');
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"' && quoted) { cell += '"'; i += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === ',' && !quoted) { cells.push(cell.trim()); cell = ''; continue; }
    cell += char;
  }
  cells.push(cell.trim());
  return cells;
}

export function parseProspectsCsv(csv: string): Array<Omit<Prospect, 'id' | 'created_at' | 'updated_at'>> {
  const lines = csv.replace(/\r/g, '').split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map(normalizeHeader).map(header => HEADER_ALIASES[header] || header);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const seen = new Set<string>();
  const result: Array<Omit<Prospect, 'id' | 'created_at' | 'updated_at'>> = [];

  for (const line of lines.slice(1)) {
    const values = splitCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])) as Record<string, string>;
    const email = row.email?.trim().toLowerCase();
    if (!email || !emailPattern.test(email) || seen.has(email)) continue;
    seen.add(email);
    result.push({
      name: row.name?.trim() || 'Sin nombre',
      email,
      institution: row.institution?.trim() || null,
      department: row.department?.trim() || null,
      programme: row.programme?.trim() || null,
      role: row.role?.trim() || null,
      country: row.country?.trim() || null,
      language: row.language?.toLowerCase().startsWith('en') ? 'en' : 'es',
      source_url: row.source_url?.trim() || null,
      contact_basis: row.contact_basis?.trim() || null,
      tags: (row.tags || '').split(/[|;]/).map(tag => tag.trim()).filter(Boolean),
      status: 'nuevo',
      approved: false,
      do_not_contact: false,
      notes: row.notes?.trim() || null,
      last_contact_at: null,
    });
  }
  return result;
}

export function interpolateMessage(template: string, prospect: Partial<Prospect>) {
  const firstName = (prospect.name || '').trim().split(/\s+/)[0] || 'Hola';
  return template
    .replace(/\{\{nombre\}\}/g, firstName)
    .replace(/\{\{institucion\}\}/g, prospect.institution || '')
    .replace(/\{\{departamento\}\}/g, prospect.department || '')
    .replace(/\{\{programa\}\}/g, prospect.programme || '')
    .replace(/\{\{pais\}\}/g, prospect.country || '');
}
