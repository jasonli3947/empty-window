import SwiftUI

struct CategoryListView: View {
    @StateObject var viewModel: CategoryListViewModel
    @State private var newName = ""
    @State private var selectedType: EntryType = .expense

    var body: some View {
        NavigationStack {
            List {
                Section("新增分类") {
                    TextField("分类名称", text: $newName)
                    Picker("类型", selection: $selectedType) {
                        Text("支出").tag(EntryType.expense)
                        Text("收入").tag(EntryType.income)
                    }
                    Button("添加") {
                        guard !newName.isEmpty else { return }
                        Task {
                            await viewModel.add(name: newName, type: selectedType)
                            newName = ""
                        }
                    }
                }

                Section("已有分类") {
                    ForEach(viewModel.categories) { category in
                        HStack {
                            Text(category.name)
                            Spacer()
                            Text(category.type == .expense ? "支出" : "收入")
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .navigationTitle("分类")
            .task { await viewModel.load() }
        }
    }
}
