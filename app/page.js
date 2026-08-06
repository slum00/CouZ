'use client';

import { useEffect, useMemo, useState } from 'react';

const MAP = [
  'WWWWWWWWWWWWWWW',
  'W....F....M...W',
  'W.C..F....M...W',
  'W....F........W',
  'W....FFFFF....W',
  'W........F....W',
  'W..M.....F....W',
  'W..M..........W',
  'W......FF.....W',
  'W...........D.W',
  'WWWWWWWWWWWWWWW',
];

const START = { x: 2, y: 2 };
const MAX_LEVEL = 8;

const MONSTERS = [
  { name: 'ぷるるん', hp: 6, attack: 2, exp: 2, gold: 3, icon: '●' },
  { name: 'もりのこぞう', hp: 10, attack: 3, exp: 4, gold: 5, icon: '♠' },
  { name: 'つのウサギ', hp: 14, attack: 4, exp: 6, gold: 8, icon: '♞' },
  { name: 'よるのきし', hp: 20, attack: 6, exp: 10, gold: 14, icon: '♜' },
];

const tileClass = {
  W: 'water',
  '.': 'grass',
  F: 'forest',
  M: 'mountain',
  C: 'castle',
  D: 'dungeon',
};

const tileIcon = {
  W: '≈',
  '.': '·',
  F: '♣',
  M: '▲',
  C: '♜',
  D: '◆',
};

const levelRequirement = (level) => level * level * 5;

function randomMonster(level, terrain) {
  let maxIndex = Math.min(MONSTERS.length - 1, Math.floor((level + 1) / 2));
  if (terrain === 'F') maxIndex = Math.min(MONSTERS.length - 1, maxIndex + 1);
  const base = MONSTERS[Math.floor(Math.random() * (maxIndex + 1))];
  const scale = 1 + Math.max(0, level - 1) * 0.12;
  return {
    ...base,
    maxHp: Math.round(base.hp * scale),
    hp: Math.round(base.hp * scale),
    attack: Math.round(base.attack * scale),
  };
}

export default function HomePage() {
  const [hero, setHero] = useState({
    x: START.x,
    y: START.y,
    level: 1,
    hp: 18,
    maxHp: 18,
    mp: 4,
    maxMp: 4,
    attack: 5,
    exp: 0,
    gold: 0,
    herbs: 1,
  });
  const [enemy, setEnemy] = useState(null);
  const [mode, setMode] = useState('field');
  const [message, setMessage] = useState('おうさま「ひがしの どうくつへ むかうのだ！」');
  const [history, setHistory] = useState(['ぼうけんが はじまった。']);
  const [gameClear, setGameClear] = useState(false);

  const currentTile = MAP[hero.y][hero.x];
  const hpRate = Math.max(0, (hero.hp / hero.maxHp) * 100);

  const visibleMap = useMemo(() => {
    const radiusX = 4;
    const radiusY = 3;
    const rows = [];
    for (let y = hero.y - radiusY; y <= hero.y + radiusY; y += 1) {
      const cells = [];
      for (let x = hero.x - radiusX; x <= hero.x + radiusX; x += 1) {
        const tile = MAP[y]?.[x] ?? 'W';
        cells.push({ x, y, tile });
      }
      rows.push(cells);
    }
    return rows;
  }, [hero.x, hero.y]);

  const log = (text) => {
    setMessage(text);
    setHistory((items) => [text, ...items].slice(0, 4));
  };

  const saveGame = () => {
    localStorage.setItem('retro-rpg-save', JSON.stringify({ hero, gameClear }));
    log('ぼうけんのしょに きろくした。');
  };

  const loadGame = () => {
    const saved = localStorage.getItem('retro-rpg-save');
    if (!saved) {
      log('ぼうけんのしょは まだない。');
      return;
    }
    const data = JSON.parse(saved);
    setHero(data.hero);
    setGameClear(Boolean(data.gameClear));
    setEnemy(null);
    setMode('field');
    log('ぼうけんを さいかいした。');
  };

  const resetGame = () => {
    localStorage.removeItem('retro-rpg-save');
    setHero({
      x: START.x,
      y: START.y,
      level: 1,
      hp: 18,
      maxHp: 18,
      mp: 4,
      maxMp: 4,
      attack: 5,
      exp: 0,
      gold: 0,
      herbs: 1,
    });
    setEnemy(null);
    setMode('field');
    setGameClear(false);
    setHistory(['ぼうけんが はじまった。']);
    setMessage('おうさま「ひがしの どうくつへ むかうのだ！」');
  };

  const checkLevelUp = (nextHero) => {
    let updated = { ...nextHero };
    while (updated.level < MAX_LEVEL && updated.exp >= levelRequirement(updated.level)) {
      updated = {
        ...updated,
        level: updated.level + 1,
        maxHp: updated.maxHp + 6,
        hp: updated.maxHp + 6,
        maxMp: updated.maxMp + 2,
        mp: updated.maxMp + 2,
        attack: updated.attack + 2,
      };
      log(`レベルが ${updated.level}に あがった！`);
    }
    return updated;
  };

  const startBattle = (terrain) => {
    const nextEnemy = randomMonster(hero.level, terrain);
    setEnemy(nextEnemy);
    setMode('battle');
    log(`${nextEnemy.name}が あらわれた！`);
  };

  const move = (dx, dy) => {
    if (mode !== 'field' || gameClear) return;
    const nextX = hero.x + dx;
    const nextY = hero.y + dy;
    const tile = MAP[nextY]?.[nextX] ?? 'W';
    if (tile === 'W' || tile === 'M') {
      log('そちらへは すすめない。');
      return;
    }

    setHero((value) => ({ ...value, x: nextX, y: nextY }));

    if (tile === 'C') {
      setHero((value) => ({ ...value, hp: value.maxHp, mp: value.maxMp }));
      log('しろで やすみ、HPとMPが かいふくした。');
      return;
    }

    if (tile === 'D') {
      if (hero.level >= 4) {
        setGameClear(true);
        log('やみのまものを たおした！ せかいに へいわが もどった！');
      } else {
        log('どうくつから つよいけはいがする。レベル4で いどもう。');
      }
      return;
    }

    const encounterRate = tile === 'F' ? 0.34 : 0.2;
    if (Math.random() < encounterRate) startBattle(tile);
    else log(tile === 'F' ? 'くらい もりを すすんでいる。' : 'そうげんを すすんでいる。');
  };

  const enemyTurn = (currentEnemy, nextHero) => {
    const damage = Math.max(1, currentEnemy.attack + Math.floor(Math.random() * 3) - 1);
    const hp = Math.max(0, nextHero.hp - damage);
    if (hp <= 0) {
      setEnemy(null);
      setMode('field');
      setHero((value) => ({
        ...value,
        x: START.x,
        y: START.y,
        hp: value.maxHp,
        mp: value.maxMp,
        gold: Math.floor(value.gold / 2),
      }));
      log(`${damage}のダメージ！ たおれたが、しろで めをさました。`);
      return;
    }
    setHero((value) => ({ ...value, hp }));
    log(`${currentEnemy.name}のこうげき！ ${damage}のダメージ。`);
  };

  const winBattle = (defeatedEnemy, nextHero) => {
    const gained = checkLevelUp({
      ...nextHero,
      exp: nextHero.exp + defeatedEnemy.exp,
      gold: nextHero.gold + defeatedEnemy.gold,
    });
    setHero(gained);
    setEnemy(null);
    setMode('field');
    log(`${defeatedEnemy.name}を たおした！ ${defeatedEnemy.exp}EXP ${defeatedEnemy.gold}G。`);
  };

  const attack = () => {
    if (!enemy) return;
    const damage = Math.max(1, hero.attack + Math.floor(Math.random() * 5) - 2);
    const nextEnemy = { ...enemy, hp: Math.max(0, enemy.hp - damage) };
    if (nextEnemy.hp <= 0) {
      winBattle(enemy, hero);
      return;
    }
    setEnemy(nextEnemy);
    log(`${damage}のダメージを あたえた！`);
    window.setTimeout(() => enemyTurn(nextEnemy, hero), 350);
  };

  const magic = () => {
    if (!enemy) return;
    if (hero.mp < 2) {
      log('MPが たりない。');
      return;
    }
    const nextHero = { ...hero, mp: hero.mp - 2 };
    setHero(nextHero);
    const damage = hero.attack + 5 + Math.floor(Math.random() * 5);
    const nextEnemy = { ...enemy, hp: Math.max(0, enemy.hp - damage) };
    if (nextEnemy.hp <= 0) {
      winBattle(enemy, nextHero);
      return;
    }
    setEnemy(nextEnemy);
    log(`ひのたまが ${damage}のダメージ！`);
    window.setTimeout(() => enemyTurn(nextEnemy, nextHero), 350);
  };

  const useHerb = () => {
    if (hero.herbs <= 0) {
      log('やくそうを もっていない。');
      return;
    }
    const healed = Math.min(hero.maxHp, hero.hp + 12);
    const nextHero = { ...hero, hp: healed, herbs: hero.herbs - 1 };
    setHero(nextHero);
    log('やくそうで HPが かいふくした。');
    if (enemy) window.setTimeout(() => enemyTurn(enemy, nextHero), 350);
  };

  const runAway = () => {
    if (!enemy) return;
    if (Math.random() < 0.65) {
      setEnemy(null);
      setMode('field');
      log('うまく にげきれた。');
    } else {
      log('しかし まわりこまれた！');
      window.setTimeout(() => enemyTurn(enemy, hero), 350);
    }
  };

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'ArrowUp') move(0, -1);
      if (event.key === 'ArrowDown') move(0, 1);
      if (event.key === 'ArrowLeft') move(-1, 0);
      if (event.key === 'ArrowRight') move(1, 0);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  return (
    <main className="gameShell">
      <section className="gameFrame" aria-label="レトロRPG">
        <header className="titleBar">
          <div>
            <p className="eyebrow">8-BIT QUEST</p>
            <h1>ちいさな勇者と くらやみの洞窟</h1>
          </div>
          <button className="tinyButton" type="button" onClick={resetGame}>はじめから</button>
        </header>

        <div className="statusGrid">
          <div>LV <strong>{hero.level}</strong></div>
          <div>HP <strong>{hero.hp}/{hero.maxHp}</strong></div>
          <div>MP <strong>{hero.mp}/{hero.maxMp}</strong></div>
          <div>G <strong>{hero.gold}</strong></div>
          <div>EXP <strong>{hero.exp}</strong></div>
          <div>薬草 <strong>{hero.herbs}</strong></div>
        </div>

        <div className="hpTrack" aria-label="HPゲージ">
          <span style={{ width: `${hpRate}%` }} />
        </div>

        <section className="screen">
          {mode === 'field' ? (
            <div className="map" aria-label="フィールドマップ">
              {visibleMap.flat().map((cell) => {
                const isHero = cell.x === hero.x && cell.y === hero.y;
                return (
                  <div className={`tile ${tileClass[cell.tile]}`} key={`${cell.x}-${cell.y}`}>
                    <span>{isHero ? '勇' : tileIcon[cell.tile]}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="battleScene">
              <div className="moon">☾</div>
              <div className="enemyIcon">{enemy?.icon}</div>
              <div className="enemyName">{enemy?.name}</div>
              <div className="enemyHp">HP {enemy?.hp}/{enemy?.maxHp}</div>
            </div>
          )}
          {gameClear && (
            <div className="clearPanel">
              <strong>QUEST CLEAR!</strong>
              <span>勇者のものがたりは<br />まだ はじまったばかりだ。</span>
            </div>
          )}
        </section>

        <section className="messageBox" aria-live="polite">
          <p>{message}</p>
          <div className="history">
            {history.slice(1).map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}
          </div>
        </section>

        {mode === 'field' ? (
          <section className="fieldControls">
            <div className="dpad" aria-label="移動ボタン">
              <button type="button" className="up" onClick={() => move(0, -1)}>▲</button>
              <button type="button" className="left" onClick={() => move(-1, 0)}>◀</button>
              <button type="button" className="center" disabled>+</button>
              <button type="button" className="right" onClick={() => move(1, 0)}>▶</button>
              <button type="button" className="down" onClick={() => move(0, 1)}>▼</button>
            </div>
            <div className="utilityButtons">
              <button type="button" onClick={useHerb}>やくそう</button>
              <button type="button" onClick={saveGame}>きろく</button>
              <button type="button" onClick={loadGame}>つづき</button>
            </div>
          </section>
        ) : (
          <section className="battleCommands">
            <button type="button" onClick={attack}>たたかう</button>
            <button type="button" onClick={magic}>じゅもん</button>
            <button type="button" onClick={useHerb}>やくそう</button>
            <button type="button" onClick={runAway}>にげる</button>
          </section>
        )}

        <footer className="helpText">
          <span>草原・森で敵が出現</span>
          <span>城で全回復</span>
          <span>LV4で東南の洞窟へ</span>
        </footer>
      </section>
    </main>
  );
}
