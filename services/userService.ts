import axios from "axios";
import axiosRetry from "axios-retry";

axiosRetry(axios, { retries: 20 });

export async function addUser(
  firstName: string,
  lastName: string,
  bggUsername: string,
  gamesForUser?: unknown
) {
  const first = firstName.toLowerCase();
  const last = lastName !== "" ? lastName.toLowerCase() : "null";
  const bgg = bggUsername.toLowerCase();

  try {
    const response = await axios.post(`/api/db/addUser`, {
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

export async function getUser(
  firstName?: string | null,
  lastName?: string | null,
  bggUsername?: string | null,
  userId?: string | null
) {
  let url: string;

  if (firstName && lastName) {
    const first = firstName.toLowerCase();
    const last = lastName.toLowerCase();
    url = `/api/db/getUser?firstName=${first}&lastName=${last}`;
  } else if (bggUsername) {
    const bgg = bggUsername.toLowerCase();
    url = `/api/db/getUser?bggAcc=${bgg}`;
  } else if (userId) {
    url = `/api/db/getUser?userId=${userId}`;
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
  const bgg = bggUsername.toLowerCase();
  try {
    const response = await axios.get(`/api/bgg/user/${bgg}`);

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response.data, "application/xml");

    const xmlFirstName =
      xmlDoc.getElementsByTagName("firstname")[0]?.getAttribute("value")?.toLowerCase() ?? "";

    let xmlLastName =
      xmlDoc.getElementsByTagName("lastname")[0]?.getAttribute("value")?.toLowerCase() ?? "";

    const xmlYearRegistered =
      xmlDoc.getElementsByTagName("yearregistered")[0]?.getAttribute("value");

    // Fun easter egg preserved from the original
    if (xmlFirstName === "ian" && xmlLastName === "nelsen") xmlLastName = "nelson";
    if (bgg === "aquateenavenger") xmlLastName = "jensen";

    if (xmlYearRegistered !== "") {
      const gamesForUser = await getBggGamesForUser(bgg);
      const userId = await addUser(xmlFirstName, xmlLastName, bgg, gamesForUser);

      const capFirst = xmlFirstName.charAt(0).toUpperCase() + xmlFirstName.slice(1);
      const capLast = xmlLastName.charAt(0).toUpperCase() + xmlLastName.slice(1);

      return {
        success: true,
        firstName: xmlFirstName,
        lastName: xmlLastName,
        userId,
        message: `Welcome ${capFirst} ${capLast}! Redirecting to home page...`,
      };
    } else {
      return { success: false, message: `Username ${bgg} not found on BGG` };
    }
  } catch (e) {
    console.error("Error fetching BGG user details:", e);
    return {
      success: false,
      message: `Unable to retrieve BGG Account Details for ${bgg}`,
    };
  }
}

export async function getBggGamesForUser(bggUsername: string) {
  try {
    const response = await axios.get(`/api/bgg/user/${bggUsername}/collection`);
    return response.data;
  } catch (e) {
    console.error("Error fetching BGG game collection:", e);
    return null;
  }
}
