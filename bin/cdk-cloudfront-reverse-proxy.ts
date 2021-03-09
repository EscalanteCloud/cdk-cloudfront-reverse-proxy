#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { CdkCloudfrontReverseProxyStack } from '../lib/cdk-cloudfront-reverse-proxy-stack';

const app = new cdk.App();

const ACCOUNT_ID = app.node.tryGetContext('ACCOUNT_ID');

new CdkCloudfrontReverseProxyStack(app, 'CdkCloudfrontReverseProxyStack', {env: { account: ACCOUNT_ID, region: 'us-east-1'}});