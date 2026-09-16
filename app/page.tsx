import { redirect } from "next/navigation";

export default function RootPage() {
  // Directly render your executive dashboard code here, 
  // OR redirect them instantly to wherever your master dashboard lives:
  redirect("/dashboard");
}