import React from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/views/DashboardView';
import { BudgetsView } from './components/views/BudgetsView';
import { ActivitiesView } from './components/views/ActivitiesView';
import { TransactionsView } from './components/views/TransactionsView';
import { BillsView } from './components/views/BillsView';
import { GoalsView } from './components/views/GoalsView';
import { WalletsView } from './components/views/WalletsView';
import { FamilyMembersView } from './components/views/FamilyMembersView';
import { SettingsView } from './components/views/SettingsView';
import { TabletKioskView } from './components/tablet/TabletKioskView';
import { MobileAppLayout } from './components/mobile/MobileAppLayout';
import { InitialSetupModal } from './components/auth/InitialSetupModal';
import { UserSelectModal } from './components/auth/UserSelectModal';
import { GuideModal } from './components/guide/GuideModal';
import { QuickAddModal } from './components/features/QuickAddModal';
import { CalendarSyncModal } from './components/features/CalendarSyncModal';
import { ActivityLogModal } from './components/features/ActivityLogModal';
import { AddRecurringModal } from './components/features/AddRecurringModal';
import { SmartAllocationModal } from './components/features/SmartAllocationModal';
import { RefreshPromptModal } from './components/features/RefreshPromptModal';

// Code-split heavy components containing recharts and heavy parsers to optimize tablet load time
const ReportsView = React.lazy(() => import('./components/views/ReportsView').then((m) => ({ default: m.ReportsView })));
const WhatIfSimulatorModal = React.lazy(() => import('./components/features/WhatIfSimulatorModal').then((m) => ({ default: m.WhatIfSimulatorModal })));
const CsvImportModal = React.lazy(() => import('./components/features/CsvImportModal').then((m) => ({ default: m.CsvImportModal })));

const AppContent: React.FC = () => {
  const {
    activeView,
    setActiveView,
    isTabletMode,
    isInitialSetupModalOpen,
    isUserSelectModalOpen,
    setIsUserSelectModalOpen,
    activeGuideId,
    setIsGuideOpenWithId,
    familyUsers,
    currentUser,
    switchUser,
    householdSettings,
    completeInitialSetup,
    isSelfHosted,
    isMobileOrTablet,
    previewMobileOnPc,
  } = useFinance();

  // Guard member views: members can only see dashboard, transactions, wallets, activities
  React.useEffect(() => {
    if (currentUser?.role === 'member' && !['dashboard', 'transactions', 'wallets', 'activities'].includes(activeView)) {
      setActiveView('dashboard');
    }
  }, [currentUser, activeView, setActiveView]);

  // Shared Modals rendered across both desktop and mobile layouts
  const renderSharedModals = () => (
    <>
      <QuickAddModal />
      <AddRecurringModal />
      <React.Suspense fallback={null}>
        <WhatIfSimulatorModal />
      </React.Suspense>
      <React.Suspense fallback={null}>
        <CsvImportModal />
      </React.Suspense>
      <CalendarSyncModal />
      <ActivityLogModal />
      <SmartAllocationModal />
      <RefreshPromptModal />
      <GuideModal
        guideId={activeGuideId}
        onClose={() => setIsGuideOpenWithId(null)}
      />
      <InitialSetupModal
        isOpen={isInitialSetupModalOpen}
        onCompleteSetup={completeInitialSetup}
      />
      <UserSelectModal
        isOpen={isUserSelectModalOpen}
        users={familyUsers}
        householdName={householdSettings.householdName}
        isSelfHosted={isSelfHosted}
        onSelectUser={(user) => switchUser(user)}
        onClose={currentUser ? () => setIsUserSelectModalOpen(false) : undefined}
      />
    </>
  );

  // If in Perpetual Tablet Mode, render full-screen Kiosk interface
  if (isTabletMode) {
    return (
      <>
        <TabletKioskView />
        <RefreshPromptModal />
        <GuideModal
          guideId={activeGuideId}
          onClose={() => setIsGuideOpenWithId(null)}
        />
      </>
    );
  }

  // If on Phone / Tablet device OR previewing mobile layout on PC:
  if (isMobileOrTablet || previewMobileOnPc) {
    return (
      <>
        <MobileAppLayout />
        {renderSharedModals()}
      </>
    );
  }

  const getPageInfo = () => {
    switch (activeView) {
      case 'dashboard':
        return {
          title: 'Dashboard',
          subtitle: "Here's your financial overview for this month.",
        };
      case 'budgets':
        return {
          title: 'Envelopes & Budgets',
          subtitle: 'Manage category spending caps and dynamically rebalance surplus funds.',
        };
      case 'activities':
        return {
          title: 'Activities & Household Schedule',
          subtitle: 'Coordinate family events, school schedules, outings, and chore rewards.',
        };
      case 'transactions':
        return {
          title: 'Transactions',
          subtitle: 'Search, filter, categorize, and bulk import statement records.',
        };
      case 'bills':
        return {
          title: 'Recurring',
          subtitle: 'Track recurring bills and income streams, and sync payment schedules with your device calendar.',
        };
      case 'goals':
        return {
          title: 'Savings Goals',
          subtitle: 'Visual jars and milestone celebrations for your future plans.',
        };
      case 'reports':
        return {
          title: 'Financial Analytics',
          subtitle: 'Algorithmic insights, spending velocity, and cash flow reports.',
        };
      case 'wallets':
        return {
          title: 'Accounts & Wallets',
          subtitle: 'Monitor liquid bank balances and maintain safe credit utilization.',
        };
      case 'family':
        return {
          title: 'Family Members & Roles',
          subtitle: 'Manage household users, configure wallet visibility permissions, and set 9-dot patterns.',
        };
      case 'settings':
        return {
          title: 'App Settings',
          subtitle: 'Manage preferences, currency format, and data backup / restore.',
        };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F6FA] dark:bg-[#0B131F] relative text-slate-800 dark:text-slate-100 transition-colors">
      {/* Ambient background lighting inspired by the logo */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-teal-300/15 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/4 -right-20 w-[480px] h-[480px] bg-cyan-400/12 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-20 left-1/3 w-96 h-96 bg-sky-400/10 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto relative z-10">
        <Header title={title} subtitle={subtitle} />

        {/* View Switcher */}
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'budgets' && <BudgetsView />}
        {activeView === 'activities' && <ActivitiesView />}
        {activeView === 'transactions' && <TransactionsView />}
        {activeView === 'bills' && <BillsView />}
        {activeView === 'goals' && <GoalsView />}
        {activeView === 'reports' && (
          <React.Suspense fallback={<div className="p-8 text-center text-slate-400">Loading reports...</div>}>
            <ReportsView />
          </React.Suspense>
        )}
        {activeView === 'wallets' && <WalletsView />}
        {activeView === 'family' && <FamilyMembersView />}
        {activeView === 'settings' && <SettingsView />}

        {/* Shared Modals */}
        {renderSharedModals()}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
};

export default App;
