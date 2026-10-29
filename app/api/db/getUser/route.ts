import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/db/getUser?username= | ?userId=
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const username = searchParams.get("username")?.trim().toLowerCase();
  const userId = searchParams.get("userId");

  const supabase = await createClient();
  let data;
  let error;

  if (username) {
    ({ data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .maybeSingle());

    // Older BGG accounts may not have had username backfilled yet. Match the
    // historical BGG username as a compatibility fallback.
    if (!data && !error) {
      ({ data, error } = await supabase
        .from("users")
        .select("*")
        .eq("bggacc", username)
        .maybeSingle());
    }
  } else if (userId) {
    ({ data, error } = await supabase
      .from("users")
      .select("*")
      .eq("userid", userId)
      .maybeSingle());
  } else {
    return Response.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  if (error) {
    console.error(error);
    return Response.json(
      { error: "An error occurred while fetching the user" },
      { status: 500 }
    );
  }

  return Response.json({ found: !!data, user: data ?? null });
}
