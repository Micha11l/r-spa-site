// components/ClassesManagement.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Send,
  Settings, 
  X, 
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";

type Participant = {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
};

type ClassSession = {
  class_type: string;
  class_date: string;
  start_time: string;
  end_time: string;
  participants: Participant[];
  count: number;
  capacity?: number;
};

export default function ClassesManagement() {
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassSession | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [newCapacity, setNewCapacity] = useState<number>(5);
  
  // 修复：设置默认日期为今天
  const [filterDate, setFilterDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    loadClasses();
  }, [filterDate, filterType]);

  async function loadClasses() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterDate) params.set("date", filterDate);
      if (filterType) params.set("type", filterType);

      // 简化：不需要token验证，因为admin页面已经有passcode保护
      const res = await fetch(`/api/classes/manage?${params}`, {
        headers: {
          Authorization: `Bearer dummy`, // 简单的标识即可
        },
      });

      if (!res.ok) throw new Error("Failed to load classes");

      const data = await res.json();
      setClasses(data.classes || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load classes");
    } finally {
      setLoading(false);
    }
  }

  async function sendReminders(classSession: ClassSession) {
    const loadingId = toast.loading("Sending reminders...");
    try {
      const emails = classSession.participants.map(p => p.email);
      
      if (emails.length === 0) {
        toast.error("No participants to send reminders to", { id: loadingId });
        return;
      }

      const res = await fetch("/api/classes/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer dummy`,
        },
        body: JSON.stringify({
          action: "send_reminder",
          class_type: classSession.class_type,
          class_date: classSession.class_date,
          start_time: classSession.start_time,
          end_time: classSession.end_time,
          emails,
        }),
      });

      if (!res.ok) throw new Error("Failed to send reminders");

      toast.success(`Reminders sent to ${emails.length} participant${emails.length !== 1 ? 's' : ''}!`, { id: loadingId });
    } catch (error: any) {
      toast.error(error.message || "Failed to send reminders", { id: loadingId });
    }
  }

  async function updateCapacity(classSession: ClassSession) {
    const loadingId = toast.loading("Updating capacity...");
    try {
      const res = await fetch("/api/classes/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer dummy`,
        },
        body: JSON.stringify({
          action: "update_capacity",
          class_type: classSession.class_type,
          class_date: classSession.class_date,
          start_time: classSession.start_time,
          end_time: classSession.end_time,
          capacity: newCapacity,
        }),
      });

      if (!res.ok) throw new Error("Failed to update capacity");

      toast.success("Capacity updated successfully!", { id: loadingId });
      setShowCapacityModal(false);
      loadClasses();
    } catch (error: any) {
      toast.error(error.message || "Failed to update capacity", { id: loadingId });
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(timeStr: string) {
    // 如果是 HH:MM:SS 格式，截取前5位
    return timeStr.slice(0, 5);
  }

  function getClassKey(c: ClassSession) {
    return `${c.class_type}_${c.class_date}_${c.start_time}_${c.end_time}`;
  }

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    },
    exit: { opacity: 0, scale: 0.9, y: 20 }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-4">Filter Classes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Class Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Classes</option>
              <option value="yoga">Yoga</option>
              <option value="pilates">Pilates</option>
              <option value="stretching">Stretching</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => {
            // 修复：清除过滤器时，日期重置为今天，而不是空字符串
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            setFilterDate(`${year}-${month}-${day}`);
            setFilterType("");
          }}
          className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          Reset Filters
        </button>
      </div>

      {/* Classes List */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-zinc-50">
          <h2 className="text-lg font-semibold">Manage Classes</h2>
          <p className="text-sm text-zinc-600 mt-1">
            {classes.length} class session{classes.length !== 1 ? "s" : ""} found
            {filterDate && ` for ${formatDate(filterDate)}`}
            {filterType && ` (${filterType})`}
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
            <p className="mt-2 text-sm text-zinc-600">Loading classes...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No classes found for selected filters</p>
            <button
              onClick={() => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                setFilterDate(`${year}-${month}-${day}`);
                setFilterType("");
              }}
              className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Show today's classes
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {classes.map((classSession) => {
              const key = getClassKey(classSession);
              const isExpanded = expandedClass === key;

              return (
                <motion.div
                  key={key}
                  initial={false}
                  className="hover:bg-zinc-50 transition-colors"
                >
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg capitalize">
                            {classSession.class_type}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            classSession.count >= (classSession.capacity || 5)
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}>
                            {classSession.count}/{classSession.capacity || 5}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-zinc-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(classSession.class_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(classSession.start_time)} - {formatTime(classSession.end_time)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {classSession.count} participant{classSession.count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedClass(classSession);
                            setShowParticipants(true);
                          }}
                          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                          <Users className="h-4 w-4" />
                          <span className="hidden sm:inline">View</span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => sendReminders(classSession)}
                          disabled={classSession.count === 0}
                          className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Send className="h-4 w-4" />
                          <span className="hidden sm:inline">Remind</span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedClass(classSession);
                            setNewCapacity(classSession.capacity || 5);
                            setShowCapacityModal(true);
                          }}
                          className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                        >
                          <Settings className="h-4 w-4" />
                          <span className="hidden sm:inline">Capacity</span>
                        </motion.button>

                        <button
                          onClick={() => setExpandedClass(isExpanded ? null : key)}
                          className="px-2 py-2 text-zinc-600 hover:bg-zinc-100 rounded-lg"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="text-sm font-semibold mb-2">Quick Preview:</h4>
                            <div className="space-y-1 text-sm text-zinc-600">
                              {classSession.participants.slice(0, 3).map((p) => (
                                <div key={p.id} className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                  <span>{p.full_name || p.email}</span>
                                </div>
                              ))}
                              {classSession.participants.length > 3 && (
                                <p className="text-xs text-zinc-500 ml-4">
                                  +{classSession.participants.length - 3} more...
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Participants Modal */}
      <AnimatePresence>
        {showParticipants && selectedClass && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowParticipants(false)}
            />

            <motion.div
              variants={modalVariants}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden z-10"
            >
              <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold capitalize">{selectedClass.class_type} Participants</h3>
                  <p className="text-sm text-zinc-600">
                    {formatDate(selectedClass.class_date)} • {formatTime(selectedClass.start_time)} - {formatTime(selectedClass.end_time)}
                  </p>
                </div>
                <button
                  onClick={() => setShowParticipants(false)}
                  className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
                {selectedClass.participants.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No participants yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedClass.participants.map((participant, idx) => (
                      <motion.div
                        key={participant.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 border rounded-lg hover:bg-zinc-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{participant.full_name || "Unknown"}</p>
                            <p className="text-sm text-zinc-600">{participant.email}</p>
                            <p className="text-xs text-zinc-500 mt-1">
                              Signed up: {new Date(participant.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span className="text-xs text-zinc-600">Confirmed</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-zinc-50 border-t p-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-zinc-600">
                    Total: {selectedClass.count} participant{selectedClass.count !== 1 ? "s" : ""}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      sendReminders(selectedClass);
                      setShowParticipants(false);
                    }}
                    disabled={selectedClass.count === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Send Reminders
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capacity Modal */}
      <AnimatePresence>
        {showCapacityModal && selectedClass && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowCapacityModal(false)}
            />

            <motion.div
              variants={modalVariants}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10"
            >
              <h3 className="text-lg font-semibold mb-4">Update Class Capacity</h3>
              
              <div className="mb-6">
                <div className="mb-4 p-3 bg-zinc-50 rounded-lg">
                  <p className="text-sm font-medium capitalize">{selectedClass.class_type}</p>
                  <p className="text-xs text-zinc-600 mt-1">
                    {formatDate(selectedClass.class_date)} • {formatTime(selectedClass.start_time)} - {formatTime(selectedClass.end_time)}
                  </p>
                  <p className="text-xs text-zinc-600 mt-2">
                    Current: {selectedClass.count} / {selectedClass.capacity || 5} participants
                  </p>
                </div>

                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  New Maximum Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {newCapacity < selectedClass.count && (
                  <p className="mt-2 text-sm text-amber-600">
                    ⚠️ Warning: New capacity is less than current participants
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCapacityModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-zinc-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateCapacity(selectedClass)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Update Capacity
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}