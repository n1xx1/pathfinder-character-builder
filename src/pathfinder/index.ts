import { pf } from "./definitions";
export { pf } from "./definitions";

export const ancestryList = [
    "Dwarf",
    "Elf",
    "Gnome",
    "Goblin",
    "Halfling",
    "Human",
    "Catfolk",
    "Hobgoblin",
    "Kobold",
    "Leshy",
    "Lizardfolk",
    "Orc",
    "Ratfolk",
    "Shoony",
    "Tengu",
];
export const ancestries: { [id: string]: pf.Ancestry } = {
    Dwarf: require("./ancestries/dwarf.json"),
    Elf: require("./ancestries/elf.json"),
    Gnome: require("./ancestries/gnome.json"),
    Goblin: require("./ancestries/goblin.json"),
    Halfling: require("./ancestries/halfling.json"),
    Human: require("./ancestries/human.json"),
    Catfolk: require("./ancestries/catfolk.json"),
    Hobgoblin: require("./ancestries/hobgoblin.json"),
    Kobold: require("./ancestries/kobold.json"),
    Leshy: require("./ancestries/leshy.json"),
    Lizardfolk: require("./ancestries/lizardfolk.json"),
    Orc: require("./ancestries/orc.json"),
    Ratfolk: require("./ancestries/ratfolk.json"),
    Shoony: require("./ancestries/shoony.json"),
    Tengu: require("./ancestries/tengu.json"),
};

export const backgrounds: { [id: string]: pf.Background } = {
    ["Acolyte"]: require("./backgrounds/acolyte.json"),
    ["Acrobat"]: require("./backgrounds/acrobat.json"),
    ["Amnesiac"]: require("./backgrounds/amnesiac.json"),
    ["Animal Whisperer"]: require("./backgrounds/animal_whisperer.json"),
    ["Artisan"]: require("./backgrounds/artisan.json"),
    ["Artist"]: require("./backgrounds/artist.json"),
    ["Bandit"]: require("./backgrounds/bandit.json"),
    ["Barber"]: require("./backgrounds/barber.json"),
    ["Barkeep"]: require("./backgrounds/barkeep.json"),
    ["Barrister"]: require("./backgrounds/barrister.json"),
    ["Blessed"]: require("./backgrounds/blessed.json"),
    ["Bookkeeper"]: require("./backgrounds/bookkeeper.json"),
    ["Bounty Hunter"]: require("./backgrounds/bounty_hunter.json"),
    ["Charlatan"]: require("./backgrounds/charlatan.json"),
    ["Cook"]: require("./backgrounds/cook.json"),
    ["Courier"]: require("./backgrounds/courier.json"),
    ["Criminal"]: require("./backgrounds/criminal.json"),
    ["Cultist"]: require("./backgrounds/cultist.json"),
    ["Cursed"]: require("./backgrounds/cursed.json"),
    ["Detective"]: require("./backgrounds/detective.json"),
    ["Dreamer of the Verdant Moon"]: require("./backgrounds/dreamer_of_the_verdant_moon.json"),
    ["Droskari Disciple"]: require("./backgrounds/droskari_disciple.json"),
    ["Emissary"]: require("./backgrounds/emissary.json"),
    ["Entertainer"]: require("./backgrounds/entertainer.json"),
    ["Farmhand"]: require("./backgrounds/farmhand.json"),
    ["Feral Child"]: require("./backgrounds/feral_child.json"),
    ["Feybound"]: require("./backgrounds/feybound.json"),
    ["Field Medic"]: require("./backgrounds/field_medic.json"),
    ["Fortune Teller"]: require("./backgrounds/fortune_teller.json"),
    ["Gambler"]: require("./backgrounds/gambler.json"),
    ["Gladiator"]: require("./backgrounds/gladiator.json"),
    ["Guard"]: require("./backgrounds/guard.json"),
    ["Haunted"]: require("./backgrounds/haunted.json"),
    ["Herbalist"]: require("./backgrounds/herbalist.json"),
    ["Hermit"]: require("./backgrounds/hermit.json"),
    ["Hunter"]: require("./backgrounds/hunter.json"),
    ["Insurgent"]: require("./backgrounds/insurgent.json"),
    ["Laborer"]: require("./backgrounds/laborer.json"),
    ["Martial Disciple"]: require("./backgrounds/martial_disciple.json"),
    ["Merchant"]: require("./backgrounds/merchant.json"),
    ["Miner"]: require("./backgrounds/miner.json"),
    ["Noble"]: require("./backgrounds/noble.json"),
    ["Nomad"]: require("./backgrounds/nomad.json"),
    ["Outrider"]: require("./backgrounds/outrider.json"),
    ["Pilgrim"]: require("./backgrounds/pilgrim.json"),
    ["Prisoner"]: require("./backgrounds/prisoner.json"),
    ["Raised by Belief"]: require("./backgrounds/raised_by_belief.json"),
    ["Refugee"]: require("./backgrounds/refugee.json"),
    ["Returned"]: require("./backgrounds/returned.json"),
    ["Root Worker"]: require("./backgrounds/root_worker.json"),
    ["Royalty"]: require("./backgrounds/royalty.json"),
    ["Sailor"]: require("./backgrounds/sailor.json"),
    ["Scavenger"]: require("./backgrounds/scavenger.json"),
    ["Scholar"]: require("./backgrounds/scholar.json"),
    ["Scout"]: require("./backgrounds/scout.json"),
    ["Servant"]: require("./backgrounds/servant.json"),
    ["Squire"]: require("./backgrounds/squire.json"),
    ["Street Urchin"]: require("./backgrounds/street_urchin.json"),
    ["Tax Collector"]: require("./backgrounds/tax_collector.json"),
    ["Teacher"]: require("./backgrounds/teacher.json"),
    ["Tinker"]: require("./backgrounds/tinker.json"),
    ["Ward"]: require("./backgrounds/ward.json"),
    ["Warrior"]: require("./backgrounds/warrior.json"),
};

export const classes: { [id: string]: pf.Class } = {
    Alchemist: require("./classes/alchemist.json"),
    Barbarian: require("./classes/barbarian.json"),
    Bard: require("./classes/bard.json"),
    Champion: require("./classes/champion.json"),
    Cleric: require("./classes/cleric.json"),
    Druid: require("./classes/druid.json"),
    Fighter: require("./classes/fighter.json"),
    Investigator: require("./classes/investigator.json"),
    Monk: require("./classes/monk.json"),
    Oracle: require("./classes/oracle.json"),
    Ranger: require("./classes/ranger.json"),
    Rogue: require("./classes/rogue.json"),
    Sorcerer: require("./classes/sorcerer.json"),
    Swashbuckler: require("./classes/swashbuckler.json"),
    Witch: require("./classes/witch.json"),
    Wizard: require("./classes/wizard.json"),
};

export const ancestryFeats: { [id: string]: pf.Feat } = Object.assign(
    {},
    require("./feats/ancestry_1.json"),
    require("./feats/ancestry_5.json"),
    require("./feats/ancestry_9.json"),
    require("./feats/ancestry_13.json"),
    require("./feats/ancestry_17.json"),
);

export const classFeats: { [id: string]: pf.Feat } = Object.assign(
    {},
    require("./feats/class_1.json"),
    require("./feats/class_2.json"),
    require("./feats/class_4.json"),
    require("./feats/class_6.json"),
    require("./feats/class_8.json"),
    require("./feats/class_10.json"),
    require("./feats/class_12.json"),
    require("./feats/class_14.json"),
    require("./feats/class_16.json"),
    require("./feats/class_18.json"),
    require("./feats/class_20.json"),
);

export const generalFeats: { [id: string]: pf.Feat } = Object.assign(
    {},
    require("./feats/general_1.json"),
    require("./feats/general_2.json"),
    require("./feats/general_3.json"),
    require("./feats/general_7.json"),
    require("./feats/general_11.json"),
    require("./feats/general_15.json"),
    require("./feats/general_19.json"),
);

export const archetypeFeats: { [id: string]: pf.Feat } = Object.assign(
    {},
    require("./feats/archetype_2.json"),
    require("./feats/archetype_4.json"),
    require("./feats/archetype_6.json"),
    require("./feats/archetype_8.json"),
    require("./feats/archetype_10.json"),
    require("./feats/archetype_12.json"),
    require("./feats/archetype_14.json"),
    require("./feats/archetype_18.json"),
);

export const feats: { [id: string]: pf.Feat } = Object.assign(
    {},
    ancestryFeats,
    classFeats,
    generalFeats,
    archetypeFeats,
);

export { spells } from "./spells/spells";

export { focusSpells } from "./spells/focus";
