export type Role = "consumer" | "merchant" | "admin";

export function homeForRole(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "merchant") return "/panel";
  return "/";
}
