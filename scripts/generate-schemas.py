import subprocess


def generate_schema(file, className, dest):
    cmd = ".\\node_modules\\.bin\\typescript-json-schema.cmd"
    p = subprocess.run([cmd, "--required", "--noExtraProps", "--aliasRefs",
                        '--defaultNumberType="integer"', file, className], capture_output=True)

    with open(dest, "w") as f:
        f.write(p.stdout.decode("utf-8"))

    print(f"created {dest}")


if __name__ == "__main__":
    generate_schema("./src/pathfinder/definitions.ts", "pf.Ancestry",
                    "./src/pathfinder/schemas/ancestry.schema.json")
    generate_schema("./src/pathfinder/definitions.ts", "pf.Background",
                    "./src/pathfinder/schemas/background.schema.json")
    generate_schema("./src/pathfinder/definitions.ts", "pf.Class",
                    "./src/pathfinder/schemas/class.schema.json")
    generate_schema("./src/pathfinder/definitions.ts", "pf.FeatDictionary",
                    "./src/pathfinder/schemas/feat.schema.json")
