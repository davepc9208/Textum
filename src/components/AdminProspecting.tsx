import { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Check, Download, FileUp, Loader2, Pause, Play, Plus, RefreshCw, Search, Send, Users, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { parseProspectsCsv, PROSPECT_STATUSES, type OutreachCampaign, type Prospect, type ProspectStatus } from '../lib/prospecting';

const STATUS_LABELS: Record<ProspectStatus, string> = {
  nuevo: 'Nuevo', investigado: 'Investigado', aprobado: 'Aprobado', contactado: 'Contactado',
  respondio: 'Respondió', reunion: 'Reunión', propuesta: 'Propuesta', cliente: 'Cliente',
  no_interesado: 'No interesado', baja: 'Baja',
};

const DEFAULT_STEPS = [
  {
    delay_days: 0,
    subject: 'Piloto metodológico para {{institucion}}',
    body: '<p>Hola {{nombre}},</p><p>Te escribo porque estamos seleccionando algunos programas doctorales de España y Latinoamérica para un piloto TEXTUM de revisión metodológica.</p><p>Revisamos dos proyectos y entregamos una orientación breve sobre la coherencia entre problema, objetivos y metodología. ¿Serías la persona adecuada para comentarlo?</p><p>Un saludo,<br>TEXTUM</p>',
  },
  {
    delay_days: 4,
    subject: 'Una propuesta concreta para el programa doctoral',
    body: '<p>Hola {{nombre}},</p><p>Retomo mi mensaje anterior. La propuesta está pensada para ayudar a detectar incoherencias metodológicas antes de que se conviertan en problemas durante la supervisión o la defensa.</p><p>Si te parece útil, puedo enviarte una explicación de una página con el funcionamiento del piloto.</p><p>Un saludo,<br>TEXTUM</p>',
  },
  {
    delay_days: 7,
    subject: 'Cierro este hilo por ahora',
    body: '<p>Hola {{nombre}},</p><p>Cierro este hilo para no insistir. Si el apoyo metodológico para doctorandos es relevante para {{institucion}}, estaré encantada de explicarte el piloto en una conversación breve.</p><p>Si no eres la persona adecuada, agradecería que me indicaras quién coordina esta área.</p><p>Un saludo,<br>TEXTUM</p>',
  },
];

type EventCounts = Record<string, number>;

export default function AdminProspecting() {
  const [view, setView] = useState<'prospects' | 'campaigns' | 'metrics'>('prospects');
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [campaigns, setCampaigns] = useState<OutreachCampaign[]>([]);
  const [events, setEvents] = useState<EventCounts>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [campaignName, setCampaignName] = useState('Piloto institucional — Doctorado');
  const [dailyLimit, setDailyLimit] = useState(15);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    setLoading(true);
    setError('');
    const [prospectResult, campaignResult, eventResult] = await Promise.all([
      supabase.from('prospects').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('outreach_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('outreach_events').select('event_type').limit(5000),
    ]);
    if (prospectResult.error) setError(prospectResult.error.message);
    if (campaignResult.error && !campaignResult.error.message.includes('does not exist')) setError(campaignResult.error.message);
    if (eventResult.error && !eventResult.error.message.includes('does not exist')) setError(eventResult.error.message);
    setProspects((prospectResult.data as Prospect[]) || []);
    setCampaigns((campaignResult.data as OutreachCampaign[]) || []);
    const counts: EventCounts = {};
    (eventResult.data || []).forEach((event: { event_type: string }) => { counts[event.event_type] = (counts[event.event_type] || 0) + 1; });
    setEvents(counts);
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, []);

  const filtered = useMemo(() => prospects.filter((prospect) => {
    if (status && prospect.status !== status) return false;
    const haystack = [prospect.name, prospect.email, prospect.institution, prospect.programme, prospect.role, prospect.country].join(' ').toLowerCase();
    return !search.trim() || haystack.includes(search.trim().toLowerCase());
  }), [prospects, search, status]);

  const handleCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const parsed = parseProspectsCsv(await file.text());
      if (!parsed.length) throw new Error('No se encontraron filas válidas. El CSV necesita al menos nombre y email.');
      const { error: insertError } = await supabase.from('prospects').upsert(parsed, { onConflict: 'email', ignoreDuplicates: true });
      if (insertError) throw insertError;
      setMessage(`${parsed.length} prospectos válidos procesados. Los nuevos quedan pendientes de aprobación.`);
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo importar el CSV.'); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const updateProspect = async (id: string, patch: Partial<Prospect>) => {
    setBusy(true); setError('');
    const { error: updateError } = await supabase.from('prospects').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
    if (updateError) setError(updateError.message); else setProspects(current => current.map(item => item.id === id ? { ...item, ...patch } : item));
    setBusy(false);
  };

  const createCampaign = async () => {
    if (!campaignName.trim()) return;
    setBusy(true); setError('');
    const { data: campaign, error: campaignError } = await supabase.from('outreach_campaigns').insert({ name: campaignName.trim(), language: 'es', offer: 'piloto-doctorado', daily_limit: Math.min(100, Math.max(1, dailyLimit)), status: 'borrador' }).select().single();
    if (campaignError || !campaign) { setError(campaignError?.message || 'No se pudo crear la campaña.'); setBusy(false); return; }
    const steps = DEFAULT_STEPS.map((step, index) => ({ ...step, campaign_id: campaign.id, step_number: index + 1 }));
    const { error: stepsError } = await supabase.from('outreach_steps').insert(steps);
    if (stepsError) setError(stepsError.message); else { setMessage('Campaña creada con la secuencia de tres mensajes.'); setSelectedCampaign(campaign.id); setShowNewCampaign(false); await refresh(); }
    setBusy(false);
  };

  const enrollApproved = async () => {
    if (!selectedCampaign) { setError('Selecciona una campaña.'); return; }
    const approved = prospects.filter(item => item.approved && item.contact_basis && !item.do_not_contact && item.status !== 'baja');
    if (!approved.length) { setError('No hay prospectos aprobados para incorporar.'); return; }
    setBusy(true); setError('');
    const rows = approved.map(prospect => ({ campaign_id: selectedCampaign, prospect_id: prospect.id, step_number: 1, next_at: new Date().toISOString() }));
    const { error: enrollError } = await supabase.from('outreach_enrollments').upsert(rows, { onConflict: 'campaign_id,prospect_id', ignoreDuplicates: true });
    if (enrollError) setError(enrollError.message); else setMessage(`${approved.length} prospectos preparados. La campaña sigue en borrador hasta que la actives.`);
    setBusy(false);
  };

  const toggleCampaign = async (campaign: OutreachCampaign) => {
    const nextStatus = campaign.status === 'activa' ? 'pausada' : campaign.status === 'pausada' || campaign.status === 'borrador' ? 'activa' : 'finalizada';
    setBusy(true); setError('');
    const { error: updateError } = await supabase.from('outreach_campaigns').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', campaign.id);
    if (updateError) setError(updateError.message); else await refresh();
    setBusy(false);
  };

  const exportCsv = () => {
    const header = ['nombre','email','institucion','departamento','programa','cargo','pais','idioma','fuente','base','estado','aprobado','no_contactar'];
    const rows = filtered.map(item => [item.name, item.email, item.institution, item.department, item.programme, item.role, item.country, item.language, item.source_url, item.contact_basis, item.status, item.approved ? 'si' : 'no', item.do_not_contact ? 'si' : 'no'].map(value => JSON.stringify(value || '')).join(','));
    const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `textum-prospectos-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  const eligible = prospects.filter(item => item.approved && item.contact_basis && !item.do_not_contact && item.status !== 'baja').length;

  return (
    <section className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.3em] text-gold uppercase">Adquisición</p>
          <h1 className="font-serif text-3xl text-navy mt-2">Prospección institucional</h1>
          <p className="text-sm text-navy/50 mt-1">Prospectos cualificados → conversaciones → reuniones → clientes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsv} />
          <button onClick={() => fileRef.current?.click()} disabled={busy} className="flex items-center gap-2 px-4 py-2.5 border border-navy/15 rounded-sm text-xs tracking-widest text-navy/70 hover:border-gold/50"><FileUp size={14} /> IMPORTAR CSV</button>
          <button onClick={exportCsv} disabled={!filtered.length} className="flex items-center gap-2 px-4 py-2.5 border border-navy/15 rounded-sm text-xs tracking-widest text-navy/70 hover:border-gold/50 disabled:opacity-40"><Download size={14} /> EXPORTAR</button>
          <button onClick={() => setShowNewCampaign(true)} className="btn-primary flex items-center gap-2 px-4 py-2.5 text-xs tracking-widest rounded-sm"><Plus size={14} /> NUEVA CAMPAÑA</button>
        </div>
      </div>

      {(message || error) && <div className={`rounded-sm border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error || message}</div>}

      <div className="grid sm:grid-cols-4 gap-3">
        {[['Prospectos', prospects.length, Users], ['Aprobados', eligible, Check], ['Respuestas', events.responded || events.replied || 0, Send], ['Clientes', events.client || 0, BarChart3]].map(([label, value, Icon]) => {
          const StatIcon = Icon as typeof Users;
          return <div key={String(label)} className="bg-white border border-navy/10 rounded-sm p-4"><StatIcon size={16} className="text-gold mb-3" /><p className="font-serif text-2xl text-navy">{String(value)}</p><p className="text-[10px] text-navy/45 tracking-widest uppercase mt-1">{String(label)}</p></div>;
        })}
      </div>

      <div className="flex items-center gap-1 border-b border-navy/10">
        {([['prospects', 'Prospectos'], ['campaigns', 'Campañas'], ['metrics', 'Métricas']] as const).map(([key, label]) => <button key={key} onClick={() => setView(key)} className={`px-5 py-3 text-xs tracking-widest uppercase border-b-2 -mb-px ${view === key ? 'border-gold text-navy' : 'border-transparent text-navy/40'}`}>{label}</button>)}
        <button onClick={() => void refresh()} className="ml-auto p-2 text-navy/40 hover:text-navy" aria-label="Actualizar"><RefreshCw size={15} /></button>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" /></div> : view === 'prospects' ? (
        <div className="bg-white border border-navy/10 rounded-sm overflow-hidden">
          <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-navy/10"><div className="relative flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/30" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar persona, universidad o email…" className="w-full border border-navy/15 rounded-sm pl-9 pr-3 py-2 text-sm" /></div><select value={status} onChange={e => setStatus(e.target.value)} className="border border-navy/15 rounded-sm px-3 py-2 text-sm"><option value="">Todos los estados</option>{PROSPECT_STATUSES.map(item => <option key={item} value={item}>{STATUS_LABELS[item]}</option>)}</select></div>
          {filtered.length === 0 ? <div className="p-16 text-center text-navy/40">Importa un CSV con contactos profesionales cualificados para empezar.</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-navy/[0.03] text-left text-[10px] tracking-widest uppercase text-navy/45"><th className="px-4 py-3">Contacto</th><th className="px-4 py-3">Institución</th><th className="px-4 py-3">País / cargo</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Aprobación</th></tr></thead><tbody>{filtered.map(item => <tr key={item.id} className="border-t border-navy/5"><td className="px-4 py-3"><p className="font-medium text-navy">{item.name}</p><a className="text-xs text-navy/55 hover:text-gold" href={`mailto:${item.email}`}>{item.email}</a></td><td className="px-4 py-3 text-xs text-navy/65">{item.institution || '—'}<span className="block text-navy/35">{item.programme || item.department || ''}</span></td><td className="px-4 py-3 text-xs text-navy/60">{item.country || '—'}<span className="block text-navy/35">{item.role || ''}</span></td><td className="px-4 py-3"><select value={item.status} onChange={e => void updateProspect(item.id, { status: e.target.value as ProspectStatus })} className="text-[10px] uppercase tracking-widest border border-navy/15 rounded-full px-2 py-1"><option value={item.status}>{STATUS_LABELS[item.status]}</option>{PROSPECT_STATUSES.filter(option => option !== item.status).map(option => <option key={option} value={option}>{STATUS_LABELS[option]}</option>)}</select></td><td className="px-4 py-3"><label className="flex items-center gap-2 text-xs text-navy/60"><input type="checkbox" checked={item.approved} onChange={e => void updateProspect(item.id, { approved: e.target.checked, status: e.target.checked ? 'aprobado' : 'investigado' })} /> {item.approved ? 'Listo para campaña' : 'Revisar'}</label><label className="flex items-center gap-2 mt-2 text-[11px] text-red-500"><input type="checkbox" checked={item.do_not_contact} onChange={e => void updateProspect(item.id, { do_not_contact: e.target.checked, status: e.target.checked ? 'baja' : 'nuevo' })} /> No contactar</label></td></tr>)}</tbody></table></div>}
        </div>
      ) : view === 'campaigns' ? (
        <div className="space-y-4">
          <div className="bg-white border border-navy/10 rounded-sm p-5 flex flex-col md:flex-row md:items-center gap-4"><div className="flex-1"><p className="font-serif text-xl text-navy">Preparar envíos</p><p className="text-xs text-navy/50 mt-1">Solo se envían prospectos aprobados y con base de contacto documentada. Aptos ahora: {eligible}.</p></div><select value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)} className="border border-navy/15 rounded-sm px-3 py-2 text-sm"><option value="">Selecciona una campaña</option>{campaigns.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.name} · {campaign.status}</option>)}</select><button onClick={() => void enrollApproved()} disabled={busy || !selectedCampaign} className="btn-primary flex items-center gap-2 px-4 py-2.5 text-xs tracking-widest rounded-sm disabled:opacity-50"><Users size={14} /> INCORPORAR APROBADOS</button></div>
          {campaigns.length === 0 ? <div className="bg-white border border-dashed border-navy/15 rounded-sm p-16 text-center text-navy/40">Crea la primera campaña para preparar la prospección.</div> : campaigns.map(campaign => <div key={campaign.id} className="bg-white border border-navy/10 rounded-sm p-5 flex flex-col md:flex-row md:items-center gap-4"><div className="flex-1"><p className="font-serif text-xl text-navy">{campaign.name}</p><p className="text-xs text-navy/45 mt-1">{campaign.daily_limit} contactos diarios · {campaign.offer}</p></div><span className={`text-[10px] tracking-widest uppercase px-2 py-1 rounded-full border ${campaign.status === 'activa' ? 'text-emerald-700 border-emerald-200 bg-emerald-50' : 'text-navy/50 border-navy/15'}`}>{campaign.status}</span><button onClick={() => void toggleCampaign(campaign)} disabled={busy || campaign.status === 'finalizada'} className="flex items-center gap-2 px-3 py-2 border border-navy/15 rounded-sm text-xs">{campaign.status === 'activa' ? <><Pause size={13} /> PAUSAR</> : <><Play size={13} /> ACTIVAR</>}</button></div>)}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">{[['sent', 'Mensajes enviados'], ['replied', 'Respuestas'], ['meeting', 'Reuniones'], ['proposal', 'Propuestas'], ['client', 'Clientes'], ['bounced', 'Rebotes']].map(([key, label]) => <div key={key} className="bg-white border border-navy/10 rounded-sm p-6"><p className="text-[10px] tracking-widest uppercase text-navy/45">{label}</p><p className="font-serif text-4xl text-navy mt-3">{events[key] || 0}</p></div>)}</div>
      )}

      {showNewCampaign && <div className="fixed inset-0 z-50 bg-navy/70 flex items-center justify-center p-4"><div className="bg-cream rounded-sm shadow-2xl w-full max-w-lg p-7"><div className="flex justify-between items-center"><h2 className="font-serif text-2xl text-navy">Nueva campaña</h2><button onClick={() => setShowNewCampaign(false)}><X size={18} /></button></div><p className="text-sm text-navy/55 mt-2">La campaña se crea en borrador para que puedas revisar los mensajes antes de activarla.</p><label className="block text-xs tracking-widest uppercase text-navy/50 mt-6 mb-2">Nombre</label><input value={campaignName} onChange={e => setCampaignName(e.target.value)} className="w-full border border-navy/15 rounded-sm px-4 py-3" /><label className="block text-xs tracking-widest uppercase text-navy/50 mt-5 mb-2">Límite diario</label><input type="number" min={1} max={100} value={dailyLimit} onChange={e => setDailyLimit(Number(e.target.value))} className="w-full border border-navy/15 rounded-sm px-4 py-3" /><div className="flex justify-end gap-3 mt-7"><button onClick={() => setShowNewCampaign(false)} className="px-4 py-2 text-xs tracking-widest">CANCELAR</button><button onClick={() => void createCampaign()} disabled={busy} className="btn-primary px-5 py-2.5 text-xs tracking-widest">CREAR CAMPAÑA</button></div></div></div>}
    </section>
  );
}
