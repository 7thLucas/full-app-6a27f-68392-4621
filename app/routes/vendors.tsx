import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { VendorModel } from "~/models/vendor.model";
import { AppLayout } from "~/components/layout/AppLayout";
import { PageHeader } from "~/components/shared/PageHeader";
import { EmptyState } from "~/components/shared/EmptyState";
import { Modal } from "~/components/shared/Modal";
import { useState, useEffect } from "react";
import { Truck, Plus, Search, Edit, Trash2, Phone, Mail, Globe, ExternalLink, Tag } from "lucide-react";
import { useConfigurables } from "~/modules/configurables";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");

  const url = new URL(request.url);
  const search = url.searchParams.get("q") ?? "";
  const category = url.searchParams.get("category") ?? "";

  const filter: Record<string, unknown> = { isDeleted: false };
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { contactName: { $regex: search, $options: "i" } },
    ];
  }

  const [vendors, categories] = await Promise.all([
    VendorModel.find(filter).sort({ name: 1 }).lean(),
    VendorModel.distinct("category", { isDeleted: false }),
  ]);

  return {
    vendors: vendors.map((v) => ({ ...v, _id: v._id.toString() })),
    categories: categories as string[],
    search,
    category,
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  "Florist": "bg-pink-50 text-pink-700",
  "Linen & Decor": "bg-violet-50 text-violet-700",
  "AV & Equipment": "bg-blue-50 text-blue-700",
  "Catering Supplies": "bg-amber-50 text-amber-700",
  "Transport": "bg-cyan-50 text-cyan-700",
  "Photography": "bg-orange-50 text-orange-700",
  "Entertainment": "bg-purple-50 text-purple-700",
  "Other": "bg-gray-100 text-gray-600",
};

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? "bg-gray-100 text-gray-600";
}

export default function VendorsPage() {
  const { vendors, categories, search: initialSearch, category: initialCategory } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [editVendor, setEditVendor] = useState<any>(null);
  const [search, setSearch] = useState(initialSearch);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) params.set("q", search); else params.delete("q");
    setSearchParams(params);
  };

  const handleCategoryFilter = (cat: string) => {
    const params = new URLSearchParams(searchParams);
    if (cat) params.set("category", cat); else params.delete("category");
    setSearchParams(params);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this vendor?")) return;
    await fetch(`/api/vendors/${id}`, { method: "DELETE" });
    navigate(".", { replace: true });
  };

  // Group vendors by category
  const grouped = vendors.reduce<Record<string, typeof vendors>>((acc, v) => {
    const cat = v.category ?? "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(v);
    return acc;
  }, {});

  return (
    <AppLayout>
      <div className="px-6 py-6 max-w-5xl mx-auto">
        <PageHeader
          title="Vendors"
          subtitle={`${vendors.length} vendor${vendors.length !== 1 ? "s" : ""} registered`}
          actions={
            <button
              onClick={() => { setEditVendor(null); setShowModal(true); }}
              className="flex items-center gap-2 bg-[#1B5E47] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#16503d] transition-colors"
            >
              <Plus size={16} />
              Add vendor
            </button>
          }
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => handleCategoryFilter("")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                !initialCategory ? "bg-[#1B5E47] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              All categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryFilter(cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  initialCategory === cat ? "bg-[#1B5E47] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {cat}
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
                placeholder="Search vendors..."
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47] bg-white w-48"
              />
            </div>
            <button type="submit" className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
              Search
            </button>
          </form>
        </div>

        {vendors.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No vendors yet"
            description="Add suppliers and vendors to assign to your events."
            action={
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-[#1B5E47] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#16503d]"
              >
                <Plus size={16} />
                Add vendor
              </button>
            }
          />
        ) : initialCategory ? (
          // Flat list when category filter is active
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {vendors.map((vendor) => (
              <VendorCard
                key={vendor._id}
                vendor={vendor}
                onEdit={() => { setEditVendor(vendor); setShowModal(true); }}
                onDelete={() => handleDelete(vendor._id)}
              />
            ))}
          </div>
        ) : (
          // Grouped by category
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, categoryVendors]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${getCategoryColor(category)}`}>
                    {category}
                  </span>
                  <span className="text-xs text-gray-400">{categoryVendors.length} vendor{categoryVendors.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categoryVendors.map((vendor) => (
                    <VendorCard
                      key={vendor._id}
                      vendor={vendor}
                      onEdit={() => { setEditVendor(vendor); setShowModal(true); }}
                      onDelete={() => handleDelete(vendor._id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <VendorModal
        isOpen={showModal}
        vendor={editVendor}
        onClose={() => { setShowModal(false); setEditVendor(null); }}
        onSaved={() => {
          setShowModal(false);
          setEditVendor(null);
          navigate(".", { replace: true });
        }}
      />
    </AppLayout>
  );
}

function VendorCard({ vendor, onEdit, onDelete }: { vendor: any; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-sm">{vendor.name}</div>
          {vendor.company && vendor.company !== vendor.name && (
            <div className="text-xs text-gray-500">{vendor.company}</div>
          )}
        </div>
        <div className="flex gap-1 ml-2">
          <button onClick={onEdit} className="p-1 text-gray-400 hover:text-gray-700 rounded" title="Edit">
            <Edit size={13} />
          </button>
          <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-600 rounded" title="Delete">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="space-y-1 mt-2">
        {vendor.contactName && (
          <div className="text-xs text-gray-500">Contact: {vendor.contactName}</div>
        )}
        {vendor.email && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Mail size={11} />
            {vendor.email}
          </div>
        )}
        {vendor.phone && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Phone size={11} />
            {vendor.phone}
          </div>
        )}
        {vendor.website && (
          <a href={vendor.website} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#1B5E47] hover:underline">
            <Globe size={11} />
            Website
          </a>
        )}
      </div>

      {vendor.notes && (
        <div className="mt-2 pt-2 border-t border-gray-50 text-xs text-gray-400 line-clamp-2">
          {vendor.notes}
        </div>
      )}
    </div>
  );
}

function VendorModal({
  isOpen,
  vendor,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  vendor: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { config } = useConfigurables();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));

    try {
      const url = vendor ? `/api/vendors/${vendor._id}` : "/api/vendors";
      const method = vendor ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, isActive: data.isActive === "on" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onSaved();
    } catch (err: any) {
      setError(err.message ?? "Failed to save vendor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={vendor ? "Edit Vendor" : "Add Vendor"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor name *</label>
            <input
              name="name"
              required
              defaultValue={vendor?.name ?? ""}
              placeholder="e.g. Bloom & Petal"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
            <input
              name="company"
              defaultValue={vendor?.company ?? ""}
              placeholder="Company (optional)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            name="category"
            required
            defaultValue={vendor?.category ?? ""}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47] bg-white"
          >
            <option value="">Select category</option>
            {(config?.vendorCategories ?? []).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact person</label>
          <input
            name="contactName"
            defaultValue={vendor?.contactName ?? ""}
            placeholder="Full name"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={vendor?.email ?? ""}
              placeholder="vendor@email.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              name="phone"
              type="tel"
              defaultValue={vendor?.phone ?? ""}
              placeholder="555-0200"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input
            name="website"
            type="url"
            defaultValue={vendor?.website ?? ""}
            placeholder="https://vendor.com"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={vendor?.notes ?? ""}
            placeholder="Lead times, special instructions, preferences..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47] resize-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="vendorIsActive"
            name="isActive"
            type="checkbox"
            defaultChecked={vendor?.isActive !== false}
            className="accent-[#1B5E47]"
          />
          <label htmlFor="vendorIsActive" className="text-sm text-gray-700">Active vendor</label>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="flex-1 bg-[#1B5E47] text-white rounded-lg py-2 text-sm font-medium hover:bg-[#16503d] disabled:opacity-60">
            {loading ? "Saving..." : vendor ? "Save changes" : "Add vendor"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
