import { NextRequest } from "next/server";
import axios from "axios";
import { DOMParser } from "@xmldom/xmldom";

// GET /api/bgg/user/[username]/collection
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const MAX_RETRIES = 3;
  const DELAY = 2000;

  async function fetchCollection(retry: number): Promise<
    Array<{ gameid: string; name: string }>
  > {
    if (retry > MAX_RETRIES) {
      throw new Error("Retry limit exceeded for game collection");
    }

    const response = await axios.get(
      `https://boardgamegeek.com/xmlapi2/collection?username=${username}&excludesubtype=boardgameexpansion&own=1`,
      {
        headers: {
          "User-Agent": "c2jcgames/1.0 (boardgame collection app)",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_BGG_KEY}`,
        },
      }
    );

    if (response.status === 200) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response.data, "application/xml");
      const items = xmlDoc.getElementsByTagName("item");
      const gameCollection: Array<{ gameid: string; name: string }> = [];

      for (let i = 0; i < items.length; i++) {
        const gameid = items[i].getAttribute("objectid") ?? "";
        const name =
          items[i].getElementsByTagName("name")[0]?.childNodes[0]?.nodeValue ??
          "";
        gameCollection.push({ gameid, name });
      }

      return gameCollection;
    } else if (response.status === 202) {
      await new Promise((resolve) => setTimeout(resolve, DELAY));
      return fetchCollection(retry + 1);
    } else {
      throw new Error("Unexpected status code: " + response.status);
    }
  }

  try {
    const data = await fetchCollection(0);
    return Response.json(data);
  } catch (e) {
    console.error("Error fetching BGG User Game Collection:", e);
    return new Response("Unable to retrieve BGG User Game Collection", {
      status: 500,
    });
  }
}
