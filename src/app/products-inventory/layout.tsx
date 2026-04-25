import { Toaster } from 'sonner';

export default function ProductsInventoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="bottom-right" richColors />
    </>
  );
}
