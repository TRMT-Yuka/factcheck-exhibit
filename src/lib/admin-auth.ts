import "server-only";

import crypto from "node:crypto";

import { cookies } from "next/headers";

import { appEnv } from "@/lib/env";

export const ADMIN_COOKIE_NAME = "factcheck_exhibit_admin";

function adminCookieValue() {
  return crypto
    .createHash("sha256")
    .update(appEnv.adminPin)
    .digest("hex");
}

export function isAdminCookieValid(cookieValue?: string | null) {
  return cookieValue === adminCookieValue();
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return isAdminCookieValid(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export function getAdminCookieValueForSet() {
  return adminCookieValue();
}
