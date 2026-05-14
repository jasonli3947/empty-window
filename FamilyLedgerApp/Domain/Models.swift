import Foundation

enum EntryType: String, Codable, CaseIterable {
    case expense
    case income
}

enum MemberRole: String, Codable {
    case owner
    case member
}

struct FamilyBook: Identifiable, Codable, Equatable {
    let id: UUID
    var name: String
    let ownerUserId: String
    let createdAt: Date
}

struct Member: Identifiable, Codable, Equatable {
    let id: UUID
    let familyBookId: UUID
    let userRecordId: String
    var displayName: String
    let role: MemberRole
    let joinedAt: Date
}

struct Category: Identifiable, Codable, Equatable {
    let id: UUID
    let familyBookId: UUID
    var name: String
    let type: EntryType
    var icon: String
    var colorHex: String
    var isSystem: Bool
}

struct Transaction: Identifiable, Codable, Equatable {
    let id: UUID
    let familyBookId: UUID
    var amount: Decimal
    let type: EntryType
    var categoryId: UUID
    var occurredAt: Date
    var note: String
    let createdByMemberId: UUID
    var updatedAt: Date
    var isDeleted: Bool
}

struct TransactionFilter {
    var memberId: UUID?
    var categoryId: UUID?
    var startDate: Date?
    var endDate: Date?
}

struct MonthlyStats: Equatable {
    let monthKey: String
    let incomeTotal: Decimal
    let expenseTotal: Decimal
    let byCategory: [UUID: Decimal]
    let byMember: [UUID: Decimal]
}
