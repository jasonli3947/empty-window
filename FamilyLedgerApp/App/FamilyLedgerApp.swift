import SwiftUI

@main
struct FamilyLedgerApp: App {
    @StateObject private var appContainer = AppContainer.bootstrap()

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .environmentObject(appContainer)
        }
    }
}
