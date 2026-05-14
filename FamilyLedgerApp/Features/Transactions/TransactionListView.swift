import SwiftUI

struct TransactionListView: View {
    @StateObject var viewModel: TransactionListViewModel
    @State private var amountText = ""
    @State private var note = ""
    @State private var selectedType: EntryType = .expense
    @State private var selectedCategoryId: UUID?
    @State private var selectedMemberId: UUID?
    @State private var selectedDate = Date()

    var body: some View {
        NavigationStack {
            List {
                Section("新增账目") {
                    Picker("类型", selection: $selectedType) {
                        Text("支出").tag(EntryType.expense)
                        Text("收入").tag(EntryType.income)
                    }
                    TextField("金额", text: $amountText)
                        .keyboardType(.decimalPad)
                    Picker("分类", selection: $selectedCategoryId) {
                        Text("请选择").tag(UUID?.none)
                        ForEach(viewModel.categories.filter { $0.type == selectedType }) { category in
                            Text(category.name).tag(Optional(category.id))
                        }
                    }
                    Picker("记录人", selection: $selectedMemberId) {
                        Text("请选择").tag(UUID?.none)
                        ForEach(viewModel.members) { member in
                            Text(member.displayName).tag(Optional(member.id))
                        }
                    }
                    DatePicker("日期", selection: $selectedDate, displayedComponents: .date)
                    TextField("备注", text: $note)
                    Button("保存") {
                        Task { await submit() }
                    }
                }

                Section("账目列表") {
                    ForEach(viewModel.transactions) { item in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(item.note.isEmpty ? "无备注" : item.note).font(.headline)
                            Text("\(item.occurredAt.formatted(date: .abbreviated, time: .omitted)) · \(item.type == .expense ? "支出" : "收入")")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .swipeActions {
                            Button(role: .destructive) {
                                Task { await viewModel.delete(item.id) }
                            } label: {
                                Text("删除")
                            }
                        }
                    }
                }
            }
            .navigationTitle("记账")
            .task { await viewModel.load() }
        }
    }

    private func submit() async {
        guard
            let amount = Decimal(string: amountText),
            let categoryId = selectedCategoryId,
            let memberId = selectedMemberId
        else { return }

        await viewModel.saveTransaction(
            amount: amount,
            type: selectedType,
            categoryId: categoryId,
            note: note,
            memberId: memberId,
            date: selectedDate
        )
        amountText = ""
        note = ""
    }
}
