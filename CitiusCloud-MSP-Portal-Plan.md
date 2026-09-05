# CitiusCloud MSP Portal — Build Plan

**Product:** Multi-Account AWS Management Portal
**Owner:** CitiusCloud Services LLP
**Gateway AWS Account:** 939603205275
**Created:** September 2026

---

## What We Are Building

A branded internal portal for CitiusCloud that:
- Lets the CitiusCloud team log in once
- Select any customer AWS account
- View monitoring, health, and cost data for that account
- Uses AWS `sts:AssumeRole` in the backend — no dependency on customer's SSO or Control Tower
- Generates monthly reports per customer

---

## Core Concept — Hub & Spoke via sts:AssumeRole

```
CitiusCloud Portal (Gateway Account: 939603205275)
              ↓
    sts:AssumeRole (pure IAM — no SSO)
              ↓
  Customer AWS Account
  └── IAM Role: CitiusCloud-ReadOnly
        Trust Policy: trusts 939603205275
              ↓
    Temporary credentials (1 hr, auto-refreshed)
              ↓
    Read customer AWS resources → show in dashboard
```

**Customer's Control Tower / SSO is completely unaffected.**
The only requirement from the customer is one IAM role in their account — created via a CloudFormation template you provide.

---

## Why Not Common Fate?

| | Common Fate | This Portal |
|--|-------------|-------------|
| Purpose | Internal access request + approval workflows | MSP monitoring + cost dashboard |
| Solves | Who on your team can access which account | Not this |
| Doesn't solve | Monitoring, cost, dashboards, onboarding | 80% of what you need |
| Verdict | Overkill + unnecessary dependency | Build it — sts:AssumeRole is 10 lines of code |

> Use Common Fate only if you need approval workflows (engineer requests access → manager approves → time-limited session). Otherwise skip it.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **Next.js 14** (App Router) | React framework — SSR, best for dashboards |
| **TypeScript** | Type safety end-to-end |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | Pre-built dashboard components (free, production-ready) |
| **Recharts** | Cost and metrics charts |
| **TanStack Query** | Data fetching + client-side caching |
| **NextAuth.js** | Connects Next.js to Cognito auth |

### Backend API
| Technology | Purpose |
|-----------|---------|
| **Node.js + NestJS** | Structured, scalable, TypeScript-first API |
| **TypeScript** | Type safety |
| **AWS SDK v3** | sts:AssumeRole + all AWS API calls |
| **Prisma ORM** | Database access — same as Ekishwar |
| **BullMQ** | Background jobs — poll customer accounts every 5 mins |

### Auth
| Technology | Purpose |
|-----------|---------|
| **AWS Cognito** | Team login, MFA, session management (50k users free tier) |

### Data Layer
| Technology | Purpose |
|-----------|---------|
| **PostgreSQL (RDS)** | Customer registry, audit logs |
| **Redis (ElastiCache)** | Cache assumed role sessions (avoid re-calling AssumeRole every request) |

### Hosting & Infrastructure
| Technology | Purpose |
|-----------|---------|
| **ECS Fargate** | Backend API + Frontend containers |
| **CloudFront + S3** | Static assets, report storage |
| **Amazon SES** | Email alerts and monthly reports |
| **GitHub Actions** | CI/CD pipelines — same pattern as Ekishwar |

### Notifications
| Technology | Purpose |
|-----------|---------|
| **Amazon SES** | Email alerts |
| **Slack Webhook** | Team Slack notifications |

---

## Full Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CloudFront CDN                     │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│            Next.js 14 Frontend (ECS)                 │
│     Tailwind + shadcn/ui + Recharts + NextAuth       │
└─────────────────────┬───────────────────────────────┘
                      │ REST API
┌─────────────────────▼───────────────────────────────┐
│           NestJS Backend API (ECS)                   │
│         AWS SDK v3 — sts:AssumeRole                  │
│         Prisma ORM — PostgreSQL                      │
│         BullMQ — Background polling jobs             │
└──────┬──────────────┬──────────────┬────────────────┘
       │              │              │
┌──────▼─────┐ ┌──────▼──────┐ ┌────▼──────────┐
│ PostgreSQL │ │    Redis     │ │  Amazon SES   │
│ (RDS)      │ │(ElastiCache) │ │  (Alerts)     │
└────────────┘ └─────────────┘ └───────────────┘
                      │
       ┌──────────────▼──────────────┐
       │    sts:AssumeRole calls     │
       ├──────────┬──────────────────┤
       │Customer A│ Customer B  ...  │
       │ IAM Role │ IAM Role         │
       └──────────┴──────────────────┘
```

---

## Repository Structure

```
citiuscloud-portal/
├── apps/
│   ├── web/                        # Next.js 14 frontend
│   │   ├── app/                    # App Router pages
│   │   │   ├── (auth)/             # Login pages
│   │   │   ├── dashboard/          # Multi-account overview
│   │   │   ├── customers/          # Per-customer pages
│   │   │   │   ├── [id]/monitoring
│   │   │   │   ├── [id]/cost
│   │   │   │   └── [id]/alerts
│   │   │   └── reports/
│   │   └── components/
│   └── api/                        # NestJS backend
│       ├── src/
│       │   ├── auth/               # Cognito auth guard
│       │   ├── customers/          # Customer CRUD
│       │   ├── aws-session/        # sts:AssumeRole core
│       │   ├── monitoring/         # ECS, RDS, EC2 health
│       │   ├── cost/               # Cost Explorer module
│       │   ├── alerts/             # Alert rules + notifications
│       │   ├── reports/            # Report generation
│       │   └── audit/              # Audit log
│       └── prisma/
│           └── schema.prisma
├── packages/
│   ├── aws-session/                # Shared sts:AssumeRole service
│   ├── db/                         # Prisma schema + migrations
│   └── types/                      # Shared TypeScript types
├── infra/
│   ├── cloudformation/
│   │   └── customer-onboarding.yaml  # Template given to customers
│   └── ecs/
│       ├── api-taskdef.json
│       └── web-taskdef.json
└── .github/
    └── workflows/
        ├── deploy-api.yml
        └── deploy-web.yml
```

---

## Database Schema

```prisma
model Customer {
  id            String   @id @default(uuid())
  name          String
  awsAccountId  String   @unique
  roleArn       String
  externalId    String   @unique   // You generate — unique per customer
  region        String   @default("ap-south-1")
  status        String   @default("active")
  onboardedAt   DateTime @default(now())
  auditLogs     AuditLog[]
  alerts        Alert[]
}

model AuditLog {
  id          String   @id @default(uuid())
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id])
  userId      String   // CitiusCloud team member
  action      String   // e.g. "sts:AssumeRole", "ec2:DescribeInstances"
  timestamp   DateTime @default(now())
}

model Alert {
  id          String   @id @default(uuid())
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id])
  type        String   // "ECS_UNHEALTHY", "COST_SPIKE", "RDS_HIGH_CPU"
  message     String
  resolved    Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

---

## Core Service — sts:AssumeRole

```typescript
// packages/aws-session/src/index.ts

import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { fromTemporaryCredentials } from '@aws-sdk/credential-providers';

export async function getCustomerSession(customer: {
  awsAccountId: string;
  roleArn: string;
  externalId: string;
  region: string;
}) {
  const credentials = fromTemporaryCredentials({
    params: {
      RoleArn: customer.roleArn,
      RoleSessionName: 'citiuscloud-portal',
      ExternalId: customer.externalId,
      DurationSeconds: 3600,
    },
  });

  return { credentials, region: customer.region };
}
```

Cache the session in Redis using the customer ID as key with a 55-minute TTL (refresh before the 1-hour expiry).

---

## Customer Onboarding — CloudFormation Template

This template is generated per customer (pre-filled with their ExternalId) and given to them to run in their AWS account:

```yaml
# infra/cloudformation/customer-onboarding.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: CitiusCloud MSP Portal — Read-Only Access Role

Parameters:
  ExternalId:
    Type: String
    Description: Unique ID provided by CitiusCloud

Resources:
  CitiusCloudReadOnlyRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: CitiusCloud-ReadOnly
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: arn:aws:iam::939603205275:root
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                sts:ExternalId: !Ref ExternalId
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/ReadOnlyAccess

Outputs:
  RoleArn:
    Value: !GetAtt CitiusCloudReadOnlyRole.Arn
    Description: Paste this Role ARN back into the CitiusCloud Portal
```

Customer runs this → pastes the output Role ARN into your portal → onboarded.

---

## Onboarding Flow

```
1. CitiusCloud registers customer in portal
         ↓
2. Portal generates unique ExternalId for this customer
         ↓
3. Portal generates pre-filled CloudFormation template
         ↓
4. Customer downloads + runs the CFN template (1 click in their account)
         ↓
5. Customer copies the output Role ARN → pastes into portal
         ↓
6. Portal calls sts:AssumeRole to verify → marks customer as Active
         ↓
7. Dashboard available immediately
```

---

## Feature Modules

### Monitoring
- **ECS:** service health, running vs desired task count, recent deployments
- **RDS:** instance status, CPU utilisation, free storage, connections
- **EC2 / ALB:** instance health, target group status
- **CloudWatch Alarms:** list of active alarms in the account

### Cost
- Current month spend (Cost Explorer API)
- Service-wise breakdown with charts
- Month-over-month comparison
- Forecasted month-end cost
- Budget alerts (configurable threshold)

### Multi-Account Overview (Super Dashboard)
```
┌──────────────────────────────────────────────────────┐
│           All Customers — Live Overview               │
├──────────────┬────────┬────────────┬─────────────────┤
│ Customer     │ Status │ Monthly $  │ Open Alerts     │
├──────────────┼────────┼────────────┼─────────────────┤
│ Ekishwar     │  ✓     │ $3,144     │ 0               │
│ Customer B   │  ✓     │ $1,200     │ 2               │
│ Customer C   │  ⚠     │ $890       │ 5               │
└──────────────┴────────┴────────────┴─────────────────┘
```

### Alerting
- Background polling every 5 minutes via BullMQ
- Alert rules: ECS unhealthy, RDS CPU > 80%, cost spike > 20% vs last month
- Notifications via SES (email) and Slack webhook

### Audit Log
- Every AWS API call made by the portal against a customer account is logged
- Captures: which team member, which customer, which action, timestamp
- Essential for compliance and customer trust

### Monthly Reports
- Auto-generated PDF/Excel per customer on 1st of each month
- Cost comparison, health summary, incident log
- Auto-emailed to customer and internal team

---

## Build Sequence

| Week | Milestone |
|------|-----------|
| **1** | Monorepo setup (Turborepo), ECS infra, Cognito auth, DB schema + Prisma |
| **2** | Customer registry UI, CloudFormation template generator, onboarding flow |
| **3** | Core `aws-session` service — sts:AssumeRole + Redis session caching |
| **4** | ECS + RDS monitoring module (first real AWS data in the UI) |
| **5** | Cost Explorer module + Recharts graphs |
| **6** | Multi-account super dashboard |
| **7** | BullMQ background polling + alerting (SES + Slack) |
| **8** | Audit logging + monthly report generation |
| | **MVP complete — production ready** |
| **9–10** | Customer-facing read-only view |
| **11–12** | Advanced features, polish, mobile responsiveness |

---

## Security Practices

| Practice | Why |
|----------|-----|
| ExternalId per customer | Prevents confused deputy attack — industry standard for MSP tools |
| Never persist temp credentials to DB | Only cache in Redis with TTL matching credential expiry |
| All AWS API calls audit-logged | Customer trust + compliance |
| Least privilege role (ReadOnly) | Only request permissions you actually need |
| MFA enforced on Cognito for all team members | Your portal login is the master key to all customers |
| Role name standardised (`CitiusCloud-ReadOnly`) | Easy to audit across all customer accounts |

---

## Effort Estimate

| Phase | Scope | Effort |
|-------|-------|--------|
| Phase 1 — Foundation | Auth, customer registry, sts:AssumeRole core | 3 weeks |
| Phase 2 — Core Features | Monitoring, cost, super dashboard, alerts | 4–5 weeks |
| Phase 3 — Advanced | Reports, customer view, polish | 3–4 weeks |
| **MVP (Phase 1 + 2)** | **Fully usable internally** | **~7–8 weeks** |
| **Full Product** | **All features** | **~12 weeks** |

---

## First Customer — Ekishwar

Ekishwar is already set up as the reference customer:

| Field | Value |
|-------|-------|
| Account ID | `113304815637` |
| Role ARN | `arn:aws:iam::113304815637:role/CitiusCloud-Ekishwar-ReadOnly` |
| Region | `ap-south-1` |
| Role trusted account | `939603205275` (CitiusCloud Gateway) |

Use Ekishwar as the test account throughout development — real data, known environment.

---

*Maintained by: CitiusCloud Services LLP — Platform Team*
