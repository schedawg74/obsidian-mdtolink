import { Notice, Plugin } from "obsidian";
import { MDtoLinkClient } from "./api-client";
import { getMDtoLinkMeta } from "./frontmatter";
import { copyLink, publishNote, unpublishNote } from "./publish";
import {
	DEFAULT_SETTINGS,
	type MDtoLinkSettings,
	MDtoLinkSettingTab,
	SERVER_URL,
} from "./settings";

export default class MDtoLinkPlugin extends Plugin {
	settings: MDtoLinkSettings = DEFAULT_SETTINGS;
	cachedUsername: string | null = null;

	private statusBarEl: HTMLElement | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();

		// Ribbon icon
		this.addRibbonIcon("share", "Publish to MDtoLink", async () => {
			await this.handlePublish();
		});

		// Commands
		this.addCommand({
			id: "publish",
			name: "Publish to MDtoLink",
			callback: async () => {
				await this.handlePublish();
			},
		});

		this.addCommand({
			id: "unpublish",
			name: "Unpublish from MDtoLink",
			callback: async () => {
				await this.handleUnpublish();
			},
		});

		this.addCommand({
			id: "copy-link",
			name: "Copy MDtoLink URL",
			callback: async () => {
				await copyLink(this.app);
			},
		});

		// Settings tab
		this.addSettingTab(new MDtoLinkSettingTab(this.app, this));

		// Status bar
		this.statusBarEl = this.addStatusBarItem();
		this.updateStatusBar();

		// Update status bar on active file change
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				this.updateStatusBar();
			})
		);

		// Fetch username on load if API key is configured
		if (this.settings.apiKey.length > 0) {
			this.fetchUsername();
		}
	}

	async loadSettings(): Promise<void> {
		const data = await this.loadData();
		this.settings = { ...DEFAULT_SETTINGS, ...data };
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	private createClient(): MDtoLinkClient | null {
		if (this.settings.apiKey.length === 0) {
			new Notice("MDtoLink: Please set your API key in the plugin settings.");
			return null;
		}
		return new MDtoLinkClient(SERVER_URL, this.settings.apiKey);
	}

	private async handlePublish(): Promise<void> {
		const client = this.createClient();
		if (client === null) {
			return;
		}
		await publishNote(this.app, client, this.settings, this.cachedUsername);
		this.updateStatusBar();
	}

	private async handleUnpublish(): Promise<void> {
		const client = this.createClient();
		if (client === null) {
			return;
		}
		await unpublishNote(this.app, client);
		this.updateStatusBar();
	}

	private updateStatusBar(): void {
		if (this.statusBarEl === null) {
			return;
		}

		const file = this.app.workspace.getActiveFile();
		if (file === null || file.extension !== "md") {
			this.statusBarEl.setText("");
			return;
		}

		const meta = getMDtoLinkMeta(this.app, file);
		if (meta !== null) {
			this.statusBarEl.setText("MDtoLink: Published");
		} else {
			this.statusBarEl.setText("MDtoLink: Not published");
		}
	}

	private async fetchUsername(): Promise<void> {
		try {
			const client = new MDtoLinkClient(SERVER_URL, this.settings.apiKey);
			const user = await client.getMe();
			this.cachedUsername = user.username;
		} catch {
			// Silently fail — username is optional for URL formatting
		}
	}
}
