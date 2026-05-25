"use client";

import { useRouter } from "next/navigation";
import { OnboardingWizard } from "@/components/saas/OnboardingWizard";
import { supabase } from "@/lib/supabaseClient";

export default function OnboardingPage() {
  const router = useRouter();
  async function finish() {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (userId) {
      await supabase.from("workspaces").update({ onboarding_completed: true, onboarding_step: 4 }).eq("owner_id", userId);
    }
    router.replace("/?tab=marketplace");
  }
  return <OnboardingWizard onFinish={finish} />;
}
