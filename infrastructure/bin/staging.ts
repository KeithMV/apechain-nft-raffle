#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RaffleStagingStack } from '../lib/raffle-staging-stack';

const app = new cdk.App();

try {
  // Validate required environment variables
  const account = process.env.CDK_DEFAULT_ACCOUNT;
  const region = process.env.CDK_DEFAULT_REGION || 'us-east-1';
  const certificateArn = process.env.CERTIFICATE_ARN;
  
  if (!account) {
    throw new Error('CDK_DEFAULT_ACCOUNT environment variable is required');
  }
  
  if (!certificateArn || certificateArn === 'YOUR_CERT_ARN') {
    throw new Error('CERTIFICATE_ARN environment variable must be set to a valid ACM certificate ARN');
  }
  
  if (!account.match(/^\d{12}$/)) {
    throw new Error(`Invalid AWS account ID: ${account}. Must be a 12-digit number.`);
  }
  
  if (!region.match(/^[a-z0-9-]+$/)) {
    throw new Error(`Invalid AWS region: ${region}`);
  }

  new RaffleStagingStack(app, 'RaffleStagingStack', {
    env: {
      account,
      region,
    },
    domainName: 'staging.apechainraffles.io',
    certificateArn,
    environment: 'staging',
  });
  
  console.log('✅ Staging stack configuration loaded successfully');
  console.log(`📍 Account: ${account}`);
  console.log(`🌍 Region: ${region}`);
  console.log(`🔒 Certificate: ${certificateArn.substring(0, 50)}...`);
  
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown configuration error';
  console.error('❌ Failed to configure staging stack:', errorMessage);
  console.error('\n💡 Required environment variables:');
  console.error('   - CDK_DEFAULT_ACCOUNT: AWS account ID (required)');
  console.error('   - CERTIFICATE_ARN: ACM certificate ARN for staging.apechainraffles.io');
  console.error('   - CDK_DEFAULT_REGION: AWS region (optional, defaults to us-east-1)');
  process.exit(1);
}