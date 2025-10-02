import { describe, expect, it } from 'bun:test';
import { buildPoemForSave } from '@/lib/poemSaveUtils';
import type { Poem, Thought } from '@/types/notebook';

describe('buildPoemForSave', () => {
    const baseThought: Thought = {
        createdAt: '2024-01-01T00:00:00Z',
        endIndex: 8,
        id: 'thought-1',
        selectedText: 'selected',
        startIndex: 0,
        text: 'A thought',
    };

    it('should create a new poem with minimum required fields', () => {
        const result = buildPoemForSave(null, 'Test Title', 'Test Content', [], '', '', '', '', [], []);

        expect(result.id).toBeDefined();
        expect(result.title).toBe('Test Title');
        expect(result.content).toBe('Test Content');
        expect(result.lastUpdatedOn).toBeDefined();
    });

    it('should use existing poem ID when provided', () => {
        const existingPoem: Poem = { content: 'Old Content', id: 'existing-123', title: 'Old Title' };

        const result = buildPoemForSave(existingPoem, 'New Title', 'New Content', [], '', '', '', '', [], []);

        expect(result.id).toBe('existing-123');
    });

    it('should use "Untitled" when title is empty', () => {
        const result = buildPoemForSave(null, '', 'Content', [], '', '', '', '', [], []);

        expect(result.title).toBe('Untitled');
    });

    it('should handle empty content', () => {
        const result = buildPoemForSave(null, 'Title', '', [], '', '', '', '', [], []);

        expect(result.content).toBe('');
    });

    it('should include tags when provided', () => {
        const result = buildPoemForSave(null, 'Title', 'Content', ['tag1', 'tag2', 'tag3'], '', '', '', '', [], []);

        expect(result.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should not include tags field when empty array', () => {
        const result = buildPoemForSave(null, 'Title', 'Content', [], '', '', '', '', [], []);

        expect(result.tags).toBeUndefined();
    });

    it('should include category when provided', () => {
        const result = buildPoemForSave(null, 'Title', 'Content', [], 'Poetry', '', '', '', [], []);

        expect(result.category).toBe('Poetry');
    });

    it('should not include category field when empty', () => {
        const result = buildPoemForSave(null, 'Title', 'Content', [], '', '', '', '', [], []);

        expect(result.category).toBeUndefined();
    });

    it('should include chapter when provided', () => {
        const result = buildPoemForSave(null, 'Title', 'Content', [], '', 'Chapter 1', '', '', [], []);

        expect(result.chapter).toBe('Chapter 1');
    });

    it('should not include chapter field when empty', () => {
        const result = buildPoemForSave(null, 'Title', 'Content', [], '', '', '', '', [], []);

        expect(result.chapter).toBeUndefined();
    });

    it('should include createdOn as ISO string when provided', () => {
        const createdOn = '2024-01-15T10:30:00Z';
        const result = buildPoemForSave(null, 'Title', 'Content', [], '', '', createdOn, '', [], []);

        expect(result.createdOn).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should not include createdOn field when empty', () => {
        const result = buildPoemForSave(null, 'Title', 'Content', [], '', '', '', '', [], []);

        expect(result.createdOn).toBeUndefined();
    });

    it('should use provided lastUpdatedOn when given', () => {
        const lastUpdatedOn = '2024-01-20T15:45:00Z';
        const result = buildPoemForSave(null, 'Title', 'Content', [], '', '', '', lastUpdatedOn, [], []);

        expect(result.lastUpdatedOn).toBe('2024-01-20T15:45:00.000Z');
    });

    it('should generate current timestamp for lastUpdatedOn when not provided', () => {
        const beforeTime = new Date().toISOString();

        const result = buildPoemForSave(null, 'Title', 'Content', [], '', '', '', '', [], []);

        const afterTime = new Date().toISOString();

        expect(result.lastUpdatedOn).toBeDefined();
        expect(result.lastUpdatedOn! >= beforeTime).toBe(true);
        expect(result.lastUpdatedOn! <= afterTime).toBe(true);
    });

    it('should include metadata with urls when provided', () => {
        const urls = ['https://example.com', 'https://test.com'];
        const result = buildPoemForSave(null, 'Title', 'Content', [], '', '', '', '', urls, []);

        expect(result.metadata).toBeDefined();
        expect(result.metadata?.urls).toEqual(urls);
    });

    it('should include metadata with thoughts when provided', () => {
        const thoughts = [baseThought];
        const result = buildPoemForSave(null, 'Title', 'Content', [], '', '', '', '', [], thoughts);

        expect(result.metadata).toBeDefined();
        expect(result.metadata?.thoughts).toEqual(thoughts);
    });

    it('should include metadata with both urls and thoughts', () => {
        const urls = ['https://example.com'];
        const thoughts = [baseThought];

        const result = buildPoemForSave(null, 'Title', 'Content', [], '', '', '', '', urls, thoughts);

        expect(result.metadata).toBeDefined();
        expect(result.metadata?.urls).toEqual(urls);
        expect(result.metadata?.thoughts).toEqual(thoughts);
    });

    it('should preserve existing metadata and merge with new values', () => {
        const existingPoem: Poem = {
            content: 'Content',
            id: 'poem-1',
            metadata: { thoughts: [baseThought], urls: ['https://old.com'] },
            title: 'Title',
        };

        const newUrls = ['https://new.com'];
        const newThoughts: Thought[] = [{ ...baseThought, id: 'thought-2', text: 'New thought' }];

        const result = buildPoemForSave(existingPoem, 'Title', 'Content', [], '', '', '', '', newUrls, newThoughts);

        expect(result.metadata?.urls).toEqual(newUrls);
        expect(result.metadata?.thoughts).toEqual(newThoughts);
    });

    it('should create complete poem with all fields', () => {
        const existingPoem: Poem = { content: 'Old Content', id: 'poem-123', title: 'Old Title' };

        const result = buildPoemForSave(
            existingPoem,
            'New Title',
            'New Content',
            ['nature', 'sunset'],
            'Poetry',
            'Spring Collection',
            '2024-01-01T00:00:00Z',
            '2024-01-15T12:00:00Z',
            ['https://example.com'],
            [baseThought],
        );

        expect(result).toEqual({
            category: 'Poetry',
            chapter: 'Spring Collection',
            content: 'New Content',
            createdOn: '2024-01-01T00:00:00.000Z',
            id: 'poem-123',
            lastUpdatedOn: '2024-01-15T12:00:00.000Z',
            metadata: { thoughts: [baseThought], urls: ['https://example.com'] },
            tags: ['nature', 'sunset'],
            title: 'New Title',
        });
    });

    it('should handle whitespace in title', () => {
        const result = buildPoemForSave(null, '   ', 'Content', [], '', '', '', '', [], []);

        expect(result.title).toBe('   ');
    });

    it('should handle special characters in content', () => {
        const specialContent = 'Line 1\nLine 2\tTabbed\n"Quoted"';
        const result = buildPoemForSave(null, 'Title', specialContent, [], '', '', '', '', [], []);

        expect(result.content).toBe(specialContent);
    });

    it('should handle multiple thoughts in metadata', () => {
        const thoughts: Thought[] = [
            baseThought,
            { ...baseThought, id: 'thought-2', text: 'Second thought' },
            { ...baseThought, id: 'thought-3', text: 'Third thought' },
        ];

        const result = buildPoemForSave(null, 'Title', 'Content', [], '', '', '', '', [], thoughts);

        expect(result.metadata?.thoughts).toHaveLength(3);
        expect(result.metadata?.thoughts).toEqual(thoughts);
    });

    it('should handle multiple urls in metadata', () => {
        const urls = ['https://example1.com', 'https://example2.com', 'https://example3.com'];

        const result = buildPoemForSave(null, 'Title', 'Content', [], '', '', '', '', urls, []);

        expect(result.metadata?.urls).toHaveLength(3);
        expect(result.metadata?.urls).toEqual(urls);
    });
});
