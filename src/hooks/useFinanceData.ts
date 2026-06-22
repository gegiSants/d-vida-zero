import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserLifeProfile, EMPTY_LIFE_PROFILE } from "@/types/userProfile";

export interface DBPayment {
  id: string;
  item: string;
  tipo: string;
  tipo_obrigacao?: string;
  total: number;
  parcelas: number;
  ja_pago: number;
  origem: string;
  origem_tipo?: string;
  start_date: string;
  categoria: string;
  tipo_financeiro: string;
  natureza_financeira?: string;
  encerrado_em?: string | null;
}
export interface DBExtra {
  id: string;
  item: string;
  valor_mensal: number;
  categoria?: string;
  natureza_financeira?: string;
}

export type DBProfile = UserLifeProfile;

const mapProfile = (row: Record<string, unknown> | null): DBProfile => {
  if (!row) return { ...EMPTY_LIFE_PROFILE };
  return {
    salario: Number(row.salario) || 0,
    reserva: Number(row.reserva) || 0,
    momento_vida: (row.momento_vida as DBProfile["momento_vida"]) || "",
    moradia_situacao: (row.moradia_situacao as DBProfile["moradia_situacao"]) || "",
    dependentes: (row.dependentes as DBProfile["dependentes"]) || "",
    renda_tipo: (row.renda_tipo as DBProfile["renda_tipo"]) || "",
    objetivo_principal: (row.objetivo_principal as DBProfile["objetivo_principal"]) || "",
    mora_com_pais: Boolean(row.mora_com_pais),
    paga_aluguel: Boolean(row.paga_aluguel),
    paga_contas_casa: Boolean(row.paga_contas_casa),
    sustenta_familia: Boolean(row.sustenta_familia),
    contexto_livre: String(row.contexto_livre || ""),
    perfil_completo: Boolean(row.perfil_completo),
  };
};

export const useFinanceData = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<DBPayment[]>([]);
  const [extras, setExtras] = useState<DBExtra[]>([]);
  const [profile, setProfile] = useState<DBProfile>({ ...EMPTY_LIFE_PROFILE });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [p, e, pr] = await Promise.all([
      supabase.from("payments").select("*").order("created_at"),
      supabase.from("extras").select("*").order("created_at"),
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    ]);
    setPayments((p.data as DBPayment[]) || []);
    setExtras((e.data as DBExtra[]) || []);
    setProfile(mapProfile(pr.data as Record<string, unknown> | null));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  const addPayment = async (p: Omit<DBPayment, "id">) => {
    if (!user) return;
    const { error } = await supabase.from("payments").insert({ ...p, user_id: user.id });
    if (!error) refresh();
  };
  const updatePayment = async (id: string, patch: Partial<DBPayment>) => {
    const current = payments.find((p) => p.id === id);
    const nextJaPago = patch.ja_pago ?? current?.ja_pago ?? 0;
    const parcelas = patch.parcelas ?? current?.parcelas ?? 1;
    const finalPatch: Partial<DBPayment> = { ...patch };

    if (nextJaPago >= parcelas) {
      finalPatch.encerrado_em = patch.encerrado_em ?? new Date().toISOString();
    } else if (patch.ja_pago !== undefined) {
      finalPatch.encerrado_em = null;
    }

    await supabase.from("payments").update(finalPatch).eq("id", id);
    refresh();
  };
  const removePayment = async (id: string) => {
    await supabase.from("payments").delete().eq("id", id);
    refresh();
  };
  const addExtra = async (
    item: string,
    valor_mensal: number,
    categoria = "outro",
    natureza_financeira = "essencial"
  ) => {
    if (!user) return;
    await supabase.from("extras").insert({ item, valor_mensal, categoria, natureza_financeira, user_id: user.id });
    refresh();
  };
  const removeExtra = async (id: string) => {
    await supabase.from("extras").delete().eq("id", id);
    refresh();
  };
  const saveProfile = async (patch: Partial<DBProfile>) => {
    if (!user) return;
    const next = { ...profile, ...patch };
    setProfile(next);
    await supabase.from("profiles").upsert({ id: user.id, ...next, updated_at: new Date().toISOString() });
  };

  return {
    payments, extras, profile, loading,
    addPayment, updatePayment, removePayment,
    addExtra, removeExtra, saveProfile, refresh,
  };
};
