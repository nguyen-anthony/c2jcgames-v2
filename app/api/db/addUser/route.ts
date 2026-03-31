import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

// POST /api/db/addUser
export async function POST(request: NextRequest) {
  const { firstName, lastName, bggUsername, gamesForUser } =
    await request.json();

  if (!firstName || !lastName) {
    return Response.json(
      { error: "First name and Last name are required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .insert({
      firstname: firstName,
      lastname: lastName,
      bggacc: bggUsername || null,
      owned_games: gamesForUser || null,
    })
    .select("userid")
    .single();

  if (error) {
    console.error(error);
    return Response.json(
      { error: "An error occurred while adding the user" },
      { status: 500 }
    );
  }

  return Response.json(data, { status: 201 });
}
