// =====================================================================
//  Bia Castelano — Edge Function "crm-agenda"
//  Mostra no CRM os eventos do Google Agenda, sem Google Cloud e sem login
//  do Google: usa o "Endereço secreto no formato iCal" da agenda.
//
//  - salvar:  quem edita a Agenda cola o endereço secreto (fica guardado só
//             aqui no Supabase, na tabela crm_segredos; o CRM nunca o lê de volta).
//  - eventos: quem vê a Agenda recebe os eventos (3 meses atrás até 18 meses à frente).
//  - remover: desliga e apaga o endereço guardado.
//
//  Publicar (uma vez): Supabase › Edge Functions › Deploy a new function ›
//  Via Editor › nome: crm-agenda › cole este arquivo inteiro › Deploy.
//  Antes, rode fonte/supabase/agenda_ics.sql no SQL Editor.
// =====================================================================
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import ICAL from "npm:ical.js@1.5.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const resp = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const FUSO_PADRAO = "America/Sao_Paulo";

// ---------- datas ----------
function fusoValido(tz: string | undefined | null): string | null {
  if (!tz) return null;
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return tz; } catch { return null; }
}
function deslocamento(ms: number, tz: string): number {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(ms));
  const g = (k: string) => +(p.find((x) => x.type === k)?.value ?? 0);
  return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second")) - ms;
}
// hora "de parede" num fuso -> instante UTC
function paraUTC(t: any, tz: string): Date {
  const base = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second);
  let ms = base - deslocamento(base, tz);
  const d2 = deslocamento(ms, tz);
  if (base - d2 !== ms) ms = base - d2;
  return new Date(ms);
}
const p2 = (n: number) => String(n).padStart(2, "0");
// ICAL.Time -> formato da API do Google ({date} ou {dateTime})
function quando(t: any, tzProp: string | null, tzAgenda: string) {
  if (t.isDate) return { date: `${t.year}-${p2(t.month)}-${p2(t.day)}` };
  if (t.zone && t.zone.tzid === "UTC") return { dateTime: new Date(Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second)).toISOString() };
  const tz = fusoValido(tzProp) || fusoValido(t.zone && t.zone.tzid) || tzAgenda;
  return { dateTime: paraUTC(t, tz).toISOString() };
}

// ---------- leitura do .ics ----------
export function lerIcs(texto: string, de: Date, ate: Date) {
  const cal = new ICAL.Component(ICAL.parse(texto));
  const tzAgenda = fusoValido(cal.getFirstPropertyValue("x-wr-timezone")) || FUSO_PADRAO;
  const min = ICAL.Time.fromJSDate(de, true), max = ICAL.Time.fromJSDate(ate, true);
  const vevents = cal.getAllSubcomponents("vevent");
  const mestres = new Map<string, any>(), excecoes: any[] = [];
  for (const v of vevents) {
    const ev = new ICAL.Event(v);
    if (ev.isRecurrenceException()) excecoes.push(ev); else mestres.set(ev.uid, ev);
  }
  const soltas: any[] = [];
  for (const ex of excecoes) { const m = mestres.get(ex.uid); if (m) m.relateException(ex); else soltas.push(ex); }

  const out: any[] = [];
  const tzDe = (c: any, nome: string) => { const p = c.getFirstProperty(nome); return p ? p.getParameter("tzid") : null; };
  const add = (ev: any, ini: any, fim: any, chave: string) => {
    const c = ev.component;
    if (String(c.getFirstPropertyValue("status") || "").toUpperCase() === "CANCELLED") return;
    const fimT = fim || ini;
    if (fimT.compare(min) < 0 || ini.compare(max) > 0) return;
    out.push({
      id: chave,
      summary: ev.summary || "",
      location: ev.location || "",
      description: ev.description || "",
      start: quando(ini, tzDe(c, "dtstart"), tzAgenda),
      end: fim ? quando(fim, tzDe(c, "dtend") || tzDe(c, "dtstart"), tzAgenda) : null,
    });
  };
  for (const ev of [...mestres.values(), ...soltas]) {
    if (!ev.startDate) continue;
    if (!ev.isRecurring()) { add(ev, ev.startDate, ev.endDate, ev.uid); continue; }
    const it = ev.iterator();
    let n: any, voltas = 0;
    while ((n = it.next()) && voltas++ < 20000) {
      if (n.compare(max) > 0) break;
      const d = ev.getOccurrenceDetails(n);
      add(d.item, d.startDate, d.endDate, ev.uid + "_" + n.toString());
    }
  }
  out.sort((a, b) => String(a.start.dateTime || a.start.date).localeCompare(String(b.start.dateTime || b.start.date)));
  return out;
}

// só aceitamos o endereço iCal do próprio Google Agenda
function endereçoOk(u: string): string | null {
  let url: URL;
  try { url = new URL(u.trim().replace(/^webcal:\/\//i, "https://")); } catch { return null; }
  if (url.protocol === "http:") url.protocol = "https:";
  if (url.protocol !== "https:" || url.hostname !== "calendar.google.com") return null;
  if (!/^\/calendar\/ical\/.+\.ics$/.test(url.pathname)) return null;
  return url.toString();
}
async function baixar(url: string): Promise<string> {
  const r = await fetch(url, { headers: { Accept: "text/calendar" }, redirect: "follow" });
  if (r.status === 404) throw new Error("O Google não encontrou essa agenda. O endereço secreto pode ter sido redefinido: copie de novo.");
  if (!r.ok) throw new Error("O Google respondeu " + r.status + " ao buscar a agenda.");
  const t = await r.text();
  if (!/BEGIN:VCALENDAR/.test(t)) throw new Error("Esse endereço não devolveu uma agenda. Use o \"Endereço secreto no formato iCal\".");
  return t;
}
function janela() {
  const h = new Date();
  return [new Date(Date.UTC(h.getUTCFullYear(), h.getUTCMonth() - 3, 1)), new Date(Date.UTC(h.getUTCFullYear(), h.getUTCMonth() + 18, 1))];
}

if (typeof Deno !== "undefined") Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return resp(200, { ok: true });
  if (req.method !== "POST") return resp(405, { erro: "Use POST" });

  const urlSb = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || req.headers.get("apikey") || "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!urlSb || !anon || !service) return resp(500, { erro: "Função sem as chaves do Supabase (SUPABASE_SERVICE_ROLE_KEY)" });
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return resp(401, { erro: "Entre no CRM antes" });

  const comoUsuario = createClient(urlSb, anon, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const quem = await comoUsuario.auth.getUser(auth.slice(7));
  if (quem.error || !quem.data.user) return resp(401, { erro: "Sessão inválida: entre de novo no CRM" });
  const nv = await comoUsuario.rpc("crm_nivel", { area: "agenda" });
  // sem o acessos_setup.sql, todo login vale como editor (como no resto do CRM)
  const nivel = nv.error ? 2 : Number(nv.data ?? 0);
  if (nivel < 1) return resp(403, { erro: "Sem acesso à Agenda" });

  let p: Record<string, unknown> = {};
  try { p = await req.json(); } catch { /* sem corpo = eventos */ }
  const acao = String(p.acao ?? "eventos");
  const admin = createClient(urlSb, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const marca = (on: boolean) => admin.from("crm_settings")
    .upsert({ key: "google_ics", value: on, updated_at: new Date().toISOString() });

  try {
    if (acao === "salvar" || acao === "remover") {
      if (nivel < 2) return resp(403, { erro: "Só quem edita a Agenda pode mudar a ligação com o Google" });
      if (acao === "remover") {
        await admin.from("crm_segredos").delete().eq("key", "google_ics_url");
        await marca(false);
        return resp(200, { ok: true });
      }
      const url = endereçoOk(String(p.url ?? ""));
      if (!url) return resp(400, { erro: "Cole o \"Endereço secreto no formato iCal\" (começa com https://calendar.google.com/calendar/ical/ e termina em .ics)" });
      const [de, ate] = janela();
      const eventos = lerIcs(await baixar(url), de, ate);
      const s = await admin.from("crm_segredos").upsert({ key: "google_ics_url", value: url, updated_at: new Date().toISOString() });
      if (s.error) return resp(500, { erro: /crm_segredos/.test(s.error.message) ? "Falta rodar fonte/supabase/agenda_ics.sql no Supabase" : s.error.message });
      await marca(true);
      return resp(200, { ok: true, eventos });
    }

    const s = await admin.from("crm_segredos").select("value").eq("key", "google_ics_url").maybeSingle();
    if (s.error) return resp(500, { erro: /crm_segredos/.test(s.error.message) ? "Falta rodar fonte/supabase/agenda_ics.sql no Supabase" : s.error.message });
    if (!s.data?.value) return resp(200, { ok: true, conectado: false, eventos: [] });
    const [de, ate] = janela();
    return resp(200, { ok: true, conectado: true, eventos: lerIcs(await baixar(s.data.value), de, ate) });
  } catch (err) {
    return resp(502, { erro: (err as Error).message || String(err) });
  }
});
