// =====================================================================
//  Bia Castelano — Edge Function "crm-usuarios"
//  Cria logins e troca senhas pela tela Acessos do CRM.
//  Só administradores (tela Acessos) conseguem usar.
//
//  Publicar (uma vez): Supabase › Edge Functions › Deploy a new function ›
//  Via Editor › nome: crm-usuarios › cole este arquivo inteiro › Deploy.
//  A chave de administrador (service role) já existe dentro do Supabase;
//  ela nunca sai de lá nem aparece no CRM.
// =====================================================================
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const resp = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const AREAS = ["painel", "agenda", "clientes", "financeiro", "entregas"];
const NIVEIS = ["editar", "ler", "nenhum"];
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return resp(200, { ok: true });
  if (req.method !== "POST") return resp(405, { erro: "Use POST" });

  const url = Deno.env.get("SUPABASE_URL")!;
  // chave pública: a do ambiente ou a que o próprio CRM manda (publishable)
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || req.headers.get("apikey") || "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !anon || !service) return resp(500, { erro: "Função sem as chaves do Supabase (SUPABASE_SERVICE_ROLE_KEY)" });
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return resp(401, { erro: "Entre no CRM antes" });

  // 1) quem pediu é administrador? (o banco confere o login pelo token)
  const comoUsuario = createClient(url, anon, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const quem = await comoUsuario.auth.getUser(auth.slice(7));
  if (quem.error || !quem.data.user) return resp(401, { erro: "Sessão inválida: entre de novo no CRM" });
  const adm = await comoUsuario.rpc("crm_eh_admin");
  if (adm.error) return resp(500, { erro: "Não consegui conferir o acesso: " + adm.error.message });
  if (adm.data !== true) return resp(403, { erro: "Só administradores podem criar logins" });

  // 2) pedido
  let p: Record<string, unknown>;
  try { p = await req.json(); } catch { return resp(400, { erro: "Pedido inválido" }); }
  const acao = String(p.acao ?? "");
  const email = String(p.email ?? "").trim().toLowerCase();
  const senha = String(p.senha ?? "");
  const nome = String(p.nome ?? "").trim() || null;
  if (!EMAIL.test(email)) return resp(400, { erro: "E-mail inválido" });
  if (senha.length < 8) return resp(400, { erro: "A senha precisa ter pelo menos 8 caracteres" });

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

  // acha o login pelo e-mail (equipe pequena: algumas páginas no máximo)
  async function acharUsuario(e: string) {
    for (let page = 1; page <= 20; page++) {
      const r = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (r.error) throw r.error;
      const u = r.data.users.find((x) => (x.email ?? "").toLowerCase() === e);
      if (u) return u;
      if (r.data.users.length < 200) return null;
    }
    return null;
  }

  try {
    if (acao === "criar") {
      if (await acharUsuario(email)) return resp(409, { erro: "Já existe um login com esse e-mail. Use “trocar senha”." });
      const c = await admin.auth.admin.createUser({
        email, password: senha, email_confirm: true, user_metadata: nome ? { name: nome } : {},
      });
      if (c.error) return resp(400, { erro: c.error.message });

      // coloca na lista de acessos (se já estava, mantém o acesso que tinha)
      const ja = await admin.from("crm_acessos").select("email,nome").eq("email", email).maybeSingle();
      if (!ja.data) {
        const pedido = (p.modulos ?? {}) as Record<string, string>;
        const modulos: Record<string, string> = {};
        for (const a of AREAS) modulos[a] = NIVEIS.includes(pedido[a]) ? pedido[a] : "nenhum";
        const ins = await admin.from("crm_acessos").insert({ email, nome, admin: false, modulos });
        if (ins.error) return resp(200, { ok: true, aviso: "Login criado, mas não entrou na lista: " + ins.error.message });
      } else if (!ja.data.nome && nome) {
        await admin.from("crm_acessos").update({ nome }).eq("email", email);
      }
      return resp(200, { ok: true });
    }

    if (acao === "senha") {
      const u = await acharUsuario(email);
      if (!u) return resp(404, { erro: "Esse e-mail ainda não tem login" });
      const r = await admin.auth.admin.updateUserById(u.id, { password: senha });
      if (r.error) return resp(400, { erro: r.error.message });
      return resp(200, { ok: true });
    }

    return resp(400, { erro: "Ação desconhecida" });
  } catch (e) {
    return resp(500, { erro: (e as Error).message ?? String(e) });
  }
});
