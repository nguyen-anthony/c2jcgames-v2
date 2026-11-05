import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

// DELETE /api/db/removeGame
export async function DELETE(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Game and user IDs are required" }, { status: 400 });
  }

  const { gameId, userId } = body as { gameId?: unknown; userId?: unknown };
  const isValidId = (id: unknown) =>
    (typeof id === "string" && /^[1-9]\d*$/.test(id)) ||
    (typeof id === "number" && Number.isSafeInteger(id) && id > 0);

  if (!isValidId(gameId) || !isValidId(userId)) {
    return Response.json({ error: "Valid game and user IDs are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .delete()
    .eq("gameid", gameId)
    .eq("ownerid", userId)
    .select("key");

  if (error) {
    console.error("Error removing game:", error);
    return Response.json({ error: "Unable to remove the game" }, { status: 500 });
  }

  if (!data?.length) {
    return Response.json({ error: "Game not found for this user" }, { status: 404 });
  }

  return Response.json({ success: true });
}
