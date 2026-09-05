import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

export const db = DynamoDBDocumentClient.from(client);

export const CUSTOMERS_TABLE = process.env.CUSTOMERS_TABLE || "citius-customers";
export const AUDIT_TABLE = process.env.AUDIT_TABLE || "citius-audit-logs";

export interface Customer {
  accountId: string;    // AWS Account ID — partition key
  name: string;         // Customer / company name — used for grouping
  accountName?: string; // Friendly name for this specific account (e.g. "Production")
  roleArn: string;      // arn:aws:iam::<accountId>:role/CitiusCloud-ReadOnly
  externalId?: string;  // ExternalId in role trust policy (leave blank if role has none)
  region: string;       // Default region for console login
  status: "active" | "inactive";
  onboardedAt: string;
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
