import jwt from "jsonwebtoken";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export async function fetchGoogleToken(code: string) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      redirect_uri: `${process.env.BACKEND_URL}/api/auth/callback/google`,
      grant_type: "authorization_code",
    }),
  });

  return response.json();
}

export async function fetchGoogleUserInfo(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return response.json();
}

export function generateJwtToken(userInfo: {
  id: number;
  email: string;
  name: string;
  picture: string;
  role: string;
}) {
  const JWT_EXPIRY: string = process.env.JWT_EXPIRY || "1h"; // Default to 1 hour if not set
  return jwt.sign(
    {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      role: userInfo.role,
    },
    process.env.JWT_SECRET!,
    { expiresIn: JWT_EXPIRY }
  );
}
