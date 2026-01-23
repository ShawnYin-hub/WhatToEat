import TokamakShim

@main
struct WhatToEatTodayApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct ContentView: View {
    var body: some View {
        VStack {
            Text("What To Eat Today")
                .font(.largeTitle)
                .padding()
        }
    }
}
