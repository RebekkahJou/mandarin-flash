import { routeForIncomingLink } from '../packLinks';

describe('routeForIncomingLink', () => {
  it('sends opened files to the pack installer', () => {
    const uri = 'content://com.android.providers.downloads.documents/document/msf%3A42';
    expect(routeForIncomingLink(uri)).toBe(`/packs/install?uri=${encodeURIComponent(uri)}`);
    expect(routeForIncomingLink('file:///sdcard/Download/german.mfpack')).toContain(
      '/packs/install?uri=file%3A%2F%2F%2F',
    );
  });

  it('leaves app links alone', () => {
    expect(routeForIncomingLink('/settings')).toBe('/settings');
    expect(routeForIncomingLink('mandarinflash://about')).toBe('mandarinflash://about');
  });
});
