import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
export interface RaffleInfrastructureStackProps extends cdk.StackProps {
    domainName?: string;
    hostedZoneId?: string;
}
export declare class RaffleInfrastructureStack extends cdk.Stack {
    readonly s3Bucket: s3.Bucket;
    readonly cloudFrontDistributionId: string;
    constructor(scope: Construct, id: string, props?: RaffleInfrastructureStackProps);
}
