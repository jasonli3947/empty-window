import SwiftUI

struct SharedLedgerView: View {
    @StateObject var viewModel: SharedLedgerViewModel

    var body: some View {
        Form {
            Section("家庭账本共享") {
                Button("生成邀请链接") {
                    Task { await viewModel.createInvite() }
                }
                .disabled(viewModel.isInviting)

                if let url = viewModel.shareURL {
                    ShareLink(item: url) {
                        Label("分享给家人", systemImage: "square.and.arrow.up")
                    }
                }
                if let inviteError = viewModel.inviteError {
                    Text(inviteError).foregroundStyle(.red)
                }
            }
        }
        .navigationTitle("共享")
    }
}
