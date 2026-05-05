import logo from "@/assets/logo.png";

export function AuthLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={logo}
        alt="Cash Maatje logo"
        className="h-9 w-9 rounded-lg object-contain"
        style={{ imageRendering: "pixelated" }}
      />
      <span className="text-lg font-semibold tracking-tight text-foreground">
        Cash Maatje
      </span>
    </div>
  );
}
