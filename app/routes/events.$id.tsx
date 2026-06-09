import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, Link } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { EventModel } from "~/models/event.model";
import { StaffMemberModel, StaffAssignmentModel } from "~/models/staff.model";
import { VendorModel, VendorAssignmentModel } from "~/models/vendor.model";
import { MenuModel } from "~/models/menu.model";
import { Types } from "mongoose";
import { AppLayout } from "~/components/layout/AppLayout";
import { StatusBadge } from "~/components/shared/StatusBadge";
import { Modal } from "~/components/shared/Modal";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  DollarSign,
  FileText,
  UtensilsCrossed,
  Truck,
  Edit,
  Trash2,
  Plus,
  UserCheck,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useConfigurables } from "~/modules/configurables";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");

  const { id } = params;
  if (!id) return redirect("/events");

  const event = await EventModel.findOne({ _id: id, isDeleted: false }).lean();
  if (!event) return redirect("/events");

  // Load associated data
  const [assignments, vendorAssignments, menus] = await Promise.all([
    StaffAssignmentModel.find({ eventId: new Types.ObjectId(id), isDeleted: false }).lean(),
    VendorAssignmentModel.find({ eventId: new Types.ObjectId(id), isDeleted: false }).lean(),
    MenuModel.find({ _id: { $in: event.menuIds }, isDeleted: false }).lean(),
  ]);

  const staffIds = assignments.map((a) => a.staffMemberId);
  const vendorIds = vendorAssignments.map((a) => a.vendorId);

  const [staffMembers, vendors] = await Promise.all([
    StaffMemberModel.find({ _id: { $in: staffIds }, isDeleted: false }).lean(),
    VendorModel.find({ _id: { $in: vendorIds }, isDeleted: false }).lean(),
  ]);

  const staffMap = new Map(staffMembers.map((s) => [s._id.toString(), s]));
  const vendorMap = new Map(vendors.map((v) => [v._id.toString(), v]));

  return {
    event: {
      ...event,
      _id: event._id.toString(),
      eventDate: event.eventDate.toISOString(),
      endDate: event.endDate?.toISOString(),
      menuIds: event.menuIds.map((id) => id.toString()),
      staffAssignmentIds: event.staffAssignmentIds.map((id) => id.toString()),
      vendorAssignmentIds: event.vendorAssignmentIds.map((id) => id.toString()),
    },
    staffAssignments: assignments.map((a) => ({
      ...a,
      _id: a._id.toString(),
      eventId: a.eventId.toString(),
      staffMemberId: a.staffMemberId.toString(),
      startTime: a.startTime?.toISOString(),
      endTime: a.endTime?.toISOString(),
      member: staffMap.get(a.staffMemberId.toString()) ? {
        ...staffMap.get(a.staffMemberId.toString()),
        _id: staffMap.get(a.staffMemberId.toString())!._id.toString(),
      } : null,
    })),
    vendorAssignments: vendorAssignments.map((a) => ({
      ...a,
      _id: a._id.toString(),
      eventId: a.eventId.toString(),
      vendorId: a.vendorId.toString(),
      onSiteStart: a.onSiteStart?.toISOString(),
      onSiteEnd: a.onSiteEnd?.toISOString(),
      vendor: vendorMap.get(a.vendorId.toString()) ? {
        ...vendorMap.get(a.vendorId.toString()),
        _id: vendorMap.get(a.vendorId.toString())!._id.toString(),
      } : null,
    })),
    menus: menus.map((m) => ({
      ...m,
      _id: m._id.toString(),
    })),
  };
}

export default function EventDetailPage() {
  const { event, staffAssignments, vendorAssignments, menus } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignStaffModal, setShowAssignStaffModal] = useState(false);
  const [showAssignVendorModal, setShowAssignVendorModal] = useState(false);
  const { config } = useConfigurables();
  const currency = config?.currency ?? "$";

  const handleDelete = async () => {
    if (!confirm("Delete this event? This action cannot be undone.")) return;
    await fetch(`/api/events/${event._id}`, { method: "DELETE" });
    navigate("/events");
  };

  const handleRemoveStaff = async (assignmentId: string) => {
    await fetch(`/api/staff-assignments/${assignmentId}`, { method: "DELETE" });
    navigate(".", { replace: true });
  };

  const handleRemoveVendor = async (assignmentId: string) => {
    await fetch(`/api/vendor-assignments/${assignmentId}`, { method: "DELETE" });
    navigate(".", { replace: true });
  };

  return (
    <AppLayout>
      <div className="px-6 py-6 max-w-6xl mx-auto">
        {/* Back nav */}
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5"
        >
          <ArrowLeft size={14} />
          Back to events
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
              <StatusBadge status={event.status} />
            </div>
            <p className="text-sm text-gray-500">{event.clientName}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              <Edit size={14} />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 border border-red-200 text-red-600 rounded-lg px-3 py-2 text-sm hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Event details */}
          <div className="lg:col-span-2 space-y-5">
            {/* Event info card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Event Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow
                  icon={CalendarDays}
                  label="Date"
                  value={new Date(event.eventDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                />
                <InfoRow
                  icon={MapPin}
                  label="Venue"
                  value={event.venue}
                />
                <InfoRow
                  icon={Users}
                  label="Guest count"
                  value={`${event.headcount} guests`}
                />
                <InfoRow
                  icon={DollarSign}
                  label="Budget"
                  value={`${currency}${event.budget.toLocaleString()}`}
                />
                {event.clientEmail && (
                  <InfoRow
                    icon={FileText}
                    label="Client email"
                    value={event.clientEmail}
                  />
                )}
              </div>
              {event.notes && (
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <p className="text-xs font-medium text-gray-400 mb-1">Notes</p>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{event.notes}</p>
                </div>
              )}
            </div>

            {/* Menus */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <UtensilsCrossed size={16} className="text-[#C9932A]" />
                  Menus
                </h2>
                <Link
                  to="/menus"
                  className="text-xs text-[#1B5E47] font-medium hover:underline"
                >
                  Manage menus
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {menus.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">
                    No menus assigned to this event
                  </div>
                ) : (
                  menus.map((menu) => (
                    <div key={menu._id} className="px-5 py-3.5">
                      <div className="font-medium text-sm text-gray-900">{menu.name}</div>
                      {menu.description && (
                        <div className="text-xs text-gray-500 mt-0.5">{menu.description}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {(menu.dishes as any[]).length} dish{(menu.dishes as any[]).length !== 1 ? "es" : ""}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Staff assignments */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users size={16} className="text-blue-500" />
                  Staff ({staffAssignments.length})
                </h2>
                <button
                  onClick={() => setShowAssignStaffModal(true)}
                  className="flex items-center gap-1 text-xs text-[#1B5E47] font-medium hover:underline"
                >
                  <Plus size={12} />
                  Assign staff
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {staffAssignments.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">
                    No staff assigned yet
                  </div>
                ) : (
                  staffAssignments.map((assignment) => (
                    <div key={assignment._id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-semibold flex-shrink-0">
                        {assignment.member?.name?.charAt(0) ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {assignment.member?.name ?? "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500">{assignment.role}</div>
                      </div>
                      <button
                        onClick={() => handleRemoveStaff(assignment._id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Vendors */}
          <div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Truck size={16} className="text-purple-500" />
                  Vendors ({vendorAssignments.length})
                </h2>
                <button
                  onClick={() => setShowAssignVendorModal(true)}
                  className="flex items-center gap-1 text-xs text-[#1B5E47] font-medium hover:underline"
                >
                  <Plus size={12} />
                  Add vendor
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {vendorAssignments.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">
                    No vendors assigned yet
                  </div>
                ) : (
                  vendorAssignments.map((assignment) => (
                    <div key={assignment._id} className="flex items-start gap-3 px-5 py-3.5">
                      <div className="h-7 w-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0 mt-0.5">
                        <Truck size={13} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {assignment.vendor?.name ?? "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500">{assignment.vendor?.category}</div>
                        {assignment.requiredRole && (
                          <div className="text-xs text-gray-400 mt-0.5">Role: {assignment.requiredRole}</div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveVendor(assignment._id)}
                        className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditEventModal
        event={event}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSaved={() => {
          setShowEditModal(false);
          navigate(".", { replace: true });
        }}
      />

      {/* Assign Staff Modal */}
      <AssignStaffModal
        eventId={event._id}
        isOpen={showAssignStaffModal}
        onClose={() => setShowAssignStaffModal(false)}
        onSaved={() => {
          setShowAssignStaffModal(false);
          navigate(".", { replace: true });
        }}
      />

      {/* Assign Vendor Modal */}
      <AssignVendorModal
        eventId={event._id}
        isOpen={showAssignVendorModal}
        onClose={() => setShowAssignVendorModal(false)}
        onSaved={() => {
          setShowAssignVendorModal(false);
          navigate(".", { replace: true });
        }}
      />
    </AppLayout>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex-shrink-0">
        <Icon size={15} className="text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function EditEventModal({ event, isOpen, onClose, onSaved }: { event: any; isOpen: boolean; onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { config } = useConfigurables();
  const currency = config?.currency ?? "$";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch(`/api/events/${event._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          headcount: Number(data.headcount) || 0,
          budget: Number(data.budget) || 0,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onSaved();
    } catch (err: any) {
      setError(err.message ?? "Failed to update event");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const defaultDate = event.eventDate
    ? new Date(event.eventDate).toISOString().slice(0, 16)
    : "";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Event" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Event title *</label>
            <input
              name="title"
              required
              defaultValue={event.title}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client name *</label>
            <input
              name="clientName"
              required
              defaultValue={event.clientName}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client email</label>
            <input
              name="clientEmail"
              type="email"
              defaultValue={event.clientEmail ?? ""}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event date *</label>
            <input
              name="eventDate"
              type="datetime-local"
              required
              defaultValue={defaultDate}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              defaultValue={event.status}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47] bg-white"
            >
              <option value="confirmed">Confirmed</option>
              <option value="prep">Prep</option>
              <option value="day_of">Day-of</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue *</label>
            <input
              name="venue"
              required
              defaultValue={event.venue}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guest count</label>
            <input
              name="headcount"
              type="number"
              min="0"
              defaultValue={event.headcount}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget ({currency})</label>
            <input
              name="budget"
              type="number"
              min="0"
              defaultValue={event.budget}
              step="100"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={3}
              defaultValue={event.notes ?? ""}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47] resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#1B5E47] text-white rounded-lg py-2 text-sm font-medium hover:bg-[#16503d] transition-colors disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AssignStaffModal({
  eventId,
  isOpen,
  onClose,
  onSaved,
}: {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [conflictWarning, setConflictWarning] = useState(false);
  const { config } = useConfigurables();

  useEffect(() => {
    if (isOpen) {
      fetch("/api/staff")
        .then((r) => r.json())
        .then((d) => setStaff(d.data ?? []));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setConflictWarning(false);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/staff-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, eventId }),
      });
      const json = await res.json();
      if (!json.success) {
        if (json.conflict) {
          setConflictWarning(true);
          setError(json.error);
        } else {
          throw new Error(json.error);
        }
        return;
      }
      onSaved();
    } catch (err: any) {
      setError(err.message ?? "Failed to assign staff");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Staff Member" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className={`rounded-lg border px-4 py-3 text-sm ${conflictWarning ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-red-50 border-red-100 text-red-700"}`}>
            {conflictWarning && <AlertTriangle size={14} className="inline mr-1.5" />}
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Staff member *</label>
          <select
            name="staffMemberId"
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47] bg-white"
          >
            <option value="">Select staff member</option>
            {staff.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} — {s.role}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role for this event *</label>
          <input
            name="role"
            required
            placeholder="e.g. Head Chef, Server"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            list="roles-list"
          />
          <datalist id="roles-list">
            {(config?.staffRoles ?? []).map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
            <input
              name="startTime"
              type="datetime-local"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End time</label>
            <input
              name="endTime"
              type="datetime-local"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#1B5E47] text-white rounded-lg py-2 text-sm font-medium hover:bg-[#16503d] disabled:opacity-60"
          >
            {loading ? "Assigning..." : "Assign staff"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AssignVendorModal({
  eventId,
  isOpen,
  onClose,
  onSaved,
}: {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetch("/api/vendors")
        .then((r) => r.json())
        .then((d) => setVendors(d.data ?? []));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const payload: Record<string, unknown> = {
        eventId,
        vendorId: data.vendorId,
        requiredRole: data.requiredRole || undefined,
        notes: data.notes || undefined,
        leadTimeDays: data.leadTimeDays ? Number(data.leadTimeDays) : undefined,
        setupWindowStart: data.setupWindowStart || undefined,
        setupWindowEnd: data.setupWindowEnd || undefined,
        onSiteStart: data.onSiteStart || undefined,
      };
      const res = await fetch("/api/vendor-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onSaved();
    } catch (err: any) {
      setError(err.message ?? "Failed to assign vendor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Vendor to Event" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
          <select
            name="vendorId"
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47] bg-white"
          >
            <option value="">Select vendor</option>
            {vendors.map((v) => (
              <option key={v._id} value={v._id}>
                {v.name} — {v.category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Required role</label>
          <input
            name="requiredRole"
            placeholder="e.g. Florist, AV Setup"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
          />
        </div>

        <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
            <Clock size={12} />
            Time Frames
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Lead time (days)</label>
              <input
                name="leadTimeDays"
                type="number"
                min="0"
                defaultValue="7"
                placeholder="7"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47] bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Setup window start</label>
              <input
                name="setupWindowStart"
                type="datetime-local"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47] bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Setup window end</label>
              <input
                name="setupWindowEnd"
                type="datetime-local"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47] bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">On-site start</label>
              <input
                name="onSiteStart"
                type="datetime-local"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47] bg-white"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            rows={2}
            placeholder="Setup requirements, special instructions..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47] resize-none"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#1B5E47] text-white rounded-lg py-2 text-sm font-medium hover:bg-[#16503d] disabled:opacity-60"
          >
            {loading ? "Adding..." : "Add vendor"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
