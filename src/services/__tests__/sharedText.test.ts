import {
  FIND_IN_TEXT_PATHNAME,
  createSharedTextInbox,
  routeForSharedTextLink,
  sharedTextFromLink,
} from '../sharedText';

const encoded = (text: string) => `mandarinflash://shared-text?text=${encodeURIComponent(text)}`;

describe('sharedTextFromLink', () => {
  it('reads the text, decoding it', () => {
    expect(sharedTextFromLink(encoded('牛肉麵 很好吃 & 100%'))).toBe('牛肉麵 很好吃 & 100%');
  });

  it('trims the text and ignores empty text', () => {
    expect(sharedTextFromLink(encoded('  好吃\n'))).toBe('好吃');
    expect(sharedTextFromLink(encoded('   '))).toBeNull();
    expect(sharedTextFromLink('mandarinflash://shared-text?other=1')).toBeNull();
  });

  it('ignores other links and broken encoding', () => {
    expect(sharedTextFromLink('content://downloads/mandarin.mfpack')).toBeNull();
    expect(sharedTextFromLink('mandarinflash://words?text=好')).toBeNull();
    expect(sharedTextFromLink('mandarinflash://shared-text?text=%E4%')).toBeNull();
  });
});

describe('sharedTextInbox', () => {
  it('keeps the text until it is taken, once', () => {
    const inbox = createSharedTextInbox();
    inbox.put('好吃');
    expect(inbox.hasPending()).toBe(true);
    expect(inbox.take()).toBe('好吃');
    expect(inbox.take()).toBeNull();
  });

  it('hands the text straight to a listening screen', () => {
    const inbox = createSharedTextInbox();
    const received: string[] = [];
    const stopListening = inbox.listen((text) => received.push(text));
    inbox.put('好吃');
    expect(received).toEqual(['好吃']);
    expect(inbox.hasPending()).toBe(false);
    stopListening();
    inbox.put('牛肉');
    expect(received).toEqual(['好吃']);
    expect(inbox.take()).toBe('牛肉');
  });
});

describe('routeForSharedTextLink', () => {
  it('leaves shared text in the inbox and leads to Find words in text', () => {
    const inbox = createSharedTextInbox();
    expect(routeForSharedTextLink(encoded('好吃'), inbox)).toBe(FIND_IN_TEXT_PATHNAME);
    expect(inbox.take()).toBe('好吃');
  });

  it('leaves other links alone', () => {
    const inbox = createSharedTextInbox();
    expect(routeForSharedTextLink('content://downloads/a.mfpack', inbox)).toBeNull();
    expect(inbox.hasPending()).toBe(false);
  });
});
