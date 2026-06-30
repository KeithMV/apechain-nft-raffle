#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RaffleInfrastructureStack } from '../lib/raffle-infrastructure-stack';
import { RaffleStagingStack } from '../lib/raffle-staging-stack';

const app = new cdk.App();

// Validate environment variables
if (!process.env.CDK_DEFAULT_ACCOUNT || !process.env.CDK_DEFAULT_REGION) {
  console.error('CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION must be set');
  process.exit(1);
}

try {
  // Production Stack (Multi-Chain: ApeChain + Polygon)
  // Serves web3raffles.io - the multi-chain raffle platform
  new RaffleInfrastructureStack(app, 'RaffleInfrastructureStack', {
    domainName: 'web3raffles.io',
    hostedZoneId: 'Z05119332ATAXYZK4G6R6',
    environment: 'production',
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  });

  // Staging Stack
  const certificateArn = process.env.CERTIFICATE_ARN || process.env.STAGING_CERTIFICATE_ARN;
  if (!certificateArn) {
    console.error('CERTIFICATE_ARN or STAGING_CERTIFICATE_ARN environment variable is required for staging stack');
    process.exit(1);
  }
  
  new RaffleStagingStack(app, 'RaffleStagingStack', {
    domainName: 'staging.apechainraffles.io',
    certificateArn,
    environment: 'staging',
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  });
} catch (error) {
  console.error('Failed to create CDK stacks:', error);
  process.exit(1);
}