import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/db/gamesList/owner/[userId]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select("gameid")
    .eq("ownerid", userId)
    .order("key");

  if (error) {
    console.error(error);
    return Response.json(
      { error: "An error occurred while getting games list" },
      { status: 500 }
    );
  }

  const gameIds = (data ?? []).map((row) => String(row.gameid));
  return Response.json(gameIds, { status: 200 });
}
