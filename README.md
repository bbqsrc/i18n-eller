# strut-icu

Localisation tooling that is awesome and easy to use, using ICU formatting for plurals and other nightmarish aspects of localisation.

## Installation

The tools are not yet on npm, so in the mean time, you can install from github:

```
npm i -g bbqsrc/strut-icu
```

## Tools

### strut-icu-generate

Generates target output (ie iOS, Android, etc) from YAML source files. Automatically handles converting ICU entities to platform-supported entities.

Provides a type-safe singleton on each platform for accessing strings by key, generated from the YAML files. See `examples/` for an example for each platform.

#### Supported generator platforms

- objc: Objective C output
- swift: Swift output
- android: Android String XML output

### strut-icu-validate

Validates and formats the YAML files. Detects perfect duplicates, and supports using fuzzy matching to find strings that are similar and likely duplicates.

### strut-icu-import

Imports content from other formats into the YAML format used by `strut-icu`.

#### Supporting import formats

- xliff: XLIFF translation interchange format

## License

ISC license. See LICENSE.
