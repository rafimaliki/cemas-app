import { Logs } from "@/db/schema.ts"; 
import { db } from "@/db/index.ts"; 

export async function logUserAction(
  userId: number, 
  email: string, 
  description: string, 
  category: string = "GENERAL",
  compliance_id?: number
) {
  try {
    await db.insert(Logs).values({
      user_id: userId,
      email,
      description,
      category,
      compliance_id
    });
  } catch (err) {
    console.error("Failed to log user action:", err);
  }
}