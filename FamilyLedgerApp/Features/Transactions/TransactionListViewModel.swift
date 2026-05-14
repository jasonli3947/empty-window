import Foundation

@MainActor
final class TransactionListViewModel: ObservableObject {
    @Published var transactions: [Transaction] = []
    @Published var categories: [Category] = []
    @Published var members: [Member] = []
    @Published var filter = TransactionFilter()

    private let repository: LedgerRepository
    private let book: FamilyBook

    init(repository: LedgerRepository, book: FamilyBook) {
        self.repository = repository
        self.book = book
    }

    func load() async {
        do {
            categories = try await repository.loadCategories(bookId: book.id)
            members = try await repository.loadMembers(bookId: book.id)
            transactions = try await repository.loadTransactions(bookId: book.id, filter: filter)
        } catch {
            transactions = []
        }
    }

    func saveTransaction(amount: Decimal, type: EntryType, categoryId: UUID, note: String, memberId: UUID, date: Date) async {
        let item = Transaction(
            id: UUID(),
            familyBookId: book.id,
            amount: amount,
            type: type,
            categoryId: categoryId,
            occurredAt: date,
            note: note,
            createdByMemberId: memberId,
            updatedAt: Date(),
            isDeleted: false
        )
        try? await repository.saveTransaction(item)
        await load()
    }

    func delete(_ id: UUID) async {
        try? await repository.softDeleteTransaction(id: id, bookId: book.id, at: Date())
        await load()
    }
}
