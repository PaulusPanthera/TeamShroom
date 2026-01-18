<!-- docs/sidebar-payload-contract.md -->
<!-- v2.0.0-beta -->
<!-- Sidebar payload contract spec returned by features; consumed by router/shell renderer only. -->




# Sidebar payload contract

## Purpose

- Features return a pure data payload describing sidebar content and (optionally) a controls panel.
- Features do not read, scrape, or mutate sidebar DOM.
- Router/shell is the only code that renders the sidebar DOM from this payload.

## Strict rule: no DOM mutation

- Features MUST NOT query, scrape, mutate, or attach listeners to sidebar DOM.
- Features MUST return sidebar content exclusively via this payload contract.
- Router/shell MUST render sidebar DOM exclusively from this payload contract.

## Contract version

- `contractVersion` is required and MUST equal `v2.0.0-beta`.
- Consumers MUST reject payloads with any other `contractVersion`.

## Top-level payload shape

JSON-like object:

```js
{
  contractVersion: "v2.0.0-beta",

  // Required. Stable identifier for the feature producing the payload.
  // Examples: "pokedex", "showcase", "shinyWeekly", "donators"
  featureKey: string,

  // Required. Stable identifier for the specific view/state within the feature.
  // Used for keyed rendering and caching (no DOM scraping).
  viewKey: string,

  // Required. Sidebar header title.
  title: string,

  // Optional. Sidebar header subtitle.
  subtitle?: string,

  // Required. Main content sections in render order.
  sections: SidebarSection[],

  // Optional. Controls panel definition.
  // Omit entirely if the current view has no controls.
  controlsPanel?: ControlsPanel
}
```

Defaults:
- `subtitle`: omitted.
- `controlsPanel`: omitted (treated as not present).

Validation rules:
- `contractVersion`, `featureKey`, `viewKey`, `title` MUST be strings.
- `sections` MUST be an array (missing/invalid => treat as empty array).

## Sections

A section is a titled group of rows.

```js
{
  // Required. Stable within a payload. Used as a render key.
  id: string,

  // Optional. Section title. If omitted, renderer MUST render the section without a header.
  title?: string,

  // Optional. Section subtitle (small helper text).
  subtitle?: string,

  // Optional. If true, renderer MAY allow collapsing this section.
  // Default: false.
  collapsible?: boolean,

  // Optional. Initial collapsed state if collapsible is true.
  // Default: false.
  collapsedByDefault?: boolean,

  // Required. Items in render order.
  items: SidebarItem[],

  // Optional. Controls how an empty items array is handled.
  // Default: "omit".
  // - "omit": renderer MUST omit the section entirely when items is empty after normalization.
  // - "showEmptyState": renderer MUST render the section and replace items with a single muted text row.
  emptyBehavior?: "omit" | "showEmptyState",

  // Optional. Used only when emptyBehavior is "showEmptyState".
  // Default: "No data".
  emptyStateText?: string
}
```

Defaults:
- `collapsible`: false.
- `collapsedByDefault`: false.
- `emptyBehavior`: "omit".
- `emptyStateText`: "No data".

Empty handling for sections:
- A section is considered empty when `items` is missing, not an array, or an empty array.
- Renderer MUST treat missing/invalid `items` as an empty array.
- Renderer MUST apply `emptyBehavior` after validating and normalizing `items`.

## Controls panel

Controls panel exists to avoid feature code touching DOM. It is rendered separately from main sections.

```js
{
  // Optional. Panel title shown above controls.
  // Default: "Controls".
  title?: string,

  // Required. Controls sections in render order.
  // These sections use the same SidebarSection shape.
  sections: SidebarSection[]
}
```

Defaults:
- `title`: "Controls".

Controls panel visibility rules:
- If `controlsPanel` is omitted: controls panel container MUST be hidden.
- If `controlsPanel.sections` is missing/invalid: controls panel container MUST be hidden.
- If `controlsPanel.sections` becomes empty after section empty handling: controls panel container MUST be hidden.

## Items

`SidebarItem` is a tagged union. Each item MUST have a `type` field.

Supported item types:
- `textRow`
- `statRow`
- `actionButtonRow`
- `legendRow`

Shared base fields (all item types):

```js
{
  // Required. Stable within a section. Used as a render key.
  id: string,

  // Required. One of the supported item type strings.
  type: "textRow" | "statRow" | "actionButtonRow" | "legendRow"
}
```

### textRow

Use for label/value rows, links, and general descriptive lines.

```js
{
  id: string,
  type: "textRow",

  // Optional. Left label text.
  label?: string,

  // Required. Primary text value.
  value: string,

  // Optional. Right-aligned secondary value.
  // If present, renderer should show value on left and rightValue on right.
  rightValue?: string,

  // Optional. Icon shown to the left of label/value.
  iconSrc?: string,

  // Optional. If present, row is clickable and navigates to this URL.
  href?: string,

  // Optional. If true and href is present, open link in a new tab.
  // Default: true.
  openInNewTab?: boolean,

  // Optional. If true, renderer shows row in a muted style.
  // Default: false.
  muted?: boolean,

  // Optional. If true, renderer uses a monospace style for value (and rightValue).
  // Default: false.
  monospace?: boolean,

  // Optional. Text wrapping behavior.
  // Default: "wrap".
  wrap?: "wrap" | "nowrap"
}
```

Defaults:
- `openInNewTab`: true (only relevant if `href` is present).
- `muted`: false.
- `monospace`: false.
- `wrap`: "wrap".

Validation rules:
- `value` MUST be a string (empty string allowed).
- If `href` is present, it MUST be a non-empty string.

### statRow

Use for numeric or summary metrics.

```js
{
  id: string,
  type: "statRow",

  // Required. Stat label.
  label: string,

  // Required. Stat value.
  value: string | number,

  // Optional. Unit label appended to the value.
  unit?: string,

  // Optional. Formatting hint for renderer.
  // Default: "raw".
  format?: "raw" | "number" | "percent",

  // Optional. Visual emphasis hint.
  // Default: "normal".
  emphasis?: "normal" | "strong" | "muted"
}
```

Defaults:
- `format`: "raw".
- `emphasis`: "normal".

Validation rules:
- `label` MUST be a non-empty string.
- `value` MUST be string or number.

### actionButtonRow

Use for a clickable action handled by router/shell. Features do not bind DOM handlers.

```js
{
  id: string,
  type: "actionButtonRow",

  // Required. Button text.
  label: string,

  // Required. Action identifier dispatched by the renderer.
  // Namespacing rule: MUST start with `${featureKey}.`
  // Example: "pokedex.copyDexNumber"
  actionId: string,

  // Optional. Small opaque payload passed back with the action.
  // Must be JSON-serializable.
  actionPayload?: object,

  // Optional. Visual variant hint.
  // Default: "secondary".
  variant?: "primary" | "secondary" | "danger",

  // Optional. If true, renderer shows disabled state and MUST NOT dispatch action.
  // Default: false.
  disabled?: boolean,

  // Optional. Tooltip text (title attribute or equivalent).
  tooltip?: string,

  // Optional. Icon shown in the button.
  iconSrc?: string
}
```

Defaults:
- `variant`: "secondary".
- `disabled`: false.

Validation rules:
- `label` MUST be a non-empty string.
- `actionId` MUST be a non-empty string and MUST start with `${featureKey}.`.
- `actionPayload`, if present, MUST be JSON-serializable.

### legendRow

Use for tier/icon legends and key explanations.

```js
{
  id: string,
  type: "legendRow",

  // Required. Legend entries in display order.
  entries: LegendEntry[],

  // Optional. Layout hint.
  // Default: "stack".
  layout?: "stack" | "grid"
}

{
  // Required. Stable key for the entry.
  key: string,

  // Required. Display label.
  label: string,

  // Optional. Icon shown next to the label.
  iconSrc?: string,

  // Optional. Small descriptive text.
  description?: string,

  // Optional. Token string interpreted by renderer (not raw CSS).
  // Example: "tier-gold", "tier-silver".
  colorToken?: string
}
```

Defaults:
- `layout`: "stack".

Validation rules:
- `entries` MUST be a non-empty array.
- Each entry MUST include `key` and `label` as non-empty strings.

## Renderer requirements (normative)

- Renderer MUST be able to render solely from the payload.
- Renderer MUST NOT depend on existing sidebar DOM content (no querySelector-driven extraction).
- Renderer MUST apply defaults specified in this document.
- Renderer MUST implement the empty handling rules for sections and controls panel.
- Renderer MUST preserve section and item order exactly as given.
- Renderer MUST ignore unknown fields for forward compatibility.
- Renderer MUST reject unknown `type` values for items.

## Feature requirements (normative)

- Features MUST return payload objects conforming to this contract.
- Features MUST NOT:
  - query sidebar DOM
  - mutate sidebar DOM
  - attach event listeners directly to sidebar elements
- Features MAY request actions by emitting `actionButtonRow` items.

## Examples

All examples below are complete payload objects consistent with the schema above.

### Example 1: Pokedex

```js
{
  contractVersion: "v2.0.0-beta",
  featureKey: "pokedex",
  viewKey: "pokedex:selected:001",
  title: "Pokedex",
  subtitle: "Selected entry",
  sections: [
    {
      id: "selected",
      title: "Selected",
      items: [
        { id: "name", type: "textRow", label: "Pokemon", value: "Bulbasaur", rightValue: "#001" },
        { id: "region", type: "textRow", label: "Region", value: "kanto" },
        { id: "tier", type: "textRow", label: "Tier", value: "Tier 2" },
        { id: "rarity", type: "textRow", label: "Rarity", value: "Common" },
        { id: "status", type: "textRow", label: "Status", value: "Unclaimed", muted: true }
      ]
    },
    {
      id: "counts",
      title: "Counts",
      items: [
        { id: "total", type: "statRow", label: "Total shown", value: 151, format: "number" },
        { id: "claimed", type: "statRow", label: "Claimed", value: 86, format: "number" },
        { id: "unclaimed", type: "statRow", label: "Unclaimed", value: 65, format: "number", emphasis: "strong" }
      ]
    }
  ],
  controlsPanel: {
    title: "Controls",
    sections: [
      {
        id: "filters",
        title: "Filters",
        items: [
          {
            id: "toggle-unclaimed",
            type: "actionButtonRow",
            label: "Toggle Unclaimed Only",
            actionId: "pokedex.toggleUnclaimedOnly",
            variant: "secondary"
          },
          {
            id: "toggle-tier",
            type: "actionButtonRow",
            label: "Cycle Tier Filter",
            actionId: "pokedex.cycleTierFilter",
            variant: "secondary"
          }
        ]
      },
      {
        id: "actions",
        title: "Actions",
        items: [
          {
            id: "copy-dex",
            type: "actionButtonRow",
            label: "Copy Dex Number",
            actionId: "pokedex.copyDexNumber",
            actionPayload: { dex: "001" },
            variant: "primary"
          }
        ]
      }
    ]
  }
}
```

### Example 2: Showcase

```js
{
  contractVersion: "v2.0.0-beta",
  featureKey: "showcase",
  viewKey: "showcase:selected:2026-01-05:Bulbasaur",
  title: "Showcase",
  subtitle: "Selected shiny",
  sections: [
    {
      id: "shiny",
      title: "Shiny",
      items: [
        { id: "pokemon", type: "textRow", label: "Pokemon", value: "Bulbasaur" },
        { id: "ot", type: "textRow", label: "OT", value: "MushPlayer" },
        { id: "date", type: "textRow", label: "Date", value: "2026-01-05", monospace: true },
        { id: "method", type: "textRow", label: "Method", value: "single" },
        { id: "encounter", type: "statRow", label: "Encounter", value: 12458, format: "number" }
      ]
    },
    {
      id: "flags",
      title: "Flags",
      items: [
        { id: "alpha", type: "textRow", label: "Alpha", value: "No" },
        { id: "secret", type: "textRow", label: "Secret", value: "No" },
        { id: "lost", type: "textRow", label: "Lost", value: "No" },
        { id: "sold", type: "textRow", label: "Sold", value: "No" }
      ]
    },
    {
      id: "links",
      title: "Links",
      emptyBehavior: "showEmptyState",
      emptyStateText: "No clip available",
      items: [
        {
          id: "clip",
          type: "textRow",
          label: "Clip",
          value: "Watch",
          href: "https://clips.twitch.tv/example",
          openInNewTab: true
        }
      ]
    }
  ],
  controlsPanel: {
    title: "Controls",
    sections: [
      {
        id: "actions",
        items: [
          {
            id: "copy-clip",
            type: "actionButtonRow",
            label: "Copy Clip URL",
            actionId: "showcase.copyClipUrl",
            actionPayload: { url: "https://clips.twitch.tv/example" },
            variant: "primary",
            disabled: false
          },
          {
            id: "toggle-secret",
            type: "actionButtonRow",
            label: "Toggle Secret Visibility",
            actionId: "showcase.toggleSecretVisibility",
            variant: "secondary"
          }
        ]
      }
    ]
  }
}
```

### Example 3: ShinyWeekly

```js
{
  contractVersion: "v2.0.0-beta",
  featureKey: "shinyWeekly",
  viewKey: "shinyWeekly:week:2026-W01",
  title: "ShinyWeekly",
  subtitle: "Week summary",
  sections: [
    {
      id: "week",
      title: "Week",
      items: [
        { id: "label", type: "textRow", label: "Label", value: "Week 01 (2026)" },
        { id: "range", type: "textRow", label: "Range", value: "2026-01-01 to 2026-01-07", monospace: true },
        { id: "total", type: "statRow", label: "Total shinies", value: 12, format: "number", emphasis: "strong" }
      ]
    },
    {
      id: "leaders",
      title: "Leaders",
      emptyBehavior: "showEmptyState",
      emptyStateText: "No entries",
      items: [
        { id: "top-ot", type: "textRow", label: "Top OT", value: "MushPlayer", rightValue: "5" },
        { id: "top-method", type: "textRow", label: "Top method", value: "swarm", rightValue: "4" }
      ]
    }
  ],
  controlsPanel: {
    title: "Controls",
    sections: [
      {
        id: "nav",
        items: [
          { id: "prev", type: "actionButtonRow", label: "Previous Week", actionId: "shinyWeekly.prevWeek", variant: "secondary" },
          { id: "next", type: "actionButtonRow", label: "Next Week", actionId: "shinyWeekly.nextWeek", variant: "secondary", disabled: true, tooltip: "No next week available" }
        ]
      },
      {
        id: "copy",
        items: [
          {
            id: "copy-summary",
            type: "actionButtonRow",
            label: "Copy Week Summary",
            actionId: "shinyWeekly.copySummary",
            actionPayload: {
              week: "2026-W01",
              label: "Week 01 (2026)",
              total: 12
            },
            variant: "primary"
          }
        ]
      }
    ]
  }
}
```

### Example 4: Donators (future-only; not implemented)

This example is future-only and explicitly not implemented yet. It exists to lock the contract for totals, a copy action, and a tier legend.

```js
{
  contractVersion: "v2.0.0-beta",
  featureKey: "donators",
  viewKey: "donators:summary:future",
  title: "Donators",
  subtitle: "Totals",
  sections: [
    {
      id: "totals",
      title: "Totals",
      items: [
        { id: "total-donated", type: "statRow", label: "Total donated", value: 123456789, format: "number", emphasis: "strong" },
        { id: "total-donors", type: "statRow", label: "Total donors", value: 256, format: "number" }
      ]
    },
    {
      id: "tiers",
      title: "Tiers",
      items: [
        {
          id: "tier-legend",
          type: "legendRow",
          layout: "stack",
          entries: [
            { key: "top", label: "Top Donator", description: "Top overall donator.", iconSrc: "img/symbols/topdonatorsprite.png", colorToken: "tier-top" },
            { key: "diamond", label: "Diamond", description: "50,000,000+ total donated.", iconSrc: "img/symbols/diamonddonatorsprite.png", colorToken: "tier-diamond" },
            { key: "platinum", label: "Platinum", description: "25,000,000+ total donated.", iconSrc: "img/symbols/platinumdonatorsprite.png", colorToken: "tier-platinum" },
            { key: "gold", label: "Gold", description: "10,000,000+ total donated.", iconSrc: "img/symbols/golddonatorsprite.png", colorToken: "tier-gold" },
            { key: "silver", label: "Silver", description: "5,000,000+ total donated.", iconSrc: "img/symbols/silverdonatorsprite.png", colorToken: "tier-silver" },
            { key: "bronze", label: "Bronze", description: "1,000,000+ total donated.", iconSrc: "img/symbols/bronzedonatorsprite.png", colorToken: "tier-bronze" },
            { key: "none", label: "Supporter", description: "Below 1,000,000 total donated.", colorToken: "tier-none" }
          ]
        }
      ]
    }
  ],
  controlsPanel: {
    title: "Controls",
    sections: [
      {
        id: "actions",
        items: [
          {
            id: "copy-totals",
            type: "actionButtonRow",
            label: "Copy Totals",
            actionId: "donators.copyTotals",
            actionPayload: {
              totalDonated: 123456789,
              totalDonors: 256
            },
            variant: "primary"
          }
        ]
      }
    ]
  }
}
```
