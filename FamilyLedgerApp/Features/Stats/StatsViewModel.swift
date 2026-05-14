import Foundation

@MainActor
final class StatsViewModel: ObservableObject {
    @Published var month = Date()
    @Published var stats = MonthlyStats(monthKey: "", incomeTotal: 0, expenseTotal: 0, byCategory: [:], byMember: [:])
    @Published var categories: [Category] = []
    @Published var members: [Member] = []

    private let repository: LedgerRepository
    private let book: FamilyBook
    private let statsService = StatsService()

    init(repository: LedgerRepository, book: FamilyBook) {
        self.repository = repository
        self.book = book
    }

    func refresh() async {
        categories = (try? await repository.loadCategories(bookId: book.id)) ?? []
        members = (try? await repository.loadMembers(bookId: book.id)) ?? []
        let tx = (try? await repository.loadTransactions(bookId: book.id, filter: TransactionFilter())) ?? []
        stats = statsService.monthlyStats(month: month, transactions: tx)
    }
}
