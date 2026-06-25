import { AuthError, PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Evita bloqueio de extensões que removem `*` da query string */
export const PAYMENT_COLUMNS =
  "id,item,tipo,tipo_obrigacao,total,parcelas,ja_pago,origem,origem_tipo,start_date,categoria,tipo_financeiro,natureza_financeira,encerrado_em,created_at";

export const EXTRA_COLUMNS = "id,item,valor_mensal,categoria,natureza_financeira,created_at";

export const PROFILE_COLUMNS =
  "salario,reserva,momento_vida,moradia_situacao,dependentes,renda_tipo,objetivo_principal,mora_com_pais,paga_aluguel,paga_contas_casa,sustenta_familia,contexto_livre,perfil_completo";

export const isUnauthorized = (error: PostgrestError | AuthError | null | undefined) => {
  if (!error) return false;
  const status = "status" in error ? (error as PostgrestError).status : undefined;
  const code = error.code ?? "";
  const msg = (error.message ?? "").toLowerCase();
  return (
    status === 401 ||
    code === "PGRST301" ||
    code === "42501" ||
    msg.includes("jwt") ||
    msg.includes("not authenticated") ||
    msg.includes("invalid claim")
  );
};

export const mapDbErrorMessage = (error: PostgrestError | AuthError, context?: string) => {
  if (isUnauthorized(error)) {
    return "Sessão expirada ou inválida. Faça login novamente.";
  }
  const msg = error.message ?? "";
  if (msg.includes("column") && msg.includes("does not exist")) {
    return "Banco desatualizado: rode as migrations no Supabase (SQL das colunas novas).";
  }
  if (msg.includes("violates row-level security")) {
    return "Sem permissão para esta operação. Entre de novo na sua conta.";
  }
  if (context) return `${context}: ${msg}`;
  return msg || "Erro ao salvar no servidor.";
};

export const ensureValidSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;

  const expiresAt = session.expires_at ?? 0;
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt - now < 120) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshed.session) return null;
    return refreshed.session;
  }
  return session;
};

export const handleUnauthorized = async () => {
  toast.error("Sessão expirada. Redirecionando para o login...");
  await supabase.auth.signOut();
  window.location.href = "/auth";
};

export const notifyDbError = async (
  error: PostgrestError | null,
  context: string
): Promise<boolean> => {
  if (!error) return false;
  if (isUnauthorized(error)) {
    await handleUnauthorized();
    return true;
  }
  toast.error(mapDbErrorMessage(error, context));
  return true;
};
