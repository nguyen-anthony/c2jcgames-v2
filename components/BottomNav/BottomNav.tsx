"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { BottomNavigation, BottomNavigationAction, Box } from "@mui/material";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import AddIcon from "@mui/icons-material/Add";

const BottomNav = () => {
  const router = useRouter();

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0) router.push("/");
    if (newValue === 1) router.push("/add");
  };

  return (
    <Box sx={{ borderTop: "1px solid", borderColor: "divider", width: "100%" }}>
      <BottomNavigation showLabels onChange={handleChange}>
        <BottomNavigationAction label="Games List" icon={<FormatListBulletedIcon />} />
        <BottomNavigationAction label="Add Game" icon={<AddIcon />} />
      </BottomNavigation>
    </Box>
  );
};

export default BottomNav;
