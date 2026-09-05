import { STSClient, AssumeRoleCommand, Credentials } from "@aws-sdk/client-sts";

const sts = new STSClient({ region: process.env.AWS_REGION || "ap-south-1" });

/**
 * Assumes an IAM role in a customer account and returns temporary credentials.
 */
export async function assumeRole(params: {
  roleArn: string;
  externalId?: string;
  userId: string;       // Used for RoleSessionName — helps with audit in CloudTrail
}): Promise<Credentials> {
  // RoleSessionName: alphanumeric + = , . @ - _ only, max 64 chars
  const sessionName = `citius-${params.userId.replace(/[^a-zA-Z0-9=,.@_-]/g, "-").slice(0, 54)}`;

  const result = await sts.send(
    new AssumeRoleCommand({
      RoleArn: params.roleArn,
      RoleSessionName: sessionName,
      ...(params.externalId ? { ExternalId: params.externalId } : {}),
      DurationSeconds: 3600,
    })
  );

  if (!result.Credentials) {
    throw new Error("AssumeRole returned no credentials");
  }

  return result.Credentials;
}

/**
 * Exchanges temporary credentials for an AWS Console sign-in URL.
 * The user is redirected to this URL — they land in the AWS Console
 * already authenticated as that customer's IAM role.
 *
 * AWS docs: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_enable-console-custom-url.html
 */
export async function generateConsoleUrl(
  credentials: Credentials,
  destination = "https://console.aws.amazon.com/"
): Promise<string> {
  const sessionJson = JSON.stringify({
    sessionId: credentials.AccessKeyId,
    sessionKey: credentials.SecretAccessKey,
    sessionToken: credentials.SessionToken,
  });

  // Step 1: Get sign-in token from AWS federation endpoint
  const tokenUrl =
    `https://signin.aws.amazon.com/federation` +
    `?Action=getSigninToken` +
    `&Session=${encodeURIComponent(sessionJson)}`;

  const tokenResponse = await fetch(tokenUrl);
  if (!tokenResponse.ok) {
    throw new Error(`AWS federation token request failed: ${tokenResponse.status}`);
  }

  const { SigninToken } = (await tokenResponse.json()) as { SigninToken: string };

  // Step 2: Build the console login URL
  const consoleUrl = new URL("https://signin.aws.amazon.com/federation");
  consoleUrl.searchParams.set("Action", "login");
  consoleUrl.searchParams.set(
    "Issuer",
    process.env.NEXTAUTH_URL || "https://portal.citiuscloud.in"
  );
  consoleUrl.searchParams.set("Destination", destination);
  consoleUrl.searchParams.set("SigninToken", SigninToken);

  return consoleUrl.toString();
}
