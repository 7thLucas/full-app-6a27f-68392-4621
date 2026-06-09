import { Router } from "express";
import { Types } from "mongoose";
import { VendorModel, VendorAssignmentModel } from "~/models/vendor.model";

const router = Router();

// GET /api/vendors
router.get("/api/vendors", async (req, res) => {
  try {
    const { search, category } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { isDeleted: false };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { contactName: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    const vendors = await VendorModel.find(filter).sort({ name: 1 }).lean();
    res.json({ success: true, data: vendors });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch vendors" });
  }
});

// GET /api/vendors/:id
router.get("/api/vendors/:id", async (req, res) => {
  try {
    const vendor = await VendorModel.findOne({ _id: req.params.id, isDeleted: false }).lean();
    if (!vendor) return res.status(404).json({ success: false, error: "Vendor not found" });
    res.json({ success: true, data: vendor });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch vendor" });
  }
});

// POST /api/vendors
router.post("/api/vendors", async (req, res) => {
  try {
    const vendor = await VendorModel.create(req.body);
    res.status(201).json({ success: true, data: vendor });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message ?? "Failed to create vendor" });
  }
});

// PUT /api/vendors/:id
router.put("/api/vendors/:id", async (req, res) => {
  try {
    const vendor = await VendorModel.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();
    if (!vendor) return res.status(404).json({ success: false, error: "Vendor not found" });
    res.json({ success: true, data: vendor });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message ?? "Failed to update vendor" });
  }
});

// DELETE /api/vendors/:id
router.delete("/api/vendors/:id", async (req, res) => {
  try {
    const vendor = await VendorModel.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    ).lean();
    if (!vendor) return res.status(404).json({ success: false, error: "Vendor not found" });
    res.json({ success: true, message: "Vendor deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to delete vendor" });
  }
});

// GET /api/vendor-assignments?eventId=...
router.get("/api/vendor-assignments", async (req, res) => {
  try {
    const { eventId } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { isDeleted: false };

    if (eventId) {
      filter.eventId = new Types.ObjectId(eventId);
    }

    const assignments = await VendorAssignmentModel.find(filter).lean();

    // Populate vendor details
    const vendorIds = assignments.map((a) => a.vendorId);
    const vendors = await VendorModel.find({ _id: { $in: vendorIds }, isDeleted: false }).lean();
    const vendorMap = new Map(vendors.map((v) => [v._id.toString(), v]));

    const populated = assignments.map((a) => ({
      ...a,
      vendor: vendorMap.get(a.vendorId.toString()),
    }));

    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch vendor assignments" });
  }
});

// POST /api/vendor-assignments
router.post("/api/vendor-assignments", async (req, res) => {
  try {
    const assignment = await VendorAssignmentModel.create(req.body);
    res.status(201).json({ success: true, data: assignment });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message ?? "Failed to create vendor assignment" });
  }
});

// DELETE /api/vendor-assignments/:id
router.delete("/api/vendor-assignments/:id", async (req, res) => {
  try {
    const assignment = await VendorAssignmentModel.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    ).lean();
    if (!assignment) return res.status(404).json({ success: false, error: "Assignment not found" });
    res.json({ success: true, message: "Vendor assignment removed" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to remove vendor assignment" });
  }
});

export default router;
