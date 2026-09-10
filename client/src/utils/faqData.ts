export interface FaqItem {
  question: string;
  answer: string;
  category: 'General' | 'Payments' | 'Maintenance' | 'Account' | 'Landlord' | 'Tenant' | 'Caretaker';
}

export const FAQ_ITEMS: FaqItem[] = [
  // General
  {
    category: 'General',
    question: 'What is RentEase Kenya?',
    answer: 'RentEase Kenya is a rental property management system that helps landlords, tenants, and caretakers manage properties, rent payments, and maintenance requests in one place.',
  },
  {
    category: 'General',
    question: 'What are the three account types?',
    answer: 'Landlord (manages properties, tenants, and payments), Tenant (views their unit, payments, and submits maintenance requests), and Caretaker (manages day-to-day operations for an assigned property).',
  },
  {
    category: 'General',
    question: 'I forgot my password. What do I do?',
    answer: 'Currently, password resets are not self-service. Please contact your landlord (if you are a tenant or caretaker) or the system administrator to have your password reset manually.',
  },

  // Account
  {
    category: 'Account',
    question: 'How do I create an account?',
    answer: 'Go to the Register page, fill in your name, email, phone number, and password, then select your role (Landlord, Tenant, or Caretaker).',
  },
  {
    category: 'Account',
    question: 'Can I change my role after registering?',
    answer: 'No, a role is fixed once an account is created. If you need a different role, please register a new account with a different email address.',
  },

  // Payments
  {
    category: 'Payments',
    question: 'How is rent payment recorded?',
    answer: 'A landlord or caretaker records a payment by selecting the tenant, entering the amount, M-Pesa reference, and the month it covers. A PDF receipt is generated automatically.',
  },
  {
    category: 'Payments',
    question: 'Where can I find my payment receipts?',
    answer: 'Tenants can view and download all past receipts from the Payments page on their dashboard.',
  },
  {
    category: 'Payments',
    question: 'What do the payment status colours mean?',
    answer: 'Green means Paid in full, yellow means Partial payment, and red means Unpaid for the current month.',
  },
  {
    category: 'Payments',
    question: 'Does the system charge my M-Pesa automatically?',
    answer: 'In this version, payments are recorded manually by the landlord or caretaker after being received via M-Pesa. Automatic STK push charging may run in a test/sandbox mode depending on configuration.',
  },

  // Maintenance
  {
    category: 'Maintenance',
    question: 'How do I report a maintenance issue?',
    answer: 'Tenants can go to the Maintenance page, describe the issue, and optionally attach a photo. The landlord or an assigned caretaker will be notified.',
  },
  {
    category: 'Maintenance',
    question: 'How do I know if my maintenance request has been resolved?',
    answer: 'Check the status shown on your Maintenance page: Pending (not yet started), In Progress (being worked on), or Resolved (completed).',
  },

  // Landlord-specific
  {
    category: 'Landlord',
    question: 'How do I add a new property?',
    answer: 'Go to Properties, click "+ Add Property", and enter the property name and location. You can then add units to it.',
  },
  {
    category: 'Landlord',
    question: 'How do I assign a caretaker?',
    answer: 'When adding or editing a property, use the "Assign Caretaker" dropdown to select from registered caretaker accounts.',
  },
  {
    category: 'Landlord',
    question: 'How do I add a tenant?',
    answer: 'Go to Tenants, click "+ Add Tenant", choose to create a new tenant account or link an existing one, then assign them to a vacant unit.',
  },

  // Caretaker-specific
  {
    category: 'Caretaker',
    question: 'What can I do as a caretaker?',
    answer: 'You can view tenants and payment status for your assigned property, log payments on a tenant\u2019s behalf, and update maintenance request status.',
  },
];