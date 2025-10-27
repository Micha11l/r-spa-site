"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Profile = { first_name?: string | null; last_name?: string | null };

const nav = [
  { href: "/services", label: "Services" },
  { href: "/learn-more", label: "Therapies" }, // 如果你的路由是 /therapies 改这里
  { href: "/bistro", label: "Bistro" },
  { href: "/booking", label: "Booking" },
  { href: "/faq", label: "FAQ" },
];

const lineVariants = {
  openTop:  { rotate: 45,  y: 6 },
  openMid:  { opacity: 0 },
  openBot:  { rotate: -45, y: -6 },
  closed:   { rotate: 0,   y: 0, opacity: 1 },
};

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const supabase = useMemo(() => supabaseBrowser(), []);

  // 路由变化时自动收起
  useEffect(() => setOpen(false), [pathname]);

  // 打开抽屉时锁滚动 & Esc 关闭
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : prev || "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev || "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // 监听登录状态 + 拉取资料
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user ?? null;
      if (!mounted) return;

      if (!u) {
        setEmail(null);
        setProfile(null);
      } else {
        setEmail(u.email ?? null);
        const { data: p } = await supabase
          .from("profiles")
          .select("first_name,last_name")
          .eq("id", u.id)
          .single();
        if (mounted) setProfile(p ?? null);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const u = session?.user ?? null;
      setEmail(u?.email ?? null);
      if (!u) return setProfile(null);
      supabase
        .from("profiles")
        .select("first_name,last_name")
        .eq("id", u.id)
        .single()
        .then(({ data }) => setProfile(data ?? null));
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const accountLabel = (() => {
    const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
    return name || (email ?? "");
  })();

  // 动画
  const overlayVar = { hidden: { opacity: 0 }, show: { opacity: 1 }, exit: { opacity: 0 } };
  const drawerVar  = { hidden: { x: "100%" }, show: { x: 0 }, exit: { x: "100%" } };

  return (
    <>
      {/* header z-40，抽屉会在它之上 */}
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
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

            {/* 右：账号（桌面） */}
            <div className="ml-auto hidden items-center gap-3 md:flex">
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
              className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md border md:hidden"
              aria-label="Menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="relative block h-6 w-6">
                <motion.span
                  variants={lineVariants}
                  animate={open ? "openTop" : "closed"}
                  transition={{ duration: 0.18 }}
                  className="absolute left-0 top-1 block h-0.5 w-6 origin-center rounded bg-ink"
                />
                <motion.span
                  variants={lineVariants}
                  animate={open ? "openMid" : "closed"}
                  transition={{ duration: 0.18 }}
                  className="absolute left-0 top-3 block h-0.5 w-6 origin-center rounded bg-ink"
                />
                <motion.span
                  variants={lineVariants}
                  animate={open ? "openBot" : "closed"}
                  transition={{ duration: 0.18 }}
                  className="absolute left-0 top-5 block h-0.5 w-6 origin-center rounded bg-ink"
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 抽屉放在 header 外，z-50，白底不透，文字对比清晰 */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            variants={overlayVar}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={() => setOpen(false)}
          >
            <div className="absolute inset-0 bg-black/40" />
            <motion.aside
              variants={drawerVar}
              initial="hidden"
              animate="show"
              exit="exit"
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              className="absolute right-0 top-0 h-full w-[84%] max-w-sm bg-white shadow-2xl border-l
                         pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] p-6
                         flex flex-col text-zinc-900"
              onClick={(e) => e.stopPropagation()}
            >
              <nav className="flex-1 space-y-6 text-2xl font-serif">
                {nav.map((i) => (
                  <Link key={i.href} href={i.href} className="block hover:text-ink transition-colors">
                    {i.label}
                  </Link>
                ))}
              </nav>

              {email ? (
                <Link href="/account" className="btn btn-primary w-full">
                  My Account{accountLabel ? <span className="ml-1 opacity-80">({accountLabel})</span> : null}
                </Link>
              ) : (
                <Link href="/sign-in" className="btn btn-primary w-full">
                  Sign in
                </Link>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}