import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

// POST /api/db/addGame
export async function POST(request: NextRequest) {
  const { gameId, userId } = await request.json();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .insert({ gameid: gameId, ownerid: userId })
    .select("key")
    .single();

  if (error) {
    console.error(error);
    return Response.json(
      { error: "An error occurred while adding the game" },
      { status: 500 }
    );
  }

  return Response.json(data, { status: 201 });
}
