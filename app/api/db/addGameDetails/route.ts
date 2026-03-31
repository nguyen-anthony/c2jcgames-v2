import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

// POST /api/db/addGameDetails
export async function POST(request: NextRequest) {
  const { gameId, name, imageUrl, minPlayers, maxPlayers, playTime, description } =
    await request.json();
  const supabase = await createClient();

  // ON CONFLICT (gameid) DO NOTHING — upsert with ignoreDuplicates handles this
  const { error } = await supabase
    .from("game_details")
    .upsert(
      { gameid: gameId, name, imageurl: imageUrl, minplayers: minPlayers, maxplayers: maxPlayers, playtime: playTime, description },
      { onConflict: "gameid", ignoreDuplicates: true }
    );

  if (error) {
    console.error(error);
    return Response.json(
      { error: "An error occurred while adding game details" },
      { status: 500 }
    );
  }

  return Response.json({ name }, { status: 201 });
}
