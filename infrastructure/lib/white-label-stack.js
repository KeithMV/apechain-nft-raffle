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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2hpdGUtbGFiZWwtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ3aGl0ZS1sYWJlbC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMseUNBQXlDO0FBQ3pDLHlEQUF5RDtBQUN6RCw4REFBOEQ7QUFDOUQseUVBQXlFO0FBY3pFLE1BQWEsZUFBZ0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUs1QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTJCO1FBQ25FLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsQ0FBQztRQUU3RSxrQ0FBa0M7UUFDbEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDakQsVUFBVSxFQUFFLEdBQUcsVUFBVSxvQkFBb0IsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUMzRCxTQUFTLEVBQUUsSUFBSTtZQUNmLFVBQVUsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsVUFBVTtZQUMxQyxVQUFVLEVBQUUsSUFBSTtZQUNoQixnQkFBZ0IsRUFBRSxLQUFLO1lBQ3ZCLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTO1lBQ2pELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87U0FDekMsQ0FBQyxDQUFDO1FBRUgsOENBQThDO1FBQzlDLElBQUksV0FBd0QsQ0FBQztRQUM3RCxJQUFJLFdBQWlDLENBQUM7UUFFdEMsSUFBSSxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDdkIsV0FBVyxHQUFHLElBQUksa0JBQWtCLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtn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RUFBRSxTQUFTO2lCQUNsQjthQUNGLENBQUM7WUFDRixXQUFXLEVBQUUsK0JBQStCO1NBQzdDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXBHRCwwQ0FvR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIGNsb3VkZnJvbnQgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQnO1xuaW1wb3J0ICogYXMgb3JpZ2lucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udC1vcmlnaW5zJztcbmltcG9ydCAqIGFzIGNlcnRpZmljYXRlbWFuYWdlciBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2VydGlmaWNhdGVtYW5hZ2VyJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFdoaXRlTGFiZWxTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICBjbGllbnROYW1lOiBzdHJpbmc7XG4gIGN1c3RvbURvbWFpbj86IHN0cmluZztcbiAgYnJhbmRDb2xvcnM/OiB7XG4gICAgcHJpbWFyeTogc3RyaW5nO1xuICAgIHNlY29uZGFyeTogc3RyaW5nO1xuICAgIGFjY2VudDogc3RyaW5nO1xuICB9O1xuICBwbGF0Zm9ybUZlZT86IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIFdoaXRlTGFiZWxTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSBidWNrZXROYW1lOiBzdHJpbmc7XG4gIHB1YmxpYyByZWFkb25seSBkaXN0cmlidXRpb25JZDogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgd2Vic2l0ZVVybDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBXaGl0ZUxhYmVsU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3QgY2xpZW50TmFtZSA9IHByb3BzLmNsaWVudE5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9bXmEtejAtOV0vZywgJy0nKTtcblxuICAgIC8vIFMzIEJ1Y2tldCBmb3IgY2xpZW50J3MgZnJvbnRlbmRcbiAgICBjb25zdCBidWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdDbGllbnRCdWNrZXQnLCB7XG4gICAgICBidWNrZXROYW1lOiBgJHtjbGllbnROYW1lfS1yYWZmbGUtcGxhdGZvcm0tJHt0aGlzLmFjY291bnR9YCxcbiAgICAgIHZlcnNpb25lZDogdHJ1ZSxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgIGVuZm9yY2VTU0w6IHRydWUsXG4gICAgICBwdWJsaWNSZWFkQWNjZXNzOiBmYWxzZSxcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuXG4gICAgLy8gU1NMIENlcnRpZmljYXRlIChpZiBjdXN0b20gZG9tYWluIHByb3ZpZGVkKVxuICAgIGxldCBjZXJ0aWZpY2F0ZTogY2VydGlmaWNhdGVtYW5hZ2VyLklDZXJ0aWZpY2F0ZSB8IHVuZGVmaW5lZDtcbiAgICBsZXQgZG9tYWluTmFtZXM6IHN0cmluZ1tdIHwgdW5kZWZpbmVkO1xuICAgIFxuICAgIGlmIChwcm9wcy5jdXN0b21Eb21haW4pIHtcbiAgICAgIGNlcnRpZmljYXRlID0gbmV3IGNlcnRpZmljYXRlbWFuYWdlci5DZXJ0aWZpY2F0ZSh0aGlzLCAnQ2xpZW50Q2VydGlmaWNhdGUnLCB7XG4gICAgICAgIGRvbWFpbk5hbWU6IHByb3BzLmN1c3RvbURvbWFpbixcbiAgICAgICAgc3ViamVjdEFsdGVybmF0aXZlTmFtZXM6IFtgd3d3LiR7cHJvcHMuY3VzdG9tRG9tYWlufWBdLFxuICAgICAgICB2YWxpZGF0aW9uOiBjZXJ0aWZpY2F0ZW1hbmFnZXIuQ2VydGlmaWNhdGVWYWxpZGF0aW9uLmZyb21EbnMoKSxcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBkb21haW5OYW1lcyA9IFtwcm9wcy5jdXN0b21Eb21haW4sIGB3d3cuJHtwcm9wcy5jdXN0b21Eb21haW59YF07XG4gICAgfVxuXG4gICAgLy8gQ2xvdWRGcm9udCBEaXN0cmlidXRpb25cbiAgICBjb25zdCBkaXN0cmlidXRpb24gPSBuZXcgY2xvdWRmcm9udC5EaXN0cmlidXRpb24odGhpcywgJ0NsaWVudERpc3RyaWJ1dGlvbicsIHtcbiAgICAgIGRlZmF1bHRCZWhhdmlvcjoge1xuICAgICAgICBvcmlnaW46IG9yaWdpbnMuUzNCdWNrZXRPcmlnaW4ud2l0aE9yaWdpbkFjY2Vzc0NvbnRyb2woYnVja2V0KSxcbiAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6IGNsb3VkZnJvbnQuVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXG4gICAgICAgIGNhY2hlUG9saWN5OiBjbG91ZGZyb250LkNhY2hlUG9saWN5LkNBQ0hJTkdfT1BUSU1JWkVELFxuICAgICAgfSxcbiAgICAgIGRvbWFpbk5hbWVzLFxuICAgICAgY2VydGlmaWNhdGUsXG4gICAgICBkZWZhdWx0Um9vdE9iamVjdDogJ2luZGV4Lmh0bWwnLFxuICAgICAgZXJyb3JSZXNwb25zZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGh0dHBTdGF0dXM6IDQwNCxcbiAgICAgICAgICByZXNwb25zZUh0dHBTdGF0dXM6IDIwMCxcbiAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiAnL2luZGV4Lmh0bWwnLFxuICAgICAgICAgIHR0bDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBodHRwU3RhdHVzOiA0MDMsXG4gICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiAyMDAsXG4gICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogJy9pbmRleC5odG1sJyxcbiAgICAgICAgICB0dGw6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIFN0b3JlIG91dHB1dHNcbiAgICB0aGlzLmJ1Y2tldE5hbWUgPSBidWNrZXQuYnVja2V0TmFtZTtcbiAgICB0aGlzLmRpc3RyaWJ1dGlvbklkID0gZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkO1xuICAgIHRoaXMud2Vic2l0ZVVybCA9IHByb3BzLmN1c3RvbURvbWFpbiBcbiAgICAgID8gYGh0dHBzOi8vJHtwcm9wcy5jdXN0b21Eb21haW59YCBcbiAgICAgIDogYGh0dHBzOi8vJHtkaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uRG9tYWluTmFtZX1gO1xuXG4gICAgLy8gQ0RLIE91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQnVja2V0TmFtZScsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmJ1Y2tldE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ1MzIGJ1Y2tldCBmb3IgY2xpZW50IGZyb250ZW5kJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdEaXN0cmlidXRpb25JZCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmRpc3RyaWJ1dGlvbklkLFxuICAgICAgZGVzY3JpcHRpb246ICdDbG91ZEZyb250IGRpc3RyaWJ1dGlvbiBJRCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnV2Vic2l0ZVVybCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLndlYnNpdGVVcmwsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NsaWVudCB3ZWJzaXRlIFVSTCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQ2xpZW50Q29uZmlnJywge1xuICAgICAgdmFsdWU6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgY2xpZW50TmFtZTogcHJvcHMuY2xpZW50TmFtZSxcbiAgICAgICAgYnVja2V0TmFtZTogdGhpcy5idWNrZXROYW1lLFxuICAgICAgICBkaXN0cmlidXRpb25JZDogdGhpcy5kaXN0cmlidXRpb25JZCxcbiAgICAgICAgd2Vic2l0ZVVybDogdGhpcy53ZWJzaXRlVXJsLFxuICAgICAgICBwbGF0Zm9ybUZlZTogcHJvcHMucGxhdGZvcm1GZWUgfHwgMTAsXG4gICAgICAgIGJyYW5kQ29sb3JzOiBwcm9wcy5icmFuZENvbG9ycyB8fCB7XG4gICAgICAgICAgcHJpbWFyeTogJyMxMGI5ODEnLFxuICAgICAgICAgIHNlY29uZGFyeTogJyMwZjE3MmEnLCBcbiAgICAgICAgICBhY2NlbnQ6ICcjMDZiNmQ0J1xuICAgICAgICB9XG4gICAgICB9KSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29tcGxldGUgY2xpZW50IGNvbmZpZ3VyYXRpb24nLFxuICAgIH0pO1xuICB9XG59Il19