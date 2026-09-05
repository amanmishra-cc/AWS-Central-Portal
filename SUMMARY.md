# Citius SSO Portal — Session Summary

## What This Is
Internal MSP portal for the CitiusCloud team to log in once and open the AWS Console
for any customer account using `sts:AssumeRole` + AWS Console Federation.
No dependency on customer SSO or Control Tower.

---

## Infrastructure

| Resource | Detail |
|---|---|
| EC2 | t3.small, ap-south-1 |
| Elastic IP | 15.252.57.88 |
| Portal URL | http://15.252.57.88:3000 |
| EC2 Role | `AWS-Central-Portal-Role` (account `039632811020`) |
| App path | `/home/admin/citius-sso/AWS-Central-Portal` |
| Process manager | PM2 — `pm2 restart citius-sso` |
| GitHub repo | https://github.com/amanmishra-cc/AWS-Central-Portal |

### EC2 Role Permissions
- `sts:AssumeRole` on `arn:aws:iam::*:role/CitiusCloud-*`
- `dynamodb:Scan`, `dynamodb:GetItem`, `dynamodb:PutItem`, `dynamodb:DeleteItem` on both tables

---

## AWS Accounts

| Account | ID | Purpose |
|---|---|---|
| CitiusCloud Gateway | `039632811020` | Hosts EC2, DynamoDB |
| Ekishwar (first customer) | `113304815637` | Test customer |

---

## DynamoDB Tables (ap-south-1, account 039632811020)

| Table | Partition Key | Purpose |
|---|---|---|
| `citius-customers` | `accountId` | Customer account registry |
| `citius-audit-logs` | `id` | Console access audit trail |

### Customer Record Schema
```json
{
  "accountId": "113304815637",
  "name": "Ekishwar",
  "accountName": "Production",
  "accessType": "ReadOnly",
  "roleArn": "arn:aws:iam::113304815637:role/CitiusCloud-Ekishwar-ReadOnly",
  "externalId": null,
  "region": "ap-south-1",
  "status": "active",
  "onboardedAt": "2026-09-05T18:27:54.508Z"
}
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Auth | NextAuth.js v4 — dev: email/password, prod: O365 (pending) |
| Database | AWS DynamoDB via AWS SDK v3 |
| Styling | Tailwind CSS with dark mode |
| Hosting | EC2 t3.small + PM2 |

---

## Features Completed

- [x] Login — restricted to @citiuscloud.com and @citiuscloud.in emails
- [x] Light / Dark mode toggle (persists in localStorage)
- [x] Session expiry warning (15 mins before expiry)
- [x] Customer grouping — sidebar with customer list
- [x] Account table — name, account ID, region, access type, status
- [x] Global search — searches across all customers and accounts
- [x] Open AWS Console — STS AssumeRole → Federation URL
- [x] Add Account — with customer name, account name, access type, role ARN
- [x] Edit Account — edit all fields including status
- [x] Status toggle — click badge to activate/deactivate
- [x] Delete Account — removes from portal only, not AWS
- [x] Audit logging — every console access logged to DynamoDB

---

## EC2 .env.local (what should be set)

```env
NEXTAUTH_SECRET=<random-base64>
NEXTAUTH_URL=http://15.252.57.88:3000
AWS_REGION=ap-south-1
CUSTOMERS_TABLE=citius-customers
AUDIT_TABLE=citius-audit-logs
NEXT_PUBLIC_ALLOW_DEV_LOGIN=true
ALLOW_DEV_LOGIN=true
```

---

## Deployment Commands (on EC2)

```bash
cd /home/admin/citius-sso/AWS-Central-Portal
git pull
npm run build
pm2 restart citius-sso

# Logs
pm2 logs citius-sso --lines 50
```

---

## Pending — To Do Tomorrow

### 1. O365 Login (Microsoft Entra ID)
- Register app in portal.azure.com
- Callback URL: `http://15.252.57.88:3000/api/auth/callback/azure-ad`
- Add to .env.local: `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`
- Update `lib/auth.ts` to add AzureAD provider
- Update login page button

### 2. RBAC — User Permission System
Design agreed:
- New DynamoDB table: `citius-user-permissions` (PK: email, SK: accountId)
- Admin user can assign which team members can access which accounts and with what access type
- Dashboard filters accounts based on logged-in user's permissions
- API enforces permissions before assuming role

### 3. CloudFormation Template for Customer IAM Roles
Create 4-5 standard roles per customer account:
- `CitiusCloud-ReadOnly`
- `CitiusCloud-PowerUser`
- `CitiusCloud-Administrator`
- `CitiusCloud-Billing`
- `CitiusCloud-SecurityAudit`

All with trust policy pointing to gateway account `039632811020`.

### 4. HTTPS + Domain
- Domain: `portal.citiuscloud.in`
- Nginx reverse proxy + Let's Encrypt (certbot)

### 5. Audit Log Viewer
- Page to view who accessed which account and when
- Filter by user, customer, date range

---

## Key File Locations

```
lib/auth.ts                              — Auth config, domain restriction
lib/dynamodb.ts                          — DynamoDB helpers, Customer type
lib/aws-session.ts                       — AssumeRole + Console Federation
app/api/customers/route.ts               — GET/POST/PUT/DELETE customers
app/api/console-access/route.ts          — Core: AssumeRole → federation URL
app/dashboard/page.tsx                   — Main dashboard (server component)
app/login/page.tsx                       — Login page
app/admin/customers/new/page.tsx         — Add account form
app/admin/customers/[accountId]/edit/    — Edit account form
components/customers-list.tsx            — Sidebar + table + all actions
components/navbar.tsx                    — Top nav with theme toggle
components/session-warning.tsx           — Session expiry banner
components/edit-customer-form.tsx        — Edit form (client component)
```
