// auth.js
import { cookies } from "next/headers";
import { verify, COOKIE_NAME } from "@/lib/session";

export async function getUserFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verify(token);
}