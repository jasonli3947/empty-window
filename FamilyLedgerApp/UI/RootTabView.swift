import SwiftUI

struct RootTabView: View {
    @EnvironmentObject private var app: AppContainer
    @State private var bootstrapError: String?

    var body: some View {
        Group {
            if let book = app.currentBook {
                TabView {
                    TransactionListView(viewModel: TransactionListViewModel(repository: app.repository, book: book))
                        .tabItem { Label("记账", systemImage: "list.bullet.rectangle") }
                    CategoryListView(viewModel: CategoryListViewModel(repository: app.repository, book: book))
                        .tabItem { Label("分类", systemImage: "square.grid.2x2") }
                    StatsView(viewModel: StatsViewModel(repository: app.repository, book: book))
                        .tabItem { Label("图表", systemImage: "chart.pie.fill") }
                    SharedLedgerView(viewModel: SharedLedgerViewModel(repository: app.repository, book: book))
                        .tabItem { Label("共享", systemImage: "person.2.fill") }
                }
            } else {
                ContentUnavailableView("正在初始化家庭账本", systemImage: "tray")
                    .task { await bootstrapIfNeeded() }
            }
        }
        .alert("初始化失败", isPresented: .constant(bootstrapError != nil), presenting: bootstrapError) { _ in
            Button("重试") {
                bootstrapError = nil
                Task { await bootstrapIfNeeded() }
            }
        } message: { error in
            Text(error)
        }
    }

    private func bootstrapIfNeeded() async {
        guard app.currentBook == nil else { return }
        do {
            let (book, member) = try await app.repository.bootstrapBook(ownerUserRecord: "local-user", ownerName: "我")
            app.currentBook = book
            app.currentMember = member
        } catch {
            bootstrapError = error.localizedDescription
        }
    }
}
