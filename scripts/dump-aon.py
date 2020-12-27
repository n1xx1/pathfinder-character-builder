from bs4 import BeautifulSoup
import requests
import requests_cache
import json
import re
import argparse
import subprocess
import functools


BASE_URL = "https://2e.aonprd.com/"


def get_all_ancestries():
    url = BASE_URL + "Ancestries.aspx"
    try:
        res = requests.get(url)
        soup = BeautifulSoup(fix_html(res.text), "lxml")
        links = soup.select("h2.title>a:last-of-type")
        ancestries = []
        ancestry_names = []
        for c in links:
            ancestries.append(BASE_URL + c["href"])
            ancestry_names.append(str(c.string))
        return ancestries, ancestry_names
    except:
        print(f"error parsing all ancestries: {url}")
        raise


def get_all_backgrounds():
    url = BASE_URL + "Backgrounds.aspx"
    try:
        res = requests.get(url)
        soup = BeautifulSoup(fix_html(res.text), "lxml")
        links = soup.select("h2.title>a:last-of-type")
        backgrounds = []
        background_names = []
        for b in links:
            backgrounds.append(BASE_URL + b["href"])
            background_names.append(str(b.string))
        return backgrounds, background_names
    except:
        print(f"error parsing all backgrounds: {url}")
        raise


def get_all_classes():
    url = BASE_URL + "Classes.aspx"
    try:
        res = requests.get(url)
        soup = BeautifulSoup(fix_html(res.text), "lxml")
        links = soup.select("#ctl00_MainContent_Navigation>h1>a")
        classes = []
        class_names = []
        for c in links:
            if c["href"].startswith("Classes.aspx"):
                classes.append(BASE_URL + c["href"])
                class_names.append(str(c.string))
        return classes, class_names
    except:
        print(f"error parsing all classes: {url}")
        raise


def get_all_archetypes():
    url = BASE_URL + "Archetypes.aspx"
    try:
        res = requests.get(url)
        soup = BeautifulSoup(fix_html(res.text), "lxml")
        section = soup.select("#ctl00_MainContent_DetailedOutput>h1.title")

        feats = []

        multiclass = section[0]
        multiclass_contents, _ = scan_until(
            multiclass.next_sibling, lambda x: x is not None and x.name != "h1")

        multiclass_contents = to_element(soup, multiclass_contents)
        links = multiclass_contents.select("u>a")

        for link in links:
            feats.extend(get_archetype_feats(BASE_URL + link["href"]))

        other = section[1]
        other_contents, _ = scan_until(
            other.next_sibling, lambda x: x is not None and x.name != "h1")
        other_contents = to_element(soup, other_contents)

        titles = other_contents.select("h2.title")
        for title in titles:
            contents, _ = scan_until(
                title.next_sibling, lambda x: x is not None and x.name != "h2")
            info, contents, source = skip_to_after_source(contents)

            if not source["book"] in ["Advanced Player's Guide", "Core Rulebook"]:
                continue

            feats.extend(get_archetype_feats(BASE_URL + link["href"]))

        return feats
    except:
        print(f"error parsing all archetypes: {url}")
        raise


def get_archetype_feats(url):
    try:
        res = requests.get(url)
        soup = BeautifulSoup(fix_html(res.text), "lxml")

        page_section_titles = soup.select(
            "#ctl00_MainContent_DetailedOutput>h2.title")

        return [BASE_URL + x.select_one("a:last-of-type")["href"] for x in page_section_titles]
    except:
        print(f"error parsing archetype feats: {url}")
        raise


def get_all_ancestry_feats():
    try:
        get_all_ancestries()
    except:
        print(f"error parsing all ancestry feats: xd")
        raise


def get_ancestry_or_class_feats(url):
    try:
        res = requests.get(url)
        soup = BeautifulSoup(fix_html(res.text), "lxml")
        data = {}

        ancestry_name = soup.title.string.split(" - ")[0].strip()
        feats_link = soup.find("a", string=ancestry_name + " Feats")

        return get_feats(BASE_URL + feats_link["href"])
    except:
        print(f"error parsing all ancestry feats: {url}")
        raise


def scan_until(soup, matcher):
    ret = []
    while matcher(soup):
        ret.append(soup)
        soup = soup.next_sibling
    return (ret, soup)


def fix_html(html):
    html = re.sub(
        r"(<a .*?\"PFS\.aspx\"><span.*?><img alt=\"PFS .*?>)</a></span>", r"\1</span></a>", html)
    return html


HMATCHER = re.compile(r"^h[1-6]$")


def to_markdown_recursive(element, out):
    skip_to_br = False
    for i, e in enumerate(element.contents):
        if skip_to_br:
            if e.name == "br":
                skip_to_br = False
            continue

        if e.name == None:
            s = str(e).replace("\n", " ").replace("\r", " ")
            if len(out) == 0 or out[-1] == "\n":
                s = s.lstrip()
            out += s
        elif e.name == "br":
            out += "  \n"
        elif e.name == "i":
            out += "*"
            out = to_markdown_recursive(e, out)
            out += "*"
        elif e.name == "b":
            out += "**"
            out = to_markdown_recursive(e, out)
            out += "**"
        elif e.name == "u":
            out = to_markdown_recursive(e, out)
        elif e.name == "a":
            out = to_markdown_recursive(e, out)
        elif e.name == "sup":
            out += "<sup>"
            out = to_markdown_recursive(e, out)
            out += "</sup>"
        elif e.name == "div":
            if "sidebar" in e["class"]:
                continue
            else:
                raise Exception("invalid div: " + ", ".join(e["class"]))
        elif e.name == "span":
            if e.get("class") and any(c for c in e["class"] if c.startswith("trait")):
                if i == 0 or element.contents[i - 1].name != "span":
                    out += "; "
                else:
                    out += ", "
                out = to_markdown_recursive(e, out)
            elif e.get("style") and "float:right" in e["style"]:
                out += " -- "
                out = to_markdown_recursive(e, out)
            elif e.get("style") and "float:left" in e["style"] and e.img != None:
                continue
            else:
                raise Exception("invalid span: " + repr(e))
        elif e.name == "ul":
            for li in e.contents:
                if li.name == "li":
                    out += "* "
                    out = to_markdown_recursive(li, out)
                    out += "\n"
            out += "\n"
        elif e.name == "img":
            out += get_action_kind(e["src"])["markdown"]
        elif e.name == "table":
            rows = e.find_all("tr", recursive=False)
            for i, row in enumerate(rows):
                out += "| "
                cols = row.find_all("td", recursive=False)
                for j, col in enumerate(cols):
                    if j > 0:
                        out += " | "
                    out = to_markdown_recursive(col, out)
                out += " |\n"

                if i == 0:
                    out += "| " + "|".join([" - "] * len(cols)) + " |\n"
        elif e.name == "hr":
            out += "\n\n---\n\n"
        elif HMATCHER.match(e.name) != None:
            out += "\n\n" + "#" * int(e.name[1]) + " "
            out = to_markdown_recursive(e, out)
            out += "\n\n"
        else:
            raise Exception("cannot markdown: " + repr(e))
    return out


def to_markdown(soup, element):
    element = to_element(soup, element)
    content = to_markdown_recursive(element, "")
    return optimize_markdown(content)


def optimize_markdown(md):
    # fix multiple line breaks or multiple paragraphs
    md = re.sub(r"  \n((  )?\n)+", "\n\n", md)
    # fix line break followed by block
    md = re.sub(r"  \n(\#+ |---)", r"\n\n\1", md)
    # fix remaining more than 2 line breaks
    md = re.sub(r"\n\n+", "\n\n", md)
    md = md.replace("\u2019", "'")
    return md


def to_element(soup, element):
    if type(element) == list:
        element_html = soup.new_tag("div")
        element_html.extend(element)
        return element_html
    return element


def scan_line_to_br(contents):
    br_index = next(i for i, v in enumerate(contents) if v.name == "br")
    return contents[:br_index], contents[br_index + 1:]


def skip_to_after_source(contents):
    source_index = next(i for i, v in enumerate(contents)
                        if v.name == "b" and v.string == "Source")
    br_index = next(i for i, v in enumerate(
        contents[source_index:]) if v.name == "br")

    pre_contents = contents[:source_index]
    source_contents = contents[source_index:source_index + br_index + 1]

    source_name = next(x for x in source_contents if x.name == "a").i.string
    [book, page] = source_name.split(" pg. ")

    # source_link = BASE_URL + \
    #     next(x for x in source_contents if x.name == "sup").a["href"]

    contents = contents[source_index + br_index + 1:]

    # skip PFS notes
    if len(contents) > 0 and contents[0].name == "u" and contents[0].a != None and contents[0].a["href"] == "PFS.aspx":
        br_index = next(i for i, v in enumerate(contents) if v.name == "br")
        contents = contents[br_index + 1:]

    return pre_contents, contents, {"book": book, "page": int(page)}


def scan_blocks(section_titles, *elements):
    ret = {}
    for s in section_titles:
        contents, _ = scan_until(
            s.next_sibling, lambda x: x is not None and x.name not in elements)

        section_name = "".join(s.strings)
        ret[section_name] = contents
    return ret


def scan_blocks_list(section_titles, *elements):
    ret = []
    for s in section_titles:
        contents, _ = scan_until(
            s.next_sibling, lambda x: x is not None and x.name not in elements)
        ret.append((s, contents))
    return ret


def convert_prof(prof):
    if prof == "Untrained":
        return "U"
    if prof == "Trained":
        return "T"
    if prof == "Expert":
        return "E"
    if prof == "Master":
        return "M"
    if prof == "Legendary":
        return "L"


def get_class_options(url):
    try:
        res = requests.get(url)
        soup = BeautifulSoup(fix_html(res.text), "lxml")
        data = {}

        elements = ["h1"]
        page_section_titles = soup.select(
            "#ctl00_MainContent_DetailedOutput>h1.title")
        if len(page_section_titles) == 0:
            page_section_titles = soup.select(
                "#ctl00_MainContent_DetailedOutput>h2.title")
            elements = ["h1", "h2"]

        page_sections = scan_blocks(page_section_titles, *elements)

        for option, contents in page_sections.items():
            _, contents, source = skip_to_after_source(contents)
            source["prd"] = url

            data[option] = {
                "name": option,
                "source": source,
                "description": to_markdown(soup, contents),
            }
        return data
    except:
        print(f"error parsing class options: {url}")
        raise


INTMOD_REGEX = re.compile(
    r"^a number of (?:additional )?skills equal to (\d+) plus your Intelligence modifier$")
LEVEL_REGEX = re.compile(r"^(.*?)(?:Level (\d+))?$")
IGNORED_FEATURES = ["Ancestry and Background", "Initial Proficiencies", "Skill Feats",
                    "General Feats", "Skill Increases", "Ability Boosts", "Ancestry Feats"]


def split_list(L, by):
    size = len(L)
    idxs = [i + 1 for i, v in enumerate(L) if by(v)]
    starts = [0] + idxs
    ends = idxs + ([size] if idxs[-1] != size else [])
    return [L[i: j - 1] for i, j in zip(starts, ends)]


def get_class_detail(url):
    try:
        res = requests.get(url)
        soup = BeautifulSoup(fix_html(res.text), "lxml")
        data = {}

        class_name = soup.title.string.split(" - ")[0].strip()

        page_section_titles = soup.select(
            "#ctl00_MainContent_DetailedOutput>h1.title")
        page_sections = scan_blocks(page_section_titles, "h1")

        main_section = page_sections[class_name]
        roleplaying_section = page_sections["Roleplaying the " + class_name]
        proficiencies_section = page_sections["Initial Proficiencies"]
        features_section = page_sections["Class Features"]

        # main section
        _, main_section, source = skip_to_after_source(main_section)
        source["prd"] = url
        main_section, key_ability_el = scan_until(
            main_section[0], lambda x: x is not None and (x.name != "b" or x.string == None or not x.string.startswith("Key Ability: ")))

        lore_markdown = to_markdown(
            soup, [x for x in main_section if x.name == 'i'])

        # key and hp
        key_ability = key_ability_el.string.split(": ")[1].split(" OR ")
        hit_points_str = key_ability_el.find_next_sibling(
            "b").string.split(": ")[1]
        hit_points = int(hit_points_str.split(" ")[0])

        data["name"] = class_name
        data["source"] = source
        data["key"] = key_ability if len(key_ability) > 1 else key_ability[0]
        data["hp"] = hit_points

        # roleplaying section
        roleplaying_markdown = to_markdown(soup, roleplaying_section)
        data["description"] = optimize_markdown(
            f"# {data['name']}\n\n{lore_markdown}\n\n{roleplaying_markdown}")

        # initial proficiencies
        proficiencies_section_el = to_element(soup, proficiencies_section)
        prof_sections = scan_blocks(proficiencies_section_el.find_all(
            "h2", recursive=False), "h1", "h2")
        prof_sections = {
            k: ["".join(str(y.string) for y in x).strip() for x in split_list(v, lambda el: el.name == "br")] for k, v in prof_sections.items()}

        proficiencies = []
        if "Perception" in prof_sections:
            prof = prof_sections["Perception"][0].split(" in ")[0]
            proficiencies.append(
                {"skill": "perception", "proficiency": convert_prof(prof)})
        if "Saving Throws" in prof_sections:
            for throw in prof_sections["Saving Throws"]:
                [prof, name] = throw.split(" in ")
                proficiencies.append(
                    {"skill": name.lower(), "proficiency": convert_prof(prof)})
        if "Skills" in prof_sections:
            for skill in prof_sections["Skills"]:
                [prof, name] = skill.split(" in ")
                prof = convert_prof(prof)

                intmod_match = INTMOD_REGEX.match(name)

                if intmod_match:
                    proficiencies.append(
                        {"skill": "any_skill", "proficiency": prof, "count": intmod_match[1] + "+INT"})
                elif not " " in name:
                    proficiencies.append(
                        {"skill": name.lower(), "proficiency": prof})
                elif "one skill determined by" in name or "one or more skills determined by" in name:
                    continue
                elif name.startswith("your choice of"):
                    names = map(lambda x: x.lower(), name[len("your choice of") +
                                                          1:].strip().split(" or "))
                    proficiencies.append(
                        {"skill": "any_skill", "proficiency": prof, "filter": list(names)})
                else:
                    raise Exception(f"unknown proficiency: {name}")
        if "Attacks" in prof_sections:
            for attack in prof_sections["Attacks"]:
                [prof, name] = attack.split(" in ")
                prof = convert_prof(prof)
                if prof == "U":
                    continue

                if name == "unarmed attacks":
                    proficiencies.append(
                        {"skill": "unarmed", "proficiency": prof})
                elif name.startswith("the "):
                    names = name.replace("the ", "").split(", ")
                    names = names[:-1] + names[-1].split(" and ")
                    proficiencies.append(
                        {"skill": "weapons", "weapons": names, "proficiency": prof})
                else:
                    names = name.split(", ")
                    names = names[:-1] + names[-1].split(" and ")
                    names = [x.replace(" weapons", "") for x in names]
                    proficiencies.append(
                        {"skill": "weapons", "category": names, "proficiency": prof})
        if "Defenses" in prof_sections:
            for defence in prof_sections["Defenses"]:
                [prof, name] = defence.split(" in ")
                prof = convert_prof(prof)
                if prof == "U":
                    continue

                if name == "unarmored defense":
                    proficiencies.append(
                        {"skill": "unarmored", "proficiency": prof})
                elif name == "light armor":
                    proficiencies.append(
                        {"skill": "armor_light", "proficiency": prof})
                elif name == "medium armor":
                    proficiencies.append(
                        {"skill": "armor_medium", "proficiency": prof})
                elif name == "heavy armor":
                    proficiencies.append(
                        {"skill": "armor_heavy", "proficiency": prof})
                elif name == "all armor":
                    proficiencies.append(
                        {"skill": "armor_light", "proficiency": prof})
                    proficiencies.append(
                        {"skill": "armor_medium", "proficiency": prof})
                    proficiencies.append(
                        {"skill": "armor_heavy", "proficiency": prof})
                else:
                    raise Exception(f"unknown defence: {defence}")
        if "Spells" in prof_sections:
            for spell in prof_sections["Spells"]:
                [prof, name] = spell.split(" in ")
                [trad, name] = name.split(" ", 1)
                prof = convert_prof(prof)

                if name == "spell attacks":
                    proficiencies.append(
                        {"skill": "spell_attack", "tradition": trad, "proficiency": prof})
                elif name == "spell DCs":
                    proficiencies.append(
                        {"skill": "spell_dc", "tradition": trad, "proficiency": prof})
        if "Class DC" in prof_sections:
            [prof, _] = attack.split(" in ")
            prof = convert_prof(prof)
            proficiencies.append(
                {"skill": "class_dc", "class": class_name, "proficiency": prof})
        data["proficiencies"] = proficiencies

        # class features
        features_section_el = to_element(soup, features_section)
        feat_sections = scan_blocks(features_section_el.find_all(
            "h2", recursive=False), "h1", "h2")

        features = []
        for feat, content in feat_sections.items():
            feat_match = LEVEL_REGEX.match(feat)
            feat_name = feat_match[1]
            feat_level = int(feat_match[2]) if feat_match[2] else 1

            if feat_name in IGNORED_FEATURES or feat_name == f"{class_name} Feats":
                continue

            feature = {
                "name": feat_name,
                "level": feat_level,
                "description": to_markdown(soup, content)
            }
            here = to_element(soup, content).find("a", string="here")

            if here and not here["href"] == "Familiars.aspx" and not here["href"].startswith("Rules.aspx"):
                feature["options"] = get_class_options(BASE_URL + here["href"])
            elif feat_name == "Methodology":
                feature["options"] = get_class_options(
                    BASE_URL + "Methodologies.aspx")

            features.append(feature)

        data["features"] = features
        return data
    except:
        print(f"error parsing class: {url}")
        raise


def get_background_detail(url):
    try:
        res = requests.get(url)
        soup = BeautifulSoup(fix_html(res.text), "lxml")
        data = {}

        page_title = soup.select_one(
            "#ctl00_MainContent_DetailedOutput>h1.title")
        contents, ancestry_mechanics = scan_until(
            page_title.next_sibling, lambda x: x is not None and x.name != "h1")

        info, contents, source = skip_to_after_source(contents)
        source["prd"] = url

        contents, _ = scan_until(
            contents[0], lambda x: x is not None and x.name != "h1" and (x.name != "h2" or x.string != "Traits"))

        data["name"] = str(page_title.select_one("a:last-of-type").string)
        data["source"] = source
        data["traits"] = [
            x.find("a").string for x in info if x.name == "span" and any(c for c in x["class"] if c.startswith("trait"))]
        data["description"] = to_markdown(soup, contents)

        return data
    except:
        print(f"error parsing background: {url}")
        raise


def get_ancestry_detail(url):
    try:
        res = requests.get(url)
        soup = BeautifulSoup(fix_html(res.text), "lxml")
        data = {}

        page_title = soup.select_one(
            "#ctl00_MainContent_DetailedOutput>h1.title")
        contents, ancestry_mechanics = scan_until(
            page_title.next_sibling, lambda x: x is not None and x.name != "h1")

        info, ancestry_info, source = skip_to_after_source(contents)
        source["prd"] = url

        data["name"] = str(page_title.select_one("a:last-of-type").string)
        data["source"] = source
        data["traits"] = [
            x.find("a").string for x in info if x.name == "span" and any(c for c in x["class"] if c.startswith("trait"))]

        ancestry_mechanics, _ = scan_until(
            ancestry_mechanics, lambda x: x is not None)
        ancestry_mechanics = to_element(soup, ancestry_mechanics)

        titles = ancestry_mechanics.select("h2.title")
        for c in titles:
            title = c.string
            contents, _ = scan_until(c.next_sibling, lambda x: x is not None and x.name !=
                                     "h1" and x.name != "h2")

            if title == "Size":
                data["size"] = str(contents[0])
            elif title == "Hit Points":
                data["hp"] = int(contents[0])
            elif title == "Speed":
                data["speed"] = int(contents[0].replace(" feet", ""))
            elif title == "Darkvision":
                data["darkvision"] = True
            elif title == "Low-Light Vision":
                data["lowlight_vision"] = True
            elif title == "Ability Boosts":
                data["ability_boosts"] = list(
                    map(str, filter(lambda x: x.name is None, contents)))
                if data["ability_boosts"][0] == "Two free ability boosts":
                    data["ability_boosts"] = ["Free", "Free"]
            elif title == "Ability Flaw(s)":
                data["ability_flaws"] = list(
                    map(str, filter(lambda x: x.name is None, contents)))
            elif title == "Languages":
                pass
            else:
                if not "other" in data:
                    data["other"] = []

                desc = to_markdown(soup, contents)
                data["other"].append({"name": title, "desc": desc})
                # print(title, contents)

        data["description"] = to_markdown(soup, ancestry_info)

        data["heritages"] = get_ancestry_heritages(url, data["name"])

        return data
    except:
        print(f"error parsing ancestry: {url}")
        raise


def get_action_kind(url):
    if url.endswith("OneAction.png") or url.endswith("OneAction_I.png"):
        return {"markdown": ":a:", "kind": 1}
    elif url.endswith("TwoActions.png") or url.endswith("TwoActions_I.png"):
        return {"markdown": ":aa:", "kind": 2}
    elif url.endswith("ThreeActions.png") or url.endswith("ThreeActions_I.png"):
        return {"markdown": ":aaa:", "kind": 3}
    elif url.endswith("Reaction.png") or url.endswith("Reaction_I.png"):
        return {"markdown": ":r:", "kind": "reaction"}
    elif url.endswith("FreeAction.png") or url.endswith("FreeAction_I.png"):
        return {"markdown": ":f:", "kind": "bonus"}
    else:
        raise Exception("invalid image: " + url)


def get_feat_detail(url, all_ancestry_names):
    try:
        res = requests.get(url)
        soup = BeautifulSoup(fix_html(res.text), "lxml")
        data = {}

        page_title = soup.select_one(
            "#ctl00_MainContent_DetailedOutput>h1.title")
        contents, _ = scan_until(
            page_title.next_sibling, lambda x: x is not None and x.name != "h1")

        info, contents, source = skip_to_after_source(contents)
        source["prd"] = url

        contents, _ = scan_until(
            contents[0], lambda x: x is not None and x.name != "h1" and (x.name != "h2" or x.string != "Traits"))

        data["name"] = str(page_title.select_one("a:last-of-type").string)
        data["source"] = source
        data["traits"] = [
            x.find("a").string for x in info if x.name == "span" and any(c for c in x["class"] if c.startswith("trait"))]

        level = page_title.find(
            "span", recursive=False).string[len("Feat "):]

        if contents[0].string == "Archetype":
            archetype, contents = scan_line_to_br(contents[1:])
            data["archetype"] = "".join(x.string for x in archetype).strip()

        action_image = page_title.find("img", recursive=False)
        if action_image != None:
            data["action"] = get_action_kind(action_image["src"])["kind"]

        data["description"] = to_markdown(soup, contents)

        if "Archetype" in data["traits"] or ("Rare" in data["traits"] and len(data["traits"]) == 1) or level.endswith("*"):
            data["kind"] = "archetype"
            data["skill"] = "Skill" in data["traits"]
            level = level.replace("*", "")
        elif any(x for x in data["traits"] if x in all_ancestry_names):
            data["kind"] = "ancestry"
        elif "General" in data["traits"]:
            data["kind"] = "general"
            data["skill"] = "Skill" in data["traits"]
        else:
            data["kind"] = "class"

        data["level"] = int(level)
        return data
    except:
        print(f"error parsing ancestry feat: {url}")
        raise


def get_feats(url):
    try:
        res = requests.get(url)
        soup = BeautifulSoup(fix_html(res.text), "lxml")
        feats = []

        rows = soup.select("table>tr")
        for r in rows:
            elements = r.find_all("td", recursive=False)
            if len(elements) == 0:
                continue

            name = elements[0].select_one("u>a")
            feats.append(BASE_URL + name["href"])

        return feats
    except:
        print(f"error parsing feats: {url}")
        raise


def get_ancestry_heritages(url, ancestry):
    try:
        url = url.replace("Ancestries.aspx?ID=", "Heritages.aspx?Ancestry=")
        res = requests.get(url)
        soup = BeautifulSoup(fix_html(res.text), "lxml")
        data = {}

        first_heritage = soup.select_one(
            "#ctl00_MainContent_DetailedOutput>h2.title")
        contents, _ = scan_until(
            first_heritage, lambda x: x is not None and x.name != "h1")
        titles = to_element(soup, contents).select("h2.title")
        for c in titles:
            name_link = c.select_one("a:last-of-type")
            name = re.sub(" " + ancestry + "$", "", name_link.string)

            contents, _ = scan_until(c.next_sibling, lambda x: x is not None and x.name !=
                                     "h1" and x.name != "h2")
            _, contents, source = skip_to_after_source(contents)
            source["prd"] = BASE_URL + name_link["href"]

            data[name] = {
                "name": name,
                "source": source,
                "description": to_markdown(soup, contents),
            }
        return data
    except:
        print(f"error parsing ancestry heritage: {url}")
        raise


def to_ability_json(boost):
    return boost[:3].upper()


def create_feature_option_json(data, old):
    json_data = {} if old is None else old.copy()
    json_data["name"] = data["name"]
    json_data["source"] = data["source"]
    if not "bonus" in json_data:
        json_data["bonus"] = [{"k": "bonus", "category": "TODO", "text": ""}]
    json_data["description"] = data["description"]
    return json_data


def create_feature_json(data, old):
    json_data = {} if old is None else old.copy()
    json_data["name"] = data["name"]
    json_data["level"] = data["level"]

    if "options" in data:
        old_options = {}
        old_options_index = -1
        if "bonus" in json_data:
            oindexes = [i for i, x in enumerate(
                json_data["bonus"]) if x["k"] == "option"]
            if len(oindexes) > 0:
                old_options_index = oindexes[0]
                old_options = json_data["bonus"][old_options_index]

        options = {}
        for o, odata in data["options"].items():
            if "options" in old_options and o in old_options["options"]:
                options[o] = create_feature_option_json(
                    odata, old_options["options"][o])
            else:
                options[o] = create_feature_option_json(odata, None)

        if not "bonus" in json_data:
            json_data["bonus"] = [
                {"k": "option", "options": options},
                {"k": "bonus", "category": "TODO", "text": ""},
            ]
        else:
            json_data["bonus"][old_options_index] = {
                "k": "option", "options": options}
    elif not "bonus" in json_data:
        json_data["bonus"] = [
            {"k": "bonus", "category": "TODO", "text": ""},
        ]

    json_data["description"] = data["description"]

    return json_data


def create_class_json(data, old):
    json_data = {} if old is None else old.copy()
    json_data["name"] = data["name"]
    json_data["source"] = data["source"]

    key = list("OTHER" if x == "OTHER" else x[:3].upper() for x in (
        data["key"] if type(data["key"]) == list else [data["key"]]))
    json_data["key"] = key[0] if len(key) == 1 else key
    json_data["hp"] = data["hp"]

    old_features = json_data["features"] if "features" in json_data else {}
    json_data["features"] = {}

    features = []
    for i, f in [(i, "Level " + str(i)) for i in range(1, 21)]:
        if not f in old_features:
            b = []
            if f == "Level 1":
                for prof in data["proficiencies"]:
                    b.append({
                        "k": "proficiency",
                        **prof
                    })
            b.append({"k": "bonus", "category": "TODO", "text": ""})
        else:
            b = old_features[f]["bonus"]

        features.append({
            "name": f,
            "level": i,
            "bonus": b,
            "description": f,
        })

    for fdata in data["features"]:
        if fdata["name"] in old_features:
            features.append(create_feature_json(
                fdata, old_features[fdata["name"]]))
        else:
            features.append(create_feature_json(fdata, None))

    json_data["features"] = {x["name"]: x for x in sorted(
        features, key=functools.cmp_to_key(lambda a, b: a["level"] - b["level"]))}
    json_data["description"] = data["description"]
    return json_data


def create_heritage_json(data, old):
    json_data = {} if old is None else old.copy()
    json_data["name"] = data["name"]
    json_data["source"] = data["source"]
    if not "bonus" in json_data:
        json_data["bonus"] = [{"k": "bonus", "category": "TODO", "text": ""}]
    json_data["description"] = data["description"]
    return json_data


def create_ancestry_json(data, old):
    json_data = {} if old is None else old.copy()
    json_data["name"] = data["name"]
    json_data["source"] = data["source"]
    json_data["hp"] = data["hp"]
    json_data["size"] = data["size"].lower()
    json_data["speed"] = data["speed"]
    json_data["traits"] = data["traits"]
    if not "bonus" in json_data:
        b = []

        for boost in data["ability_boosts"]:
            if boost == "Free":
                b.append({"k": "ability"})
            else:
                b.append({"k": "ability", "ability": to_ability_json(boost)})

        if "ability_flaws" in data:
            for boost in data["ability_flaws"]:
                b.append({"k": "ability_flaw", "ability": to_ability_json(boost)})

        b.append({"k": "feat", "filter": [f"trait:{data['name']}", "level:1"]})

        if "lowlight_vision" in data:
            b.append({"k": "special", "id": "lowlight_vision"})

        if "darkvision" in data:
            b.append({"k": "bonus", "category": "sense",
                      "text": "darkvision"})

        if "other" in data:
            for b1 in data["other"]:
                b.append(
                    {"k": "bonus", "category": f"TODO {b1['name']}", "text": b1["desc"]})

        json_data["bonus"] = b

    old_heritages = json_data["heritages"] if "heritages" in json_data else {}
    json_data["heritages"] = {}
    for h, hdata in data["heritages"].items():
        if h in old_heritages:
            json_data["heritages"][h] = create_heritage_json(
                hdata, old_heritages[h])
        else:
            json_data["heritages"][h] = create_heritage_json(hdata, None)

    json_data["description"] = data["description"]
    return json_data


def create_background_json(data, old):
    json_data = {} if old is None else old.copy()
    json_data["name"] = data["name"]
    json_data["source"] = data["source"]
    if not "bonus" in json_data:
        json_data["bonus"] = [{"k": "bonus", "category": "TODO", "text": ""}]
    json_data["description"] = data["description"]
    return json_data


def create_feat_json(data, old):
    json_data = {} if old is None else old.copy()
    json_data["name"] = data["name"]
    json_data["source"] = data["source"]
    json_data["traits"] = data["traits"]
    json_data["level"] = data["level"]

    if not "prerequisites" in json_data:
        if "archetype" in data and data["name"] != data["archetype"] + " Dedication":
            json_data["prerequisites"] = [
                "feat:" + data["archetype"] + " Dedication"]

    if not "bonus" in json_data:
        if "action" in data:
            json_data["bonus"] = [
                {"k": "action", "name": "#self", "actions": data["action"]},
                {"k": "bonus", "category": "TODO", "text": ""},
            ]
        else:
            json_data["bonus"] = [
                {"k": "bonus", "category": "TODO", "text": ""}]

    json_data["description"] = data["description"]
    return json_data


def open_file(changed_files, file):
    if file in changed_files:
        return changed_files[file]

    contents = {}
    try:
        with open(file) as f:
            contents = json.loads(f.read())
    except:
        pass

    changed_files[file] = contents
    return contents


def save_file(changed_files, file, contents):
    changed_files[file] = contents
    print(f"changed {file}")


def commit_changes(changed_files):
    prettier = ".\\node_modules\\.bin\\prettier.cmd"
    for file, contents in changed_files.items():
        data = json.dumps(contents)
        with open(file, "w") as f:
            f.write(data)
        subprocess.run([prettier, "--write", file], capture_output=True)
        print(f"wrote {file}")


def to_int(x):
    return 1 if x else 0


if __name__ == "__main__":
    requests_cache.install_cache()

    parser = argparse.ArgumentParser()
    parser.add_argument("--ancestry", "-a", action="append")
    parser.add_argument("--print-all-ancestries", "--PA", action="store_true")
    parser.add_argument("--all-ancestries", "-A", action="store_true")
    parser.add_argument("--background", "-b", action="append")
    parser.add_argument("--print-all-backgrounds", "--PB", action="store_true")
    parser.add_argument("--all-backgrounds", "-B", action="store_true")
    parser.add_argument("--class", "-c", action="append", dest="classes")
    parser.add_argument("--print-all-classes", "--PC", action="store_true")
    parser.add_argument("--all-classes", "-C", action="store_true")
    parser.add_argument("--all-ancestry-feats", "--FA", action="store_true")
    parser.add_argument("--ancestry-feats", "--Fa", action="append")
    parser.add_argument("--all-class-feats", "--FC", action="store_true")
    parser.add_argument("--class-feats", "--Fc", action="append")
    parser.add_argument("--all-general-feats", "--FG", action="store_true")
    parser.add_argument("--all-archetype-feats", "--FH", action="store_true")
    parser.add_argument("--feat", "-f", action="append")
    args = parser.parse_args()

    ancestries = []
    if args.all_ancestries:
        ancestries, _ = get_all_ancestries()
    elif args.ancestry != None:
        ancestries = args.ancestry

    backgrounds = []
    if args.all_backgrounds:
        backgrounds, _ = get_all_backgrounds()
    elif args.background != None:
        backgrounds = args.background

    classes = []
    if args.all_classes:
        classes, _ = get_all_classes()
    elif args.classes != None:
        classes = args.classes

    feats = []
    if args.all_ancestry_feats:
        ancestries1, _ = get_all_ancestries()
        for a in ancestries1:
            feats.extend(get_ancestry_or_class_feats(a))
    elif args.ancestry_feats != None:
        for a in args.ancestry_feats:
            feats.extend(get_ancestry_or_class_feats(a))
    elif args.class_feats != None:
        for c in args.class_feats:
            feats.extend(get_ancestry_or_class_feats(c))

    if args.all_general_feats:
        feats.extend(get_feats(BASE_URL + "Feats.aspx"))

    if args.all_archetype_feats:
        feats.extend(get_all_archetypes())
        # feats.extend()

    stuff_to_do = len(ancestries) + len(backgrounds) + len(classes) + len(feats) + to_int(
        args.print_all_ancestries) + to_int(args.print_all_backgrounds) + to_int(args.print_all_classes)
    if stuff_to_do == 0:
        parser.print_help()
        raise SystemExit

    changed_files = {}

    for url in ancestries:
        data = get_ancestry_detail(url)

        ancestry = data["name"].lower().replace(" ", "_")
        file_name = f"./src/pathfinder/ancestries/{ancestry}.json"

        old_data = open_file(changed_files, file_name)
        output = create_ancestry_json(data, old_data)
        save_file(changed_files, file_name, output)

    for url in backgrounds:
        data = get_background_detail(url)

        background = data["name"].lower().replace(" ", "_")
        file_name = f"./src/pathfinder/backgrounds/{background}.json"

        old_data = open_file(changed_files, file_name)
        output = create_background_json(data, old_data)
        save_file(changed_files, file_name, output)

    for url in classes:
        data = get_class_detail(url)

        clz = data["name"].lower().replace(" ", "_")
        file_name = f"./src/pathfinder/classes/{clz}.json"

        old_data = open_file(changed_files, file_name)
        output = create_class_json(data, old_data)
        save_file(changed_files, file_name, output)

    _, all_ancestry_names = get_all_ancestries()
    for url in feats:
        data = get_feat_detail(url, all_ancestry_names)
        file_name = f"./src/pathfinder/feats/{data['kind']}_{data['level']}.json"

        old_data = open_file(changed_files, file_name)
        old_feat_data = old_data.get(data["name"])
        feat_output = create_feat_json(data, old_feat_data)

        old_data[data["name"]] = feat_output
        output = {k: old_data[k] for k in sorted(old_data.keys())}
        save_file(changed_files, file_name, output)

    commit_changes(changed_files)

    if args.print_all_ancestries:
        _, names = get_all_ancestries()
        print("Ancestries:")
        print("\n".join(
            f"- {x}: ./src/pathfinder/ancestries/{x.lower()}.json" for x in names))

    if args.print_all_backgrounds:
        _, names = get_all_backgrounds()
        print("Backgrounds:")
        print("\n".join(
            f"- {x}: ./src/pathfinder/backgrounds/{x.lower()}.json" for x in names))

    if args.print_all_classes:
        _, names = get_all_classes()
        print("Classes:")
        print(
            "\n".join(f"- {x}: ./src/pathfinder/classes/{x.lower()}.json" for x in names))
