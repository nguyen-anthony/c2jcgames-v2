import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

// PATCH /api/db/updateUser
export async function PATCH(request: NextRequest) {
  const { bggAcc, gamesForUser } = await request.json();
  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update({ owned_games: gamesForUser })
    .eq("bggacc", bggAcc);

  if (error) {
    console.error("Failed to update user game collection in DB", error);
    return Response.json(
      { error: "An error occurred while updating the user" },
      { status: 500 }
    );
  }

  return Response.json({ success: true }, { status: 200 });
}
