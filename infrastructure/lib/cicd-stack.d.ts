import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
interface CicdStackProps extends cdk.StackProps {
    s3Bucket: s3.Bucket;
    cloudFrontDistributionId: string;
}
export declare class CicdStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: CicdStackProps);
}
export {};
