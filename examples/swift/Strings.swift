// Generated.
import Foundation

class Strings {
    static var locale: String? = nil {
        didSet {
            if let dir = Bundle.main.path(forResource: locale, ofType: "lproj"), let bundle = Bundle(path: dir) {
                self.bundle = bundle
            } else {
                self.bundle = Bundle.main
            }
        }
    }

    static var bundle: Bundle = Bundle.main

    fileprivate static func string(for key: String) -> String {
        return bundle.localizedString(forKey: key, value: nil, table: nil)
    }

    fileprivate static func stringArray(for key: String, length: Int) -> [String] {
        return (0..<length).map {
            bundle.localizedString(forKey: "\(key)_\($0)", value: nil, table: nil)
        }
    }

    /** This is a string. */
    static var firstItem: String {
        return string(for: "firstItem")
    }

    /** I have {number} cats. */
    static func anotherItem(number number: String) -> String {
        let format = string(for: "anotherItem")
        return String(format: format, number)
    }

    private init() {}
}
