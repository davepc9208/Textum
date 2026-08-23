import { defineConfig } from 'checkly';
import {
  EmailAlertChannel,
  Frequency,
  UrlAssertionBuilder,
  UrlMonitor,
} from 'checkly/constructs';

const emailAlerts = new EmailAlertChannel('textum-availability-email', {
  address: 'davepc92@gmail.com',
  sendFailure: true,
  sendRecovery: true,
  sendDegraded: true,
});

type ChecklyRegion =
  | 'eu-west-1'
  | 'eu-central-1'
  | 'eu-west-3'
  | 'eu-south-1'
  | 'us-east-1';

const locations: ChecklyRegion[] = [
  'eu-west-1',
  'eu-central-1',
  'eu-west-3',
  'eu-south-1',
  'us-east-1',
];

const common = {
  activated: true,
  frequency: Frequency.EVERY_5M,
  locations,
  alertChannels: [emailAlerts],
  degradedResponseTime: 3000,
  maxResponseTime: 10000,
  request: {
    method: 'GET' as const,
    ipFamily: 'IPv4' as const,
    followRedirects: true,
    assertions: [UrlAssertionBuilder.statusCode().equals(200)],
  },
};

new UrlMonitor('textum-custom-domain-availability', {
  ...common,
  name: 'TEXTUM custom domain availability',
  description: 'Checks HTTPS reachability of the public TEXTUM custom domain.',
  request: {
    ...common.request,
    url: 'https://www.mentoriatextum.com/',
  },
  tags: ['textum', 'availability', 'custom-domain'],
});

new UrlMonitor('textum-pages-domain-availability', {
  ...common,
  name: 'TEXTUM Pages fallback availability',
  description: 'Checks the Cloudflare Pages hostname independently from the custom domain.',
  request: {
    ...common.request,
    url: 'https://textum.pages.dev/',
  },
  tags: ['textum', 'availability', 'pages-dev'],
});

export default defineConfig({
  projectName: 'textum-availability',
  logicalId: 'textum-availability',
});
