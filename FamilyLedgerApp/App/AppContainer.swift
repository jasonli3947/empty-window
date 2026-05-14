import CloudKit
import Foundation

final class AppContainer: ObservableObject {
    let repository: LedgerRepository
    let syncService: SyncService

    @Published var currentBook: FamilyBook?
    @Published var currentMember: Member?

    init(repository: LedgerRepository, syncService: SyncService) {
        self.repository = repository
        self.syncService = syncService
    }

    static func bootstrap() -> AppContainer {
        let cloudStore = CloudKitStore(container: CKContainer(identifier: Config.iCloudContainerId))
        let localStore = InMemoryLocalStore()
        let repository = DefaultLedgerRepository(cloudStore: cloudStore, localStore: localStore)
        let syncService = SyncService(repository: repository)
        return AppContainer(repository: repository, syncService: syncService)
    }
}

enum Config {
    static let iCloudContainerId = "iCloud.com.example.familyledger"
}
