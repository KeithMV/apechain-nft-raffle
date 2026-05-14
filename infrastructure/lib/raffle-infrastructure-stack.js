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
            bucketName: `apechain-nft-raffle-${props?.environment || 'default'}-${this.account}-${this.region}`,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFmZmxlLWluZnJhc3RydWN0dXJlLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmFmZmxlLWluZnJhc3RydWN0dXJlLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQyx5Q0FBeUM7QUFDekMseURBQXlEO0FBQ3pELDhEQUE4RDtBQUM5RCx5RUFBeUU7QUFXekUsTUFBYSx5QkFBMEIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUl0RCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNDO1FBQzlFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLGlDQUFpQztRQUNqQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLEVBQUU7WUFDMUQsVUFBVSxFQUFFLHVCQUF1QixLQUFLLEVBQUUsV0FBVyxJQUFJLFNBQVMsSUFBSSxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDbkcsU0FBUyxFQUFFLElBQUk7WUFDZixVQUFVLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFVBQVU7WUFDMUMsVUFBVSxFQUFFLElBQUk7WUFDaEIsZ0JBQWdCLEVBQUUsS0FBSztZQUN2QixpQkFBaUIsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUztZQUNqRCxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87U0FDekMsQ0FBQyxDQUFDO1FBRUgsNkNBQTZDO1FBQzdDLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxVQUFVLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUNsRixXQUFXLEVBQUUsMEJBQTBCO1NBQ3hDLENBQUMsQ0FBQztRQUVILHdEQUF3RDtRQUN4RCxJQUFJLFdBQXdELENBQUM7UUFDN0QsSUFBSSxXQUFpQyxDQUFDO1FBRXRDLElBQUksS0FBSyxFQUFFLFVBQVUsRUFBRSxDQUFDO1lBQ3RCLGdFQUFnRTtZQUNoRSxXQUFXLEdBQUcsSUFBSSxrQkFBa0IsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO2dCQUMxRSxVQUFVLEVBQUUsS0FBSyxDQUFDLFVBQVU7Z0JBQzVCLHVCQUF1QixFQUFFLENBQUMsT0FBTyxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3BELFVBQVUsRUFBRSxrQkFBa0IsQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUU7YUFDL0QsQ0FBQyxDQUFDO1lBRUgsV0FBVyxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxPQUFPLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFFRCxvREFBb0Q7UUFDcEQsTUFBTSxZQUFZLEdBQUcsSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxvQkFBb0IsRUFBRTtZQUMzRSxlQUFlLEVBQUU7Z0JBQ2YsTUFBTSxFQUFFLE9BQU8sQ0FBQyxjQUFjLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtvQkFDcEUsbUJBQW1CO2lCQUNwQixDQUFDO2dCQUNGLG9CQUFvQixFQUFFLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxpQkFBaUI7Z0JBQ3ZFLFdBQVcsRUFBRSxVQUFVLENBQUMsV0FBVyxDQUFDLGlCQUFpQjthQUN0RDtZQUNELFdBQVc7WUFDWCxXQUFXO1lBQ1gsZ0JBQWdCLEVBQUUsVUFBVSxDQUFDLFNBQVMsQ0FBQyxHQUFHO1lBQzFDLGlCQUFpQixFQUFFLFlBQVk7WUFDL0IsY0FBYyxFQUFFO2dCQUNkO29CQUNFLFVBQVUsRUFBRSxHQUFHO29CQUNmLGtCQUFrQixFQUFFLEdBQUc7b0JBQ3ZCLGdCQUFnQixFQUFFLGFBQWE7b0JBQy9CLEdBQUcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7aUJBQzdCO2dCQUNEO29CQUNFLFVBQVUsRUFBRSxHQUFHO29CQUNmLGtCQUFrQixFQUFFLEdBQUc7b0JBQ3ZCLGdCQUFnQixFQUFFLGFBQWE7b0JBQy9CLEdBQUcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7aUJBQzdCO2FBQ0Y7WUFDRCxzQkFBc0IsRUFBRSxVQUFVLENBQUMsc0JBQXNCLENBQUMsYUFBYTtTQUN4RSxDQUFDLENBQUM7UUFFSCx5REFBeUQ7UUFFekQsSUFBSSxDQUFDLHdCQUF3QixHQUFHLFlBQVksQ0FBQyxjQUFjLENBQUM7UUFFNUQsVUFBVTtRQUNWLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ3BDLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVU7U0FDaEMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUN4QyxLQUFLLEVBQUUsSUFBSSxDQUFDLHdCQUF3QjtTQUNyQyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUNwQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsV0FBVyxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsWUFBWSxDQUFDLHNCQUFzQixFQUFFO1NBQzVHLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ3ZDLEtBQUssRUFBRSxXQUFXLFlBQVksQ0FBQyxzQkFBc0IsRUFBRTtTQUN4RCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUExRkQsOERBMEZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgKiBhcyBjbG91ZGZyb250IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250JztcbmltcG9ydCAqIGFzIG9yaWdpbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQtb3JpZ2lucyc7XG5pbXBvcnQgKiBhcyBjZXJ0aWZpY2F0ZW1hbmFnZXIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNlcnRpZmljYXRlbWFuYWdlcic7XG5pbXBvcnQgKiBhcyByb3V0ZTUzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1yb3V0ZTUzJztcbmltcG9ydCAqIGFzIHRhcmdldHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXJvdXRlNTMtdGFyZ2V0cyc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGludGVyZmFjZSBSYWZmbGVJbmZyYXN0cnVjdHVyZVN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIGRvbWFpbk5hbWU/OiBzdHJpbmc7XG4gIGhvc3RlZFpvbmVJZD86IHN0cmluZztcbiAgZW52aXJvbm1lbnQ6IHN0cmluZzsgLy8gJ3Byb2R1Y3Rpb24nLCAnc3RhZ2luZycsICdhcGVjaGFpbi1vbmx5J1xufVxuXG5leHBvcnQgY2xhc3MgUmFmZmxlSW5mcmFzdHJ1Y3R1cmVTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSBzM0J1Y2tldDogczMuQnVja2V0O1xuICBwdWJsaWMgcmVhZG9ubHkgY2xvdWRGcm9udERpc3RyaWJ1dGlvbklkOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBSYWZmbGVJbmZyYXN0cnVjdHVyZVN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIFMzIEJ1Y2tldCBmb3IgZnJvbnRlbmQgaG9zdGluZ1xuICAgIHRoaXMuczNCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdSYWZmbGVGcm9udGVuZEJ1Y2tldCcsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IGBhcGVjaGFpbi1uZnQtcmFmZmxlLSR7cHJvcHM/LmVudmlyb25tZW50IHx8ICdkZWZhdWx0J30tJHt0aGlzLmFjY291bnR9LSR7dGhpcy5yZWdpb259YCxcbiAgICAgIHZlcnNpb25lZDogdHJ1ZSxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgIGVuZm9yY2VTU0w6IHRydWUsXG4gICAgICBwdWJsaWNSZWFkQWNjZXNzOiBmYWxzZSxcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXG4gICAgICBvYmplY3RMb2NrRW5hYmxlZDogdHJ1ZSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgfSk7XG5cbiAgICAvLyBPcmlnaW4gQWNjZXNzIENvbnRyb2wgZm9yIHNlY3VyZSBTMyBhY2Nlc3NcbiAgICBjb25zdCBvcmlnaW5BY2Nlc3NDb250cm9sID0gbmV3IGNsb3VkZnJvbnQuUzNPcmlnaW5BY2Nlc3NDb250cm9sKHRoaXMsICdSYWZmbGVPQUMnLCB7XG4gICAgICBkZXNjcmlwdGlvbjogJ09BQyBmb3IgUmFmZmxlIFMzIGJ1Y2tldCcsXG4gICAgfSk7XG5cbiAgICAvLyBTU0wgQ2VydGlmaWNhdGUgYW5kIERvbWFpbiBTZXR1cCAoaWYgZG9tYWluIHByb3ZpZGVkKVxuICAgIGxldCBjZXJ0aWZpY2F0ZTogY2VydGlmaWNhdGVtYW5hZ2VyLklDZXJ0aWZpY2F0ZSB8IHVuZGVmaW5lZDtcbiAgICBsZXQgZG9tYWluTmFtZXM6IHN0cmluZ1tdIHwgdW5kZWZpbmVkO1xuICAgIFxuICAgIGlmIChwcm9wcz8uZG9tYWluTmFtZSkge1xuICAgICAgLy8gQ3JlYXRlIFNTTCBjZXJ0aWZpY2F0ZSBpbiB1cy1lYXN0LTEgKHJlcXVpcmVkIGZvciBDbG91ZEZyb250KVxuICAgICAgY2VydGlmaWNhdGUgPSBuZXcgY2VydGlmaWNhdGVtYW5hZ2VyLkNlcnRpZmljYXRlKHRoaXMsICdSYWZmbGVDZXJ0aWZpY2F0ZScsIHtcbiAgICAgICAgZG9tYWluTmFtZTogcHJvcHMuZG9tYWluTmFtZSxcbiAgICAgICAgc3ViamVjdEFsdGVybmF0aXZlTmFtZXM6IFtgd3d3LiR7cHJvcHMuZG9tYWluTmFtZX1gXSxcbiAgICAgICAgdmFsaWRhdGlvbjogY2VydGlmaWNhdGVtYW5hZ2VyLkNlcnRpZmljYXRlVmFsaWRhdGlvbi5mcm9tRG5zKCksXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgZG9tYWluTmFtZXMgPSBbcHJvcHMuZG9tYWluTmFtZSwgYHd3dy4ke3Byb3BzLmRvbWFpbk5hbWV9YF07XG4gICAgfVxuXG4gICAgLy8gQ2xvdWRGcm9udCBEaXN0cmlidXRpb24gd2l0aCBSZWFjdCBSb3V0ZXIgc3VwcG9ydFxuICAgIGNvbnN0IGRpc3RyaWJ1dGlvbiA9IG5ldyBjbG91ZGZyb250LkRpc3RyaWJ1dGlvbih0aGlzLCAnUmFmZmxlRGlzdHJpYnV0aW9uJywge1xuICAgICAgZGVmYXVsdEJlaGF2aW9yOiB7XG4gICAgICAgIG9yaWdpbjogb3JpZ2lucy5TM0J1Y2tldE9yaWdpbi53aXRoT3JpZ2luQWNjZXNzQ29udHJvbCh0aGlzLnMzQnVja2V0LCB7XG4gICAgICAgICAgb3JpZ2luQWNjZXNzQ29udHJvbCxcbiAgICAgICAgfSksXG4gICAgICAgIHZpZXdlclByb3RvY29sUG9saWN5OiBjbG91ZGZyb250LlZpZXdlclByb3RvY29sUG9saWN5LlJFRElSRUNUX1RPX0hUVFBTLFxuICAgICAgICBjYWNoZVBvbGljeTogY2xvdWRmcm9udC5DYWNoZVBvbGljeS5DQUNISU5HX09QVElNSVpFRCxcbiAgICAgIH0sXG4gICAgICBkb21haW5OYW1lcyxcbiAgICAgIGNlcnRpZmljYXRlLFxuICAgICAgc3NsU3VwcG9ydE1ldGhvZDogY2xvdWRmcm9udC5TU0xNZXRob2QuU05JLFxuICAgICAgZGVmYXVsdFJvb3RPYmplY3Q6ICdpbmRleC5odG1sJyxcbiAgICAgIGVycm9yUmVzcG9uc2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBodHRwU3RhdHVzOiA0MDQsXG4gICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiAyMDAsXG4gICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogJy9pbmRleC5odG1sJyxcbiAgICAgICAgICB0dGw6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaHR0cFN0YXR1czogNDAzLFxuICAgICAgICAgIHJlc3BvbnNlSHR0cFN0YXR1czogMjAwLFxuICAgICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6ICcvaW5kZXguaHRtbCcsXG4gICAgICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBtaW5pbXVtUHJvdG9jb2xWZXJzaW9uOiBjbG91ZGZyb250LlNlY3VyaXR5UG9saWN5UHJvdG9jb2wuVExTX1YxXzJfMjAyMSxcbiAgICB9KTtcblxuICAgIC8vIFJvdXRlNTMgRE5TIFJlY29yZHMgYWxyZWFkeSBleGlzdCAtIG1hbmFnZWQgZXh0ZXJuYWxseVxuXG4gICAgdGhpcy5jbG91ZEZyb250RGlzdHJpYnV0aW9uSWQgPSBkaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uSWQ7XG5cbiAgICAvLyBPdXRwdXRzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0J1Y2tldE5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5zM0J1Y2tldC5idWNrZXROYW1lLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0Rpc3RyaWJ1dGlvbklkJywge1xuICAgICAgdmFsdWU6IHRoaXMuY2xvdWRGcm9udERpc3RyaWJ1dGlvbklkLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1dlYnNpdGVVUkwnLCB7XG4gICAgICB2YWx1ZTogcHJvcHM/LmRvbWFpbk5hbWUgPyBgaHR0cHM6Ly8ke3Byb3BzLmRvbWFpbk5hbWV9YCA6IGBodHRwczovLyR7ZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbkRvbWFpbk5hbWV9YCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDbG91ZEZyb250VVJMJywge1xuICAgICAgdmFsdWU6IGBodHRwczovLyR7ZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbkRvbWFpbk5hbWV9YCxcbiAgICB9KTtcbiAgfVxufSJdfQ==