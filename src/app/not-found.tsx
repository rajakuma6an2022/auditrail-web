import Link from "next/link";
import { ErrorScreen, linkButtonPrimaryClass } from "@/components/ui/error-screen";

export default function NotFound() {
  return (
    <ErrorScreen code="404" title="Page not found" description="The page you're looking for doesn't exist or has been moved.">
      <Link href="/events" className={linkButtonPrimaryClass}>
        Go to Events
      </Link>
    </ErrorScreen>
  );
}