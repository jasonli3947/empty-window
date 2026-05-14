# Family Ledger iOS MVP

An iOS-first family bookkeeping app MVP for two members sharing one family account with CloudKit sync, ownership attribution, categories, and charts.

## Stack

- SwiftUI + MVVM
- CloudKit (`CKShare`) for family ledger sharing
- SwiftData-compatible local cache abstraction (in-memory fallback for tests)
- Apple Charts for analytics

## Project Layout

- `FamilyLedgerApp/` app source
- `FamilyLedgerTests/` unit tests for statistics and conflict resolution
- `project.yml` XcodeGen spec (optional helper to generate `.xcodeproj`)

## Notes

- You must enable iCloud + CloudKit capability in Xcode with your own container id.
- Current `Config.iCloudContainerId` is a placeholder and should be replaced.
