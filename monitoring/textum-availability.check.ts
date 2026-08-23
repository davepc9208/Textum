import {
  EmailAlertChannel,
  Frequency,
  UrlAssertionBuilder,
  UrlMonitor,
} from 'checkly/constructs';

type ChecklyRegion =
  | 'eu-west-1'
  | 'eu-central-1'
  | 'eu-west-3'
  | 'eu-south-1'
  | 'us-east-1';

const emailAlerts = new EmailAlertChannel('textum-availability-email', {
  address: 'davepc92@gmail.com',
  sendFailure: true,
  sendRecovery: true,
  sendDegraded: true,
});

const locations: ChecklyRegion[] = [
  'eu-west-1',
  'eu-central-1',
  'eu-west-3',
  'eu-south-1',
  'us-east-1',
];

function createAvailabilityMonitor(
  logicalId: string,
  name: string,
  url: string,
  description: string,
  tags: string[],
) {
  return new UrlMonitor(logicalId, {
    activated: true,
    name,
    description,
    frequency: Frequency.EVERY_5M,
    locations,
    alertChannels: [emailAlerts],
    degradedResponseTime: 3000,
    maxResponseTime: 10000,
    tags,
    request: {
      url,
      ipFamily: 'IPv4',
      followRedirects: true,
      assertions: [UrlAssertionBuilder.statusCode().equals(200)],
    },
  });
}

createAvailabilityMonitor(
  'textum-custom-domain-availability',
  'TEXTUM custom domain availability',
  'https://www.mentoriatextum.com/',
  'Checks HTTPS reachability of the public TEXTUM custom domain.',
  ['textum', 'availability', 'custom-domain'],
);

createAvailabilityMonitor(
  'textum-pages-domain-availability',
  'TEXTUM Pages fallback availability',
  'https://textum.pages.dev/',
  'Checks the Cloudflare Pages hostname independently from the custom domain.',
  ['textum', 'availability', 'pages-dev'],
);
