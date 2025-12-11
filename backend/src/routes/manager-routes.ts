import { Router } from "express";
import { requireUser, requireRole } from "../middleware/auth";
import { TravelRequest } from "../models/travel-request";

export const managerRouter = Router();

// pending requests for this manager
managerRouter.get(
  "/requests/pending",
  requireUser,
  requireRole(["ROLE_MANAGER"]),
  async (req, res) => {
    const list = await TravelRequest.find({
      managerId: req.user!.uuid,
      status: "PENDING"
    });
    res.json(list);
  }
);

// approve or reject
managerRouter.put(
  "/requests/:uuid/decision",
  requireUser,
  requireRole(["ROLE_MANAGER"]),
  async (req, res) => {
    const { status, comment } = req.body; // APPROVED / REJECTED
    const tr = await TravelRequest.findOne({ uuid: req.params.uuid });
    if (!tr) return res.status(404).json({ message: "Not found" });
    if (tr.managerId !== req.user!.uuid)
      return res.status(403).json({ message: "Forbidden" });

    tr.status = status;
    tr.managerComment = comment;
    await tr.save();
    res.json(tr);
  }
);
