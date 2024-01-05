"use client";

import Image from "next/image";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import {
  IsTotemForm,
  Pokemon,
  cleanPokemonData,
  getSprite,
  isSamePokemon,
} from "./model/Pokemon";
import useSaved from "./hooks/useSaved";
import SaveInfo from "./components/SaveInfo";
import axios from "axios";
import { SELECTION_MODES } from "./model/SelectionModes";
import { GAMES } from "./model/GAMES";
import { SAV } from "./model/SAV";
import { Species } from "./model/Species";
import { wait } from "./utils/TimeUtils";
import BUTTONS from "./model/BUTTONS";

export default function Home() {
  const [saves, _setSaves, savesLoaded] = useSaved<string[]>([], "saves");
  const setSaves = (c: (s: string[]) => string[]) => {
    let _saves = c(saves);
    _saves = _saves.map((s) => s.replace(/\\/g, "/").trim());
    _saves = _saves.filter((s) => s).filter((s, i) => i == _saves.indexOf(s));
    _setSaves(_saves);
  };
  async function loadBox(save: string) {
    try {
      let res = await axios.post(`${URL}/box/get`, {
        path: save,
      });
      let b = (await res.data) as Pokemon[];
      // console.log(b);
      // .then((res) => res.text())
      // console.log(b);
      if (!(b && Array.isArray(b)))
        throw new Error("Invalid box data for " + save);
      setBoxes((_b) => ({
        ..._b,
        [save]: b.map((_p: Pokemon) => cleanPokemonData(_p)),
      }));
    } catch (err) {
      console.error(err);
      alert("Error loading boxes from save " + save);
      setBoxes((b) => ({ ...b, [save]: null }));
    }
  }

  async function loadBoxes() {
    if (saves.length == 0) return;
    // if (!URL) return;
    let promises = [];
    for (let save of saves) promises.push(loadBox(save));
    await Promise.allSettled(promises);
  }

  async function loadSave(save: string) {
    try {
      let res = await axios.post(`${URL}/sav/get`, {
        path: save,
      });
      let b = (await res.data) as SAV;
      b.BoxNames = JSON.parse(b.BoxNames as unknown as string);
      b.PartyData = JSON.parse(b.PartyData as unknown as string).map(
        (p: Pokemon) => cleanPokemonData(p)
      );
      b.PokeDex = JSON.parse(b.PokeDex as unknown as string).map(
        cleanPokemonData
      );
      b.Generation = parseInt(b.Generation as unknown as string);
      b.BoxSlotCount = parseInt(b.BoxSlotCount as unknown as string);
      b.BoxCount = parseInt(b.BoxCount as unknown as string);
      b.BoxesUnlocked = parseInt(b.BoxesUnlocked as unknown as string);
      b.Game = parseInt(b.Game as unknown as string) as GAMES;
      setSaveInfo((_b) => ({
        ..._b,
        [save]: b,
      }));
    } catch (err) {
      console.error(err);
      alert("Error loading save " + save);
      setBoxes((b) => ({ ...b, [save]: null }));
    }
  }
  async function loadSaves() {
    if (saves.length == 0) return;
    // if (!URL) return;
    let promises = [];
    for (let save of saves) promises.push(loadSave(save));
    await Promise.allSettled(promises);
  }

  const [URL, setURL] = useSaved<string | null>("/reroute", "URL");
  useEffect(() => {
    if (location.hostname == "localhost") setURL("http://localhost:8080");
    else setURL("/reroute");
  }, []);
  const [alerts, setAlerts] = useState<string[]>([]);
  const alert = (msg: string) => {
    console.warn(msg);
    setAlerts((a) => [...a, msg]);
    setTimeout(() => {
      setAlerts((a) => a.slice(1));
    }, 2000);
  };
  useEffect(() => {
    if (!savesLoaded) return;
    if (!saves.includes("home")) setSaves((s) => ["home", ...s]);
  }, [saves, savesLoaded]);
  const [boxes, setBoxes] = useState<Record<string, Pokemon[] | null>>({});

  const getBox = (saveName: string) => {
    let box = boxes[saveName];
    let sav = saveInfo[saveName];
    if (!box || !sav) return [];
    for (let i = 0; i < 6; i++) box[-(i + 1)] = sav.PartyData[i];
    return box;
  };
  const [saveInfo, setSaveInfo] = useState<Record<string, SAV | null>>({});
  const [isMoving, setMoving] = useState(false);
  const [selectionMode, setSelectionMode] = useSaved<number>(
    0,
    "selectionMode"
  );
  const [position, setPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  useEffect(() => {
    // console.log(selectedSave);
    if (!isMoving) return;
    const onmove = (ev: MouseEvent) => {
      if (SELECTION_MODES[selectionMode] == "multiple") return;
      setPosition((pos) => ({
        x: ev.clientX,
        y: ev.clientY,
      }));
    };
    const onup = (ev: MouseEvent) => {
      setMoving(false);
      setPosition(null);
    };
    document.addEventListener("mousemove", onmove);
    document.addEventListener("mouseup", onup);
    return () => {
      document.removeEventListener("mousemove", onmove);
      document.removeEventListener("mouseup", onup);
    };
  }, [isMoving]);
  async function addSave() {
    let path = prompt("Enter save path");
    if (path) setSaves((s) => [...s, path!]);
  }

  const transfer = async (save: string, pos?: number) => {
    if (selected.length <= 0) return;
    if (
      saveInfo[selectedSave!]?.Game != GAMES.GP &&
      saveInfo[selectedSave!]?.Game != GAMES.GE &&
      (saveInfo[save]?.Game == GAMES.GP || saveInfo[save]?.Game == GAMES.GE)
    ) {
      alert("Can't transfer pokemon to Go");
      return;
    }
    if (
      saveInfo[save]!.Generation > 7 &&
      (saveInfo[selectedSave!]?.Game == GAMES.GP ||
        saveInfo[selectedSave!]?.Game == GAMES.GE) &&
      !confirm(
        "Are you sure you want to transfer pokemon from Go? (You can't transfer them back)"
      )
    )
      return;
    // console.log(saveInfo[selectedSave!]?.);
    let selectedbox = getBox(selectedSave!)!;
    let _selected = [...selected].sort((a, b) => a - b);
    if (save != "home") {
      let notIncluded = _selected
        .map((p) => selectedbox[p])
        .filter((p) => {
          return (
            saveInfo[save]!.PokeDex.findIndex(
              (pkm) => pkm.Species == p!.Species && p.Form == pkm.Form
            ) == -1
          );
        });
      if (notIncluded.length > 0) {
        let text = `Can't transfer the following pokemon because they are not in this game's dex\n${notIncluded
          .map((p) => Species[p.Species] + (p.Form > 0 ? ` (${p.Form})` : ""))
          .join(", ")}`;
        if (notIncluded.length < _selected.length) {
          text += "\nDo you want to transfer the rest?";
          if (!confirm(text)) return;
        } else {
          alert(text);
          return;
        }
        _selected = _selected.filter(
          (p) =>
            notIncluded.findIndex(
              (pn) =>
                pn.Species != selectedbox[p].Species &&
                pn.Form != selectedbox[p].Form
            ) == -1
        );
      }
    }
    let compareGens = (pkm: Pokemon, sav: SAV): 0 | 1 | -1 => {
      let savGen = sav.Generation;
      let pkmGen = pkm.Format;
      if (pkmGen == 7 && pkm.Type == "PB7") pkmGen = 8;
      if (pkmGen == savGen) return 0;
      if ((pkmGen == 8 && savGen == 9) || (pkmGen == 9 && savGen == 8))
        return 0;
      if (pkmGen > savGen) return 1;
      if (pkmGen < savGen) return -1;
      return 0;
    };
    let older = selected
      .map((p) => selectedbox[p])
      .some((p) => compareGens(p!, saveInfo[save]!) == -1);
    let newer = selected
      .map((p) => selectedbox[p])
      .some((p) => compareGens(p!, saveInfo[save]!) == 1);
    if (save != "home") {
      if (newer) {
        alert("Can't transfer pokemon to older generations");
        return;
      }
      if (
        older &&
        !confirm(
          `Are you sure you want to transfer ${
            selected.length > 1 ? "these" : "this"
          } pokemon to a newer generation?`
        )
      )
        return;
    }
    let selectedSize = selected.length;
    let emptySpaces = [] as number[];
    let firstPos = _selected.reduce((a, b) => Math.min(a, b));
    // console.log(_selected, pos);
    let goHome = false;
    for (let j = 0; j < _selected.length; j++) {
      for (
        let i = (pos ?? 0) + (_selected[j] - firstPos);
        i < getBox(save)!.length;
        i++
      ) {
        // console.log(i, pos ?? 0, _selected[j], firstPos);
        if (
          !emptySpaces.includes(i) &&
          (getBox(save)![i].Species == 0 ||
            (selectedSave == save && _selected.includes(i)))
        ) {
          if (selectedSave == save && _selected.includes(i)) goHome = true;
          emptySpaces.push(i);
          break;
        }
        if (emptySpaces.length >= selectedSize) break;
      }
    }

    if (emptySpaces.length < selectedSize) {
      if (save == "home") {
        let p = emptySpaces[emptySpaces.length - 1] + 1;
        for (let i = emptySpaces.length; i < selectedSize; i++) {
          emptySpaces.push(p);
          p++;
        }
      } else {
        alert("Not enough space in box");
        return;
      }
    }
    // console.log(selectedSave, save, selected, emptySpaces);
    setSelected([]);
    let homeEmptySpaces = [] as number[];
    if (goHome && selectedSave != "home" && save != "home") {
      let home = getBox("home");
      for (let i = 0; i < home!.length; i++) {
        if (i > home!.length || home![i].Species == 0) homeEmptySpaces.push(i);
      }
      await movePokemon(
        {
          path: selectedSave!,
          boxPosList: _selected,
        },
        {
          path: "home",
          boxPosList: homeEmptySpaces,
        }
      );
    }
    await movePokemon(
      {
        path: goHome ? "home" : selectedSave!,
        boxPosList: goHome ? homeEmptySpaces : _selected,
      },
      {
        path: save,
        boxPosList: emptySpaces,
      }
    );
    loadBox(save);
    loadBox(selectedSave!);
    loadSave(save);
    loadSave(selectedSave!);
  };

  const swapPokemon = async (
    from: { path: string; boxPosList: number | number[] },
    to: { path: string; boxPosList: number | number[] }
  ) => movePokemon(from, to, true);

  async function movePokemon(
    from: { path: string; boxPosList: number | number[] },
    to: { path: string; boxPosList: number | number[] },
    swap = false
  ) {
    // if (!URL) {
    //   alert("Something went wrong");
    //   return false;
    // }
    let fromBox = getBox(from.path);
    let toBox = getBox(to.path);
    if (!Array.isArray(from.boxPosList)) from.boxPosList = [from.boxPosList];
    if (!Array.isArray(to.boxPosList)) to.boxPosList = [to.boxPosList];
    for (let i = 0; i < from.boxPosList.length; i++) {
      let fp = from.boxPosList[i];
      let tp = to.boxPosList[i];
      let fromPokemon = {
        ...cloneObject(fromBox![fp]),
        moving: true,
      };
      let toPokemon = {
        ...cloneObject(toBox![tp]),
        moving: true,
      };
      if (!fromPokemon) fromPokemon = { Species: 0 } as any;
      if (!toPokemon) toPokemon = { Species: 0 } as any;
      if (to.path != "home") {
        fromPokemon.Format = saveInfo[to.path]!.Generation;
        fromPokemon.Type = saveInfo[to.path]!.PKMType;
      }
      if (from.path != "home") {
        toPokemon.Format = saveInfo[from.path]!.Generation;
        toPokemon.Type = saveInfo[from.path]!.PKMType;
      }
      if (fp < 0) {
        setSaveInfo((b) => {
          if (!b) return b;
          let _b = { ...b };
          let partyData = _b[from.path]!.PartyData;
          partyData[-(fp + 1)] = toPokemon;
          _b[from.path]!.PartyData = partyData;
          return _b;
        });
      } else
        setBoxes((b) => ({
          ...b,
          [from.path]: b[from.path]!.map((p, i) => (i == fp ? toPokemon : p)),
        }));

      if (tp < 0) {
        setSaveInfo((b) => {
          if (!b) return b;
          let _b = { ...b };
          let partyData = _b[to.path]!.PartyData;
          partyData[-(tp + 1)] = fromPokemon;
          _b[to.path]!.PartyData = partyData;
          return _b;
        });
      } else
        setBoxes((b) => ({
          ...b,
          [to.path]: b[to.path]!.map((p, i) => (i == tp ? fromPokemon : p)),
        }));
    }

    try {
      let res = await axios.post(`${URL}/pkm/${swap ? "swap" : "move"}`, {
        from,
        to,
      });
      if (res.status != 200) throw new Error(await res.data());
      // console.log(await res.text());
      return true;
    } catch (err) {
      alert("Error moving pokemon");

      return false;
    }
  }

  useEffect(() => {
    if (!savesLoaded) return;
    loadBoxes();
    loadSaves();
  }, [saves, savesLoaded]);

  // useEffect(() => {
  //   let keys = Object.keys(boxes);
  //   if (keys.length < saves.length) return;
  //   let transformedBoxes = [];
  //   for (let key of keys) {
  //     let box = boxes?.[key]?.slice(0, 30);
  //     if (!box) continue;
  //     transformedBoxes.push(box);
  //   }
  //   console.log(transformedBoxes);
  // }, [boxes]);

  const [selected, setSelected] = useState<number[]>([]);
  const [selectedSave, setSelectedSave] = useState<string | null>(null);
  // const [tooltip, setTooltip] = useState<{
  //   pos: { x: number; y: number };
  //   text: string;
  // } | null>(null);

  useEffect(() => {
    if (selectedSave) return;
    if (saves.length == 0) return;
    setSelectedSave(saves[0]);
  }, [selectedSave, saves]);

  function SelectedDisplay() {
    if (selected.length == 0) return null;
    const rows = [...Array(5)] as [
      (Pokemon | null)[],
      (Pokemon | null)[],
      (Pokemon | null)[],
      (Pokemon | null)[],
      (Pokemon | null)[]
    ];
    let firstPos =
      Math.floor(selected.reduce((a, b) => Math.min(a, b)) / 30) * 30;
    let offset = selected.reduce((pv, cv) => (cv < 0 ? pv + 1 : pv), 0);
    // console.log(firstPos);
    for (let i = 0; i < 5; i++) {
      rows[i] = [...Array(6)];
      for (let j = 0; j < 6; j++) {
        let box = getBox(selectedSave!)!;
        let pos = firstPos + offset + i * 6 + j;
        if (selected.includes(pos)) rows[i][j] = box[pos];
        else rows[i][j] = null;
      }
    }
    // console.log(rows);
    const isRowEmpty = (row: (Pokemon | null)[]) => {
      if (!row) return true;
      for (let p of row) if (p) return false;
      return true;
    };
    const isColEmpty = (col: (Pokemon | null)[]) => {
      if (!col) return true;
      for (let p of col) if (p) return false;
      return true;
    };
    let emptyRows = 0;
    for (let i = 0; i < 5; i++) {
      if (isRowEmpty(rows[i])) {
        emptyRows++;
      } else {
        break;
      }
    }
    for (let i = 0; i < emptyRows; i++) rows.shift();

    let emptyCols = 0;
    for (let i = 0; i < 6; i++) {
      if (isColEmpty(rows.map((r) => r[i]))) {
        // rows.forEach((r) => r.splice(i, 1));
        emptyCols++;
      } else {
        break;
      }
    }
    for (let i = 0; i < emptyCols; i++) {
      rows.forEach((r) => r.shift());
    }
    return rows.map((row, i) => (
      <div
        key={i}
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 8,
        }}
      >
        {row.map((pkm, j) =>
          pkm ? (
            <div
              key={j}
              className={`${styles.pokemon}${
                IsTotemForm(pkm) ? " " + styles.totem : ""
              } ${styles.selected}`}
            >
              <Image
                alt={`${pkm.Species}`}
                width={68}
                height={selectedSave == "home" ? 68 : 56}
                src={getSprite(
                  pkm,
                  selectedSave ? saveInfo[selectedSave] : null
                )}
                onDragStart={(ev) => {
                  ev.preventDefault();
                }}
              />
            </div>
          ) : (
            <div
              key={j}
              style={{
                width: 82,
                height: 82,
              }}
            />
          )
        )}
      </div>
    ));
  }

  function cloneObject<T>(obj: T): T {
    if (typeof obj == "string") return `${obj}` as T;
    if (typeof obj == "number") return (obj * 1) as T;
    if (typeof obj == "boolean") return !!obj as T;
    if (typeof obj == "undefined") return undefined as T;
    if (obj == null) return null as T;
    if (typeof obj != "object") return obj as T;
    let isArray = Array.isArray(obj);
    let clone = (isArray ? [] : {}) as T;
    if (isArray)
      for (let i = 0; i < (obj as any[]).length; i++)
        (clone as any[])[i] = cloneObject((obj as any[])[i]);
    else for (let key in obj) (clone as any)[key] = cloneObject(obj[key]);
    return (isArray ? [...(clone as any[])] : { ...clone }) as T;
  }

  useEffect(() => {
    if (!selectedSave) return;

    setSelected((s) => {
      let box = getBox(selectedSave);
      if (!box) return s;
      let _s = [...s];

      for (let i = 0; i < selected.length; i++) {
        let pos = selected[i];
        if (box[pos].Species == 0) _s.splice(_s.indexOf(i), 1);
      }
      return _s;
    });
  }, [boxes, selectedSave]);
  const [tooltipRef, setTooltipRef] = useState<HTMLElement | null>(null);
  useEffect(() => {
    // console.log(tooltipRef);
  }, [tooltipRef]);

  const [isGamePadConnected, setIsGamePadConnected] = useState(false);
  const [useGamepad, setUseGamepad] = useSaved(false, "useGamepad");
  const [gamepadSelectedSave, setGamepadSelectedSave] = useState<string | null>(
    null
  );
  useEffect(() => {
    if (!selectedSave) return;
    setGamepadSelectedSave(selectedSave);
  }, [selectedSave]);
  useEffect(() => {
    // console.log("gamepadSelectedSave", gamepadSelectedSave);
  }, [gamepadSelectedSave]);
  useEffect(() => {
    // console.log("selectedSave", selectedSave);
  }, [selectedSave]);

  useEffect(() => {
    const onGamepadConnected = (ev: GamepadEvent) => {
      setIsGamePadConnected(true);
    };
    const onGamepadDisconnected = (ev: GamepadEvent) => {
      setIsGamePadConnected(false);
    };
    window.addEventListener("gamepadconnected", onGamepadConnected);
    window.addEventListener("gamepaddisconnected", onGamepadDisconnected);
    return () => {
      window.removeEventListener("gamepadconnected", onGamepadConnected);
      window.removeEventListener("gamepaddisconnected", onGamepadDisconnected);
    };
  }, []);

  const [gamepadButtons, _setGamepadButtons] = useState<
    Partial<Record<BUTTONS, null | (() => any)>>
  >({});
  const setButton = (button: BUTTONS, callback: () => any) => {
    _setGamepadButtons((b) => ({ ...b, [button]: callback }));
  };
  const [gamepadHovering, setGamepadHovering] = useState(0);
  useEffect(() => {
    if (gamepadSelectedSave == "home" && gamepadHovering < 0)
      setGamepadHovering(0);
    if (gamepadSelectedSave != "home" && gamepadHovering < -6)
      setGamepadHovering(-6);
    if (gamepadHovering > (boxes[gamepadSelectedSave!]?.length || 30) - 1)
      setGamepadHovering((boxes[gamepadSelectedSave!]?.length || 30) - 1);
  }, [gamepadHovering, gamepadSelectedSave]);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [gamepadSelection, setGamepadSelection] = useState<number[]>([]);
  useEffect(() => {
    setButton(BUTTONS.ZR, () => {
      setGamepadSelectedSave((s) => {
        let i = 0;
        if (s) {
          i = saves.indexOf(s);
          i++;
        }
        if (i >= saves.length) i = 0;
        return saves[i];
      });
    });
    setButton(BUTTONS.ZL, () => {
      setGamepadSelectedSave((s) => {
        let i = 0;
        if (s) {
          i = saves.indexOf(s);
          i--;
        }
        if (i < 0) i = saves.length - 1;
        return saves[i];
      });
    });
    setButton(BUTTONS.A, () => {
      // console.log(gamepadSelectedSave);
      let _selected = [...selected];
      if (selectedSave != gamepadSelectedSave) {
        setSelectedSave(gamepadSelectedSave);
        setSelected([]);
        _selected = [];
      }
      if (SELECTION_MODES[selectionMode] == "select") {
        if (!gamepadSelectedSave) return;
        let pkm = boxes[gamepadSelectedSave]?.[gamepadHovering];
        if (!pkm || pkm.Species == 0) {
          if (selected.length > 0) {
            transfer(gamepadSelectedSave, gamepadHovering);
          }
          return;
        }
        if (_selected.includes(gamepadHovering)) {
          setSelected(_selected.filter((v) => v != gamepadHovering));
        } else {
          setSelected([..._selected, gamepadHovering]);
        }
      } else if (SELECTION_MODES[selectionMode] == "multiple") {
        if (selectionStart == null) {
          setSelectionStart(gamepadHovering);
        } else {
          setSelected(
            [..._selected, ...gamepadSelection].filter(
              (v, i, a) => a.indexOf(v) == i
            )
          );
          setSelectionStart(null);
          setGamepadSelection([]);
        }
      }
    });
    setButton(BUTTONS.B, () => {
      if (selectionStart != null) setGamepadSelection([]);
      else setSelected([]);
      setSelectionStart(null);
    });
    setButton(BUTTONS.LEFT, () => {
      setGamepadHovering((h) => h - 1);
    });
    setButton(BUTTONS.RIGHT, () => {
      setGamepadHovering((h) => h + 1);
    });
    setButton(BUTTONS.UP, () => {
      setGamepadHovering(
        (h) =>
          h -
          (gamepadSelectedSave
            ? (saveInfo[gamepadSelectedSave]?.BoxSlotCount || 30) / 5
            : 6)
      );
    });
    setButton(BUTTONS.DOWN, () => {
      setGamepadHovering(
        (h) =>
          h +
          (gamepadSelectedSave
            ? (saveInfo[gamepadSelectedSave]?.BoxSlotCount || 30) / 5
            : 6)
      );
    });
    setButton(BUTTONS.Y, () => {
      setSelectionMode((s) => (s + 1) % SELECTION_MODES.length);
    });
  }, [
    gamepadSelectedSave,
    boxes,
    selected,
    gamepadHovering,
    selectionMode,
    gamepadSelection,
  ]);

  useEffect(() => {
    if (SELECTION_MODES[selectionMode] != "multiple" || selectionStart == null)
      return;
    let start = selectionStart;
    let end = gamepadHovering;
    let bl = gamepadSelectedSave
      ? (saveInfo[gamepadSelectedSave]?.BoxSlotCount || 30) / 5
      : 6;
    let left = gamepadHovering % bl < selectionStart % bl;
    let top = selectionStart > gamepadHovering;
    if (left) {
      if (top) {
        start = gamepadHovering;
        end = selectionStart;
      } else {
        let off = (selectionStart % bl) - (gamepadHovering % bl);
        start = selectionStart - off;
        end = gamepadHovering + off;
      }
    } else {
      if (top) {
        let yoff =
          Math.floor(selectionStart / bl) - Math.floor(gamepadHovering / bl);
        start = selectionStart - yoff * bl;
        end = gamepadHovering + yoff * bl;
      }
    }
    let _selected = [];
    for (let x = 0; x <= (end - start) % bl; x++)
      for (let y = 0; y <= Math.floor((end - start) / bl); y++)
        _selected.push(x + y * bl + start);
    _selected = _selected.filter((s) => {
      let pkm = boxes[selectedSave!]?.[s];
      if (!pkm) return false;
      return pkm.Species != 0;
    });
    setGamepadSelection(_selected);
  }, [selectionStart, gamepadHovering, selectionMode, gamepadSelection]);

  const [beingPressed, setBeingPressed] = useState<boolean[]>([]);

  useEffect(() => {
    if (!useGamepad || !isGamePadConnected) return;
    let animationFrame = 0;
    const loop = () => {
      let gamepads = navigator.getGamepads();
      if (!gamepads) return;
      for (let gamepad of gamepads) {
        if (!gamepad) continue;
        let buttons = [
          ...gamepad.buttons.map((b) => ({
            pressed: b.pressed,
            touched: b.touched,
            value: b.value,
          })),
        ];
        // console.log(buttons);
        let axes = gamepad.axes;
        // console.log(axes);
        if (axes[0] > 0.5) buttons[BUTTONS.RIGHT].pressed = true;
        if (axes[0] < -0.5) buttons[BUTTONS.LEFT].pressed = true;
        if (axes[1] > 0.5) buttons[BUTTONS.DOWN].pressed = true;
        if (axes[1] < -0.5) buttons[BUTTONS.UP].pressed = true;

        let falseButton = {
          pressed: false,
          touched: false,
          value: 0,
        };
        buttons[BUTTONS.RSTICK_RIGHT] = { ...falseButton };
        buttons[BUTTONS.RSTICK_LEFT] = { ...falseButton };
        buttons[BUTTONS.RSTICK_UP] = { ...falseButton };
        buttons[BUTTONS.RSTICK_DOWN] = { ...falseButton };
        if (axes[2] > 0.5) buttons[BUTTONS.RSTICK_RIGHT].pressed = true;
        if (axes[2] < -0.5) buttons[BUTTONS.RSTICK_LEFT].pressed = true;
        if (axes[3] > 0.5) buttons[BUTTONS.RSTICK_DOWN].pressed = true;
        if (axes[3] < -0.5) buttons[BUTTONS.RSTICK_UP].pressed = true;

        let _beingPressed = buttons.map((b, i) => b.pressed);
        setBeingPressed(_beingPressed);
      }
      animationFrame = requestAnimationFrame(loop);
    };
    animationFrame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isGamePadConnected, useGamepad]);

  const [gamepadPressed, setGamepadPressed] = useState<
    Partial<Record<BUTTONS, null | [boolean, NodeJS.Timeout]>>
  >({});

  useEffect(() => {
    if (!useGamepad || !isGamePadConnected) return;
    for (let button = 0 as BUTTONS; button < beingPressed.length; button++) {
      if (beingPressed[button]) {
        if (!gamepadPressed[button]) {
          // console.log("setting", button);
          if (gamepadButtons[button]) gamepadButtons[button]!();
          let g = {
            ...gamepadPressed,
            [button]: [
              true,
              0,
              // setInterval(() => {
              //   if (gamepadButtons[button] && beingPressed[button])
              //     gamepadButtons[button]!();
              //   console.log(button);
              // }, 300),
            ],
          };
          setGamepadPressed(g);
        }
      } else {
        if (gamepadPressed[button]) {
          // console.log("clearing", gamepadPressed[button]);
          (gamepadPressed[button]![0] ? clearInterval : clearTimeout)(
            gamepadPressed[button]![1]
          );
          setGamepadPressed((g) => ({ ...g, [button]: null }));
        }
      }
    }
  }, [
    beingPressed,
    gamepadPressed,
    gamepadButtons,
    isGamePadConnected,
    useGamepad,
  ]);
  useEffect(() => {
    setGamepadSelection([]);
    setSelectionStart(null);
    setGamepadPressed({});
    setBeingPressed([]);
    setGamepadHovering(0);
  }, [isGamePadConnected, useGamepad]);

  return (
    <main className={styles.main}>
      <div className={styles.saveConfiguration}>
        {/* <h1>{URL}</h1> */}
        <div>
          {saves.map((s, i) => (
            <div key={s}>
              {i > 0 && (
                <button
                  onClick={() => {
                    setSaves((s) => {
                      let _s = [...s];
                      let temp = _s[i];
                      _s[i] = _s[i - 1];
                      _s[i - 1] = temp;
                      return _s;
                    });
                  }}
                >
                  ↑
                </button>
              )}
              {i < saves.length - 1 && (
                <button
                  onClick={() => {
                    setSaves((s) => {
                      let _s = [...s];
                      let temp = _s[i];
                      _s[i] = _s[i + 1];
                      _s[i + 1] = temp;
                      return _s;
                    });
                  }}
                >
                  ↓
                </button>
              )}
              {s}{" "}
              {s != "home" && (
                <>
                  <button
                    onClick={() => {
                      let newPath = prompt("Enter new path", s);
                      if (newPath)
                        setSaves((s) =>
                          s.map((v, _i) => (i == _i ? newPath! : v))
                        );
                    }}
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => {
                      setSaves((s) => s.filter((v, _i) => i != _i));
                    }}
                  >
                    REMOVE
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            addSave();
          }}
        >
          ADD SAVE
        </button>
        <button onClick={() => loadBoxes()}>UPDATE BOXES</button>
        <button onClick={() => loadSaves()}>UPDATE SAVES</button>
        <button onClick={() => setUseGamepad((g) => !g)}>
          GAMEPAD {useGamepad ? "ON" : "OFF"}
        </button>
      </div>
      {/* <div>
        <button
          onClick={() => {
            axios.get("/shutdown");
          }}
        >
          SHUTDOWN
        </button>
      </div> */}

      <div className={styles.saveInfoGrid}>
        {saves.map((save) => (
          <div key={save}>
            {save && (
              <SaveInfo
                gamepadSelection={
                  isGamePadConnected && useGamepad ? gamepadSelection : []
                }
                gamepadHovering={
                  isGamePadConnected && useGamepad ? gamepadHovering : -9
                }
                setGamepadHovering={setGamepadHovering}
                setButton={(b, c) => {
                  setButton(b, c);
                }}
                // setTooltip={(text, x, y) => {
                //   setTooltip({ text, pos: { x, y } });
                // }}
                key={save}
                selectionMode={SELECTION_MODES[selectionMode] ?? "select"}
                updateBox={() => loadBox(save)}
                updateSav={() => loadSave(save)}
                swap={async (a: number, b: number) => {
                  await swapPokemon(
                    {
                      path: save,
                      boxPosList: a,
                    },
                    {
                      path: save,
                      boxPosList: b,
                    }
                  );
                  loadBox(save);
                  // loadSave(save);
                }}
                sortBox={async (sorted) => {
                  let _box = [...getBox(save)!];
                  let allMoves = [[], []] as [number[], number[]];
                  if (sorted.length > _box.length) {
                    alert("Can't sort, not enough space in box");
                    return;
                  }
                  for (let i = 0; i < sorted.length; i++) {
                    if (sorted[i]) sorted[i]!["sortedPos"] = i;
                  }
                  for (
                    let newPosition = 0;
                    newPosition < sorted.length;
                    newPosition++
                  ) {
                    let pkm = sorted[newPosition];
                    if (!pkm) continue;
                    let currentPosition = _box.findIndex((p) => {
                      return p.sortedPos == pkm!.sortedPos;
                    });

                    if (currentPosition == -1) {
                      // console.log(newPosition);
                      continue;
                    }
                    if (newPosition == currentPosition) continue;
                    allMoves[0].push(currentPosition);
                    allMoves[1].push(newPosition);
                    let _pkm = {
                      ..._box[newPosition],
                      moving: true,
                    } as Pokemon;
                    let __pkm = {
                      ..._box[currentPosition],
                      moving: true,
                    } as Pokemon;
                    _box[currentPosition] = _pkm;
                    _box[newPosition] = __pkm;
                  }
                  // console.log(allMoves);
                  if (
                    allMoves[0].length == allMoves[1].length &&
                    allMoves[0].length > 0
                  ) {
                    // setBoxes((b) => ({ ...b, [save]: [] }));
                    await swapPokemon(
                      {
                        path: save,
                        boxPosList: allMoves[0],
                      },
                      {
                        path: save,
                        boxPosList: allMoves[1],
                      }
                    );
                  }
                  loadBox(save);
                  // loadSave(save);
                }}
                isSelected={selectedSave == save}
                isGamepadSelected={
                  isGamePadConnected &&
                  useGamepad &&
                  gamepadSelectedSave == save
                }
                transfer={(pos) => {
                  transfer(save, pos);
                }}
                selectSave={() => {
                  setSelectedSave(save);
                }}
                setMoving={() => {
                  // setSelectedSave(save);
                  setMoving(true);
                }}
                isMoving={selectedSave == save && isMoving}
                sav={saveInfo[save]!}
                saveName={save}
                box={getBox(save)!}
                selected={selectedSave == save ? selected ?? [] : []}
                setSelected={(callback) => {
                  setSelectedSave(save);
                  setGamepadSelection([]);
                  setSelectionStart(null);
                  setSelected((s) => [
                    ...callback(selectedSave == save ? s ?? [] : []),
                  ]);
                }}
              />
            )}
          </div>
        ))}
      </div>

      {isMoving && position && (
        <div
          style={{
            position: "fixed",
            top: position ? position?.y - 41 : 0,
            left: position ? position?.x - 41 : 0,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            opacity: 0.5,
            placeContent: "flex-start",
            alignItems: "flex-start",
          }}
          className={styles.box}
        >
          <SelectedDisplay />
        </div>
      )}

      <div className={styles.selectionModeSelector}>
        <button
          onContextMenu={(ev) => {
            ev.preventDefault();
            setSelectionMode(
              (s) => (s - 1 + SELECTION_MODES.length) % SELECTION_MODES.length
            );
          }}
          onClick={(ev) => {
            if (ev.shiftKey)
              setSelectionMode(
                (s) => (s - 1 + SELECTION_MODES.length) % SELECTION_MODES.length
              );
            else setSelectionMode((s) => (s + 1) % SELECTION_MODES.length);
          }}
        >
          {SELECTION_MODES[selectionMode]}
        </button>
      </div>
      {alerts.length > 0 && (
        <div className={styles.alerts}>
          {alerts.map((a, i) => (
            <div className={styles.alert} key={a + i}>
              {a.split("\n").map((l) => (
                <div>{l}</div>
              ))}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
