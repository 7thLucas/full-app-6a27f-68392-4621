import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useSearchParams, Link } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { EventModel, EventStatus } from "~/models/event.model";
import { AppLayout } from "~/components/layout/AppLayout";
import { StatusBadge } from "~/components/shared/StatusBadge";
import { PageHeader } from "~/components/shared/PageHeader";
import { EmptyState } from "~/components/shared/EmptyState";
import { Modal } from "~/components/shared/Modal";
import { useState, useEffect } from "react";
import { CalendarDays, Plus, Search, Users, MapPin, DollarSign, Filter } from "lucide-react";
import { useConfigurables } from "~/modules/configurables";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "all";
  const search = url.searchParams.get("q") ?? "";

  const filter: Record<string, unknown> = { isDeleted: false };
  if (status !== "all") filter.status = status;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { clientName: { $regex: search, $options: "i" } },
      { venue: { $regex: search, $options: "i" } },
    ];
  }

  const events = await EventModel.find(filter).sort({ eventDate: 1 }).lean();

  return {
    events: events.map((e) => ({
      ...e,
      _id: e._id.toString(),
      eventDate: e.eventDate.toISOString(),
      endDate: e.endDate?.toISOString(),
      menuIds: e.menuIds.map((id) => id.toString()),
      staffAssignmentIds: e.staffAssignmentIds.map((id) => id.toString()),
      vendorAssignmentIds: e.vendorAssignmentIds.map((id) => id.toString()),
    })),
    status,
    search,
  };
}

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "confirmed", label: "Confirmed" },
  { value: "prep", label: "Prep" },
  { value: "day_of", label: "Day-of" },
  { value: "completed", label: "Completed" },
];

export default function EventsPage() {
  const { events, status, search } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [searchInput, setSearchInput] = useState(search);
  const { config } = useConfigurables();
  const currency = config?.currency ?? "$";

  // Check if ?new=true is in URL to auto-open modal
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowModal(true);
    }
  }, []);

  const handleStatusFilter = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput) {
      params.set("q", searchInput);
    } else {
      params.delete("q");
    }
    setSearchParams(params);
  };

  return (
    <AppLayout>
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <PageHeader
          title="Events"
          subtitle={`${events.length} event${events.length !== 1 ? "s" : ""} found`}
          actions={
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-[#1B5E47] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#16503d] transition-colors"
            >
              <Plus size={16} />
              Add event
            </button>
          }
        />

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Status filter pills */}
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleStatusFilter(value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  (status === value || (value === "all" && !status))
                    ? "bg-[#1B5E47] text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 ml-auto">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search events..."
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47] bg-white w-48"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
            >
              Search
            </button>
          </form>
        </div>

        {/* Events List */}
        {events.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No events found"
            description="Add your first catering event to get started."
            action={
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-[#1B5E47] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#16503d] transition-colors"
              >
                <Plus size={16} />
                Add event
              </button>
            }
          />
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <Link
                key={event._id}
                to={`/events/${event._id}`}
                className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 hover:shadow-md hover:border-gray-200 transition-all group"
              >
                {/* Date block */}
                <div className="flex-shrink-0 text-center w-14 bg-[#FAF7F0] rounded-lg py-2">
                  <div className="text-xs text-gray-400 font-medium uppercase">
                    {new Date(event.eventDate).toLocaleDateString("en-US", { month: "short" })}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 leading-none">
                    {new Date(event.eventDate).getDate()}
                  </div>
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 truncate">{event.title}</span>
                    <StatusBadge status={event.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {event.clientName}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {event.venue}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {event.headcount} guests
                    </span>
                  </div>
                </div>

                {/* Budget */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {currency}{event.budget.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">budget</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          // Remove ?new=true from URL
          const params = new URLSearchParams(searchParams);
          params.delete("new");
          setSearchParams(params);
        }}
        onSaved={() => {
          setShowModal(false);
          navigate("/events", { replace: true });
        }}
      />
    </AppLayout>
  );
}

// ── Add Event Modal ──────────────────────────────────────────────────────────
function AddEventModal({
  isOpen,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
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
      const res = await fetch("/api/events", {
        method: "POST",
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
      setError(err.message ?? "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Event" size="lg">
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
              placeholder="e.g. Smith Wedding Reception"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client name *</label>
            <input
              name="clientName"
              required
              placeholder="Full name"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client email</label>
            <input
              name="clientEmail"
              type="email"
              placeholder="client@email.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event date *</label>
            <input
              name="eventDate"
              type="datetime-local"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              defaultValue="confirmed"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47] bg-white"
            >
              <option value="confirmed">Confirmed</option>
              <option value="prep">Prep</option>
              <option value="day_of">Day-of</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue *</label>
            <input
              name="venue"
              required
              placeholder="Venue name and address"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guest count</label>
            <input
              name="headcount"
              type="number"
              min="0"
              defaultValue="0"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget ({currency})</label>
            <input
              name="budget"
              type="number"
              min="0"
              defaultValue="0"
              step="100"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Special requirements, dietary notes, etc."
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
            {loading ? "Creating..." : "Create event"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
