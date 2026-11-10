import type { AndroidConfig } from 'expo/config-plugins';

import {
  addOpenedFileActivity,
  OPENED_FILE_ACTIVITY_NAME,
  openedFileActivitySource,
} from './withOpenedFileActivity';

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

describe('addOpenedFileActivity', () => {
  it('adds an exported, windowless activity next to MainActivity', () => {
    const manifest = addOpenedFileActivity(manifestWithMainActivity());
    const names = activities(manifest).map((activity) => activity.$['android:name']);
    expect(names).toEqual(['.MainActivity', `.${OPENED_FILE_ACTIVITY_NAME}`]);
    const opened = activities(manifest)[1];
    expect(opened.$['android:exported']).toBe('true');
    expect(opened.$['android:theme']).toBe('@android:style/Theme.NoDisplay');
  });

  it('receives downloads and .mfpack files, leaving MainActivity without file filters', () => {
    const manifest = addOpenedFileActivity(manifestWithMainActivity());
    const [main, opened] = activities(manifest);
    expect(main['intent-filter']).toBeUndefined();
    const dataEntries = (opened['intent-filter'] ?? []).flatMap((filter) => filter.data ?? []);
    const mimeTypes = dataEntries.map((data) => data.$['android:mimeType']);
    const pathPatterns = dataEntries.map((data) => data.$['android:pathPattern']);
    expect(mimeTypes).toContain('application/octet-stream');
    expect(pathPatterns).toContain('.*\\\\.mfpack');
  });

  it('can run twice without adding a second copy', () => {
    const manifest = addOpenedFileActivity(addOpenedFileActivity(manifestWithMainActivity()));
    expect(activities(manifest)).toHaveLength(2);
  });
});

describe('openedFileActivitySource', () => {
  it('forwards the file to MainActivity in its own task with the read grant', () => {
    const source = openedFileActivitySource('com.example.app');
    expect(source).toContain('package com.example.app');
    expect(source).toContain('MainActivity::class.java');
    expect(source).toContain('FLAG_ACTIVITY_NEW_TASK');
    expect(source).toContain('FLAG_GRANT_READ_URI_PERMISSION');
  });
});
