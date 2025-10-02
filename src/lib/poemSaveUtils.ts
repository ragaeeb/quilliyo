import type { Poem, Thought } from '@/types/notebook';

export function buildPoemForSave(
    poem: Poem | null,
    title: string,
    content: string,
    poemTags: string[],
    category: string,
    chapter: string,
    createdOn: string,
    lastUpdatedOn: string,
    urls: string[],
    thoughts: Thought[],
): Poem {
    const cleanPoem: Poem = {
        content: content || '',
        id: poem?.id || Date.now().toString(),
        title: title || 'Untitled',
    };

    if (poemTags.length > 0) {
        cleanPoem.tags = poemTags;
    }
    if (category) {
        cleanPoem.category = category;
    }
    if (chapter) {
        cleanPoem.chapter = chapter;
    }
    if (createdOn) {
        cleanPoem.createdOn = new Date(createdOn).toISOString();
    }
    if (lastUpdatedOn) {
        cleanPoem.lastUpdatedOn = new Date(lastUpdatedOn).toISOString();
    } else {
        cleanPoem.lastUpdatedOn = new Date().toISOString();
    }

    const metadata: any = { ...(poem?.metadata || {}) };

    if (urls.length > 0) {
        metadata.urls = urls.join('\n');
    }

    if (thoughts.length > 0) {
        metadata.thoughts = JSON.stringify(thoughts);
    }

    if (Object.keys(metadata).length > 0) {
        cleanPoem.metadata = metadata;
    }

    return cleanPoem;
}
