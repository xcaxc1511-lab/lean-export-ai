/** Admin roles and what each one may open. Shared by the server checks and the admin UI. */

export const ROLES = ["admin", "editor", "sales"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Quản trị",
  editor: "Biên tập viên",
  sales: "Sales",
};

export const ROLE_HINT: Record<Role, string> = {
  admin: "Toàn quyền: yêu cầu, hội thoại, tin tức, tài khoản, cài đặt, nhật ký",
  editor: "Viết, sửa và đăng tin tức",
  sales: "Xem và xử lý yêu cầu báo giá, trả lời hội thoại",
};

/** Admin areas; every server function and page belongs to one. */
export type Area = "enquiries" | "chats" | "posts" | "media" | "users" | "audit" | "settings";

const ACCESS: Record<Area, readonly Role[]> = {
  enquiries: ["admin", "sales"],
  chats: ["admin", "sales"],
  posts: ["admin", "editor"],
  media: ["admin", "editor"],
  users: ["admin"],
  audit: ["admin"],
  settings: ["admin"],
};

export const canAccess = (role: Role | undefined | null, area: Area) =>
  !!role && ACCESS[area].includes(role);

/** Which area an admin URL belongs to (null = available to every signed-in user). */
export function areaOfPath(pathname: string): Area | null {
  if (pathname === "/admin" || pathname === "/admin/") return "enquiries";
  if (pathname.startsWith("/admin/chats")) return "chats";
  if (pathname.startsWith("/admin/news")) return "posts";
  if (pathname.startsWith("/admin/media")) return "media";
  if (pathname.startsWith("/admin/users")) return "users";
  if (pathname.startsWith("/admin/activity")) return "audit";
  if (pathname.startsWith("/admin/settings")) return "settings";
  return null;
}

/** First page a role should land on after signing in. */
export const homeFor = (role: Role) => (role === "editor" ? "/admin/news" : "/admin");
