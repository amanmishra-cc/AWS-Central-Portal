import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCustomer } from "@/lib/dynamodb";
import { Navbar } from "@/components/navbar";
import { EditCustomerForm } from "@/components/edit-customer-form";

export default async function EditCustomerPage({
  params,
}: {
  params: { accountId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const customer = await getCustomer(params.accountId);
  if (!customer) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <Navbar userEmail={session.user?.email} userName={session.user?.name} />
      <main className="max-w-lg mx-auto px-4 py-10">
        <EditCustomerForm customer={customer} />
      </main>
    </div>
  );
}
