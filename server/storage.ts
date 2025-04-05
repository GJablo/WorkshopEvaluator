import { InsertUser, User, Workshop, StudentVote } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  createWorkshop(workshop: Omit<Workshop, "id" | "status">): Promise<Workshop>;
  getWorkshops(): Promise<Workshop[]>;
  getWorkshopById(id: number): Promise<Workshop | undefined>;
  updateWorkshopStatus(id: number, status: Workshop["status"]): Promise<Workshop>;

  createVote(vote: Omit<StudentVote, "id">): Promise<StudentVote>;
  getVotesByWorkshop(workshopId: number): Promise<StudentVote[]>;
  getVoteByStudentAndWorkshop(studentId: number, workshopId: number): Promise<StudentVote | undefined>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workshops: Map<number, Workshop>;
  private votes: Map<number, StudentVote>;
  private currentId: { [key: string]: number };
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.workshops = new Map();
    this.votes = new Map();
    this.currentId = { users: 1, workshops: 1, votes: 1 };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createWorkshop(workshop: Omit<Workshop, "id" | "status">): Promise<Workshop> {
    const id = this.currentId.workshops++;
    const newWorkshop = { ...workshop, id, status: "pending" as const };
    this.workshops.set(id, newWorkshop);
    return newWorkshop;
  }

  async getWorkshops(): Promise<Workshop[]> {
    return Array.from(this.workshops.values());
  }

  async getWorkshopById(id: number): Promise<Workshop | undefined> {
    return this.workshops.get(id);
  }

  async updateWorkshopStatus(id: number, status: Workshop["status"]): Promise<Workshop> {
    const workshop = this.workshops.get(id);
    if (!workshop) throw new Error("Workshop not found");
    const updated = { ...workshop, status };
    this.workshops.set(id, updated);
    return updated;
  }

  async createVote(vote: Omit<StudentVote, "id">): Promise<StudentVote> {
    const id = this.currentId.votes++;
    const newVote = { ...vote, id };
    this.votes.set(id, newVote);
    return newVote;
  }

  async getVotesByWorkshop(workshopId: number): Promise<StudentVote[]> {
    return Array.from(this.votes.values()).filter(
      (v) => v.workshopId === workshopId,
    );
  }

  async getVoteByStudentAndWorkshop(studentId: number, workshopId: number): Promise<StudentVote | undefined> {
    return Array.from(this.votes.values()).find(
      (v) => v.studentId === studentId && v.workshopId === workshopId,
    );
  }
}

export const storage = new MemStorage();