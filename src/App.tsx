import { lazy, Suspense, useEffect, useState, useCallback, type JSX } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Agentation } from 'agentation';
import { Sidebar, BottomNav, Header, PageTransition, RippleGlow, SearchBar } from './presentation/components';
import { ModalRenderer } from './presentation/modals/ModalRenderer';
import { useMemberStore } from './presentation/stores/useMemberStore';
import { useModalStore } from './presentation/stores/useModalStore';
import { getDatabase } from './infrastructure/database/getDatabase';
import { ErrorBoundary, logger } from './core/logging';
import styles from './App.module.css';

const Dashboard = lazy(() => import('./presentation/screens/Dashboard').then(m => ({ default: m.Dashboard })));
const MemberList = lazy(() => import('./presentation/screens/MemberList').then(m => ({ default: m.MemberList })));
const MemberProfile = lazy(() => import('./presentation/screens/MemberProfile').then(m => ({ default: m.MemberProfile })));
const Loans = lazy(() => import('./loans/presentation/screens/LoansScreen').then(m => ({ default: m.LoansScreen })));
const RecycleBin = lazy(() => import('./presentation/screens/RecycleBin').then(m => ({ default: m.RecycleBin })));
const GroupsListScreen = lazy(() => import('./presentation/screens/GroupsListScreen').then(m => ({ default: m.GroupsListScreen })));
const TagLedgerScreen = lazy(() => import('./presentation/screens/TagLedgerScreen').then(m => ({ default: m.TagLedgerScreen })));const GroupLedgerScreen = lazy(() => import('./presentation/screens/GroupLedgerScreen').then(m => ({ default: m.GroupLedgerScreen })));
const SettingsPage = lazy(() => import('./presentation/screens/SettingsPage').then(m => ({ default: m.SettingsPage })));

function Svg({ d, children }: { d?: string; children?: JSX.Element }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {d ? <path d={d} /> : children}
    </svg>
  );
}

const sidebarItems = [
  { path: '/', label: 'Dashboard', icon: <Svg d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /> },
  { path: '/member', label: 'Members', icon: <Svg d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /> },
  { path: '/groups', label: 'Groups', icon: <Svg d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /> },
  { path: '/loans', label: 'Loans', icon: <Svg d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /> },
  { path: '/tags', label: 'Tags', icon: <Svg d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01" /> },
  { path: '/recycle', label: 'Recycle Bin', icon: <Svg d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /> },
];

const bottomNavItems = [
  { path: '/member', label: 'Members', icon: <Svg d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /> },
  { path: '/groups', label: 'Groups', icon: <Svg d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /> },
  { path: '/', label: 'Home', icon: <Svg d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /> },
  { path: '/loans', label: 'Loans', icon: <Svg d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /> },
  { path: '/tags', label: 'Tags', icon: <Svg d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01" /> },
  { path: '/recycle', label: 'Recycle', icon: <Svg d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /> },
];

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/member': 'Members',
  '/groups': 'Groups',
  '/loans': 'Loans',
  '/tags': 'Tags',
  '/recycle': 'Recycle Bin',
  '/settings': 'Settings',
};

function AppLayout() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  const basePath = '/' + (segments[0] ?? '');
  const title = routeTitles[basePath] ?? routeTitles[pathname] ?? '';

  const members = useMemberStore((s) => s.members);
  const fetchMembers = useMemberStore((s) => s.fetchMembers);
  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  useEffect(() => { logger.info('nav', `navigate ${pathname}`); }, [pathname]);
  useEffect(() => { useModalStore.getState().closeAllImmediate(); }, [pathname]);

  useEffect(() => {
    if (searchOpen) { setSearchOpen(false); setSearchClosing(false); }
    // Intentionally keyed on route change only; adding searchOpen would close the
    // overlay the moment it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    getDatabase().purgeExpiredItems(30).catch(() => {});
  }, []);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchClosing, setSearchClosing] = useState(false);
  const toggleSearch = useCallback(() => {
    if (searchOpen) {
      setSearchClosing(true);
      setTimeout(() => { setSearchOpen(false); setSearchClosing(false); }, 200);
    } else {
      setSearchOpen(true);
    }
  }, [searchOpen]);

  const breadcrumb = basePath === '/member' && segments.length >= 2
    ? [{ label: 'Members', path: '/member' }, { label: members.find((m) => m.id === decodeURIComponent(segments[1] ?? ''))?.name ?? decodeURIComponent(segments[1] ?? '') }]
    : basePath === '/groups' && segments.length >= 2
      ? [{ label: 'Groups', path: '/groups' }, { label: members.find((m) => m.id === decodeURIComponent(segments[1] ?? ''))?.name ?? decodeURIComponent(segments[1] ?? '') }]
      : basePath === '/tags' && segments[1]
        ? [{ label: 'Tags', path: '/tags' }, { label: decodeURIComponent(segments[1] ?? '') }]
        : basePath === '/loans' && segments[1]
          ? [{ label: 'Loans', path: '/loans' }, { label: decodeURIComponent(segments[1] ?? '') }]
          : undefined;

  const isDashboard = pathname === '/';

  return (
    <div className={styles.layout}>
      <RippleGlow />
      <Sidebar className={styles.sidebar} items={sidebarItems} footerLabel="Family" footerRole={`${members.length} members`} />
      <div className={styles.main}>
        <Header title={title} breadcrumb={breadcrumb} className="app-header" searchActive={searchOpen} onSearchToggle={toggleSearch} />
        {isDashboard && searchOpen && (
          <div className={`${styles.searchRow} ${searchClosing ? styles.searchPopin : styles.searchPopout}`}>
            <SearchBar />
            <button className={styles.searchCloseBtn} onClick={toggleSearch} aria-label="Close search">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
        )}
        <div className={styles.content}>
          <Suspense fallback={<div className="skeleton skeleton-wizard" />}>
            <ErrorBoundary><PageTransition><Outlet /></PageTransition></ErrorBoundary>
          </Suspense>
        </div>
      </div>
      <BottomNav items={bottomNavItems} />
      <ModalRenderer />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/member" element={<MemberList />} />
          <Route path="/member/:id" element={<MemberProfile />} />
          <Route path="/groups" element={<GroupsListScreen />} />
          <Route path="/groups/:groupId" element={<GroupLedgerScreen />} />
          <Route path="/tags" element={<TagLedgerScreen />} />
          <Route path="/tags/:tag" element={<TagLedgerScreen />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/loans/:debtorId" element={<Loans />} />
          <Route path="/recycle" element={<RecycleBin />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      {process.env.NODE_ENV === 'development' && <Agentation />}
    </BrowserRouter>
  );
}
