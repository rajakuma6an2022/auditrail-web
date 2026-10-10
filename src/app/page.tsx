import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Signed-in users (session cookie present) go to the explorer, everyone else to login.
export default async function Home() {
  const hasSession = (await cookies()).has("auditrail_session");
  redirect(hasSession ? "/events" : "/login");
}
