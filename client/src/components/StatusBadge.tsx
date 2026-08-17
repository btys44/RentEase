const COLORS: Record<string, string> = {
  PAID: 'bg-green-100 text-green-800',
  PARTIAL: 'bg-yellow-100 text-yellow-800',
  UNPAID: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-green-100 text-green-800',
  OCCUPIED: 'bg-green-100 text-green-800',
  VACANT: 'bg-gray-100 text-gray-700',
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = COLORS[status] || 'bg-gray-100 text-gray-700';
  const label = status.replace('_', ' ');
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}
