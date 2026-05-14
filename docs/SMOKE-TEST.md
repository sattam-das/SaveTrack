# SaveTrack Smoke Test Checklist

Use this checklist on a clean Windows machine or VM after installing the MSI or NSIS installer.

## Pre-Install
- Confirm no previous SaveTrack install exists.
- Choose installer:
  - MSI: `SaveTrack_0.1.0_x64_en-US.msi`
  - NSIS: `SaveTrack_0.1.0_x64-setup.exe`

## Install and Launch
- Install completes without warnings.
- App launches from Start Menu or desktop shortcut.
- App opens without console or crash dialogs.

## Dashboard
- Total saved shows $0.00 on first run.
- Recent Logs list shows empty state message.
- Growth chart renders (all zeroes is OK).
- Daily streak shows 0 days.
- Weekly target card shows $0.00 / $0.00.
- No "Haven't logged today" banner in production build (dev-only).

## Logging
- Open Log Savings modal.
- Add entry with amount, note, and source.
- Save entry closes modal and updates dashboard total.
- Recent Logs shows the new entry.

## Goals
- Create a goal with amount and deadline.
- Deadline displays on goal card.
- "X days left" badge appears when deadline is within 30 days.
- Add funds to the goal; progress bar updates.
- Mark goal complete by adding enough funds; goal moves to Archived section.
- Completed goals cannot add more funds.

## Analytics
- Lifetime stats update after entries exist.
- History chart updates and timeframe switch works.
- Monthly breakdown table shows rows.
- Income source breakdown shows totals per source.

## Settings
- Change currency and Save; values update across UI.
- Export data downloads JSON file.
- Wipe data resets totals, goals, and logs.

## Persistence
- Close app, reopen.
- Data persists (entries, goals, settings).

## Installer Uninstall
- Uninstall completes without errors.
- App files removed.

## Notes
- App data path is tied to identifier `com.savetrack.desktop`.
