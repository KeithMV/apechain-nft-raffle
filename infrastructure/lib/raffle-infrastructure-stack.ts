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
  environment: string; // 'production', 'staging', 'apechain-only'
}

export class RaffleInfrastructureStack extends cdk.Stack {
  public readonly s3Bucket: s3.Bucket;
  public readonly cloudFrontDistributionId: string;

  constructor(scope: Construct, id: string, props?: RaffleInfrastructureStackProps) {
    super(scope, id, props);

    // S3 Bucket for frontend hosting
    this.s3Bucket = new s3.Bucket(this, 'RaffleFrontendBucket', {
      bucketName: `apechain-nft-raffle-${props?.environment || 'default'}-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      // objectLockEnabled removed - incompatible with RemovalPolicy.DESTROY
      // Versioning provides sufficient protection against accidental deletion
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Changed to RETAIN for production safety
      autoDeleteObjects: false, // Prevent accidental deletion
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

    // CloudFront Response Headers Policy for Security
    const securityHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeaders', {
      comment: 'Security headers for Raffle platform',
      securityHeadersBehavior: {
        contentSecurityPolicy: {
          contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.apechain.com https://*.calderachain.xyz https://*.walletconnect.com https://*.walletconnect.org https://*.infura.io https://*.alchemy.com wss://*.walletconnect.com wss://*.walletconnect.org https://*.execute-api.us-east-1.amazonaws.com https://*.amazonaws.com; frame-src 'self' https://verify.walletconnect.com https://verify.walletconnect.org;",
          override: true,
        },
        contentTypeOptions: {
          override: true,
        },
        frameOptions: {
          frameOption: cloudfront.HeadersFrameOption.DENY,
          override: true,
        },
        referrerPolicy: {
          referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          override: true,
        },
        strictTransportSecurity: {
          accessControlMaxAge: cdk.Duration.seconds(31536000),
          includeSubdomains: true,
          preload: true,
          override: true,
        },
        xssProtection: {
          protection: true,
          modeBlock: true,
          override: true,
        },
      },
    });

    // CloudFront Distribution with React Router support and Security Headers
    const distribution = new cloudfront.Distribution(this, 'RaffleDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.s3Bucket, {
          originAccessControl,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: securityHeadersPolicy,
      },
      domainNames,
      certificate,
      sslSupportMethod: cloudfront.SSLMethod.SNI,
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