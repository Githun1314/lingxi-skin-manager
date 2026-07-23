# Changelog

All notable changes to this project are documented here.

## [0.7.2] - 2026-07-23

- Fixed Windows discovery so it targets only the standalone WPS Lingxi desktop client.
- Removed WPS Office plugin directories and `wpslingxi.exe` from automatic discovery.
- Added an explicit rejection message when `LINGXI_APP_PATH` points to the Office plugin.
- Updated Windows tests and distribution guidance to distinguish the standalone client from the Office plugin.

## [0.7.1] - 2026-07-23

- Added a self-contained Windows x64 EXE with the runtime and all theme assets embedded.
- Added automatic browser opening and no-console double-click startup behavior.
- Added a Windows cloud build that launches the generated EXE and verifies its embedded interface before publishing it.
- Added SHA256 generation for Windows release verification.

## [0.7.0] - 2026-07-23

- Added a standalone Windows x64 preview package that automatically downloads and verifies the official Node.js runtime on first launch.
- Added automatic discovery for common WPS Lingxi Windows installation paths.
- Added Windows-specific process restart and connection handling.
- Added personalized Windows desktop and Start menu shortcuts with generated icons.
- Added platform-aware interface copy and Windows installation documentation.

## [0.6.4] - 2026-07-23

- Removed the native outline underneath the conversation area's rounded corner.
- Reduced the sidebar-to-content junction to one clipping layer instead of stacked rounded backgrounds.

## [0.6.3] - 2026-07-23

- Made the conversation area's top-left corner follow each skin's configured radius.
- Unified clipping across the nested content layers to remove the exposed sidebar wedge.
- Updated the manager preview to match the corrected corner treatment.

## [0.6.2] - 2026-07-22

- Added a second 金小獴 theme with a crawling, peeking pose.
- Added a second WPS 小表姐 theme with a wink and thumbs-up pose.
- Replaced the simplified 小表姐 logo with a complete character portrait.
- Unified WPS preset cards around a right-aligned character composition.
- Fixed the peeking mascot baseline so its forearms overlap the composer naturally.

## [0.6.1] - 2026-07-22

- Fixed the square outer layer exposed around the composer in dark mode.
- Added independent light and dark palettes for every preset.
- Made the expert-mode icon and primary actions follow the selected accent color.

## [0.6.0] - 2026-07-22

- Rebuilt the preview against the real WPS 灵犀 layout.
- Added dynamic composer-edge decorations.
- Added background templates, focus, overlay and blur controls.
- Added brand identity replacement across startup, sidebar and conversation states.
- Added optional custom-name memory synchronization and personalized app launchers.
