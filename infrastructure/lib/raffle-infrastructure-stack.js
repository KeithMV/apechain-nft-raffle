"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RaffleInfrastructureStack = void 0;
const cdk = require("aws-cdk-lib");
const s3 = require("aws-cdk-lib/aws-s3");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
const certificatemanager = require("aws-cdk-lib/aws-certificatemanager");
const route53 = require("aws-cdk-lib/aws-route53");
const targets = require("aws-cdk-lib/aws-route53-targets");
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
        // Route53 DNS Records (if hosted zone provided)
        if (props?.domainName && props?.hostedZoneId) {
            const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
                hostedZoneId: props.hostedZoneId,
                zoneName: props.domainName,
            });
            // A record for root domain
            new route53.ARecord(this, 'RaffleARecord', {
                zone: hostedZone,
                target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
            });
            // A record for www subdomain
            new route53.ARecord(this, 'RaffleWwwARecord', {
                zone: hostedZone,
                recordName: 'www',
                target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
            });
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFmZmxlLWluZnJhc3RydWN0dXJlLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmFmZmxlLWluZnJhc3RydWN0dXJlLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQyx5Q0FBeUM7QUFDekMseURBQXlEO0FBQ3pELDhEQUE4RDtBQUM5RCx5RUFBeUU7QUFDekUsbURBQW1EO0FBQ25ELDJEQUEyRDtBQVEzRCxNQUFhLHlCQUEwQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBSXRELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0M7UUFDOUUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsaUNBQWlDO1FBQ2pDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxzQkFBc0IsRUFBRTtZQUMxRCxVQUFVLEVBQUUsdUJBQXVCLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNoRSxTQUFTLEVBQUUsSUFBSTtZQUNmLFVBQVUsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsVUFBVTtZQUMxQyxVQUFVLEVBQUUsSUFBSTtZQUNoQixnQkFBZ0IsRUFBRSxLQUFLO1lBQ3ZCLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTO1lBQ2pELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87U0FDekMsQ0FBQyxDQUFDO1FBRUgsNkNBQTZDO1FBQzdDLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxVQUFVLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUNsRixXQUFXLEVBQUUsMEJBQTBCO1NBQ3hDLENBQUMsQ0FBQztRQUVILHdEQUF3RDtRQUN4RCxJQUFJLFdBQXdELENBQUM7UUFDN0QsSUFBSSxXQUFpQyxDQUFDO1FBRXRDLElB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LENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDeEMsS0FBSyxFQUFFLElBQUksQ0FBQyx3QkFBd0I7U0FDckMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDcEMsS0FBSyxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLFdBQVcsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLFlBQVksQ0FBQyxzQkFBc0IsRUFBRTtTQUM1RyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUN2QyxLQUFLLEVBQUUsV0FBVyxZQUFZLENBQUMsc0JBQXNCLEVBQUU7U0FDeEQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBM0dELDhEQTJHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgY2xvdWRmcm9udCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udCc7XG5pbXBvcnQgKiBhcyBvcmlnaW5zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250LW9yaWdpbnMnO1xuaW1wb3J0ICogYXMgY2VydGlmaWNhdGVtYW5hZ2VyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jZXJ0aWZpY2F0ZW1hbmFnZXInO1xuaW1wb3J0ICogYXMgcm91dGU1MyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtcm91dGU1Myc7XG5pbXBvcnQgKiBhcyB0YXJnZXRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1yb3V0ZTUzLXRhcmdldHMnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmFmZmxlSW5mcmFzdHJ1Y3R1cmVTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICBkb21haW5OYW1lPzogc3RyaW5nO1xuICBob3N0ZWRab25lSWQ/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBSYWZmbGVJbmZyYXN0cnVjdHVyZVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IHMzQnVja2V0OiBzMy5CdWNrZXQ7XG4gIHB1YmxpYyByZWFkb25seSBjbG91ZEZyb250RGlzdHJpYnV0aW9uSWQ6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IFJhZmZsZUluZnJhc3RydWN0dXJlU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gUzMgQnVja2V0IGZvciBmcm9udGVuZCBob3N0aW5nXG4gICAgdGhpcy5zM0J1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ1JhZmZsZUZyb250ZW5kQnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogYGFwZWNoYWluLW5mdC1yYWZmbGUtJHt0aGlzLmFjY291bnR9LSR7dGhpcy5yZWdpb259YCxcbiAgICAgIHZlcnNpb25lZDogdHJ1ZSxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgIGVuZm9yY2VTU0w6IHRydWUsXG4gICAgICBwdWJsaWNSZWFkQWNjZXNzOiBmYWxzZSxcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuXG4gICAgLy8gT3JpZ2luIEFjY2VzcyBDb250cm9sIGZvciBzZWN1cmUgUzMgYWNjZXNzXG4gICAgY29uc3Qgb3JpZ2luQWNjZXNzQ29udHJvbCA9IG5ldyBjbG91ZGZyb250LlMzT3JpZ2luQWNjZXNzQ29udHJvbCh0aGlzLCAnUmFmZmxlT0FDJywge1xuICAgICAgZGVzY3JpcHRpb246ICdPQUMgZm9yIFJhZmZsZSBTMyBidWNrZXQnLFxuICAgIH0pO1xuXG4gICAgLy8gU1NMIENlcnRpZmljYXRlIGFuZCBEb21haW4gU2V0dXAgKGlmIGRvbWFpbiBwcm92aWRlZClcbiAgICBsZXQgY2VydGlmaWNhdGU6IGNlcnRpZmljYXRlbWFuYWdlci5JQ2VydGlmaWNhdGUgfCB1bmRlZmluZWQ7XG4gICAgbGV0IGRvbWFpbk5hbWVzOiBzdHJpbmdbXSB8IHVuZGVmaW5lZDtcbiAgICBcbiAgICBpZiAocHJvcHM/LmRvbWFpbk5hbWUpIHtcbiAgICAgIC8vIENyZWF0ZSBTU0wgY2VydGlmaWNhdGUgaW4gdXMtZWFzdC0xIChyZXF1aXJlZCBmb3IgQ2xvdWRGcm9udClcbiAgICAgIGNlcnRpZmljYXRlID0gbmV3IGNlcnRpZmljYXRlbWFuYWdlci5DZXJ0aWZpY2F0ZSh0aGlzLCAnUmFmZmxlQ2VydGlmaWNhdGUnLCB7XG4gICAgICAgIGRvbWFpbk5hbWU6IHByb3BzLmRvbWFpbk5hbWUsXG4gICAgICAgIHN1YmplY3RBbHRlcm5hdGl2ZU5hbWVzOiBbYHd3dy4ke3Byb3BzLmRvbWFpbk5hbWV9YF0sXG4gICAgICAgIHZhbGlkYXRpb246IGNlcnRpZmljYXRlbWFuYWdlci5DZXJ0aWZpY2F0ZVZhbGlkYXRpb24uZnJvbURucygpLFxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGRvbWFpbk5hbWVzID0gW3Byb3BzLmRvbWFpbk5hbWUsIGB3d3cuJHtwcm9wcy5kb21haW5OYW1lfWBdO1xuICAgIH1cblxuICAgIC8vIENsb3VkRnJvbnQgRGlzdHJpYnV0aW9uIHdpdGggUmVhY3QgUm91dGVyIHN1cHBvcnRcbiAgICBjb25zdCBkaXN0cmlidXRpb24gPSBuZXcgY2xvdWRmcm9udC5EaXN0cmlidXRpb24odGhpcywgJ1JhZmZsZURpc3RyaWJ1dGlvbicsIHtcbiAgICAgIGRlZmF1bHRCZWhhdmlvcjoge1xuICAgICAgICBvcmlnaW46IG9yaWdpbnMuUzNCdWNrZXRPcmlnaW4ud2l0aE9yaWdpbkFjY2Vzc0NvbnRyb2wodGhpcy5zM0J1Y2tldCwge1xuICAgICAgICAgIG9yaWdpbkFjY2Vzc0NvbnRyb2wsXG4gICAgICAgIH0pLFxuICAgICAgICB2aWV3ZXJQcm90b2NvbFBvbGljeTogY2xvdWRmcm9udC5WaWV3ZXJQcm90b2NvbFBvbGljeS5SRURJUkVDVF9UT19IVFRQUyxcbiAgICAgICAgY2FjaGVQb2xpY3k6IGNsb3VkZnJvbnQuQ2FjaGVQb2xpY3kuQ0FDSElOR19PUFRJTUlaRUQsXG4gICAgICB9LFxuICAgICAgZG9tYWluTmFtZXMsXG4gICAgICBjZXJ0aWZpY2F0ZSxcbiAgICAgIGRlZmF1bHRSb290T2JqZWN0OiAnaW5kZXguaHRtbCcsXG4gICAgICBlcnJvclJlc3BvbnNlczogW1xuICAgICAgICB7XG4gICAgICAgICAgaHR0cFN0YXR1czogNDA0LFxuICAgICAgICAgIHJlc3BvbnNlSHR0cFN0YXR1czogMjAwLFxuICAgICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6ICcvaW5kZXguaHRtbCcsXG4gICAgICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGh0dHBTdGF0dXM6IDQwMyxcbiAgICAgICAgICByZXNwb25zZUh0dHBTdGF0dXM6IDIwMCxcbiAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiAnL2luZGV4Lmh0bWwnLFxuICAgICAgICAgIHR0bDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgbWluaW11bVByb3RvY29sVmVyc2lvbjogY2xvdWRmcm9udC5TZWN1cml0eVBvbGljeVByb3RvY29sLlRMU19WMV8yXzIwMjEsXG4gICAgfSk7XG5cbiAgICAvLyBSb3V0ZTUzIEROUyBSZWNvcmRzIChpZiBob3N0ZWQgem9uZSBwcm92aWRlZClcbiAgICBpZiAocHJvcHM/LmRvbWFpbk5hbWUgJiYgcHJvcHM/Lmhvc3RlZFpvbmVJZCkge1xuICAgICAgY29uc3QgaG9zdGVkWm9uZSA9IHJvdXRlNTMuSG9zdGVkWm9uZS5mcm9tSG9zdGVkWm9uZUF0dHJpYnV0ZXModGhpcywgJ0hvc3RlZFpvbmUnLCB7XG4gICAgICAgIGhvc3RlZFpvbmVJZDogcHJvcHMuaG9zdGVkWm9uZUlkLFxuICAgICAgICB6b25lTmFtZTogcHJvcHMuZG9tYWluTmFtZSxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBBIHJlY29yZCBmb3Igcm9vdCBkb21haW5cbiAgICAgIG5ldyByb3V0ZTUzLkFSZWNvcmQodGhpcywgJ1JhZmZsZUFSZWNvcmQnLCB7XG4gICAgICAgIHpvbmU6IGhvc3RlZFpvbmUsXG4gICAgICAgIHRhcmdldDogcm91dGU1My5SZWNvcmRUYXJnZXQuZnJvbUFsaWFzKG5ldyB0YXJnZXRzLkNsb3VkRnJvbnRUYXJnZXQoZGlzdHJpYnV0aW9uKSksXG4gICAgICB9KTtcblxuICAgICAgLy8gQSByZWNvcmQgZm9yIHd3dyBzdWJkb21haW5cbiAgICAgIG5ldyByb3V0ZTUzLkFSZWNvcmQodGhpcywgJ1JhZmZsZVd3d0FSZWNvcmQnLCB7XG4gICAgICAgIHpvbmU6IGhvc3RlZFpvbmUsXG4gICAgICAgIHJlY29yZE5hbWU6ICd3d3cnLFxuICAgICAgICB0YXJnZXQ6IHJvdXRlNTMuUmVjb3JkVGFyZ2V0LmZyb21BbGlhcyhuZXcgdGFyZ2V0cy5DbG91ZEZyb250VGFyZ2V0KGRpc3RyaWJ1dGlvbikpLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy5jbG91ZEZyb250RGlzdHJpYnV0aW9uSWQgPSBkaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uSWQ7XG5cbiAgICAvLyBPdXRwdXRzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0J1Y2tldE5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5zM0J1Y2tldC5idWNrZXROYW1lLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0Rpc3RyaWJ1dGlvbklkJywge1xuICAgICAgdmFsdWU6IHRoaXMuY2xvdWRGcm9udERpc3RyaWJ1dGlvbklkLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1dlYnNpdGVVUkwnLCB7XG4gICAgICB2YWx1ZTogcHJvcHM/LmRvbWFpbk5hbWUgPyBgaHR0cHM6Ly8ke3Byb3BzLmRvbWFpbk5hbWV9YCA6IGBodHRwczovLyR7ZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbkRvbWFpbk5hbWV9YCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDbG91ZEZyb250VVJMJywge1xuICAgICAgdmFsdWU6IGBodHRwczovLyR7ZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbkRvbWFpbk5hbWV9YCxcbiAgICB9KTtcbiAgfVxufSJdfQ==