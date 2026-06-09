import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { MenuModel } from "~/models/menu.model";
import { AppLayout } from "~/components/layout/AppLayout";
import { PageHeader } from "~/components/shared/PageHeader";
import { EmptyState } from "~/components/shared/EmptyState";
import { Modal } from "~/components/shared/Modal";
import { useState, useEffect } from "react";
import {
  UtensilsCrossed,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit,
  Tag,
} from "lucide-react";
import { useConfigurables } from "~/modules/configurables";
import { cn } from "~/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");

  const menus = await MenuModel.find({ isDeleted: false }).sort({ name: 1 }).lean();

  return {
    menus: menus.map((m) => ({
      ...m,
      _id: m._id.toString(),
    })),
  };
}

export default function MenusPage() {
  const { menus } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editMenu, setEditMenu] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = menus.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this menu? This action cannot be undone.")) return;
    await fetch(`/api/menus/${id}`, { method: "DELETE" });
    navigate(".", { replace: true });
  };

  return (
    <AppLayout>
      <div className="px-6 py-6 max-w-5xl mx-auto">
        <PageHeader
          title="Menus"
          subtitle="Build reusable menu templates and assign them to events."
          actions={
            <button
              onClick={() => { setEditMenu(null); setShowModal(true); }}
              className="flex items-center gap-2 bg-[#1B5E47] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#16503d] transition-colors"
            >
              <Plus size={16} />
              Add menu
            </button>
          }
        />

        {/* Search */}
        <div className="relative mb-5 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menus..."
            className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47] bg-white w-full"
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="No menus yet"
            description="Create reusable menus with dishes and assign them to events."
            action={
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-[#1B5E47] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#16503d]"
              >
                <Plus size={16} />
                Add menu
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((menu) => {
              const isExpanded = expandedId === menu._id;
              const dishes = menu.dishes as any[];
              const allergens = [...new Set(dishes.flatMap((d: any) => d.allergens ?? []))];
              const dietaryTags = [...new Set(dishes.flatMap((d: any) => d.dietaryTags ?? []))];

              return (
                <div key={menu._id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <button
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : menu._id)}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 flex-shrink-0">
                      <UtensilsCrossed size={18} className="text-[#C9932A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{menu.name}</span>
                        {menu.isReusable && (
                          <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5">
                            Reusable
                          </span>
                        )}
                      </div>
                      {menu.description && (
                        <div className="text-xs text-gray-500 truncate mt-0.5">{menu.description}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-0.5">
                        {dishes.length} dish{dishes.length !== 1 ? "es" : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditMenu(menu); setShowModal(true); }}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(menu._id); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                      {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-50 px-5 py-4">
                      {/* Allergen & dietary summary */}
                      {(allergens.length > 0 || dietaryTags.length > 0) && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {allergens.map((a) => (
                            <span key={a} className="inline-flex items-center gap-1 text-[11px] rounded-full bg-red-50 text-red-700 px-2.5 py-0.5">
                              <Tag size={9} />
                              {a}
                            </span>
                          ))}
                          {dietaryTags.map((t) => (
                            <span key={t} className="inline-flex items-center gap-1 text-[11px] rounded-full bg-green-50 text-green-700 px-2.5 py-0.5">
                              <Tag size={9} />
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Dish list */}
                      <div className="space-y-2">
                        {dishes.map((dish, i) => (
                          <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                            <div className="h-6 w-6 rounded bg-[#FAF7F0] flex items-center justify-center text-xs font-semibold text-gray-500 flex-shrink-0 mt-0.5">
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900">{dish.name}</div>
                              {dish.description && (
                                <div className="text-xs text-gray-500 mt-0.5">{dish.description}</div>
                              )}
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(dish.allergens ?? []).map((a: string) => (
                                  <span key={a} className="text-[10px] rounded bg-red-50 text-red-600 px-1.5 py-0.5">{a}</span>
                                ))}
                                {(dish.dietaryTags ?? []).map((t: string) => (
                                  <span key={t} className="text-[10px] rounded bg-green-50 text-green-600 px-1.5 py-0.5">{t}</span>
                                ))}
                              </div>
                            </div>
                            {dish.portionCost > 0 && (
                              <div className="text-xs text-gray-400 flex-shrink-0">
                                ${dish.portionCost}/portion
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <MenuModal
        isOpen={showModal}
        menu={editMenu}
        onClose={() => { setShowModal(false); setEditMenu(null); }}
        onSaved={() => {
          setShowModal(false);
          setEditMenu(null);
          navigate(".", { replace: true });
        }}
      />
    </AppLayout>
  );
}

// ── Menu Modal ───────────────────────────────────────────────────────────────
type Dish = { name: string; description: string; allergens: string[]; dietaryTags: string[]; portionCost: number };

function MenuModal({
  isOpen,
  menu,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  menu: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { config } = useConfigurables();
  const [dishes, setDishes] = useState<Dish[]>(
    menu?.dishes ?? []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dishInput, setDishInput] = useState<Dish>({ name: "", description: "", allergens: [], dietaryTags: [], portionCost: 0 });
  const [allergenInput, setAllergenInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  // Reset when menu changes
  useEffect(() => {
    setDishes(menu?.dishes ?? []);
  }, [menu]);

  const addDish = () => {
    if (!dishInput.name.trim()) return;
    setDishes([...dishes, { ...dishInput }]);
    setDishInput({ name: "", description: "", allergens: [], dietaryTags: [], portionCost: 0 });
    setAllergenInput("");
    setTagInput("");
  };

  const removeDish = (i: number) => setDishes(dishes.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const body = {
        name: formData.get("name"),
        description: formData.get("description"),
        isReusable: formData.get("isReusable") === "on",
        dishes,
      };

      const url = menu ? `/api/menus/${menu._id}` : "/api/menus";
      const method = menu ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onSaved();
    } catch (err: any) {
      setError(err.message ?? "Failed to save menu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={menu ? "Edit Menu" : "Add Menu"} size="xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Menu name *</label>
            <input
              name="name"
              required
              defaultValue={menu?.name ?? ""}
              placeholder="e.g. Garden Wedding Menu"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              name="description"
              defaultValue={menu?.description ?? ""}
              placeholder="Brief description of this menu"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E47]/30 focus:border-[#1B5E47]"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="isReusable"
              name="isReusable"
              type="checkbox"
              defaultChecked={menu?.isReusable !== false}
              className="accent-[#1B5E47]"
            />
            <label htmlFor="isReusable" className="text-sm text-gray-700">Mark as reusable template</label>
          </div>
        </div>

        {/* Dishes section */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Dishes</h3>

          {dishes.length > 0 && (
            <div className="mb-3 space-y-1.5 max-h-40 overflow-y-auto">
              {dishes.map((dish, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#FAF7F0] rounded-lg px-3 py-2 text-sm">
                  <span className="flex-1 font-medium text-gray-800">{dish.name}</span>
                  <span className="text-xs text-gray-400">
                    {dish.allergens.length > 0 ? dish.allergens.join(", ") : "No allergens"}
                  </span>
                  <button type="button" onClick={() => removeDish(i)} className="text-gray-400 hover:text-red-500">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add dish inline */}
          <div className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Add a dish</p>
            <input
              type="text"
              value={dishInput.name}
              onChange={(e) => setDishInput({ ...dishInput, name: e.target.value })}
              placeholder="Dish name *"
              className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B5E47] bg-white"
            />
            <input
              type="text"
              value={dishInput.description}
              onChange={(e) => setDishInput({ ...dishInput, description: e.target.value })}
              placeholder="Description (optional)"
              className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B5E47] bg-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="text"
                  value={allergenInput}
                  onChange={(e) => setAllergenInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && allergenInput.trim()) {
                      e.preventDefault();
                      setDishInput({ ...dishInput, allergens: [...dishInput.allergens, allergenInput.trim()] });
                      setAllergenInput("");
                    }
                  }}
                  placeholder="Allergen (Enter to add)"
                  className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#1B5E47] bg-white"
                  list="allergens-list"
                />
                <datalist id="allergens-list">
                  {(config?.dietaryOptions ?? []).map((d) => <option key={d} value={d} />)}
                </datalist>
                <div className="flex flex-wrap gap-1 mt-1">
                  {dishInput.allergens.map((a) => (
                    <span key={a} className="text-[10px] rounded-full bg-red-50 text-red-600 px-2 py-0.5 cursor-pointer hover:bg-red-100"
                      onClick={() => setDishInput({ ...dishInput, allergens: dishInput.allergens.filter((x) => x !== a) })}>
                      {a} ×
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && tagInput.trim()) {
                      e.preventDefault();
                      setDishInput({ ...dishInput, dietaryTags: [...dishInput.dietaryTags, tagInput.trim()] });
                      setTagInput("");
                    }
                  }}
                  placeholder="Dietary tag (Enter to add)"
                  className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#1B5E47] bg-white"
                  list="dietary-list"
                />
                <datalist id="dietary-list">
                  {(config?.dietaryOptions ?? []).map((d) => <option key={d} value={d} />)}
                </datalist>
                <div className="flex flex-wrap gap-1 mt-1">
                  {dishInput.dietaryTags.map((t) => (
                    <span key={t} className="text-[10px] rounded-full bg-green-50 text-green-600 px-2 py-0.5 cursor-pointer hover:bg-green-100"
                      onClick={() => setDishInput({ ...dishInput, dietaryTags: dishInput.dietaryTags.filter((x) => x !== t) })}>
                      {t} ×
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={addDish}
              disabled={!dishInput.name.trim()}
              className="flex items-center gap-1.5 text-sm text-[#1B5E47] font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={14} />
              Add dish to menu
            </button>
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
            {loading ? "Saving..." : menu ? "Save changes" : "Create menu"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
