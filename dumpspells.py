import requests
import re
import json

data = requests.get("https://raw.githubusercontent.com/jimbarnesrtp/pf2/master/spells-pf2-v2.json").json()
out = {}
for spell in data["spells"]:
    real_name = re.sub(r"^(.*)(?: \(\w+\))$", "\\1", spell["name"]).lower()
    level = spell["level"]

    if isinstance(spell["level"], str):
        level = last_level

    out[real_name] = {
        "name": real_name,
        "traits": spell["traits"],
        "level": level,
        "traditions": list(map(lambda x: x.strip(), spell["traditions"].split(","))),
        "description": "",
    }
    last_level = level

f = open("test.json", "w")
f.write(json.dumps(out, indent=4))
f.close()

# goblin pox
# spider sting
# ghoulish cravings
# abyssal plague
# purple worm sting