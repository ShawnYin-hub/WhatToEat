// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "WhatToEatToday",
    platforms: [.macOS(.v13), .iOS(.v16)],
    products: [
        .executable(name: "WhatToEatToday", targets: ["WhatToEatToday"])
    ],
    dependencies: [
        .package(url: "https://github.com/TokamakUI/Tokamak", from: "0.11.0"),
        .package(url: "https://github.com/swiftwasm/carton", from: "1.0.0")
    ],
    targets: [
        .executableTarget(
            name: "WhatToEatToday",
            dependencies: [
                .product(name: "TokamakShim", package: "Tokamak")
            ],
            path: "ios/Sources/WhatToEatToday"
        )
    ]
)
