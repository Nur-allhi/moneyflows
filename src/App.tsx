import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Agentation } from 'agentation';
import { Sidebar, BottomNav, Header, PageTransition } from './presentation/components';
import { useMemberStore } from './presentation/stores/useMemberStore';
import styles from './App.module.css';

const Dashboard = lazy(() => import('./presentation/screens/Dashboard').then(m => ({ default: m.Dashboard })));
const MemberList = lazy(() => import('./presentation/screens/MemberList').then(m => ({ default: m.MemberList })));
const MemberProfile = lazy(() => import('./presentation/screens/MemberProfile').then(m => ({ default: m.MemberProfile })));
const Loans = lazy(() => import('./presentation/screens/Loans').then(m => ({ default: m.Loans })));
const TransactionWizard = lazy(() => import('./presentation/screens/TransactionWizard').then(m => ({ default: m.TransactionWizard })));
const RecycleBin = lazy(() => import('./presentation/screens/RecycleBin').then(m => ({ default: m.RecycleBin })));
const Launcher = lazy(() => import('./presentation/screens/Launcher').then(m => ({ default: m.Launcher })));

const sidebarItems = [
  { path: '/', label: 'Dashboard', icon: '\u{1F3E0}' },
  { path: '/member', label: 'Members', icon: '\u{1F465}' },
  { path: '/loans', label: 'Loans', icon: '\u{1F4CB}' },
  { path: '/transaction', label: 'New Transaction', icon: '+' },
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
  '/transaction': 'New Transaction',
  '/recycle': 'Recycle Bin',
};

const noHeaderRoutes = new Set(['/transaction']);

function AppLayout() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  const basePath = '/' + (segments[0] ?? '');
  const title = routeTitles[basePath] ?? routeTitles[pathname] ?? '';
  const showBack = segments.length > 1 && basePath !== '/transaction';
  const showHeader = !noHeaderRoutes.has(basePath);

  const members = useMemberStore((s) => s.members);
  const fetchMembers = useMemberStore((s) => s.fetchMembers);
  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const breadcrumb = basePath === '/member' && segments.length >= 2
    ? [{ label: 'Members', path: '/member' }, { label: members.find((m) => m.id === decodeURIComponent(segments[1] ?? ''))?.name ?? decodeURIComponent(segments[1] ?? '') }]
    : undefined;

  return (
    <div className={styles.layout}>
      <Sidebar className={styles.sidebar} items={sidebarItems} footerLabel="Family" footerRole={`${members.length} members`} />
      <div className={styles.main}>
        {showHeader && (
          <Header title={title} showBack={showBack} showLogo={!showBack} breadcrumb={breadcrumb} />
        )}
        <div className={styles.content}>
          <Suspense fallback={<div className="skeleton skeleton-wizard" />}>
            <PageTransition excludePaths={['/transaction']}><Outlet /></PageTransition>
          </Suspense>
        </div>
      </div>
      <BottomNav className={styles.bottomNav} items={bottomNavItems} />
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
          <Route path="/transaction" element={<TransactionWizard />} />
          <Route path="/recycle" element={<RecycleBin />} />
        </Route>
      </Routes>
      {process.env.NODE_ENV === 'development' && <Agentation />}
    </BrowserRouter>
  );
}
