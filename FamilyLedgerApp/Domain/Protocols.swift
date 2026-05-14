import Foundation

protocol LedgerRepository {
    func bootstrapBook(ownerUserRecord: String, ownerName: String) async throws -> (FamilyBook, Member)
    func inviteShare(for book: FamilyBook) async throws -> URL
    func acceptShare(url: URL) async throws -> FamilyBook

    func loadCategories(bookId: UUID) async throws -> [Category]
    func saveCategory(_ category: Category) async throws

    func loadTransactions(bookId: UUID, filter: TransactionFilter) async throws -> [Transaction]
    func saveTransaction(_ transaction: Transaction) async throws
    func softDeleteTransaction(id: UUID, bookId: UUID, at date: Date) async throws

    func loadMembers(bookId: UUID) async throws -> [Member]
    func refreshFromCloud(bookId: UUID) async throws
}

protocol LocalStore {
    func loadCategories(bookId: UUID) async -> [Category]
    func saveCategories(_ values: [Category], bookId: UUID) async

    func loadTransactions(bookId: UUID) async -> [Transaction]
    func saveTransactions(_ values: [Transaction], bookId: UUID) async

    func loadMembers(bookId: UUID) async -> [Member]
    func saveMembers(_ values: [Member], bookId: UUID) async
}
