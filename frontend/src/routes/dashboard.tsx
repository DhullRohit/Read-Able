import { createFileRoute } from "@tanstack/react-router";
import ReadAbleDashboard from "@/components/ReadAbleDashboard";

export const Route = createFileRoute("/dashboard")({
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
