import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, afterAll, beforeAll, vi } from 'vitest';

afterEach(() => {
    cleanup();
});

const consoleMocks: Array<ReturnType<typeof vi.spyOn>> = [];

beforeAll(() => {
    const noop = () => {};

    consoleMocks.push(
        vi.spyOn(console, 'log').mockImplementation(noop),
        vi.spyOn(console, 'info').mockImplementation(noop),
        vi.spyOn(console, 'warn').mockImplementation(noop),
        vi.spyOn(console, 'error').mockImplementation(noop)
    );
});

afterAll(() => {
    consoleMocks.forEach((mock) => mock.mockRestore());
    consoleMocks.length = 0;
});

class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

if (!('ResizeObserver' in globalThis)) {
    // @ts-expect-error - provided for test environment
    globalThis.ResizeObserver = ResizeObserver;
}

if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = () => {};
}

if (!window.matchMedia) {
    window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } }) as MediaQueryList;
}

const mediaProto = window.HTMLMediaElement.prototype;

mediaProto.load = vi.fn();
mediaProto.play = vi.fn().mockResolvedValue(undefined);
mediaProto.pause = vi.fn();

if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
}

if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
}

if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
}
