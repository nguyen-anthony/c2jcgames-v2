"use client";

import { Link, Typography } from "@mui/material";
import useUser from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { getUser } from "@/services/userService";
import { useEffect } from "react";

function UserHeader() {
  const { name, setUser, userId, loginExpire } = useUser();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (
        !userId ||
        !loginExpire ||
        loginExpire < Date.now() ||
        !(await getUser(null, null, null, userId))
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
    <Typography variant="h6" sx={{ textAlign: "center" }}>
      Welcome {cap(firstName)} {cap(lastName)}&nbsp;&nbsp;
      <Link component="button" variant="body2" onClick={changeUser}>
        Not you?
      </Link>
    </Typography>
  );
}

export default UserHeader;
