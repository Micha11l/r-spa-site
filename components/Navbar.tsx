"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Profile = { first_name?: string | null; last_name?: string | null };

const nav = [
  { href: "/services", label: "Services" },
  { href: "/learn-more", label: "Therapies" },
  { href: "/bistro", label: "Bistro" },
  { href: "/booking", label: "Booking" },
  { href: "/faq", label: "FAQ" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const supabase = useMemo(() => supabaseBrowser(), []);

  // 关闭抽屉
  useEffect(() => setOpen(false), [pathname]);

  // 监听登录状态 + 拉取个人资料
  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user ?? null;
      if (!mounted) return;

      if (!u) {
        setEmail(null);
        setProfile(null);
        return;
      }

      setEmail(u.email ?? null);

      // 拉取 profiles（你表的主键是 id=auth.uid()）
      const { data: p } = await supabase
        .from("profiles")
        .select("first_name,last_name")
        .eq("id", u.id)
        .single();

      if (!mounted) return;
      setProfile(p ?? null);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setEmail(u?.email ?? null);
      if (!u) {
        setProfile(null);
      } else {
        supabase
          .from("profiles")
          .select("first_name,last_name")
          .eq("id", u.id)
          .single()
          .then(({ data }) => setProfile(data ?? null));
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  // 按优先级展示姓名或邮箱
  const accountLabel = useMemo(() => {
    const name = [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    return name || (email ?? "");
  }, [email, profile]);

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      {/* 宽度全屏 + relative：左右固定，中间绝对居中 */}
      <div className="relative h-16 w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-full items-center">
          {/* 左：Logo */}
          <Link
            href="/"
            className="font-serif text-2xl underline decoration-ink/20 underline-offset-4"
          >
            Rejuvenessence
          </Link>

          {/* 中：主导航（绝对居中） */}
          <nav className="pointer-events-auto absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex gap-8">
            {nav.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className={`underline decoration-ink/20 underline-offset-4 hover:decoration-ink ${
                  pathname === i.href ? "decoration-ink" : ""
                }`}
              >
                {i.label}
              </Link>
            ))}
          </nav>

          {/* 右：账号区域 */}
          <div className="ml-auto hidden md:flex items-center gap-3">
            {email ? (
              <Link href="/account" className="btn btn-primary whitespace-nowrap">
                <span className="hidden sm:inline">My Account</span>
                <span className="hidden lg:inline">&nbsp;({accountLabel})</span>
                <span className="sm:hidden">Account</span>
              </Link>
            ) : (
              <Link href="/sign-in" className="btn btn-primary">
                Sign in
              </Link>
            )}
          </div>

          {/* 移动端汉堡 */}
          <button
            className="md:hidden ml-auto inline-flex h-9 w-9 items-center justify-center border"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="mb-1 block h-0.5 w-5 bg-ink" />
            <span className="mb-1 block h-0.5 w-5 bg-ink" />
            <span className="block h-0.5 w-5 bg-ink" />
          </button>
        </div>

        {/* 移动端抽屉 */}
        {open && (
          <div className="absolute inset-x-0 top-16 border-t bg-white md:hidden">
            <nav className="grid gap-3 px-4 py-3 sm:px-6 lg:px-8">
              {nav.map((i) => (
                <Link
                  key={i.href}
                  href={i.href}
                  className={`py-2 ${pathname === i.href ? "font-semibold" : ""}`}
                >
                  {i.label}
                </Link>
              ))}

              {email ? (
                <Link href="/account" className="btn btn-primary w-full mt-1">
                  My Account
                  {accountLabel ? (
                    <span className="ml-1 opacity-80">({accountLabel})</span>
                  ) : null}
                </Link>
              ) : (
                <Link href="/sign-in" className="btn btn-primary w-full mt-1">
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}