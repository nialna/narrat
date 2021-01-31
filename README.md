# 🚀 Narrat

A narrative game engine for text-based games. Inspired by renpy syntax, but built to be customisable, extendable and web-focused.

You can [try a little demo](https://blog.lianapigeot.com/narrat-demo/). It contains a built version of the [narrat game template](https://github.com/nialna/narrat-template).

Game dialogue info is written in files with a similar syntax to Renpy (.rpy files). Those files get loaded by the game engine which plays through them.


## Usage

Make sure you have [node.js](https://nodejs.org/en/) installed (Made using `15.5.0`, LTS probably also works, not tested). You can use [nvm](https://github.com/nvm-sh/nvm) to simplify node installation (not on Windows).

Narrat is a JavaScript library you can add to a web project.

One simple way to set it up is to use the [Narrat Template App](https://github.com/nialna/narrat-template).

Otherwise, use your preferred way of setting up a JS web project, and add `narrat` as a library

## Install on a project

`npm install narrat`

For narrat to run, it needs two pieces of data:

* The `config` file which contains the path of your script files and other info
* The `characters` file which contains the list of characters in the game

Copy the example `characters.json` and `config.json` from the `public/data` folders somewhere in your app, and have an `#app` div in your page's html including your javascript (you can copy `public/index.html`)
.

Then in your javascript code to launch narrat, use:

```
import { startApp } from 'narrat';
// Call `startApp` to run the game, passing the path to your config file and characters file.
startApp({
  charactersPath: 'data/characters.json', // Replace with whatever path you have
  configPath: 'data/config.json',
});
```

## Customising your game

#### config.json

The config file contains basic info about your game. In it you can add new skills and change their name.

This is also where the scripts used in your game are listed. By default it only uses `data/example.rpy` but you can add more scripts to the list and they will all get loaded.

#### characters.json

The `characters.json` file contains the config for all characters that can speak in the game. They should all at least have a name value.

You can change the color their name appears as by changing the `color` value in the `style` property of the character (you can use any CSS valid color).

If you want to customise even more, you can put a CSS properties object in the following properties:

* `stylesboxCss`: Will apply CSS to the container of a dialogue line for this character
* `style.nameCss`: Will apply CSS to the text with the title of the character
* `style.textCss`: Will apply CSS to the actual dialogue text for the character.

Example:
```
    "player": {
      "style": {
        "color": "orange",
        "textCss": {
            "color": "blue"
        },
        "boxCss": {
            "backgroundColor": "white"
        }
      },
      "name": "You"
    },
```

## Writing code

Narrat script is split into labels, which are the first level of indentation you see in the code (labels `main:` and `testLabel:` in the example below). Those labels are standalone pieces of script which can be played at anytime. `main` is the label that gets launched when the game starts.

The syntax is based on indentation: An indent level is 4 spaces, and entering a new indentation level means entering a new block in the code.

This syntax is largely inspired by renpy syntax.

Note: The parser for the code is very new and likely to break if pushed too much.

### Adding your scripts to your game

To add new scripts to your game, add their path to the list in your `config.json` file. Make sure one of your files has a `main` label, as that's where the game will start.

Look at the example code to see syntax.

```
main:
    // This is a comment
    set quests.someQuest 2 // You can set any values in the data part of the state
    talk cat idle "\"hello %{playerName}\"" // This syntax allows replacing with values from inside data
    $if data.quests.someQuest === 1: // You can do conditions on the state
        jump testLabel // Hello I'm a comment // You can jump to other labels
    choice: // Branching choices
        talk cat idle "\"What's up'\"" // This is the prompt for the choice
        "\"Nothing\"": // This is the first option
            talk cat idle "\"Ah ok\""
        skillcheck simple testSkill 40 "Say something if a skill check works": // The second option is a skill check
            success "\"Hey I passed a skill check"": // This happens if the skill check succeeds
                talk cat idle "\"wow that's cool\""
            failure "You failed the skill check":

    choice:
        talk cat idle "Do you like choices?"
        "Yes":
            set likeChoices true
        "No":
            set likeChoices false
    choice:
        talk cat idle "What should we do?"
        "let's make choices cause I like making choices!" $if data.likeChoices: // A choice can have a condition so it only appears in the list if the condition is met
            "ok we can make choices"
        "let's do nothing!":
            "wow ok :("
    "Hi I'm the narrator"
    $if skillCheck("simple", "testSkill", 40): // You can use skillchecks in conditions
        "wow the skillcheck succeeded"
    else:
        "oh no the skillcheck failed"

testLabel:
    "Hello, I'm a different label"
// Different labels can also be in different files
```

## Things missing

* Saving
* Advanced visual/layout customisation