import { db } from "./db";
import { companies, tariffAlerts, refundAssessments, briefings } from "@shared/schema";
import type { InsertCompany, Company, InsertAlert, TariffAlert, InsertRefund, RefundAssessment, InsertBriefing, Briefing } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Companies
  createCompany(data: InsertCompany): Company;
  getCompanies(): Company[];
  getCompany(id: number): Company | undefined;

  // Alerts
  createAlert(data: InsertAlert): TariffAlert;
  getAlerts(): TariffAlert[];
  getGlobalAlerts(): TariffAlert[];

  // Refund Assessments
  createRefundAssessment(data: InsertRefund): RefundAssessment;
  getRefundAssessments(): RefundAssessment[];
  getRefundAssessment(id: number): RefundAssessment | undefined;
  updateRefundStatus(id: number, status: string): RefundAssessment | undefined;

  // Briefings
  createBriefing(data: InsertBriefing): Briefing;
  getBriefings(companyId?: number): Briefing[];
}

export class Storage implements IStorage {
  createCompany(data: InsertCompany): Company {
    return db.insert(companies).values(data).returning().get();
  }

  getCompanies(): Company[] {
    return db.select().from(companies).all();
  }

  getCompany(id: number): Company | undefined {
    return db.select().from(companies).where(eq(companies.id, id)).get();
  }

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
}

export const storage = new Storage();
