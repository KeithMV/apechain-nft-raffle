"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhiteLabelStack = void 0;
const cdk = require("aws-cdk-lib");
const s3 = require("aws-cdk-lib/aws-s3");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
const certificatemanager = require("aws-cdk-lib/aws-certificatemanager");
class WhiteLabelStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        let certificate;
        let domainNames;
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
exports.WhiteLabelStack = WhiteLabelStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2hpdGUtbGFiZWwtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ3aGl0ZS1sYWJlbC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMseUNBQXlDO0FBQ3pDLHlEQUF5RDtBQUN6RCw4REFBOEQ7QUFDOUQseUVBQXlFO0FBY3pFLE1BQWEsZUFBZ0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUs1QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTJCO1FBQ25FLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsQ0FBQztRQUU3RSxrQ0FBa0M7UUFDbEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDakQsVUFBVSxFQUFFLEdBQUcsVUFBVSxvQkFBb0IsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUMzRCxTQUFTLEVBQUUsSUFBSTtZQUNmLFVBQVUsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsVUFBVTtZQUMxQyxVQUFVLEVBQUUsSUFBSTtZQUNoQixnQkFBZ0IsRUFBRSxLQUFLO1lBQ3ZCLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTO1lBQ2pELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87U0FDekMsQ0FBQyxDQUFDO1FBRUgsOENBQThDO1FBQzlDLElBQUksV0FBd0QsQ0FBQztRQUM3RCxJQUFJLFdBQWlDLENBQUM7UUFFdEMsSUFBSSxLQUFLLENBQUMsWUFBWSxFQUFFO1lBQ3RCLFdBQVcsR0FBRyxJQUFJLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7Z0JBQzFF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aUJBQ2xCO2FBQ0YsQ0FBQztZQUNGLFdBQVcsRUFBRSwrQkFBK0I7U0FDN0MsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBcEdELDBDQW9HQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgY2xvdWRmcm9udCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udCc7XG5pbXBvcnQgKiBhcyBvcmlnaW5zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250LW9yaWdpbnMnO1xuaW1wb3J0ICogYXMgY2VydGlmaWNhdGVtYW5hZ2VyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jZXJ0aWZpY2F0ZW1hbmFnZXInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgV2hpdGVMYWJlbFN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIGNsaWVudE5hbWU6IHN0cmluZztcbiAgY3VzdG9tRG9tYWluPzogc3RyaW5nO1xuICBicmFuZENvbG9ycz86IHtcbiAgICBwcmltYXJ5OiBzdHJpbmc7XG4gICAgc2Vjb25kYXJ5OiBzdHJpbmc7XG4gICAgYWNjZW50OiBzdHJpbmc7XG4gIH07XG4gIHBsYXRmb3JtRmVlPzogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgV2hpdGVMYWJlbFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IGJ1Y2tldE5hbWU6IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IGRpc3RyaWJ1dGlvbklkOiBzdHJpbmc7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJzaXRlVXJsOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IFdoaXRlTGFiZWxTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCBjbGllbnROYW1lID0gcHJvcHMuY2xpZW50TmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1teYS16MC05XS9nLCAnLScpO1xuXG4gICAgLy8gUzMgQnVja2V0IGZvciBjbGllbnQncyBmcm9udGVuZFxuICAgIGNvbnN0IGJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ0NsaWVudEJ1Y2tldCcsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IGAke2NsaWVudE5hbWV9LXJhZmZsZS1wbGF0Zm9ybS0ke3RoaXMuYWNjb3VudH1gLFxuICAgICAgdmVyc2lvbmVkOiB0cnVlLFxuICAgICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5TM19NQU5BR0VELFxuICAgICAgZW5mb3JjZVNTTDogdHJ1ZSxcbiAgICAgIHB1YmxpY1JlYWRBY2Nlc3M6IGZhbHNlLFxuICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgfSk7XG5cbiAgICAvLyBTU0wgQ2VydGlmaWNhdGUgKGlmIGN1c3RvbSBkb21haW4gcHJvdmlkZWQpXG4gICAgbGV0IGNlcnRpZmljYXRlOiBjZXJ0aWZpY2F0ZW1hbmFnZXIuSUNlcnRpZmljYXRlIHwgdW5kZWZpbmVkO1xuICAgIGxldCBkb21haW5OYW1lczogc3RyaW5nW10gfCB1bmRlZmluZWQ7XG4gICAgXG4gICAgaWYgKHByb3BzLmN1c3RvbURvbWFpbikge1xuICAgICAgY2VydGlmaWNhdGUgPSBuZXcgY2VydGlmaWNhdGVtYW5hZ2VyLkNlcnRpZmljYXRlKHRoaXMsICdDbGllbnRDZXJ0aWZpY2F0ZScsIHtcbiAgICAgICAgZG9tYWluTmFtZTogcHJvcHMuY3VzdG9tRG9tYWluLFxuICAgICAgICBzdWJqZWN0QWx0ZXJuYXRpdmVOYW1lczogW2B3d3cuJHtwcm9wcy5jdXN0b21Eb21haW59YF0sXG4gICAgICAgIHZhbGlkYXRpb246IGNlcnRpZmljYXRlbWFuYWdlci5DZXJ0aWZpY2F0ZVZhbGlkYXRpb24uZnJvbURucygpLFxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGRvbWFpbk5hbWVzID0gW3Byb3BzLmN1c3RvbURvbWFpbiwgYHd3dy4ke3Byb3BzLmN1c3RvbURvbWFpbn1gXTtcbiAgICB9XG5cbiAgICAvLyBDbG91ZEZyb250IERpc3RyaWJ1dGlvblxuICAgIGNvbnN0IGRpc3RyaWJ1dGlvbiA9IG5ldyBjbG91ZGZyb250LkRpc3RyaWJ1dGlvbih0aGlzLCAnQ2xpZW50RGlzdHJpYnV0aW9uJywge1xuICAgICAgZGVmYXVsdEJlaGF2aW9yOiB7XG4gICAgICAgIG9yaWdpbjogb3JpZ2lucy5TM0J1Y2tldE9yaWdpbi53aXRoT3JpZ2luQWNjZXNzQ29udHJvbChidWNrZXQpLFxuICAgICAgICB2aWV3ZXJQcm90b2NvbFBvbGljeTogY2xvdWRmcm9udC5WaWV3ZXJQcm90b2NvbFBvbGljeS5SRURJUkVDVF9UT19IVFRQUyxcbiAgICAgICAgY2FjaGVQb2xpY3k6IGNsb3VkZnJvbnQuQ2FjaGVQb2xpY3kuQ0FDSElOR19PUFRJTUlaRUQsXG4gICAgICB9LFxuICAgICAgZG9tYWluTmFtZXMsXG4gICAgICBjZXJ0aWZpY2F0ZSxcbiAgICAgIGRlZmF1bHRSb290T2JqZWN0OiAnaW5kZXguaHRtbCcsXG4gICAgICBlcnJvclJlc3BvbnNlczogW1xuICAgICAgICB7XG4gICAgICAgICAgaHR0cFN0YXR1czogNDA0LFxuICAgICAgICAgIHJlc3BvbnNlSHR0cFN0YXR1czogMjAwLFxuICAgICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6ICcvaW5kZXguaHRtbCcsXG4gICAgICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGh0dHBTdGF0dXM6IDQwMyxcbiAgICAgICAgICByZXNwb25zZUh0dHBTdGF0dXM6IDIwMCxcbiAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiAnL2luZGV4Lmh0bWwnLFxuICAgICAgICAgIHR0bDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gU3RvcmUgb3V0cHV0c1xuICAgIHRoaXMuYnVja2V0TmFtZSA9IGJ1Y2tldC5idWNrZXROYW1lO1xuICAgIHRoaXMuZGlzdHJpYnV0aW9uSWQgPSBkaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uSWQ7XG4gICAgdGhpcy53ZWJzaXRlVXJsID0gcHJvcHMuY3VzdG9tRG9tYWluIFxuICAgICAgPyBgaHR0cHM6Ly8ke3Byb3BzLmN1c3RvbURvbWFpbn1gIFxuICAgICAgOiBgaHR0cHM6Ly8ke2Rpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25Eb21haW5OYW1lfWA7XG5cbiAgICAvLyBDREsgT3V0cHV0c1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdCdWNrZXROYW1lJywge1xuICAgICAgdmFsdWU6IHRoaXMuYnVja2V0TmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUzMgYnVja2V0IGZvciBjbGllbnQgZnJvbnRlbmQnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0Rpc3RyaWJ1dGlvbklkJywge1xuICAgICAgdmFsdWU6IHRoaXMuZGlzdHJpYnV0aW9uSWQsXG4gICAgICBkZXNjcmlwdGlvbjogJ0Nsb3VkRnJvbnQgZGlzdHJpYnV0aW9uIElEJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdXZWJzaXRlVXJsJywge1xuICAgICAgdmFsdWU6IHRoaXMud2Vic2l0ZVVybCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ2xpZW50IHdlYnNpdGUgVVJMJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDbGllbnRDb25maWcnLCB7XG4gICAgICB2YWx1ZTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBjbGllbnROYW1lOiBwcm9wcy5jbGllbnROYW1lLFxuICAgICAgICBidWNrZXROYW1lOiB0aGlzLmJ1Y2tldE5hbWUsXG4gICAgICAgIGRpc3RyaWJ1dGlvbklkOiB0aGlzLmRpc3RyaWJ1dGlvbklkLFxuICAgICAgICB3ZWJzaXRlVXJsOiB0aGlzLndlYnNpdGVVcmwsXG4gICAgICAgIHBsYXRmb3JtRmVlOiBwcm9wcy5wbGF0Zm9ybUZlZSB8fCAxMCxcbiAgICAgICAgYnJhbmRDb2xvcnM6IHByb3BzLmJyYW5kQ29sb3JzIHx8IHtcbiAgICAgICAgICBwcmltYXJ5OiAnIzEwYjk4MScsXG4gICAgICAgICAgc2Vjb25kYXJ5OiAnIzBmMTcyYScsIFxuICAgICAgICAgIGFjY2VudDogJyMwNmI2ZDQnXG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgICAgZGVzY3JpcHRpb246ICdDb21wbGV0ZSBjbGllbnQgY29uZmlndXJhdGlvbicsXG4gICAgfSk7XG4gIH1cbn0iXX0=