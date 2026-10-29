import axios from "axios";
import axiosRetry from "axios-retry";

axiosRetry(axios, { retries: 20 });

export async function addUser(
  username: string,
  firstName: string,
  lastName: string,
  bggUsername: string,
  gamesForUser?: unknown
) {
  const normalizedUsername = username.trim().toLowerCase();
  const first = firstName.trim().toLowerCase();
  const last = lastName.trim().toLowerCase() || "null";
  const bgg = bggUsername.trim().toLowerCase();

  try {
    const response = await axios.post(`/api/db/addUser`, {
      username: normalizedUsername,
      firstName: first,
      lastName: last,
      bggUsername: bgg,
      gamesForUser,
    });
    return response.data.userid as number;
  } catch (e) {
    console.error("Error adding user:", e);
  }
}

export async function updateBggUserGames(
  bggUsername: string,
  gamesForUser: unknown
) {
  const bgg = bggUsername.toLowerCase();
  try {
    await axios.patch(`/api/db/updateUser`, {
      bggAcc: bgg,
      gamesForUser,
    });
  } catch (e) {
    console.error("Error updating user:", e);
  }
}

export async function getUser(username?: string | null, userId?: string | null) {
  let url: string;

  if (username) {
    url = `/api/db/getUser?username=${encodeURIComponent(username.trim().toLowerCase())}`;
  } else if (userId) {
    url = `/api/db/getUser?userId=${encodeURIComponent(userId)}`;
  } else {
    console.error("Error: No parameters provided to search for user");
    return null;
  }

  try {
    const response = await axios.get(url);
    return response.data.found ? response.data.user : null;
  } catch (e) {
    console.error("Error getting user:", e);
    return null;
  }
}

export async function getBggUserDetails(bggUsername: string) {
  const bgg = bggUsername.trim().toLowerCase();
  try {
    const response = await axios.get(`/api/bgg/user/${encodeURIComponent(bgg)}`);

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response.data, "application/xml");
    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      return { success: false, message: "Unable to read the BGG account response" };
    }

    const xmlFirstName =
      xmlDoc.getElementsByTagName("firstname")[0]?.getAttribute("value")?.toLowerCase() ?? "";

    let xmlLastName =
      xmlDoc.getElementsByTagName("lastname")[0]?.getAttribute("value")?.toLowerCase() ?? "";

    const xmlYearRegistered = xmlDoc
      .getElementsByTagName("yearregistered")[0]
      ?.getAttribute("value");

    // Fun easter egg preserved from the original
    if (xmlFirstName === "ian" && xmlLastName === "nelsen") xmlLastName = "nelson";
    if (bgg === "aquateenavenger") xmlLastName = "jensen";

    if (xmlYearRegistered) {
      return {
        success: true,
        firstName: xmlFirstName,
        lastName: xmlLastName,
      };
    }

    return { success: false, notFound: true, message: `Username ${bgg} not found on BGG` };
  } catch (e) {
    console.error("Error fetching BGG user details:", e);
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      return { success: false, notFound: true, message: `Username ${bgg} not found on BGG` };
    }
    return {
      success: false,
      message: `Unable to retrieve BGG Account Details for ${bgg}`,
    };
  }
}

export async function getBggGamesForUser(bggUsername: string) {
  try {
    const response = await axios.get(
      `/api/bgg/user/${encodeURIComponent(bggUsername)}/collection`
    );
    return response.data;
  } catch (e) {
    console.error("Error fetching BGG game collection:", e);
    return null;
  }
}
