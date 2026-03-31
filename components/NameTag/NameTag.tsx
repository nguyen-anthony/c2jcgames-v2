"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  TextField,
  Divider,
  Box,
  Stack,
  Paper,
} from "@mui/material";
import {
  addUser,
  getUser,
  getBggUserDetails,
  getBggGamesForUser,
  updateBggUserGames,
} from "@/services/userService";
import { getOwnedGamesCollection } from "@/services/gameService";
import useUser from "@/hooks/useUser";
import CustomAlert from "@/components/Common/CustomAlert";
import PrimaryButton from "@/components/Common/PrimaryButton";

type AlertInfo = {
  message: string;
  severity: "success" | "error" | "info" | "warning" | "";
};

type ActiveForm = "NON_BGG" | "BGG";

export default function NameTag() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bggUsername, setBggUsername] = useState("");
  const [activeForm, setActiveForm] = useState<ActiveForm>("NON_BGG");
  const [alertInfo, setAlertInfo] = useState<AlertInfo>({
    message: "",
    severity: "",
  });
  const router = useRouter();
  const { setUser, clearUser } = useUser();

  useEffect(() => {
    clearUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigateHome = (
    userId: string | number,
    first: string,
    last: string,
    bggacc: string | null
  ) => {
    setTimeout(() => {
      setUser(userId, first, last, bggacc);
      router.push("/");
    }, 2500);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const existingUser = await getUser(firstName, lastName, bggUsername);

    if (existingUser) {
      const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
      setAlertInfo({
        message: `Welcome back ${cap(existingUser.firstname)} ${cap(existingUser.lastname)}! Redirecting to home page...`,
        severity: "success",
      });

      if (existingUser.bggacc) {
        const ownedGames = await getOwnedGamesCollection(existingUser.userid);
        const bggCollection = await getBggGamesForUser(existingUser.bggacc);
        if (
          bggCollection &&
          ownedGames?.length !== bggCollection.length &&
          bggCollection.length !== 0
        ) {
          updateBggUserGames(existingUser.bggacc, bggCollection);
        }
      }

      navigateHome(
        existingUser.userid,
        existingUser.firstname,
        existingUser.lastname,
        existingUser.bggacc
      );
    } else if (activeForm === "NON_BGG") {
      setAlertInfo({
        message: `Welcome ${firstName} ${lastName}! Redirecting to home page...`,
        severity: "success",
      });
      const userId = await addUser(firstName, lastName, "");
      if (userId) navigateHome(userId, firstName, lastName, null);
    } else {
      setAlertInfo({
        message: "Retrieving BGG Account Details...",
        severity: "info",
      });
      const bggDetails = await getBggUserDetails(bggUsername);
      if (bggDetails.success && bggDetails.userId) {
        setAlertInfo({ message: bggDetails.message!, severity: "success" });
        navigateHome(
          bggDetails.userId,
          bggDetails.firstName!,
          bggDetails.lastName!,
          bggUsername
        );
      } else {
        setAlertInfo({ message: bggDetails.message!, severity: "error" });
      }
    }
  };

  const nonBggOpacity = activeForm === "BGG" ? 0.4 : 1;
  const bggOpacity = activeForm === "NON_BGG" ? 0.4 : 1;

  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Paper
        elevation={3}
        sx={{ p: { xs: 3, sm: 4 }, width: "100%", borderRadius: 3 }}
      >
        <Stack spacing={3} alignItems="center">
          <Typography variant="h4" fontWeight={700} textAlign="center">
            C2JC Games
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Sign in to see who&apos;s interested in playing what
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ width: "100%" }}
          >
            <Stack spacing={3}>
              {/* Non-BGG section */}
              <Box sx={{ opacity: nonBggOpacity, transition: "opacity 0.2s" }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Non-BGG Users
                </Typography>
                <Stack spacing={1.5}>
                  <TextField
                    label="First Name"
                    variant="outlined"
                    fullWidth
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onFocus={() => setActiveForm("NON_BGG")}
                    size="small"
                  />
                  <TextField
                    label="Last Name"
                    variant="outlined"
                    fullWidth
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onFocus={() => setActiveForm("NON_BGG")}
                    size="small"
                  />
                </Stack>
              </Box>

              <Divider>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>

              {/* BGG section */}
              <Box sx={{ opacity: bggOpacity, transition: "opacity 0.2s" }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  BoardGameGeek Users
                </Typography>
                <TextField
                  label="BGG Username"
                  variant="outlined"
                  fullWidth
                  value={bggUsername}
                  onChange={(e) => setBggUsername(e.target.value)}
                  onFocus={() => setActiveForm("BGG")}
                  size="small"
                />
              </Box>

              <PrimaryButton type="submit">Sign In</PrimaryButton>

              {alertInfo.message && (
                <CustomAlert
                  severity={alertInfo.severity}
                  message={alertInfo.message}
                />
              )}
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
