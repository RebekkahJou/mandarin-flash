import type { AndroidConfig } from 'expo/config-plugins';

import { SHARED_TEXT_LINK_HOST } from '../src/services/sharedText';
import { MAX_SEARCHED_TEXT_LENGTH } from '../src/services/textWordFinder';
import {
  MAX_SHARED_TEXT_LENGTH,
  SHARED_TEXT_ACTIVITY_NAME,
  SHARED_TEXT_HOST,
  addSharedTextActivity,
  sharedTextActivitySource,
} from './withSharedTextActivity';

type AndroidManifest = AndroidConfig.Manifest.AndroidManifest;

function manifestWithMainActivity(): AndroidManifest {
  return {
    manifest: {
      $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
      queries: [],
      application: [
        {
          $: { 'android:name': '.MainApplication' },
          activity: [
            { $: { 'android:name': '.MainActivity', 'android:launchMode': 'singleTask' } },
          ],
        },
      ],
    },
  };
}

function activities(manifest: AndroidManifest) {
  return manifest.manifest.application?.[0].activity ?? [];
}

describe('addSharedTextActivity', () => {
  it('adds a windowless activity that receives shared plain text', () => {
    const manifest = addSharedTextActivity(manifestWithMainActivity());
    const [main, shared] = activities(manifest);
    expect(main['intent-filter']).toBeUndefined();
    expect(shared.$['android:name']).toBe(`.${SHARED_TEXT_ACTIVITY_NAME}`);
    expect(shared.$['android:theme']).toBe('@android:style/Theme.NoDisplay');
    const [filter] = shared['intent-filter'] ?? [];
    expect(filter.action?.[0].$['android:name']).toBe('android.intent.action.SEND');
    expect(filter.data?.[0].$['android:mimeType']).toBe('text/plain');
  });

  it('can run twice without adding a second copy', () => {
    const manifest = addSharedTextActivity(addSharedTextActivity(manifestWithMainActivity()));
    expect(activities(manifest)).toHaveLength(2);
  });
});

describe('the copies of app constants', () => {
  it('match the app', () => {
    expect(SHARED_TEXT_HOST).toBe(SHARED_TEXT_LINK_HOST);
    expect(MAX_SHARED_TEXT_LENGTH).toBe(MAX_SEARCHED_TEXT_LENGTH);
  });
});

describe('sharedTextActivitySource', () => {
  it('forwards the text as a shared-text link to MainActivity in its own task', () => {
    const source = sharedTextActivitySource('com.example.app', 'example');
    expect(source).toContain('package com.example.app');
    expect(source).toContain(`class ${SHARED_TEXT_ACTIVITY_NAME} : Activity()`);
    expect(source).toContain('.scheme("example")');
    expect(source).toContain('.authority("shared-text")');
    expect(source).toContain('MAX_SHARED_TEXT_LENGTH = 1000');
    expect(source).toContain('Intent.FLAG_ACTIVITY_NEW_TASK');
  });
});
