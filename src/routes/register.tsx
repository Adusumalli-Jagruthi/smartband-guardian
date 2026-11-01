import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/auth-form";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/register")({
  head: () => seo("Create account", "Register for SmartBand and choose your role: school kid, elderly or guardian."),
  component: () => <AuthForm mode="register" />,
});
