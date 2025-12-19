"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Mail, Search } from "lucide-react";
import ClientDetailDrawer from "./ClientDetailDrawer";

type Client = {
  email: string;
  name: string;
  phone: string;
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  pending_bookings: number;
  visits: number;
  last_booking_at: string | null;
  last_visit_at: string | null;
  next_booking_at: string | null;
  last_service_name: string | null;
  ever_deposit_paid: boolean;
  total_deposit_cents: number;
  marketing_email_opt_in: boolean;
  first_name: string | null;
  last_name: string | null;
  user_id: string | null;
};

type SortField = "name" | "visits" | "last_visit" | "next_booking";

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [isMobile, setIsMobile] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

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
      } else if (sortBy === "next_booking") {
        const aDate = a.next_booking_at ? new Date(a.next_booking_at).getTime() : Infinity;
        const bDate = b.next_booking_at ? new Date(b.next_booking_at).getTime() : Infinity;
        return aDate - bDate; // Ascending: soonest first
      }
      // Default: alphabetical by name
      const aName = (a.last_name || a.name || a.email).toLowerCase();
      const bName = (b.last_name || b.name || b.email).toLowerCase();
      return aName.localeCompare(bName);
    });

    return filtered;
  }, [clients, search, sortBy]);

  async function sendPromo(client: Client) {
    toast("Promo email feature coming soon!", {
      duration: 3000,
      icon: "ℹ️"
    });
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
        <button
          onClick={() => setSortBy("next_booking")}
          className={`px-3 py-1.5 text-sm rounded-lg transition ${
            sortBy === "next_booking"
              ? "bg-emerald-600 text-white"
              : "bg-zinc-100 hover:bg-zinc-200"
          }`}
        >
          Next Booking
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
                <th className="px-4 py-3 text-center font-medium text-xs">Pending</th>
                <th className="px-4 py-3 text-center font-medium text-xs">Cancelled</th>
                <th className="px-4 py-3 text-left font-medium">Next Booking</th>
                <th className="px-4 py-3 text-center font-medium">Deposit</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr
                  key={client.email}
                  onClick={() => setSelectedClient(client)}
                  className="border-b hover:bg-zinc-50 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div>
                      <div>{client.name || "—"}</div>
                      {client.last_service_name && (
                        <div className="text-xs text-zinc-500 mt-0.5">
                          Last: {client.last_service_name}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{client.email}</td>
                  <td className="px-4 py-3 text-zinc-600">{client.phone || "—"}</td>
                  <td className="px-4 py-3 text-center">{client.visits}</td>
                  <td className="px-4 py-3 text-center text-xs text-zinc-600">
                    {client.pending_bookings || 0}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-zinc-600">
                    {client.cancelled_bookings || 0}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 text-sm">
                    {client.next_booking_at
                      ? new Date(client.next_booking_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
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
                      onClick={(e) => {
                        e.stopPropagation();
                        sendPromo(client);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-300 text-zinc-600 rounded-lg text-xs font-medium cursor-not-allowed"
                      title="Coming soon"
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
              onClick={() => setSelectedClient(client)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border rounded-lg p-4 space-y-2 cursor-pointer hover:border-emerald-300 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{client.name || "No name"}</h3>
                  <p className="text-sm text-zinc-600">{client.email}</p>
                  {client.phone && (
                    <p className="text-sm text-zinc-600">{client.phone}</p>
                  )}
                  {client.last_service_name && (
                    <p className="text-xs text-zinc-500 mt-1">
                      Last: {client.last_service_name}
                    </p>
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

              <div className="flex flex-wrap gap-3 text-sm text-zinc-600">
                <span>Visits: {client.visits}</span>
                {client.pending_bookings > 0 && (
                  <span className="text-yellow-600">
                    Pending: {client.pending_bookings}
                  </span>
                )}
                {client.cancelled_bookings > 0 && (
                  <span className="text-zinc-400">
                    Cancelled: {client.cancelled_bookings}
                  </span>
                )}
              </div>

              {client.next_booking_at && (
                <div className="text-sm text-emerald-700 font-medium">
                  Next:{" "}
                  {new Date(client.next_booking_at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sendPromo(client);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-300 text-zinc-600 rounded-lg text-sm font-medium cursor-not-allowed"
                title="Coming soon"
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

      <ClientDetailDrawer
        open={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        client={selectedClient}
        isMobile={isMobile}
      />
    </div>
  );
}
