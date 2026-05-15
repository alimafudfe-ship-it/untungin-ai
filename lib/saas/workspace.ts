import { supabase } from "@/lib/supabaseClient";

export type Workspace = { id: string; name: string; plan: "free" | "pro" | "business"; onboarding_completed?: boolean };
export type Store = { id: string; workspace_id: string; name: string; marketplace: string; is_active?: boolean };
export type MemberRole = "owner" | "admin" | "finance" | "operator" | "analyst" | "viewer";

export async function getOrCreateDefaultWorkspace(user: { id: string; email?: string | null }) {
  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces(id,name,plan,onboarding_completed)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const existing = Array.isArray((member as any)?.workspaces) ? (member as any).workspaces[0] : (member as any)?.workspaces;
  if (existing?.id) return existing as Workspace;

  const workspaceName = user.email ? `Workspace ${user.email.split("@")[0]}` : "Workspace Seller";
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert({ owner_id: user.id, name: workspaceName, plan: "free" })
    .select("id,name,plan,onboarding_completed")
    .single();

  if (workspaceError) throw workspaceError;

  await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    email: user.email || "owner@untungin.local",
    role: "owner",
    accepted_at: new Date().toISOString(),
  });

  await supabase.from("stores").insert({ workspace_id: workspace.id, name: "Toko utama", marketplace: "manual" });
  return workspace as Workspace;
}

export async function listWorkspaceStores(workspaceId: string) {
  const { data, error } = await supabase
    .from("stores")
    .select("id,workspace_id,name,marketplace,is_active")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as Store[];
}
