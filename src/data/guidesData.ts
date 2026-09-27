import { GuideId, GuideTopic } from '../types/finance';

export const guidesData: Record<GuideId, GuideTopic> = {
  'safe-to-spend': {
    id: 'safe-to-spend',
    title: 'Daily Safe-to-Spend Velocity',
    subtitle: 'The secret to never running out of money before payday',
    badge: 'Core Breakthrough',
    concept: 'Standard budgeting only tells you what you already spent. Safe-to-Spend answers: "How much can I safely spend today?" It dynamically divides your remaining discretionary budget by the exact number of days left in the billing cycle.',
    steps: [
      'Look at your daily pace gauge on the dashboard every morning.',
      'If the gauge shows "Optimal Pace" (green), your spending is on target for the month.',
      'If you splurge on a large dinner, the pace recalibrates instantly for tomorrow without breaking your monthly cap.',
      'Log everyday purchases (lunch, fuel, groceries) using Quick Add to keep the velocity accurate.'
    ],
    proTip: 'Whenever you stay below your daily safe-to-spend limit, the surplus automatically increases your daily allowance for the rest of the month!'
  },
  'envelope-budget': {
    id: 'envelope-budget',
    title: 'Dynamic Envelope Budgeting & Smoothing',
    subtitle: 'Guilt-free budgeting that adapts to real life',
    badge: 'Zero-Guilt Method',
    concept: 'Envelopes partition your monthly income into dedicated spending categories (Groceries, Dining, Transport). When one category runs low, instead of failing your budget, BudgetFlow lets you dynamically rebalance surplus funds from another category with one click.',
    steps: [
      'Assign monthly spending limits to each category based on past habits.',
      'As you spend, the progress pillars fill up with color-coded warning thresholds.',
      'If Groceries hits 95% but Entertainment has $80 unused, tap "Rebalance" to move $50 from Entertainment to Groceries.',
      'Your overall monthly balance stays 100% intact, and you never feel budget guilt.'
    ],
    proTip: 'Set realistic targets first. Use the Rebalance button mid-month rather than giving up when one category overspends.'
  },
  'what-if': {
    id: 'what-if',
    title: '"What-If" Purchase Simulator',
    subtitle: 'Simulate big purchases before you swipe your card',
    badge: 'Decision Engine',
    concept: 'Before buying that $250 jacket or booking a weekend trip, test it in the simulator. BudgetFlow instantly calculates how it impacts your month-end balance, drops your daily Safe-to-Spend pace, and projects how many days it will delay your vacation savings goal.',
    steps: [
      'Click the "Simulator" button or press Ctrl+K.',
      'Enter the item name, estimated cost, and target category.',
      'Inspect the instant forecast: see the new daily pace, remaining buffer, and goal timeline impact.',
      'Make an informed choice with confidence: buy now, wait until next payday, or adjust your envelope!'
    ],
    proTip: 'Use this for any non-essential purchase over $50. Seeing the immediate delay on your vacation goal will naturally eliminate impulse buys.'
  },
  'savings-jars': {
    id: 'savings-jars',
    title: 'Visual 3D Savings Jars',
    subtitle: 'Turn savings goals into exciting family milestones',
    badge: 'Goal Tracking',
    concept: 'Saving money shouldn’t be abstract numbers on a spreadsheet. BudgetFlow models your goals as interactive visual pots (Vacation Fund, Emergency Shield, Tech Upgrade) with visual fill levels and celebratory milestone animations.',
    steps: [
      'Create a goal with a target amount, deadline, and custom theme color.',
      'Make recurring or ad-hoc deposits whenever you have surplus cash.',
      'Celebrate milestones with family members — reaching 25%, 50%, 75%, and 100% triggers celebratory canvas confetti!',
      'Watch your projected completion date update automatically based on your deposit pace.'
    ],
    proTip: 'Keep your Emergency Fund goal set to 3–6 months of basic expenses for true financial peace of mind.'
  },
  'pattern-lock': {
    id: 'pattern-lock',
    title: '9-Dot Pattern Authentication',
    subtitle: 'Fast, phone-style security built for household tablets',
    badge: 'Household Security',
    concept: 'Typing complex passwords on a kitchen tablet or shared phone is frustrating and slow. BudgetFlow uses a smooth 3x3 9-dot pattern lock — identical to Android lock screens — to let family members switch accounts and log expenses in less than 2 seconds.',
    steps: [
      'Each family member creates a secret connecting line across the 9 dots during setup.',
      'Swipe across your pattern to log into your personal profile or confirm an expense.',
      'Patterns are cryptographically hashed with per-user salts — even in self-hosted mode, patterns cannot be extracted in plain text.',
      'Admin users can easily reset a forgotten pattern for any family member from Family Settings.'
    ],
    proTip: 'A pattern connecting 4 to 6 dots is both extremely secure and lightning-fast to draw on a touch screen.'
  },
  'tablet-mode': {
    id: 'tablet-mode',
    title: 'Perpetual Tablet Kiosk Mode',
    subtitle: 'An always-on household financial command center',
    badge: 'Family Command',
    concept: 'Mount an old Android tablet (running Termux) or iPad on your kitchen counter or fridge. Tablet Mode provides a large, high-contrast, ambient display showing the household budget pulse, upcoming bills, and quick-action buttons for anyone to log expenses effortlessly.',
    steps: [
      'Mount your tablet and switch to Tablet Mode from the header or settings.',
      'Tap "+ Log", select your avatar, and swipe your 9-dot pattern.',
      'The quick logger opens pre-filtered with your permitted wallets.',
      'Enter the amount and merchant, then tap Save.',
      'The tablet automatically returns to the ambient household view after 15 seconds of inactivity.'
    ],
    proTip: 'Enable the Screen Wake Lock option in Tablet Mode so the tablet never goes to sleep while plugged in!'
  },
  'family-wallets': {
    id: 'family-wallets',
    title: 'Family Wallets & Granular Permissions',
    subtitle: 'Keep household accounts transparent yet securely segregated',
    badge: 'Multi-User Control',
    concept: 'In a family household, some accounts are shared (e.g. Joint Grocery Checking) while others are private (e.g. Teen Allowance, Personal Credit Cards). Admins can customize exactly which wallets each family member is allowed to view and log expenses against.',
    steps: [
      'Admins can visit Settings → Family Members to view all household users.',
      'Assign roles: Admin (full household authority) or Member (custom permissions).',
      'Use the wallet permission checkboxes to grant or restrict access to specific accounts.',
      'Members will only see their allowed wallets in account lists, transaction histories, and expense drop-downs.'
    ],
    proTip: 'Give teenagers access only to their "Allowance" and "Cash" wallets so they learn budgeting without seeing family mortgage or retirement accounts.'
  }
};
