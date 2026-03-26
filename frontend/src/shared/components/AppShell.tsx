import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import type { AppLanguage, User } from "../types";
import { useI18n } from "../i18n";

interface AppShellProps {
  activeUser: User | null;
  onOpenUserGate: () => void;
  children: ReactNode;
}

const navigation = [
  { to: "/assessment", labelKey: "navAssessment", eyebrow: "Assessment" },
  { to: "/archive", labelKey: "navArchive", eyebrow: "Archive" },
  { to: "/treatment", labelKey: "navTreatment", eyebrow: "Treatment" },
  { to: "/users", labelKey: "navUsers", eyebrow: "Users" }
] as const;

export function AppShell({ activeUser, onOpenUserGate, children }: AppShellProps) {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-card">
          <span className="eyebrow">Claude-style Console</span>
          <h1>VLM Phototherapy</h1>
          <p>{t("brandDescription")}</p>
        </div>

        <nav className="nav-list">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <span className="nav-eyebrow">{item.eyebrow}</span>
              <strong>{t(item.labelKey)}</strong>
            </NavLink>
          ))}
        </nav>

        <div className="language-card">
          <span className="eyebrow">{t("language")}</span>
          <div className="language-switch">
            <button
              type="button"
              className={`language-pill ${language === "en" ? "active" : ""}`}
              onClick={() => setLanguage("en")}
            >
              English
            </button>
            <button
              type="button"
              className={`language-pill ${language === "zh" ? "active" : ""}`}
              onClick={() => setLanguage("zh")}
            >
              中文
            </button>
          </div>
        </div>

        <button className="user-summary" type="button" onClick={onOpenUserGate}>
          <span className="eyebrow">{t("activeSubject")}</span>
          <strong>{activeUser ? activeUser.name : t("selectUser")}</strong>
          <span>{activeUser ? activeUser.public_id : t("bindUserFirst")}</span>
        </button>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}
