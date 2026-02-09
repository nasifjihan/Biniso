export default function Footer() {
  return (
    <footer className="border-t mt-16">
      <div className="container mx-auto py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Biniso. All rights reserved.
      </div>
    </footer>
  );
}
