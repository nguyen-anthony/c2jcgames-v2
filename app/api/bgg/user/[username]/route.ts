import { NextRequest } from "next/server";
import axios from "axios";

// GET /api/bgg/user/[username]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  try {
    const response = await axios.get(
      `https://boardgamegeek.com/xmlapi2/user?name=${encodeURIComponent(username)}`,
      {
        headers: {
          "User-Agent": "c2jcgames/1.0 (boardgame collection app)",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_BGG_KEY}`,
        },
      }
    );
    return new Response(response.data, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    console.error("Error fetching BGG user data:", err);
    const status = axios.isAxiosError(err) ? (err.response?.status ?? 500) : 500;
    return new Response("BGG Account not found", { status });
  }
}
