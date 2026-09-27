import React from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/views/DashboardView';
import { BudgetsView } from './components/views/BudgetsView';
import { TransactionsView } from './components/views/TransactionsView';
import { BillsView } from './components/views/BillsView';
import { GoalsView } from './components/views/GoalsView';
import { ReportsView } from './components/views/ReportsView';
import { WalletsView } from './components/views/WalletsView';
import { FamilyMembersView } from './components/views/FamilyMembersView';
import { SettingsView } from './components/views/SettingsView';
import { TabletKioskView } from './components/tablet/TabletKioskView';
import { InitialSetupModal } from './components/auth/InitialSetupModal';
import { UserSelectModal } from './components/auth/UserSelectModal';
import { GuideModal } from './components/guide/GuideModal';
import { QuickAddModal } from './components/features/QuickAddModal';
import { WhatIfSimulatorModal } from './components/features/WhatIfSimulatorModal';
import { CsvImportModal } from './components/features/CsvImportModal';
import { CalendarSyncModal } from './components/features/CalendarSyncModal';
import { ActivityLogModal } from './components/features/ActivityLogModal';
import { AddRecurringModal } from './components/features/AddRecurringModal';

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
  } = useFinance();

  // Guard member views: members can only see dashboard, transactions, wallets, settings
  React.useEffect(() => {
    if (currentUser?.role === 'member' && !['dashboard', 'transactions', 'wallets', 'settings'].includes(activeView)) {
      setActiveView('dashboard');
    }
  }, [currentUser, activeView, setActiveView]);

  // If in Perpetual Tablet Mode, render full-screen Kiosk interface
  if (isTabletMode) {
    return (
      <>
        <TabletKioskView />
        <GuideModal
          guideId={activeGuideId}
          onClose={() => setIsGuideOpenWithId(null)}
        />
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
    <div className="flex min-h-screen bg-[#F0F6FA] relative overflow-hidden text-slate-800">
      {/* Ambient background lighting inspired by the logo */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-teal-300/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/4 -right-20 w-[480px] h-[480px] bg-cyan-400/12 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-20 left-1/3 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto overflow-y-auto relative z-10">
        <Header title={title} subtitle={subtitle} />

        {/* View Switcher */}
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'budgets' && <BudgetsView />}
        {activeView === 'transactions' && <TransactionsView />}
        {activeView === 'bills' && <BillsView />}
        {activeView === 'goals' && <GoalsView />}
        {activeView === 'reports' && <ReportsView />}
        {activeView === 'wallets' && <WalletsView />}
        {activeView === 'family' && <FamilyMembersView />}
        {activeView === 'settings' && <SettingsView />}

        {/* Feature Modals */}
        <QuickAddModal />
        <AddRecurringModal />
        <WhatIfSimulatorModal />
        <CsvImportModal />
        <CalendarSyncModal />
        <ActivityLogModal />

        {/* Contextual Guide Modal */}
        <GuideModal
          guideId={activeGuideId}
          onClose={() => setIsGuideOpenWithId(null)}
        />

        {/* Clean Slate Initial Setup Modal (Shown on fresh self-hosted install) */}
        <InitialSetupModal
          isOpen={isInitialSetupModalOpen}
          onCompleteSetup={completeInitialSetup}
        />

        {/* Family Member Selection & 9-Dot Lock Screen Modal */}
        <UserSelectModal
          isOpen={isUserSelectModalOpen}
          users={familyUsers}
          householdName={householdSettings.householdName}
          isSelfHosted={isSelfHosted}
          onSelectUser={(user) => switchUser(user)}
          onClose={currentUser ? () => setIsUserSelectModalOpen(false) : undefined}
        />
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
