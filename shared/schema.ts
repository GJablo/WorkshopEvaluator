import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["lecturer", "student"] }).notNull(),
});

export const workshops = pgTable("workshops", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  lecturerId: integer("lecturer_id").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  date: timestamp("date").notNull(),
});

export const studentVotes = pgTable("student_votes", {
  id: serial("id").primaryKey(),
  workshopId: integer("workshop_id").notNull(),
  studentId: integer("student_id").notNull(),
  approved: boolean("approved").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const insertWorkshopSchema = createInsertSchema(workshops).pick({
  title: true,
  description: true,
  date: true,
}).extend({
  date: z.string().transform((str) => new Date(str)),
});

export const insertVoteSchema = createInsertSchema(studentVotes).pick({
  approved: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Workshop = typeof workshops.$inferSelect;
export type StudentVote = typeof studentVotes.$inferSelect;