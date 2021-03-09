"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdkCloudfrontReverseProxyStack = void 0;
const cdk = require("@aws-cdk/core");
const cloudfront = require("@aws-cdk/aws-cloudfront");
const s3 = require("@aws-cdk/aws-s3");
const certMgr = require("@aws-cdk/aws-certificatemanager");
const route53 = require("@aws-cdk/aws-route53");
const targets = require("@aws-cdk/aws-route53-targets");
const S3Deployment = require("@aws-cdk/aws-s3-deployment");
// Set these values
const ZONE = 'EXAMPLE.com';
const TOP_LEVEL_DOMAIN = 'test.EXAMPLE.com';
const BLOG_ORIGIN = 'blog.EXAMPLE.com';
class CdkCloudfrontReverseProxyStack extends cdk.Stack {
    constructor(scope, id, props) {
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
                            forwardedValues: { queryString: true },
                        }
                    ]
                },
                // TLD (Main site) Origin
                {
                    s3OriginSource: {
                        s3BucketSource: tldOrigin,
                        originAccessIdentity: originAccessIdentity
                    },
                    behaviors: [
                        {
                            isDefaultBehavior: true,
                            allowedMethods: cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
                            forwardedValues: { queryString: true },
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
exports.CdkCloudfrontReverseProxyStack = CdkCloudfrontReverseProxyStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLWNsb3VkZnJvbnQtcmV2ZXJzZS1wcm94eS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNkay1jbG91ZGZyb250LXJldmVyc2UtcHJveHktc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscUNBQXFDO0FBQ3JDLHNEQUF1RDtBQUN2RCxzQ0FBdUM7QUFDdkMsMkRBQTJEO0FBQzNELGdEQUFnRDtBQUNoRCx3REFBd0Q7QUFDeEQsMkRBQTJEO0FBRTNELG1CQUFtQjtBQUNuQixNQUFNLElBQUksR0FBRyxhQUFhLENBQUM7QUFDM0IsTUFBTSxnQkFBZ0IsR0FBRyxrQkFBa0IsQ0FBQztBQUM1QyxNQUFNLFdBQVcsR0FBRyxrQkFBa0IsQ0FBQztBQUV2QyxNQUFhLDhCQUErQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzNELFlBQVksS0FBYyxFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM1RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4Qix5Q0FBeUM7UUFDekMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUNuRSxVQUFVLEVBQUUsSUFBSTtZQUNoQixXQUFXLEVBQUUsS0FBSztTQUNuQixDQUFDLENBQUM7UUFFSCwrQ0FBK0M7UUFDL0MsTUFBTSxXQUFXLEdBQUcsSUFBSSxPQUFPLENBQUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUMzRSxVQUFVLEVBQUUsZ0JBQWdCO1lBQzVCLHVCQUF1QixFQUFFLENBQUMsS0FBSyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ2xELFVBQVU7WUFDVixNQUFNLEVBQUUsV0FBVyxDQUFDLCtEQUErRDtTQUNwRixDQUFDLENBQUM7UUFFSCx3RUFBd0U7UUFDeEUsTUFBTSxTQUFTLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBRXhELDZDQUE2QztRQUM3QyxJQUFJLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ3BELE9BQU8sRUFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVDLGlCQUFpQixFQUFFLFNBQVM7U0FDN0IsQ0FBQyxDQUFDO1FBRUgsbUVBQW1FO1FBQ25FLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxVQUFVLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtZQUM1RSxPQUFPLEVBQUUsdUJBQXVCO1NBQ2pDLENBQUMsQ0FBQztRQUVILHFDQUFxQztRQUNyQyxJQUFJLE1BQU0sR0FBRyxJQUFJLFVBQVUsQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQzFFLGFBQWEsRUFBRTtnQkFDYixjQUFjO2dCQUNkO29CQUNFLGtCQUFrQixFQUFFO3dCQUNsQixVQUFVLEVBQUUsV0FBVztxQkFDeEI7b0JBQ0QsU0FBUyxFQUFFO3dCQUNUOzRCQUNFLFdBQVcsRUFBRSxRQUFROzRCQUNyQixjQUFjLEVBQUUsVUFBVSxDQUFDLHdCQUF3QixDQUFDLGdCQUFnQjs0QkFDcEUsZUFBZSxFQUFFLEVBQUMsV0FBVyxFQUFFLElBQUksRUFBQzt5QkFDckM7cUJBQ0Y7aUJBQ0Y7Z0JBQ0QseUJBQXlCO2dCQUN6QjtvQkFDRSxjQUFjLEVBQUU7d0JBQ2QsY0FBYyxFQUFFLFNBQVM7d0JBQ3pCLG9CQUFvQixFQUFFLG9CQUFvQjtxQkFDM0M7b0JBQ0QsU0FBUyxFQUFHO3dCQUNWOzRCQUNFLGlCQUFpQixFQUFFLElBQUk7NEJBQ3ZCLGNBQWMsRUFBRSxVQUFVLENBQUMsd0JBQXdCLENBQUMsZ0JBQWdCOzRCQUNwRSxlQUFlLEVBQUUsRUFBQyxXQUFXLEVBQUUsSUFBSSxFQUFDO3lCQUNyQztxQkFDRjtpQkFDRjthQUNGO1lBQ0Qsa0JBQWtCLEVBQUU7Z0JBQ2xCLFVBQVUsRUFBRSxXQUFXLENBQUMsY0FBYztnQkFDdEMsS0FBSyxFQUFFO29CQUNMLGdCQUFnQixFQUFFLEtBQUssZ0JBQWdCLEVBQUU7aUJBQzFDO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCx5REFBeUQ7UUFDekQsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUU7WUFDbkMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLElBQUksT0FBTyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVFLElBQUksRUFBRSxVQUFVO1lBQ2hCLFVBQVUsRUFBRSxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUU7U0FDM0MsQ0FBQyxDQUFDO0lBRUwsQ0FBQztDQUNGO0FBL0VELHdFQStFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCBjbG91ZGZyb250ID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWNsb3VkZnJvbnQnKTtcbmltcG9ydCBzMyA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1zMycpO1xuaW1wb3J0ICogYXMgY2VydE1nciBmcm9tICdAYXdzLWNkay9hd3MtY2VydGlmaWNhdGVtYW5hZ2VyJztcbmltcG9ydCAqIGFzIHJvdXRlNTMgZnJvbSAnQGF3cy1jZGsvYXdzLXJvdXRlNTMnO1xuaW1wb3J0ICogYXMgdGFyZ2V0cyBmcm9tICdAYXdzLWNkay9hd3Mtcm91dGU1My10YXJnZXRzJztcbmltcG9ydCAqIGFzIFMzRGVwbG95bWVudCBmcm9tICdAYXdzLWNkay9hd3MtczMtZGVwbG95bWVudCc7XG5cbi8vIFNldCB0aGVzZSB2YWx1ZXNcbmNvbnN0IFpPTkUgPSAnRVhBTVBMRS5jb20nO1xuY29uc3QgVE9QX0xFVkVMX0RPTUFJTiA9ICd0ZXN0LkVYQU1QTEUuY29tJztcbmNvbnN0IEJMT0dfT1JJR0lOID0gJ2Jsb2cuRVhBTVBMRS5jb20nO1xuXG5leHBvcnQgY2xhc3MgQ2RrQ2xvdWRmcm9udFJldmVyc2VQcm94eVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5BcHAsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIENyZWF0ZSBhIHJlZmVyZW5jZSB0byBvdXIgUm91dGU1MyBab25lXG4gICAgY29uc3QgaG9zdGVkWm9uZSA9IHJvdXRlNTMuSG9zdGVkWm9uZS5mcm9tTG9va3VwKHRoaXMsICdIb3N0ZWRab25lJywge1xuICAgICAgZG9tYWluTmFtZTogWk9ORSxcbiAgICAgIHByaXZhdGVab25lOiBmYWxzZSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBvdXIgU1NMIENlcnQgdy8gVExEICsgV2lsZGNhcmQgYXMgU0FOXG4gICAgY29uc3QgY2VydGlmaWNhdGUgPSBuZXcgY2VydE1nci5EbnNWYWxpZGF0ZWRDZXJ0aWZpY2F0ZSh0aGlzLCAnQ2VydGlmaWNhdGUnLCB7XG4gICAgICBkb21haW5OYW1lOiBUT1BfTEVWRUxfRE9NQUlOLFxuICAgICAgc3ViamVjdEFsdGVybmF0aXZlTmFtZXM6IFtgKi4ke1RPUF9MRVZFTF9ET01BSU59YF0sXG4gICAgICBob3N0ZWRab25lLCBcbiAgICAgIHJlZ2lvbjogJ3VzLWVhc3QtMScgLy8gQ0YgZGlzdHJpYnV0aW9ucyByZXF1aXJlIENlcnQgYmUgY3JlYXRlZCBpbiBVUy1FYXN0LTEgcmVnaW9uXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgYW4gUzMgYnVja2V0IHRvIGhvc3QgdGhlIHN0YXRpYyBmaWxlcyBmb3IgdGhlIHRvcCBsZXZlbCBkb21haW5cbiAgICBjb25zdCB0bGRPcmlnaW4gPSBuZXcgczMuQnVja2V0KHRoaXMsIFRPUF9MRVZFTF9ET01BSU4pO1xuXG4gICAgLy8gQ29weSB0aGUgY29udGVudHMgb2YgL3MzIHRvIG91ciBuZXcgYnVja2V0XG4gICAgbmV3IFMzRGVwbG95bWVudC5CdWNrZXREZXBsb3ltZW50KHRoaXMsICdkZXBsb3ltZW50Jywge1xuICAgICAgc291cmNlczogW1MzRGVwbG95bWVudC5Tb3VyY2UuYXNzZXQoJy4vczMnKV0sXG4gICAgICBkZXN0aW5hdGlvbkJ1Y2tldDogdGxkT3JpZ2luLFxuICAgIH0pO1xuICAgIFxuICAgIC8vIENyZWF0ZSBhbiBpZGVudGl0eSBzbyB3ZSBjYW4gc2VjdXJlbHkgYWNjZXNzIFMzIGZyb20gQ2xvdWRmcm9udCBcbiAgICBjb25zdCBvcmlnaW5BY2Nlc3NJZGVudGl0eSA9IG5ldyBjbG91ZGZyb250Lk9yaWdpbkFjY2Vzc0lkZW50aXR5KHRoaXMsICdPQUknLCB7XG4gICAgICBjb21tZW50OiAnQWNjZXNzIGNyZWF0ZWQgYnkgQ0RLJ1xuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIG91ciBDbG91ZGZyb250IERpc3RyaWJ1dGlvblxuICAgIGxldCBkaXN0cm8gPSBuZXcgY2xvdWRmcm9udC5DbG91ZEZyb250V2ViRGlzdHJpYnV0aW9uKHRoaXMsIGBEaXN0cmlidXRpb25gLCB7XG4gICAgICBvcmlnaW5Db25maWdzOiBbXG4gICAgICAgIC8vIEJsb2cgT3JpZ2luXG4gICAgICAgIHtcbiAgICAgICAgICBjdXN0b21PcmlnaW5Tb3VyY2U6IHtcbiAgICAgICAgICAgIGRvbWFpbk5hbWU6IEJMT0dfT1JJR0lOXG4gICAgICAgICAgfSxcbiAgICAgICAgICBiZWhhdmlvcnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcGF0aFBhdHRlcm46ICcvYmxvZyonLFxuICAgICAgICAgICAgICBhbGxvd2VkTWV0aG9kczogY2xvdWRmcm9udC5DbG91ZEZyb250QWxsb3dlZE1ldGhvZHMuR0VUX0hFQURfT1BUSU9OUyxcbiAgICAgICAgICAgICAgZm9yd2FyZGVkVmFsdWVzOiB7cXVlcnlTdHJpbmc6IHRydWV9LFxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gVExEIChNYWluIHNpdGUpIE9yaWdpblxuICAgICAgICB7XG4gICAgICAgICAgczNPcmlnaW5Tb3VyY2U6IHtcbiAgICAgICAgICAgIHMzQnVja2V0U291cmNlOiB0bGRPcmlnaW4sXG4gICAgICAgICAgICBvcmlnaW5BY2Nlc3NJZGVudGl0eTogb3JpZ2luQWNjZXNzSWRlbnRpdHlcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJlaGF2aW9ycyA6IFsgXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlzRGVmYXVsdEJlaGF2aW9yOiB0cnVlLFxuICAgICAgICAgICAgICBhbGxvd2VkTWV0aG9kczogY2xvdWRmcm9udC5DbG91ZEZyb250QWxsb3dlZE1ldGhvZHMuR0VUX0hFQURfT1BUSU9OUyxcbiAgICAgICAgICAgICAgZm9yd2FyZGVkVmFsdWVzOiB7cXVlcnlTdHJpbmc6IHRydWV9LFxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIGFsaWFzQ29uZmlndXJhdGlvbjoge1xuICAgICAgICBhY21DZXJ0UmVmOiBjZXJ0aWZpY2F0ZS5jZXJ0aWZpY2F0ZUFybixcbiAgICAgICAgbmFtZXM6IFtcbiAgICAgICAgICBUT1BfTEVWRUxfRE9NQUlOLCBgKi4ke1RPUF9MRVZFTF9ET01BSU59YFxuICAgICAgICBdXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgRE5TIEEgUmVjb3JkIHRoYXQgcG9pbnRzIGF0IG91ciBDRiBEaXN0cmlidXRpb25cbiAgICBuZXcgcm91dGU1My5BUmVjb3JkKHRoaXMsICdBUmVjb3JkJywge1xuICAgICAgdGFyZ2V0OiByb3V0ZTUzLlJlY29yZFRhcmdldC5mcm9tQWxpYXMobmV3IHRhcmdldHMuQ2xvdWRGcm9udFRhcmdldChkaXN0cm8pKSxcbiAgICAgIHpvbmU6IGhvc3RlZFpvbmUsXG4gICAgICByZWNvcmROYW1lOiBUT1BfTEVWRUxfRE9NQUlOLnRvTG93ZXJDYXNlKClcbiAgICB9KTtcblxuICB9XG59XG4iXX0=