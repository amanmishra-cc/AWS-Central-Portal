import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCustomer, logAudit } from "@/lib/dynamodb";
import { assumeRole, generateConsoleUrl } from "@/lib/aws-session";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { accountId, destination } = body;

  if (!accountId) {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }

  // Fetch customer from DynamoDB
  const customer = await getCustomer(accountId);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  if (customer.status !== "active") {
    return NextResponse.json({ error: "Customer account is inactive" }, { status: 403 });
  }

  // Assume the customer's IAM role
  const credentials = await assumeRole({
    roleArn: customer.roleArn,
    externalId: customer.externalId,
    userId: session.user.email,
  });

  // Generate AWS Console federation URL
  const consoleUrl = await generateConsoleUrl(
    credentials,
    destination || `https://${customer.region}.console.aws.amazon.com/`
  );

  // Audit log — record who accessed which account
  await logAudit({
    customerId: accountId,
    userId: session.user.email,
    action: "console:login",
  });

  return NextResponse.json({ url: consoleUrl });
}
