import { describe, expect, it } from 'vitest';

import {
  SCHEMA_CONTEXT,
  creativeWorkJsonLd,
  eventJsonLd,
  faqPageJsonLd,
  personJsonLd,
  profilePageJsonLd,
  serializeJsonLd,
  videoObjectJsonLd,
} from '../src/lib/jsonld';

/**
 * Unit tests for the JSON-LD builder module (Story 1.6, Task 1 / AC1). These
 * exercise the typed builders and the safe serializer in isolation (pure
 * functions — no build needed). The build-output suite separately asserts the
 * rendered ld+json appears in the produced HTML per route (IAC-1).
 */

const PERSON = {
  name: 'Joshua R. Brandt, MSE',
  jobTitle: 'Software Engineer',
  description: 'A software engineer building at the frontier of agentic engineering.',
  url: 'https://joshuabrandt.abacusai.cloud/',
  image: 'https://joshuabrandt.abacusai.cloud/headshot.jpg',
  sameAs: ['https://youtube.com/@example', 'https://github.com/example'],
  knowsAbout: ['agentic engineering', 'software architecture'],
};

describe('personJsonLd', () => {
  it('carries the schema.org context and Person type with the required fields', () => {
    const p = personJsonLd(PERSON);
    expect(p['@context']).toBe(SCHEMA_CONTEXT);
    expect(p['@context']).toBe('https://schema.org');
    expect(p['@type']).toBe('Person');
    expect(p.name).toBe('Joshua R. Brandt, MSE');
    expect(p.jobTitle).toBe('Software Engineer');
    expect(p.description).toBe(PERSON.description);
    expect(p.url).toBe(PERSON.url);
    expect(p.image).toBe(PERSON.image);
    expect(p.sameAs).toEqual(PERSON.sameAs);
    expect(p.knowsAbout).toEqual(PERSON.knowsAbout);
  });

  it('omits optional fields when not supplied (no empty arrays)', () => {
    const p = personJsonLd({
      name: 'Joshua R. Brandt, MSE',
      jobTitle: 'Software Engineer',
      description: 'desc',
      url: 'https://example.com/',
    });
    expect('image' in p).toBe(false);
    expect('sameAs' in p).toBe(false);
    expect('knowsAbout' in p).toBe(false);
  });

  it('drops empty sameAs/knowsAbout arrays', () => {
    const p = personJsonLd({
      name: 'Joshua R. Brandt, MSE',
      jobTitle: 'Software Engineer',
      description: 'desc',
      url: 'https://example.com/',
      sameAs: [],
      knowsAbout: [],
    });
    expect('sameAs' in p).toBe(false);
    expect('knowsAbout' in p).toBe(false);
  });
});

describe('profilePageJsonLd', () => {
  it('wraps the Person as mainEntity, and the embedded Person has no own @context', () => {
    const pp = profilePageJsonLd({ mainEntity: PERSON, url: 'https://example.com/about' });
    expect(pp['@context']).toBe('https://schema.org');
    expect(pp['@type']).toBe('ProfilePage');
    expect(pp.url).toBe('https://example.com/about');
    expect(pp.mainEntity['@type']).toBe('Person');
    expect(pp.mainEntity.name).toBe('Joshua R. Brandt, MSE');
    // Embedded node must NOT re-declare @context (it inherits the page's).
    expect('@context' in pp.mainEntity).toBe(false);
  });
});

describe('eventJsonLd', () => {
  it('builds an Event with the required fields and embeds the performer Person', () => {
    const e = eventJsonLd({
      name: 'Placeholder Talk',
      startDate: '2026-01-01',
      eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode',
      location: { '@type': 'VirtualLocation', url: 'https://example.com/' },
      performer: PERSON,
      organizer: { '@type': 'Organization', name: 'Placeholder Org' },
      description: 'placeholder',
    });
    expect(e['@context']).toBe('https://schema.org');
    expect(e['@type']).toBe('Event');
    expect(e.name).toBe('Placeholder Talk');
    expect(e.startDate).toBe('2026-01-01');
    expect(e.eventAttendanceMode).toBe('https://schema.org/MixedEventAttendanceMode');
    expect(e.location['@type']).toBe('VirtualLocation');
    expect(e.performer['@type']).toBe('Person');
    expect('@context' in e.performer).toBe(false);
    expect(e.organizer['@type']).toBe('Organization');
  });
});

describe('videoObjectJsonLd', () => {
  it('builds a VideoObject with the required fields incl. a ~90s duration', () => {
    const v = videoObjectJsonLd({
      name: 'Speaker reel',
      description: 'A preview of the talk.',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      uploadDate: '2026-01-01',
      duration: 'PT1M30S',
      contentUrl: 'https://example.com/reel.mp4',
      embedUrl: 'https://example.com/embed',
    });
    expect(v['@context']).toBe('https://schema.org');
    expect(v['@type']).toBe('VideoObject');
    expect(v.name).toBe('Speaker reel');
    expect(v.description).toBe('A preview of the talk.');
    expect(v.thumbnailUrl).toBe('https://example.com/thumb.jpg');
    expect(v.uploadDate).toBe('2026-01-01');
    expect(v.duration).toBe('PT1M30S');
    expect(v.contentUrl).toBe('https://example.com/reel.mp4');
    expect(v.embedUrl).toBe('https://example.com/embed');
  });

  it('omits contentUrl/embedUrl when not supplied', () => {
    const v = videoObjectJsonLd({
      name: 'Speaker reel',
      description: 'desc',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      uploadDate: '2026-01-01',
      duration: 'PT1M30S',
    });
    expect('contentUrl' in v).toBe(false);
    expect('embedUrl' in v).toBe(false);
  });
});

describe('creativeWorkJsonLd', () => {
  it('builds a CreativeWork with the required fields and embeds the author Person', () => {
    const c = creativeWorkJsonLd({
      name: 'loandemo',
      author: PERSON,
      description: 'A flagship case study.',
      url: 'https://example.com/work/loandemo',
      dateCreated: '2026-01-01',
    });
    expect(c['@context']).toBe('https://schema.org');
    expect(c['@type']).toBe('CreativeWork');
    expect(c.name).toBe('loandemo');
    expect(c.author['@type']).toBe('Person');
    expect('@context' in c.author).toBe(false);
    expect(c.description).toBe('A flagship case study.');
    expect(c.url).toBe('https://example.com/work/loandemo');
    expect(c.dateCreated).toBe('2026-01-01');
  });
});

describe('faqPageJsonLd', () => {
  it('builds a FAQPage whose mainEntity is an array of Question/Answer pairs', () => {
    const f = faqPageJsonLd([
      { question: 'Q1?', answer: 'A1.' },
      { question: 'Q2?', answer: 'A2.' },
    ]);
    expect(f['@context']).toBe('https://schema.org');
    expect(f['@type']).toBe('FAQPage');
    expect(f.mainEntity).toHaveLength(2);
    const first = f.mainEntity[0]!;
    expect(first['@type']).toBe('Question');
    expect(first.name).toBe('Q1?');
    const answer = first.acceptedAnswer as { '@type': string; text: string };
    expect(answer['@type']).toBe('Answer');
    expect(answer.text).toBe('A1.');
  });
});

describe('serializeJsonLd', () => {
  it('produces valid, re-parseable JSON for a single node', () => {
    const out = serializeJsonLd(personJsonLd(PERSON));
    const parsed = JSON.parse(out);
    expect(parsed['@type']).toBe('Person');
    expect(parsed.name).toBe('Joshua R. Brandt, MSE');
  });

  it('produces valid JSON for an array of nodes', () => {
    const out = serializeJsonLd([personJsonLd(PERSON), profilePageJsonLd({ mainEntity: PERSON })]);
    const parsed = JSON.parse(out);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]['@type']).toBe('Person');
    expect(parsed[1]['@type']).toBe('ProfilePage');
  });

  it('escapes < > & so the block can never break out of the <script> tag', () => {
    // A hostile value containing a </script> sequence and an HTML entity.
    const out = serializeJsonLd(
      personJsonLd({
        ...PERSON,
        description: 'pwn </script><script>alert(1)</script> & friends',
      }),
    );
    // No raw angle brackets or ampersands survive in the serialized text.
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
    expect(out).not.toContain('&');
    // They are present as the inert \uXXXX escapes instead.
    expect(out).toContain('\\u003c');
    expect(out).toContain('\\u003e');
    expect(out).toContain('\\u0026');
    // …and it is STILL valid JSON that round-trips to the original string.
    const parsed = JSON.parse(out);
    expect(parsed.description).toBe('pwn </script><script>alert(1)</script> & friends');
  });

  it('is deterministic — same input yields byte-identical output', () => {
    const a = serializeJsonLd(personJsonLd(PERSON));
    const b = serializeJsonLd(personJsonLd(PERSON));
    expect(a).toBe(b);
  });
});
