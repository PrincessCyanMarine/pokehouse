import { Dispatch, SetStateAction } from "react";
import {
  IsTotemForm,
  Pokemon,
  getItemSprite,
  getSprite,
  isPartnerMon,
  isSamePokemon,
} from "../model/Pokemon";
import { SELECTION_MODES } from "../model/SelectionModes";
import { SAV } from "../model/SAV";
import styles from "../page.module.scss";
import { Species } from "../model/Species";
import Image from "next/image";
import { GAMES } from "../model/GAMES";
import SaveInfo from "./SaveInfo";

export default ({
  pkm,
  selected,
  setSelected,
  box,
  moveOverMode,
  setMoveOverMode,
  selectionMode,
  setMoving,
  isMoving,
  transfer,
  isSaveSelected,
  isHoveredByGamepad,
  swap,
  sav,
  saveName,
  party,
  gamepadSelection,
}: {
  gamepadSelection: number[];
  pkm: Pokemon & { pos: number; shown: boolean };
  selected: number[];
  setSelected: (c: (s: number[]) => number[]) => void;
  box: (Pokemon & { pos: number; shown: boolean })[];
  moveOverMode: boolean | undefined;
  setMoveOverMode: Dispatch<SetStateAction<boolean | undefined>>;
  selectionMode: (typeof SELECTION_MODES)[keyof typeof SELECTION_MODES];
  setMoving: () => void;
  isMoving: boolean;
  saveName: string;
  transfer: (pos?: number) => void;
  isSaveSelected: boolean;
  isHoveredByGamepad: boolean;
  swap: (a: number, b: number) => void;
  sav: SAV | null;
  party: boolean;
}) => {
  function GOParty({ pkm }: { pkm: Pokemon }) {
    if (!sav) return <></>;
    if (pkm.Species <= 0) return <></>;
    let index = sav?.PartyData.findIndex((p) => isSamePokemon(p, pkm));
    return (
      index != -1 && (
        <Image
          style={{
            pointerEvents: "none",
            position: "absolute",
            top: 8,
            right: 16,
          }}
          alt="egg"
          width={16}
          height={16}
          src={`https://raw.githubusercontent.com/kwsch/PKHeX/876f4f4737ef8bc7903921ee0bae024cb4679955/PKHeX.Drawing.PokeSprite/Resources/img/Pokemon%20Sprite%20Overlays/party${
            index + 1
          }.png`}
        />
      )
    );
  }

  const getFromBox = (pos: number) => {
    if (pos < 0)
      return { ...(sav?.PartyData[-(pos - 1)] || []), shown: true, pos };
    return box[pos] as Pokemon & { pos: number; shown: boolean };
  };

  return (
    <div
      key={pkm.pos}
      onMouseDown={(ev) => {
        ev.preventDefault();
        let selSpan = () => {
          if (selected.length <= 0) {
            if (pkm.shown && pkm.Species > 0) setSelected(() => [pkm.pos]);
            return;
          }
          let topLeft = selected.reduce(
            (pv, cv) => (cv < pkm.pos ? Math.max(pv, cv) : pv),
            -1
          );
          if (topLeft == -1) return;
          for (let i = topLeft; i <= pkm.pos; i++) {
            if (selected.includes(i)) continue;
            let p = getFromBox(i);
            if (!p.shown || !p || ((p as Pokemon)?.Species || 0) <= 0) continue;
            setSelected((s) => [...s, i]);
          }
        };
        if (ev.button == 1) {
          selSpan();
          return;
        }
        if (selectionMode == "multiple") {
          setMoveOverMode(!selected.includes(pkm.pos));
          if (pkm.shown && pkm.Species > 0)
            if (selected.includes(pkm.pos)) {
              setSelected((s) => s.filter((s) => s != pkm.pos));
            } else {
              setSelected((s) => [...s, pkm.pos]);
            }
          setMoving();
          return;
        }
        if (ev.button != 0 || !pkm.shown) return;
        if (ev.shiftKey) {
          selSpan();
          return;
        }
        if (pkm.Species <= 0) return;
        if (ev.ctrlKey) {
          if (selected.includes(pkm.pos))
            setSelected((s) => s.filter((p) => p != pkm.pos));
          else setSelected((s) => [...s, pkm.pos]);
        } else if (ev.altKey) setMoving();
        else setSelected(() => [pkm.pos]);
        // console.log(ev.altKey);
        // if (selected.length == 0) setSelected(() => [pkm.pos]);
      }}
      onMouseEnter={(ev) => {
        if (
          isMoving &&
          pkm.shown &&
          pkm.Species > 0 &&
          selectionMode == "multiple"
        ) {
          let mode = moveOverMode;
          if (mode == undefined) {
            mode = !selected.includes(pkm.pos);
            setMoveOverMode(mode);
          }
          if (mode) setSelected((s) => [...s, pkm.pos]);
          else setSelected((s) => s.filter((s) => s != pkm.pos));
        }
      }}
      onMouseUp={(ev) => {
        if (ev.button != 0 || selected.includes(pkm.pos)) return;
        switch (selectionMode) {
          case "multiple":
            break;
          case "select":
            if (!ev.shiftKey && pkm.Species == 0) {
              transfer(pkm.pos);
              return;
            }
            if (selected.length == 1 && selected[0] != pkm.pos) {
              if (!ev.shiftKey && (pkm.Species <= 0 || isMoving))
                swap(selected[0], pkm.pos);
              //   if (pkm.shown) setSelected((s) => [pkm.pos]);
            }
            break;
        }
      }}
      onContextMenu={(ev) => {
        // console.log(pkm.HeldItem, getSprite(pkm, sav, true));
        ev.preventDefault();
        ev.stopPropagation();
        if (selectionMode == "multiple") return;
        if (pkm.Species == 0 || !pkm.shown) return;
        // console.log(selected, pkm.pos);
        setSelected((_s) => {
          let s = [..._s];
          // console.log(s.includes(pkm.pos));
          if (!s.includes(pkm.pos)) s = [...s, pkm.pos];
          else s = s.filter((p) => p != pkm.pos);
          // console.log(s);
          return s;
        });
      }}
      title={
        pkm.Species > 0
          ? `Gen: ${pkm.Format} ${pkm.Type}\n${
              pkm.IsNicknamed
                ? `${pkm.Nickname} (${Species[pkm.Species]})`
                : Species[pkm.Species]
            }\nSTAT HP  ATK DEF SPA SPD SPE\nIVS   ${pkm.IV_HP} ${pkm.IV_ATK} ${
              pkm.IV_DEF
            } ${pkm.IV_SPA} ${pkm.IV_SPD} ${pkm.IV_SPE}`
          : undefined
      }
      className={`${styles.pokemon}${
        IsTotemForm(pkm) ? " " + styles.totem : ""
      }${selected.includes(pkm.pos) ? " " + styles.selected : ""}${
        pkm.IsEgg ? " " + styles.egg : ""
      }${pkm.IsShiny ? " " + styles.shiny : ""}${
        pkm.IsAlpha ? " " + styles.alpha : ""
      }${pkm.moving ? " " + styles.moving : ""}${
        pkm.shown ? "" : " " + styles.hidden
      }${isHoveredByGamepad ? " " + styles.gamepadHovering : ""}${
        gamepadSelection.includes(pkm.pos) ? " " + styles.gamepadSelected : ""
      }`}
    >
      {/* {pkm.Species > 0 && (
        <>
          <div
            style={{
              pointerEvents: "none",
              position: "absolute",
              top: 0,
            }}
          >
            {pkm.pos + 1}
          </div>
          <div
            style={{
              pointerEvents: "none",
              position: "absolute",
              bottom: 0,
            }}
          >
            {pkm.Species}
          </div>
        </>
      )} */}
      <Image
        alt={`${pkm.Species}`}
        width={68}
        height={56}
        src={getSprite(pkm, sav)}
        onDragStart={(ev) => {
          ev.preventDefault();
        }}
      />
      {pkm.HeldItem > 0 && (
        <img
          src={getItemSprite(pkm)}
          style={{
            position: "absolute",
            bottom: 16,
            right: 12,
          }}
        />
      )}
      {pkm.IsShiny && (
        <Image
          style={{
            pointerEvents: "none",
            position: "absolute",
            top: 8,
            left: 16,
          }}
          alt="shiny"
          width={20}
          height={20}
          src="https://raw.githubusercontent.com/kwsch/PKHeX/master/PKHeX.Drawing.PokeSprite/Resources/img/Pokemon%20Sprite%20Overlays/rare_icon_alt.png"
        />
      )}
      {pkm.IsEgg && (
        <Image
          style={{
            pointerEvents: "none",
            position: "absolute",
            bottom: 10,
            right: -12,
          }}
          alt="egg"
          width={68}
          height={56}
          src="https://raw.githubusercontent.com/kwsch/PKHeX/master/PKHeX.Drawing.PokeSprite/Resources/img/Big%20Pokemon%20Sprites/b_egg.png"
        />
      )}
      {isPartnerMon(pkm) && (
        <Image
          style={{
            pointerEvents: "none",
            position: "absolute",
            bottom: 8,
            left: 16,
          }}
          alt="egg"
          width={16}
          height={16}
          src="https://raw.githubusercontent.com/kwsch/PKHeX/876f4f4737ef8bc7903921ee0bae024cb4679955/PKHeX.Drawing.PokeSprite/Resources/img/Pokemon%20Sprite%20Overlays/starter.png"
        />
      )}
      {(sav?.Game == GAMES.GE || sav?.Game == GAMES.GP) && (
        <GOParty pkm={pkm} />
      )}
      {pkm?.IsAlpha && (
        <Image
          style={{
            pointerEvents: "none",
            position: "absolute",
            top: 8,
            right: 16,
          }}
          width={20}
          height={20}
          alt="ALPHA"
          src="https://raw.githubusercontent.com/kwsch/PKHeX/master/PKHeX.Drawing.PokeSprite/Resources/img/Pokemon%20Sprite%20Overlays/alpha_alt.png"
        />
      )}
      {/* {saveName == "home" && <div>HOME</div>} */}
      {pkm.sortedPos != undefined && (
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            bottom: 0,
          }}
        >
          {pkm.sortedPos}
        </div>
      )}
    </div>
  );
};
