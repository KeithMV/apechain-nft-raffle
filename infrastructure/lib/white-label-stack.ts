import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
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

export class WhiteLabelStack extends cdk.Stack {
  public readonly bucketName: string;
  public readonly distributionId: string;
  public readonly websiteUrl: string;

  constructor(scope: Construct, id: string, props: WhiteLabelStackProps) {
    super(scope, id, props);

    const clientName = props.clientName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // S3 Bucket for client's frontend
    const bucket = new s3.Bucket(this, 'ClientBucket', {
      bucketName: `${clientName}-raffle-platform-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // SSL Certificate (if custom domain provided)
    let certificate: certificatemanager.ICertificate | undefined;
    let domainNames: string[] | undefined;
    
    if (props.customDomain) {
      certificate = new certificatemanager.Certificate(this, 'ClientCertificate', {
        domainName: props.customDomain,
        subjectAlternativeNames: [`www.${props.customDomain}`],
        validation: certificatemanager.CertificateValidation.fromDns(),
      });
      
      domainNames = [props.customDomain, `www.${props.customDomain}`];
    }

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'ClientDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      domainNames,
      certificate,
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
    });

    // Store outputs
    this.bucketName = bucket.bucketName;
    this.distributionId = distribution.distributionId;
    this.websiteUrl = props.customDomain 
      ? `https://${props.customDomain}` 
      : `https://${distribution.distributionDomainName}`;

    // CDK Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucketName,
      description: 'S3 bucket for client frontend',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distributionId,
      description: 'CloudFront distribution ID',
    });

    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: this.websiteUrl,
      description: 'Client website URL',
    });

    new cdk.CfnOutput(this, 'ClientConfig', {
      value: JSON.stringify({
        clientName: props.clientName,
        bucketName: this.bucketName,
        distributionId: this.distributionId,
        websiteUrl: this.websiteUrl,
        platformFee: props.platformFee || 10,
        brandColors: props.brandColors || {
          primary: '#10b981',
          secondary: '#0f172a', 
          accent: '#06b6d4'
        }
      }),
      description: 'Complete client configuration',
    });
  }
}