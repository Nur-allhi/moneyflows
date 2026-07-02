import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Agentation } from 'agentation';
import { Sidebar, BottomNav, Header, PageTransition } from './presentation/components';
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

const sidebarItems = [
  { path: '/', label: 'Dashboard', icon: '\u{1F3E0}' },
  { path: '/member', label: 'Members', icon: '\u{1F465}' },
  { path: '/loans', label: 'Loans', icon: '\u{1F4CB}' },
  { path: '/recycle', label: 'Recycle Bin', icon: '\u{1F5D1}\uFE0F' },
];

const bottomNavItems = [
  { path: '/', label: 'Home', icon: '\u{1F3E0}' },
  { path: '/member', label: 'Members', icon: '\u{1F465}' },
  { path: '/loans', label: 'Loans', icon: '\u{1F4CB}' },
  { path: '/recycle', label: 'Recycle', icon: '\u{1F5D1}\uFE0F' },
];

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/member': 'Members',
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
      <Sidebar className={styles.sidebar} items={sidebarItems} footerLabel="Family" footerRole={`${members.length} members`} />
      <div className={styles.main}>
        <Header title={title} showBack={showBack} showLogo={!showBack} breadcrumb={breadcrumb} />
        <div className={styles.content}>
          <Suspense fallback={<div className="skeleton skeleton-wizard" />}>
            <PageTransition><Outlet /></PageTransition>
          </Suspense>
        </div>
      </div>
      <BottomNav className={styles.bottomNav} items={bottomNavItems} />
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
          <Route path="/loans" element={<Loans />} />
          <Route path="/loans/:debtorId" element={<Loans />} />
          <Route path="/recycle" element={<RecycleBin />} />
        </Route>
      </Routes>
      {process.env.NODE_ENV === 'development' && <Agentation />}
    </BrowserRouter>
  );
}
