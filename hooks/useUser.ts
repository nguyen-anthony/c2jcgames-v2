"use client";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const useUser = () => {
  const setUser = (
    userId: string | number,
    firstName: string,
    lastName: string,
    bggacc: string | null
  ) => {
    localStorage.setItem("isBggUser", String(bggacc !== null));
    localStorage.setItem("userId", String(userId));
    localStorage.setItem("name", `${firstName} ${lastName}`);
    localStorage.setItem(
      "loginExpire",
      String(Date.now() + SESSION_DURATION_MS)
    );
  };

  const clearUser = () => {
    localStorage.removeItem("isBggUser");
    localStorage.removeItem("userId");
    localStorage.removeItem("name");
    localStorage.removeItem("loginExpire");
  };

  const isBggUser =
    typeof window !== "undefined"
      ? localStorage.getItem("isBggUser") === "true"
      : false;
  const name =
    typeof window !== "undefined" ? localStorage.getItem("name") : null;
  const loginExpire =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("loginExpire"))
      : null;
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  return { userId, setUser, isBggUser, name, loginExpire, clearUser };
};

export default useUser;
