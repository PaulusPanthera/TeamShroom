<!-- docs/sidebar-payload-contract.md -->
<!-- v2.0.0-beta -->
<!-- Current sidebar controller contract used by runtime features -->

# Sidebar controller contract

This document describes the **current runtime sidebar API** exposed by `src/app/sidebar.js`.

It is not a pure JSON payload system.

## Ownership model

The shell owns the sidebar slots:
- title
- hint
- controls container

Features receive a controller created by `createSidebarController(page)` and populate those shell-owned slots.

## Current feature-facing API

The controller currently exposes:

```js
{
  titleEl,
  hintEl,
  controlsEl,

  clear(),
  setTitle(text),
  setHint(text),
  setSections(sections),
  appendSection(label, node)
}
```

## Section shape

`setSections()` expects an array of objects in this shape:

```js
[
  {
    label: string,
    node: Element
  }
]
```

Behavior:
- existing sidebar sections are cleared first
- each section is rendered as a shell-owned wrapper
- `label` becomes the sidebar section label
- `node` is appended inside that wrapper

Invalid or missing entries are skipped.

## Practical rules for feature code

Features may:
- create their own DOM nodes for sidebar content
- attach listeners to the nodes they create
- replace all sidebar sections through `setSections()`
- append an extra section through `appendSection()`
- update title and hint text through the controller

Features should not:
- scrape existing sidebar markup
- depend on previous route sidebar DOM still existing
- reach outside the shell-owned sidebar slots

## Defaults

When a controller is created for a page, it resets sidebar state to page defaults:
- title defaults by page key
- hint defaults by page key
- controls container is cleared

Current page defaults live in `src/app/sidebar.js`.

## Why this doc exists

Older notes described a stricter payload-only sidebar contract.
That is **not** the current runtime implementation.

Use this document as the maintenance reference until the sidebar system changes again.
