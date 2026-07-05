import { lazy, Suspense, useEffect, type JSX } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Agentation } from 'agentation';
import { Sidebar, BottomNav, Header, PageTransition, RippleGlow } from './presentation/components';
import { ModalRenderer } from './presentation/modals/ModalRenderer';
import { useMemberStore } from './presentation/stores/useMemberStore';
import { useModalStore } from './presentation/stores/useModalStore';
import { getDatabase } from './infrastructure/database/getDatabase';
import styles from './App.module.css';

const Dashboard = lazy(() => import('./presentation/screens/Dashboard').then(m => ({ default: m.Dashboard })));
const MemberList = lazy(() => import('./presentation/screens/MemberList').then(m => ({ default: m.MemberList })));
const MemberProfile = lazy(() => import('./presentation/screens/MemberProfile').then(m => ({ default: m.MemberProfile })));
const Loans = lazy(() => import('./loans/presentation/screens/LoansScreen').then(m => ({ default: m.LoansScreen })));
const RecycleBin = lazy(() => import('./presentation/screens/RecycleBin').then(m => ({ default: m.RecycleBin })));
const Launcher = lazy(() => import('./presentation/screens/Launcher').then(m => ({ default: m.Launcher })));
const GroupsListScreen = lazy(() => import('./presentation/screens/GroupsListScreen').then(m => ({ default: m.GroupsListScreen })));
const GroupLedgerScreen = lazy(() => import('./presentation/screens/GroupLedgerScreen').then(m => ({ default: m.GroupLedgerScreen })));

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
  { path: '/recycle', label: 'Recycle Bin', icon: <Svg d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /> },
];

const bottomNavItems = [
  { path: '/', label: 'Home', icon: <Svg d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /> },
  { path: '/member', label: 'Members', icon: <Svg d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /> },
  { path: '/loans', label: 'Loans', icon: <Svg d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /> },
  { path: '/groups', label: 'Groups', icon: <Svg d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /> },
  { path: '/recycle', label: 'Recycle', icon: <Svg d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /> },
];

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/member': 'Members',
  '/groups': 'Groups',
  '/loans': 'Loans',
  '/recycle': 'Recycle Bin',
};

function AppLayout() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  const basePath = '/' + (segments[0] ?? '');
  const title = routeTitles[basePath] ?? routeTitles[pathname] ?? '';
  const showBack = segments.length > 1;

  const members = useMemberStore((s) => s.members);
  const fetchMembers = useMemberStore((s) => s.fetchMembers);
  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  useEffect(() => { useModalStore.getState().closeAllImmediate(); }, [pathname]);

  useEffect(() => {
    const db = getDatabase();
    if ('purgeExpiredItems' in db) {
      (db as any).purgeExpiredItems(30).catch(() => {});
    }
  }, []);

  const breadcrumb = basePath === '/member' && segments.length >= 2
    ? [{ label: 'Members', path: '/member' }, { label: members.find((m) => m.id === decodeURIComponent(segments[1] ?? ''))?.name ?? decodeURIComponent(segments[1] ?? '') }]
    : undefined;

  return (
    <div className={styles.layout}>
      <RippleGlow />
      <Sidebar className={styles.sidebar} items={sidebarItems} footerLabel="Family" footerRole={`${members.length} members`} />
      <div className={styles.main}>
        <Header title={title} showBack={showBack} showLogo={!showBack} breadcrumb={breadcrumb} className="app-header" />
        <div className={styles.content}>
          <Suspense fallback={<div className="skeleton skeleton-wizard" />}>
            <PageTransition><Outlet /></PageTransition>
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
        <Route path="/launcher" element={<Launcher />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/member" element={<MemberList />} />
          <Route path="/member/:id" element={<MemberProfile />} />
          <Route path="/groups" element={<GroupsListScreen />} />
          <Route path="/groups/:groupId" element={<GroupLedgerScreen />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/loans/:debtorId" element={<Loans />} />
          <Route path="/recycle" element={<RecycleBin />} />
        </Route>
      </Routes>
      {process.env.NODE_ENV === 'development' && <Agentation />}
    </BrowserRouter>
  );
}
