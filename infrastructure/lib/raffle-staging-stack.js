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
            bucketName: `apechain-nft-raffle-${props.environment}-v2-${this.account}-${this.region}`,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFmZmxlLXN0YWdpbmctc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyYWZmbGUtc3RhZ2luZy1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMseUNBQXlDO0FBQ3pDLHlEQUF5RDtBQUN6RCw4REFBOEQ7QUFDOUQseUVBQXlFO0FBU3pFLE1BQWEsa0JBQW1CLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFJL0MsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUE4QjtRQUN0RSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixpQ0FBaUM7UUFDakMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLHVCQUF1QixFQUFFO1lBQzNELFVBQVUsRUFBRSx1QkFBdUIsS0FBSyxDQUFDLFdBQVcsT0FBTyxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDeEYsU0FBUyxFQUFFLElBQUk7WUFDZixVQUFVLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFVBQVU7WUFDMUMsVUFBVSxFQUFFLElBQUk7WUFDaEIsZ0JBQWdCLEVBQUUsS0FBSztZQUN2QixpQkFBaUIsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUztZQUNqRCxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1NBQ3pDLENBQUMsQ0FBQztRQUVILHdCQUF3QjtRQUN4QixNQUFNLG1CQUFtQixHQUFHLElBQUksVUFBVSxDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRSxvQkFBb0IsRUFBRTtZQUMzRixXQUFXLEVBQUUscUNBQXFDO1NBQ25ELENBQUMsQ0FBQztRQUVILDhCQUE4QjtRQUM5QixNQUFNLFdBQVcsR0FBRyxrQkFBa0IsQ0FBQyxXQUFXLENBQUMsa0JBQWtCLENBQ25FLElBQUksRUFDSixvQkFBb0IsRUFDcEIsS0FBSyxDQUFDLGNBQWMsQ0FDckIsQ0FBQztRQUVGLHNDQUFzQztRQUN0QyxNQUFNLFlBQVksR0FBRyxJQUFJLFVBQVUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLDZCQUE2QixFQUFFO1lBQ3BGLGVBQWUsRUFBRTtnQkFDZixNQUFNLEVBQUUsT0FBTyxDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO29CQUNwRSxtQkFBbUI7aUJBQ3BCLENBQUM7Z0JBQ0Ysb0JBQW9CLEVBQUUsVUFBVSxDQUFDLG9CQUFvQixDQUFDLGlCQUFpQjtnQkFDdkUsV0FBVyxFQUFFLFVBQVUsQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLEVBQUUsNEJBQTRCO2FBQ25GO1lBQ0QsZ0ZBQWdGO1lBQ2hGLDREQUE0RDtZQUM1RCxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsU0FBUyxDQUFDLEdBQUc7WUFDMUMsaUJBQWlCLEVBQUUsWUFBWTtZQUMvQixjQUFjLEVBQUU7Z0JBQ2Q7b0JBQ0UsVUFBVSxFQUFFLEdBQUc7b0JBQ2Ysa0JBQWtCLEVBQUUsR0FBRztvQkFDdkIsZ0JBQWdCLEVBQUUsYUFBYTtvQkFDL0IsR0FBRyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLHlCQUF5QjtpQkFDeEQ7Z0JBQ0Q7b0JBQ0UsVUFBVSxFQUFFLEdBQUc7b0JBQ2Ysa0JBQWtCLEVBQUUsR0FBRztvQkFDdkIsZ0JBQWdCLEVBQUUsYUFBYTtvQkFDL0IsR0FBRyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztpQkFDN0I7YUFDRjtZQUNELHNCQUFzQixFQUFFLFVBQVUsQ0FBQyxzQkFBc0IsQ0FBQyxhQUFhO1NBQ3hFLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx3QkFBd0IsR0FBRyxZQUFZLENBQUMsY0FBYyxDQUFDO1FBRTVELFVBQVU7UUFDVixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQzNDLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVU7U0FDaEMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSx1QkFBdUIsRUFBRTtZQUMvQyxLQUFLLEVBQUUsSUFBSSxDQUFDLHdCQUF3QjtTQUNyQyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQzNDLEtBQUssRUFBRSxXQUFXLEtBQUssQ0FBQyxVQUFVLEVBQUU7U0FDckMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxzQkFBc0IsRUFBRTtZQUM5QyxLQUFLLEVBQUUsV0FBVyxZQUFZLENBQUMsc0JBQXNCLEVBQUU7U0FDeEQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBL0VELGdEQStFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgY2xvdWRmcm9udCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udCc7XG5pbXBvcnQgKiBhcyBvcmlnaW5zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250LW9yaWdpbnMnO1xuaW1wb3J0ICogYXMgY2VydGlmaWNhdGVtYW5hZ2VyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jZXJ0aWZpY2F0ZW1hbmFnZXInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmFmZmxlU3RhZ2luZ1N0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIGRvbWFpbk5hbWU6IHN0cmluZztcbiAgY2VydGlmaWNhdGVBcm46IHN0cmluZzsgLy8gVXNlIGV4aXN0aW5nIGNlcnQgdGhhdCBjb3ZlcnMgKi5hcGVjaGFpbnJhZmZsZXMuaW9cbiAgZW52aXJvbm1lbnQ6IHN0cmluZzsgLy8gJ3N0YWdpbmcnXG59XG5cbmV4cG9ydCBjbGFzcyBSYWZmbGVTdGFnaW5nU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgczNCdWNrZXQ6IHMzLkJ1Y2tldDtcbiAgcHVibGljIHJlYWRvbmx5IGNsb3VkRnJvbnREaXN0cmlidXRpb25JZDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBSYWZmbGVTdGFnaW5nU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gUzMgQnVja2V0IGZvciBzdGFnaW5nIGZyb250ZW5kXG4gICAgdGhpcy5zM0J1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ1JhZmZsZVN0YWdpbmdWMkJ1Y2tldCcsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IGBhcGVjaGFpbi1uZnQtcmFmZmxlLSR7cHJvcHMuZW52aXJvbm1lbnR9LXYyLSR7dGhpcy5hY2NvdW50fS0ke3RoaXMucmVnaW9ufWAsXG4gICAgICB2ZXJzaW9uZWQ6IHRydWUsXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgICBlbmZvcmNlU1NMOiB0cnVlLFxuICAgICAgcHVibGljUmVhZEFjY2VzczogZmFsc2UsXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICB9KTtcblxuICAgIC8vIE9yaWdpbiBBY2Nlc3MgQ29udHJvbFxuICAgIGNvbnN0IG9yaWdpbkFjY2Vzc0NvbnRyb2wgPSBuZXcgY2xvdWRmcm9udC5TM09yaWdpbkFjY2Vzc0NvbnRyb2wodGhpcywgJ1JhZmZsZVN0YWdpbmdWMk9BQycsIHtcbiAgICAgIGRlc2NyaXB0aW9uOiAnT0FDIGZvciBSYWZmbGUgU3RhZ2luZyBWMiBTMyBidWNrZXQnLFxuICAgIH0pO1xuXG4gICAgLy8gSW1wb3J0IGV4aXN0aW5nIGNlcnRpZmljYXRlXG4gICAgY29uc3QgY2VydGlmaWNhdGUgPSBjZXJ0aWZpY2F0ZW1hbmFnZXIuQ2VydGlmaWNhdGUuZnJvbUNlcnRpZmljYXRlQXJuKFxuICAgICAgdGhpcywgXG4gICAgICAnU3RhZ2luZ0NlcnRpZmljYXRlJywgXG4gICAgICBwcm9wcy5jZXJ0aWZpY2F0ZUFyblxuICAgICk7XG5cbiAgICAvLyBDbG91ZEZyb250IERpc3RyaWJ1dGlvbiBmb3Igc3RhZ2luZ1xuICAgIGNvbnN0IGRpc3RyaWJ1dGlvbiA9IG5ldyBjbG91ZGZyb250LkRpc3RyaWJ1dGlvbih0aGlzLCAnUmFmZmxlU3RhZ2luZ1YyRGlzdHJpYnV0aW9uJywge1xuICAgICAgZGVmYXVsdEJlaGF2aW9yOiB7XG4gICAgICAgIG9yaWdpbjogb3JpZ2lucy5TM0J1Y2tldE9yaWdpbi53aXRoT3JpZ2luQWNjZXNzQ29udHJvbCh0aGlzLnMzQnVja2V0LCB7XG4gICAgICAgICAgb3JpZ2luQWNjZXNzQ29udHJvbCxcbiAgICAgICAgfSksXG4gICAgICAgIHZpZXdlclByb3RvY29sUG9saWN5OiBjbG91ZGZyb250LlZpZXdlclByb3RvY29sUG9saWN5LlJFRElSRUNUX1RPX0hUVFBTLFxuICAgICAgICBjYWNoZVBvbGljeTogY2xvdWRmcm9udC5DYWNoZVBvbGljeS5DQUNISU5HX0RJU0FCTEVELCAvLyBEaXNhYmxlIGNhY2hlIGZvciBzdGFnaW5nXG4gICAgICB9LFxuICAgICAgLy8gZG9tYWluTmFtZXM6IFtwcm9wcy5kb21haW5OYW1lXSwgLy8gQ29tbWVudGVkIG91dCAtIHdpbGwgYWRkIGFmdGVyIEROUyBzd2l0Y2hcbiAgICAgIC8vIGNlcnRpZmljYXRlLCAvLyBDb21tZW50ZWQgb3V0IC0gd2lsbCBhZGQgYWZ0ZXIgRE5TIHN3aXRjaFxuICAgICAgc3NsU3VwcG9ydE1ldGhvZDogY2xvdWRmcm9udC5TU0xNZXRob2QuU05JLFxuICAgICAgZGVmYXVsdFJvb3RPYmplY3Q6ICdpbmRleC5odG1sJyxcbiAgICAgIGVycm9yUmVzcG9uc2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBodHRwU3RhdHVzOiA0MDQsXG4gICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiAyMDAsXG4gICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogJy9pbmRleC5odG1sJyxcbiAgICAgICAgICB0dGw6IGNkay5EdXJhdGlvbi5taW51dGVzKDApLCAvLyBObyBjYWNoaW5nIGZvciBzdGFnaW5nXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBodHRwU3RhdHVzOiA0MDMsXG4gICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiAyMDAsXG4gICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogJy9pbmRleC5odG1sJyxcbiAgICAgICAgICB0dGw6IGNkay5EdXJhdGlvbi5taW51dGVzKDApLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIG1pbmltdW1Qcm90b2NvbFZlcnNpb246IGNsb3VkZnJvbnQuU2VjdXJpdHlQb2xpY3lQcm90b2NvbC5UTFNfVjFfMl8yMDIxLFxuICAgIH0pO1xuXG4gICAgdGhpcy5jbG91ZEZyb250RGlzdHJpYnV0aW9uSWQgPSBkaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uSWQ7XG5cbiAgICAvLyBPdXRwdXRzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1N0YWdpbmdCdWNrZXROYW1lJywge1xuICAgICAgdmFsdWU6IHRoaXMuczNCdWNrZXQuYnVja2V0TmFtZSxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdTdGFnaW5nRGlzdHJpYnV0aW9uSWQnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5jbG91ZEZyb250RGlzdHJpYnV0aW9uSWQsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnU3RhZ2luZ1dlYnNpdGVVUkwnLCB7XG4gICAgICB2YWx1ZTogYGh0dHBzOi8vJHtwcm9wcy5kb21haW5OYW1lfWAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnU3RhZ2luZ0Nsb3VkRnJvbnRVUkwnLCB7XG4gICAgICB2YWx1ZTogYGh0dHBzOi8vJHtkaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uRG9tYWluTmFtZX1gLFxuICAgIH0pO1xuICB9XG59Il19