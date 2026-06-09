import { Router } from "express";
import { Types } from "mongoose";
import { StaffMemberModel, StaffAssignmentModel } from "~/models/staff.model";

const router = Router();

// GET /api/staff
router.get("/api/staff", async (req, res) => {
  try {
    const { search, role } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { isDeleted: false };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      filter.role = role;
    }

    const staff = await StaffMemberModel.find(filter).sort({ name: 1 }).lean();
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch staff" });
  }
});

// GET /api/staff/:id
router.get("/api/staff/:id", async (req, res) => {
  try {
    const member = await StaffMemberModel.findOne({ _id: req.params.id, isDeleted: false }).lean();
    if (!member) return res.status(404).json({ success: false, error: "Staff member not found" });
    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch staff member" });
  }
});

// POST /api/staff
router.post("/api/staff", async (req, res) => {
  try {
    const member = await StaffMemberModel.create(req.body);
    res.status(201).json({ success: true, data: member });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message ?? "Failed to create staff member" });
  }
});

// PUT /api/staff/:id
router.put("/api/staff/:id", async (req, res) => {
  try {
    const member = await StaffMemberModel.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();
    if (!member) return res.status(404).json({ success: false, error: "Staff member not found" });
    res.json({ success: true, data: member });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message ?? "Failed to update staff member" });
  }
});

// DELETE /api/staff/:id
router.delete("/api/staff/:id", async (req, res) => {
  try {
    const member = await StaffMemberModel.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    ).lean();
    if (!member) return res.status(404).json({ success: false, error: "Staff member not found" });
    res.json({ success: true, message: "Staff member deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to delete staff member" });
  }
});

// GET /api/staff-assignments?eventId=...
router.get("/api/staff-assignments", async (req, res) => {
  try {
    const { eventId } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { isDeleted: false };

    if (eventId) {
      filter.eventId = new Types.ObjectId(eventId);
    }

    const assignments = await StaffAssignmentModel.find(filter).lean();

    // Populate staff member details
    const staffIds = assignments.map((a) => a.staffMemberId);
    const staffMembers = await StaffMemberModel.find({ _id: { $in: staffIds }, isDeleted: false }).lean();
    const staffMap = new Map(staffMembers.map((s) => [s._id.toString(), s]));

    const populated = assignments.map((a) => ({
      ...a,
      staffMember: staffMap.get(a.staffMemberId.toString()),
    }));

    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch assignments" });
  }
});

// POST /api/staff-assignments
router.post("/api/staff-assignments", async (req, res) => {
  try {
    const { eventId, staffMemberId, startTime, endTime } = req.body;

    // Conflict detection: check if staff is already assigned during overlapping times
    if (startTime && endTime) {
      const conflict = await StaffAssignmentModel.findOne({
        staffMemberId: new Types.ObjectId(staffMemberId),
        eventId: { $ne: new Types.ObjectId(eventId) },
        isDeleted: false,
        $or: [
          { startTime: { $lt: new Date(endTime), $gte: new Date(startTime) } },
          { endTime: { $gt: new Date(startTime), $lte: new Date(endTime) } },
          { startTime: { $lte: new Date(startTime) }, endTime: { $gte: new Date(endTime) } },
        ],
      }).lean();

      if (conflict) {
        return res.status(409).json({
          success: false,
          error: "Staff member has a scheduling conflict during this time.",
          conflict: true,
        });
      }
    }

    const assignment = await StaffAssignmentModel.create(req.body);
    res.status(201).json({ success: true, data: assignment });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message ?? "Failed to create assignment" });
  }
});

// DELETE /api/staff-assignments/:id
router.delete("/api/staff-assignments/:id", async (req, res) => {
  try {
    const assignment = await StaffAssignmentModel.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    ).lean();
    if (!assignment) return res.status(404).json({ success: false, error: "Assignment not found" });
    res.json({ success: true, message: "Assignment removed" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to remove assignment" });
  }
});

export default router;
