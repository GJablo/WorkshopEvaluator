import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertWorkshopSchema, insertVoteSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Workshop routes
  app.post("/api/workshops", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "lecturer") {
      return res.sendStatus(403);
    }

    const parsed = insertWorkshopSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const workshop = await storage.createWorkshop({
      ...parsed.data,
      lecturerId: req.user.id,
    });
    res.status(201).json(workshop);
  });

  app.get("/api/workshops", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const workshops = await storage.getWorkshops();

    // Add voting stats for each workshop
    const workshopsWithStats = await Promise.all(
      workshops.map(async (workshop) => {
        const votes = await storage.getVotesByWorkshop(workshop.id);
        const totalVotes = votes.length;
        const approvalVotes = votes.filter(v => v.approved).length;

        return {
          ...workshop,
          votingStats: {
            total: totalVotes,
            approved: approvalVotes,
            declined: totalVotes - approvalVotes,
          }
        };
      })
    );

    res.json(workshopsWithStats);
  });

  app.get("/api/workshops/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const workshop = await storage.getWorkshopById(Number(req.params.id));
    if (!workshop) return res.sendStatus(404);

    const votes = await storage.getVotesByWorkshop(workshop.id);
    const totalVotes = votes.length;
    const approvalVotes = votes.filter(v => v.approved).length;

    res.json({
      ...workshop,
      votingStats: {
        total: totalVotes,
        approved: approvalVotes,
        declined: totalVotes - approvalVotes,
      }
    });
  });

  app.post("/api/workshops/:id/vote", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "student") {
      return res.sendStatus(403);
    }

    const parsed = insertVoteSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const workshop = await storage.getWorkshopById(Number(req.params.id));
    if (!workshop) return res.sendStatus(404);

    // Check if student has already voted
    const existingVote = await storage.getVoteByStudentAndWorkshop(req.user.id, workshop.id);
    if (existingVote) {
      return res.status(400).json({ message: "You have already voted for this workshop" });
    }

    const vote = await storage.createVote({
      workshopId: workshop.id,
      studentId: req.user.id,
      approved: parsed.data.approved,
    });
    res.status(201).json(vote);
  });

  app.get("/api/workshops/:id/votes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const votes = await storage.getVotesByWorkshop(Number(req.params.id));
    const totalVotes = votes.length;
    const approvalVotes = votes.filter(v => v.approved).length;

    res.json({
      total: totalVotes,
      approved: approvalVotes,
      declined: totalVotes - approvalVotes,
    });
  });

  app.patch("/api/workshops/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "lecturer") {
      return res.sendStatus(403);
    }

    const { status } = req.body;
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const workshop = await storage.updateWorkshopStatus(
      Number(req.params.id),
      status,
    );
    res.json(workshop);
  });

  const httpServer = createServer(app);
  return httpServer;
}