import { notFound } from "next/navigation";
import { isAdminUser } from "@/features/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminUser())) notFound();

  return <div className="mx-auto max-w-2xl px-6 py-8">{children}</div>;
}
