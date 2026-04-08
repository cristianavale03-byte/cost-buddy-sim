// IMPROVED: centralized Supabase service layer for estimates, settings, and price overrides
import { supabase } from "@/integrations/supabase/client";

// ── Estimates ──────────────────────────────────────────────

export async function fetchEstimates() {
  const { data, error } = await supabase
    .from("estimates")
    .select("*")
    .order("saved_at", { ascending: false });
  if (error) { console.error("fetchEstimates", error); throw error; }
  return data ?? [];
}

export async function insertEstimate(e: Record<string, unknown>) {
  const { error } = await supabase.from("estimates").insert(e as any);
  if (error) { console.error("insertEstimate", error); throw error; }
}

export async function deleteEstimate(id: string) {
  const { error } = await supabase.from("estimates").delete().eq("id", id);
  if (error) { console.error("deleteEstimate", error); throw error; }
}

export async function clearAllEstimates() {
  const { error } = await supabase.from("estimates").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) { console.error("clearAllEstimates", error); throw error; }
}

// ── Extra Rate (settings) ──────────────────────────────────

export async function fetchExtraRate(): Promise<number> {
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "pombalense-extra-rate")
    .maybeSingle();
  if (error) { console.error("fetchExtraRate", error); throw error; }
  return data ? Number(data.value) : 0;
}

export async function upsertExtraRate(rate: number) {
  const { error } = await supabase
    .from("settings")
    .upsert({ key: "pombalense-extra-rate", value: String(rate), updated_at: new Date().toISOString() } as any);
  if (error) { console.error("upsertExtraRate", error); throw error; }
}

// ── Price Table Overrides ──────────────────────────────────

export async function fetchPriceOverride(key: "cf" | "cc") {
  const { data, error } = await supabase
    .from("price_table_overrides")
    .select("data")
    .eq("key", key)
    .maybeSingle();
  if (error) { console.error("fetchPriceOverride", error); throw error; }
  return data?.data ?? null;
}

export async function upsertPriceOverride(key: "cf" | "cc", data: unknown, updatedBy?: string) {
  const { error } = await supabase
    .from("price_table_overrides")
    .upsert({ key, data, updated_at: new Date().toISOString(), updated_by: updatedBy ?? null } as any);
  if (error) { console.error("upsertPriceOverride", error); throw error; }
}

export async function deletePriceOverride(key: "cf" | "cc") {
  const { error } = await supabase
    .from("price_table_overrides")
    .delete()
    .eq("key", key);
  if (error) { console.error("deletePriceOverride", error); throw error; }
}
