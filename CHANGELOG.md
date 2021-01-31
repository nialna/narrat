## Narrat changelog

### 0.0.14

* Added the changelog (manually made for now)

### 0.0.13

* Added debug menu for jumping to labels (currently doesn't support production builds disabling it)
* Added saving and loading of the game (works by storing data, skills, skillchecks etc. When the game is reloaded, it is brought back at the last label visited)
* Fixed a bug where conditional choices would play the wrong result if a choice is removed due to a condition
* Made script loading and compilation happen during the initial loading, so everything is ready to play when pressing start game
* Skill checks now also save and load their data, so a failed check becomes impossible to choose, and a succeeded skill check can be skipped if shown again

