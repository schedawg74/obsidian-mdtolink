import type { App, TFile } from "obsidian";

export interface MDtoLinkMeta {
	id: string;
	slug: string;
	url: string;
}

const FRONTMATTER_KEYS = {
	id: "mdtolink-id",
	slug: "mdtolink-slug",
	url: "mdtolink-url",
} as const;

export function getMDtoLinkMeta(app: App, file: TFile): MDtoLinkMeta | null {
	const cache = app.metadataCache.getFileCache(file);
	const fm = cache?.frontmatter;
	if (fm === undefined) {
		return null;
	}

	const id = fm[FRONTMATTER_KEYS.id] as string | undefined;
	const slug = fm[FRONTMATTER_KEYS.slug] as string | undefined;
	const url = fm[FRONTMATTER_KEYS.url] as string | undefined;

	if (id === undefined || slug === undefined || url === undefined) {
		return null;
	}

	return { id, slug, url };
}

export async function setMDtoLinkMeta(
	app: App,
	file: TFile,
	meta: MDtoLinkMeta
): Promise<void> {
	await app.fileManager.processFrontMatter(file, (fm) => {
		fm[FRONTMATTER_KEYS.id] = meta.id;
		fm[FRONTMATTER_KEYS.slug] = meta.slug;
		fm[FRONTMATTER_KEYS.url] = meta.url;
	});
}

export async function clearMDtoLinkMeta(app: App, file: TFile): Promise<void> {
	await app.fileManager.processFrontMatter(file, (fm) => {
		delete fm[FRONTMATTER_KEYS.id];
		delete fm[FRONTMATTER_KEYS.slug];
		delete fm[FRONTMATTER_KEYS.url];
	});
}

/**
 * Strip YAML frontmatter from markdown content before sending to the API.
 */
export function stripFrontmatter(content: string): string {
	const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
	if (match !== null) {
		return content.slice(match[0].length);
	}
	return content;
}
