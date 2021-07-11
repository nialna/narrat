main:
    "You open the narrat demo and wonder how this thing even works"
    choice:
        "How about asking for help?"
        "Ask for help":
            jump askForHelp
        "No, I don't want help 😡"
            jump dontAskForHelp

askForHelp:
    clear_dialog
    play sound "alarm"
    wait 2000
    play sound "alarm"
    wait 2000
    play sound "alarm"
    talk helper idle "Hello! I heard you're trying to play the narrat demo!"
    talk helper idle "As you've probably noticed, you can make choices in this."
    talk helper idle "There are lots of things you can do to make an interactive story in Narrat really. Choices are one of the most useful ones."
    talk helper idle "I'm going to send you to my other friend who has some questions for you."
    jump askAboutChoices

askAboutChoices:
    choice:
        talk cat idle "Hi it's me, another generic cat! Do you like making choices in games?"
        "Yes":
            set likeChoices true
            "Cat will remember this."
        "No":
            set likeChoices false
            "Cat will remember this."
    choice:
        talk helper idle "Now I think we should do an activity, what do you like doing?"
        "let's make choices cause I like making choices!" $if this.data.likeChoices: // A choice can have a condition so it only appears in the list if the condition is met
            jump makeChoices
        "let's do nothing!":
            jump doNothing


dontAskForHelp:
    clear_dialog
    talk inner idle "Maybe we should get help though? I don't really know what else to do"
    jump main

makeChoices:
    choice:
        talk inner idle "I don't know, we've been making a lot of choices already lately."
        "I still want to make a choice!":
            talk helper idle "Well you just made one, it turns out. Can we continue now?"
            jump doNothing
        "I guess you're right":
            jump doNothing


doNothing:
    choice:
        talk music_cat idle "How about we get some music in here?"
        "Yeah! Play some epic music":
            play music metal
        "Play some relaxing music":
            play music calm
        "I hate music":
            talk music_cat idle "Well too bad, it's up to you."
    jump otherFeatures

otherFeatures:
    talk helper idle "There are lots of other features, like skill checks and conditions."
    $if this.skillCheck("someSkillCheck", "testSkill", 40): // You can use skillchecks in conditions
        "For example this line only appears if you passed a skill check"
    "This engine is still very early and not fully documented yet, but you can use at the example demo and how it is made."
    "There is also a screen feature on the left where you can display background images with interactive buttons."
