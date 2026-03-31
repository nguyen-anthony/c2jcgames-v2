import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/db/ownedGames/[userId]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("owned_games")
    .eq("userid", userId)
    .maybeSingle();

  if (error) {
    console.error(error);
    return Response.json(
      { error: "An error occurred while getting user game collection" },
      { status: 500 }
    );
  }

  if (!data) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json(data.owned_games ?? [], { status: 200 });
}
