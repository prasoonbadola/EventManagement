import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Compass,
  Calendar,
  Ticket,
  User as UserIcon,
  Menu,
  X,
  LogIn,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";
import { ProfileModal } from "../../features/auth/ProfileModal";
import { useConfirm } from "./ConfirmProvider";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const { user, signOut } = useAuth();
  const confirm = useConfirm();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleSignOut() {
    setMobileMenuOpen(false);
    const ok = await confirm({
      title: "Sign out?",
      message: `Are you sure you want to sign out, ${user?.name}?`,
      confirmText: "Sign out",
      cancelText: "Stay signed in",
      tone: "danger",
    });
    if (ok) signOut();
  }

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--card)] border-b-2 border-[var(--ink)] shadow-sm">
        <div className="w-full flex items-center justify-between py-2.5">
          {/* 1. Outermost Left: Brand Logo */}
          <div className="pl-4 sm:pl-6 lg:pl-8 flex items-center flex-none">
            <Link
              to="/"
              onClick={closeMobile}
              className="font-serif font-bold text-2xl text-[var(--ink)] no-underline flex items-center tracking-tight"
            >
              Gathr<span className="text-[var(--accent)]">.</span>
            </Link>
          </div>

          {/* 2. Middle Section: Aligned precisely with <main> (max-w-[1280px]) */}
          <div className="hidden md:flex flex-1 max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-10 items-center justify-between">
            {/* Left aligned: Discover & navigation links */}
            <nav className="flex items-center gap-6">
              <Link
                to="/"
                activeOptions={{ exact: true }}
                className="text-sm font-medium no-underline transition-colors pb-0.5"
                activeProps={{ className: "text-[var(--ink)] font-bold border-b-2 border-[var(--accent)]" }}
                inactiveProps={{ className: "text-[var(--ink)] hover:text-[var(--accent)]" }}
              >
                Discover
              </Link>
              {user?.role === "attendee" && (
                <Link
                  to="/me"
                  className="text-sm font-medium no-underline transition-colors pb-0.5"
                  activeProps={{ className: "text-[var(--ink)] font-bold border-b-2 border-[var(--accent)]" }}
                  inactiveProps={{ className: "text-[var(--ink)] hover:text-[var(--accent)]" }}
                >
                  My registrations
                </Link>
              )}
              {user?.role === "organizer" && (
                <Link
                  to="/organizer"
                  className="text-sm font-medium no-underline transition-colors pb-0.5"
                  activeProps={{ className: "text-[var(--ink)] font-bold border-b-2 border-[var(--accent)]" }}
                  inactiveProps={{ className: "text-[var(--ink)] hover:text-[var(--accent)]" }}
                >
                  My events
                </Link>
              )}
            </nav>

            {/* Right aligned: Theme toggle & user name */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              {user && (
                <button
                  className="link text-sm text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer font-medium no-underline flex items-center gap-1.5"
                  onClick={() => setProfileOpen(true)}
                  title="Edit profile & settings"
                >
                  <UserIcon className="w-4 h-4 text-[var(--muted)]" />
                  <span>{user.name}</span>
                  <span className="opacity-75">({user.role})</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Outermost Right: Sign out / Sign in Button & Mobile Toggle */}
          <div className="pr-4 sm:pr-6 lg:pr-8 flex items-center gap-2 sm:gap-3 flex-none">
            {/* Mobile Theme Toggle */}
            <div className="md:hidden">
              <ThemeToggle />
            </div>

            {/* Desktop Outermost Sign Out / Sign In */}
            <div className="hidden md:block">
              {user ? (
                <button className="btn small" onClick={handleSignOut}>
                  Sign out
                </button>
              ) : (
                <Link className="btn small primary" to="/login">
                  Sign in
                </Link>
              )}
            </div>

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg border-2 border-[var(--ink)] bg-[var(--card)] text-[var(--ink)] font-bold text-lg leading-none cursor-pointer hover:bg-[var(--bg)] transition-colors"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t-2 border-[var(--ink)] bg-[var(--card)] px-4 py-4 flex flex-col gap-3 shadow-lg animate-fade max-h-[calc(100vh-64px)] overflow-y-auto">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              onClick={closeMobile}
              className="text-base font-semibold py-2 px-3 rounded-lg no-underline transition-colors flex items-center gap-2"
              activeProps={{ className: "bg-[var(--bg)] text-[var(--accent)] border-l-4 border-[var(--accent)]" }}
              inactiveProps={{ className: "text-[var(--ink)] hover:bg-[var(--bg)]" }}
            >
              <Compass className="w-4 h-4" />
              <span>Discover Events</span>
            </Link>

            {user?.role === "attendee" && (
              <Link
                to="/me"
                onClick={closeMobile}
                className="text-base font-semibold py-2 px-3 rounded-lg no-underline transition-colors flex items-center gap-2"
                activeProps={{ className: "bg-[var(--bg)] text-[var(--accent)] border-l-4 border-[var(--accent)]" }}
                inactiveProps={{ className: "text-[var(--ink)] hover:bg-[var(--bg)]" }}
              >
                <Ticket className="w-4 h-4" />
                <span>My Registrations</span>
              </Link>
            )}

            {user?.role === "organizer" && (
              <Link
                to="/organizer"
                onClick={closeMobile}
                className="text-base font-semibold py-2 px-3 rounded-lg no-underline transition-colors flex items-center gap-2"
                activeProps={{ className: "bg-[var(--bg)] text-[var(--accent)] border-l-4 border-[var(--accent)]" }}
                inactiveProps={{ className: "text-[var(--ink)] hover:bg-[var(--bg)]" }}
              >
                <Calendar className="w-4 h-4" />
                <span>My Hosted Events</span>
              </Link>
            )}

            <div className="border-t border-[var(--line)] my-1 pt-2 flex flex-col gap-2">
              {user ? (
                <>
                  <button
                    className="text-left py-2 px-3 text-sm text-[var(--ink)] font-semibold rounded-lg hover:bg-[var(--bg)] transition-colors flex items-center justify-between"
                    onClick={() => {
                      closeMobile();
                      setProfileOpen(true);
                    }}
                  >
                    <span className="flex items-center gap-1.5">
                      <UserIcon className="w-4 h-4" />
                      <span>{user.name}</span>
                    </span>
                    <span className="text-xs uppercase tracking-wider text-[var(--muted)] font-normal">
                      {user.role}
                    </span>
                  </button>
                  <button
                    className="btn danger small w-full justify-center mt-1 flex items-center gap-1.5"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </>
              ) : (
                <Link
                  className="btn primary small w-full justify-center text-center mt-1 flex items-center gap-1.5"
                  to="/login"
                  onClick={closeMobile}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign in</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {user && <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />}
    </>
  );
}
