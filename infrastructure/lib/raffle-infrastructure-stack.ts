import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

export class RaffleInfrastructureStack extends cdk.Stack {
  public readonly s3Bucket: s3.Bucket;
  public readonly cloudFrontDistributionId: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for frontend hosting
    this.s3Bucket = new s3.Bucket(this, 'RaffleFrontendBucket', {
      bucketName: `apechain-nft-raffle-${this.account}-${this.region}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'RaffleDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.s3Bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    this.cloudFrontDistributionId = distribution.distributionId;

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.s3Bucket.bucketName,
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.cloudFrontDistributionId,
    });

    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: distribution.distributionDomainName,
    });
  }
}