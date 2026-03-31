import { NextRequest } from "next/server";
import axios from "axios";
import { DOMParser } from "@xmldom/xmldom";

// GET /api/bgg/boardgame/[gameId]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  try {
    const response = await axios.get(
      `https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&type=boardgame`,
      {
        headers: {
          "User-Agent": "c2jcgames/1.0 (boardgame collection app)",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_BGG_KEY}`,
        },
      }
    );

    const xmlParser = new DOMParser();
    const xmlDoc = xmlParser.parseFromString(response.data, "application/xml");
    const items = xmlDoc.getElementsByTagName("item");

    if (items.length === 0) {
      return new Response("Game not found in BGG", { status: 404 });
    }

    const nameElements = xmlDoc.getElementsByTagName("name");
    let primaryName = "";

    for (const nameEl of Array.from(nameElements)) {
      if ((nameEl as Element).getAttribute("type") === "primary") {
        primaryName = (nameEl as Element).getAttribute("value") ?? "";
        break;
      }
    }

    const imageUrl =
      xmlDoc.getElementsByTagName("thumbnail")[0]?.textContent ?? "";
    const minPlayers =
      xmlDoc.getElementsByTagName("minplayers")[0]?.getAttribute("value") ?? "0";
    const maxPlayers =
      xmlDoc.getElementsByTagName("maxplayers")[0]?.getAttribute("value") ?? "0";
    const playTime =
      xmlDoc.getElementsByTagName("playingtime")[0]?.getAttribute("value") ?? "0";
    const description =
      xmlDoc.getElementsByTagName("description")[0]?.textContent ?? "";

    return Response.json({
      gameId,
      name: primaryName,
      imageUrl,
      minPlayers,
      maxPlayers,
      playTime,
      description,
    });
  } catch (err) {
    console.error("Error fetching BGG game data:", err);
    return new Response("Unable to retrieve BGG game data", { status: 500 });
  }
}
