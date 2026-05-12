export const BORROW_STATUS_LABEL = {
  pending: 'Cho duyet',
  approved: 'Da duyet',
  rejected: 'Tu choi',
  borrowed: 'Dang muon',
  returned: 'Da tra',
  overdue: 'Qua han'
} as const;

export const BORROW_STATUS_COLOR = {
  pending: 'gold',
  approved: 'blue',
  rejected: 'red',
  borrowed: 'processing',
  returned: 'green',
  overdue: 'volcano'
} as const;
