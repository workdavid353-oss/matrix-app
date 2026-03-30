'use client';
import { useTranslations } from 'next-intl';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { Home, FolderOpen, Clock, Bell, ShieldCheck, Users, LogOut, Sun, Moon, Globe, Menu, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';

interface SidebarProps {
  role: 'admin' | 'member';
}

export default function Sidebar({ role }: SidebarProps) {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const { locale } = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  function switchLocale() {
    const next = locale === 'en' ? 'he' : 'en';
    const stripped = pathname.replace(/^\/(en|he)/, '');
    window.location.href = `/${next}${stripped}`;
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/auth/login`);
    router.refresh();
  }

  const links = [
    { href: `/${locale}`, label: t('home'), icon: Home },
    { href: `/${locale}/projects`, label: t('projects'), icon: FolderOpen },
    { href: `/${locale}/history`, label: t('history'), icon: Clock },
    { href: `/${locale}/updates`, label: t('updates'), icon: Bell },
    { href: `/${locale}/members`, label: t('members'), icon: Users },
    ...(role === 'admin' ? [{ href: `/${locale}/dashboard`, label: t('admin'), icon: ShieldCheck }] : []),
  ];

  const navContent = (isMobile = false) => (
    <>
      {/* Logo + close */}
      <div className="px-3 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
        {(!collapsed || isMobile) ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">M</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              יוצאים מהמטריקס
            </span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center mx-auto">
            <span className="text-white text-sm font-bold">M</span>
          </div>
        )}
        {(!collapsed || isMobile) && (
          <button
            onClick={() => isMobile ? setMobileOpen(false) : setCollapsed(true)}
            className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {collapsed && !isMobile && (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mb-2"
          >
            <Menu size={16} />
          </button>
        )}
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== `/${locale}` && pathname.startsWith(href));
          const mini = collapsed && !isMobile;
          return (
            <Link
              key={href}
              href={href}
              title={mini ? label : undefined}
              className={clsx(
                'flex items-center rounded-lg text-sm transition-colors',
                mini ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2',
                active
                  ? 'bg-brand-50 dark:bg-brand-800/20 text-brand-800 dark:text-brand-100 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <Icon size={16} />
              {!mini && label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div className="px-2 py-4 border-t border-gray-100 dark:border-gray-800 space-y-0.5">
        {[
          { onClick: toggleTheme, icon: dark ? <Sun size={16} /> : <Moon size={16} />, label: tc('darkMode') },
          { onClick: switchLocale, icon: <Globe size={16} />, label: locale === 'en' ? 'עברית' : 'English' },
          { onClick: handleLogout, icon: <LogOut size={16} />, label: t('logout') },
        ].map(({ onClick, icon, label }, i) => {
          const mini = collapsed && !isMobile;
          return (
            <button key={i} onClick={onClick} title={mini ? label : undefined}
              className={clsx(
                'w-full flex items-center rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                mini ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2'
              )}
            >
              {icon}
              {!mini && label}
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={clsx(
        'hidden md:flex fixed top-0 start-0 h-screen bg-white dark:bg-gray-900 border-e border-gray-200 dark:border-gray-800 flex-col z-30 transition-all duration-200',
        collapsed ? 'w-14' : 'w-60'
      )}>
        {navContent()}
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 start-4 z-40 p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 shadow-sm"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex" onClick={() => setMobileOpen(false)}>
          <div className="fixed inset-0 bg-black/40" />
          <aside
            className="relative w-72 max-w-[80vw] h-full bg-white dark:bg-gray-900 flex flex-col start-0"
            onClick={e => e.stopPropagation()}
          >
            {navContent(true)}
          </aside>
        </div>
      )}

      {/* Desktop content offset */}
      <style>{`
        @media (min-width: 768px) {
          .main-content { margin-inline-start: ${collapsed ? '3.5rem' : '15rem'}; transition: margin-inline-start 0.2s; }
        }
        @media (max-width: 767px) {
          .main-content { margin-inline-start: 0 !important; width: 100%; padding-top: 3.5rem; }
        }
      `}</style>
    </>
  );
}
