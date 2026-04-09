"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type SaveScanResult = {
  success: boolean;
  error?: string;
  documentId?: string;
};

/**
 * שומר מסמך שנסרק לאחר שהמשתמש בחר את התוצאה המועדפת או המומלצת.
 */
export async function saveScannedDocumentAction(
  fileName: string,
  aiData: Record<string, any>,
  targetModule: "ERP" | "CRM",
  contactId?: string // אופציונלי לשיוך CRM
): Promise<SaveScanResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const userId = session.user.id;
    const orgId = session.user.organizationId;
    if (!orgId) return { success: false, error: "No organization found" };

    // יצירת המסמך הסופי
    const doc = await prisma.document.create({
      data: {
        fileName,
        type: String(aiData.docType || "UNKNOWN"),
        status: "PROCESSED",
        aiData: aiData as Prisma.InputJsonValue,
        userId,
        organizationId: orgId,
        ...(targetModule === "CRM" && contactId ? {
          contact: { connect: { id: contactId } }
        } : {})
      }
    });

    // Anomaly Detection: Compare with historical prices
    const lineItems = (aiData.lineItems || []) as any[];
    const supplier = String(aiData.vendor || "ספק כללי");
    
    for (const item of lineItems) {
      if (item.desc && item.price) {
        const hist = await prisma.productPriceObservation.findFirst({
          where: { 
            organizationId: orgId,
            supplierName: supplier,
            description: item.desc
          },
          orderBy: { observedAt: "desc" }
        });

        if (hist && item.price > hist.unitPrice * 1.2) {
          // חריגה של מעל 20% - צור התראה
          await prisma.inAppNotification.create({
            data: {
              userId,
              title: "חריגת מחיר זוהתה!",
              body: `המוצר "${item.desc}" של "${supplier}" התייקר ב-${Math.round((item.price/hist.unitPrice - 1)*100)}% לעומת קנייה קודמת.`
            }
          });
        }

        // שמירת מחיר היסטורי חדש
        await prisma.productPriceObservation.create({
          data: {
            organizationId: orgId,
            documentId: doc.id,
            description: item.desc,
            supplierName: supplier,
            unitPrice: item.price,
            normalizedKey: item.desc.toLowerCase().slice(0, 50)
          }
        });
      }
    }

    revalidatePath("/dashboard/erp");
    revalidatePath("/dashboard/crm");

    return { success: true, documentId: doc.id };
  } catch (e: any) {
    console.error("Failed to save scanned document:", e);
    return { success: false, error: e.message || "Failed to save" };
  }
}
