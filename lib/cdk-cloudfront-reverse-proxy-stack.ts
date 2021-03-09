import * as cdk from '@aws-cdk/core';
import cloudfront = require('@aws-cdk/aws-cloudfront');
import s3 = require('@aws-cdk/aws-s3');
import * as certMgr from '@aws-cdk/aws-certificatemanager';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';
import * as S3Deployment from '@aws-cdk/aws-s3-deployment';

// Set these values
const ZONE = 'EXAMPLE.com';
const TOP_LEVEL_DOMAIN = 'test.EXAMPLE.com';
const BLOG_ORIGIN = 'blog.EXAMPLE.com';

export class CdkCloudfrontReverseProxyStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a reference to our Route53 Zone
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: ZONE,
      privateZone: false,
    });

    // Create our SSL Cert w/ TLD + Wildcard as SAN
    const certificate = new certMgr.DnsValidatedCertificate(this, 'Certificate', {
      domainName: TOP_LEVEL_DOMAIN,
      subjectAlternativeNames: [`*.${TOP_LEVEL_DOMAIN}`],
      hostedZone, 
      region: 'us-east-1' // CF distributions require Cert be created in US-East-1 region
    });

    // Create an S3 bucket to host the static files for the top level domain
    const tldOrigin = new s3.Bucket(this, TOP_LEVEL_DOMAIN);

    // Copy the contents of /s3 to our new bucket
    new S3Deployment.BucketDeployment(this, 'deployment', {
      sources: [S3Deployment.Source.asset('./s3')],
      destinationBucket: tldOrigin,
    });
    
    // Create an identity so we can securely access S3 from Cloudfront 
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: 'Access created by CDK'
    });

    // Create our Cloudfront Distribution
    let distro = new cloudfront.CloudFrontWebDistribution(this, `Distribution`, {
      originConfigs: [
        // Blog Origin
        {
          customOriginSource: {
            domainName: BLOG_ORIGIN
          },
          behaviors: [
            {
              pathPattern: '/blog*',
              allowedMethods: cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
              forwardedValues: {queryString: true},
            }
          ]
        },
        // TLD (Main site) Origin
        {
          s3OriginSource: {
            s3BucketSource: tldOrigin,
            originAccessIdentity: originAccessIdentity
          },
          behaviors : [ 
            {
              isDefaultBehavior: true,
              allowedMethods: cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
              forwardedValues: {queryString: true},
            }
          ]
        }
      ],
      aliasConfiguration: {
        acmCertRef: certificate.certificateArn,
        names: [
          TOP_LEVEL_DOMAIN, `*.${TOP_LEVEL_DOMAIN}`
        ]
      }
    });

    // Create DNS A Record that points at our CF Distribution
    new route53.ARecord(this, 'ARecord', {
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distro)),
      zone: hostedZone,
      recordName: TOP_LEVEL_DOMAIN.toLowerCase()
    });

  }
}
