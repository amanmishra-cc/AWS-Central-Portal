import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCustomer, getUserPermission, logAudit } from "@/lib/dynamodb";
import { assumeRole, generateConsoleUrl } from "@/lib/aws-session";
import { isAdmin } from "@/lib/is-admin";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { accountId, destination } = await req.json();
  if (!accountId) {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }

  // Fetch customer
  const customer = await getCustomer(accountId);
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  if (customer.status !== "active") return NextResponse.json({ error: "Account is inactive" }, { status: 403 });

  // Permission check — admins bypass, regular users must have explicit access
  if (!isAdmin(session.user.email)) {
    const permission = await getUserPermission(session.user.email, accountId);
    if (!permission) {
      return NextResponse.json({ error: "You don't have access to this account" }, { status: 403 });
    }
  }

  // Assume role and generate console URL
  const credentials = await assumeRole({
    roleArn: customer.roleArn,
    externalId: customer.externalId,
    userId: session.user.email,
  });

  const consoleUrl = await generateConsoleUrl(
    credentials,
    destination || `https://${customer.region}.console.aws.amazon.com/`
  );

  await logAudit({
    customerId: accountId,
    userId: session.user.email,
    action: "console:login",
  });

  return NextResponse.json({ url: consoleUrl });
}
