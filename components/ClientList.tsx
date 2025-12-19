"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Mail, Search } from "lucide-react";

type Client = {
  email: string;
  name: string;
  phone: string;
  total_bookings: number;
  confirmed_bookings: number;
  visits: number;
  last_booking_at: string | null;
  last_visit_at: string | null;
  ever_deposit_paid: boolean;
  total_deposit_cents: number;
  marketing_email_opt_in: boolean;
  first_name: string | null;
  last_name: string | null;
  user_id: string | null;
};

type SortField = "name" | "visits" | "last_visit";

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      const res = await fetch("/api/admin/clients");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load clients");
      setClients(data || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }

  const filteredClients = useMemo(() => {
    let filtered = clients.filter((c) => {
      const searchLower = search.toLowerCase();
      return (
        c.name?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.phone?.toLowerCase().includes(searchLower)
      );
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "visits") {
        return b.visits - a.visits;
      } else if (sortBy === "last_visit") {
        const aDate = a.last_visit_at ? new Date(a.last_visit_at).getTime() : 0;
        const bDate = b.last_visit_at ? new Date(b.last_visit_at).getTime() : 0;
        return bDate - aDate;
      }
      // Default: alphabetical by name
      const aName = (a.last_name || a.name || a.email).toLowerCase();
      const bName = (b.last_name || b.name || b.email).toLowerCase();
      return aName.localeCompare(bName);
    });

    return filtered;
  }, [clients, search, sortBy]);

  async function sendPromo(client: Client) {
    const subject = prompt(`Subject for ${client.name || client.email}:`);
    if (!subject) return;

    const message = prompt("Message (plain text, will be formatted):");
    if (!message) return;

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2>Hi ${client.name || "there"},</h2>
        <p style="white-space:pre-wrap">${message}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="font-size:12px;color:#999">
          Rejuvenessence · 281 Parkwood Ave, Keswick, ON L4P 2X4
        </p>
      </div>
    `;

    const tId = toast.loading(`Sending to ${client.email}...`);
    try {
      const res = await fetch("/api/admin/promo-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: client.email, subject, html }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to send");

      toast.success(
        data.messageId ? `Sent! (${data.messageId})` : "Promo email sent!",
        { id: tId }
      );
    } catch (e: any) {
      toast.error(e.message || "Failed to send promo", { id: tId });
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-zinc-500">Loading clients...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-xl font-semibold">
          Clients ({filteredClients.length})
        </h2>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Sort buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSortBy("name")}
          className={`px-3 py-1.5 text-sm rounded-lg transition ${
            sortBy === "name"
              ? "bg-emerald-600 text-white"
              : "bg-zinc-100 hover:bg-zinc-200"
          }`}
        >
          Alphabetical
        </button>
        <button
          onClick={() => setSortBy("visits")}
          className={`px-3 py-1.5 text-sm rounded-lg transition ${
            sortBy === "visits"
              ? "bg-emerald-600 text-white"
              : "bg-zinc-100 hover:bg-zinc-200"
          }`}
        >
          By Visits
        </button>
        <button
          onClick={() => setSortBy("last_visit")}
          className={`px-3 py-1.5 text-sm rounded-lg transition ${
            sortBy === "last_visit"
              ? "bg-emerald-600 text-white"
              : "bg-zinc-100 hover:bg-zinc-200"
          }`}
        >
          Last Visit
        </button>
      </div>

      {/* Desktop: Table */}
      {!isMobile ? (
        <div className="overflow-x-auto bg-white rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Phone</th>
                <th className="px-4 py-3 text-center font-medium">Visits</th>
                <th className="px-4 py-3 text-left font-medium">Last Visit</th>
                <th className="px-4 py-3 text-center font-medium">Deposit</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.email} className="border-b hover:bg-zinc-50">
                  <td className="px-4 py-3">{client.name || "—"}</td>
                  <td className="px-4 py-3 text-zinc-600">{client.email}</td>
                  <td className="px-4 py-3 text-zinc-600">{client.phone || "—"}</td>
                  <td className="px-4 py-3 text-center">{client.visits}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {client.last_visit_at
                      ? new Date(client.last_visit_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        client.ever_deposit_paid
                          ? "bg-green-100 text-green-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {client.ever_deposit_paid ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => sendPromo(client)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition"
                    >
                      <Mail size={14} />
                      Promo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredClients.length === 0 && (
            <div className="text-center py-8 text-zinc-500">
              {search ? "No clients match your search" : "No clients found"}
            </div>
          )}
        </div>
      ) : (
        // Mobile: Cards
        <div className="space-y-3">
          {filteredClients.map((client) => (
            <motion.div
              key={client.email}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border rounded-lg p-4 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{client.name || "No name"}</h3>
                  <p className="text-sm text-zinc-600">{client.email}</p>
                  {client.phone && (
                    <p className="text-sm text-zinc-600">{client.phone}</p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                    client.ever_deposit_paid
                      ? "bg-green-100 text-green-700"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  Deposit: {client.ever_deposit_paid ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex gap-4 text-sm text-zinc-600">
                <span>Visits: {client.visits}</span>
                <span>
                  Last:{" "}
                  {client.last_visit_at
                    ? new Date(client.last_visit_at).toLocaleDateString()
                    : "Never"}
                </span>
              </div>

              <button
                onClick={() => sendPromo(client)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
              >
                <Mail size={16} />
                Send Promo Email
              </button>
            </motion.div>
          ))}

          {filteredClients.length === 0 && (
            <div className="text-center py-8 text-zinc-500">
              {search ? "No clients match your search" : "No clients found"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
