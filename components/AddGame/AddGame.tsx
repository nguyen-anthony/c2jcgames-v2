"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Container,
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Stack,
  CircularProgress,
  Card,
  Button,
  TextField,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CustomAlert from "@/components/Common/CustomAlert";
import PrimaryButton from "@/components/Common/PrimaryButton";
import BGGUrlForm from "./BGGUrlForm";
import BGGGameCard from "./BGGGameCard";
import BottomNav from "@/components/BottomNav/BottomNav";
import UserHeader from "@/components/UserHeader/UserHeader";
import useUser from "@/hooks/useUser";
import {
  addGameDetailsToDb,
  addGameToDb,
  getGameDetailsFromBGG,
  getGameDetailsFromDb,
  getOwnedGamesCollection,
  getOwnedGamesInGamesTable,
  getGamesList,
  removeGameFromDb,
  searchBggGames,
  type BggSearchResult,
} from "@/services/gameService";

type AlertInfo = {
  message: string;
  severity: "success" | "error" | "info" | "warning" | "";
};

interface BGGGame {
  gameid: string;
  name: string;
}

export default function AddGame() {
  const [alertInfo, setAlertInfo] = useState<AlertInfo>({
    message: "",
    severity: "",
  });
  const [tabValue, setTabValue] = useState(0);
  const [gameURL, setGameURL] = useState("");
  const [gameCollection, setGameCollection] = useState<BGGGame[]>([]);
  const [gamesListForUser, setGamesListForUser] = useState<string[]>([]);
  const [checkedGames, setCheckedGames] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BggSearchResult[]>([]);
  const [searchSelection, setSearchSelection] = useState<{ id: string; name: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchTruncated, setSearchTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [removalGames, setRemovalGames] = useState<BGGGame[]>([]);
  const [removalLoading, setRemovalLoading] = useState(false);
  const [removingGameId, setRemovingGameId] = useState<string | null>(null);
  const { userId, isBggUser } = useUser();

  useEffect(() => {
    if (isBggUser) {
      getOwnedGamesCollection(userId!).then((c) => {
        if (c) setGameCollection(c);
      });
    }

    if (userId) {
      getOwnedGamesInGamesTable(userId).then((owned) => {
        if (owned) setGamesListForUser(owned);
      });
    }
  }, [userId, isBggUser]);

  const extractGameId = useCallback((url: string) => {
    const match = url.match(/boardgame\/(\d+)/);
    return match ? match[1] : null;
  }, []);

  const fetchGamesListForUser = useCallback(async () => {
    if (!userId) return;
    const owned = await getOwnedGamesInGamesTable(userId);
    if (owned) setGamesListForUser(owned);
  }, [userId]);

  const loadRemovalGames = useCallback(async () => {
    if (!userId) return;
    setRemovalLoading(true);
    const [ownedIds, games] = await Promise.all([
      getOwnedGamesInGamesTable(userId),
      getGamesList(),
    ]);
    if (!ownedIds || !games) {
      setAlertInfo({ message: "Could not load your games. Please try again.", severity: "error" });
      setRemovalGames([]);
    } else {
      setGamesListForUser(ownedIds);
      const names = new Map<string, string>(
        games.map((game: { gameid: number | string; name: string }) => [
          String(game.gameid),
          game.name,
        ])
      );
      setRemovalGames(
        Array.from(new Set<string>(ownedIds)).map((id) => ({
          gameid: id,
          name: names.get(id) || `Game ${id}`,
        }))
      );
    }
    setRemovalLoading(false);
  }, [userId]);

  const handleRemoveGame = async (game: BGGGame) => {
    if (!userId || removingGameId) return;
    setRemovingGameId(game.gameid);
    setAlertInfo({ message: "", severity: "" });
    const result = await removeGameFromDb(game.gameid, userId);
    if (result.success) {
      setRemovalGames((games) => games.filter((item) => item.gameid !== game.gameid));
      setGamesListForUser((ids) => ids.filter((id) => id !== game.gameid));
      setAlertInfo({ message: `Removed your copy of ${game.name}.`, severity: "success" });
    } else {
      setAlertInfo({ message: `Could not remove ${game.name}. Please try again.`, severity: "error" });
    }
    setRemovingGameId(null);
  };

  const handleNonBGGSubmit = useCallback(async () => {
    const gameId = extractGameId(gameURL);
    if (!gameId) {
      setAlertInfo({ message: "Invalid BGG URL", severity: "error" });
      return;
    }
    if (gamesListForUser.includes(gameId)) {
      setAlertInfo({ message: "You already added this game", severity: "error" });
      return;
    }
    let inDb = (await getGameDetailsFromDb(gameId)) !== null;
    if (!inDb) {
      const bggRes = await getGameDetailsFromBGG(gameId);
                if (bggRes.success && bggRes.data) {
                  const addRes = await addGameDetailsToDb(bggRes.data);
        inDb = addRes.success;
        if (inDb) setGameURL("");
      } else {
        setAlertInfo({
          message: "Unable to get game details from BGG",
          severity: "error",
        });
        return;
      }
    }
    if (inDb) {
      const addRes = await addGameToDb(gameId, userId!);
      setAlertInfo({
        message: addRes.message,
        severity: addRes.success ? "success" : "error",
      });
      if (addRes.success) fetchGamesListForUser();
    }
  }, [extractGameId, gameURL, gamesListForUser, userId, fetchGamesListForUser]);

  const processGameChunks = useCallback(
    async (chunks: { id: string; name: string }[][]) => {
      const failed: { id: string; name: string }[] = [];
      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(async (game) => {
            try {
              let inDb = (await getGameDetailsFromDb(game.id)) !== null;
                if (!inDb) {
                  const bggRes = await getGameDetailsFromBGG(game.id);
                  if (bggRes.success && bggRes.data) {
                    const addRes = await addGameDetailsToDb(bggRes.data);
                  inDb = addRes.success;
                } else {
                  failed.push(game);
                  return;
                }
              }
              if (!inDb) {
                failed.push(game);
                return;
              }
              if (inDb) {
                const addRes = await addGameToDb(game.id, userId!);
                if (!addRes.success) failed.push(game);
              }
            } catch (e) {
              console.error(`Error processing gameID ${game.id}:`, e);
              failed.push(game);
            }
          })
        );
      }
      return failed;
    },
    [userId]
  );

  const handleSelectedGamesSubmit = useCallback(async (selectedGames: { id: string; name: string }[], source: "search" | "collection") => {
    const CHUNK_SIZE = 5;
    const chunks: { id: string; name: string }[][] = [];
    for (let i = 0; i < selectedGames.length; i += CHUNK_SIZE) {
      chunks.push(selectedGames.slice(i, i + CHUNK_SIZE));
    }
    const failed = await processGameChunks(chunks);
    await fetchGamesListForUser();
    const setSelection = source === "search" ? setSearchSelection : setCheckedGames;
    if (failed.length > 0) {
      setAlertInfo({
        message: `Failed to add: ${failed.map((g) => `${g.name} (ID: ${g.id})`).join(", ")}`,
        severity: "error",
      });
      setSelection(failed);
    } else {
      setAlertInfo({ message: "All games processed successfully.", severity: "success" });
      setSelection([]);
    }
  }, [processGameChunks, fetchGamesListForUser]);

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query || searching || loading) return;
    setSearching(true);
    setSearched(false);
    setSearchResults([]);
    setSearchSelection([]);
    setSearchTruncated(false);
    setAlertInfo({ message: "", severity: "" });
    const result = await searchBggGames(query);
    if (result.success) {
      setSearchResults(result.results);
      setSearchTruncated(result.truncated);
      setSearched(true);
    } else {
      setAlertInfo({ message: result.message, severity: "error" });
    }
    setSearching(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || loading || searching || tabValue === 3) return;
    if (tabValue === 2 && searchSelection.length === 0) return;
    setAlertInfo({ message: "Processing request...", severity: "info" });
    setLoading(true);
    try {
      if (tabValue === 0) await handleNonBGGSubmit();
      else if (tabValue === 1) await handleSelectedGamesSubmit(checkedGames, "collection");
      else await handleSelectedGamesSubmit(searchSelection, "search");
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (game: BGGGame) => {
    setCheckedGames((prev) =>
      prev.find((g) => g.id === game.gameid)
        ? prev.filter((g) => g.id !== game.gameid)
        : [...prev, { id: game.gameid, name: game.name }]
    );
  };

  const bggImportDisabled =
    !isBggUser || gameCollection.length === gamesListForUser.length;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2, pt: 2, pb: 1, flexShrink: 0 }}>
        <Container maxWidth="md" disableGutters>
          <UserHeader />
        </Container>
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, minHeight: 0, px: 2, pb: 2, display: "flex" }}>
        <Container
          maxWidth="sm"
          disableGutters
          sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}
        >
          <Paper
            elevation={2}
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
            }}
          >
            <Tabs
              value={tabValue}
              onChange={(_, v) => {
                setTabValue(v);
                setAlertInfo({ message: "", severity: "" });
                if (v === 3) void loadRemovalGames();
              }}
              variant="scrollable"
              scrollButtons="auto"
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab label="Add by BGG URL" disabled={loading || searching} />
              <Tab label="Import from BGG" disabled={loading || searching} />
              <Tab label="Search BGG" disabled={loading || searching} />
              <Tab label="Remove Games" disabled={loading || searching} />
            </Tabs>

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                p: { xs: 2, sm: 3 },
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
              }}
            >
              <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
                {tabValue === 0 && (
                  <BGGUrlForm gameURL={gameURL} setGameURL={setGameURL} />
                )}

                {tabValue === 1 && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      minHeight: 0,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {!isBggUser
                        ? "No BGG account linked. Sign in with your BGG username to import."
                        : gameCollection.length === gamesListForUser.length
                        ? "All your BGG games have already been added."
                        : `Select games to import (${checkedGames.length} selected)`}
                    </Typography>
                    <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                      {gameCollection.map((game) => (
                        <BGGGameCard
                          key={game.gameid}
                          game={game}
                          gamesListForUser={gamesListForUser}
                          handleCardClick={handleCardClick}
                          checkedGames={checkedGames}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {tabValue === 2 && (
                  <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: 1 }}>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <TextField
                        label="Search board games"
                        size="small"
                        fullWidth
                        value={searchQuery}
                        disabled={searching || loading}
                        slotProps={{ htmlInput: { maxLength: 200 } }}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void handleSearch();
                          }
                        }}
                      />
                      <Button type="button" variant="outlined" onClick={() => void handleSearch()} disabled={!searchQuery.trim() || searching || loading}>
                        {searching ? "Searching..." : "Search"}
                      </Button>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Select base games to add ({searchSelection.length} selected).
                      {searchTruncated && " Showing the first 100 matches; refine your search for more."}
                    </Typography>
                    <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                      {searching ? (
                        <CircularProgress size={24} aria-label="Searching BGG" />
                      ) : searched && searchResults.length === 0 ? (
                        <Typography color="text.secondary">No games found. Try another search.</Typography>
                      ) : (
                        searchResults.map((game) => (
                          <BGGGameCard
                            key={game.gameid}
                            game={game}
                            gamesListForUser={gamesListForUser}
                            checkedGames={searchSelection}
                            handleCardClick={(selected) => {
                              if (loading) return;
                              setSearchSelection((previous) => previous.some((item) => item.id === selected.gameid)
                                ? previous.filter((item) => item.id !== selected.gameid)
                                : [...previous, { id: selected.gameid, name: selected.name }]);
                            }}
                          />
                        ))
                      )}
                    </Box>
                  </Box>
                )}

                {tabValue === 3 && (
                  <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Remove games you are no longer bringing. Other people&apos;s copies stay on the list.
                    </Typography>
                    <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                      {removalLoading ? (
                        <CircularProgress size={24} aria-label="Loading your games" />
                      ) : removalGames.length === 0 ? (
                        <Typography color="text.secondary">No games to remove.</Typography>
                      ) : (
                        removalGames.map((game) => (
                          <Card
                            key={game.gameid}
                            variant="outlined"
                            sx={{ mb: 1, p: 1, display: "flex", alignItems: "center", gap: 1 }}
                          >
                            <Typography sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
                              {game.name}
                            </Typography>
                            <Button
                              type="button"
                              color="error"
                              startIcon={<DeleteOutlineIcon />}
                              disabled={removingGameId !== null}
                              onClick={() => void handleRemoveGame(game)}
                              aria-label={`Remove my copy of ${game.name}`}
                            >
                              {removingGameId === game.gameid ? "Removing..." : "Remove"}
                            </Button>
                          </Card>
                        ))
                      )}
                    </Box>
                  </Box>
                )}

                {alertInfo.message && (
                  <CustomAlert
                    severity={alertInfo.severity}
                    message={alertInfo.message}
                  />
                )}

                {tabValue !== 3 && <Box sx={{ mt: "auto !important" }}>
                  <PrimaryButton
                    type="submit"
                    disabled={
                      !userId || loading || searching ||
                      (tabValue === 1 && bggImportDisabled) ||
                      (tabValue === 1 && checkedGames.length === 0) ||
                      (tabValue === 2 && searchSelection.length === 0)
                    }
                  >
                    {loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      tabValue === 2 ? "Add selected games" : "Submit"
                    )}
                  </PrimaryButton>
                </Box>}
              </Stack>
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* Bottom nav */}
      <Box sx={{ flexShrink: 0 }}>
        <Container maxWidth="md" disableGutters>
          <BottomNav />
        </Container>
      </Box>
    </Box>
  );
}
