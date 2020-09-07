import { pf } from "../definitions";

export const generalFeats: { [id: string]: pf.Feat } = {
    "Experienced Smuggler": {
        name: "Experienced Smuggler",
        traits: ["General", "Skill"],
        level: 1,
        description: "",
        prerequisites: ["skill:stealth,T"],
        bonus: [
            {
                k: "bonus",
                text:
                    "When the GM rolls your Stealth check to see if a passive observer notices a small item you have concealed, the GM uses the number rolled or 10—whichever is higher—as the result of your die roll, adding it to your Stealth modifier to determine your Stealth check result. If you’re a master in Stealth, the GM uses the number rolled or 15, and if you’re legendary in Stealth, you automatically succeed at hiding a small concealed item from passive observers. This provides no benefits when a creature attempts a Perception check while actively searching you for hidden items. Due to your smuggling skill, you’re more likely to find more lucrative smuggling jobs when using Underworld Lore to Earn Income.",
                category: "",
            },
        ],
    },
    "Specialty Crafting": {
        name: "Specialty Crafting",
        traits: ["General", "Skill"],
        level: 1,
        description: "",
        prerequisites: ["skill:crafting,T"],
        bonus: [
            {
                k: "if",
                if: ["skill:crafting,M"],
                bonus: [
                    {
                        k: "bonus",
                        text:
                            "you gain a +2 circumstance bonus to Crafting checks to items of your Speciality Crafting category",
                        category: "crafting",
                    },
                ],
                else_bonus: [
                    {
                        k: "bonus",
                        text:
                            "you gain a +1 circumstance bonus to Crafting checks to items of your Speciality Crafting category",
                        category: "crafting",
                    },
                ],
            },
        ],
    },
};
