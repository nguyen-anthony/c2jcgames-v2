import axios from "axios";
import axiosRetry from "axios-retry";

axiosRetry(axios, { retries: 20 });

/* ── DB Interactions ──────────────────────────────────────────────────── */

export async function addGameToDb(gameId: string | number, userId: string | number) {
  try {
    await axios.post(`/api/db/addGame`, { gameId, userId });
    return {
      success: true,
      message: `Successfully added the game to the list!`,
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message: `Error occurred when adding the game to the list.`,
    };
  }
}

export async function addGameDetailsToDb(gameDetails: {
  gameId: string | number;
  name: string;
  imageUrl: string;
  minPlayers: string | number;
  maxPlayers: string | number;
  playTime: string | number;
  description: string;
}) {
  const { gameId, name, imageUrl, minPlayers, maxPlayers, playTime, description } =
    gameDetails;

  try {
    await axios.post(`/api/db/addGameDetails`, {
      gameId,
      name,
      imageUrl,
      minPlayers,
      maxPlayers,
      playTime,
      description,
    });
    return {
      success: true,
      message: `Successfully added game details for ${name}!`,
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message: `Error occurred when adding game details for ${name}.`,
    };
  }
}

export async function updateInterestedGameForUser(
  userId: string | number,
  gameId: string | number,
  action: "add" | "remove"
) {
  try {
    if (action === "add") {
      await axios.post(`/api/db/interestedGame`, { gameId, userId });
      return {
        success: true,
        message: `Successfully added interested game ${gameId} for user ${userId}`,
      };
    } else {
      await axios.delete(`/api/db/interestedGame`, {
        data: { gameId, userId },
      });
      return {
        success: true,
        message: `Successfully removed interested game ${gameId} for user ${userId}`,
      };
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: `Error occurred when updating interested game ${gameId} for user ${userId}`,
    };
  }
}

export async function getOwnedGamesCollection(userId: string | number) {
  try {
    const response = await axios.get(`/api/db/ownedGames/${userId}`);
    return response.data;
  } catch (e) {
    return null;
  }
}

export async function getOwnedGamesInGamesTable(userId: string | number) {
  try {
    const response = await axios.get(`/api/db/gamesList/owner/${userId}`);
    return response.data;
  } catch (e) {
    return null;
  }
}

export async function getGameDetailsFromDb(gameId: string | number) {
  try {
    const response = await axios.get(`/api/db/gameDetails/${gameId}`);
    return response.data;
  } catch (e) {
    return null;
  }
}

export async function getGamesList() {
  try {
    const response = await axios.get(`/api/db/gamesList`);
    return response.data;
  } catch (e) {
    return null;
  }
}

export async function getInterestedGamesForUser(userId: string | number) {
  try {
    const response = await axios.get(`/api/db/interestedGames/user/${userId}`);
    return response.data;
  } catch (e) {
    return null;
  }
}

/* ── BGG Interactions ─────────────────────────────────────────────────── */

export async function getGameDetailsFromBGG(gameId: string | number) {
  try {
    const response = await axios.get(`/api/bgg/boardgame/${gameId}`);
    return {
      success: true,
      data: response.data as {
        gameId: string;
        name: string;
        imageUrl: string;
        minPlayers: string;
        maxPlayers: string;
        playTime: string;
        description: string;
      },
      message: `Got the game details for ${response.data.name}! Adding to the list...`,
    };
  } catch (e: unknown) {
    console.error("Error fetching BGG game details:", e);
    let message: string;
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      message = `Game id ${gameId} not found in BGG`;
    } else {
      message = `Unable to retrieve BGG Game Details for id: ${gameId}`;
    }
    return { success: false, data: undefined, message };
  }
}
