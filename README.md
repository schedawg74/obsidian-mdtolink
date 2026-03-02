# MDtoLink for Obsidian

Publish markdown notes to shareable URLs with one click.

## Setup

1. Install the plugin in Obsidian (Settings > Community plugins)
2. Go to [app.mdtolink.com](https://app.mdtolink.com) and create an account
3. Generate an API key from your [dashboard](https://app.mdtolink.com/dashboard/account) (Account > API Keys)
4. Open plugin settings and paste your API key
5. Click **Test** to verify the connection

## Usage

### Publish a note

Open any markdown note and either:

- Click the **share icon** in the ribbon (left sidebar)
- Open the command palette (`Ctrl/Cmd+P`) and run **Publish to MDtoLink**

The note is published and the shareable URL is copied to your clipboard. Frontmatter is added to track the published document:

```yaml
---
mdtolink-id: "doc_abc123"
mdtolink-slug: "my-note"
mdtolink-url: "https://app.mdtolink.com/@username/my-note"
---
```

### Update a published note

Just publish again. The plugin detects the `mdtolink-id` in frontmatter and updates the existing document instead of creating a new one.

### Unpublish a note

Open the command palette and run **Unpublish from MDtoLink**. The document is removed from MDtoLink and the frontmatter is cleared.

### Copy link

Open the command palette and run **Copy MDtoLink URL** to copy the shareable link for an already-published note.

## Commands

| Command | Description |
|---------|-------------|
| Publish to MDtoLink | Publish or update the active note |
| Unpublish from MDtoLink | Remove the active note from MDtoLink |
| Copy MDtoLink URL | Copy the shareable link to clipboard |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| API key | — | Your `mdtolink_...` API key |
| Publish as public | On | Whether new notes are publicly accessible by default |

## Status bar

The status bar shows the publish state of the active note:

- **MDtoLink: Published** — this note has been published
- **MDtoLink: Not published** — this note has not been published yet

## Plans

Your plan determines what features are available:

| Feature | Free | Pro | Publisher |
|---------|------|-----|-----------|
| Published documents | 5 | Unlimited | Unlimited |
| Custom handles (`/@you/slug`) | — | Yes | Yes |
| Remove branding | — | Yes | Yes |
| Custom domains | — | — | Yes |

Upgrade from the plugin settings or at [app.mdtolink.com/dashboard/plans](https://app.mdtolink.com/dashboard/plans).

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Watch mode
pnpm dev
```

To test locally, symlink the plugin into your vault:

```bash
ln -s /path/to/mdtolink/apps/obsidian /path/to/vault/.obsidian/plugins/mdtolink
```

Then enable **MDtoLink** in Obsidian > Settings > Community plugins.
