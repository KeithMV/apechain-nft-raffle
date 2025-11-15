"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CicdStack = void 0;
const cdk = require("aws-cdk-lib");
const codebuild = require("aws-cdk-lib/aws-codebuild");
const codepipeline = require("aws-cdk-lib/aws-codepipeline");
const codepipeline_actions = require("aws-cdk-lib/aws-codepipeline-actions");
const iam = require("aws-cdk-lib/aws-iam");
class CicdStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const sourceOutput = new codepipeline.Artifact();
        const buildOutput = new codepipeline.Artifact();
        // Frontend CodeBuild Project
        const frontendBuildProject = new codebuild.Project(this, 'RaffleFrontendBuild', {
            source: codebuild.Source.gitHub({
                owner: 'KeithMV',
                repo: 'apechain-nft-raffle',
            }),
            buildSpec: codebuild.BuildSpec.fromSourceFilename('frontend/buildspec.yml'),
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
                computeType: codebuild.ComputeType.SMALL,
            },
            environmentVariables: {
                S3_BUCKET: { value: props.s3Bucket.bucketName },
                CLOUDFRONT_DISTRIBUTION_ID: { value: props.cloudFrontDistributionId },
            },
        });
        // Grant permissions
        props.s3Bucket.grantReadWrite(frontendBuildProject);
        frontendBuildProject.addToRolePolicy(new iam.PolicyStatement({
            actions: ['cloudfront:CreateInvalidation'],
            resources: [`arn:aws:cloudfront::${this.account}:distribution/${props.cloudFrontDistributionId}`],
        }));
        // Pipeline
        new codepipeline.Pipeline(this, 'RafflePipeline', {
            pipelineName: 'NFT-Raffle-Pipeline',
            stages: [
                {
                    stageName: 'Source',
                    actions: [
                        new codepipeline_actions.GitHubSourceAction({
                            actionName: 'GitHub_Source',
                            owner: 'KeithMV',
                            repo: 'apechain-nft-raffle',
                            branch: 'main',
                            oauthToken: cdk.SecretValue.secretsManager('github-token'),
                            output: sourceOutput,
                        }),
                    ],
                },
                {
                    stageName: 'Build',
                    actions: [
                        new codepipeline_actions.CodeBuildAction({
                            actionName: 'Build_Frontend',
                            project: frontendBuildProject,
                            input: sourceOutput,
                            outputs: [buildOutput],
                        }),
                    ],
                },
            ],
        });
    }
}
exports.CicdStack = CicdStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2ljZC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNpY2Qtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW1DO0FBQ25DLHVEQUF1RDtBQUN2RCw2REFBNkQ7QUFDN0QsNkVBQTZFO0FBRTdFLDJDQUEyQztBQVEzQyxNQUFhLFNBQVUsU0FBUSxHQUFHLENBQUMsS0FBSztJQUN0QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXFCO1FBQzdELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sWUFBWSxHQUFHLElBQUksWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2pELE1BQU0sV0FBVyxHQUFHLElBQUksWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRWhELDZCQUE2QjtRQUM3QixNQUFNLG9CQUFvQixHQUFHLElBQUksU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUscUJBQXFCLEVBQUU7WUFDOUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO2dCQUM5QixLQUFLLEVBQUUsU0FBUztnQkFDaEIsSUFBSSxFQUFFLHFCQUFxQjthQUM1QixDQUFDO1lBQ0YsU0FBUyxFQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsd0JBQXdCLENBQUM7WUFDM0UsV0FBVyxFQUFFO2dCQUNYLFVBQVUsRUFBRSxTQUFTLENBQUMsZUFBZSxDQUFDLFlBQVk7Z0JBQ2xELFdBQVcsRUFBRSxTQUFTLENBQUMsV0FBVyxDQUFDLEtBQUs7YUFDekM7WUFDRCxvQkFBb0IsRUFBRTtnQkFDcEIsU0FBUyxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFO2dCQUMvQywwQkFBMEIsRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsd0JBQXdCLEVBQUU7YUFDdEU7U0FDRixDQUFDLENBQUM7UUFFSCxvQkFBb0I7UUFDcEIsS0FBSyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUNwRCxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO1lBQzNELE9BQU8sRUFBRSxDQUFDLCtCQUErQixDQUFDO1lBQzFDLFNBQVMsRUFBRSxDQUFDLHVCQUF1QixJQUFJLENBQUMsT0FBTyxpQkFBaUIsS0FBSyxDQUFDLHdCQUF3QixFQUFFLENBQUM7U0FDbEcsQ0FBQyxDQUFDLENBQUM7UUFFSixXQUFXO1FBQ1gsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUNoRCxZQUFZLEVBQUUscUJBQXFCO1lBQ25DLE1BQU0sRUFBRTtnQkFDTjtvQkFDRSxTQUFTLEVBQUUsUUFBUTtvQkFDbkIsT0FBTyxFQUFFO3dCQUNQLElBQUksb0JBQW9CLENBQUMsa0JBQWtCLENBQUM7NEJBQzFDLFVBQVUsRUFBRSxlQUFlOzRCQUMzQixLQUFLLEVBQUUsU0FBUzs0QkFDaEIsSUFBSSxFQUFFLHFCQUFxQjs0QkFDM0IsTUFBTSxFQUFFLE1BQU07NEJBQ2QsVUFBVSxFQUFFLEdBQUcsQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQzs0QkFDMUQsTUFBTSxFQUFFLFlBQVk7eUJBQ3JCLENBQUM7cUJBQ0g7aUJBQ0Y7Z0JBQ0Q7b0JBQ0UsU0FBUyxFQUFFLE9BQU87b0JBQ2xCLE9BQU8sRUFBRTt3QkFDUCxJQUFJLG9CQUFvQixDQUFDLGVBQWUsQ0FBQzs0QkFDdkMsVUFBVSxFQUFFLGdCQUFnQjs0QkFDNUIsT0FBTyxFQUFFLG9CQUFvQjs0QkFDN0IsS0FBSyxFQUFFLFlBQVk7NEJBQ25CLE9BQU8sRUFBRSxDQUFDLFdBQVcsQ0FBQzt5QkFDdkIsQ0FBQztxQkFDSDtpQkFDRjthQUNGO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBOURELDhCQThEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBjb2RlYnVpbGQgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVidWlsZCc7XG5pbXBvcnQgKiBhcyBjb2RlcGlwZWxpbmUgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVwaXBlbGluZSc7XG5pbXBvcnQgKiBhcyBjb2RlcGlwZWxpbmVfYWN0aW9ucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY29kZXBpcGVsaW5lLWFjdGlvbnMnO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5pbnRlcmZhY2UgQ2ljZFN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIHMzQnVja2V0OiBzMy5CdWNrZXQ7XG4gIGNsb3VkRnJvbnREaXN0cmlidXRpb25JZDogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQ2ljZFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IENpY2RTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCBzb3VyY2VPdXRwdXQgPSBuZXcgY29kZXBpcGVsaW5lLkFydGlmYWN0KCk7XG4gICAgY29uc3QgYnVpbGRPdXRwdXQgPSBuZXcgY29kZXBpcGVsaW5lLkFydGlmYWN0KCk7XG5cbiAgICAvLyBGcm9udGVuZCBDb2RlQnVpbGQgUHJvamVjdFxuICAgIGNvbnN0IGZyb250ZW5kQnVpbGRQcm9qZWN0ID0gbmV3IGNvZGVidWlsZC5Qcm9qZWN0KHRoaXMsICdSYWZmbGVGcm9udGVuZEJ1aWxkJywge1xuICAgICAgc291cmNlOiBjb2RlYnVpbGQuU291cmNlLmdpdEh1Yih7XG4gICAgICAgIG93bmVyOiAnS2VpdGhNVicsXG4gICAgICAgIHJlcG86ICdhcGVjaGFpbi1uZnQtcmFmZmxlJyxcbiAgICAgIH0pLFxuICAgICAgYnVpbGRTcGVjOiBjb2RlYnVpbGQuQnVpbGRTcGVjLmZyb21Tb3VyY2VGaWxlbmFtZSgnZnJvbnRlbmQvYnVpbGRzcGVjLnltbCcpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgYnVpbGRJbWFnZTogY29kZWJ1aWxkLkxpbnV4QnVpbGRJbWFnZS5TVEFOREFSRF81XzAsXG4gICAgICAgIGNvbXB1dGVUeXBlOiBjb2RlYnVpbGQuQ29tcHV0ZVR5cGUuU01BTEwsXG4gICAgICB9LFxuICAgICAgZW52aXJvbm1lbnRWYXJpYWJsZXM6IHtcbiAgICAgICAgUzNfQlVDS0VUOiB7IHZhbHVlOiBwcm9wcy5zM0J1Y2tldC5idWNrZXROYW1lIH0sXG4gICAgICAgIENMT1VERlJPTlRfRElTVFJJQlVUSU9OX0lEOiB7IHZhbHVlOiBwcm9wcy5jbG91ZEZyb250RGlzdHJpYnV0aW9uSWQgfSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCBwZXJtaXNzaW9uc1xuICAgIHByb3BzLnMzQnVja2V0LmdyYW50UmVhZFdyaXRlKGZyb250ZW5kQnVpbGRQcm9qZWN0KTtcbiAgICBmcm9udGVuZEJ1aWxkUHJvamVjdC5hZGRUb1JvbGVQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgYWN0aW9uczogWydjbG91ZGZyb250OkNyZWF0ZUludmFsaWRhdGlvbiddLFxuICAgICAgcmVzb3VyY2VzOiBbYGFybjphd3M6Y2xvdWRmcm9udDo6JHt0aGlzLmFjY291bnR9OmRpc3RyaWJ1dGlvbi8ke3Byb3BzLmNsb3VkRnJvbnREaXN0cmlidXRpb25JZH1gXSxcbiAgICB9KSk7XG5cbiAgICAvLyBQaXBlbGluZVxuICAgIG5ldyBjb2RlcGlwZWxpbmUuUGlwZWxpbmUodGhpcywgJ1JhZmZsZVBpcGVsaW5lJywge1xuICAgICAgcGlwZWxpbmVOYW1lOiAnTkZULVJhZmZsZS1QaXBlbGluZScsXG4gICAgICBzdGFnZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHN0YWdlTmFtZTogJ1NvdXJjZScsXG4gICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgbmV3IGNvZGVwaXBlbGluZV9hY3Rpb25zLkdpdEh1YlNvdXJjZUFjdGlvbih7XG4gICAgICAgICAgICAgIGFjdGlvbk5hbWU6ICdHaXRIdWJfU291cmNlJyxcbiAgICAgICAgICAgICAgb3duZXI6ICdLZWl0aE1WJyxcbiAgICAgICAgICAgICAgcmVwbzogJ2FwZWNoYWluLW5mdC1yYWZmbGUnLFxuICAgICAgICAgICAgICBicmFuY2g6ICdtYWluJyxcbiAgICAgICAgICAgICAgb2F1dGhUb2tlbjogY2RrLlNlY3JldFZhbHVlLnNlY3JldHNNYW5hZ2VyKCdnaXRodWItdG9rZW4nKSxcbiAgICAgICAgICAgICAgb3V0cHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgc3RhZ2VOYW1lOiAnQnVpbGQnLFxuICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgIG5ldyBjb2RlcGlwZWxpbmVfYWN0aW9ucy5Db2RlQnVpbGRBY3Rpb24oe1xuICAgICAgICAgICAgICBhY3Rpb25OYW1lOiAnQnVpbGRfRnJvbnRlbmQnLFxuICAgICAgICAgICAgICBwcm9qZWN0OiBmcm9udGVuZEJ1aWxkUHJvamVjdCxcbiAgICAgICAgICAgICAgaW5wdXQ6IHNvdXJjZU91dHB1dCxcbiAgICAgICAgICAgICAgb3V0cHV0czogW2J1aWxkT3V0cHV0XSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuICB9XG59Il19