import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/db/gamesList
//
// This route calls the Postgres function `get_games_list` via supabase.rpc().
// You must create it in your Supabase SQL editor before using this route:
//
  // CREATE OR REPLACE FUNCTION get_games_list()
  // RETURNS TABLE (
  //   gameid          int,
  //   owner_names     text[],
  //   interested_players text[],
  //   name            text,
  //   imageurl        text,
  //   minplayers      int,
  //   maxplayers      int,
  //   playtime        int,
  //   description     text
  // )
  // LANGUAGE sql
  // STABLE
  // AS $$
  //   SELECT
  //     g.gameid,
  //     array_agg(DISTINCT u.firstname || ' ' || u.lastname) AS owner_names,
  //     array_agg(DISTINCT i.firstname || ' ' || i.lastname) FILTER (WHERE i.firstname IS NOT NULL) AS interested_players,
  //     gd.name,
  //     gd.imageurl,
  //     gd.minplayers,
  //     gd.maxplayers,
  //     gd.playtime,
  //     gd.description
  //   FROM games g
  //   JOIN game_details gd ON g.gameid = gd.gameid
  //   JOIN users u ON g.ownerid = u.userid
  //   LEFT JOIN game_interested gi ON gd.gameid = gi.gameid
  //   LEFT JOIN users i ON gi.userid = i.userid
  //   GROUP BY g.gameid, gd.name, gd.imageurl, gd.minplayers, gd.maxplayers, gd.playtime, gd.description
  //   ORDER BY gd.name;
  // $$;

export async function GET(_request: NextRequest) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_games_list");

  if (error) {
    console.error(error);
    return Response.json(
      { error: "An error occurred while getting the games list" },
      { status: 500 }
    );
  }

  return Response.json(data ?? [], { status: 200 });
}
