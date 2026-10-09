import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AuthHeader() {
  return (
    <header className="flex h-14 items-center justify-between px-4 sm:px-6">
      <Logo />
      <ThemeToggle />
    </header>
  );
}