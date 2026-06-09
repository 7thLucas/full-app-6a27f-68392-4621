import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useSearchParams, Link } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { StaffMemberModel } from "~/models/staff.model";
import { StaffAssignmentModel } from "~/models/staff.model";
import { EventModel } from "~/models/event.model";
import { Types } from "mongoose";
import { AppLayout } from "~/components/layout/AppLayout";
import { PageHeader } from "~/components/shared/PageHeader";
import { EmptyState } from "~/components/shared/EmptyState";
import { Modal } from "~/components/shared/Modal";
import { StatusBadge } from "~/components/shared/StatusBadge";
import { useState, useEffect } from "react";
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, AlertTriangle, CalendarDays, Clock } from "lucide-react";
import { useConfigurables } from "~/modules/configurables";
import { cn } from "~/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");

  const url = new URL(request.url);
  const search = url.searchParams.get("q") ?? "";
  const role = url.searchParams.get("role") ?? "";

  const filter: Record<string, unknown> = { isDeleted: false };
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { role: { $regex: search, $options: "i" } },
    ];
  }

  const [staff, roles, allAssignments] = await Promise.all([
    StaffMemberModel.find(filter).sort({ name: 1 }).lean(),
    StaffMemberModel.distinct("role", { isDeleted: false }),
    StaffAssignmentModel.find({ isDeleted: false }).sort({ startTime: 1 }).lean(),
  ]);

  // Populate events for assignments
  const eventIds = [...new Set(allAssignments.map((a) => a.eventId.toString()))];
  const events = await EventModel.find({ _id: { $in: eventIds }, isDeleted: false }).lean();
  const eventMap = new Map(events.map((e) => [e._id.toString(), e]));

  // Detect conflicts: same staff member assigned to overlapping time windows
  const staffAssignmentsMap = new Map<string, typeof allAssignments>();
  for (const a of allAssignments) {
    const key = a.staffMemberId.toString();
    if (!staffAssignmentsMap.has(key)) staffAssignmentsMap.set(key, []);
    staffAssignmentsMap.get(key)!.push(a);
  }

  const conflictingAssignmentIds = new Set<string>();
  for (const [, memberAssignments] of staffAssignmentsMap) {
    for (let i = 0; i < memberAssignments.length; i++) {
      for (let j = i + 1; j < memberAssignments.length; j++) {
        const a = memberAssignments[i];
        const b = memberAssignments[j];
        if (a.startTime && a.endTime && b.startTime && b.endTime) {
          const aStart = new Date(a.startTime).getTime();
          const aEnd = new Date(a.endTime).getTime();
          const bStart = new Date(b.startTime).getTime();
          const bEnd = new Date(b.endTime).getTime();
          if (aStart < bEnd && bStart < aEnd) {
            conflictingAssignmentIds.add(a._id.toString());
            conflictingAssignmentIds.add(b._id.toString());
          }
        } else {
          // Same-event-date conflict detection (fallback when no times set)
          const ea = eventMap.get(a.eventId.toString());
          const eb = eventMap.get(b.eventId.toString());
          if (ea && eb) {
            const da = new Date(ea.eventDate).toDateString();
            const db = new Date(eb.eventDate).toDateString();
            if (da === db && a.eventId.toString() !== b.eventId.toString()) {
              conflictingAssignmentIds.add(a._id.toString());
              conflictingAssignmentIds.add(b._id.toString());
            }
          }
        }
      }
    }
  }

  return {
    staff: staff.map((s) => ({ ...s, _id: s._id.toString() })),
    roles: roles as string[],
    search,
    role,
    assignments: allAssignments.map((a) => {
      const ev = eventMap.get(a.eventId.toString());
      return {
        _id: a._id.toString(),
        staffMemberId: a.staffMemberId.toString(),
        eventId: a.eventId.toString(),
        role: a.role,
        startTime: a.startTime?.toISOString() ?? null,
        endTime: a.endTime?.toISOString() ?? null,
        hasConflict: conflictingAssignmentIds.has(a._id.toString()),
        event: ev ? {
          _id: ev._id.toString(),
          title: ev.title,
          eventDate: ev.eventDate.toISOString(),
          venue: ev.venue,
          status: ev.status,
        } : null,
      };
    }),
    totalConflicts: conflictingAssignmentIds.size,
  };
}

export default function StaffPage() {
  const { staff, roles, search: initialSearch, role: initialRole, assignments, totalConflicts } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState<any>(null);
  const [search, setSearch] = useState(initialSearch);
  const [activeTab, setActiveTab] = useState<"roster" | "assignments">("roster");

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowModal(true);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) params.set("q", search); else params.delete("q");
    setSearchParams(params);
  };

  const handleRoleFilter = (role: string) => {
    const params = new URLSearchParams(searchParams);
    if (role) params.set("role", role); else params.delete("role");
    setSearchParams(params);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this staff member?")) return;
    await fetch(`/api/staff/${id}`, { method: "DELETE" });
    navigate(".", { replace: true });
  };

  const handleRemoveAssignment = async (id: string) => {
    if (!confirm("Remove this assignment?")) return;
    await fetch(`/api/staff-assignments/${id}`, { method: "DELETE" });
    navigate(".", { replace: true });
  };

  // Group assignments by event
  const assignmentsByEvent = assignments.reduce<Record<string, typeof assignments>>((acc, a) => {
    const key = a.eventId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const staffMap = new Map(staff.map((s: any) => [s._id, s]));

  return (
    <AppLayout>
      <div className="px-6 py-6 max-w-5xl mx-auto">
        <PageHeader
          title="Staff"
          subtitle={`${staff.length} team member${staff.length !== 1 ? "s" : ""} · ${assignments.length} assignment${assignments.length !== 1 ? "s" : ""}`}
          actions={
            <button
              onClick={() => { setEditMember(null); setShowModal(true); }}
              className="flex items-center gap-2 bg-[#1B5E47] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#16503d] transition-colors"
            >
              <Plus size={16} />
              Add staff
            </button>
          }
        />

        {/* Conflict alert */}
        {totalConflicts > 0 && (
          <div className="mb-5 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {totalConflicts} scheduling conflict{totalConflicts !== 1 ? "s" : ""} detected
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Staff members are double-booked for overlapping time slots. Check the Assignments tab.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("assignments")}
              className="ml-auto text-xs font-medium text-amber-700 hover:text-amber-900 underline flex-shrink-0"
            >
              View conflicts →
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-gray-100">
          <button
            onClick={() => setActiveTab("roster")}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === "roster"
                ? "border-[#1B5E47] text-[#1B5E47]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            Roster ({staff.length})
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5",
              activeTab === "assignments"
                ? "border-[#1B5E47] text-[#1B5E47]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            Assignments ({assignments.length})
            {totalConflicts > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {totalConflicts}
              </span>
            )}
          </button>
        </div>

        {/* ROSTER TAB */}
        {activeTab === "roster" && (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => handleRoleFilter("")}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    !initialRole ? "bg-[#1B5E47] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  All roles
                </button>
                {roles.map((r: string) => (
                  <button
                    key={r}
                    onClick={() => handleRoleFilter(r)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      initialRole === r ? "bg-[#1B5E47] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSearch} className="flex gap-2 ml-auto">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search staff..."
                    className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47] bg-white w-48"
                  />
                </div>
                <button type="submit" className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                  Search
                </button>
              </form>
            </div>

            {staff.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No staff members"
                description="Add your team members to assign them to events."
                action={
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-[#1B5E47] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#16503d]"
                  >
                    <Plus size={16} />
                    Add staff member
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {staff.map((member: any) => {
                  const memberAssignments = assignments.filter((a: any) => a.staffMemberId === member._id);
                  const hasConflict = memberAssignments.some((a: any) => a.hasConflict);
                  return (
                    <div key={member._id} className={cn(
                      "bg-white rounded-xl border shadow-sm",
                      hasConflict ? "border-amber-200" : "border-gray-100"
                    )}>
                      <div className="flex items-start gap-3 p-4">
                        <div className="h-10 w-10 rounded-full bg-[#EAF2EE] flex items-center justify-center text-[#1B5E47] font-semibold text-sm flex-shrink-0">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-gray-900 text-sm">{member.name}</span>
                              {hasConflict && <AlertTriangle size={13} className="text-amber-500" aria-label="Scheduling conflict" />}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => { setEditMember(member); setShowModal(true); }}
                                className="p-1 text-gray-400 hover:text-gray-700 rounded"
                                title="Edit"
                              >
                                <Edit size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(member._id)}
                                className="p-1 text-gray-400 hover:text-red-600 rounded"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <span className="text-xs font-medium text-[#1B5E47] bg-emerald-50 rounded-full px-2 py-0.5 inline-block mt-0.5">
                            {member.role}
                          </span>
                          <div className="mt-2 space-y-0.5">
                            {member.email && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Mail size={11} />
                                {member.email}
                              </div>
                            )}
                            {member.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Phone size={11} />
                                {member.phone}
                              </div>
                            )}
                          </div>
                          {(member.skills as string[]).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(member.skills as string[]).map((skill: string) => (
                                <span key={skill} className="text-[10px] rounded bg-gray-100 text-gray-500 px-1.5 py-0.5">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="border-t border-gray-50 px-4 py-2 flex items-center justify-between">
                        <span className={`text-xs font-medium ${member.isActive ? "text-emerald-600" : "text-gray-400"}`}>
                          {member.isActive ? "Active" : "Inactive"}
                        </span>
                        {memberAssignments.length > 0 && (
                          <span className="text-xs text-gray-400">
                            {memberAssignments.length} event{memberAssignments.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ASSIGNMENTS TAB */}
        {activeTab === "assignments" && (
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No assignments yet"
                description="Assign staff to events from each event's detail page."
                action={
                  <Link to="/events" className="flex items-center gap-2 bg-[#1B5E47] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#16503d]">
                    Go to Events
                  </Link>
                }
              />
            ) : (
              Object.entries(assignmentsByEvent).map(([eventId, eventAssignments]) => {
                const ev = eventAssignments[0].event;
                if (!ev) return null;
                const eventConflicts = eventAssignments.filter((a: any) => a.hasConflict);
                return (
                  <div key={eventId} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <Link to={`/events/${ev._id}`} className="font-semibold text-gray-900 hover:text-[#1B5E47] text-sm">
                          {ev.title}
                        </Link>
                        <StatusBadge status={ev.status} />
                        {eventConflicts.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">
                            <AlertTriangle size={10} />
                            {eventConflicts.length} conflict{eventConflicts.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(ev.eventDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {eventAssignments.map((a: any) => {
                        const member = staffMap.get(a.staffMemberId) as any;
                        return (
                          <div
                            key={a._id}
                            className={cn(
                              "flex items-center gap-3 px-5 py-3",
                              a.hasConflict && "bg-amber-50"
                            )}
                          >
                            <div className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0",
                              a.hasConflict ? "bg-amber-100 text-amber-700" : "bg-[#EAF2EE] text-[#1B5E47]"
                            )}>
                              {member?.name?.charAt(0) ?? "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium text-gray-900">{member?.name ?? "Unknown"}</span>
                                {a.hasConflict && <AlertTriangle size={12} className="text-amber-500" />}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                <span>{a.role}</span>
                                {a.startTime && (
                                  <span className="flex items-center gap-1">
                                    <Clock size={10} />
                                    {new Date(a.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                    {a.endTime && ` – ${new Date(a.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`}
                                  </span>
                                )}
                              </div>
                              {a.hasConflict && (
                                <p className="text-xs text-amber-700 mt-0.5">⚠ Double-booked: time slot overlaps with another event</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveAssignment(a._id)}
                              className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                              title="Remove assignment"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <StaffModal
        isOpen={showModal}
        member={editMember}
        onClose={() => { setShowModal(false); setEditMember(null); }}
        onSaved={() => {
          setShowModal(false);
          setEditMember(null);
          navigate(".", { replace: true });
        }}
      />
    </AppLayout>
  );
}

function StaffModal({
  isOpen,
  member,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  member: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { config } = useConfigurables();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [skills, setSkills] = useState<string[]>(member?.skills ?? []);
  const [skillInput, setSkillInput] = useState("");

  const addSkill = () => {
    if (!skillInput.trim()) return;
    setSkills([...skills, skillInput.trim()]);
    setSkillInput("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const body = { ...data, skills, isActive: data.isActive === "on" };
      const url = member ? `/api/staff/${member._id}` : "/api/staff";
      const method = member ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onSaved();
    } catch (err: any) {
      setError(err.message ?? "Failed to save staff member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={member ? "Edit Staff Member" : "Add Staff Member"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full name *</label>
          <input
            name="name"
            required
            defaultValue={member?.name ?? ""}
            placeholder="e.g. Maria Santos"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
          <input
            name="role"
            required
            defaultValue={member?.role ?? ""}
            placeholder="e.g. Head Chef"
            list="staff-roles"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
          />
          <datalist id="staff-roles">
            {(config?.staffRoles ?? []).map((r) => <option key={r} value={r} />)}
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={member?.email ?? ""}
              placeholder="staff@email.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              name="phone"
              type="tel"
              defaultValue={member?.phone ?? ""}
              placeholder="555-0100"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
              placeholder="Add a skill and press Enter"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
            <button type="button" onClick={addSkill} className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {skills.map((s) => (
              <span
                key={s}
                onClick={() => setSkills(skills.filter((x) => x !== s))}
                className="text-xs rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 cursor-pointer hover:bg-blue-100"
              >
                {s} ×
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            rows={2}
            defaultValue={member?.notes ?? ""}
            placeholder="Additional notes..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47] resize-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isActive"
            name="isActive"
            type="checkbox"
            defaultChecked={member?.isActive !== false}
            className="accent-[#1B5E47]"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700">Active (available for assignment)</label>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="flex-1 bg-[#1B5E47] text-white rounded-lg py-2 text-sm font-medium hover:bg-[#16503d] disabled:opacity-60">
            {loading ? "Saving..." : member ? "Save changes" : "Add staff member"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
