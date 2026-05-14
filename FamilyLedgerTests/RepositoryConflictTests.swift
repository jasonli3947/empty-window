import CloudKit
import Foundation
import XCTest
@testable import FamilyLedgerApp

final class RepositoryConflictTests: XCTestCase {
    func testLastWriteWinsWhenRemoteNewer() async throws {
        let cloud = CloudKitStore(container: CKContainer.default())
        let local = InMemoryLocalStore()
        let repo = DefaultLedgerRepository(cloudStore: cloud, localStore: local)
        let bookId = UUID()
        let memberId = UUID()
        let categoryId = UUID()
        let id = UUID()
        let old = Date(timeIntervalSince1970: 10)
        let new = Date(timeIntervalSince1970: 20)

        let localTx = Transaction(id: id, familyBookId: bookId, amount: 20, type: .expense, categoryId: categoryId, occurredAt: old, note: "old", createdByMemberId: memberId, updatedAt: old, isDeleted: false)
        let remoteTx = Transaction(id: id, familyBookId: bookId, amount: 30, type: .expense, categoryId: categoryId, occurredAt: new, note: "new", createdByMemberId: memberId, updatedAt: new, isDeleted: false)

        try await repo.saveTransaction(localTx)
        try await repo.saveTransaction(remoteTx)

        let list = try await repo.loadTransactions(bookId: bookId, filter: TransactionFilter())
        XCTAssertEqual(list.first?.amount, 30)
        XCTAssertEqual(list.first?.note, "new")
    }
}
