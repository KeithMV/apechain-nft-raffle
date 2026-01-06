#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RaffleStagingStack } from '../lib/raffle-staging-stack';

const app = new cdk.App();

new RaffleStagingStack(app, 'RaffleStagingStack', {
  env: {
    account: '856872546342', // Your AWS account
    region: 'us-east-1',
  },
  domainName: 'staging.apechainraffles.io',
  certificateArn: 'arn:aws:acm:us-east-1:856872546342:certificate/YOUR_CERT_ARN', // Update this
});