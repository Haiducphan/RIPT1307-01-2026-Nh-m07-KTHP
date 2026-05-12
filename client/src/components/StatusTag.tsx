import { Tag } from 'antd';
import { BORROW_STATUS_COLOR, BORROW_STATUS_LABEL } from '@/constants/borrowStatus';
import type { BorrowStatus } from '@/types';

interface StatusTagProps {
  status: BorrowStatus;
}

export default function StatusTag({ status }: StatusTagProps) {
  return <Tag color={BORROW_STATUS_COLOR[status]}>{BORROW_STATUS_LABEL[status]}</Tag>;
}
