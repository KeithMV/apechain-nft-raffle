"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RaffleStagingStack = void 0;
const cdk = require("aws-cdk-lib");
const s3 = require("aws-cdk-lib/aws-s3");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
const certificatemanager = require("aws-cdk-lib/aws-certificatemanager");
class RaffleStagingStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        const certificate = certificatemanager.Certificate.fromCertificateArn(this, 'StagingCertificate', props.certificateArn);
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
exports.RaffleStagingStack = RaffleStagingStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFmZmxlLXN0YWdpbmctc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyYWZmbGUtc3RhZ2luZy1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMseUNBQXlDO0FBQ3pDLHlEQUF5RDtBQUN6RCw4REFBOEQ7QUFDOUQseUVBQXlFO0FBUXpFLE1BQWEsa0JBQW1CLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFJL0MsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUE4QjtRQUN0RSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixpQ0FBaUM7UUFDakMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLHVCQUF1QixFQUFFO1lBQzNELFVBQVUsRUFBRSxrQ0FBa0MsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQzNFLFNBQVMsRUFBRSxJQUFJO1lBQ2YsVUFBVSxFQUFFLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVO1lBQzFDLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLGdCQUFnQixFQUFFLEtBQUs7WUFDdkIsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFNBQVM7WUFDakQsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztTQUN6QyxDQUFDLENBQUM7UUFFSCx3QkFBd0I7UUFDeEIsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDM0YsV0FBVyxFQUFFLHFDQUFxQztTQUNuRCxDQUFDLENBQUM7UUFFSCw4QkFBOEI7UUFDOUIsTUFBTSxXQUFXLEdBQUcsa0JBQWtCLENBQUMsV0FBVyxDQUFDLGtCQUFrQixDQUNuRSxJQUFJLEVBQ0osb0JBQW9CLEVBQ3BCLEtBQUssQ0FBQyxjQUFjLENBQ3JCLENBQUM7UUFFRixzQ0FBc0M7UUFDdEMsTUFBTSxZQUFZLEdBQUcsSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSw2QkFBNkIsRUFBRTtZQUNwRixlQUFlLEVBQUU7Z0JBQ2YsTUFBTSxFQUFFLE9BQU8sQ0FBQyxjQUFjLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtvQkFDcEUsbUJBQW1CO2lCQUNwQixDQUFDO2dCQUNGLG9CQUFvQixFQUFFLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxpQkFBaUI7Z0JBQ3ZFLFdBQVcsRUFBRSxVQUFVLENBQUMsV0FBVyxDQUFDLGdCQUFnQixFQUFFLDRCQUE0QjthQUNuRjtZQUNELGdGQUFnRjtZQUNoRiw0REFBNEQ7WUFDNUQsZ0JBQWdCLEVBQUUsVUFBVSxDQUFDLFNBQVMsQ0FBQyxHQUFHO1lBQzFDLGlCQUFpQixFQUFFLFlBQVk7WUFDL0IsY0FBYyxFQUFFO2dCQUNkO29CQUNFLFVBQVUsRUFBRSxHQUFHO29CQUNmLGtCQUFrQixFQUFFLEdBQUc7b0JBQ3ZCLGdCQUFnQixFQUFFLGFBQWE7b0JBQy9CLEdBQUcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSx5QkFBeUI7aUJBQ3hEO2dCQUNEO29CQUNFLFVBQVUsRUFBRSxHQUFHO29CQUNmLGtCQUFrQixFQUFFLEdBQUc7b0JBQ3ZCLGdCQUFnQixFQUFFLGFBQWE7b0JBQy9CLEdBQUcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7aUJBQzdCO2FBQ0Y7WUFDRCxzQkFBc0IsRUFBRSxVQUFVLENBQUMsc0JBQXNCLENBQUMsYUFBYTtTQUN4RSxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsd0JBQXdCLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBQztRQUU1RCxVQUFVO1FBQ1YsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUMzQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVO1NBQ2hDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLEVBQUU7WUFDL0MsS0FBSyxFQUFFLElBQUksQ0FBQyx3QkFBd0I7U0FDckMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUMzQyxLQUFLLEVBQUUsV0FBVyxLQUFLLENBQUMsVUFBVSxFQUFFO1NBQ3JDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLEVBQUU7WUFDOUMsS0FBSyxFQUFFLFdBQVcsWUFBWSxDQUFDLHNCQUFzQixFQUFFO1NBQ3hELENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQS9FRCxnREErRUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIGNsb3VkZnJvbnQgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQnO1xuaW1wb3J0ICogYXMgb3JpZ2lucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udC1vcmlnaW5zJztcbmltcG9ydCAqIGFzIGNlcnRpZmljYXRlbWFuYWdlciBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2VydGlmaWNhdGVtYW5hZ2VyJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJhZmZsZVN0YWdpbmdTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICBkb21haW5OYW1lOiBzdHJpbmc7XG4gIGNlcnRpZmljYXRlQXJuOiBzdHJpbmc7IC8vIFVzZSBleGlzdGluZyBjZXJ0IHRoYXQgY292ZXJzICouYXBlY2hhaW5yYWZmbGVzLmlvXG59XG5cbmV4cG9ydCBjbGFzcyBSYWZmbGVTdGFnaW5nU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgczNCdWNrZXQ6IHMzLkJ1Y2tldDtcbiAgcHVibGljIHJlYWRvbmx5IGNsb3VkRnJvbnREaXN0cmlidXRpb25JZDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBSYWZmbGVTdGFnaW5nU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gUzMgQnVja2V0IGZvciBzdGFnaW5nIGZyb250ZW5kXG4gICAgdGhpcy5zM0J1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ1JhZmZsZVN0YWdpbmdWMkJ1Y2tldCcsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IGBhcGVjaGFpbi1uZnQtcmFmZmxlLXN0YWdpbmctdjItJHt0aGlzLmFjY291bnR9LSR7dGhpcy5yZWdpb259YCxcbiAgICAgIHZlcnNpb25lZDogdHJ1ZSxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgIGVuZm9yY2VTU0w6IHRydWUsXG4gICAgICBwdWJsaWNSZWFkQWNjZXNzOiBmYWxzZSxcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuXG4gICAgLy8gT3JpZ2luIEFjY2VzcyBDb250cm9sXG4gICAgY29uc3Qgb3JpZ2luQWNjZXNzQ29udHJvbCA9IG5ldyBjbG91ZGZyb250LlMzT3JpZ2luQWNjZXNzQ29udHJvbCh0aGlzLCAnUmFmZmxlU3RhZ2luZ1YyT0FDJywge1xuICAgICAgZGVzY3JpcHRpb246ICdPQUMgZm9yIFJhZmZsZSBTdGFnaW5nIFYyIFMzIGJ1Y2tldCcsXG4gICAgfSk7XG5cbiAgICAvLyBJbXBvcnQgZXhpc3RpbmcgY2VydGlmaWNhdGVcbiAgICBjb25zdCBjZXJ0aWZpY2F0ZSA9IGNlcnRpZmljYXRlbWFuYWdlci5DZXJ0aWZpY2F0ZS5mcm9tQ2VydGlmaWNhdGVBcm4oXG4gICAgICB0aGlzLCBcbiAgICAgICdTdGFnaW5nQ2VydGlmaWNhdGUnLCBcbiAgICAgIHByb3BzLmNlcnRpZmljYXRlQXJuXG4gICAgKTtcblxuICAgIC8vIENsb3VkRnJvbnQgRGlzdHJpYnV0aW9uIGZvciBzdGFnaW5nXG4gICAgY29uc3QgZGlzdHJpYnV0aW9uID0gbmV3IGNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uKHRoaXMsICdSYWZmbGVTdGFnaW5nVjJEaXN0cmlidXRpb24nLCB7XG4gICAgICBkZWZhdWx0QmVoYXZpb3I6IHtcbiAgICAgICAgb3JpZ2luOiBvcmlnaW5zLlMzQnVja2V0T3JpZ2luLndpdGhPcmlnaW5BY2Nlc3NDb250cm9sKHRoaXMuczNCdWNrZXQsIHtcbiAgICAgICAgICBvcmlnaW5BY2Nlc3NDb250cm9sLFxuICAgICAgICB9KSxcbiAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6IGNsb3VkZnJvbnQuVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXG4gICAgICAgIGNhY2hlUG9saWN5OiBjbG91ZGZyb250LkNhY2hlUG9saWN5LkNBQ0hJTkdfRElTQUJMRUQsIC8vIERpc2FibGUgY2FjaGUgZm9yIHN0YWdpbmdcbiAgICAgIH0sXG4gICAgICAvLyBkb21haW5OYW1lczogW3Byb3BzLmRvbWFpbk5hbWVdLCAvLyBDb21tZW50ZWQgb3V0IC0gd2lsbCBhZGQgYWZ0ZXIgRE5TIHN3aXRjaFxuICAgICAgLy8gY2VydGlmaWNhdGUsIC8vIENvbW1lbnRlZCBvdXQgLSB3aWxsIGFkZCBhZnRlciBETlMgc3dpdGNoXG4gICAgICBzc2xTdXBwb3J0TWV0aG9kOiBjbG91ZGZyb250LlNTTE1ldGhvZC5TTkksXG4gICAgICBkZWZhdWx0Um9vdE9iamVjdDogJ2luZGV4Lmh0bWwnLFxuICAgICAgZXJyb3JSZXNwb25zZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGh0dHBTdGF0dXM6IDQwNCxcbiAgICAgICAgICByZXNwb25zZUh0dHBTdGF0dXM6IDIwMCxcbiAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiAnL2luZGV4Lmh0bWwnLFxuICAgICAgICAgIHR0bDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMCksIC8vIE5vIGNhY2hpbmcgZm9yIHN0YWdpbmdcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGh0dHBTdGF0dXM6IDQwMyxcbiAgICAgICAgICByZXNwb25zZUh0dHBTdGF0dXM6IDIwMCxcbiAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiAnL2luZGV4Lmh0bWwnLFxuICAgICAgICAgIHR0bDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMCksXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgbWluaW11bVByb3RvY29sVmVyc2lvbjogY2xvdWRmcm9udC5TZWN1cml0eVBvbGljeVByb3RvY29sLlRMU19WMV8yXzIwMjEsXG4gICAgfSk7XG5cbiAgICB0aGlzLmNsb3VkRnJvbnREaXN0cmlidXRpb25JZCA9IGRpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25JZDtcblxuICAgIC8vIE91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnU3RhZ2luZ0J1Y2tldE5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5zM0J1Y2tldC5idWNrZXROYW1lLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1N0YWdpbmdEaXN0cmlidXRpb25JZCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmNsb3VkRnJvbnREaXN0cmlidXRpb25JZCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdTdGFnaW5nV2Vic2l0ZVVSTCcsIHtcbiAgICAgIHZhbHVlOiBgaHR0cHM6Ly8ke3Byb3BzLmRvbWFpbk5hbWV9YCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdTdGFnaW5nQ2xvdWRGcm9udFVSTCcsIHtcbiAgICAgIHZhbHVlOiBgaHR0cHM6Ly8ke2Rpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25Eb21haW5OYW1lfWAsXG4gICAgfSk7XG4gIH1cbn0iXX0=