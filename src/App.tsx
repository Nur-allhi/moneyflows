import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Sidebar, BottomNav, Header } from './presentation/components';
import { Dashboard, MemberProfile, Loans, TransactionWizard, RecycleBin, Launcher } from './presentation/screens';
import styles from './App.module.css';

const sidebarItems = [
  { path: '/', label: 'Dashboard', icon: '\u{1F3E0}' },
  { path: '/member/1', label: 'Members', icon: '\u{1F465}' },
  { path: '/loans', label: 'Loans', icon: '\u{1F4CB}' },
  { path: '/transaction', label: 'New Transaction', icon: '+' },
  { path: '/recycle', label: 'Recycle Bin', icon: '\u{1F5D1}\uFE0F' },
];

const bottomNavItems = [
  { path: '/', label: 'Home', icon: '\u{1F3E0}' },
  { path: '/member/1', label: 'Members', icon: '\u{1F465}' },
  { path: '/loans', label: 'Loans', icon: '\u{1F4CB}' },
  { path: '/recycle', label: 'Recycle', icon: '\u{1F5D1}\uFE0F' },
];

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/member': 'Member',
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

  const breadcrumb = basePath === '/member' && segments.length >= 2
    ? [{ label: 'Members', path: '/members' }, { label: decodeURIComponent(segments[1] ?? '') }]
    : undefined;

  return (
    <div className={styles.layout}>
      <Sidebar className={styles.sidebar} items={sidebarItems} footerLabel="Family" footerRole="4 members" />
      <div className={styles.main}>
        {showHeader && (
          <Header title={title} showBack={showBack} showLogo={!showBack} breadcrumb={breadcrumb} />
        )}
        <div className={styles.content}>
          <Outlet />
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
          <Route path="/member/:id" element={<MemberProfile />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/loans/:debtorId" element={<Loans />} />
          <Route path="/transaction" element={<TransactionWizard />} />
          <Route path="/recycle" element={<RecycleBin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
