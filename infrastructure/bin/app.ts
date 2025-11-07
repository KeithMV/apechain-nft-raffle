#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RaffleInfrastructureStack } from '../lib/raffle-infrastructure-stack';
import { CicdStack } from '../lib/cicd-stack';

const app = new cdk.App();

// Get domain configuration from context
const domainName = app.node.tryGetContext('domainName');
const hostedZoneId = app.node.tryGetContext('hostedZoneId');

// Validate environment variables
if (!process.env.CDK_DEFAULT_ACCOUNT || !process.env.CDK_DEFAULT_REGION) {
  console.error('CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION must be set');
  process.exit(1);
}

try {
  const infraStack = new RaffleInfrastructureStack(app, 'RaffleInfrastructureStack', {
    domainName,
    hostedZoneId,
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  });

  new CicdStack(app, 'RaffleCicdStack', {
    s3Bucket: infraStack.s3Bucket,
    cloudFrontDistributionId: infraStack.cloudFrontDistributionId,
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  });
} catch (error) {
  console.error('Failed to create CDK stacks:', error);
  process.exit(1);
}