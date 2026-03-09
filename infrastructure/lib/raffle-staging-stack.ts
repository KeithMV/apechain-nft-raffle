import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export interface RaffleStagingStackProps extends cdk.StackProps {
  domainName: string;
  certificateArn: string; // Use existing cert that covers *.apechainraffles.io
}

export class RaffleStagingStack extends cdk.Stack {
  public readonly s3Bucket: s3.Bucket;
  public readonly cloudFrontDistributionId: string;

  constructor(scope: Construct, id: string, props: RaffleStagingStackProps) {
    super(scope, id, props);

    // S3 Bucket for staging frontend
    this.s3Bucket = new s3.Bucket(this, 'RaffleStagingV2Bucket', {
      bucketName: `apechain-nft-raffle-staging-v2-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Origin Access Control
    const originAccessControl = new cloudfront.S3OriginAccessControl(this, 'RaffleStagingV2OAC', {
      description: 'OAC for Raffle Staging V2 S3 bucket',
    });

    // Import existing certificate
    const certificate = certificatemanager.Certificate.fromCertificateArn(
      this, 
      'StagingCertificate', 
      props.certificateArn
    );

    // CloudFront Distribution for staging
    const distribution = new cloudfront.Distribution(this, 'RaffleStagingV2Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.s3Bucket, {
          originAccessControl,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // Disable cache for staging
      },
      // domainNames: [props.domainName], // Commented out - will add after DNS switch
      // certificate, // Commented out - will add after DNS switch
      sslSupportMethod: cloudfront.SSLMethod.SNI,
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(0), // No caching for staging
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(0),
        },
      ],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    this.cloudFrontDistributionId = distribution.distributionId;

    // Outputs
    new cdk.CfnOutput(this, 'StagingBucketName', {
      value: this.s3Bucket.bucketName,
    });

    new cdk.CfnOutput(this, 'StagingDistributionId', {
      value: this.cloudFrontDistributionId,
    });

    new cdk.CfnOutput(this, 'StagingWebsiteURL', {
      value: `https://${props.domainName}`,
    });

    new cdk.CfnOutput(this, 'StagingCloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
    });
  }
}