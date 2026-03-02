import { type App, Notice, PluginSettingTab, Setting } from "obsidian";
import { MDtoLinkApiError, MDtoLinkClient } from "./api-client";
import type MDtoLinkPlugin from "./main";

export const SERVER_URL = "https://api.mdtolink.com";
export const APP_URL = "https://app.mdtolink.com";

export interface MDtoLinkSettings {
	apiKey: string;
	defaultPublic: boolean;
}

export const DEFAULT_SETTINGS: MDtoLinkSettings = {
	apiKey: "",
	defaultPublic: true,
};

export class MDtoLinkSettingTab extends PluginSettingTab {
	private planInfoEl: HTMLElement | null = null;

	constructor(
		app: App,
		private plugin: MDtoLinkPlugin
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "MDtoLink Settings" });

		// API Key
		new Setting(containerEl)
			.setName("API key")
			.setDesc(
				createFragment((frag) => {
					frag.appendText("Generate one from your ");
					frag.createEl("a", {
						text: "MDtoLink dashboard",
						href: `${APP_URL}/dashboard/account`,
					});
					frag.appendText(".");
				})
			)
			.addText((text) =>
				text
					.setPlaceholder("mdtolink_...")
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value;
						await this.plugin.saveSettings();
					})
			);

		// Default visibility
		new Setting(containerEl)
			.setName("Publish as public")
			.setDesc("When enabled, new notes are published publicly by default.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.defaultPublic)
					.onChange(async (value) => {
						this.plugin.settings.defaultPublic = value;
						await this.plugin.saveSettings();
					})
			);

		// Test connection button
		new Setting(containerEl)
			.setName("Test connection")
			.setDesc("Verify your API key and check your current plan.")
			.addButton((btn) =>
				btn.setButtonText("Test").onClick(async () => {
					await this.testConnection();
				})
			);

		// Plan info container
		this.planInfoEl = containerEl.createDiv({ cls: "mdtolink-plan-info" });

		// Auto-load plan info if API key is set
		if (this.plugin.settings.apiKey.length > 0) {
			this.loadPlanInfo();
		}
	}

	private async testConnection(): Promise<void> {
		if (this.plugin.settings.apiKey.length === 0) {
			new Notice("Please enter your API key first.");
			return;
		}

		const client = new MDtoLinkClient(SERVER_URL, this.plugin.settings.apiKey);

		try {
			const user = await client.getMe();
			this.plugin.cachedUsername = user.username;
			new Notice(`Connected as ${user.name} (${user.email})`);
			await this.loadPlanInfo();
		} catch (error) {
			if (error instanceof MDtoLinkApiError && error.status === 401) {
				new Notice("Invalid API key. Please check and try again.");
			} else {
				new Notice("Failed to connect to MDtoLink.");
			}
		}
	}

	private async loadPlanInfo(): Promise<void> {
		if (this.planInfoEl === null) {
			return;
		}
		this.planInfoEl.empty();

		const client = new MDtoLinkClient(SERVER_URL, this.plugin.settings.apiKey);

		try {
			const subscription = await client.getSubscription();
			const plan = subscription?.plan ?? "free";
			const plansUrl = `${APP_URL}/dashboard/plans`;

			const card = this.planInfoEl.createDiv({
				cls: "mdtolink-plan-card",
			});

			card.createEl("h3", {
				text: `Current plan: ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
			});

			if (plan === "free") {
				const desc = card.createEl("p");
				desc.appendText(
					"You have 5 document slots. Upgrade to Pro for unlimited documents, custom handles, and branding removal. "
				);
				desc.createEl("a", {
					text: "Upgrade to Pro",
					href: plansUrl,
				});
			} else if (plan === "pro") {
				const desc = card.createEl("p");
				desc.appendText(
					"Unlimited documents with custom handles. Upgrade to Publisher for custom domains. "
				);
				desc.createEl("a", {
					text: "Upgrade to Publisher",
					href: plansUrl,
				});
			} else {
				card.createEl("p", {
					text: "You have full access to all features.",
				});
			}
		} catch {
			// Silently fail if plan info can't be loaded
		}
	}
}
