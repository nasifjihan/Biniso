import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t mt-6">
      <div className="container mx-auto py-4 text-center text-sm text-muted-foreground space-y-2">
        <nav className="flex items-center justify-center gap-4">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/refund-policy" className="hover:text-foreground">
            Refund Policy
          </Link>
        </nav>
        <div>© {new Date().getFullYear()} Biniso. All rights reserved.</div>
      </div>
    </footer>
  );
}
