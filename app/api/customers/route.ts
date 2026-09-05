import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listCustomers, createCustomer, deleteCustomer } from "@/lib/dynamodb";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customers = await listCustomers();
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, accountName, accountId, roleArn, externalId, region } = body;

  if (!name || !accountId || !roleArn) {
    return NextResponse.json(
      { error: "name, accountId, and roleArn are required" },
      { status: 400 }
    );
  }

  // Validate AWS account ID format (12 digits)
  if (!/^\d{12}$/.test(accountId)) {
    return NextResponse.json(
      { error: "accountId must be a 12-digit AWS account number" },
      { status: 400 }
    );
  }

  // Validate role ARN format
  if (!roleArn.startsWith("arn:aws:iam::")) {
    return NextResponse.json(
      { error: "roleArn must be a valid IAM role ARN" },
      { status: 400 }
    );
  }

  const customer = await createCustomer({
    accountId,
    name: name.trim(),
    accountName: accountName?.trim() || undefined,
    roleArn: roleArn.trim(),
    externalId: externalId?.trim() || undefined,
    region: region || "ap-south-1",
    status: "active",
  });

  return NextResponse.json(customer, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");

  if (!accountId) {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }

  await deleteCustomer(accountId);
  return NextResponse.json({ success: true });
}
