<p align="center">
  <img width="256" height="256" src="https://user-images.githubusercontent.com/279099/43086531-de0e9012-8e9d-11e8-8674-b419b69ca922.png" alt="i18n-eller logo"/>
</p>

# i18n-eller

Localisation tooling that is awesome and easy to use, using ICU formatting for plurals and other nightmarish aspects of localisation.

## Installation

The tools are not yet on npm, so in the mean time, you can install from github:

```
npm i -g bbqsrc/i18n-eller
```

## Commands

Call `i18n-eller` with one of the following commands. (Use `--help` for more information.)

### generate

Generates target output (ie iOS, Android, etc) from YAML source files. Automatically handles converting ICU entities to platform-supported entities.

Provides a type-safe singleton on each platform for accessing strings by key, generated from the YAML files. See `examples/` for an example for each platform.

#### Supported generator platforms

- objc: Objective C output
- swift: Swift output
- android: Android String XML output

### import

Imports content from other formats into the YAML format used by `i18n-eller`.

#### Supporting import formats

- xliff: XLIFF translation interchange format

### init

Initialise localisation support for more annoying project formats.

#### Supporting project formats

- xcode: does all the work to create `Localizable.strings` stubs for chosen languages and adds to build system

### validate

Validates and formats the YAML files. Detects perfect duplicates, and supports using fuzzy matching to find strings that are similar and likely duplicates.

## License

ISC license. See LICENSE.
