import type { PublicUser } from "@/types/api";
import { api } from "./apiClient";

export const getUserData = (userId: string) =>
  api.get<{ data: PublicUser }>(`/users/${userId}`);
