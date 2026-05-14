import Foundation

final class SyncService {
    private let repository: LedgerRepository

    init(repository: LedgerRepository) {
        self.repository = repository
    }

    func sync(bookId: UUID) async {
        do {
            try await repository.refreshFromCloud(bookId: bookId)
        } catch {
            // Best-effort sync: app remains usable offline.
        }
    }
}
