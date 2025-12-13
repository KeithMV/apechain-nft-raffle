import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
export interface WhiteLabelStackProps extends cdk.StackProps {
    clientName: string;
    customDomain?: string;
    brandColors?: {
        primary: string;
        secondary: string;
        accent: string;
    };
    platformFee?: number;
}
export declare class WhiteLabelStack extends cdk.Stack {
    readonly bucketName: string;
    readonly distributionId: string;
    readonly websiteUrl: string;
    constructor(scope: Construct, id: string, props: WhiteLabelStackProps);
}
