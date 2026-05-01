"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const db: any = supabase;

type PaymentStatus = "pending" | "approved" | "rejected";
type UpgradePlan = "monthly" | "lifetime";

type PaymentRequest = {
  id: string;
  user_id: string;
  email: string | null;
  plan: UpgradePlan;
  status: PaymentStatus;
  proof_url: string | null;
  created_at: string;
};

const ADMIN_EMAILS = ["alimafudfe@gmail.com"];

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID");
}

export default function AdminPage() {
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [filter, setFilter] = useState<PaymentStatus | "all">("pending");

  const filteredRequests = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((item) => item.status === filter);
  }, [requests, filter]);

  async function loadRequests() {
    const { data, error } = await db
      .from("payment_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Gagal mengambil payment requests. Pastikan policy admin sudah benar.");
      return;
    }

    setRequests((data || []) as PaymentRequest[]);
  }

  async function checkAdmin() {
    setPageLoading(true);

    const { data: userData, error } = await supabase.auth.getUser();

    if (error || !userData.user?.email) {
      setAdminEmail(null);
      setIsAllowed(false);
      setPageLoading(false);
      return;
    }

    const email = userData.user.email;
    const allowed = ADMIN_EMAILS.includes(email);

    setAdminEmail(email);
    setIsAllowed(allowed);

    if (allowed) {
      await loadRequests();
    }

    setPageLoading(false);
  }

  useEffect(() => {
    checkAdmin();
  }, []);

  async function approveRequest(request: PaymentRequest) {
    const confirmed = window.confirm(
      `Approve ${request.email || request.user_id} menjadi PRO ${request.plan}?`
    );

    if (!confirmed) return;

    setActionLoadingId(request.id);

    const proUntil =
      request.plan === "monthly"
        ? addDays(new Date(), 30).toISOString()
        : "2099-01-01T00:00:00.000Z";

    const profilePayload = {
      id: request.user_id,
      email: request.email ?? "",
      plan: "pro",
      pro_until: proUntil,
    } as any;

    const { error: profileError } = await db
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" });

    if (profileError) {
      console.error(profileError);
      alert("Gagal update profile jadi PRO.");
      setActionLoadingId(null);
      return;
    }

    const { error: requestError } = await db
      .from("payment_requests")
      .update({ status: "approved" } as any)
      .eq("id", request.id);

    if (requestError) {
      console.error(requestError);
      alert("PRO berhasil aktif, tapi status request gagal diupdate.");
      setActionLoadingId(null);
      await loadRequests();
      return;
    }

    alert("✅ User berhasil diaktifkan ke PRO.");
    await loadRequests();
    setActionLoadingId(null);
  }

  async function rejectRequest(request: PaymentRequest) {
    const confirmed = window.confirm(
      `Tolak request dari ${request.email || request.user_id}?`
    );

    if (!confirmed) return;

    setActionLoadingId(request.id);

    const { error } = await db
      .from("payment_requests")
      .update({ status: "rejected" } as any)
      .eq("id", request.id);

    if (error) {
      console.error(error);
      alert("Gagal menolak request.");
      setActionLoadingId(null);
      return;
    }

    alert("Request ditolak.");
    await loadRequests();
    setActionLoadingId(null);
  }

  const cardStyle: React.CSSProperties = {
    background: "rgba(15,23,42,0.94)",
    border: "1px solid #1f2937",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "10px 14px",
    border: "none",
    borderRadius: 10,
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  };

  if (pageLoading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#020617",
          color: "white",
          fontFamily: "Arial",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading admin...
      </main>
    );
  }

  if (!isAllowed) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#020617",
          color: "white",
          fontFamily: "Arial",
          padding: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ ...cardStyle, maxWidth: 520 }}>
          <h1>Admin Only</h1>
          <p style={{ opacity: 0.75 }}>
            Login kamu: {adminEmail || "belum login"}
          </p>
          <p style={{ color: "#fca5a5" }}>
            Akun ini belum punya akses dashboard admin.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #064e3b 0%, #020617 42%, #000 100%)",
        color: "white",
        fontFamily: "Arial",
        padding: 24,
      }}
    >
      <section style={{ maxWidth: 1100, margin: "0 auto", paddingTop: 35 }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ color: "#86efac", fontWeight: "bold" }}>
            Untungin.ai Admin
          </p>
          <h1 style={{ fontSize: 42, margin: 0 }}>
            Dashboard Aktivasi PRO
          </h1>
          <p style={{ opacity: 0.7 }}>
            Approve pembayaran manual, aktifkan PRO, dan pantau request upgrade.
          </p>
          <p style={{ opacity: 0.55, fontSize: 13 }}>
            Login sebagai: {adminEmail}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <div style={cardStyle}>
            <p style={{ opacity: 0.7, margin: 0 }}>Total Request</p>
            <h2>{requests.length}</h2>
          </div>
          <div style={cardStyle}>
            <p style={{ opacity: 0.7, margin: 0 }}>Pending</p>
            <h2 style={{ color: "#fbbf24" }}>
              {requests.filter((item) => item.status === "pending").length}
            </h2>
          </div>
          <div style={cardStyle}>
            <p style={{ opacity: 0.7, margin: 0 }}>Approved</p>
            <h2 style={{ color: "#86efac" }}>
              {requests.filter((item) => item.status === "approved").length}
            </h2>
          </div>
          <div style={cardStyle}>
            <p style={{ opacity: 0.7, margin: 0 }}>Rejected</p>
            <h2 style={{ color: "#fca5a5" }}>
              {requests.filter((item) => item.status === "rejected").length}
            </h2>
          </div>
        </div>

        <div
          style={{
            ...cardStyle,
            display: "flex",
            gap: 10,
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <strong>Filter request</strong>
            <p style={{ opacity: 0.6, fontSize: 13, marginBottom: 0 }}>
              Prioritaskan pending untuk aktivasi cepat.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(["pending", "approved", "rejected", "all"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  style={{
                    ...buttonStyle,
                    background: filter === status ? "#22c55e" : "#111827",
                    border: "1px solid #334155",
                  }}
                >
                  {status.toUpperCase()}
                </button>
              )
            )}

            <button
              onClick={loadRequests}
              style={{
                ...buttonStyle,
                background: "#0f172a",
                border: "1px solid #22c55e",
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          {filteredRequests.length === 0 && (
            <div style={cardStyle}>
              <p style={{ opacity: 0.7 }}>
                Belum ada request untuk filter ini.
              </p>
            </div>
          )}

          {filteredRequests.map((request) => (
            <div key={request.id} style={cardStyle}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 1fr 1fr",
                  gap: 14,
                  alignItems: "start",
                }}
              >
                <div>
                  <p style={{ margin: 0, opacity: 0.7 }}>User</p>
                  <h3 style={{ marginTop: 6 }}>
                    {request.email || request.user_id}
                  </h3>
                  <p style={{ opacity: 0.55, fontSize: 12 }}>
                    User ID: {request.user_id}
                  </p>
                </div>

                <div>
                  <p style={{ margin: 0, opacity: 0.7 }}>Plan</p>
                  <h3 style={{ marginTop: 6 }}>
                    {request.plan === "monthly"
                      ? "PRO Bulanan"
                      : "PRO Lifetime"}
                  </h3>
                  <p style={{ opacity: 0.55, fontSize: 12 }}>
                    Request: {formatDate(request.created_at)}
                  </p>
                </div>

                <div>
                  <p style={{ margin: 0, opacity: 0.7 }}>Status</p>
                  <h3
                    style={{
                      marginTop: 6,
                      color:
                        request.status === "approved"
                          ? "#86efac"
                          : request.status === "rejected"
                          ? "#fca5a5"
                          : "#fbbf24",
                    }}
                  >
                    {request.status.toUpperCase()}
                  </h3>
                </div>
              </div>

              {request.proof_url && (
                <p style={{ marginTop: 12 }}>
                  Bukti transfer:{" "}
                  <a
                    href={request.proof_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#86efac" }}
                  >
                    Buka bukti
                  </a>
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 16,
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => approveRequest(request)}
                  disabled={
                    actionLoadingId === request.id ||
                    request.status === "approved"
                  }
                  style={{
                    ...buttonStyle,
                    background:
                      request.status === "approved" ? "#166534" : "#22c55e",
                    opacity:
                      actionLoadingId === request.id ||
                      request.status === "approved"
                        ? 0.65
                        : 1,
                  }}
                >
                  {actionLoadingId === request.id
                    ? "Memproses..."
                    : request.status === "approved"
                    ? "Sudah Approved"
                    : "✅ Approve PRO"}
                </button>

                <button
                  onClick={() => rejectRequest(request)}
                  disabled={
                    actionLoadingId === request.id ||
                    request.status === "rejected"
                  }
                  style={{
                    ...buttonStyle,
                    background:
                      request.status === "rejected" ? "#7f1d1d" : "#991b1b",
                    opacity:
                      actionLoadingId === request.id ||
                      request.status === "rejected"
                        ? 0.65
                        : 1,
                  }}
                >
                  ❌ Reject
                </button>

                <button
                  onClick={() => {
                    const text =
                      "Halo, pembayaran Untungin.ai PRO kamu sedang kami cek. Mohon tunggu sebentar ya.";
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(text)}`,
                      "_blank"
                    );
                  }}
                  style={{
                    ...buttonStyle,
                    background: "#0f172a",
                    border: "1px solid #334155",
                  }}
                >
                  WhatsApp Template
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ ...cardStyle, marginTop: 24 }}>
          <h2>SQL policy admin yang disarankan</h2>
          <p style={{ opacity: 0.7 }}>
            Karena halaman admin membaca semua payment request, pastikan RLS
            Supabase mengizinkan admin email kamu melihat/update tabel ini.
          </p>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              background: "#020617",
              padding: 16,
              borderRadius: 12,
              border: "1px solid #1f2937",
              overflowX: "auto",
              fontSize: 13,
            }}
          >{`-- Jalankan di Supabase SQL Editor
-- Ganti email jika perlu

create policy "Admin can view all payment requests"
on public.payment_requests
for select
using (
  auth.jwt() ->> 'email' = 'alimafudfe@gmail.com'
);

create policy "Admin can update all payment requests"
on public.payment_requests
for update
using (
  auth.jwt() ->> 'email' = 'alimafudfe@gmail.com'
);

create policy "Admin can upsert profiles"
on public.profiles
for insert
with check (
  auth.jwt() ->> 'email' = 'alimafudfe@gmail.com'
);

create policy "Admin can update profiles"
on public.profiles
for update
using (
  auth.jwt() ->> 'email' = 'alimafudfe@gmail.com'
);`}</pre>
        </div>
      </section>
    </main>
  );
}
