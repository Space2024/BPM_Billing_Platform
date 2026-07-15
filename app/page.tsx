import type { Metadata } from "next";

import { BlupeacockWelcome } from "@/components/home/blupeacock-welcome";

export const metadata: Metadata = {
  title: "Welcome to Blupeacock",
  description: "Join the Blupeacock membership programme.",
};

export default function Home() {
  return <BlupeacockWelcome />;
}
