import Foundation

actor InMemoryLocalStore: LocalStore {
    private var categoriesByBook: [UUID: [Category]] = [:]
    private var transactionsByBook: [UUID: [Transaction]] = [:]
    private var membersByBook: [UUID: [Member]] = [:]

    func loadCategories(bookId: UUID) async -> [Category] {
        categoriesByBook[bookId, default: []]
    }

    func saveCategories(_ values: [Category], bookId: UUID) async {
        categoriesByBook[bookId] = values
    }

    func loadTransactions(bookId: UUID) async -> [Transaction] {
        transactionsByBook[bookId, default: []]
    }

    func saveTransactions(_ values: [Transaction], bookId: UUID) async {
        transactionsByBook[bookId] = values
    }

    func loadMembers(bookId: UUID) async -> [Member] {
        membersByBook[bookId, default: []]
    }

    func saveMembers(_ values: [Member], bookId: UUID) async {
        membersByBook[bookId] = values
    }
}
