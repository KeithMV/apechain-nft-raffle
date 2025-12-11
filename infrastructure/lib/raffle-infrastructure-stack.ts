import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export interface RaffleInfrastructureStackProps extends cdk.StackProps {
  domainName?: string;
  hostedZoneId?: string;
}

export class RaffleInfrastructureStack extends cdk.Stack {
  public readonly s3Bucket: s3.Bucket;
  public readonly cloudFrontDistributionId: string;

  constructor(scope: Construct, id: string, props?: RaffleInfrastructureStackProps) {
    super(scope, id, props);

    // S3 Bucket for frontend hosting
    this.s3Bucket = new s3.Bucket(this, 'RaffleFrontendBucket', {
      bucketName: `apechain-nft-raffle-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Origin Access Control for secure S3 access
    const originAccessControl = new cloudfront.S3OriginAccessControl(this, 'RaffleOAC', {
      description: 'OAC for Raffle S3 bucket',
    });

    // SSL Certificate and Domain Setup (if domain provided)
    let certificate: certificatemanager.ICertificate | undefined;
    let domainNames: string[] | undefined;
    
    if (props?.domainName) {
      // Create SSL certificate in us-east-1 (required for CloudFront)
      certificate = new certificatemanager.Certificate(this, 'RaffleCertificate', {
        domainName: props.domainName,
        subjectAlternativeNames: [`www.${props.domainName}`],
        validation: certificatemanager.CertificateValidation.fromDns(),
      });
      
      domainNames = [props.domainName, `www.${props.domainName}`];
    }

    // CloudFront Distribution with React Router support
    const distribution = new cloudfront.Distribution(this, 'RaffleDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.s3Bucket, {
          originAccessControl,
        }),
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
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    // Route53 DNS Records already exist - managed externally

    this.cloudFrontDistributionId = distribution.distributionId;

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.s3Bucket.bucketName,
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.cloudFrontDistributionId,
    });

    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: props?.domainName ? `https://${props.domainName}` : `https://${distribution.distributionDomainName}`,
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
    });
  }
}