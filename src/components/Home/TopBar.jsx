"use client";

export default function TopBar() {
  return (
    <div className="bg-foreground text-background text-sm">
      <div className="container mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-xs">HOT</span>
          <span>Free Express Shipping</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="opacity-80 hover:opacity-100">EN</a>
          <a href="#" className="opacity-80 hover:opacity-100">X</a>
          <a href="#" className="opacity-80 hover:opacity-100">FB</a>
          <a href="#" className="opacity-80 hover:opacity-100">IG</a>
        </div>
      </div>
    </div>
  );
}
