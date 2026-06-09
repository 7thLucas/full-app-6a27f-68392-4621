import { Router } from "express";
import { Types } from "mongoose";
import { EventModel, EventStatus } from "~/models/event.model";

const router = Router();

// GET /api/events
router.get("/api/events", async (req, res) => {
  try {
    const { status, search, upcoming } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { isDeleted: false };

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { clientName: { $regex: search, $options: "i" } },
        { venue: { $regex: search, $options: "i" } },
      ];
    }

    if (upcoming === "true") {
      filter.eventDate = { $gte: new Date() };
    }

    const events = await EventModel.find(filter).sort({ eventDate: 1 }).lean();
    res.json({ success: true, data: events });
  } catch (error) {
    console.error("GET /api/events error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch events" });
  }
});

// GET /api/events/:id
router.get("/api/events/:id", async (req, res) => {
  try {
    const event = await EventModel.findOne({ _id: req.params.id, isDeleted: false }).lean();
    if (!event) return res.status(404).json({ success: false, error: "Event not found" });
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch event" });
  }
});

// POST /api/events
router.post("/api/events", async (req, res) => {
  try {
    const event = await EventModel.create(req.body);
    res.status(201).json({ success: true, data: event });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message ?? "Failed to create event" });
  }
});

// PUT /api/events/:id
router.put("/api/events/:id", async (req, res) => {
  try {
    const event = await EventModel.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();
    if (!event) return res.status(404).json({ success: false, error: "Event not found" });
    res.json({ success: true, data: event });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message ?? "Failed to update event" });
  }
});

// DELETE /api/events/:id
router.delete("/api/events/:id", async (req, res) => {
  try {
    const event = await EventModel.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    ).lean();
    if (!event) return res.status(404).json({ success: false, error: "Event not found" });
    res.json({ success: true, message: "Event deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to delete event" });
  }
});

// GET /api/events/stats/summary
router.get("/api/events/stats/summary", async (req, res) => {
  try {
    const [total, confirmed, prep, dayOf, completed] = await Promise.all([
      EventModel.countDocuments({ isDeleted: false }),
      EventModel.countDocuments({ isDeleted: false, status: EventStatus.Confirmed }),
      EventModel.countDocuments({ isDeleted: false, status: EventStatus.Prep }),
      EventModel.countDocuments({ isDeleted: false, status: EventStatus.DayOf }),
      EventModel.countDocuments({ isDeleted: false, status: EventStatus.Completed }),
    ]);

    const upcoming = await EventModel.find({
      isDeleted: false,
      eventDate: { $gte: new Date() },
      status: { $ne: EventStatus.Cancelled },
    })
      .sort({ eventDate: 1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      data: {
        total,
        confirmed,
        prep,
        dayOf,
        completed,
        upcoming,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});

export default router;
