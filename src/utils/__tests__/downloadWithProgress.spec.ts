import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadWithProgress } from '../downloadWithProgress';

describe('downloadWithProgress', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let mockCreateElement: ReturnType<typeof vi.fn>;
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let mockWindowOpen: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    mockCreateObjectURL = vi.fn().mockReturnValue('blob:http://localhost/fake');
    mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    mockWindowOpen = vi.fn();
    global.window.open = mockWindowOpen;

    mockCreateElement = vi.spyOn(document, 'createElement');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should download with progress tracking', async () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    let readCount = 0;

    const mockReader = {
      read: vi.fn().mockImplementation(() => {
        if (readCount === 0) {
          readCount++;
          return Promise.resolve({ done: false, value: data });
        }
        return Promise.resolve({ done: true, value: undefined });
      }),
    };

    const mockBody = {
      getReader: () => mockReader,
    };

    const mockResponse = {
      ok: true,
      body: mockBody,
      headers: {
        get: vi.fn().mockReturnValue('5'),
      },
    };

    mockFetch.mockResolvedValue(mockResponse);

    // Real anchor — saveBlob appends/removes it from the DOM, so a plain object
    // would throw in appendChild. The createElement spy calls through here (no
    // mockReturnValue set yet), then we route saveBlob's createElement to it.
    const linkElement = document.createElement('a');
    const clickSpy = vi.spyOn(linkElement, 'click').mockImplementation(() => undefined);
    mockCreateElement.mockReturnValue(linkElement);

    const onProgress = vi.fn();
    await downloadWithProgress('http://example.com/file.zip', 'file.zip', onProgress);

    expect(mockFetch).toHaveBeenCalledWith('http://example.com/file.zip', {});
    expect(onProgress).toHaveBeenCalledWith(100);
    expect(clickSpy).toHaveBeenCalled();
    expect(linkElement.download).toBe('file.zip');
    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });

  it('should pass abort signal to fetch', async () => {
    const controller = new AbortController();

    const data = new Uint8Array([1, 2]);
    const mockReader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({ done: false, value: data })
        .mockResolvedValueOnce({ done: true, value: undefined }),
    };

    mockFetch.mockResolvedValue({
      body: { getReader: () => mockReader },
      headers: { get: () => '2' },
    });

    const linkElement = { href: '', download: '', click: vi.fn() };
    mockCreateElement.mockReturnValue(linkElement);

    await downloadWithProgress(
      'http://example.com/file.zip',
      'file.zip',
      vi.fn(),
      controller.signal
    );

    expect(mockFetch).toHaveBeenCalledWith('http://example.com/file.zip', {
      signal: controller.signal,
    });
  });

  it('should fallback to blob download when response.body is null', async () => {
    // No ReadableStream body — the impl reads the whole response as a blob and
    // saves that via an object URL (not a direct anchor to the source URL).
    mockFetch.mockResolvedValue({
      ok: true,
      body: null,
      headers: { get: () => null },
      blob: () => Promise.resolve(new Blob(['x'])),
    });

    const linkElement = document.createElement('a');
    const clickSpy = vi.spyOn(linkElement, 'click').mockImplementation(() => undefined);
    mockCreateElement.mockReturnValue(linkElement);

    const onProgress = vi.fn();
    await downloadWithProgress('http://example.com/file.zip', 'file.zip', onProgress);

    expect(linkElement.href).toBe('blob:http://localhost/fake');
    expect(linkElement.download).toBe('file.zip');
    expect(clickSpy).toHaveBeenCalled();
    expect(onProgress).not.toHaveBeenCalled();
  });

  it('should do nothing when AbortError is thrown', async () => {
    const abortError = new Error('The user aborted a request.');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValue(abortError);

    const onProgress = vi.fn();
    await downloadWithProgress('http://example.com/file.zip', 'file.zip', onProgress);

    expect(mockWindowOpen).not.toHaveBeenCalled();
    expect(onProgress).not.toHaveBeenCalled();
  });

  it('should fallback to window.open on other errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const onProgress = vi.fn();
    await downloadWithProgress('http://example.com/file.zip', 'file.zip', onProgress);

    expect(mockWindowOpen).toHaveBeenCalledWith(
      'http://example.com/file.zip',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('should handle progress when content-length is 0 (unknown size)', async () => {
    const data = new Uint8Array([10, 20, 30]);
    const mockReader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({ done: false, value: data })
        .mockResolvedValueOnce({ done: true, value: undefined }),
    };

    mockFetch.mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader },
      headers: { get: () => '0' },
    });

    const linkElement = document.createElement('a');
    const clickSpy = vi.spyOn(linkElement, 'click').mockImplementation(() => undefined);
    mockCreateElement.mockReturnValue(linkElement);

    const onProgress = vi.fn();
    await downloadWithProgress('http://example.com/file.zip', 'file.zip', onProgress);

    // When content-length is 0, progress is not reported
    expect(onProgress).not.toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });

  it('should report incremental progress for multi-chunk downloads', async () => {
    const chunk1 = new Uint8Array([1, 2, 3]); // 3 bytes
    const chunk2 = new Uint8Array([4, 5, 6, 7]); // 4 bytes

    const mockReader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({ done: false, value: chunk1 })
        .mockResolvedValueOnce({ done: false, value: chunk2 })
        .mockResolvedValueOnce({ done: true, value: undefined }),
    };

    mockFetch.mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader },
      headers: { get: () => '7' },
    });

    const linkElement = { href: '', download: '', click: vi.fn() };
    mockCreateElement.mockReturnValue(linkElement);

    const onProgress = vi.fn();
    await downloadWithProgress('http://example.com/file.zip', 'file.zip', onProgress);

    // First chunk: 3/7 = 42%
    expect(onProgress).toHaveBeenCalledWith(42);
    // Second chunk: 7/7 = 100%
    expect(onProgress).toHaveBeenCalledWith(100);
  });
});
