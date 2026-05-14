import CloudKit
import Foundation

final class DefaultLedgerRepository: LedgerRepository {
    private let cloudStore: CloudKitStore
    private let localStore: LocalStore

    init(cloudStore: CloudKitStore, localStore: LocalStore) {
        self.cloudStore = cloudStore
        self.localStore = localStore
    }

    func bootstrapBook(ownerUserRecord: String, ownerName: String) async throws -> (FamilyBook, Member) {
        let now = Date()
        let book = FamilyBook(id: UUID(), name: "我的家庭账本", ownerUserId: ownerUserRecord, createdAt: now)
        let member = Member(id: UUID(), familyBookId: book.id, userRecordId: ownerUserRecord, displayName: ownerName, role: .owner, joinedAt: now)
        await localStore.saveMembers([member], bookId: book.id)
        await localStore.saveCategories(defaultCategories(bookId: book.id), bookId: book.id)
        return (book, member)
    }

    func inviteShare(for book: FamilyBook) async throws -> URL {
        let root = CKRecord(recordType: "FamilyBook", recordID: CKRecord.ID(recordName: book.id.uuidString))
        root["name"] = book.name as CKRecordValue
        let (share, _) = try await cloudStore.createShare(for: root)
        guard let url = share.url else { throw NSError(domain: "ShareError", code: -1) }
        return url
    }

    func acceptShare(url: URL) async throws -> FamilyBook {
        _ = url
        return FamilyBook(id: UUID(), name: "共享家庭账本", ownerUserId: "owner", createdAt: Date())
    }

    func loadCategories(bookId: UUID) async throws -> [Category] {
        await localStore.loadCategories(bookId: bookId)
    }

    func saveCategory(_ category: Category) async throws {
        var values = await localStore.loadCategories(bookId: category.familyBookId)
        if let index = values.firstIndex(where: { $0.id == category.id }) {
            values[index] = category
        } else {
            values.append(category)
        }
        await localStore.saveCategories(values, bookId: category.familyBookId)
    }

    func loadTransactions(bookId: UUID, filter: TransactionFilter) async throws -> [Transaction] {
        let values = await localStore.loadTransactions(bookId: bookId)
        return values.filter { item in
            guard !item.isDeleted else { return false }
            if let memberId = filter.memberId, item.createdByMemberId != memberId { return false }
            if let categoryId = filter.categoryId, item.categoryId != categoryId { return false }
            if let start = filter.startDate, item.occurredAt < start { return false }
            if let end = filter.endDate, item.occurredAt > end { return false }
            return true
        }.sorted { $0.occurredAt > $1.occurredAt }
    }

    func saveTransaction(_ transaction: Transaction) async throws {
        var values = await localStore.loadTransactions(bookId: transaction.familyBookId)
        if let index = values.firstIndex(where: { $0.id == transaction.id }) {
            values[index] = mergeTransaction(local: values[index], remote: transaction)
        } else {
            values.append(transaction)
        }
        await localStore.saveTransactions(values, bookId: transaction.familyBookId)
    }

    func softDeleteTransaction(id: UUID, bookId: UUID, at date: Date) async throws {
        var values = await localStore.loadTransactions(bookId: bookId)
        guard let index = values.firstIndex(where: { $0.id == id }) else { return }
        values[index].isDeleted = true
        values[index].updatedAt = date
        await localStore.saveTransactions(values, bookId: bookId)
    }

    func loadMembers(bookId: UUID) async throws -> [Member] {
        await localStore.loadMembers(bookId: bookId)
    }

    func refreshFromCloud(bookId: UUID) async throws {
        _ = bookId
        // Placeholder: add CKQuery / CKFetchRecordZoneChanges in production.
    }

    private func defaultCategories(bookId: UUID) -> [Category] {
        [
            Category(id: UUID(), familyBookId: bookId, name: "餐饮", type: .expense, icon: "fork.knife", colorHex: "#FF9500", isSystem: true),
            Category(id: UUID(), familyBookId: bookId, name: "交通", type: .expense, icon: "car.fill", colorHex: "#007AFF", isSystem: true),
            Category(id: UUID(), familyBookId: bookId, name: "工资", type: .income, icon: "banknote.fill", colorHex: "#34C759", isSystem: true)
        ]
    }

    private func mergeTransaction(local: Transaction, remote: Transaction) -> Transaction {
        remote.updatedAt >= local.updatedAt ? remote : local
    }
}
