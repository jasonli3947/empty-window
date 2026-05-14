import Foundation
import XCTest
@testable import FamilyLedgerApp

final class StatsServiceTests: XCTestCase {
    func testMonthlyStatsAggregatesIncomeExpenseCategoryMember() {
        let memberA = UUID()
        let memberB = UUID()
        let categoryFood = UUID()
        let categorySalary = UUID()
        let bookId = UUID()
        let month = Date()
        let service = StatsService()

        let tx: [Transaction] = [
            Transaction(id: UUID(), familyBookId: bookId, amount: 100, type: .expense, categoryId: categoryFood, occurredAt: month, note: "", createdByMemberId: memberA, updatedAt: month, isDeleted: false),
            Transaction(id: UUID(), familyBookId: bookId, amount: 1000, type: .income, categoryId: categorySalary, occurredAt: month, note: "", createdByMemberId: memberB, updatedAt: month, isDeleted: false)
        ]

        let result = service.monthlyStats(month: month, transactions: tx)
        XCTAssertEqual(result.expenseTotal, 100)
        XCTAssertEqual(result.incomeTotal, 1000)
        XCTAssertEqual(result.byCategory[categoryFood], 100)
        XCTAssertEqual(result.byMember[memberA], 100)
        XCTAssertEqual(result.byMember[memberB], 1000)
    }
}
