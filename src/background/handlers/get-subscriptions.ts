import { fetchUserSubscriptions } from "../youtube-api";

export async function handleGetSubscriptions() {
  return fetchUserSubscriptions();
}
