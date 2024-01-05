import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import useSaved from "../hooks/useSaved";
import {
  IsTotemForm,
  Pokemon,
  getItemSprite,
  getSprite,
  isPartnerMon,
  isSamePokemon,
} from "../model/Pokemon";
import styles from "../page.module.scss";
import Image from "next/image";
import { SELECTION_MODES } from "../model/SelectionModes";
import { SAV } from "../model/SAV";
import { GAMES } from "../model/GAMES";
import { Species } from "../model/Species";
import { GameClient, PokemonClient } from "pokenode-ts";
import { Autocomplete, Collapse, Fade, TextField } from "@mui/material";
import PokemonIcon from "./PokemonIcon";
import BUTTONS from "../model/BUTTONS";

export default ({
  saveName,
  box: _box,
  setMoving,
  selected,
  setSelected,
  selectSave,
  transfer,
  isSelected,
  sortBox,
  swap,
  sav,
  isMoving,
  updateBox,
  updateSav,
  selectionMode,
  setButton,
  isGamepadSelected,
  gamepadHovering,
  setGamepadHovering,
  gamepadSelection,
}: {
  saveName: string;
  box: Pokemon[];
  selected: number[];
  setSelected: (c: (s: number[]) => number[]) => void;
  setMoving: () => void;
  selectSave: () => void;
  transfer: (pos?: number) => void;
  isSelected: boolean;
  isGamepadSelected: boolean;
  sortBox: (sorted: (Pokemon | null)[]) => void;
  swap: (a: number, b: number) => void;
  sav: SAV | null;
  isMoving: boolean;
  updateBox: () => void;
  updateSav: () => void;
  selectionMode: (typeof SELECTION_MODES)[keyof typeof SELECTION_MODES];
  setButton: (button: BUTTONS, callback: () => any) => void;
  gamepadHovering: number;
  setGamepadHovering: Dispatch<SetStateAction<number>>;
  gamepadSelection: number[];
}) => {
  const [currentBox, _setCurrentBox] = useSaved(1, `${saveName}-currentBox`);
  const [lastBox, setLastBox] = useState(currentBox);
  const setCurrentBox: Dispatch<SetStateAction<number>> = (cb) => {
    _setCurrentBox(cb);
    setLastBox(currentBox);
  };

  const [showFilters, setShowFilters] = useState(false);

  const [box, setBox] = useState<(Pokemon & { pos: number; shown: boolean })[]>(
    []
  );
  const [species, setSpecies] = useState<number[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    species: -1,
    type: "",
    IVs: {
      hp: {
        value: 0,
        operator: ">=",
      },
      atk: {
        value: 0,
        operator: ">=",
      },
      def: {
        value: 0,
        operator: ">=",
      },
      spa: {
        value: 0,
        operator: ">=",
      },
      spd: {
        value: 0,
        operator: ">=",
      },
      spe: {
        value: 0,
        operator: ">=",
      },
    },
  });
  // console.log(filters), [filters]);

  useEffect(() => {
    if (!isSelected) return;
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key == " ") {
        ev.preventDefault();
        ev.stopPropagation();
        setCurrentBox(lastBox);
      }
    };
    // const handleMouseDown = (ev: MouseEvent) => {
    //   console.log(ev.button);
    //   if (ev.button == 4 || ev.button == 3) {
    //     ev.preventDefault();
    //     ev.stopPropagation();
    //     if (ev.button == 4) nextBox();
    //     else previousBox();
    //   }
    // };
    window.addEventListener("keydown", handleKeyDown);
    // window.addEventListener("mousedown", handleMouseDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      // window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [isSelected, lastBox]);

  useEffect(() => {
    let first_index = box.findIndex(
      (pkm) => pkm.Species > 0 && pkm.Species == filters.species
    );
    if (first_index == -1) return;
    setCurrentBox(Math.ceil((first_index + 1) / (sav?.BoxSlotCount || 30)));
  }, [filters.species]);

  const filterBox = (pkm: Pokemon) => {
    let f =
      (filters.species == -1 || pkm.Species == filters.species) &&
      (filters.type == "" || pkm.Type == filters.type);
    if (!f) return false;
    if (pkm?.Species > 0)
      for (let [k, v] of Object.entries(filters.IVs)) {
        let iv = pkm?.[`IV_${k.toUpperCase()}` as keyof Pokemon] as number;
        if (iv == undefined) return false;
        switch (v.operator) {
          case "==":
            if (iv != v.value) return false;
            break;
          case "!=":
            if (iv == v.value) return false;
            break;
          case "<":
            if (iv >= v.value) return false;
            break;
          case ">=":
            if (iv < v.value) return false;
            break;
          case "<=":
            if (iv > v.value) return false;
            break;
        }
      }
    return true;
  };
  useEffect(() => {
    setBox([
      ..._box.map((pkm, i) => ({
        ...pkm,
        pos: i,
        shown: filterBox(pkm),
      })),
    ]);
  }, [_box, filters]);

  useEffect(() => {
    setSpecies([
      -1,
      ...box
        .filter((pkm, i) => pkm.Species > 0)
        .map((pkm) => pkm.Species)
        .filter((v, i, a) => a.indexOf(v) === i),
    ]);
    setFormats([
      "",
      ...box
        .filter((pkm, i) => pkm.Species > 0)
        .map((pkm) => pkm.Type)
        .filter((v, i, a) => a.indexOf(v) === i),
    ]);
  }, [box]);

  useEffect(() => {
    if (currentBox > Math.ceil(box.length / (sav?.BoxSlotCount || 30)))
      setCurrentBox(1);
    else if (currentBox < 1)
      setCurrentBox(Math.ceil(box.length / (sav?.BoxSlotCount || 30)));
  }, [currentBox]);
  const [moveOverMode, setMoveOverMode] = useState<boolean | undefined>();

  const dexSorted = () =>
    _box
      .filter((p) => p.Species > 0)
      .sort((a, b) => a.Species - b.Species)
      .sort((a, b) => {
        if (a.Species == b.Species) return a.Form - b.Form;
        return 0;
      })
      .sort((a, b) => {
        if (a.Species == b.Species && a.Form == b.Form) {
          if (a.IsShiny && !b.IsShiny) return -1;
          if (!a.IsShiny && b.IsShiny) return 1;
        }
        return 0;
      })
      .sort((a, b) => {
        if (
          a.Species == b.Species &&
          a.Form == b.Form &&
          a.IsShiny == b.IsShiny
        ) {
          if (a.IsEgg && !b.IsEgg) return -1;
          if (!a.IsEgg && b.IsEgg) return 1;
        }
        return 0;
      })
      .sort((a, b) => {
        if (
          a.Species == b.Species &&
          a.Form == b.Form &&
          a.IsShiny == b.IsShiny &&
          a.IsEgg == b.IsEgg
        )
          return b.IVTotal - a.IVTotal;

        return 0;
      });

  useEffect(() => {
    if (!sav) return;
    let c = gamepadHovering % (sav?.BoxSlotCount || 30);
    // console.log(
    //   "c",
    //   c,
    //   (currentBox - 1) * (sav?.BoxSlotCount || 30),
    //   (c + (currentBox - 1) * (sav?.BoxSlotCount || 30)) %
    //     (sav?.BoxSlotCount || 30)
    // );
    let h = (currentBox - 1) * (sav?.BoxSlotCount || 30);
    setGamepadHovering(h);
  }, [sav, currentBox, isGamepadSelected]);

  const nextBox = () =>
    setCurrentBox((c) => {
      if (c >= Math.ceil(box.length / (sav?.BoxSlotCount || 30))) return 1;
      return c + 1;
    });
  const previousBox = () =>
    setCurrentBox((c) => {
      if (c == 1) return Math.ceil(box.length / (sav?.BoxSlotCount || 30));
      return c - 1;
    });

  useEffect(() => {
    if (isGamepadSelected) {
      setButton(BUTTONS.R, () => nextBox());
      setButton(BUTTONS.PLUS, () => {
        setCurrentBox(1);
      });

      setButton(BUTTONS.L, () => previousBox());
    }
  }, [isGamepadSelected, currentBox, sav, box]);
  // useEffect(() => {
  //   if (!isGamepadSelected) return;
  //   let bsc = sav?.BoxSlotCount || 30;
  //   let bl = bsc / 5;
  //   let c = Math.ceil((gamepadHovering + 1) / bl) * bl - currentBox * 30;
  //   console.log(c);
  //   if (c > 0) {
  //     if (currentBox < Math.ceil(box.length / bsc)) nextBox();
  //   } else if (c <= -bsc) {
  //     if (currentBox > 1) previousBox();
  //   }
  // }, [gamepadHovering, currentBox, isGamepadSelected, box]);

  return (
    <div className={styles.saveInfoContainerParent}>
      <h1>{saveName == "home" ? "HOME" : GAMES[sav?.Game || 0]}</h1>
      <h1
        style={
          isGamepadSelected
            ? {
                color: "#33f",
              }
            : {}
        }
      >
        {sav && sav?.BoxNames[currentBox - 1] ? (
          sav?.BoxNames[currentBox - 1]
        ) : (
          <>BOX {currentBox}</>
        )}
      </h1>
      <div>
        <select
          value={currentBox}
          onChange={(ev) => {
            setCurrentBox(parseInt(ev.target.value));
          }}
        >
          {Array.from(
            {
              length: Math.ceil(box.length / (sav?.BoxSlotCount || 30)),
            },
            (_, i) => i + 1
          ).map((i) => (
            <option
              key={i}
              value={i}
              style={
                !box.slice((i - 1) * 30, i * 30).some((s) => s.shown)
                  ? {
                      backgroundColor: "#222",
                      color: "#444",
                    }
                  : {}
              }
            >
              {sav && sav?.BoxNames[i - 1] ? (
                sav?.BoxNames[i - 1]
              ) : (
                <>BOX {i}</>
              )}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Autocomplete
          options={species}
          getOptionLabel={(option) =>
            option == -1 ? "SHOW ALL" : Species[option] || ""
          }
          value={filters.species}
          onChange={(ev, value) => {
            let _filters = { ...filters };
            _filters.species = value ?? -1;
            setFilters(_filters);
          }}
          sx={{
            width: 300,
          }}
          renderInput={(params) => (
            <div ref={params.InputProps.ref}>
              <input type="text" {...params.inputProps} />
            </div>
          )}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          flexDirection: "column",
        }}
      >
        <button
          onClick={() => {
            setShowFilters((s) => !s);
          }}
          style={{
            transition: "all 0.2s ease",
          }}
        >
          {showFilters ? "HIDE" : "SHOW"} FILTERS
        </button>
        {showFilters && (
          <div
            style={{
              margin: "16px 0",
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              flexDirection: "column",
            }}
          >
            <Autocomplete
              options={formats}
              getOptionLabel={(option) =>
                option == "" ? "SHOW ALL" : `${option}` || ""
              }
              value={filters.type}
              onChange={(ev, value) => {
                let _filters = { ...filters };
                _filters.type = value ?? "";
                setFilters(_filters);
              }}
              sx={{
                width: 300,
              }}
              renderInput={(params) => (
                <div ref={params.InputProps.ref}>
                  <input type="text" {...params.inputProps} />
                </div>
              )}
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                justifyContent: "center",
                alignContent: "center",
              }}
            >
              {(["hp", "atk", "def", "spa", "spd", "spe"] as const).map((v) => (
                <div
                  key={v}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: 8,
                    alignItems: "center",
                    justifyContent: "space-evenly",
                    alignContent: "center",
                    width: "100%",
                  }}
                >
                  <div style={{ width: "3em" }}>{v.toUpperCase()}</div>
                  <input
                    onBlur={(ev) => {
                      let _filters = { ...filters };
                      let iv = Math.min(
                        31,
                        Math.max(0, parseInt(ev.target.value))
                      );
                      ev.target.value = iv.toString();
                      _filters.IVs[v].value = iv;
                      setFilters(_filters);
                    }}
                    defaultValue={filters.IVs[v].value}
                    type="number"
                    style={{
                      width: "3em",
                    }}
                    max={31}
                    min={0}
                  />
                  <select
                    style={{
                      width: "3em",
                    }}
                    defaultValue={filters.IVs[v].operator}
                    onChange={(ev) => {
                      let _filters = { ...filters };
                      _filters.IVs[v].operator = ev.target.value;
                      setFilters(_filters);
                    }}
                  >
                    <option>==</option>
                    <option>!=</option>
                    <option>&lt;</option>
                    <option>&gt;=</option>
                    <option>&lt;=</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className={styles.buttons}>
        {isSelected ? (
          selected.length > 0 && (
            <button onClick={() => setSelected(() => [])}>UNSELECT</button>
          )
        ) : (
          <button
            onClick={() => {
              transfer();
            }}
          >
            TRANSFER SELECTED
          </button>
        )}
        <button onClick={updateBox}>UPDATE BOX</button>
        <button onClick={updateSav}>UPDATE SAV</button>
      </div>
      <div className={styles.saveInfoContainer}>
        <div>
          <div className={styles.buttons}>
            <button
              onClick={() => {
                sortBox(dexSorted());
              }}
            >
              SORT BY DEX ORDER
            </button>
            <button
              onClick={() => {
                sortBox(
                  _box
                    .filter((p) => p.Species > 0)
                    .sort(() => Math.random() - 0.5)
                );
              }}
            >
              SORT BY RANDOM
            </button>
            <button
              onClick={() => {
                let max = box.reduce((a, b) => Math.max(a, b.Species), 1);
                // console.log(max);
                let _sorted = dexSorted();
                let sorted = [] as (Pokemon | null)[];

                for (let i = 1; i <= max; i++) {
                  let pkm = _sorted.findIndex((p) => p.Species == i);
                  if (pkm == -1) sorted.push(null);
                  else sorted.push(_sorted[pkm]);
                }
                for (let j = 0; j < 10; j++) sorted.push(null);

                _sorted
                  .filter((p) => !sorted.includes(p))
                  .forEach((p) => sorted.push(p));
                // console.log(sorted);
                sortBox(sorted);

                // sortBox(
                //   box
                //     .filter((p) => p.Species > 0)
                //     .sort((a, b) => a.Species - b.Species)
                //     .sort((a, b) => {
                //       if (a.Species == b.Species) return a.Form - b.Form;
                //       return 0;
                //     })
                //     .sort((a, b) => {
                //       if (a.Species == b.Species && a.Form == b.Form) {
                //         if (a.IsShiny && !b.IsShiny) return -1;
                //         if (!a.IsShiny && b.IsShiny) return 1;
                //       }
                //       return 0;
                //     })
                // );
              }}
            >
              SORT BY DEX ORDER (SKIPPING)
            </button>
          </div>
          <div className={styles.box_parent}>
            <div className={styles.arrows}>
              <button
                onClick={() => {
                  previousBox();
                }}
              >
                {"<"}
              </button>
              <button
                onClick={() => {
                  nextBox();
                }}
              >
                {">"}
              </button>
            </div>
            <div
              className={styles.box}
              style={{ ["--cols" as any]: (sav?.BoxSlotCount || 30) / 5 }}
              onMouseDown={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                // if (ev.button == 4) nextBox();
                // else if (ev.button == 3) previousBox();
                setMoveOverMode(undefined);
                setMoving();
              }}
              onDragStart={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
              }}
              onContextMenu={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
              }}
            >
              {box
                .slice(
                  (currentBox - 1) * (sav?.BoxSlotCount || 30),
                  currentBox * (sav?.BoxSlotCount || 30)
                )
                .map((pkm, indexInOperationalBox) => {
                  return (
                    <PokemonIcon
                      gamepadSelection={
                        isGamepadSelected ? gamepadSelection : []
                      }
                      isHoveredByGamepad={
                        isGamepadSelected && gamepadHovering == pkm.pos
                      }
                      saveName={saveName}
                      key={pkm.pos}
                      box={box}
                      isMoving={isMoving}
                      isSaveSelected={isSelected}
                      moveOverMode={moveOverMode}
                      sav={sav}
                      pkm={pkm}
                      selected={selected}
                      selectionMode={selectionMode}
                      setMoveOverMode={setMoveOverMode}
                      setMoving={setMoving}
                      setSelected={setSelected}
                      swap={swap}
                      transfer={transfer}
                      party={false}
                    />
                  );
                })}
            </div>

            {saveName != "home" &&
              !(sav?.Game == GAMES.GE || sav?.Game == GAMES.GP) && (
                <div
                  className={styles.box}
                  style={{
                    ["--cols" as any]: 6,
                    ["--rows" as any]: 1,
                    marginTop: 16,
                  }}
                >
                  {sav?.PartyData.map((pkm, i) => (
                    <PokemonIcon
                      gamepadSelection={
                        isGamepadSelected ? gamepadSelection : []
                      }
                      saveName={saveName}
                      key={i}
                      box={box}
                      isMoving={isMoving}
                      isHoveredByGamepad={
                        isGamepadSelected && gamepadHovering == -(i + 1)
                      }
                      isSaveSelected={isSelected}
                      moveOverMode={moveOverMode}
                      sav={sav}
                      party={true}
                      pkm={{ ...pkm, shown: true, pos: -(i + 1) }}
                      selected={selected}
                      selectionMode={selectionMode}
                      setMoveOverMode={setMoveOverMode}
                      setMoving={setMoving}
                      setSelected={setSelected}
                      swap={swap}
                      transfer={transfer}
                    />
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
