import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { I18nProvider } from "./lib/i18n";
import { captureReferralFromUrl } from "./lib/referralCapture";
import "./index.css";

// Capture ?ref=CASH-XXXXXX from the URL early so it survives signup/login redirects
captureReferralFromUrl();

createRoot(document.getElementById("root")!).render(
  <I18nProvider>
    <App />
  </I18nProvider>,
);
