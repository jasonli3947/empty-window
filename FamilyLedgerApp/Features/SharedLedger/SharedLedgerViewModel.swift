import Foundation

@MainActor
final class SharedLedgerViewModel: ObservableObject {
    @Published var shareURL: URL?
    @Published var inviteError: String?
    @Published var isInviting = false

    private let repository: LedgerRepository
    private let book: FamilyBook

    init(repository: LedgerRepository, book: FamilyBook) {
        self.repository = repository
        self.book = book
    }

    func createInvite() async {
        isInviting = true
        defer { isInviting = false }
        do {
            shareURL = try await repository.inviteShare(for: book)
        } catch {
            inviteError = error.localizedDescription
        }
    }
}
