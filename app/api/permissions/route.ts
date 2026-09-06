import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listAllPermissions, grantPermission, revokePermission } from "@/lib/dynamodb";
import { isAdmin } from "@/lib/is-admin";

function adminOnly(email: string | null | undefined) {
  if (!isAdmin(email)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const deny = adminOnly(session?.user?.email);
  if (deny) return deny;

  const permissions = await listAllPermissions();
  return NextResponse.json(permissions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const deny = adminOnly(session?.user?.email);
  if (deny) return deny;

  const { email, accountId, allowedRoles } = await req.json();

  if (!email || !accountId || !allowedRoles?.length) {
    return NextResponse.json({ error: "email, accountId, and allowedRoles are required" }, { status: 400 });
  }

  const allowed = ["@citiuscloud.com", "@citiuscloud.in"];
  if (!allowed.some((d) => email.endsWith(d))) {
    return NextResponse.json({ error: "Only citiuscloud.com or citiuscloud.in emails allowed" }, { status: 400 });
  }

  await grantPermission({
    email: email.trim().toLowerCase(),
    accountId,
    allowedRoles,
    grantedBy: session!.user!.email!,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const deny = adminOnly(session?.user?.email);
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const accountId = searchParams.get("accountId");

  if (!email || !accountId) {
    return NextResponse.json({ error: "email and accountId are required" }, { status: 400 });
  }

  await revokePermission(email, accountId);
  return NextResponse.json({ success: true });
}
