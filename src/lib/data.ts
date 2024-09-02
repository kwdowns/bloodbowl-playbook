import { type Player } from '@/lib/models/Player'
import { type Skill } from '@/lib/models/Skill'
import type { Team } from './models/Team'

export const data: {
  [Property in Team as `${Lowercase<string & Property>}`]: {
    players: ({ team: Property } & Player)[]
  }  
} & {
  skills: Skill[]
} = {
  offense: {
    players: [
      {
        id: '',
        number: 1,
        position: 'Lineman',
        strength: 3,
        agility: 3,
        armor: 10,
        team: 'Offense',
        passing: 4,
        skills: []
      }
    ]
  },
  defense: {
    players: [
      {
        id: '',
        number: 1,
        position: 'Lineman',
        strength: 3,
        agility: 3,
        armor: 10,
        team: 'Defense',
        passing: 4,
        skills: []
      }
    ]
  },
  skills:
    [
      {
        name: "Catch",
        description: "This player may re-roll a failed Agility test when attempting to catch the ball.",
        category: "Agility"
      },
      {
        name: "Diving Catch",
        description: "This player may attempt to catch the ball if a pass, throw-in or kick-off causes it to land in a square within their Tackle Zone after scattering or deviating. This Skill does not allow this player to attempt to catch the ball if it bounces into a square within their Tackle Zone. Additionally, this player may apply a +1 modifier to any attempt to catch an accurate pass if they occupy the target square.",
        category: "Agility"
      },
      {
        name: "Diving Tackle",
        description: "Should an active opposition player that is attempting to Dodge, Jump or Leap in order to vacate a square in which they are being Marked by this player pass their Agility test, you may declare that this player will use this Skill. Your opponent must immediately subtract 2 from the result of the Agility test. This player is then Placed Prone in the square vacated by the opposition player. If the opposition player was being Marked by more than one player with this Skill, only one player may use it.",
        category: "Agility"
      },
      {
        name: "Dodge",
        description: "Once per team turn, during their activation, this player may re-roll a failed Agility test when attempting to Dodge. Additionally, this player may choose to use this Skill when they are the target of a Block action and a Stumble result is applied against them.",
        category: "Agility"
      },
      {
        name: "Defensive",
        description: "During your opponent's team turn (but not during your own team turn), any opposition players being Marked by this player cannot use the Guard skill.",
        category: "Agility"
      },
      {
        name: "Jump Up",
        description: "If this player is Prone they may stand up for free (i.e., standing up does not cost this player three (3) squares of their Movement Allowance, as it normally would). Additionally, if this player is Prone when activated, they may attempt to Jump Up and perform a Block action. This player makes an Agility test, applying a +1 modifier. If this test is passed, they stand up and may perform a Block action. If the test is failed, they remain Prone and their activation ends. This Skill may still be used if the player is Prone or has lost their Tackle Zone.",
        category: "Agility"
      },
      {
        name: "Leap",
        description: "During their movement, instead of jumping over a single square that is occupied by a Prone or Stunned player, as described on page 45, a player with this Skill may choose to Leap over any single adjacent square, including unoccupied squares and squares occupied by Standing players. Additionally, this player may reduce any negative modifier applied to the Agility test when they attempt to Jump over a Prone or Stunned player, or to Leap over an empty square or a square occupied by a Standing player by 1, to a minimum of -1. A player with this Skill cannot also have the Pogo Stick trait.",
        category: "Agility"
      },
      {
        name: "Safe Pair of Hands",
        description: "If this player is Knocked Down or Placed Prone (but not if they Fall Over) whilst in possession of the ball, the ball does not bounce. Instead, you may place the ball in an unoccupied square adjacent to the one this player occupies when they become Prone. This Skill may still be used if the player is Prone.",
        category: "Agility"
      },
      {
        name: "Sidestep",
        description: "If this player is pushed back for any reason, they are not moved into a square chosen by the opposing coach. Instead you may choose any unoccupied square adjacent to this player. This player is pushed back into that square instead. If there are no unoccupied squares adjacent to this player, this Skill cannot be used.",
        category: "Agility"
      },
      {
        name: "Sneaky Git",
        description: "When this player performs a Foul action, they are not Sent-off for committing a Foul should they roll a natural double on the Armour roll. Additionally, the activation of this player does not have to end once the Foul has been committed. If you wish and if this player has not used their full Movement Allowance, they may continue to move after committing the Foul.",
        category: "Agility"
      },
      {
        name: "Sprint",
        description: "When this player performs any action that includes movement, they may attempt to Rush three times, rather than the usual two.",
        category: "Agility"
      },
      {
        name: "Sure Feet",
        description: "Once per team turn, during their activation, this player may re-roll the D6 when attempting to Rush.",
        category: "Agility"
      },
      {
        name: "Block",
        description: "When a Both Down result is applied during a Block action, this player may choose to ignore it and not be Knocked Down.",
        category: "General"
      },
      {
        name: "Dauntless",
        description: "When this player performs a Block action (on its own or as part of a Blitz action), if the nominated target has a higher Strength characteristic than this player before counting offensive or defensive assists but after applying any other modifiers, roll a D6 and add this player's Strength characteristic to the result. If the total is higher than the target's Strength characteristic, this player increases their Strength characteristic to be equal to that of the target of the Block action, before counting offensive or defensive assists, for the duration of this Block action. If this player has another Skill that allows them to perform more than one Block action, such as Frenzy, they must make a Dauntless roll before each separate Block action is performed.",
        category: "General"
      },
      {
        name: "Dirty Player (+1)",
        description: "When this player commits a Foul action, either the Armour roll or Injury roll made against the victim may be modified by the amount shown in brackets. This modifier may be applied after the roll has been made.",
        category: "General"
      },
      {
        name: "Fend",
        description: "If this player is pushed back as the result of any block dice result being applied against them, they may choose to prevent the player that pushed them back from following-up. However, the player that pushed them back may continue to move as part of a Blitz action if they have Movement Allowance remaining or by Rushing. This Skill cannot be used when this player is chain-pushed, against a player with the Ball & Chain trait or against a player with the Juggernaut skill that performed the Block action as part of a Blitz.",
        category: "General"
      },
      {
        name: "Frenzy",
        description: "Every time this player performs a Block action (on its own or as part of a Blitz action), they must follow-up if the target is pushed back and if they are able. If the target is still Standing after being pushed back, and if this player was able to follow-up, this player must then perform a second Block action against the same target, again following-up if the target is pushed back. If this player is performing a Blitz action, performing a second Block action will also cost them one square of their Movement Allowance. If this player has no Movement Allowance left to perform a second Block action, they must Rush to do so. If they cannot Rush, they cannot perform a second Block action. Note that if an opposition player in possession of the ball is pushed back into your End Zone and is still Standing, a touchdown will be scored, ending the drive. In this case, the second Block action is not performed. A player with this Skill cannot also have the Grab skill.",
        category: "General"
      },
      {
        name: "Kick",
        description: "If this player is nominated to be the kicking player during a kick-off, you may choose to halve the result of the D6 to determine the number of squares that the ball deviates, rounding any fractions down.",
        category: "General"
      },
      {
        name: "Pro",
        description: "During their activation, this player may attempt to re-roll one dice. This dice may have been rolled either as a single dice roll, as part of a multiple dice roll or as part of a dice pool, but cannot be a dice that was rolled as part of an Armour, Injury or Casualty roll. Roll a D6: On a roll of 3+, the dice can be re-rolled. On a roll of 1 or 2, the dice cannot be re-rolled. Once this player has attempted to use this Skill, they may not use a re-roll from any other source to re-roll this one dice.",
        category: "General"
      },
      {
        name: "Shadowing",
        description: "This player can use this Skill when an opposition player they are Marking voluntarily moves out of a square within this player's Tackle Zone. Roll a D6, adding the MA of this player to the roll and then subtracting the MA of the opposition player. If the result is 6 or higher, or if the roll is a natural 6, this player may immediately move into the square vacated by the opposition player (this player does not need to Dodge to make this move). If, however, the result is 5 or lower, or if the roll is a natural 1, this Skill has no further effect. A player may use this Skill any number of times per turn, during either team's turn. If an opposition player is being Marked by more than one player with this Skill, only one player may use it.",
        category: "General"
      },
      {
        name: "Strip Ball",
        description: "When this player targets an opposition player that is in possession of the ball with a Block action (on its own or as part of a Blitz action), choosing to apply a Push Back result will cause that player to drop the ball in the square they are pushed back into. The ball will bounce from the square the player is pushed back into, as if they had been Knocked Down.",
        category: "General"
      },
      {
        name: "Sure Hands",
        description: "This player may re-roll any failed attempt to pick up the ball. In addition, the Strip Ball skill cannot be used against a player with this Skill.",
        category: "General"
      },
      {
        name: "Tackle",
        description: "When an active opposition player attempts to Dodge from a square in which they were being Marked by one or more players on your team with this Skill, that player cannot use the Dodge skill. Additionally, when an opposition player is targeted by a Block action performed by a player with this Skill, that player cannot use the Dodge skill if a Stumble result is applied against them.",
        category: "General"
      },
      {
        name: "Wrestle",
        description: "This player may use this Skill when a Both Down result is applied, either when they perform a Block action or when they are the target of a Block action. Instead of applying the Both Down result as normal, and regardless of any other Skills either player may possess, both players are Placed Prone.",
        category: "General"
      },
      {
        name: "Big Hand",
        description: "This player may ignore any modifier(s) for being Marked or for Pouring Rain weather conditions when they attempt to pick up the ball.",
        category: "Mutations"
      },
      {
        name: "Claws",
        description: "When you make an Armour roll against an opposition player that was Knocked Down as the result of a Block action performed by this player, a roll of 8+ before applying any modifiers will break their armour, regardless of their actual Armour Value.",
        category: "Mutations"
      },
      {
        name: "Disturbing Presence",
        description: "When an opposition player performs either a Pass action, a Throw Team-mate action or a Throw Bomb Special action, or attempts to either interfere with a pass or to catch the ball, they must apply a -1 modifier to the test for each player on your team with this Skill that is within three squares of them, even if the player with this Skill is Prone, Stunned or has lost their Tackle Zone.",
        category: "Mutations"
      },
      {
        name: "Extra Arms",
        description: "This player may apply a +1 modifier when they attempt to pick up or catch the ball, or when they attempt to interfere with a pass.",
        category: "Mutations"
      },
      {
        name: "Foul Appearance",
        description: "When an opposition player declares a Block action targeting this player (on its own or as part of a Blitz action), or any Special action that targets this player, their coach must first roll a D6, even if this player has lost their Tackle Zone. On a roll of 1, the player cannot perform the declared action and the action is wasted. This Skill may still be used if the player is Prone, Stunned, or has lost their Tackle Zone.",
        category: "Mutations"
      },
      {
        name: "Horns",
        description: "When this player performs a Block action as part of a Blitz action (but not on its own), you may apply a +1 modifier to this player's Strength characteristic. This modifier is applied before counting assists, before applying any other Strength modifiers and before using any other Skills or Traits.",
        category: "Mutations"
      },
      {
        name: "Iron Hard Skin",
        description: "The Claws skill cannot be used when making an Armour roll against this player. This Skill may still be used if the player is Prone, Stunned, or has lost their Tackle Zone.",
        category: "Mutations"
      },
      {
        name: "Monstrous Mouth",
        description: "This player may re-roll any failed attempt to catch the ball. In addition, the Strip Ball skill cannot be used against this player.",
        category: "Mutations"
      },
      {
        name: "Prehensile Tail",
        description: "When an active opposition player attempts to Dodge, Jump or Leap in order to vacate a square in which they are being Marked by this player, there is an additional -1 modifier applied to the active player's Agility test. If the opposition player is being Marked by more than one player with this Mutation, only one player may use it.",
        category: "Mutations"
      },
      {
        name: "Tentacles",
        description: "This player can use this Skill when an opposition player they are Marking voluntarily moves out of a square within this player's Tackle Zone. Roll a D6, adding the ST of this player to the roll and then subtracting the ST of the opposition player. If the result is 6 or higher, or if the roll is a natural 6, the opposition player is held firmly in place and their movement comes to an end. If, however, the result is 5 or lower, or if the roll is a natural 1, this Skill has no further effect. A player may use this Skill any number of times per turn, during either team's turn. If an opposition player is being Marked by more than one player with this Skill, only one player may use it.",
        category: "Mutations"
      },
      {
        name: "Two Heads",
        description: "This player may apply a +1 modifier to the Agility test when they attempt to Dodge.",
        category: "Mutations"
      },
      {
        name: "Very Long Legs",
        description: "This player may reduce any negative modifier applied to the Agility test when they attempt to Jump over a Prone or Stunned player (or to Leap over an empty square or a square occupied by a Standing player, if this player has the Leap skill) by 1, to a minimum of -1. Additionally, this player may apply a +2 modifier to any attempts to interfere with a pass they make. Finally, this player ignores the Cloud Burster skill.",
        category: "Mutations"
      },
      {
        name: "Accurate",
        description: "When this player performs a Quick Pass action or a Short Pass action, you may apply an additional +1 modifier to the Passing Ability test.",
        category: "Passing"
      },
      {
        name: "Cannoneer",
        description: "When this player performs a Long Pass action or a Long Bomb Pass action, you may apply an additional +1 modifier to the Passing Ability test.",
        category: "Passing"
      },
      {
        name: "Cloud Burster",
        description: "When this player performs a Long Pass action or a Long Bomb Pass action, you may choose to make the opposing coach re-roll a successful attempt to interfere with the pass.",
        category: "Passing"
      },
      {
        name: "Dump-Off",
        description: "If this player is nominated as the target of a Block action (or a Special action granted by a Skill or Trait that can be performed instead of a Block action) and if they are in possession of the ball, they may immediately perform a Quick Pass action, interrupting the activation of the opposition player performing the Block action (or Special action) to do so. This Quick Pass action cannot cause a Turnover, but otherwise all of the normal rules for passing the ball apply. Once the Quick Pass action is resolved, the active player performs the Block action and their team turn continues.",
        category: "Passing"
      },
      {
        name: "Fumblerooskie",
        description: "When this player performs a Move or Blitz action whilst in possession of the ball, they may choose to 'drop' the ball. The ball may be placed in any square the player vacates during their movement and does not bounce. No Turnover is caused.",
        category: "Passing"
      },
      {
        name: "Hail Mary Pass",
        description: "When this player performs a Pass action (or a Throw Bomb action), the target square can be anywhere on the pitch and the range ruler does not need to be used. A Hail Mary pass is never accurate, regardless of the result of the Passing Ability test it will always be inaccurate at best. A Passing Ability test is made and can be re-rolled as normal in order to determine if the Hail Mary pass is wildly inaccurate or is fumbled. A Hail Mary pass cannot be interfered with. This Skill may not be used in a Blizzard.",
        category: "Passing"
      },
      {
        name: "Leader",
        description: "A team which has one or more players with this Skill gains a single extra team re-roll, called a Leader re-roll. However, the Leader re-roll can only be used if there is at least one player with this Skill on the pitch (even if the player with this Skill is Prone, Stunned or has lost their Tackle Zone). If all players with this Skill are removed from play before the Leader re-roll is used, it is lost. The Leader re-roll can be carried over into extra time if it is not used, but the team does not receive a new one at the start of extra time. Unlike standard Team Re-rolls, the Leader Re-roll cannot be lost due to a Halfling Master Chef. Otherwise, the Leader re-roll is treated just like a normal team re-roll.",
        category: "Passing"
      },
      {
        name: "Nerves of Steel",
        description: "This player may ignore any modifier(s) for being Marked when they attempt to perform a Pass action, attempt to catch the ball or attempt to interfere with a pass.",
        category: "Passing"
      },
      {
        name: "On the Ball",
        description: "This player may move up to three squares (regardless of their MA), following all of the normal movement rules, when the opposing coach declares that one of their players is going to perform a Pass action. This move is made after the range has been measured and the target square declared, but before the active player makes a Passing Ability test. Making this move interrupts the activation of the opposition player performing the Pass action. A player may use this Skill when an opposition player uses the Dump-off skill, but should this player Fall Over whilst moving, a Turnover is caused. Additionally, during each Start of Drive sequence, after Step 2 but before Step 3, one Open player with this Skill on the receiving team may move up to three squares (regardless of their MA). This Skill may not be used if a touchback is caused when the kick deviates and does not allow the player to cross into their opponent's half of the pitch.",
        category: "Passing"
      },
      {
        name: "Pass",
        description: "This player may re-roll a failed Passing Ability test when performing a Pass action.",
        category: "Passing"
      },
      {
        name: "Running Pass",
        description: "If this player performs a Quick Pass action, their activation does not have to end once the pass is resolved. If you wish and if this player has not used their full Movement Allowance, they may continue to move after resolving the pass.",
        category: "Passing"
      },
      {
        name: "Safe Pass",
        description: "Should this player fumble a Pass action, the ball is not dropped, does not bounce from the square this player occupies, and no Turnover is caused. Instead, this player retains possession of the ball and their activation ends.",
        category: "Passing"
      },
      {
        name: "Arm Bar",
        description: "If an opposition player Falls Over as the result of failing their Agility test when attempting to Dodge, Jump or Leap out of a square in which they were being Marked by this player, you may apply a +1 modifier to either the Armour roll or Injury roll. This modifier may be applied after the roll has been made and may be applied even if this player is now Prone. If the opposition player was being Marked by more than one player with this Skill, only one player may use it.",
        category: "Strength"
      },
      {
        name: "Brawler",
        description: "When this player performs a Block action on its own (but not as part of a Blitz action), this player may re-roll a single Both Down result.",
        category: "Strength"
      },
      {
        name: "Break Tackle",
        description: "Once during their activation, after making an Agility test in order to Dodge, this player may modify the dice roll by +1 if their Strength characteristic is 4 or less, or by +2 if their Strength characteristic is 5 or more.",
        category: "Strength"
      },
      {
        name: "Grab",
        description: "When this player performs a Block action (on its own or as part of a Blitz action), using this Skill prevents the target of the Block action from using the Sidestep skill. Additionally, when this player performs a Block Action on its own (but not as part of a Blitz action), if the target is pushed back, this player may choose any unoccupied square adjacent to the target to push that player into. If there are no unoccupied squares, this Skill cannot be used. A player with this Skill cannot also have the Frenzy skill.",
        category: "Strength"
      },
      {
        name: "Guard",
        description: "This player can offer both offensive and defensive assists regardless of how many opposition players are Marking them.",
        category: "Strength"
      },
      {
        name: "Juggernaut",
        description: "When this player performs a Block action as part of a Blitz action (but not on its own), they may choose to treat a Both Down result as a Push Back result. In addition, when this player performs a Block action as part of a Blitz action, the target of the Block action may not use the Fend, Stand Firm or Wrestle skills.",
        category: "Strength"
      },
      {
        name: "Mighty Blow (+1)",
        description: "When an opposition player is Knocked Down as the result of a Block action performed by this player (on its own or as part of a Blitz action), you may modify either the Armour roll or Injury roll by the amount shown in brackets. This modifier may be applied after the roll has been made. This Skill cannot be used with the Stab or Chainsaw traits.",
        category: "Strength"
      },
      {
        name: "Multiple Block",
        description: "When this player performs a Block action on its own (but not as part of a Blitz action), they may choose to perform two Block actions, each targeting a different player they are Marking. However, doing so will reduce this player's Strength characteristic by 2 for the duration of this activation. Both Block actions are performed simultaneously, meaning both are resolved in full even if one or both result in a Turnover. The dice rolls for each Block action should be kept separate to avoid confusion. This player cannot follow-up when using this Skill. Note that choosing to use this Skill means this player will be unable to use the Frenzy skill during the same activation.",
        category: "Strength"
      },
      {
        name: "Pile Driver",
        description: "When an opposition player is Knocked Down by this player as the result of a Block action (on its own or as part of a Blitz action), this player may immediately commit a free Foul action against the Knocked Down player. To use this Skill, this player must be Standing after the block dice result has been selected and applied, and must occupy a square adjacent to the Knocked Down player. After using this Skill, this player is Placed Prone and their activation ends immediately.",
        category: "Strength"
      },
      {
        name: "Stand Firm",
        description: "This player may choose not to be pushed back, either as the result of a Block action made against them or by a chain-push. Using this Skill does not prevent an opposition player with the Frenzy skill from performing a second Block action if this player is still Standing after the first.",
        category: "Strength"
      },
      {
        name: "Strong Arm",
        description: "This player may apply a +1 modifier to any Passing Ability test rolls they make when performing a Throw Team-mate action. A player that does not have the Throw Team-mate trait cannot have this Skill.",
        category: "Strength"
      },
      {
        name: "Thick Skull",
        description: "When an Injury roll is made against this player (even if this player is Prone, Stunned or has lost their Tackle Zone), they can only be KO'd on a roll of 9, and will treat a roll of 8 as a Stunned result. If this player also has the Stunty trait, they can only be KO'd on a roll of 8, and will treat a roll of 7 as a Stunned result. All other results are unaffected.",
        category: "Strength"
      },
      {
        name: "Animal Savagery",
        description: "When this player is activated, even if they are Prone or have lost their Tackle Zone, immediately after declaring the action they will perform but before performing the action, roll a D6, applying a +2 modifier to the dice roll if you declared the player would perform a Block or Blitz action (or a Special action granted by a Skill or Trait that can be performed instead of a Block action): On a roll of 1-3, this player lashes out at their Team-mates: One Standing Team-mate of your choice that is currently adjacent to this player is immediately Knocked Down by this player. This does not cause a Turnover unless the Knocked Down player was in possession of the ball. After making an Armour roll (and possible Injury roll) against the Knocked Down player, this player may continue their activation and complete their declared action if able. Note that, if this player has any applicable Skills, the coach of the opposing team may use them when making an Armour roll (and possible Injury roll) against the Knocked Down player. If this player is not currently adjacent to any Standing Team-mates, this player's activation ends immediately. Additionally, this player loses their Tackle Zone until they are next activated. On a roll of 4+, this player continues their activation as normal and completes their declared action. If you declared that this player would perform an action which can only be performed once per team turn and this player's activation ended before the action could be completed, the action is considered to have been performed and no other player on your team may perform the same action this team turn.",
        category: "Traits"
      },
      {
        name: "Animosity (X)",
        description: "This player is jealous of and dislikes certain other players on their team, as shown in brackets after the name of the Skill on this player's profile. This may be defined by position or race. For example, a Skaven Thrower on an Underworld Denizens team has Animosity (Underworld Goblin Linemen), meaning they suffer Animosity towards any Underworld Goblin Linemen players on their team. Whereas a Skaven Renegade on a Chaos Renegade team has Animosity (all Team-mates), meaning they suffer Animosity towards all of their Team-mates equally. When this player wishes to perform a Hand-off action to a Team-mate of the type listed, or attempts to perform a Pass action and the target square is occupied by a Team-mate of the type listed, this player may refuse to do so. Roll a D6. On a roll of 1, this player refuses to perform the action and their activation comes to an end. Animosity does not extend to Mercenaries or Star Players.",
        category: "Traits"
      },
      {
        name: "Always Hungry",
        description: "If this player wishes to perform a Throw Team-mate action, roll a D6 after they have finished moving, but before they throw their Team-mate. On a roll of 2+, continue with the throw as normal. On a roll of 1, this player will attempt to eat their Team-mate. Roll another D6: On a roll of 1, the Team-mate has been eaten and is immediately removed from the Team Draft list. No apothecary can save them and no Regeneration attempts can be made. If the Team-mate was in possession of the ball, it will bounce from the square this player occupies. On a roll of 2+, the Team-mate squirms free and the Throw Team-mate action is automatically fumbled.",
        category: "Traits"
      },
      {
        name: "Ball and Chain",
        description: "When this player is activated, the only action they may perform is a 'Ball & Chain Move' Special action. There is no limit to how many players with this Trait may perform this Special action each team turn. When this player performs this Special action: Place the Throw-in template over the player, facing towards either End Zone or either sideline as you wish. Roll a D6 and move the player one square in the direction indicated. A player with a Ball & Chain automatically passes any Agility tests they may be required to make in order to Dodge, regardless of any modifiers. If this movement takes the player off the pitch, they risk Injury by the Crowd. If this movement takes the player into a square in which the ball is placed, the player is considered to have moved involuntarily. Therefore, they may not attempt to pick the ball up and the ball will bounce. Repeat this process for each square the player moves. If this player would move into a square that is occupied by a Standing player from either team, they must perform a Block action against that player, following the normal rules, but with the following exceptions: A Ball & Chain player ignores the Foul Appearance skill. A Ball & Chain player must follow-up if they push-back another player. If this player moves into a square that is occupied by a Prone or Stunned player from either team, for any reason, that player is immediately pushed back and an Armour roll is made against them. This player may Rush. Declare that the player will Rush before placing the Throw-in template and rolling the D6 to determine direction: If this player Rushes into an unoccupied square, move them as normal and roll a D6: On a roll of 2+, this player moves without mishap. On a roll of 1 (before or after modification), the player Falls Over. If this player Rushes into a square that is occupied by a standing player from either team, roll a D6: On a roll of 2+, this player moves without mishap and will perform a Block action against the player occupying the square as described previously. On a roll of 1 (before or after modification), the player occupying the square is pushed back and this player will Fall Over after moving into the vacated square. If this player ever Falls Over, is Knocked Down or is Placed Prone, an Injury roll is immediately made against them (no Armour roll is required), treating a Stunned result as a KO'd result. A player with this Trait cannot also have the Diving Tackle, Frenzy, Grab, Leap, Multiple Block, On the Ball or Shadowing skills. This Trait must still be used if the player is Prone or has lost their Tackle Zone.",
        category: "Traits"
      },
      {
        name: "Bombardier",
        description: "When activated and if they are Standing, this player can perform a 'Throw Bomb' Special action. This Special action is neither a Pass action nor a Throw Team-mate action, so does not prevent another player performing one of those actions during the same team turn. However, only a single player with this Trait may perform this Special action each team turn. A Bomb can be thrown and caught, and the throw interfered with, just like a ball, using the rules for Pass actions as described on page 48, with the following exceptions: A player may not stand up or move before performing a Throw Bomb action. Bombs do not bounce and can come to rest on the ground in an occupied square. Should a player fail to catch a Bomb, it will come to rest on the ground in the square that player occupies. If a Bomb is fumbled, it will explode immediately in the square occupied by the player attempting to throw it. If a Bomb comes to rest on the ground in an empty square or is caught by an opposition player, no Turnover is caused. A player that is in possession of the ball can still catch a Bomb. Any Skills that can be used when performing a Pass action can also be used when performing a Throw Bomb Special action, with the exception of On the Ball. If a Bomb is caught by a player on either team, roll a D6: On a roll of 4+, the Bomb explodes immediately, as described below. On a roll of 1-3, that player must throw the Bomb again immediately. This throw takes place out of the normal sequence of play. Should a Bomb ever leave the pitch, it explodes in the crowd with no effect (on the game) before the crowd can throw it back. When a Bomb comes to rest on the ground, in either an unoccupied square, in a square occupied by a player that failed to catch the Bomb or in a square occupied by a Prone or Stunned player, it will explode immediately: If the Bomb explodes in an occupied square, that player is automatically hit by the explosion. Roll a D6 for each player (from either team) that occupies a square adjacent to the one in which the Bomb exploded: On a roll of 4+, the player has been hit by the explosion. On a roll of 1-3, the player manages to avoid the explosion. Any Standing players hit by the explosion are Knocked Down. Any Standing players hit by the explosion are Placed Prone. An Armour roll (and possibly an Injury roll as well) is made against any player hit by the explosion, even if they were already Prone or Stunned. You may apply a +1 modifier to either the Armour roll or Injury roll. If the player performing the Throw Bomb Special action is hit by their bomb and Placed Prone, either as the result of a Fumbled throw or by being hit by the explosion, then a Turnover is caused. This modifier may be applied after the roll has been made.",
        category: "Traits"
      },
      {
        name: "Bone Head",
        description: "When this player is activated, even if they are Prone or have lost their Tackle Zone, immediately after declaring the action they will perform but before performing the action, roll a D6: On a roll of 1, this player forgets what they are doing and their activation ends immediately. Additionally, this player loses their Tackle Zone until they are next activated. On a roll of 2+, this player continues their activation as normal and completes their declared action. If you declared that this player would perform an action which can only be performed once per team turn and this player's activation ended before the action could be completed, the action is considered to have been performed and no other player on your team may perform the same action this team turn.",
        category: "Traits"
      },
      {
        name: "Chainsaw",
        description: "Instead of performing a Block action (on its own or as part of a Blitz action), this player may perform a 'Chainsaw Attack' Special action. Exactly as described for a Block action, nominate a single Standing player to be the target of the Chainsaw Attack Special action. There is no limit to how many players with this Trait may perform this Special action each team turn. To perform a Chainsaw Attack Special action, roll a D6: On a roll of 2+, the nominated target is hit by a Chainsaw! On a roll of 1, the Chainsaw will violently 'kick-back' and hit the player wielding it. This will result in a Turnover. In either case, an Armour roll is made against the player hit by the Chainsaw, adding +3 to the result. If the armour of the player hit is broken, they become Prone and an Injury roll is made against them. This Injury roll cannot be modified in any way. If the armour of the player hit is not broken, this Trait has no effect. This player can only use the Chainsaw once per turn (i.e., a Chainsaw cannot be used with Frenzy or Multiple Block) and if used as part of a Blitz action, this player cannot continue moving after using it. If this player Falls Over or is Knocked Down, the opposing coach may add +3 to the Armour roll made against the player. If an opposition player performs a Block action targeting this player and a Player Down! or a POW! result is applied, +3 is added to the Armour roll. If a Both Down result is applied, +3 is added to both Armour rolls. Finally, this player may use their Chainsaw when they perform a Foul action. Roll a D6 for kick-back as described above. Once again, an Armour roll is made against the player hit by the Chainsaw, adding +3 to the score.",
        category: "Traits"
      },
      {
        name: "Decay",
        description: "If this player suffers a Casualty result on the Injury table, there is a +1 modifier applied to all rolls made against this player on the Casualty table.",
        category: "Traits"
      },
      {
        name: "Hypnotic Gaze",
        description: "During their activation, this player may perform a 'Hypnotic Gaze' Special action. There is no limit to how many players with this Trait may perform this Special action each team turn. To perform a Hypnotic Gaze Special action, nominate a single Standing opposition player that has not lost their Tackle Zone and that this player is Marking. Then make an Agility test for this player, applying a -1 modifier for every player (other than the nominated player) that is Marking this player. If the test is passed, the nominated player loses their Tackle Zone until they are next activated. This player may move before performing this Special action, following all of the normal movement rules. However, once this Special action has been performed, this player may not move further and their activation comes to an end.",
        category: "Traits"
      },
      {
        name: "Kick Team-mate",
        description: "Once per team turn, in addition to another player performing either a Pass or a Throw Team-mate action, a single player with this Trait on the active team can perform a 'Kick Team-mate' Special action and attempt to kick a Standing Team-mate with the Right Stuff trait that is in a square adjacent to them. To perform a Kick Team-mate Special action, follow the rules for Throw Team-mate actions. However, if the Kick Team-mate Special action is fumbled, the kicked player is automatically removed from play and an Injury roll is made against them, treating a Stunned result as a KO'd result. If the kicked player was in possession of the ball when removed from play, the ball will bounce from the square they occupied.",
        category: "Traits"
      },
      {
        name: "Loner (X+)",
        description: "If this player wishes to use a team re-roll, roll a D6. If you roll equal to or higher than the target number shown in brackets, this player may use the team re-roll as normal. Otherwise, the original result stands without being re-rolled but the team re-roll is lost just as if it had been used. This Trait must still be used if the player is Prone or has lost their Tackle Zone.",
        category: "Traits"
      },
      {
        name: "No Hands",
        description: "This player is unable to take possession of the ball. They may not attempt to pick it up, to catch it, or attempt to interfere with a pass. Any attempt to do so will automatically fail, causing the ball to bounce. Should this player voluntarily move into a square in which the ball is placed, they cannot attempt to pick it up. The ball will bounce and a Turnover is caused as if this player had failed an attempt to pick up the ball.",
        category: "Traits"
      },
      {
        name: "Plague Ridden",
        description: "Once per game, if an opposition player with a Strength characteristic of 4 or less that does not have the Decay, Regeneration or Stunty traits suffers a Casualty result of 15-16, DEAD as the result of a Block action performed or a Foul action committed by a player with this Trait that belongs to your team, and if that player cannot be saved by an apothecary, you may choose to use this Trait. If you do, that player does not die; they have instead been infected with a virulent plague! If your team has the 'Favoured of Nurgle' special rule, a new 'Rotter Lineman' player, drawn from the Nurgle roster, can be placed immediately in the Reserves box of your team's dugout (this may cause a team to have more than 16 players for the remainder of this game). During step 4 of the post-game sequence, this player may be permanently hired, exactly as you would a Journeyman player that had played for your team.",
        category: "Traits"
      },
      {
        name: "Pogo Stick",
        description: "During their movement, instead of jumping over a single square that is occupied by a Prone or Stunned player, as described on page 45, a player with this Trait may choose to Leap over any single adjacent square, including unoccupied squares and squares occupied by Standing players. Additionally, when this player makes an Agility test to Jump over a Prone or Stunned player, or to Leap over an empty square or a square occupied by a Standing player, they may ignore any negative modifiers that would normally be applied for being Marked in the square they jumped or leaped from and/or for being Marked in the square they have jumped or leaped into. A player with this Trait cannot also have the Leap skill.",
        category: "Traits"
      },
      {
        name: "Projectile Vomit",
        description: "Instead of performing a Block action (on its own or as part of a Blitz action), this player may perform a 'Projectile Vomit' Special action. Exactly as described for a Block action, nominate a single Standing player to be the target of the Projectile Vomit Special action. There is no limit to how many players with this Trait may perform this Special action each team turn. To perform a Projectile Vomit Special action, roll a D6: On a roll of 2+, this player regurgitates acidic bile onto the nominated target. On a roll of 1, this player belches and snorts, before covering itself in acidic bile. In either case, an Armour roll is made against the player hit by the Projectile Vomit. This Armour roll cannot be modified in any way. If the armour of the player hit is broken, they become Prone and an Injury roll is made against them. This Injury roll cannot be modified in any way. If the armour of the player hit is not broken, this Trait has no effect. A player can only perform this Special action once per turn (i.e., Projectile Vomit cannot be used with Frenzy or Multiple Block).",
        category: "Traits"
      },
      {
        name: "Really Stupid",
        description: "When this player is activated, even if they are Prone or have lost their Tackle Zone, immediately after declaring the action they will perform but before performing the action, roll a D6, applying a +2 modifier to the dice roll if this player is currently adjacent to one or more Standing Team-mates that do not have this Trait: On a roll of 1-3, this player forgets what they are doing and their activation ends immediately. Additionally, this player loses their Tackle Zone until they are next activated. On a roll of 4+, this player continues their activation as normal and completes their declared action. Note that if you declared that this player would perform an action which can only be performed once per team turn and this player's activation ended before the action could be completed, the action is considered to have been performed and no other player on your team may perform the same action this team turn.",
        category: "Traits"
      },
      {
        name: "Regeneration",
        description: "After a Casualty roll has been made against this player, roll a D6. On a roll of 4+, the Casualty roll is discarded without effect and the player is placed in the Reserves box rather than the Casualty box of their team dugout. On a roll of 1-3, however, the result of the Casualty roll is applied as normal. This Trait may still be used if the player is Prone, Stunned, or has lost their Tackle Zone.",
        category: "Traits"
      },
      {
        name: "Right Stuff",
        description: "If this player also has a Strength characteristic of 3 or less, they can be thrown by a Team-mate with the Throw Team-mate skill. This Trait may still be used if the player is Prone, Stunned, or has lost their Tackle Zone.",
        category: "Traits"
      },
      {
        name: "Secret Weapon",
        description: "When a drive in which this player took part ends, even if this player was not on the pitch at the end of the drive, this player will be Sent-off for committing a Foul.",
        category: "Traits"
      },
      {
        name: "Stab",
        description: "Instead of performing a Block action (on its own or as part of a Blitz action), this player may perform a 'Stab' Special action. Exactly as described for a Block action, nominate a single Standing player to be the target of the Stab Special action. There is no limit to how many players with this Trait may perform this Special action each team turn. To perform a Stab Special action, make an unmodified Armour roll against the target: If the Armour of the player hit is broken, they become Prone and an Injury roll is made against them. This Injury roll cannot be modified in any way. If the Armour of the player hit is not broken, this Trait has no effect. If Stab is used as part of a Blitz action, the player cannot continue moving after using it.",
        category: "Traits"
      },
      {
        name: "Stunty",
        description: "When this player makes an Agility test in order to Dodge, they ignore any -1 modifiers for being Marked in the square they have moved into, unless they also have either the Bombardier trait, the Chainsaw trait or the Swoop trait. However, when an opposition player attempts to interfere with a Pass action performed by this player, that player may apply a +1 modifier to their Agility test. Finally, players with this Trait are more prone to injury. Therefore, when an Injury roll is made against this player, roll 2D6 and consult the Stunty Injury table. This Trait must still be used if the player is Prone, Stunned, or has lost their Tackle Zone.",
        category: "Traits"
      },
      {
        name: "Swarming",
        description: "During each Start of Drive sequence, after Step 2 but before Step 3, you may remove D3 players with this Trait from the Reserves box of your dugout and set them up on the pitch, allowing you to set up more than the usual 11 players. These extra players may not be placed on the Line of Scrimmage or in a Wide Zone. Swarming players must be set up in their team's half. When using Swarming, a coach may not set up more players with the Swarming trait onto the pitch than the number of friendly players with the Swarming trait that were already set up. So, if a team had 2 players with the Swarming trait already set up on the pitch, and then rolled for 3 more players to enter the pitch via Swarming, only a maximum of 2 more Swarming players could be set up on the pitch.",
        category: "Traits"
      },
      {
        name: "Swoop",
        description: "If this player is thrown by a Team-mate, they do not scatter before landing as they normally would. Instead, you may place the Throw-in template over the player, facing towards either End Zone or either sideline as you wish. The player then moves from the target square D3 squares in a direction determined by rolling a D6 and referring to the Throw-in template.",
        category: "Traits"
      },
      {
        name: "Take Root",
        description: "When this player is activated, even if they are Prone or have lost their Tackle Zone, immediately after declaring the action they will perform but before performing the action, roll a D6: On a roll of 1, this player becomes 'Rooted': A Rooted player cannot move from the square they currently occupy for any reason, voluntarily or otherwise, until the end of this drive, or until they are Knocked Down or Placed Prone. A Rooted player may perform any action available to them provided they can do so without moving. For example, a Rooted player may perform a Pass action but may not move before making the pass, and so on. On a roll of 2+, this player continues their activation as normal. If you declared that this player would perform any action that includes movement (Pass, Hand-off, Blitz or Foul) prior to them becoming Rooted, they may complete the action if possible. If they cannot, the action is considered to have been performed and no other player on your team may perform the same action this team turn.",
        category: "Traits"
      },
      {
        name: "Titchy",
        description: "This player may apply a +1 modifier to any Agility tests they make in order to Dodge. However, if an opposition player dodges into a square within the Tackle Zone of this player, this player does not count as Marking the moving player for the purposes of calculating Agility test modifiers.",
        category: "Traits"
      },
      {
        name: "Throw Team-mate",
        description: "If this player also has a Strength characteristic of 5 or more, they may perform a Throw Team-mate action, allowing them to throw a Team-mate with the Right Stuff trait.",
        category: "Traits"
      },
      {
        name: "Timmm-ber!",
        description: "If this player has a Movement Allowance of 2 or less, apply a +1 modifier to the dice roll when they attempt to stand up for each Open, Standing Team-mate they are currently adjacent to. A natural 1 is always a failure, no matter how many Team-mates are helping. This Trait may still be used if the player is Prone or has lost their Tackle Zone.",
        category: "Traits"
      },
      {
        name: "Unchannelled Fury",
        description: "When this player is activated, even if they are Prone or have lost their Tackle Zone, immediately after declaring the action they will perform but before performing the action, roll a D6, applying a +2 modifier to the dice roll if you declared the player would perform a Block or Blitz action (or a Special action granted by a Skill or Trait that can be performed instead of a Block action): On a roll of 1-3, this player rages incoherently at others but achieves little else. Their activation ends immediately. On a roll of 4+, this player continues their activation as normal and completes their declared action. If you declared that this player would perform an action which can only be performed once per team turn and this player's activation ended before the action could be completed, the action is considered to have been performed and no other player on your team may perform the same action this team turn.",
        category: "Traits"
      },
      {
        name: "Hit and Run",
        description: "After a player with this Trait performs a Block action, they may immediately move one free square ignoring Tackle Zones so long as they are still Standing. They must ensure that after this free move, they are not Marked by or Marking any opposition players.",
        category: "Extraordinary"
      },
      {
        name: "Drunkard",
        description: "This player suffers a -1 penality to the dice roll when attempting to Rush.",
        category: "Extraordinary"
      },
      {
        name: "Pick-Me-Up",
        description: "At the end of the opposition's team turn, roll a D6 for each Prone, non-Stunned team-mate within three squares of a standing player with this Trait. On a 5+, the Prone player may immediately stand up.",
        category: "Extraordinary"
      },
      {
        name: "Bloodlust (X+)",
        description: "To keep control of their wits, Vampires need a supply of fresh blood. Whenever a player with this trait activates, after declaring their action, they must roll a D6, adding 1 to the roll if they declared a Block action or a Blitz action. Whenever a player with this Trait activates, even if they are Prone or have lost their Tackle Zone, after declaring their action, they must roll a D6, adding 1 to the roll if they declared a Block action or a Blitz action. If they roll equal to or higher than the number shown in brackets, they may activate as normal. If the player rolls lower than the number shown in brackets, or rolls a natural 1, they may continue their activation as normal though they may change their declared action to a Move action if they wish. If the player declared an action that can only be performed once per team turn (such as a Blitz action), this will still count as the one of that action for the team turn. At the end of their activation they may bite an adjacent Thrall Lineman team-mate (Standing, Prone or Stunned). If they bite a Thrall, immediately make an Injury roll for the Thrall treating any Casualty result as Badly Hurt; this will not cause a Turnover unless the Thrall was holding the ball. If they do not bite a Thrall for any reason then a Turnover is caused, the player will lose their Tackle Zone until they are next activated, and will immediately drop the ball if they were holding it. If the player was in the opposing End Zone, no touchdown is scored. If a player who failed this roll wants to make a Pass action, Hand-off, or score, then they must bite a Thrall before they perform the action or score.",
        category: "Extraordinary"
      }
    ]
}
