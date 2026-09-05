# Citius-SSO Portal — Project Notes

## What This Is
Internal portal for the CitiusCloud team to log in once and open the AWS Console for any customer account.
No dependency on the customer's SSO or Control Tower — uses `sts:AssumeRole` + AWS Console Federation.

## Gateway Account
- **Account ID:** `939603205275` (CitiusCloud)
- This account's IAM role assumes roles in customer accounts

## First Customer
| Field | Value |
|-------|-------|
| Name | Ekishwar |
| Account ID | `113304815637` |
| Role ARN | `arn:aws:iam::113304815637:role/CitiusCloud-Ekishwar-ReadOnly` |
| Region | `ap-south-1` |

## How Console Access Works
```
Team member clicks "Open AWS Console"
  → POST /api/console-access { accountId }
  → Backend: sts:AssumeRole on customer's IAM role
  → Backend: AWS Federation endpoint → SigninToken
  → Redirect to AWS Console (signed in as that customer's role)
```

## Tech Stack
| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Auth | NextAuth.js v4 + AWS Cognito (Cognito skipped in dev) |
| Database | AWS DynamoDB (2 tables) |
| AWS access | AWS SDK v3 — STS + DynamoDB |
| Styling | Tailwind CSS |
| Hosting (planned) | EC2 t3.small |

## DynamoDB Tables
| Table | Partition Key | Purpose |
|-------|--------------|---------|
| `citius-customers` | `accountId` | Customer account list |
| `citius-audit-logs` | `id` | Who accessed which account, when |

## Key Files
```
lib/auth.ts           — NextAuth config (dev: credentials, prod: Cognito)
lib/dynamodb.ts       — Customer CRUD + audit log helpers
lib/aws-session.ts    — assumeRole() + generateConsoleUrl()
app/api/console-access/route.ts  — The core API: AssumeRole → federation URL
app/dashboard/page.tsx           — Customer grid (server component)
components/customer-card.tsx     — Card with "Open AWS Console" button
scripts/seed.ts       — Creates DynamoDB tables + seeds Ekishwar
.env.local.example    — All env vars documented
```

## Environment Variables (minimum for local dev)
```env
NEXTAUTH_SECRET=any-random-string
NEXTAUTH_URL=http://localhost:3000
AWS_REGION=ap-south-1
# Leave COGNITO_* blank for local dev
```

## Running Locally
```bash
npm install
cp .env.local.example .env.local   # fill in NEXTAUTH_SECRET + AWS_REGION
aws configure                       # credentials for account 939603205275
npm run seed                        # creates DynamoDB tables + adds Ekishwar
npm run dev                         # http://localhost:3000
```
- Dev login: any email works (yellow banner shown, Cognito skipped)

## EC2 Production Setup (planned)
- 1x EC2 t3.small with an instance profile (no access keys)
- Instance role needs:
  - `sts:AssumeRole` on `arn:aws:iam::*:role/CitiusCloud-*`
  - `dynamodb:Scan` + `dynamodb:GetItem` + `dynamodb:PutItem` on both tables
- Cognito User Pool needed (prod auth)
- `npm run build && npm start`

## Adding a New Customer
1. Deploy IAM role in customer account (trust policy must allow account `939603205275`)
2. Go to portal → `+ Add Account`
3. Enter: Customer Name, AWS Account ID, Role ARN, External ID (if set), Region
4. Role ARN is auto-filled as `arn:aws:iam::<accountId>:role/CitiusCloud-ReadOnly`

## Standard Customer IAM Role Name
`CitiusCloud-ReadOnly` (existing customers may have different names — set explicitly)

## Security Notes
- ExternalId per customer prevents confused deputy attacks (optional but recommended)
- Temp credentials are NOT stored — generated fresh per request
- Every console login is audit-logged to `citius-audit-logs` DynamoDB table
- In production: MFA enforced via Cognito

## Status
- [x] Next.js app scaffolded
- [x] Dev login (no Cognito needed locally)
- [x] DynamoDB customer registry
- [x] sts:AssumeRole + AWS Console Federation
- [x] Audit logging
- [x] Add customer form (UI)
- [ ] Cognito setup (production)
- [ ] EC2 deployment
- [ ] Customer IAM role CloudFormation template
