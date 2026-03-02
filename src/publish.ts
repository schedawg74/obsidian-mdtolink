import { type App, Notice } from "obsidian";
import { MDtoLinkApiError, type MDtoLinkClient } from "./api-client";
import {
	clearMDtoLinkMeta,
	getMDtoLinkMeta,
	setMDtoLinkMeta,
	stripFrontmatter,
} from "./frontmatter";
import { APP_URL, type MDtoLinkSettings } from "./settings";

/**
 * Derive a URL-friendly slug from a note filename.
 * "My Meeting Notes" → "my-meeting-notes"
 */
function slugify(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 100);
}

function buildDocumentUrl(
	slug: string,
	urlType: string,
	username: string | null
): string {
	if (urlType === "user_scoped" && username !== null) {
		return `${APP_URL}/@${username}/${slug}`;
	}
	return `${APP_URL}/d/${slug}`;
}

export async function publishNote(
	app: App,
	client: MDtoLinkClient,
	settings: MDtoLinkSettings,
	username: string | null
): Promise<void> {
	const file = app.workspace.getActiveFile();
	if (file === null) {
		new Notice("No active file to publish.");
		return;
	}

	if (file.extension !== "md") {
		new Notice("Only markdown files can be published.");
		return;
	}

	const rawContent = await app.vault.read(file);
	const content = stripFrontmatter(rawContent);

	if (content.trim().length === 0) {
		new Notice("Cannot publish an empty note.");
		return;
	}

	const title = file.basename;
	const existingMeta = getMDtoLinkMeta(app, file);

	try {
		if (existingMeta !== null) {
			// Update existing document
			const doc = await client.updateDocument(existingMeta.id, {
				content,
				title,
			});
			const docUrl = buildDocumentUrl(doc.slug, doc.urlType, username);
			await setMDtoLinkMeta(app, file, {
				id: doc.id,
				slug: doc.slug,
				url: docUrl,
			});
			await navigator.clipboard.writeText(docUrl);
			new Notice(`Updated! Link copied: ${docUrl}`);
		} else {
			// Create new document — derive slug from filename so Pro+ users
			// get nice /@username/my-note URLs instead of nanoid slugs.
			// Free users can't use custom slugs, so retry without one on 403.
			const slug = slugify(file.basename);
			let doc;
			try {
				doc = await client.createDocument({
					content,
					title,
					slug: slug.length > 0 ? slug : undefined,
					isPublic: settings.defaultPublic,
				});
			} catch (err) {
				if (
					err instanceof MDtoLinkApiError &&
					err.status === 403 &&
					slug.length > 0
				) {
					// Free plan — retry without custom slug
					doc = await client.createDocument({
						content,
						title,
						isPublic: settings.defaultPublic,
					});
				} else {
					throw err;
				}
			}
			const docUrl = buildDocumentUrl(doc.slug, doc.urlType, username);
			await setMDtoLinkMeta(app, file, {
				id: doc.id,
				slug: doc.slug,
				url: docUrl,
			});
			await navigator.clipboard.writeText(docUrl);
			new Notice(`Published! Link copied: ${docUrl}`);
		}
	} catch (error) {
		handleApiError(error);
	}
}

export async function unpublishNote(
	app: App,
	client: MDtoLinkClient
): Promise<void> {
	const file = app.workspace.getActiveFile();
	if (file === null) {
		new Notice("No active file.");
		return;
	}

	const meta = getMDtoLinkMeta(app, file);
	if (meta === null) {
		new Notice("This note is not published on MDtoLink.");
		return;
	}

	try {
		await client.deleteDocument(meta.id);
		await clearMDtoLinkMeta(app, file);
		new Notice("Note unpublished from MDtoLink.");
	} catch (error) {
		handleApiError(error);
	}
}

export async function copyLink(app: App): Promise<void> {
	const file = app.workspace.getActiveFile();
	if (file === null) {
		new Notice("No active file.");
		return;
	}

	const meta = getMDtoLinkMeta(app, file);
	if (meta === null) {
		new Notice("This note is not published. Publish it first.");
		return;
	}

	await navigator.clipboard.writeText(meta.url);
	new Notice(`Link copied: ${meta.url}`);
}

function handleApiError(error: unknown): void {
	if (error instanceof MDtoLinkApiError) {
		if (error.status === 401) {
			new Notice(
				"Invalid or expired API key. Check your MDtoLink plugin settings."
			);
			return;
		}
		if (error.status === 403) {
			const plansUrl = `${APP_URL}/dashboard/plans`;
			if (error.message.includes("limit")) {
				new Notice(
					`You've reached the free plan limit (5 docs). Upgrade to Pro for unlimited: ${plansUrl}`
				);
			} else if (error.message.includes("slug")) {
				new Notice(`Custom slugs require a Pro plan. Upgrade: ${plansUrl}`);
			} else {
				new Notice(`Access denied: ${error.message}`);
			}
			return;
		}
		new Notice(`MDtoLink error: ${error.message}`);
		return;
	}
	new Notice("Failed to connect to MDtoLink.");
}
