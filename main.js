"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => MDtoLinkPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian4 = require("obsidian");

// src/api-client.ts
var import_obsidian = require("obsidian");
var MDtoLinkApiError = class extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "MDtoLinkApiError";
  }
};
var MDtoLinkClient = class {
  constructor(serverUrl, apiKey) {
    this.serverUrl = serverUrl;
    this.apiKey = apiKey;
  }
  headers() {
    return {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey
    };
  }
  async request(method, path, body) {
    const url = `${this.serverUrl}${path}`;
    try {
      const response = await (0, import_obsidian.requestUrl)({
        url,
        method,
        headers: this.headers(),
        body: body !== void 0 ? JSON.stringify(body) : void 0,
        throw: false
      });
      if (response.status >= 400) {
        const errorBody = response.json;
        throw new MDtoLinkApiError(
          response.status,
          errorBody?.message ?? `Request failed with status ${response.status}`
        );
      }
      return response.json;
    } catch (err) {
      if (err instanceof MDtoLinkApiError) {
        throw err;
      }
      const status = err?.status;
      if (typeof status === "number" && status >= 400) {
        throw new MDtoLinkApiError(
          status,
          err?.message ?? `Request failed with status ${status}`
        );
      }
      throw err;
    }
  }
  async getMe() {
    return await this.request("GET", "/api/users/me");
  }
  async getSubscription() {
    return await this.request(
      "GET",
      "/api/billing/subscription"
    );
  }
  async createDocument(data) {
    return await this.request("POST", "/api/documents", data);
  }
  async updateDocument(id, data) {
    return await this.request(
      "PATCH",
      `/api/documents/${id}`,
      data
    );
  }
  async deleteDocument(id) {
    await this.request("DELETE", `/api/documents/${id}`);
  }
};

// src/frontmatter.ts
var FRONTMATTER_KEYS = {
  id: "mdtolink-id",
  slug: "mdtolink-slug",
  url: "mdtolink-url"
};
function getMDtoLinkMeta(app, file) {
  const cache = app.metadataCache.getFileCache(file);
  const fm = cache?.frontmatter;
  if (fm === void 0) {
    return null;
  }
  const id = fm[FRONTMATTER_KEYS.id];
  const slug = fm[FRONTMATTER_KEYS.slug];
  const url = fm[FRONTMATTER_KEYS.url];
  if (id === void 0 || slug === void 0 || url === void 0) {
    return null;
  }
  return { id, slug, url };
}
async function setMDtoLinkMeta(app, file, meta) {
  await app.fileManager.processFrontMatter(file, (fm) => {
    fm[FRONTMATTER_KEYS.id] = meta.id;
    fm[FRONTMATTER_KEYS.slug] = meta.slug;
    fm[FRONTMATTER_KEYS.url] = meta.url;
  });
}
async function clearMDtoLinkMeta(app, file) {
  await app.fileManager.processFrontMatter(file, (fm) => {
    delete fm[FRONTMATTER_KEYS.id];
    delete fm[FRONTMATTER_KEYS.slug];
    delete fm[FRONTMATTER_KEYS.url];
  });
}
function stripFrontmatter(content) {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (match !== null) {
    return content.slice(match[0].length);
  }
  return content;
}

// src/publish.ts
var import_obsidian3 = require("obsidian");

// src/settings.ts
var import_obsidian2 = require("obsidian");
var SERVER_URL = "https://api.mdtolink.com";
var APP_URL = "https://app.mdtolink.com";
var DEFAULT_SETTINGS = {
  apiKey: "",
  defaultPublic: true
};
var MDtoLinkSettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
    __publicField(this, "planInfoEl", null);
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian2.Setting(containerEl).setName("API key").setDesc(
      (0, import_obsidian2.createFragment)((frag) => {
        frag.appendText("Generate one from your ");
        frag.createEl("a", {
          text: "Dashboard",
          href: `${APP_URL}/dashboard/account`
        });
        frag.appendText(".");
      })
    ).addText(
      (text) => text.setPlaceholder("Enter your API key").setValue(this.plugin.settings.apiKey).onChange(async (value) => {
        this.plugin.settings.apiKey = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Publish as public").setDesc("When enabled, new notes are published publicly by default.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.defaultPublic).onChange(async (value) => {
        this.plugin.settings.defaultPublic = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Test connection").setDesc("Verify your API key and check your current plan.").addButton(
      (btn) => btn.setButtonText("Test").onClick(async () => {
        await this.testConnection();
      })
    );
    this.planInfoEl = containerEl.createDiv({ cls: "mdtolink-plan-info" });
    if (this.plugin.settings.apiKey.length > 0) {
      this.loadPlanInfo().catch(() => {
      });
    }
  }
  async testConnection() {
    if (this.plugin.settings.apiKey.length === 0) {
      new import_obsidian2.Notice("Please enter your API key first.");
      return;
    }
    const client = new MDtoLinkClient(SERVER_URL, this.plugin.settings.apiKey);
    try {
      const user = await client.getMe();
      this.plugin.cachedUsername = user.username;
      new import_obsidian2.Notice(`Connected as ${user.name} (${user.email})`);
      await this.loadPlanInfo();
    } catch (error) {
      if (error instanceof MDtoLinkApiError && error.status === 401) {
        new import_obsidian2.Notice("Invalid API key. Please check and try again.");
      } else {
        new import_obsidian2.Notice("Failed to connect to the server.");
      }
    }
  }
  async loadPlanInfo() {
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
        cls: "mdtolink-plan-card"
      });
      new import_obsidian2.Setting(card).setName(
        `Current plan: ${plan.charAt(0).toUpperCase() + plan.slice(1)}`
      ).setHeading();
      if (plan === "free") {
        const desc = card.createEl("p");
        desc.appendText(
          "You have 5 document slots. Upgrade to Pro for unlimited documents, custom handles, and branding removal. "
        );
        desc.createEl("a", {
          text: "Upgrade to pro",
          href: plansUrl
        });
      } else if (plan === "pro") {
        const desc = card.createEl("p");
        desc.appendText(
          "Unlimited documents with custom handles. Upgrade to Publisher for custom domains. "
        );
        desc.createEl("a", {
          text: "Upgrade to publisher",
          href: plansUrl
        });
      } else {
        card.createEl("p", {
          text: "You have full access to all features."
        });
      }
    } catch {
    }
  }
};

// src/publish.ts
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}
function buildDocumentUrl(slug, urlType, username) {
  if (urlType === "user_scoped" && username !== null) {
    return `${APP_URL}/@${username}/${slug}`;
  }
  return `${APP_URL}/d/${slug}`;
}
async function publishNote(app, client, settings, username) {
  const file = app.workspace.getActiveFile();
  if (file === null) {
    new import_obsidian3.Notice("No active file to publish.");
    return;
  }
  if (file.extension !== "md") {
    new import_obsidian3.Notice("Only Markdown files can be published.");
    return;
  }
  const rawContent = await app.vault.read(file);
  const content = stripFrontmatter(rawContent);
  if (content.trim().length === 0) {
    new import_obsidian3.Notice("Cannot publish an empty note.");
    return;
  }
  const title = file.basename;
  const existingMeta = getMDtoLinkMeta(app, file);
  try {
    if (existingMeta !== null) {
      const doc = await client.updateDocument(existingMeta.id, {
        content,
        title
      });
      const docUrl = buildDocumentUrl(doc.slug, doc.urlType, username);
      await setMDtoLinkMeta(app, file, {
        id: doc.id,
        slug: doc.slug,
        url: docUrl
      });
      await navigator.clipboard.writeText(docUrl);
      new import_obsidian3.Notice(`Updated! Link copied: ${docUrl}`);
    } else {
      const slug = slugify(file.basename);
      let doc;
      try {
        doc = await client.createDocument({
          content,
          title,
          slug: slug.length > 0 ? slug : void 0,
          isPublic: settings.defaultPublic
        });
      } catch (err) {
        if (err instanceof MDtoLinkApiError && err.status === 403 && slug.length > 0) {
          doc = await client.createDocument({
            content,
            title,
            isPublic: settings.defaultPublic
          });
        } else {
          throw err;
        }
      }
      const docUrl = buildDocumentUrl(doc.slug, doc.urlType, username);
      await setMDtoLinkMeta(app, file, {
        id: doc.id,
        slug: doc.slug,
        url: docUrl
      });
      await navigator.clipboard.writeText(docUrl);
      new import_obsidian3.Notice(`Published! Link copied: ${docUrl}`);
    }
  } catch (error) {
    handleApiError(error);
  }
}
async function unpublishNote(app, client) {
  const file = app.workspace.getActiveFile();
  if (file === null) {
    new import_obsidian3.Notice("No active file.");
    return;
  }
  const meta = getMDtoLinkMeta(app, file);
  if (meta === null) {
    new import_obsidian3.Notice("This note is not published.");
    return;
  }
  try {
    await client.deleteDocument(meta.id);
    await clearMDtoLinkMeta(app, file);
    new import_obsidian3.Notice("Note unpublished.");
  } catch (error) {
    handleApiError(error);
  }
}
async function copyLink(app) {
  const file = app.workspace.getActiveFile();
  if (file === null) {
    new import_obsidian3.Notice("No active file.");
    return;
  }
  const meta = getMDtoLinkMeta(app, file);
  if (meta === null) {
    new import_obsidian3.Notice("This note is not published. Publish it first.");
    return;
  }
  await navigator.clipboard.writeText(meta.url);
  new import_obsidian3.Notice(`Link copied: ${meta.url}`);
}
function handleApiError(error) {
  if (error instanceof MDtoLinkApiError) {
    if (error.status === 401) {
      new import_obsidian3.Notice("Invalid or expired API key. Check your plugin settings.");
      return;
    }
    if (error.status === 403) {
      const plansUrl = `${APP_URL}/dashboard/plans`;
      if (error.message.includes("limit")) {
        new import_obsidian3.Notice(
          `You've reached the free plan limit (5 docs). Upgrade to Pro for unlimited: ${plansUrl}`
        );
      } else if (error.message.includes("Private")) {
        new import_obsidian3.Notice(
          `Private documents require a Pro plan. Upgrade: ${plansUrl}`
        );
      } else if (error.message.includes("slug")) {
        new import_obsidian3.Notice(`Custom slugs require a Pro plan. Upgrade: ${plansUrl}`);
      } else {
        new import_obsidian3.Notice(`Access denied: ${error.message}`);
      }
      return;
    }
    new import_obsidian3.Notice(`Server error: ${error.message}`);
    return;
  }
  new import_obsidian3.Notice("Failed to connect to the server.");
}

// src/main.ts
var MDtoLinkPlugin = class extends import_obsidian4.Plugin {
  constructor() {
    super(...arguments);
    __publicField(this, "settings", DEFAULT_SETTINGS);
    __publicField(this, "cachedUsername", null);
    __publicField(this, "statusBarEl", null);
  }
  async onload() {
    await this.loadSettings();
    this.addRibbonIcon("share", "Publish current note", async () => {
      await this.handlePublish();
    });
    this.addCommand({
      id: "publish",
      name: "Publish current note",
      callback: async () => {
        await this.handlePublish();
      }
    });
    this.addCommand({
      id: "unpublish",
      name: "Unpublish current note",
      callback: async () => {
        await this.handleUnpublish();
      }
    });
    this.addCommand({
      id: "copy-link",
      name: "Copy published link",
      callback: async () => {
        await copyLink(this.app);
      }
    });
    this.addSettingTab(new MDtoLinkSettingTab(this.app, this));
    this.statusBarEl = this.addStatusBarItem();
    this.updateStatusBar();
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.updateStatusBar();
      })
    );
    if (this.settings.apiKey.length > 0) {
      this.fetchUsername().catch(() => {
      });
    }
  }
  async loadSettings() {
    const data = await this.loadData();
    this.settings = { ...DEFAULT_SETTINGS, ...data };
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  createClient() {
    if (this.settings.apiKey.length === 0) {
      new import_obsidian4.Notice("Please set your API key in the plugin settings.");
      return null;
    }
    return new MDtoLinkClient(SERVER_URL, this.settings.apiKey);
  }
  async handlePublish() {
    const client = this.createClient();
    if (client === null) {
      return;
    }
    await publishNote(this.app, client, this.settings, this.cachedUsername);
    this.updateStatusBar();
  }
  async handleUnpublish() {
    const client = this.createClient();
    if (client === null) {
      return;
    }
    await unpublishNote(this.app, client);
    this.updateStatusBar();
  }
  updateStatusBar() {
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
      this.statusBarEl.setText("Published");
    } else {
      this.statusBarEl.setText("Not published");
    }
  }
  async fetchUsername() {
    try {
      const client = new MDtoLinkClient(SERVER_URL, this.settings.apiKey);
      const user = await client.getMe();
      this.cachedUsername = user.username;
    } catch {
    }
  }
};
