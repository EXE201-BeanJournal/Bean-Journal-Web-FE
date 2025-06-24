import {
  createRootRoute,
  Outlet,
  useRouterState,
  HeadContent,
} from "@tanstack/react-router";
import { ClerkAndThemeProvider } from "../main";
import { NotFoundPageContent } from "./__404";
import { useEffect } from "react";
import { useAuthProtection } from "@/utils/authUtils";

export const Route = createRootRoute({
  head: () => ({
    title:
      "Bean Journal – Your Journal, Amplified: AI Video & Productivity Tools",
    meta: [
      {
        name: "description",
        content:
          "Go beyond traditional journaling. Transform entries and images into dynamic videos with AI, while seamlessly managing tasks and tracking your progress.",
      },
      {
        name: "keywords",
        content:
          "digital journaling, AI video creation, productivity tools, mood tracking, journal entries, task management",
      },
      {
        property: "og:title",
        content: "Bean Journal – Your Journal, Amplified",
      },
      {
        property: "og:description",
        content:
          "Transform your journaling experience with AI-powered video creation and productivity tools.",
      },
      {
        property: "og:type",
        content: "website",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://beanjournal.site",
      },
    ],
  }),
  component: LandingRoot,
  notFoundComponent: NotFoundPageContent,
});

function LandingRoot() {
  const { location } = useRouterState();

  // Scroll to top instantly on every pathname change
  useEffect(() => {
    document.documentElement.scrollTo({ top: 0, behavior: "instant" });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <ClerkAndThemeProvider>
      <AuthProtector />
      <>
        <HeadContent />
        <div className="min-h-screen">
          <main id="app-theme-wrapper">
            <Outlet />
          </main>
          {/* <TanStackRouterDevtools /> */}
        </div>
      </>
    </ClerkAndThemeProvider>
  );
}

// Uses the auth hook within Clerk context
function AuthProtector() {
  useAuthProtection();
  return null;
}