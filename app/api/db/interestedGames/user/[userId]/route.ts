import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/db/interestedGames/user/[userId]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("game_interested")
    .select("gameid")
    .eq("userid", userId);

  if (error) {
    console.error(error);
    return Response.json(
      { error: `An error occurred while getting interested games for user ${userId}` },
      { status: 500 }
    );
  }

  return Response.json(data ?? [], { status: 200 });
}
