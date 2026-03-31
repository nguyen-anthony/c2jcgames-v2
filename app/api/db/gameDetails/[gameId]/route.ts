import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/db/gameDetails/[gameId]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("game_details")
    .select("*")
    .eq("gameid", gameId)
    .maybeSingle();

  if (error) {
    console.error(error);
    return Response.json(
      { error: "An error occurred while getting game details" },
      { status: 500 }
    );
  }

  if (!data) {
    return Response.json({ message: "No results found" }, { status: 404 });
  }

  return Response.json(data, { status: 200 });
}
