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