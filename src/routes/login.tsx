import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/auth-form";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/login")({
  head: () => seo("Sign in", "Sign in to SmartBand as a school kid, elderly user or guardian."),
  component: () => <AuthForm mode="login" />,
});
