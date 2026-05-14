import Foundation

@MainActor
final class CategoryListViewModel: ObservableObject {
    @Published var categories: [Category] = []

    private let repository: LedgerRepository
    private let book: FamilyBook

    init(repository: LedgerRepository, book: FamilyBook) {
        self.repository = repository
        self.book = book
    }

    func load() async {
        categories = (try? await repository.loadCategories(bookId: book.id)) ?? []
    }

    func add(name: String, type: EntryType) async {
        let category = Category(
            id: UUID(),
            familyBookId: book.id,
            name: name,
            type: type,
            icon: "tag.fill",
            colorHex: "#5856D6",
            isSystem: false
        )
        try? await repository.saveCategory(category)
        await load()
    }
}
