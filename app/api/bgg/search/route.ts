import { NextRequest } from "next/server";
import axios from "axios";
import { DOMParser } from "@xmldom/xmldom";

// Search only base games. Expansion results need their own data model before
// they can be added to the event list; do not broaden this type on its own.
const BGG_SEARCH_TYPE = "boardgame";
const MAX_RESULTS = 100;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";
  if (!query || query.length > 200) {
    return Response.json({ error: "Enter a game name (up to 200 characters)." }, { status: 400 });
  }

  try {
    const response = await axios.create({ timeout: 10000 }).get(
      "https://boardgamegeek.com/xmlapi2/search",
      {
        params: { query, type: BGG_SEARCH_TYPE },
        headers: {
          "User-Agent": "c2jcgames/1.0 (boardgame collection app)",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_BGG_KEY}`,
        },
        responseType: "text",
      }
    );

    let invalidXml = false;
    const parser = new DOMParser({
      errorHandler: {
        warning: () => { invalidXml = true; },
        error: () => { invalidXml = true; },
        fatalError: () => { invalidXml = true; },
      },
    });
    const document = parser.parseFromString(response.data, "application/xml");
    if (invalidXml || document.documentElement?.tagName !== "items") {
      throw new Error("Invalid BGG search response");
    }

    const items = Array.from(document.getElementsByTagName("item"));
    const results = items.flatMap((item) => {
      if (item.getAttribute("type") !== BGG_SEARCH_TYPE) return [];
      const gameid = item.getAttribute("id");
      const names = Array.from(item.getElementsByTagName("name"));
      const name = (names.find((entry) => entry.getAttribute("type") === "primary") ?? names[0])
        ?.getAttribute("value");
      if (!gameid || !/^\d+$/.test(gameid) || !name) return [];
      const year = item.getElementsByTagName("yearpublished")[0]?.getAttribute("value");
      return [{ gameid, name, year: year && year !== "0" ? year : null }];
    });

    return Response.json({ results: results.slice(0, MAX_RESULTS), truncated: results.length > MAX_RESULTS });
  } catch (error) {
    console.error("Error searching BGG:", error);
    const rateLimited = axios.isAxiosError(error) && error.response?.status === 429;
    return Response.json(
      { error: rateLimited ? "BGG is receiving too many requests. Please try again later." : "Unable to search BGG. Please try again." },
      { status: rateLimited ? 429 : 502 }
    );
  }
}
