"use client";

import { IconButton, Link, Stack, Tooltip, Typography } from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import useUser from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { getUser } from "@/services/userService";
import { useEffect } from "react";
import { useThemeMode } from "@/components/MuiProvider";

function UserHeader() {
  const { name, setUser, userId, loginExpire } = useUser();
  const { mode, toggleMode } = useThemeMode();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (
        !userId ||
        !loginExpire ||
        loginExpire < Date.now() ||
        !(await getUser(null, userId))
      ) {
        router.push("/nametag");
      }
    })().catch(() => router.push("/nametag"));
  }, [userId, loginExpire, router]);

  const changeUser = () => {
    setUser("", "", "", null);
    router.push("/nametag");
  };

  if (!name) return null;

  const [firstName = "", lastName = ""] = name.split(" ");
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Typography variant="h6" sx={{ textAlign: "center" }}>
        Welcome {cap(firstName)} {cap(lastName)}&nbsp;&nbsp;
        <Link component="button" variant="body2" onClick={changeUser}>
          Not you?
        </Link>
      </Typography>
      <Tooltip title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}>
        <IconButton
          onClick={toggleMode}
          aria-label={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
          size="small"
        >
          {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

export default UserHeader;
