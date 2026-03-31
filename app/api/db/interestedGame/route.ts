import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

async function getInterestedNames(supabase: Awaited<ReturnType<typeof createClient>>, gameId: string | number) {
  // Fetch interested user names for the given game via a join
  const { data, error } = await supabase
    .from("game_interested")
    .select("users(firstname, lastname)")
    .eq("gameid", gameId);

  if (error) throw error;

  return (data ?? []).map((row) => {
    // Supabase returns the joined relation as an array even for a to-one join
    const user = Array.isArray(row.users) ? row.users[0] : row.users;
    return { name: user ? `${user.firstname} ${user.lastname}` : "" };
  });
}

// POST /api/db/interestedGame  → add interest
export async function POST(request: NextRequest) {
  const { gameId, userId } = await request.json();
  const supabase = await createClient();

  const { error } = await supabase
    .from("game_interested")
    .insert({ gameid: gameId, userid: userId });

  if (error) {
    console.error(error);
    return Response.json(
      { error: "An error occurred while adding interested game for user" },
      { status: 500 }
    );
  }

  try {
    const updated = await getInterestedNames(supabase, gameId);
    return Response.json(updated, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json([], { status: 201 });
  }
}

// DELETE /api/db/interestedGame  → remove interest
export async function DELETE(request: NextRequest) {
  const { gameId, userId } = await request.json();
  const supabase = await createClient();

  const { error } = await supabase
    .from("game_interested")
    .delete()
    .eq("gameid", gameId)
    .eq("userid", userId);

  if (error) {
    console.error(error);
    return Response.json(
      { error: "An error occurred while deleting game interest for user" },
      { status: 500 }
    );
  }

  try {
    const updated = await getInterestedNames(supabase, gameId);
    return Response.json(updated, { status: 200 });
  } catch (e) {
    console.error(e);
    return Response.json([], { status: 200 });
  }
}
