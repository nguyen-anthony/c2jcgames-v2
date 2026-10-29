import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

// POST /api/db/addUser
export async function POST(request: NextRequest) {
  const { username, firstName, lastName, bggUsername, gamesForUser } =
    await request.json();

  if (!username || !firstName || !lastName) {
    return Response.json(
      { error: "Username, first name, and last name are required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .insert({
      username: String(username).trim().toLowerCase(),
      firstname: firstName,
      lastname: lastName,
      bggacc: bggUsername || null,
      owned_games: gamesForUser || null,
    })
    .select("userid")
    .single();

  if (error) {
    console.error(error);
    if (error.code === "23505") {
      return Response.json({ error: "That username is already in use" }, { status: 409 });
    }
    return Response.json(
      { error: "An error occurred while adding the user" },
      { status: 500 }
    );
  }

  return Response.json(data, { status: 201 });
}
