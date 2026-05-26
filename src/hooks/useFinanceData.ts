import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DBPayment {
  id: string;
  item: string;
  tipo: string;
  total: number;
  parcelas: number;
  ja_pago: number;
  origem: string;
  start_date: string;
  categoria: string;
  tipo_financeiro: string;
}
export interface DBExtra {
  id: string;
  item: string;
  valor_mensal: number;
}
export interface DBProfile {
  salario: number;
  reserva: number;
}

export const useFinanceData = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<DBPayment[]>([]);
  const [extras, setExtras] = useState<DBExtra[]>([]);
  const [profile, setProfile] = useState<DBProfile>({ salario: 0, reserva: 0 });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [p, e, pr] = await Promise.all([
      supabase.from("payments").select("*").order("created_at"),
      supabase.from("extras").select("*").order("created_at"),
      supabase.from("profiles").select("salario,reserva").eq("id", user.id).maybeSingle(),
    ]);
    setPayments((p.data as DBPayment[]) || []);
    setExtras((e.data as DBExtra[]) || []);
    if (pr.data) setProfile({ salario: Number(pr.data.salario), reserva: Number(pr.data.reserva) });
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
    await supabase.from("payments").update(patch).eq("id", id);
    refresh();
  };
  const removePayment = async (id: string) => {
    await supabase.from("payments").delete().eq("id", id);
    refresh();
  };
  const addExtra = async (item: string, valor_mensal: number) => {
    if (!user) return;
    await supabase.from("extras").insert({ item, valor_mensal, user_id: user.id });
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
    await supabase.from("profiles").upsert({ id: user.id, ...next });
  };

  return {
    payments, extras, profile, loading,
    addPayment, updatePayment, removePayment,
    addExtra, removeExtra, saveProfile, refresh,
  };
};
