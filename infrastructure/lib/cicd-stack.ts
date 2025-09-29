import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface CicdStackProps extends cdk.StackProps {
  s3Bucket: s3.Bucket;
  cloudFrontDistributionId: string;
}

export class CicdStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CicdStackProps) {
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