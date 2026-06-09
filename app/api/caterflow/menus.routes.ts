import { Router } from "express";
import { MenuModel } from "~/models/menu.model";

const router = Router();

// GET /api/menus
router.get("/api/menus", async (req, res) => {
  try {
    const { search } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { isDeleted: false };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const menus = await MenuModel.find(filter).sort({ name: 1 }).lean();
    res.json({ success: true, data: menus });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch menus" });
  }
});

// GET /api/menus/:id
router.get("/api/menus/:id", async (req, res) => {
  try {
    const menu = await MenuModel.findOne({ _id: req.params.id, isDeleted: false }).lean();
    if (!menu) return res.status(404).json({ success: false, error: "Menu not found" });
    res.json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch menu" });
  }
});

// POST /api/menus
router.post("/api/menus", async (req, res) => {
  try {
    const menu = await MenuModel.create(req.body);
    res.status(201).json({ success: true, data: menu });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message ?? "Failed to create menu" });
  }
});

// PUT /api/menus/:id
router.put("/api/menus/:id", async (req, res) => {
  try {
    const menu = await MenuModel.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();
    if (!menu) return res.status(404).json({ success: false, error: "Menu not found" });
    res.json({ success: true, data: menu });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message ?? "Failed to update menu" });
  }
});

// DELETE /api/menus/:id
router.delete("/api/menus/:id", async (req, res) => {
  try {
    const menu = await MenuModel.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    ).lean();
    if (!menu) return res.status(404).json({ success: false, error: "Menu not found" });
    res.json({ success: true, message: "Menu deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to delete menu" });
  }
});

export default router;
