"""Keep Galaxy_5's own scripts (module class, library symbols, timeline classes); resolve shared runtime classes from current Core."""
import json
import sys
import xml.etree.ElementTree as ET

MODULE = "com.robot.module.app.subMap.Galaxy_5"


def owned_name(name):
    package = name.rpartition(".")[0]
    return name == MODULE or not package or package.endswith("_fla")


def prune(source, destination):
    tree = ET.parse(source)
    root = tree.getroot()
    containers = root.findall("./tags/item[@type='DoABC2Tag']/abc")
    if len(containers) != 1:
        raise ValueError("Expected one Galaxy_5 ABC container")
    abc = containers[0]
    constants = abc.find("constants")
    strings = [node.text or "" for node in constants.find("constant_string")]
    namespaces = list(constants.find("constant_namespace"))
    multinames = list(constants.find("constant_multiname"))

    def qualified_name(index):
        name = multinames[int(index)]
        if name.get("kind") not in ("7", "13"):
            raise ValueError("Expected qualified script export")
        namespace = namespaces[int(name.get("namespace_index"))]
        prefix = strings[int(namespace.get("name_index"))]
        local = strings[int(name.get("name_index"))]
        return prefix + "." + local if prefix else local

    scripts = abc.find("script_info")
    owned = set()
    removed = 0
    for script in list(scripts):
        traits = script.findall("./traits/traits/item")
        names = [qualified_name(trait.get("name_index")) for trait in traits]
        if names and all(owned_name(name) for name in names):
            if any(trait.get("type") != "TraitClass" for trait in traits):
                raise ValueError("Unexpected non-class local script")
            owned.update(names)
        else:
            scripts.remove(script)
            removed += 1
    required = {MODULE, "galaxy_plant_5", "galaxy_my_icon"}
    if not required.issubset(owned) or removed == 0:
        raise ValueError("Unexpected Galaxy_5 script baseline")

    for symbols in root.findall("./tags/item[@type='SymbolClassTag']"):
        ids, names = symbols.find("tags"), symbols.find("names")
        if len(ids) != len(names):
            raise ValueError("Invalid SymbolClass table")
        for symbol_id, name in list(zip(ids, names)):
            if name.text not in owned:
                ids.remove(symbol_id)
                names.remove(name)
    tree.write(destination, encoding="utf-8", xml_declaration=True)
    print(json.dumps({"removedRuntimeScripts": removed, "keptScripts": sorted(owned)}))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: prune-spiral-galaxy-module.py input.xml output.xml")
    prune(sys.argv[1], sys.argv[2])
