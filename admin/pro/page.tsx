"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const db = supabase as any;

type PaymentStatus = "pending" | "approved" | "rejected" | string;
type UpgradePlan = "monthly" | "lifetime" | string;
type StatusFilter = "all" | "pending" | "approved" | "rejected";

type PaymentRequest = {
  id: string;
  user_id: string;
  email: string | null;
  phone?: string | null;
  plan: UpgradePlan | null;
  status: PaymentStatus | null;
  created_at: string;
};

type Profile = {
  id: string;
  email?: string | null;
  role?: string | null;
  plan: string | null;
  pro_until: string | null;
};

const WHATSAPP_NUMBER = "6285697834766";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID");
}

function formatShortDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID");
}

function getProUntil(plan: UpgradePlan | null) {
  if (plan === "monthly") {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString();
  }

  if (plan === "lifetime") {
    return "2099-12-31T23:59:59.000Z";
  }

  return null;
}

function getPlanLabel(plan: UpgradePlan | null) {
  if (plan === "monthly") return "PRO Bulanan";
  if (plan === "lifetime") return "PRO Lifetime";
  return plan || "-";
}

function getPlanPrice(plan: UpgradePlan | null) {
  if (plan === "monthly") return "Rp29.000/bulan";
  if (plan === "lifetime") return "Rp99.000 sekali bayar";
  return "-";
}

function isActivePro(profile: Profile) {
  return profile.plan === "pro" && (!profile.pro_until || new Date(profile.pro_until) > new Date());
}

function isExpiredPro(profile: Profile) {
  return profile.plan === "pro" && !!profile.pro_until && new Date(profile.pro_until) <= new Date();
}

function normalizePhone(value?: string | null) {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("62")) return digits;
  return digits;
}

export default function AdminProPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminAllowed, setAdminAllowed] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [adminProfile, setAdminProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [profileSearch, setProfileSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const pending = requests.filter((r) => r.status === "pending").length;
    const approved = requests.filter((r) => r.status === "approved").length;
    const rejected = requests.filter((r) => r.status === "rejected").length;
    const activePro = profiles.filter(isActivePro).length;
    const expiredPro = profiles.filter(isExpiredPro).length;

    return { pending, approved, rejected, activePro, expiredPro, totalRequests: requests.length };
  }, [requests, profiles]);

  const filteredRequests = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return requests.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesKeyword =
        !keyword ||
        [item.email, item.phone, item.user_id, item.plan, item.status, item.created_at]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      return matchesStatus && matchesKeyword;
    });
  }, [requests, search, statusFilter]);

  const filteredProfiles = useMemo(() => {
    const keyword = profileSearch.toLowerCase().trim();
    if (!keyword) return profiles;

    return profiles.filter((profile) =>
      [profile.email, profile.id, profile.plan, profile.pro_until]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [profiles, profileSearch]);

  const cardStyle: React.CSSProperties = {
    background: "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(2,6,23,0.92))",
    border: "1px solid rgba(148,163,184,0.16)",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 25px 80px rgba(0,0,0,0.45)",
  };

  const buttonStyle: React.CSSProperties = {
    border: "none",
    borderRadius: 12,
    padding: "10px 13px",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.22)",
    background: "rgba(2,6,23,0.72)",
    color: "white",
    outline: "none",
  };

  useEffect(() => {
    loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAdminData() {
    setLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setAdminAllowed(false);
      setAdminEmail(null);
      setAdminProfile(null);
      setLoading(false);
      router.replace("/login");
      return;
    }

    const email = userData.user.email ?? null;
    setAdminEmail(email);

    const { data: ownProfile, error: ownProfileError } = await supabase
      .from("profiles")
      .select("id, email, role, plan, pro_until")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (ownProfileError) {
      console.error(ownProfileError);
      setAdminAllowed(false);
      setAdminProfile(null);
      setLoading(false);
      return;
    }

    const currentProfile = ownProfile as Profile | null;
    setAdminProfile(currentProfile);

    if (currentProfile?.role !== "admin") {
      setAdminAllowed(false);
      setLoading(false);
      return;
    }

    setAdminAllowed(true);

    const { data: requestData, error: requestError } = await supabase
      .from("payment_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (requestError) {
      console.error(requestError);
      alert("Gagal mengambil payment request. Cek RLS policy Supabase.");
      setRequests([]);
    } else {
      setRequests((requestData as PaymentRequest[]) ?? []);
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role, plan, pro_until")
      .order("pro_until", { ascending: false });

    if (profileError) {
      console.error(profileError);
      setProfiles([]);
    } else {
      setProfiles((profileData as Profile[]) ?? []);
    }

    setLastRefresh(new Date().toLocaleString("id-ID"));
    setLoading(false);
  }

  function assertAdmin() {
    if (adminProfile?.role !== "admin") {
      alert("Akses ditolak. Hanya role admin yang bisa melakukan aksi ini.");
      return false;
    }
    return true;
  }

  async function approveRequest(item: PaymentRequest, forcePlan?: UpgradePlan) {
    if (!assertAdmin()) return;

    if (!item.user_id) {
      alert("Request ini tidak punya user_id.");
      return;
    }

    const finalPlan = forcePlan || item.plan || "lifetime";
    const planText = getPlanLabel(finalPlan);
    const confirmed = window.confirm(
      `Aktifkan ${planText} untuk ${item.email || item.user_id}?\nHarga: ${getPlanPrice(finalPlan)}`
    );

    if (!confirmed) return;

    setActionLoading(item.id);

    const proUntil = getProUntil(finalPlan);

    const { error: profileError } = await db
      .from("profiles")
      .update({
        plan: "pro",
        pro_until: proUntil,
        email: item.email,
      })
      .eq("id", item.user_id);

    if (profileError) {
      console.error(profileError);
      alert("Gagal update profile ke PRO. Cek RLS policy profiles.");
      setActionLoading(null);
      return;
    }

    const { error: requestError } = await db
      .from("payment_requests")
      .update({
        status: "approved",
        plan: finalPlan,
      })
      .eq("id", item.id);

    if (requestError) {
      console.error(requestError);
      alert("Profile sudah PRO, tapi gagal update status payment request.");
      setActionLoading(null);
      return;
    }

    alert(`${planText} berhasil diaktifkan untuk ${item.email || item.user_id}.`);
    await loadAdminData();
    setActionLoading(null);
  }

  async function rejectRequest(item: PaymentRequest) {
    if (!assertAdmin()) return;

    const confirmed = window.confirm(`Tolak request dari ${item.email || item.user_id}?`);
    if (!confirmed) return;

    setActionLoading(item.id);

    const { error } = await db
      .from("payment_requests")
      .update({ status: "rejected" })
      .eq("id", item.id);

    if (error) {
      console.error(error);
      alert("Gagal menolak request.");
    } else {
      alert("Request ditandai rejected.");
      await loadAdminData();
    }

    setActionLoading(null);
  }

  function makeFollowUpMessage(item: PaymentRequest) {
    const planText = getPlanLabel(item.plan);
    const price = getPlanPrice(item.plan);
    return `Halo ${item.email || ""}, request upgrade ${planText} kamu sudah kami terima.

Nominal: ${price}
Bank BRI
AN: Ali Mafud
No Rek: 091901036207538

Silakan kirim bukti transfer di chat ini agar PRO bisa langsung diaktifkan.`;
  }

  function makeApprovedMessage(item: PaymentRequest) {
    const planText = getPlanLabel(item.plan);
    return `Halo ${item.email || ""}, upgrade ${planText} kamu sudah aktif.

Silakan refresh dashboard Untungin.ai. Selamat pakai AI CFO PRO.`;
  }

  function followUpWhatsApp(item: PaymentRequest, approved = false) {
    const phone = normalizePhone(item.phone) || WHATSAPP_NUMBER;
    const message = approved ? makeApprovedMessage(item) : makeFollowUpMessage(item);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  }

  async function copyMessage(item: PaymentRequest) {
    try {
      await navigator.clipboard.writeText(makeFollowUpMessage(item));
      setCopiedId(item.id);
      window.setTimeout(() => setCopiedId(null), 1300);
    } catch (error) {
      console.error(error);
      alert("Gagal copy pesan. Pakai tombol WA User saja.");
    }
  }

  async function approveAndWhatsApp(item: PaymentRequest, forcePlan?: UpgradePlan) {
    await approveRequest(item, forcePlan);
    followUpWhatsApp({ ...item, plan: forcePlan || item.plan }, true);
  }

  async function revokePro(profile: Profile) {
    if (!assertAdmin()) return;

    const confirmed = window.confirm(`Cabut PRO dari user ${profile.email || profile.id}?`);
    if (!confirmed) return;

    setActionLoading(profile.id);

    const { error } = await supabase
      .from("profiles")
      .update({
        plan: "free",
        pro_until: null,
      })
      .eq("id", profile.id);

    if (error) {
      console.error(error);
      alert("Gagal cabut PRO.");
    } else {
      alert("PRO berhasil dicabut.");
      await loadAdminData();
    }

    setActionLoading(null);
  }

  async function extendPro(profile: Profile, months: number) {
    if (!assertAdmin()) return;

    const baseDate =
      profile.pro_until && new Date(profile.pro_until) > new Date()
        ? new Date(profile.pro_until)
        : new Date();
    baseDate.setMonth(baseDate.getMonth() + months);

    const confirmed = window.confirm(
      `Perpanjang PRO ${profile.email || profile.id} selama ${months} bulan?\nSampai: ${formatDate(
        baseDate.toISOString()
      )}`
    );
    if (!confirmed) return;

    setActionLoading(profile.id);

    const { error } = await supabase
      .from("profiles")
      .update({
        plan: "pro",
        pro_until: baseDate.toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      console.error(error);
      alert("Gagal perpanjang PRO.");
    } else {
      alert("PRO berhasil diperpanjang.");
      await loadAdminData();
    }

    setActionLoading(null);
  }

  async function makeLifetime(profile: Profile) {
    if (!assertAdmin()) return;

    const confirmed = window.confirm(`Ubah ${profile.email || profile.id} menjadi PRO Lifetime?`);
    if (!confirmed) return;

    setActionLoading(profile.id);

    const { error } = await supabase
      .from("profiles")
      .update({
        plan: "pro",
        pro_until: "2099-12-31T23:59:59.000Z",
      })
      .eq("id", profile.id);

    if (error) {
      console.error(error);
      alert("Gagal mengubah ke Lifetime.");
    } else {
      alert("User berhasil dibuat Lifetime.");
      await loadAdminData();
    }

    setActionLoading(null);
  }

  function statusBadge(status: PaymentStatus | null) {
    const color = status === "pending" ? "#fbbf24" : status === "approved" ? "#86efac" : "#fca5a5";
    const bg =
      status === "pending"
        ? "rgba(245,158,11,0.12)"
        : status === "approved"
        ? "rgba(34,197,94,0.12)"
        : "rgba(127,29,29,0.22)";
    return (
      <span style={{ color, background: bg, border: `1px solid ${color}55`, padding: "7px 10px", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>
        {status || "-"}
      </span>
    );
  }

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "#020617", color: "white", display: "grid", placeItems: "center", fontFamily: "Arial" }}>
        Loading admin...
      </main>
    );
  }

  if (!adminAllowed) {
    return (
      <main style={{ minHeight: "100vh", background: "#020617", color: "white", display: "grid", placeItems: "center", fontFamily: "Arial", padding: 24 }}>
        <div style={{ ...cardStyle, maxWidth: 560 }}>
          <h1>Admin Only</h1>
          <p style={{ color: "#94a3b8", lineHeight: 1.7 }}>
            Kamu login sebagai <b>{adminEmail || "belum login"}</b>. Akun ini belum memiliki role <code>admin</code>.
          </p>
          <p style={{ color: "#fbbf24", lineHeight: 1.7 }}>
            Buka Supabase lalu set <code>profiles.role = 'admin'</code> untuk akun admin. Akses panel tidak lagi memakai hardcoded email.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top left, rgba(34,197,94,0.22), transparent 32%), linear-gradient(135deg, #020617, #000)",
        color: "white",
        fontFamily: "Inter, Arial, sans-serif",
        padding: 24,
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        button:hover { transform: translateY(-1px); filter: brightness(1.05); }
        button { transition: 160ms ease; }
        input::placeholder { color: rgba(203,213,225,0.45); }
        @media (max-width: 980px) {
          .admin-grid, .request-row, .profile-row, .ops-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <section style={{ maxWidth: 1240, margin: "0 auto" }}>
        <header style={{ marginBottom: 22, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <p style={{ color: "#86efac", fontWeight: 900, margin: 0 }}>Untungin.ai Admin</p>
            <h1 style={{ fontSize: 42, margin: "6px 0" }}>Admin PRO Command Center</h1>
            <p style={{ color: "#94a3b8", margin: 0 }}>
              Login sebagai: <b>{adminEmail}</b> • Role: <b>{adminProfile?.role || "-"}</b> • Plan: <b>{adminProfile?.plan || "free"}</b>
              {lastRefresh ? ` • Last refresh: ${lastRefresh}` : ""}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => router.push("/")} style={{ ...buttonStyle, background: "#0f172a", border: "1px solid rgba(148,163,184,0.24)" }}>
              Dashboard
            </button>
            <button onClick={loadAdminData} style={{ ...buttonStyle, background: "#0f172a", border: "1px solid rgba(148,163,184,0.24)" }}>
              Refresh Data
            </button>
          </div>
        </header>

        <section style={{ ...cardStyle, marginBottom: 18, border: "1px solid rgba(245,158,11,0.3)" }}>
          <p style={{ color: "#fbbf24", fontWeight: 900, marginTop: 0 }}>🔐 Catatan keamanan penting</p>
          <p style={{ color: "#cbd5e1", lineHeight: 1.7, marginBottom: 0 }}>
            Panel ini sudah membatasi UI berdasarkan email admin. Untuk produksi, wajib tambah RLS Supabase agar hanya admin yang bisa membaca/mengubah payment_requests dan profiles. Jangan izinkan user biasa update kolom plan/pro_until.
          </p>
        </section>

        <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 18 }}>
          {[
            ["Pending", stats.pending, "#fbbf24", "Menunggu bukti transfer"],
            ["Approved", stats.approved, "#86efac", "Request selesai"],
            ["Rejected", stats.rejected, "#fca5a5", "Request ditolak"],
            ["PRO Aktif", stats.activePro, "#86efac", "User bisa akses dashboard"],
            ["PRO Expired", stats.expiredPro, "#fbbf24", "Perlu follow up"],
          ].map(([title, value, color, desc]) => (
            <div key={title} style={cardStyle}>
              <p style={{ color: "#94a3b8", margin: 0 }}>{title}</p>
              <h2 style={{ color: String(color), margin: "8px 0" }}>{value}</h2>
              <small style={{ color: "#64748b" }}>{desc}</small>
            </div>
          ))}
        </div>

        <section style={{ ...cardStyle, marginBottom: 18, border: "1px solid rgba(34,197,94,0.24)" }}>
          <p style={{ color: "#86efac", fontWeight: 900, margin: 0 }}>⚡ SOP Aman</p>
          <div className="ops-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12 }}>
            {[
              ["1", "User request upgrade", "Masuk sebagai pending di tabel."],
              ["2", "Klik WA User", "Kirim instruksi transfer/bukti bayar."],
              ["3", "Cek bukti bayar", "Verifikasi manual di WhatsApp/bank."],
              ["4", "Approve + WA", "User jadi PRO dan dapat notifikasi."],
            ].map(([num, title, desc]) => (
              <div key={num} style={{ padding: 15, borderRadius: 18, background: "rgba(2,6,23,0.62)", border: "1px solid rgba(148,163,184,0.14)" }}>
                <strong style={{ color: "#86efac" }}>
                  {num}. {title}
                </strong>
                <p style={{ color: "#94a3b8", marginBottom: 0, lineHeight: 1.55 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...cardStyle, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <p style={{ color: "#86efac", fontWeight: 900, margin: 0 }}>Payment Requests</p>
              <h2 style={{ margin: "6px 0" }}>Request upgrade terbaru</h2>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    ...buttonStyle,
                    background: statusFilter === status ? "linear-gradient(135deg, #22c55e, #14b8a6)" : "rgba(2,6,23,0.72)",
                    border: statusFilter === status ? "none" : "1px solid rgba(148,163,184,0.24)",
                  }}
                >
                  {status === "all" ? "Semua" : status}
                </button>
              ))}
            </div>
          </div>

{requests.length > 0 && (
  <div style={{
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    background: "rgba(2,6,23,0.72)",
    border: "1px solid rgba(34,197,94,0.24)",
    color: "#cbd5e1",
  }}>
    <strong style={{ color: "#86efac" }}>Pembeli terbaru:</strong>
    <div style={{ marginTop: 8 }}>
      {requests.slice(0, 3).map((item) => (
        <div key={item.id} style={{ marginBottom: 6 }}>
          📧 {item.email || "-"} &nbsp; | &nbsp;
          📱 {item.phone || "-"} &nbsp; | &nbsp;
          🧾 {item.status}
        </div>
      ))}
    </div>
  </div>
)}

          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari email, phone, user_id, plan, status..." style={{ ...inputStyle, marginTop: 14 }} />

          <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
            {filteredRequests.length === 0 && <p style={{ color: "#94a3b8" }}>Belum ada request pada filter ini.</p>}

            {filteredRequests.map((item) => {
              const pending = item.status === "pending";
              const approved = item.status === "approved";
              const busy = actionLoading === item.id;

              return (
                <div
                  key={item.id}
                  className="request-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.35fr 0.75fr 0.7fr 0.9fr auto",
                    gap: 12,
                    alignItems: "center",
                    padding: 15,
                    borderRadius: 16,
                    background: pending ? "rgba(69,26,3,0.28)" : "rgba(2,6,23,0.66)",
                    border: pending ? "1px solid rgba(245,158,11,0.24)" : "1px solid rgba(148,163,184,0.14)",
                  }}
                >
                  <div>
                    <strong>{item.email || "No email"}</strong>
                    <br />
                    <small style={{ color: "#94a3b8" }}>WA: {item.phone || "-"}</small>
                    <br />
                    <small style={{ color: "#64748b" }}>{item.user_id}</small>
                  </div>

                  <div>
                    <small style={{ color: "#94a3b8" }}>Plan</small>
                    <br />
                    <strong>{getPlanLabel(item.plan)}</strong>
                    <br />
                    <small style={{ color: "#86efac" }}>{getPlanPrice(item.plan)}</small>
                  </div>

                  <div>
                    <small style={{ color: "#94a3b8" }}>Status</small>
                    <br />
                    {statusBadge(item.status)}
                  </div>

                  <div>
                    <small style={{ color: "#94a3b8" }}>Tanggal</small>
                    <br />
                    <span>{formatDate(item.created_at)}</span>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {pending ? (
                      <>
                        <button onClick={() => approveAndWhatsApp(item, item.plan || "lifetime")} disabled={busy} style={{ ...buttonStyle, background: "linear-gradient(135deg, #22c55e, #14b8a6)", opacity: busy ? 0.55 : 1 }}>
                          {busy ? "..." : "Approve + WA"}
                        </button>

                        <button onClick={() => approveRequest(item, "monthly")} disabled={busy} style={{ ...buttonStyle, background: "#16a34a", opacity: busy ? 0.55 : 1 }}>
                          Bulanan
                        </button>

                        <button onClick={() => approveRequest(item, "lifetime")} disabled={busy} style={{ ...buttonStyle, background: "#0f766e", opacity: busy ? 0.55 : 1 }}>
                          Lifetime
                        </button>

                        <button onClick={() => followUpWhatsApp(item)} disabled={busy} style={{ ...buttonStyle, background: "#2563eb", opacity: busy ? 0.55 : 1 }}>
                          WA User
                        </button>

                        <button onClick={() => copyMessage(item)} disabled={busy} style={{ ...buttonStyle, background: "#334155", opacity: busy ? 0.55 : 1 }}>
                          {copiedId === item.id ? "Copied" : "Copy WA"}
                        </button>

                        <button onClick={() => rejectRequest(item)} disabled={busy} style={{ ...buttonStyle, background: "#7f1d1d", opacity: busy ? 0.55 : 1 }}>
                          Tolak
                        </button>
                      </>
                    ) : approved ? (
                      <>
                        <span style={{ color: "#86efac", fontWeight: 900, alignSelf: "center" }}>Sudah aktif</span>
                        <button onClick={() => followUpWhatsApp(item, true)} style={{ ...buttonStyle, background: "#0f766e" }}>
                          WA Aktif
                        </button>
                      </>
                    ) : (
                      <span style={{ color: "#fca5a5", fontWeight: 900 }}>Ditolak</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <p style={{ color: "#86efac", fontWeight: 900, margin: 0 }}>Profiles</p>
              <h2 style={{ margin: "6px 0" }}>Semua user, PRO aktif & expired</h2>
            </div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>
              Aktif: <b style={{ color: "#86efac" }}>{stats.activePro}</b> • Expired: <b style={{ color: "#fbbf24" }}>{stats.expiredPro}</b>
            </div>
          </div>

          <input value={profileSearch} onChange={(e) => setProfileSearch(e.target.value)} placeholder="Cari user berdasarkan email, user_id, role, atau plan..." style={{ ...inputStyle, marginTop: 14, marginBottom: 16 }} />

          <div style={{ display: "grid", gap: 10 }}>
            {filteredProfiles.length === 0 && <p style={{ color: "#94a3b8" }}>Belum ada user pada filter ini.</p>}

            {filteredProfiles.map((profile) => {
              const busy = actionLoading === profile.id;
              const expired = isExpiredPro(profile);
              const lifetime = profile.pro_until?.startsWith("2099");

              return (
                <div
                  key={profile.id}
                  className="profile-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.35fr 0.85fr 0.7fr auto",
                    gap: 12,
                    alignItems: "center",
                    padding: 15,
                    borderRadius: 16,
                    background: expired ? "rgba(69,26,3,0.28)" : "rgba(2,6,23,0.66)",
                    border: expired ? "1px solid rgba(245,158,11,0.24)" : "1px solid rgba(148,163,184,0.14)",
                  }}
                >
                  <div>
                    <strong>{profile.email || profile.id}</strong>
                    <br />
                    <small style={{ color: "#94a3b8" }}>Role: {profile.role || "user"} • Plan: {profile.plan || "free"}</small>
                    <br />
                    <small style={{ color: "#64748b" }}>{profile.id}</small>
                  </div>

                  <div>
                    <small style={{ color: "#94a3b8" }}>PRO sampai</small>
                    <br />
                    <span>{lifetime ? "Lifetime" : formatDate(profile.pro_until)}</span>
                  </div>

                  <div>
                    <small style={{ color: "#94a3b8" }}>Status</small>
                    <br />
                    <strong style={{ color: expired ? "#fbbf24" : "#86efac" }}>
                      {expired ? "Expired" : lifetime ? "Lifetime" : `Aktif s/d ${formatShortDate(profile.pro_until)}`}
                    </strong>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button onClick={() => extendPro(profile, 1)} disabled={busy} style={{ ...buttonStyle, background: "#16a34a", opacity: busy ? 0.55 : 1 }}>
                      +1 Bulan
                    </button>
                    <button onClick={() => makeLifetime(profile)} disabled={busy} style={{ ...buttonStyle, background: "#0f766e", opacity: busy ? 0.55 : 1 }}>
                      Lifetime
                    </button>
                    <button onClick={() => revokePro(profile)} disabled={busy} style={{ ...buttonStyle, background: "#7f1d1d", opacity: busy ? 0.55 : 1 }}>
                      Cabut PRO
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
