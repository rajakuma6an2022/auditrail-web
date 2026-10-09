import { redirect } from "next/navigation";

// Day 1: always go to login. Day 2 will redirect to /events when signed in.
export default function Home() {
  redirect("/login");
}