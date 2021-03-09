# Cloudfront Reverse Proxy CDK

## Summary
This project deploys a Cloudfront reverse proxy sample using the AWS CDK.  The following resources are deployed:
1) An S3 bucket with one file, index.html, for the main site origin
2) An SSL Cert for top level domain (example.com) w/ wildcard SAN (*.example.com)
3) Origin Access Identity to allow Cloudfront to securely access your S3 bucket origin without publicly exposing the S3 bucket
4) A Cloudfront distribution with 2 origins and 2 behaviors:
- Blog origin with path pattern '/blog*' referencing domain specified in BLOG_ORIGIN variable.
- Main site origin referencing S3 bucket created as part of this deployment.
5) A Route53 DNS A record ALIAS pointing the specified TOP_LEVEL_DOMAIN to Cloudfront distribution

## Prerequisities
1) Hosted Zone in Route53 for your top level domain

## Getting Started

1) Install the AWS CDK if you haven't already (https://docs.aws.amazon.com/cdk/latest/guide/home.html)
2) Bootstrap your AWS account for use with the CDK `cdk bootstrap aws://YOUR_AWS_ACCOUNT_ID/us-east-1` (change region as needed).
3) Run `npm i` in the root folder to grab dependencies
4) Modify ./lib/cdk-cloudfront-reverse-proxy-stack.ts and set the appropriate const values for ZONE, TOP_LEVEL_DOMAIN and BLOG_ORIGIN.
5) `npm run build`
6) `cdk deploy -c ACCOUNT_ID=[YOUR_AWS_ACCOUNT_ID] --profile [YOUR_AWS_PROFILE]` *** Note that -profile is only needed if you're using multiple profiles on your environment.  This can be excluded if you're only working with one AWS Account that's specified as the default profile.

## Cleaning up
Run: `cdk destroy -c ACCOUNT_ID=[YOUR_AWS_ACCOUNT_ID] --profile [YOUR_AWS_PROFILE]`

## Gotchas
* Be mindful of origins that inspect host header and redirect to themselves when referenced as an origin.
* Modify canonical tags as necessary to prevent SEO issues.

## Useful CDK commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template

