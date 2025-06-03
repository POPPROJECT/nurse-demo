'use client';

export default function ApproverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0F172A]">
      <div className="flex">
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
