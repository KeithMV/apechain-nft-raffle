"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RaffleInfrastructureStack = void 0;
const cdk = require("aws-cdk-lib");
const s3 = require("aws-cdk-lib/aws-s3");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
const certificatemanager = require("aws-cdk-lib/aws-certificatemanager");
class RaffleInfrastructureStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // S3 Bucket for frontend hosting
        this.s3Bucket = new s3.Bucket(this, 'RaffleFrontendBucket', {
            bucketName: `apechain-nft-raffle-${this.account}-${this.region}`,
            versioned: true,
            encryption: s3.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            objectLockEnabled: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        // Origin Access Control for secure S3 access
        const originAccessControl = new cloudfront.S3OriginAccessControl(this, 'RaffleOAC', {
            description: 'OAC for Raffle S3 bucket',
        });
        // SSL Certificate and Domain Setup (if domain provided)
        let certificate;
        let domainNames;
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
exports.RaffleInfrastructureStack = RaffleInfrastructureStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFmZmxlLWluZnJhc3RydWN0dXJlLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmFmZmxlLWluZnJhc3RydWN0dXJlLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQyx5Q0FBeUM7QUFDekMseURBQXlEO0FBQ3pELDhEQUE4RDtBQUM5RCx5RUFBeUU7QUFVekUsTUFBYSx5QkFBMEIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUl0RCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNDO1FBQzlFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLGlDQUFpQztRQUNqQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLEVBQUU7WUFDMUQsVUFBVSxFQUFFLHVCQUF1QixJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDaEUsU0FBUyxFQUFFLElBQUk7WUFDZixVQUFVLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFVBQVU7WUFDMUMsVUFBVSxFQUFFLElBQUk7WUFDaEIsZ0JBQWdCLEVBQUUsS0FBSztZQUN2QixpQkFBaUIsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUztZQUNqRCxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87U0FDekMsQ0FBQyxDQUFDO1FBRUgsNkNBQTZDO1FBQzdDLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxVQUFVLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUNsRixXQUFXLEVBQUUsMEJBQTBCO1NBQ3hDLENBQUMsQ0FBQztRQUVILHdEQUF3RDtRQUN4RCxJQUFJLFdBQXdELENBQUM7UUFDN0QsSUFBSSxXQUFpQyxDQUFDO1FBRXRDLElBQUksS0FBSyxFQUFFLFVBQVUsRUFBRSxDQUFDO1lBQ3RCLGdFQUFnRTtZQUNoRSxXQUFXLEdBQUcsSUFBSSxrQkFBa0IsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO2dCQUMxRSxVQUFVLEVBQUUsS0FBSyxDQUFDLFVBQVU7Z0JBQzVCLHVCQUF1QixFQUFFLENBQUMsT0FBTyxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3BELFVBQVUsRUFBRSxrQkFBa0IsQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUU7YUFDL0QsQ0FBQyxDQUFDO1lBRUgsV0FBVyxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxPQUFPLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFFRCxvREFBb0Q7UUFDcEQsTUFBTSxZQUFZLEdBQUcsSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxvQkFBb0IsRUFBRTtZQUMzRSxlQUFlLEVBQUU7Z0JBQ2YsTUFBTSxFQUFFLE9BQU8sQ0FBQyxjQUFjLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtvQkFDcEUsbUJBQW1CO2lCQUNwQixDQUFDO2dCQUNGLG9CQUFvQixFQUFFLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxpQkFBaUI7Z0JBQ3ZFLFdBQVcsRUFBRSxVQUFVLENBQUMsV0FBVyxDQUFDLGlCQUFpQjthQUN0RDtZQUNELFdBQVc7WUFDWCxXQUFXO1lBQ1gsZ0JBQWdCLEVBQUUsVUFBVSxDQUFDLFNBQVMsQ0FBQyxHQUFHO1lBQzFDLGlCQUFpQixFQUFFLFlBQVk7WUFDL0IsY0FBYyxFQUFFO2dCQUNkO29CQUNFLFVBQVUsRUFBRSxHQUFHO29CQUNmLGtCQUFrQixFQUFFLEdBQUc7b0JBQ3ZCLGdCQUFnQixFQUFFLGFBQWE7b0JBQy9CLEdBQUcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7aUJBQzdCO2dCQUNEO29CQUNFLFVBQVUsRUFBRSxHQUFHO29CQUNmLGtCQUFrQixFQUFFLEdBQUc7b0JBQ3ZCLGdCQUFnQixFQUFFLGFBQWE7b0JBQy9CLEdBQUcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7aUJBQzdCO2FBQ0Y7WUFDRCxzQkFBc0IsRUFBRSxVQUFVLENBQUMsc0JBQXNCLENBQUMsYUFBYTtTQUN4RSxDQUFDLENBQUM7UUFFSCx5REFBeUQ7UUFFekQsSUFBSSxDQUFDLHdCQUF3QixHQUFHLFlBQVksQ0FBQyxjQUFjLENBQUM7UUFFNUQsVUFBVTtRQUNWLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ3BDLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVU7U0FDaEMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUN4QyxLQUFLLEVBQUUsSUFBSSxDQUFDLHdCQUF3QjtTQUNyQyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUNwQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsV0FBVyxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsWUFBWSxDQUFDLHNCQUFzQixFQUFFO1NBQzVHLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ3ZDLEtBQUssRUFBRSxXQUFXLFlBQVksQ0FBQyxzQkFBc0IsRUFBRTtTQUN4RCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUExRkQsOERBMEZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgKiBhcyBjbG91ZGZyb250IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250JztcbmltcG9ydCAqIGFzIG9yaWdpbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQtb3JpZ2lucyc7XG5pbXBvcnQgKiBhcyBjZXJ0aWZpY2F0ZW1hbmFnZXIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNlcnRpZmljYXRlbWFuYWdlcic7XG5pbXBvcnQgKiBhcyByb3V0ZTUzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1yb3V0ZTUzJztcbmltcG9ydCAqIGFzIHRhcmdldHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXJvdXRlNTMtdGFyZ2V0cyc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGludGVyZmFjZSBSYWZmbGVJbmZyYXN0cnVjdHVyZVN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIGRvbWFpbk5hbWU/OiBzdHJpbmc7XG4gIGhvc3RlZFpvbmVJZD86IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFJhZmZsZUluZnJhc3RydWN0dXJlU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgczNCdWNrZXQ6IHMzLkJ1Y2tldDtcbiAgcHVibGljIHJlYWRvbmx5IGNsb3VkRnJvbnREaXN0cmlidXRpb25JZDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogUmFmZmxlSW5mcmFzdHJ1Y3R1cmVTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBTMyBCdWNrZXQgZm9yIGZyb250ZW5kIGhvc3RpbmdcbiAgICB0aGlzLnMzQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnUmFmZmxlRnJvbnRlbmRCdWNrZXQnLCB7XG4gICAgICBidWNrZXROYW1lOiBgYXBlY2hhaW4tbmZ0LXJhZmZsZS0ke3RoaXMuYWNjb3VudH0tJHt0aGlzLnJlZ2lvbn1gLFxuICAgICAgdmVyc2lvbmVkOiB0cnVlLFxuICAgICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5TM19NQU5BR0VELFxuICAgICAgZW5mb3JjZVNTTDogdHJ1ZSxcbiAgICAgIHB1YmxpY1JlYWRBY2Nlc3M6IGZhbHNlLFxuICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCxcbiAgICAgIG9iamVjdExvY2tFbmFibGVkOiB0cnVlLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICB9KTtcblxuICAgIC8vIE9yaWdpbiBBY2Nlc3MgQ29udHJvbCBmb3Igc2VjdXJlIFMzIGFjY2Vzc1xuICAgIGNvbnN0IG9yaWdpbkFjY2Vzc0NvbnRyb2wgPSBuZXcgY2xvdWRmcm9udC5TM09yaWdpbkFjY2Vzc0NvbnRyb2wodGhpcywgJ1JhZmZsZU9BQycsIHtcbiAgICAgIGRlc2NyaXB0aW9uOiAnT0FDIGZvciBSYWZmbGUgUzMgYnVja2V0JyxcbiAgICB9KTtcblxuICAgIC8vIFNTTCBDZXJ0aWZpY2F0ZSBhbmQgRG9tYWluIFNldHVwIChpZiBkb21haW4gcHJvdmlkZWQpXG4gICAgbGV0IGNlcnRpZmljYXRlOiBjZXJ0aWZpY2F0ZW1hbmFnZXIuSUNlcnRpZmljYXRlIHwgdW5kZWZpbmVkO1xuICAgIGxldCBkb21haW5OYW1lczogc3RyaW5nW10gfCB1bmRlZmluZWQ7XG4gICAgXG4gICAgaWYgKHByb3BzPy5kb21haW5OYW1lKSB7XG4gICAgICAvLyBDcmVhdGUgU1NMIGNlcnRpZmljYXRlIGluIHVzLWVhc3QtMSAocmVxdWlyZWQgZm9yIENsb3VkRnJvbnQpXG4gICAgICBjZXJ0aWZpY2F0ZSA9IG5ldyBjZXJ0aWZpY2F0ZW1hbmFnZXIuQ2VydGlmaWNhdGUodGhpcywgJ1JhZmZsZUNlcnRpZmljYXRlJywge1xuICAgICAgICBkb21haW5OYW1lOiBwcm9wcy5kb21haW5OYW1lLFxuICAgICAgICBzdWJqZWN0QWx0ZXJuYXRpdmVOYW1lczogW2B3d3cuJHtwcm9wcy5kb21haW5OYW1lfWBdLFxuICAgICAgICB2YWxpZGF0aW9uOiBjZXJ0aWZpY2F0ZW1hbmFnZXIuQ2VydGlmaWNhdGVWYWxpZGF0aW9uLmZyb21EbnMoKSxcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBkb21haW5OYW1lcyA9IFtwcm9wcy5kb21haW5OYW1lLCBgd3d3LiR7cHJvcHMuZG9tYWluTmFtZX1gXTtcbiAgICB9XG5cbiAgICAvLyBDbG91ZEZyb250IERpc3RyaWJ1dGlvbiB3aXRoIFJlYWN0IFJvdXRlciBzdXBwb3J0XG4gICAgY29uc3QgZGlzdHJpYnV0aW9uID0gbmV3IGNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uKHRoaXMsICdSYWZmbGVEaXN0cmlidXRpb24nLCB7XG4gICAgICBkZWZhdWx0QmVoYXZpb3I6IHtcbiAgICAgICAgb3JpZ2luOiBvcmlnaW5zLlMzQnVja2V0T3JpZ2luLndpdGhPcmlnaW5BY2Nlc3NDb250cm9sKHRoaXMuczNCdWNrZXQsIHtcbiAgICAgICAgICBvcmlnaW5BY2Nlc3NDb250cm9sLFxuICAgICAgICB9KSxcbiAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6IGNsb3VkZnJvbnQuVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXG4gICAgICAgIGNhY2hlUG9saWN5OiBjbG91ZGZyb250LkNhY2hlUG9saWN5LkNBQ0hJTkdfT1BUSU1JWkVELFxuICAgICAgfSxcbiAgICAgIGRvbWFpbk5hbWVzLFxuICAgICAgY2VydGlmaWNhdGUsXG4gICAgICBzc2xTdXBwb3J0TWV0aG9kOiBjbG91ZGZyb250LlNTTE1ldGhvZC5TTkksXG4gICAgICBkZWZhdWx0Um9vdE9iamVjdDogJ2luZGV4Lmh0bWwnLFxuICAgICAgZXJyb3JSZXNwb25zZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGh0dHBTdGF0dXM6IDQwNCxcbiAgICAgICAgICByZXNwb25zZUh0dHBTdGF0dXM6IDIwMCxcbiAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiAnL2luZGV4Lmh0bWwnLFxuICAgICAgICAgIHR0bDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBodHRwU3RhdHVzOiA0MDMsXG4gICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiAyMDAsXG4gICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogJy9pbmRleC5odG1sJyxcbiAgICAgICAgICB0dGw6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIG1pbmltdW1Qcm90b2NvbFZlcnNpb246IGNsb3VkZnJvbnQuU2VjdXJpdHlQb2xpY3lQcm90b2NvbC5UTFNfVjFfMl8yMDIxLFxuICAgIH0pO1xuXG4gICAgLy8gUm91dGU1MyBETlMgUmVjb3JkcyBhbHJlYWR5IGV4aXN0IC0gbWFuYWdlZCBleHRlcm5hbGx5XG5cbiAgICB0aGlzLmNsb3VkRnJvbnREaXN0cmlidXRpb25JZCA9IGRpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25JZDtcblxuICAgIC8vIE91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQnVja2V0TmFtZScsIHtcbiAgICAgIHZhbHVlOiB0aGlzLnMzQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRGlzdHJpYnV0aW9uSWQnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5jbG91ZEZyb250RGlzdHJpYnV0aW9uSWQsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnV2Vic2l0ZVVSTCcsIHtcbiAgICAgIHZhbHVlOiBwcm9wcz8uZG9tYWluTmFtZSA/IGBodHRwczovLyR7cHJvcHMuZG9tYWluTmFtZX1gIDogYGh0dHBzOi8vJHtkaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uRG9tYWluTmFtZX1gLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0Nsb3VkRnJvbnRVUkwnLCB7XG4gICAgICB2YWx1ZTogYGh0dHBzOi8vJHtkaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uRG9tYWluTmFtZX1gLFxuICAgIH0pO1xuICB9XG59Il19