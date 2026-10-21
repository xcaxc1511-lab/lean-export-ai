import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isAdmin, loginAdmin, logoutAdmin } from "@/server/auth";

/** Is the current visitor signed in to the admin area? */
export const getAdminStatus = createServerFn({ method: "GET" }).handler(async () => ({
  admin: await isAdmin(),
}));

export const adminLogin = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ password: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ data }) => ({ ok: await loginAdmin(data.password) }));

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  await logoutAdmin();
  return { ok: true as const };
});
