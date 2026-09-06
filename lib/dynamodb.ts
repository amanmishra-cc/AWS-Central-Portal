import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

export const db = DynamoDBDocumentClient.from(client);

export const CUSTOMERS_TABLE = process.env.CUSTOMERS_TABLE || "citius-customers";
export const AUDIT_TABLE = process.env.AUDIT_TABLE || "citius-audit-logs";
export const PERMISSIONS_TABLE = process.env.PERMISSIONS_TABLE || "citius-user-permissions";

export interface Customer {
  accountId: string;    // AWS Account ID — partition key
  name: string;         // Customer / company name — used for grouping
  accountName?: string; // Friendly name for this specific account (e.g. "Production")
  accessType?: string;  // e.g. ReadOnly, Administrator, PowerUser
  roleArn: string;      // arn:aws:iam::<accountId>:role/CitiusCloud-ReadOnly
  externalId?: string;  // ExternalId in role trust policy (leave blank if role has none)
  region: string;       // Default region for console login
  status: "active" | "inactive";
  onboardedAt: string;
}

export interface UserPermission {
  email: string;          // PK — team member email
  accountId: string;      // SK — AWS account ID
  allowedRoles: string[]; // e.g. ["ReadOnly", "PowerUser"]
  grantedBy: string;      // admin email who granted this
  grantedAt: string;
}

export async function listAllPermissions(): Promise<UserPermission[]> {
  const result = await db.send(new ScanCommand({ TableName: PERMISSIONS_TABLE }));
  return ((result.Items as UserPermission[]) || []).sort((a, b) => a.email.localeCompare(b.email));
}

export async function listUserPermissions(email: string): Promise<UserPermission[]> {
  const result = await db.send(
    new QueryCommand({
      TableName: PERMISSIONS_TABLE,
      KeyConditionExpression: "email = :e",
      ExpressionAttributeValues: { ":e": email },
    })
  );
  return (result.Items as UserPermission[]) || [];
}

export async function getUserPermission(email: string, accountId: string): Promise<UserPermission | null> {
  const result = await db.send(
    new GetCommand({ TableName: PERMISSIONS_TABLE, Key: { email, accountId } })
  );
  return (result.Item as UserPermission) || null;
}

export async function grantPermission(
  permission: Omit<UserPermission, "grantedAt">
): Promise<void> {
  await db.send(
    new PutCommand({ TableName: PERMISSIONS_TABLE, Item: { ...permission, grantedAt: new Date().toISOString() } })
  );
}

export async function revokePermission(email: string, accountId: string): Promise<void> {
  await db.send(new DeleteCommand({ TableName: PERMISSIONS_TABLE, Key: { email, accountId } }));
}

export interface AuditEntry {
  id: string;
  customerId: string;
  userId: string;      // CitiusCloud team member email
  action: string;      // e.g. "console:login"
  timestamp: string;
}

export async function listCustomers(): Promise<Customer[]> {
  const result = await db.send(new ScanCommand({ TableName: CUSTOMERS_TABLE }));
  const items = (result.Items as Customer[]) || [];
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCustomer(accountId: string): Promise<Customer | null> {
  const result = await db.send(
    new GetCommand({ TableName: CUSTOMERS_TABLE, Key: { accountId } })
  );
  return (result.Item as Customer) || null;
}

export async function createCustomer(
  customer: Omit<Customer, "onboardedAt">
): Promise<Customer> {
  const item: Customer = { ...customer, onboardedAt: new Date().toISOString() };
  await db.send(new PutCommand({ TableName: CUSTOMERS_TABLE, Item: item }));
  return item;
}

export async function updateCustomer(customer: Customer): Promise<void> {
  await db.send(new PutCommand({ TableName: CUSTOMERS_TABLE, Item: customer }));
}

export async function deleteCustomer(accountId: string): Promise<void> {
  await db.send(new DeleteCommand({ TableName: CUSTOMERS_TABLE, Key: { accountId } }));
}

export async function logAudit(entry: Omit<AuditEntry, "id" | "timestamp">): Promise<void> {
  await db.send(
    new PutCommand({
      TableName: AUDIT_TABLE,
      Item: {
        id: crypto.randomUUID(),
        ...entry,
        timestamp: new Date().toISOString(),
      },
    })
  );
}
