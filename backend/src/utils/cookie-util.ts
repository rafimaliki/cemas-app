import jwt from "jsonwebtoken";


export function extractJwtFromCookies(
  cookieHeader?: string | null
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/authToken=([^;]+)/);
  return match ? match[1] : null;
}


export function verifyJwtToken(token: string): {id:number; email: string; name: string; picture: string } | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id:number; email: string; name: string; picture: string };
    
    return decoded;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}