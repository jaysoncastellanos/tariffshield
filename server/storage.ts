import { db } from "./db";
import { companies, tariffAlerts, refundAssessments, briefings, users, agentScans } from "@shared/schema";
import type { InsertCompany, Company, InsertAlert, TariffAlert, InsertRefund, RefundAssessment, InsertBriefing, Briefing, InsertUser, User, AgentScan } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  createUser(data: InsertUser): User;
  getUserByEmail(email: string): User | undefined;
  getUserById(id: number): User | undefined;
  updateUser(id: number, data: Partial<User>): User | undefined;
  getAllUsers(): User[];

  // Companies
  createCompany(data: InsertCompany): Company;
  getCompanies(): Company[];
  getCompany(id: number): Company | undefined;
  getCompaniesByUser(userId: number): Company[];

  // Alerts
  createAlert(data: InsertAlert): TariffAlert;
  getAlerts(): TariffAlert[];
  getGlobalAlerts(): TariffAlert[];

  // Refund Assessments
  createRefundAssessment(data: InsertRefund): RefundAssessment;
  getRefundAssessments(): RefundAssessment[];
  getRefundAssessment(id: number): RefundAssessment | undefined;
  updateRefundStatus(id: number, status: string): RefundAssessment | undefined;
  getRefundsByUser(userId: number): RefundAssessment[];

  // Briefings
  createBriefing(data: InsertBriefing): Briefing;
  getBriefings(companyId?: number): Briefing[];

  // Agent Scans
  getRecentScans(): AgentScan[];
}

export class Storage implements IStorage {
  // ── Users ─────────────────────────────────────────────
  createUser(data: InsertUser): User {
    return db.insert(users).values(data).returning().get();
  }

  getUserByEmail(email: string): User | undefined {
    return db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
  }

  getUserById(id: number): User | undefined {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  updateUser(id: number, data: Partial<User>): User | undefined {
    return db.update(users).set(data).where(eq(users.id, id)).returning().get();
  }

  getAllUsers(): User[] {
    return db.select().from(users).all();
  }

  // ── Companies ─────────────────────────────────────────
  createCompany(data: InsertCompany): Company {
    return db.insert(companies).values(data).returning().get();
  }

  getCompanies(): Company[] {
    return db.select().from(companies).all();
  }

  getCompany(id: number): Company | undefined {
    return db.select().from(companies).where(eq(companies.id, id)).get();
  }

  getCompaniesByUser(userId: number): Company[] {
    return db.select().from(companies).where(eq(companies.userId, userId)).all();
  }

  // ── Alerts ────────────────────────────────────────────
  createAlert(data: InsertAlert): TariffAlert {
    return db.insert(tariffAlerts).values(data).returning().get();
  }

  getAlerts(): TariffAlert[] {
    return db.select().from(tariffAlerts).orderBy(desc(tariffAlerts.publishedAt)).all();
  }

  getGlobalAlerts(): TariffAlert[] {
    return db.select().from(tariffAlerts)
      .where(eq(tariffAlerts.isGlobal, 1))
      .orderBy(desc(tariffAlerts.publishedAt))
      .all();
  }

  // ── Refund Assessments ────────────────────────────────
  createRefundAssessment(data: InsertRefund): RefundAssessment {
    return db.insert(refundAssessments).values(data).returning().get();
  }

  getRefundAssessments(): RefundAssessment[] {
    return db.select().from(refundAssessments).orderBy(desc(refundAssessments.createdAt)).all();
  }

  getRefundAssessment(id: number): RefundAssessment | undefined {
    return db.select().from(refundAssessments).where(eq(refundAssessments.id, id)).get();
  }

  updateRefundStatus(id: number, status: string): RefundAssessment | undefined {
    return db.update(refundAssessments)
      .set({ status })
      .where(eq(refundAssessments.id, id))
      .returning()
      .get();
  }

  getRefundsByUser(userId: number): RefundAssessment[] {
    return db.select().from(refundAssessments)
      .where(eq(refundAssessments.userId, userId))
      .orderBy(desc(refundAssessments.createdAt))
      .all();
  }

  // ── Briefings ─────────────────────────────────────────
  createBriefing(data: InsertBriefing): Briefing {
    return db.insert(briefings).values(data).returning().get();
  }

  getBriefings(companyId?: number): Briefing[] {
    if (companyId) {
      return db.select().from(briefings)
        .where(eq(briefings.companyId, companyId))
        .orderBy(desc(briefings.createdAt))
        .all();
    }
    return db.select().from(briefings).orderBy(desc(briefings.createdAt)).all();
  }

  // ── Agent Scans ───────────────────────────────────────
  getRecentScans(): AgentScan[] {
    return db.select().from(agentScans).orderBy(desc(agentScans.ranAt)).all();
  }
}

export const storage = new Storage();
