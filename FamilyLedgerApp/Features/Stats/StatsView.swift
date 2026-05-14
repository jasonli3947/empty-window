import Charts
import SwiftUI

struct StatsView: View {
    @StateObject var viewModel: StatsViewModel

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    DatePicker("月份", selection: $viewModel.month, displayedComponents: .date)
                        .onChange(of: viewModel.month) { _, _ in
                            Task { await viewModel.refresh() }
                        }

                    VStack(alignment: .leading) {
                        Text("月度总览").font(.headline)
                        Text("收入: \(viewModel.stats.incomeTotal as NSDecimalNumber)")
                        Text("支出: \(viewModel.stats.expenseTotal as NSDecimalNumber)")
                        Text("结余: \((viewModel.stats.incomeTotal - viewModel.stats.expenseTotal) as NSDecimalNumber)")
                    }

                    VStack(alignment: .leading) {
                        Text("按分类支出").font(.headline)
                        Chart(categoryRows, id: \.name) { row in
                            SectorMark(angle: .value("金额", row.amount))
                                .foregroundStyle(by: .value("分类", row.name))
                        }
                        .frame(height: 240)
                    }

                    VStack(alignment: .leading) {
                        Text("按成员记账金额").font(.headline)
                        Chart(memberRows, id: \.name) { row in
                            BarMark(x: .value("成员", row.name), y: .value("金额", row.amount))
                        }
                        .frame(height: 220)
                    }
                }
                .padding()
            }
            .navigationTitle("统计")
            .task { await viewModel.refresh() }
        }
    }

    private var categoryRows: [(name: String, amount: Double)] {
        viewModel.stats.byCategory.compactMap { key, value in
            guard let category = viewModel.categories.first(where: { $0.id == key }) else { return nil }
            return (category.name, (value as NSDecimalNumber).doubleValue)
        }
    }

    private var memberRows: [(name: String, amount: Double)] {
        viewModel.stats.byMember.compactMap { key, value in
            guard let member = viewModel.members.first(where: { $0.id == key }) else { return nil }
            return (member.displayName, (value as NSDecimalNumber).doubleValue)
        }
    }
}
