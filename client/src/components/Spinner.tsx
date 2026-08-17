export default function Spinner({ size = 'h-5 w-5' }: { size?: string }) {
  return <div className={`animate-spin ${size} border-2 border-brand-600 border-t-transparent rounded-full`} />;
}
