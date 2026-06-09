import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { EventModel, EventStatus } from "~/models/event.model";
import { StaffMemberModel } from "~/models/staff.model";
import { VendorModel } from "~/models/vendor.model";
import { MenuModel } from "~/models/menu.model";
import { AppLayout } from "~/components/layout/AppLayout";
import { StatusBadge } from "~/components/shared/StatusBadge";
import { Link } from "react-router";
import { CalendarDays, Users, Truck, UtensilsCrossed, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";
import { useConfigurables } from "~/modules/configurables";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");

  const [
    totalEvents,
    confirmedCount,
    prepCount,
    dayOfCount,
    completedCount,
    totalStaff,
    totalVendors,
    totalMenus,
    upcomingEvents,
  ] = await Promise.all([
    EventModel.countDocuments({ isDeleted: false }),
    EventModel.countDocuments({ isDeleted: false, status: EventStatus.Confirmed }),
    EventModel.countDocuments({ isDeleted: false, status: EventStatus.Prep }),
    EventModel.countDocuments({ isDeleted: false, status: EventStatus.DayOf }),
    EventModel.countDocuments({ isDeleted: false, status: EventStatus.Completed }),
    StaffMemberModel.countDocuments({ isDeleted: false, isActive: true }),
    VendorModel.countDocuments({ isDeleted: false, isActive: true }),
    MenuModel.countDocuments({ isDeleted: false }),
    EventModel.find({
      isDeleted: false,
      eventDate: { $gte: new Date() },
      status: { $ne: EventStatus.Cancelled },
    })
      .sort({ eventDate: 1 })
      .limit(6)
      .lean()
      .then((events) =>
        events.map((e) => ({
          ...e,
          _id: e._id.toString(),
          eventDate: e.eventDate.toISOString(),
          menuIds: e.menuIds.map((id) => id.toString()),
          staffAssignmentIds: e.staffAssignmentIds.map((id) => id.toString()),
          vendorAssignmentIds: e.vendorAssignmentIds.map((id) => id.toString()),
        }))
      ),
  ]);

  return {
    user,
    stats: {
      totalEvents,
      confirmedCount,
      prepCount,
      dayOfCount,
      completedCount,
      totalStaff,
      totalVendors,
      totalMenus,
    },
    upcomingEvents,
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function daysUntil(dateStr: string) {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return "Past";
  return `In ${diff} days`;
}

export default function DashboardPage() {
  const { stats, upcomingEvents, user } = useLoaderData<typeof loader>();
  const { config } = useConfigurables();

  const showBanner = config?.showWelcomeBanner !== false;
  const currency = config?.currency ?? "$";

  const statCards = [
    {
      label: "Active Events",
      value: stats.totalEvents,
      sub: `${stats.confirmedCount} confirmed`,
      icon: CalendarDays,
      href: "/events",
      color: "text-[#1B5E47]",
      bg: "bg-emerald-50",
    },
    {
      label: "Staff Members",
      value: stats.totalStaff,
      sub: "Active & available",
      icon: Users,
      href: "/staff",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Vendors",
      value: stats.totalVendors,
      sub: "Registered suppliers",
      icon: Truck,
      href: "/vendors",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Menus",
      value: stats.totalMenus,
      sub: "Reusable templates",
      icon: UtensilsCrossed,
      href: "/menus",
      color: "text-[#C9932A]",
      bg: "bg-amber-50",
    },
  ];

  const statusSummary = [
    { label: config?.eventStatusLabels?.confirmed ?? "Confirmed", count: stats.confirmedCount, color: "bg-emerald-500" },
    { label: config?.eventStatusLabels?.prep ?? "Prep", count: stats.prepCount, color: "bg-amber-500" },
    { label: config?.eventStatusLabels?.dayOf ?? "Day-of", count: stats.dayOfCount, color: "bg-yellow-500" },
    { label: config?.eventStatusLabels?.completed ?? "Completed", count: stats.completedCount, color: "bg-gray-400" },
  ];

  return (
    <AppLayout>
      <div className="px-6 py-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        {showBanner && (
          <div className="mb-6 rounded-xl bg-[#1B5E47] text-white px-6 py-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Welcome back, {user.username}</h2>
              <p className="text-sm text-white/70 mt-0.5">
                {stats.dayOfCount > 0
                  ? `You have ${stats.dayOfCount} event${stats.dayOfCount > 1 ? "s" : ""} happening today.`
                  : stats.prepCount > 0
                  ? `${stats.prepCount} event${stats.prepCount > 1 ? "s" : ""} in preparation.`
                  : "Everything is on track. No events today."}
              </p>
            </div>
            {stats.dayOfCount > 0 && (
              <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2 text-sm font-medium">
                <AlertCircle size={16} />
                <span>Day-of events active</span>
              </div>
            )}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map(({ label, value, sub, icon: Icon, href, color, bg }) => (
            <Link
              key={label}
              to={href}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
                  <Icon size={20} className={color} />
                </div>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors mt-1" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-sm font-medium text-gray-700 mt-0.5">{label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h3 className="font-semibold text-gray-900">Upcoming Events</h3>
              <Link
                to="/events"
                className="text-sm text-[#1B5E47] font-medium hover:underline flex items-center gap-1"
              >
                View all <ArrowRight size={13} />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {upcomingEvents.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  No upcoming events
                </div>
              ) : (
                upcomingEvents.map((event) => (
                  <Link
                    key={event._id}
                    to={`/events/${event._id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0 text-center w-12">
                      <div className="text-xs text-gray-400 font-medium">
                        {new Date(event.eventDate).toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
                      </div>
                      <div className="text-xl font-bold text-gray-900 leading-none">
                        {new Date(event.eventDate).getDate()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{event.title}</div>
                      <div className="text-xs text-gray-500 truncate">{event.clientName} · {event.venue}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-gray-400">{daysUntil(event.eventDate)}</span>
                      <StatusBadge status={event.status} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Event Status Summary */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-50">
              <h3 className="font-semibold text-gray-900">Event Pipeline</h3>
              <p className="text-xs text-gray-400 mt-0.5">Status distribution</p>
            </div>
            <div className="px-5 py-4 space-y-4">
              {statusSummary.map(({ label, count, color }) => {
                const pct = stats.totalEvents > 0 ? Math.round((count / stats.totalEvents) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-600">{label}</span>
                      <span className="text-sm font-semibold text-gray-900">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total events</span>
                  <span className="text-sm font-bold text-gray-900">{stats.totalEvents}</span>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="px-5 pb-5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Quick actions</p>
              <div className="space-y-1.5">
                <Link
                  to="/events?new=true"
                  className="flex items-center gap-2 w-full rounded-lg bg-[#1B5E47] text-white px-3 py-2 text-sm font-medium hover:bg-[#16503d] transition-colors"
                >
                  <CalendarDays size={15} />
                  Add new event
                </Link>
                <Link
                  to="/staff?new=true"
                  className="flex items-center gap-2 w-full rounded-lg bg-gray-50 text-gray-700 px-3 py-2 text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  <Users size={15} />
                  Add staff member
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
