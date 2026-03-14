import nodemailer from "nodemailer";
import { db } from "@/db/index.ts";
import { Evidences, User, EvidenceCriteria, Criteria } from "@/db/schema.ts";
import { eq, and, lte, gte, inArray } from "drizzle-orm";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailOptions): Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"CeMas App" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    html,
  });
};

/**
 * Checks for evidence items that will expire in 6 months and sends notifications
 * @returns Object with success status and message
 */
export const checkExpiringEvidence = async (): Promise<{ success: boolean; message: string; notified?: number }> => {
  try {
    // Calculate dates for 6 months from now
    const now = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(now.getMonth() + 6);
    
    // Find evidence that expires between now and 6 months from now
    // and hasn't been notified yet
    const expiringEvidence = await db.query.Evidences.findMany({
      where: and(
        gte(Evidences.expired_by, now),
        lte(Evidences.expired_by, sixMonthsFromNow),
        eq(Evidences.notified, false)
      )
    });

    if (expiringEvidence.length === 0) {
      return { success: true, message: "No new expiring evidence found", notified: 0 };
    }

    // Send notifications for each expiring evidence
    let notifiedCount = 0;
    
    for (const evidence of expiringEvidence) {
      try {
        // Get the uploader's email from their ID
        const uploader = await db.query.User.findFirst({
          where: eq(User.id, evidence.uploaded_by),
        });

        if (!uploader) {
          console.error(`User with ID ${evidence.uploaded_by} not found for evidence ${evidence.id}`);
          continue;
        }

        // Format expiry date
        const expiryDate = new Date(evidence.expired_by).toLocaleDateString();
        
        // Get all criteria associated with this evidence
        const evidenceCriteria = await db.select({
          criteriaId: Criteria.id,
          criteriaName: Criteria.name,
          picId: Criteria.pic_id
        })
        .from(EvidenceCriteria)
        .innerJoin(Criteria, eq(EvidenceCriteria.criteria_id, Criteria.id))
        .where(eq(EvidenceCriteria.evidence_id, evidence.id));
        
        // Collect all unique PICs from the criteria
        const picIds = new Set<number>();
        for (const ec of evidenceCriteria) {
          if (ec.picId !== null) {
            picIds.add(ec.picId);
          }
        }
        
        // Get all PIC users
        let picUsers: typeof User.$inferSelect[] = [];
        if (picIds.size > 0) {
          picUsers = await db.query.User.findMany({
            where: inArray(User.id, Array.from(picIds)),
          });
        }
        
        // Create a list of all recipients (uploader + PICs)
        const recipients = [uploader, ...picUsers];
        
        // Create list of criteria names for the email
        const criteriaNames = evidenceCriteria
          .map(ec => ec.criteriaName)
          .join(", ");
        
        // Send notification email to each recipient
        for (const recipient of recipients) {
          await sendEmail({
            to: recipient.email,
            subject: `Evidence Expiry Notification: ${evidence.file_name}`,
            html: `
              <h2>Evidence Expiry Notification</h2>
              <p>Hello ${recipient.name},</p>
              <p>This is a notification that the evidence file <strong>${evidence.file_name}</strong> will expire on <strong>${expiryDate}</strong> (in less than 6 months).</p>
              ${recipient.id === evidence.uploaded_by 
                ? '<p>As the uploader of this evidence, please take appropriate action to update it before it expires.</p>'
                : '<p>As the Person In Charge (PIC) of criteria associated with this evidence, please ensure it is updated before it expires.</p>'
              }
              <p>This evidence is associated with the following criteria: <strong>${criteriaNames || "No criteria"}</strong></p>
              <p>You can view the evidence at: <a href="${evidence.file_path}">${evidence.file_path}</a></p>
              <p>Thank you,<br>CeMas App</p>
            `,
          });
          
          console.log(`Notification sent to ${recipient.email} for evidence ${evidence.id}`);
        }
        
        // Mark the evidence as notified
        await db
          .update(Evidences)
          .set({ notified: true })
          .where(eq(Evidences.id, evidence.id));
        
        notifiedCount++;
      } catch (err) {
        console.error(`Failed to send notification for evidence ${evidence.id}:`, err);
      }
    }

    return { 
      success: true, 
      message: `Successfully sent notifications for ${notifiedCount} expiring evidence items`, 
      notified: notifiedCount 
    };
  } catch (error) {
    console.error("Error checking for expiring evidence:", error);
    return { success: false, message: "Failed to check for expiring evidence" };
  }
};
