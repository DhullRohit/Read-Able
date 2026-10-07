import { createFileRoute, redirect } from "@tanstack/react-router";
import ReadAbleDashboard from "@/components/ReadAbleDashboard";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("readable_token") : null;
    if (!token) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Dashboard — ReadAble" },
      {
        name: "description",
        content: "Personalized accessible reading dashboard with adjust text size, focus mode and progress tracking.",
      },
    ],
  }),
  component: ReadAbleDashboard,
});
