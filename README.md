# Dashavatara — Chapter 1: Matsya (The Great Flood)

Chapter 1 of *Dashavatara: The Ten Avatars*, a 2D action-adventure mobile game.
You play **Matsya**, Vishnu's fish avatar, swimming through the great flood to
rescue the sages, seeds and creatures, recover the stolen **Vedas**, and defeat
the horse-headed demon **Hayagriva**.

Built with **Phaser 3 + Vite**, wrapped for Android with **Capacitor**.

## The campaign hook
Each avatar teaches **one ability** that carries into later chapters. Matsya
grants **🐟 Swimming** (free movement + a Surge dash). The shared systems
(`SaveManager`, `AbilitySystem`) already model Chapters 2–10, so the next
chapters slot in without rewrites.

## Gameplay
- **Move:** left-side virtual joystick (or WASD / arrow keys)
- **SURGE (dash):** gold button (or SPACE) — burst through danger; also stuns the boss
- **TAIL WHIP (attack):** red button (or J) — strike enemies / the stunned boss
- **Objectives:** rescue 5 sages, save 6 seeds, gather 4 animals, recover 5 Vedas
- **Three segments:** Rising Waters (tutorial) → The Deep Flood (currents,
  whirlpools, air meter, enemies) → Guard Manu's Boat (escort) → **Boss: Hayagriva**

## Run it (web / dev)
```bash
npm install
npm run dev
```
Then open the printed URL (default http://localhost:5173).
> If `npm run dev` fails to find vite (a known Windows node_modules quirk on this
> machine), run: `node node_modules/vite/bin/vite.js --host`

Production build:
```bash
npm run build      # outputs to dist/
```

## Art
The game ships with **procedural placeholder art** (drawn in code — no image
files) and **synthesized audio** (Web Audio — no sound files). To swap in real
art, see [`Assets/ASSET_PROMPTS.txt`](Assets/ASSET_PROMPTS.txt): generate the
images, drop them in `public/images/`, load them under the same keys in
`src/scenes/PreloadScene.js`, and remove the matching block in
`src/systems/Textures.js`.

## Android (Capacitor)
Targets **Android 16 / API 36** (Google Play requirement). Uses **Capacitor 6**
(Java 17 toolchain).

Toolchain on this machine (see project memory):
- JDK 17: `C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot`
- Android SDK: `C:\Android\sdk`

Build the debug APK:
```bash
npm run build
npx cap sync android
cd android
./gradlew.bat assembleDebug
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

> A Play Store release additionally needs a keystore + `assembleRelease` /
> `bundleRelease`, and a unique higher `versionCode` for every upload.

## Project structure
```
src/
  main.js            Phaser game config + scene list
  config.js          resolution, colors, tuning, objective targets
  scenes/            Boot, Preload, MainMenu, Story, Level1, Boss, Ending, UI
  entities/          Matsya (player fish)
  systems/           SaveManager, AbilitySystem, AudioManager, Controls,
                     Textures (procedural art), Background
Assets/
  ASSET_PROMPTS.txt  art briefs + how to wire real art in
```
