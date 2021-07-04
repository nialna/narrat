main:
    // This is a comment
    set quests.someQuest 2 // You can set any values in the data part of the state
    talk cat idle "\"hello %{playerName}\"" // This syntax allows replacing with values from inside data
    set_button testButton true
    set_screen changed
    $if this.data.quests.someQuest === 1: // You can do conditions on the state
        jump testLabel // Hello I'm a comment // You can jump to other labels
    choice: // Branching choices
        talk cat idle "\"What's up'\"" // This is the prompt for the choice
        "\"Nothing\"": // This is the first option
            talk cat idle "\"Ah ok\""
        skillcheck testSkillCheck testSkill 99 "Say something if a skill check works": // The second option is a skill check
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
        "let's make choices cause I like making choices!" $if this.data.likeChoices: // A choice can have a condition so it only appears in the list if the condition is met
            "ok we can make choices"
        "let's do nothing!":
            "wow ok :("
    clear_dialog
    "Hi I'm the narrator"
    $if this.skillCheck("someSkillCheck", "testSkill", 40): // You can use skillchecks in conditions
        "wow the skillcheck succeeded"
    else:
        "oh no the skillcheck failed"

testLabel:
    "Hello, I'm a different label"
// Different labels can also be in different files

choicesBug:
    choice:
        "choice prompt"
        "choice 1":
            "hello choice 1"
        "Hidden choice." $if this.data.noTrue:
            "hello hidden choice"
        "Next choice":
            "hello last choice"

skillTest:
    "hello"
    $if this.skillCheck("testSkillCheck", "testSkill", 99): // You can use skillchecks in conditions
        "this skillcheck should fail"
    "after skillcheck"

buttonLabel:
    set_screen changed
    "You clicked on the button!"