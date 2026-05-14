import Foundation

struct StatsService {
    func monthlyStats(month: Date, transactions: [Transaction]) -> MonthlyStats {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM"
        let key = formatter.string(from: month)

        var income: Decimal = 0
        var expense: Decimal = 0
        var byCategory: [UUID: Decimal] = [:]
        var byMember: [UUID: Decimal] = [:]
        let calendar = Calendar.current

        for item in transactions where calendar.isDate(item.occurredAt, equalTo: month, toGranularity: .month) {
            if item.type == .income {
                income += item.amount
            } else {
                expense += item.amount
                byCategory[item.categoryId, default: 0] += item.amount
            }
            byMember[item.createdByMemberId, default: 0] += item.amount
        }

        return MonthlyStats(monthKey: key, incomeTotal: income, expenseTotal: expense, byCategory: byCategory, byMember: byMember)
    }
}
