import { supabase } from "@/lib/supabaseClient";

export function subscribeWorkspaceRealtime(workspaceId: string, onChange: (payload: unknown) => void) {
  return supabase
    .channel(`workspace-realtime-${workspaceId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `workspace_id=eq.${workspaceId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `workspace_id=eq.${workspaceId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `workspace_id=eq.${workspaceId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "ai_insights", filter: `workspace_id=eq.${workspaceId}` }, onChange)
    .subscribe();
}
