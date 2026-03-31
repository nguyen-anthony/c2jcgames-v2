import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/db/getUser?firstName=&lastName= | ?bggAcc= | ?userId=
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const firstName = searchParams.get("firstName");
  const lastName = searchParams.get("lastName");
  const bggAcc = searchParams.get("bggAcc");
  const userId = searchParams.get("userId");

  const supabase = await createClient();
  let query = supabase.from("users").select("*");

  if (firstName && lastName) {
    query = query.eq("firstname", firstName).eq("lastname", lastName);
  } else if (bggAcc) {
    query = query.eq("bggacc", bggAcc);
  } else if (userId) {
    query = query.eq("userid", userId);
  } else {
    return Response.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error(error);
    return Response.json(
      { error: "An error occurred while fetching the user" },
      { status: 500 }
    );
  }

  return Response.json({ found: !!data, user: data ?? null });
}
