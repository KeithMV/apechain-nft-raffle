#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RaffleInfrastructureStack } from '../lib/raffle-infrastructure-stack';
import { CicdStack } from '../lib/cicd-stack';

const app = new cdk.App();

const infraStack = new RaffleInfrastructureStack(app, 'RaffleInfrastructureStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

new CicdStack(app, 'RaffleCicdStack', {
  s3Bucket: infraStack.s3Bucket,
  cloudFrontDistributionId: infraStack.cloudFrontDistributionId,
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});