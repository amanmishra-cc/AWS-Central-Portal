/**
 * Seed script — adds Ekishwar as the first customer.
 * Run with: npm run seed
 *
 * Requires AWS credentials with DynamoDB write access.
 * On EC2, this uses the instance profile automatically.
 * Locally, set AWS_PROFILE or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, CreateTableCommand, DescribeTableCommand } from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || "ap-south-1";
const CUSTOMERS_TABLE = process.env.CUSTOMERS_TABLE || "citius-customers";
const AUDIT_TABLE = process.env.AUDIT_TABLE || "citius-audit-logs";

const client = new DynamoDBClient({ region: REGION });
const db = DynamoDBDocumentClient.from(client);

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch {
    return false;
  }
}

async function createTable(tableName: string, partitionKey: string) {
  console.log(`Creating table: ${tableName}`);
  await client.send(
    new CreateTableCommand({
      TableName: tableName,
      KeySchema: [{ AttributeName: partitionKey, KeyType: "HASH" }],
      AttributeDefinitions: [{ AttributeName: partitionKey, AttributeType: "S" }],
      BillingMode: "PAY_PER_REQUEST",
    })
  );
  // Wait a moment for table to be active
  await new Promise((r) => setTimeout(r, 3000));
  console.log(`Table ${tableName} created.`);
}

async function main() {
  console.log(`Region: ${REGION}`);

  // Create tables if they don't exist
  if (!(await tableExists(CUSTOMERS_TABLE))) {
    await createTable(CUSTOMERS_TABLE, "accountId");
  } else {
    console.log(`Table ${CUSTOMERS_TABLE} already exists.`);
  }

  if (!(await tableExists(AUDIT_TABLE))) {
    await createTable(AUDIT_TABLE, "id");
  } else {
    console.log(`Table ${AUDIT_TABLE} already exists.`);
  }

  // Seed Ekishwar
  const ekishwar = {
    accountId: "113304815637",
    name: "Ekishwar",
    roleArn: "arn:aws:iam::113304815637:role/CitiusCloud-Ekishwar-ReadOnly",
    externalId: undefined, // Set this if the role has an ExternalId condition
    region: "ap-south-1",
    status: "active",
    onboardedAt: new Date().toISOString(),
  };

  await db.send(new PutCommand({ TableName: CUSTOMERS_TABLE, Item: ekishwar }));
  console.log(`Seeded customer: ${ekishwar.name} (${ekishwar.accountId})`);

  console.log("\nDone. DynamoDB tables are ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
